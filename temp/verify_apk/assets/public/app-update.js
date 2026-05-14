/**
 * 万能任务APP - 自动更新系统 v1.0
 * 功能：版本检测、更新提示、后台下载、自动安装
 * 
 * 工作流程：
 * 1. APP启动/切到前台时，静默检查 GitHub Release 最新版本
 * 2. 发现新版本 → 弹出精美更新弹窗（显示版本号 + 更新内容）
 * 3. 用户点击"立即更新" → 显示下载进度条
 * 4. 下载完成 → 自动调起系统安装器
 * 5. 支持断点续传、失败重试、强制更新
 */

const AppUpdater = (function() {
    'use strict';

    // ========== 配置 ==========
    const CONFIG = {
        // 当前APP版本（发布新版本时必须同步修改此值）
        CURRENT_VERSION: '4.7',
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
        // 备用直链（加速失败时使用）
        FALLBACK_DOWNLOAD_URL: 'https://github.com/xiongqing1990/wanneng-renwu/releases/download/{tag}/wanneng-task-v{version}.apk',
        // 检查间隔（毫秒）- 避免频繁请求
        CHECK_INTERVAL: 30 * 60 * 1000, // 30分钟
        // 下载超时（毫秒）
        DOWNLOAD_TIMEOUT: 120000,
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

    // ========== DOM：更新弹窗 ==========
    function createUpdateModal() {
        if (document.getElementById('app-update-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'app-update-modal';
        modal.innerHTML = `
            <style>
                #app-update-overlay{
                    position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:99999;
                    display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);
                    animation:fadeIn .25s ease-out;
                }
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
                @keyframes progressStripe{0%{background-position:1rem 0}100%{background-position:2.5rem 0}}
                #app-update-box{
                    width:300px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,.3);
                    animation:slideUp .35s ease-out;
                }
                #app-update-header{
                    background:linear-gradient(135deg,#07C160,#06AD56);padding:24px 20px;text-align:center;color:#fff;
                    position:relative;
                }
                #app-update-header .update-icon{font-size:48px;margin-bottom:8px;display:block}
                #app-update-header .update-title{font-size:18px;font-weight:bold}
                #app-update-header .update-subtitle{font-size:12px;opacity:.85;margin-top:4px}
                #app-update-body{padding:20px}
                #app-update-version-row{display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:14px}
                #app-update-old-ver{padding:4px 12px;border-radius:8px;background:#f5f5f5;font-size:13px;color:#666}
                #app-update-arrow{color:#07C160;font-size:18px;font-weight:bold}
                #app-update-new-ver{padding:4px 14px;border-radius:8px;background:linear-gradient(135deg,#07C160,#06AD56);font-size:14px;color:#fff;font-weight:bold}
                #app-update-changelog{max-height:150px;overflow-y:auto;padding:12px;border-radius:10px;background:#f9fafb;font-size:13px;line-height:1.7;color:#444;-webkit-overflow-scrolling:touch}
                #app-update-changelog::-webkit-scrollbar{width:3px}
                #app-update-changelog::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
                
                /* 进度条区域 */
                #app-download-progress{display:none;padding:0 20px 18px}
                #progress-info{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
                #progress-text{font-size:13px;color:#666}
                #progress-percent{font-size:14px;font-weight:bold;color:#07C160}
                #progress-bar-bg{height:8px;background:#e9ecef;border-radius:4px;overflow:hidden}
                #progress-bar-fill{height:100%;background:linear-gradient(90deg,#07C160,#34d399);border-radius:4px;
                    transition:width .3s ease;background-size:200% 100%;animation:progressStripe 1.5s linear infinite;
                    background-image:linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,
                    rgba(255,255,255,.15) 75%,transparent 75%,transparent);background-size:1.5rem 1.5rem;
                }
                
                /* 按钮 */
                #app-update-footer{display:flex;gap:10px;padding:0 20px 20px}
                .btn-update{flex:1;padding:12px;border-radius:12px;font-size:15px;font-weight:bold;border:none;cursor:pointer;text-align:center;transition:all .2s}
                .btn-update-primary{background:linear-gradient(135deg,#07C160,#06AD56);color:#fff;box-shadow:0 4px 14px rgba(7,193,96,.35)}
                .btn-update-primary:active{transform:scale(.95);opacity:.9}
                .btn-update-secondary{background:#f5f5f5;color:#666}
                .btn-update-secondary:active{background:#eee}
                .btn-update-disabled{background:#e9ecef;color:#aaa;cursor:not-allowed}

                /* 状态提示 */
                #app-update-status{text-align:center;padding:8px 20px 16px;font-size:12px;color:#888;display:none}
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
                            <span id="progress-text">正在下载...</span>
                            <span id="progress-percent">0%</span>
                        </div>
                        <div id="progress-bar-bg"><div id="progress-bar-fill" style="width:0%"></div></div>
                    </div>
                    <div id="app-update-status"></div>
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
        // 将换行转为HTML
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
        if (show) {
            progressArea.style.display = 'block';
            footer.style.display = 'none';
            status.style.display = 'block';
        } else {
            progressArea.style.display = 'none';
            footer.style.display = 'flex';
            status.style.display = 'none';
        }
    }

    function updateProgress(percent, text) {
        document.getElementById('progress-bar-fill').style.width = percent + '%';
        document.getElementById('progress-percent').textContent = percent + '%';
        if (text) document.getElementById('progress-text').textContent = text;
    }

    function updateStatus(text, isError) {
        const el = document.getElementById('app-update-status');
        el.style.display = 'block';
        el.textContent = text;
        el.style.color = isError ? '#e74c3c' : '#888';
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
        // 防重复检查
        if (state.isChecking) return null;
        // 频率限制
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

            // 判断是否需要更新
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

    // ========== 下载与安装 ==========
    // 当前使用的镜像源索引
    let currentMirrorIndex = 0;

    async function downloadAndInstall() {
        if (state.isDownloading || !state.latestInfo) return;

        const info = state.latestInfo;
        state.isDownloading = true;
        state.retryCount = 0;
        currentMirrorIndex = 0;

        showProgress(true);
        updateProgress(5, '正在准备下载...');

        // 使用 window.open 调起系统浏览器下载（比 WebView fetch 更稳定）
        doBrowserDownload(info);
    }

    function doBrowserDownload(info) {
        const urlTemplate = CONFIG.DOWNLOAD_URLS[currentMirrorIndex];
        const downloadUrl = urlTemplate
            .replace('{tag}', info.tagName)
            .replace('{version}', info.version);

        const mirrorNames = ['🌐 镜像源1(ghproxy镜像)', '🌐 镜像源2(gh-proxy)', '🌐 镜像源3(gh-proxy.net)', '🌐 GitHub直连'];
        const mirrorName = mirrorNames[currentMirrorIndex] || '🌐 下载源';

        updateProgress(10, `通过${mirrorName}下载...`);
        updateStatus(`正在跳转浏览器下载...`, false);

        console.log('[AppUpdater] 下载URL: ' + downloadUrl);

        // 延迟一下让用户看到状态，然后调起浏览器
        setTimeout(function() {
            try {
                // 方式1: window.open 调起外部浏览器
                window.open(downloadUrl, '_system', 'location=yes');

                // 显示提示
                updateStatus('已打开浏览器下载，下载完成后请手动安装', false);
                updateProgress(50, '等待浏览器下载...');

                // 显示完成状态
                setTimeout(function() {
                    showProgress(false);
                    const footer = document.getElementById('app-update-footer');
                    if (footer) {
                        footer.style.display = 'flex';
                        footer.innerHTML = `
                            <button class="btn-update btn-update-secondary" onclick="AppUpdater.dismiss()">稍后再说</button>
                            <button class="btn-update btn-update-primary" onclick="AppUpdater.tryNextMirror()">切换其他源</button>
                        `;
                    }
                    state.isDownloading = false;
                }, 2000);

            } catch(err) {
                console.warn('[AppUpdater] window.open失败:', err.message);
                tryNextMirror(info);
            }
        }, 800);
    }

    function tryNextMirror() {
        if (!state.latestInfo) return;
        
        currentMirrorIndex++;
        const info = state.latestInfo;

        if (currentMirrorIndex < CONFIG.DOWNLOAD_URLS.length) {
            state.retryCount = 0;
            updateProgress(0, `尝试第${currentMirrorIndex + 1}个下载源...`);
            updateStatus(`当前源不可用，自动切换到下一个...`, true);
            setTimeout(() => doBrowserDownload(info), 1000);
        } else {
            // 所有镜像都失败了
            updateStatus('所有下载源均不可用，请检查网络', true);
            showProgress(false);
            const footer = document.getElementById('app-update-footer');
            if (footer) {
                footer.style.display = 'flex';
                footer.innerHTML = `
                    <button class="btn-update btn-update-secondary" onclick="AppUpdater.dismiss()">取消</button>
                    <button class="btn-update btn-update-primary" onclick="AppUpdater.downloadAndInstall()">重新下载</button>
                `;
            }
            state.isDownloading = false;
        }
    }

    // ========== 安装APK ==========
    function installAPK(arrayBuffer, version) {
        updateStatus('正在准备安装...', false);

        // Capacitor/WebView环境下的安装方式
        if (window.Capacitor && window.Capacitor.nativeCall) {
            // 原生Capacitor环境
            try {
                const { Filesystem } = Capacitor.Plugins;
                // 保存到本地然后调用原生安装
                const base64 = arrayBufferToBase64(arrayBuffer);
                Filesystem.writeFile({
                    path: `wanneng-task-v${version}.apk`,
                    data: base64,
                    directory: Directory.Cache
                }).then(() => {
                    // 通过自定义原生插件触发安装
                    if (window.AppUpdaterNative && window.AppUpdaterNative.install) {
                        window.AppUpdaterNative.install({ path: `wanneng-task-v${version}.apk` });
                    } else {
                        // 回退方案：保存文件提示用户手动安装
                        saveAndPrompt(arrayBuffer, version);
                    }
                });
            } catch(e) {
                saveAndPrompt(arrayBuffer, version);
            }
        } else if (isAndroidWebView()) {
            // Android WebView 环境
            installViaAndroidIntent(arrayBuffer, version);
        } else {
            // 浏览器环境：直接下载文件
            saveAndPrompt(arrayBuffer, version);
        }
    }

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function isAndroidWebView() {
        return /android/i.test(navigator.userAgent) && /wv/i.test(navigator.userAgent);
    }

    function installViaAndroidIntent(arrayBuffer, version) {
        // 尝试通过 Android Intent scheme 安装
        try {
            const base64 = arrayBufferToBase64(arrayBuffer);
            // 存储到 localStorage 作为临时缓存
            localStorage.setItem('_app_update_apk', base64);
            localStorage.setItem('_app_update_version', version);
            
            // 尝试调用原生bridge
            if (window.AndroidBridge && window.AndroidBridge.installApk) {
                window.AndroidBridge.installApk(base64);
            } else if (window.WebViewInterface && window.WebViewInterface.install) {
                window.WebViewInterface.install(base64);
            } else {
                // 最终回退：创建一个a标签让浏览器处理
                saveAndPrompt(arrayBuffer, version);
            }
        } catch(e) {
            saveAndPrompt(arrayBuffer, version);
        }
    }

    function saveAndPrompt(arrayBuffer, version) {
        updateStatus('请确认安装', false);
        
        const blob = new Blob([arrayBuffer], { type: 'application/vnd.android.package-archive' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `万能任务APP_v${version}.apk`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
            hideModal();
            showNotif('✅ 新版本已下载，请在通知栏查看并安装');
        }, 1000);
    }

    function showNotif(msg) {
        // 复用全局通知或创建简单toast
        if (typeof window.showNotif === 'function') {
            window.showNotif(msg);
        } else {
            const n = document.createElement('div');
            n.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);background:#07C160;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;z-index:99999;';
            n.textContent = msg;
            document.body.appendChild(n);
            setTimeout(() => n.remove(), 3000);
        }
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
         * 会静默检查更新，发现新版本时弹出提示
         */
        init: function() {
            console.log(`[AppUpdater] 初始化, 当前版本: v${CONFIG.CURRENT_VERSION}`);
            
            // 延迟3秒后开始检查（等页面完全加载）
            setTimeout(function() {
                AppUpdater.checkSilent();
            }, 3000);

            // 监听页面可见性变化（从后台切回前台时检查）
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
        _state: state
    };
})();

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { AppUpdater.init(); });
} else {
    AppUpdater.init();
}
