/**
 * 万能任务APP - 自动更新系统 v2.0
 * 功能：版本检测、更新提示、浏览器下载安装
 * 
 * 下载策略：
 * - 通过 AndroidNative.openBrowserDownload() 原生接口调起系统浏览器
 * - 多镜像源自动切换 + 手动切换
 */

const AppUpdater = (function() {
    'use strict';

    // ========== 配置 ==========
    const CONFIG = {
        // 当前APP版本（发布新版本时必须同步修改此值）
        CURRENT_VERSION: '4.8',
        // 版本检查接口 - GitHub Release API
        CHECK_URL: 'https://api.github.com/repos/xiongqing1990/wanneng-renwu/releases/latest',
        // APK下载地址模板（多镜像源，按优先级排序）
        DOWNLOAD_URLS: [
            // 镜像源1: ghfast（国内稳定）
            'https://mirror.ghproxy.com/https://github.com/xiongqing1990/wanneng-renwu/releases/download/{tag}/wanneng-task-v{version}-signed.apk',
            // 镜像源2: gh-proxy
            'https://gh-proxy.com/https://github.com/xiongqing1990/wanneng-renwu/releases/download/{tag}/wanneng-task-v{version}-signed.apk',
            // 镜像源3: gh-proxy.net
            'https://gh-proxy.net/https://github.com/xiongqing1990/wanneng-renwu/releases/download/{tag}/wanneng-task-v{version}-signed.apk',
            // 直连GitHub（最后兜底）
            'https://github.com/xiongqing1990/wanneng-renwu/releases/download/{tag}/wanneng-task-v{version}-signed.apk'
        ],
        // 检查间隔（毫秒）- 避免频繁请求
        CHECK_INTERVAL: 30 * 60 * 1000, // 30分钟
        // 重试次数
        MAX_RETRIES: 3,
        // 是否为强制更新（最低可运行版本）
        MIN_VERSION: '4.0'
    };

    // ========== 状态 ==========
    let state = {
        isChecking: false,
        isDownloading: false,
        downloadProgress: 0,
        latestInfo: null,
        abortController: null,
        lastCheckTime: 0,
        retryCount: 0,
        userNotified: false
    };

    // 当前使用的镜像源索引
    let currentMirrorIndex = 0;

    // ========== 主题色（简洁白+蓝色系） ==========
    const THEME = {
        primary: '#1677FF',       // 主色：科技蓝
        primaryLight: '#E8F4FF',  // 主色浅背景
        primaryDark: '#0958D9',   // 主色深色
        gradient: 'linear-gradient(135deg, #1677FF, #4096FF)',
        success: '#52C41A',       // 成功绿
        danger: '#FF4D4F',        // 错误红
        text: '#1d1d1f',          // 主文字
        textSecondary: '#666',    // 次文字
        textMuted: '#999',        // 弱文字
        bg: '#fff',               // 背景
        bgGray: '#f5f7fa',        // 灰背景
        border: '#e8e8e8'         // 边框
    };

    // ========== DOM：更新弹窗 ==========
    function createUpdateModal() {
        if (document.getElementById('app-update-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'app-update-modal';
        modal.innerHTML = `
            <style>
                #app-update-overlay{
                    position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:99999;
                    display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);
                    animation:fadeIn .25s ease-out;
                }
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
                @keyframes progressStripe{0%{background-position:1rem 0}100%{background-position:2.5rem 0}}
                #app-update-box{
                    width:310px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.15);
                    animation:slideUp .35s ease-out;
                }
                #app-update-header{
                    background:${THEME.gradient};padding:22px 20px;text-align:center;color:#fff;
                    position:relative;
                }
                #app-update-header .update-icon{font-size:44px;margin-bottom:6px;display:block}
                #app-update-header .update-title{font-size:17px;font-weight:600}
                #app-update-header .update-subtitle{font-size:12px;opacity:.85;margin-top:4px}
                #app-update-body{padding:18px 20px}
                #app-update-version-row{display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:14px}
                #app-update-old-ver{padding:4px 12px;border-radius:8px;background:#f5f7fa;font-size:13px;color:${THEME.textSecondary};border:1px solid ${THEME.border}}
                #app-update-arrow{color:${THEME.primary};font-size:18px;font-weight:bold}
                #app-update-new-ver{padding:4px 14px;border-radius:8px;background:${THEME.gradient};font-size:14px;color:#fff;font-weight:600}
                #app-update-changelog{max-height:150px;overflow-y:auto;padding:12px;border-radius:10px;background:#fafbfc;font-size:13px;line-height:1.7;color:${THEME.text};-webkit-overflow-scrolling:touch;border:1px solid #f0f0f0}
                #app-update-changelog::-webkit-scrollbar{width:3px}
                #app-update-changelog::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
                
                /* 进度条区域 */
                #app-download-progress{display:none;padding:0 20px 16px}
                #progress-info{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
                #progress-text{font-size:13px;color:${THEME.textSecondary}}
                #progress-percent{font-size:14px;font-weight:bold;color:${THEME.primary}}
                #progress-bar-bg{height:8px;background:#e9ecef;border-radius:4px;overflow:hidden}
                #progress-bar-fill{height:100%;background:${THEME.gradient};border-radius:4px;
                    transition:width .3s ease;background-size:200% 100%;animation:progressStripe 1.5s linear infinite;
                    background-image:linear-gradient(45deg,rgba(255,255,255,.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.2) 50%,
                    rgba(255,255,255,.2) 75%,transparent 75%,transparent);background-size:1.5rem 1.5rem;
                }
                
                /* 按钮 */
                #app-update-footer{display:flex;gap:10px;padding:0 20px 18px}
                .btn-update{flex:1;padding:11px;border-radius:10px;font-size:14px;font-weight:600;border:none;cursor:pointer;text-align:center;transition:all .2s}
                .btn-update-primary{background:${THEME.gradient};color:#fff;box-shadow:0 4px 12px rgba(22,119,255,.3)}
                .btn-update-primary:active{transform:scale(.96);opacity:.9}
                .btn-update-secondary{background:#f5f7fa;color:${THEME.textSecondary};border:1px solid ${THEME.border}}
                .btn-update-secondary:active{background:#eee}
                .btn-update-disabled{background:#f0f0f0;color:#bbb;cursor:not-allowed}

                /* 状态提示 */
                #app-update-status{text-align:center;padding:6px 20px 14px;font-size:12px;color:${THEME.textMuted};display:none;line-height:1.5}
                
                /* 镜像源选择器 */
                #mirror-selector{display:none;padding:0 20px 16px}
                .mirror-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;margin-bottom:6px;
                    background:#fafbfc;border:1px solid ${THEME.border};cursor:pointer;transition:all .2s;font-size:13px;color:${THEME.text}}
                .mirror-item:active{background:${THEME.primaryLight};border-color:${THEME.primary}}
                .mirror-item .mirror-num{width:24px;height:24px;border-radius:50%;background:${THEME.primaryLight};color:${THEME.primary};
                    display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;flex-shrink:0}
                .mirror-current{background:${THEME.primaryLight};border-color:${THEME.primary}}
                .mirror-current .mirror-num{background:${THEME.primary};color:#fff}
            </style>
            <div id="app-update-overlay">
                <div id="app-update-box">
                    <div id="app-update-header">
                        <span class="update-icon">🚀</span>
                        <div class="update-title">发现新版本</div>
                        <div class="update-subtitle" id="update-subtitle">有可用更新</div>
                    </div>
                    <div id="app-update-body">
                        <div id="app-update-version-row">
                            <span id="app-update-old-ver">v${CONFIG.CURRENT_VERSION}</span>
                            <span id="app-update-arrow">→</span>
                            <span id="app-update-new-ver"></span>
                        </div>
                        <div id="app-update-changelog" id="changelog-content"></div>
                    </div>
                    <div id="app-download-progress">
                        <div id="progress-info">
                            <span id="progress-text">正在准备...</span>
                            <span id="progress-percent">0%</span>
                        </div>
                        <div id="progress-bar-bg"><div id="progress-bar-fill" style="width:0%"></div></div>
                    </div>
                    <div id="app-update-status"></div>
                    <div id="mirror-selector"></div>
                    <div id="app-update-footer">
                        <button class="btn-update btn-update-secondary" id="btn-update-later" onclick="AppUpdater.dismiss()">稍后再说</button>
                        <button class="btn-update btn-update-primary" id="btn-update-now" onclick="AppUpdater.downloadAndInstall()">立即更新</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 点击遮罩关闭（非强制更新时）
        modal.querySelector('#app-update-overlay').addEventListener('click', function(e) {
            if (e.target === this && !state.isForceUpdate) AppUpdater.dismiss();
        });
    }

    function showModal(info, force) {
        createUpdateModal();
        state.isForceUpdate = force;

        document.getElementById('app-update-new-ver').textContent = 'v' + info.version;
        
        // 解析更新内容（从body中提取）
        const changelogEl = document.getElementById('app-update-changelog');
        let changelog = info.changelog || info.body || ('v' + info.version + ' 更新内容');
        changelog = changelog.replace(/### /g, '<strong>').replace(/\n- /g, '</strong><br>🔹 ').replace(/\n/g, '<br>');
        if (!changelog.includes('<strong')) changelog = '🔹 ' + changelog;
        changelogEl.innerHTML = changelog;

        if (force) {
            document.getElementById('btn-update-later').style.display = 'none';
            document.getElementById('btn-update-now').style.flex = '1';
            document.getElementById('update-subtitle').textContent = '需要更新才能继续使用';
        }
    }

    function hideModal() {
        const modal = document.getElementById('app-update-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 250);
        }
        state.userNotified = false;
    }

    function showProgress(show) {
        const progressArea = document.getElementById('app-download-progress');
        const footer = document.getElementById('app-update-footer');
        const status = document.getElementById('app-update-status');
        const mirrorSelector = document.getElementById('mirror-selector');
        if (show) {
            progressArea.style.display = 'block';
            status.style.display = 'block';
            footer.style.display = 'none';
            if (mirrorSelector) mirrorSelector.style.display = 'none';
        } else {
            progressArea.style.display = 'none';
            status.style.display = 'none';
            footer.style.display = 'flex';
            if (mirrorSelector) mirrorSelector.style.display = 'none';
        }
    }

    function updateProgress(percent, text) {
        const fill = document.getElementById('progress-bar-fill');
        if (fill) fill.style.width = percent + '%';
        const pct = document.getElementById('progress-percent');
        if (pct) pct.textContent = percent + '%';
        if (text) {
            const pt = document.getElementById('progress-text');
            if (pt) pt.textContent = text;
        }
    }

    function updateStatus(text, isError) {
        const el = document.getElementById('app-update-status');
        if (!el) return;
        el.style.display = 'block';
        el.textContent = text;
        el.style.color = isError ? THEME.danger : THEME.textMuted;
    }

    /**
     * 显示镜像源选择列表（让用户手动选源）
     */
    function showMirrorSelector(info) {
        const selector = document.getElementById('mirror-selector');
        const footer = document.getElementById('app-update-footer');
        const progress = document.getElementById('app-download-progress');
        
        if (progress) progress.style.display = 'none';
        if (footer) footer.style.display = 'none';
        
        if (selector) {
            selector.style.display = 'block';
            const mirrorNames = ['ghproxy镜像', 'gh-proxy', 'gh-proxy.net', 'GitHub直连'];
            let html = '';
            for (let i = 0; i < CONFIG.DOWNLOAD_URLS.length; i++) {
                const isCurrent = i === currentMirrorIndex;
                html += `<div class="mirror-item${isCurrent ? ' mirror-current' : ''}" onclick="AppUpdater.selectMirror(${i})">
                    <span class="mirror-num">${i + 1}</span>
                    <div><strong>${mirrorNames[i]}</strong>${isCurrent ? ' ← 当前' : ''}</div></div>`;
            }
            selector.innerHTML = html;
        }
        
        updateStatus('请选择一个下载源尝试：', false);
        showProgress(false);
        state.isDownloading = false;
    }

    function restoreFooter(extraButtons) {
        const footer = document.getElementById('app-update-footer');
        if (footer) {
            footer.style.display = 'flex';
            if (extraButtons) {
                footer.innerHTML = extraButtons;
            } else {
                footer.innerHTML = `
                    <button class="btn-update btn-update-secondary" onclick="AppUpdater.dismiss()">稍后再说</button>
                    <button class="btn-update btn-update-primary" onclick="AppUpdater.downloadAndInstall()">重新下载</button>
                `;
            }
        }
    }

    // ========== 版本比较 ==========
    function compareVersions(v1, v2) {
        const parts1 = v1.replace('v', '').split('.').map(Number);
        const parts2 = v2.replace('v', '').split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    }

    // ========== 版本检查 ==========
    async function checkForUpdate(forceShow) {
        if (state.isChecking) return null;
        if (!forceShow && Date.now() - state.lastCheckTime < CONFIG.CHECK_INTERVAL) {
            return state.latestInfo;
        }

        state.isChecking = true;

        try {
            const resp = await fetch(CONFIG.CHECK_URL, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(15000)
            });

            if (!resp.ok) throw new Error('HTTP ' + resp.status);

            const data = await resp.json();
            const latestVersion = data.tag_name.replace('v', '');

            const info = {
                version: latestVersion,
                tagName: data.tag_name,
                changelog: data.body || '',
                publishedAt: data.published_at,
                downloadUrl: data.assets && data.assets.length > 0 
                    ? (data.assets[0].browser_download_url || '') : '',
                releaseUrl: data.html_url || ''
            };

            state.latestInfo = info;
            state.lastCheckTime = Date.now();

            console.log('[AppUpdater] 最新版本: v' + latestVersion + ', 当前: v' + CONFIG.CURRENT_VERSION);

            if (compareVersions(latestVersion, CONFIG.CURRENT_VERSION) > 0) {
                const isForce = compareVersions(latestVersion, CONFIG.MIN_VERSION) > 0 && compareVersions(CONFIG.CURRENT_VERSION, CONFIG.MIN_VERSION) < 0;
                
                if (forceShow || !state.userNotified) {
                    showModal(info, isForce);
                    state.userNotified = true;
                }
                
                return info;
            }

            console.log('[AppUpdater] 已是最新版本');
            return null;

        } catch (err) {
            console.warn('[AppUpdater] 检查更新失败:', err.message);
            return null;
        } finally {
            state.isChecking = false;
        }
    }

    // ========== 下载与安装（核心修复） ==========

    async function downloadAndInstall() {
        if (state.isDownloading || !state.latestInfo) return;

        const info = state.latestInfo;
        state.isDownloading = true;
        state.retryCount = 0;
        currentMirrorIndex = 0;

        showProgress(true);
        updateProgress(5, '正在准备下载...');

        doNativeDownload(info);
    }

    /**
     * 通过原生Android接口打开浏览器下载
     * 这是核心修复点：不再用window.open（WebView内无效），改用原生Intent
     */
    function doNativeDownload(info) {
        const urlTemplate = CONFIG.DOWNLOAD_URLS[currentMirrorIndex];
        const downloadUrl = urlTemplate
            .replace('{tag}', info.tagName)
            .replace('{version}', info.version);

        const mirrorNames = ['ghproxy镜像', 'gh-proxy', 'gh-proxy.net', 'GitHub直连'];
        const mirrorName = mirrorNames[currentMirrorIndex] || '下载源';

        updateProgress(10, `正在启动${mirrorName}...`);
        updateStatus(`正在调起系统浏览器下载...`, false);

        console.log('[AppUpdater] 下载URL: ' + downloadUrl);

        // 延迟一下让用户看到状态
        setTimeout(function() {
            try {
                // 方式1: Android原生接口（最可靠）
                if (window.AndroidNative && typeof window.AndroidNative.openBrowserDownload === 'function') {
                    console.log('[AppUpdater] 使用 AndroidNative 接口调起浏览器');
                    
                    updateProgress(30, `已调起浏览器下载...`);
                    updateStatus(`浏览器已打开，请在浏览器中完成下载`, false);
                    
                    window.AndroidNative.openBrowserDownload(downloadUrl);

                    // 显示成功提示和后续操作按钮
                    setTimeout(function() {
                        updateStatus(`✅ 浏览器已打开\n下载完成后点击APK文件即可安装\n如果下载失败可换其他源试试`, false);
                        updateProgress(80, '等待浏览器下载...');
                        
                        showProgress(false);
                        restoreFooter(`
                            <button class="btn-update btn-update-secondary" onclick="AppUpdater.dismiss()">稍后再说</button>
                            <button class="btn-update btn-update-primary" onclick="AppUpdater.tryNextMirror()">换个下载源</button>
                            <button class="btn-update btn-update-secondary" style="border-color:${THEME.primary};color:${THEME.primary}" onclick="AppUpdater.showAllMirrors()">所有源列表</button>
                        `);
                        state.isDownloading = false;
                    }, 2000);
                    return;
                }

                // 方式2: Capacitor Browser插件
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
                    console.log('[AppUpdater] 使用 Capacitor Browser 插件');
                    window.Capacitor.Plugins.Browser.open({ url: downloadUrl });
                    handleDownloadSuccess();
                    return;
                }

                // 方式3: 尝试通过自定义 scheme 打开
                if (window.webkit && window.webkit.messageHandlers) {
                    console.log('[AppUpdater] 使用 webkit messageHandlers');
                    window.webkit.messageHandlers.openBrowser.postMessage({ url: downloadUrl });
                    handleDownloadSuccess();
                    return;
                }

                // 方式4: 创建隐藏的 a 标签（最终回退）
                console.log('[AppUpdater] 回退到 a 标签下载方式');
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => a.remove(), 100);
                
                handleDownloadSuccess();

            } catch(err) {
                console.warn('[AppUpdater] 所有下载方式均失败:', err.message);
                updateStatus('❌ 调起浏览器失败：' + err.message, true);
                setTimeout(() => showMirrorSelector(info), 1500);
            }
        }, 600);
    }

    function handleDownloadSuccess() {
        updateProgress(60, '已打开下载链接...');
        updateStatus('已打开下载页面，请在浏览器中完成下载并安装', false);
        setTimeout(function() {
            showProgress(false);
            restoreFooter(`
                <button class="btn-update btn-update-secondary" onclick="AppUpdater.dismiss()">稍后再说</button>
                <button class="btn-update btn-update-primary" onclick="AppUpdater.tryNextMirror()">换个下载源</button>
                <button class="btn-update btn-update-secondary" style="border-color:${THEME.primary};color:${THEME.primary}" onclick="AppUpdater.showAllMirrors()">所有源列表</button>
            `);
            state.isDownloading = false;
        }, 2000);
    }

    function tryNextMirror() {
        if (!state.latestInfo) return;
        
        currentMirrorIndex++;
        const info = state.latestInfo;

        if (currentMirrorIndex < CONFIG.DOWNLOAD_URLS.length) {
            state.retryCount = 0;
            state.isDownloading = true;
            showProgress(true);
            updateProgress(5, `切换到第${currentMirrorIndex + 1}个下载源...`);
            updateStatus(`正在切换到下一个下载源...`, false);
            setTimeout(() => doNativeDownload(info), 800);
        } else {
            // 所有镜像都试过了，显示完整列表让用户手动选择
            currentMirrorIndex = 0; // 重置
            showMirrorSelector(info);
        }
    }

    function selectMirror(index) {
        currentMirrorIndex = index;
        const info = state.latestInfo;
        if (!info) return;
        
        state.isDownloading = true;
        showProgress(true);
        updateProgress(5, `使用第${index + 1}个源...`);
        setTimeout(() => doNativeDownload(info), 500);
    }

    // ========== 公开API ==========
    return {
        /** 手动触发检查更新（显示弹窗） */
        checkNow: function() { return checkForUpdate(true); },

        /** 静默检查（仅在有更新时弹窗） */
        checkSilent: function() { return checkForUpdate(false); },

        /** 开始下载并安装 */
        downloadAndInstall: downloadAndInstall,

        /** 切换到下一个下载镜像源 */
        tryNextMirror: function() { tryNextMirror(); },

        /** 显示所有镜像源列表 */
        showAllMirrors: function() { 
            if (state.latestInfo) showMirrorSelector(state.latestInfo); 
        },

        /** 选择指定镜像源 */
        selectMirror: function(index) { selectMirror(index); },

        /** 关闭更新弹窗 */
        dismiss: function() {
            if (state.isDownloading) {
                if (state.abortController) state.abortController.abort();
                state.isDownloading = false;
            }
            hideModal();
        },

        /** 获取当前版本 */
        getCurrentVersion: function() { return CONFIG.CURRENT_VERSION; },

        /** 获取最新版本信息 */
        getLatestInfo: function() { return state.latestInfo; },

        /** 是否正在下载 */
        isDownloading: function() { return state.isDownloading; },

        /**
         * 自动初始化 - 在页面加载时调用
         */
        init: function() {
            console.log(`[AppUpdater] 初始化 v2.0, 当前版本: v${CONFIG.CURRENT_VERSION}`);
            
            // 延迟3秒后开始检查（等页面完全加载）
            setTimeout(function() {
                AppUpdater.checkSilent();
            }, 3000);

            // 监听页面可见性变化
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible') {
                    AppUpdater.checkSilent();
                }
            });

            // 监听网络恢复
            window.addEventListener('online', function() {
                console.log('[AppUpdater] 网络恢复，检查更新');
                AppUpdater.checkSilent();
            });
        },

        _config: CONFIG,
        _state: state,
        _theme: THEME
    };
})();

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { AppUpdater.init(); });
} else {
    AppUpdater.init();
}
