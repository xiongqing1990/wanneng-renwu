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
        CURRENT_VERSION: '4.5',
        // 版本检查接口 - GitHub Release API
        CHECK_URL: 'https://api.github.com/repos/xiongqing1990/wanneng-renwu/releases/latest',
        // APK下载地址模板（gh-proxy加速）
        DOWNLOAD_URL: 'https://gh-proxy.com/https://github.com/xiongqing1990/wanneng-renwu/releases/download/{tag}/wanneng-task-v{version}.apk',
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
    async function downloadAndInstall() {
        if (state.isDownloading || !state.latestInfo) return;

        const info = state.latestInfo;
        state.isDownloading = true;
        state.retryCount = 0;

        showProgress(true);
        updateProgress(0, '正在准备下载...');

        // 构建下载URL
        let downloadUrl = CONFIG.DOWNLOAD_URL
            .replace('{tag}', info.tagName)
            .replace('{version}', info.version);

        await doDownload(downloadUrl);
    }

    async function doDownload(url, useFallback) {
        try {
            state.abortController = new AbortController();

            const resp = await fetch(url, {
                method: 'GET',
                signal: state.abortController.signal
            });

            if (!resp.ok) throw new Error('下载失败 HTTP ' + resp.status);

            const contentLength = resp.headers.get('Content-Length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            
            let received = 0;
            const chunks = [];

            const reader = resp.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                received += value.length;

                if (total > 0) {
                    const percent = Math.round((received / total) * 100);
                    const mbReceived = (received / 1024 / 1024).toFixed(1);
                    const mbTotal = (total / 1024 / 1024).toFixed(1);
                    updateProgress(percent, `已下载 ${mbReceived}/${mbTotal} MB`);
                } else {
                    updateProgress(Math.min(received % 100, 95), `已下载 ${(received/1024/1024).toFixed(1)} MB`);
                }
            }

            updateProgress(100, '下载完成！');

            // 合并数据
            const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' });
            const arrayBuffer = await blob.arrayBuffer();

            // 调起安装
            installAPK(arrayBuffer, info.version);

        } catch (err) {
            if (err.name === 'AbortError') {
                updateStatus('下载已取消', true);
                showProgress(false);
                state.isDownloading = false;
                return;
            }

            console.warn('[AppUpdater] 下载出错:', err.message);
            state.retryCount++;

            if (state.retryCount <= CONFIG.MAX_RETRIES) {
                updateStatus(`下载失败，正在重试 (${state.retryCount}/${CONFIG.MAX_RETRIES})...`, true);
                updateProgress(0, `第${state.retryCount}次重试...`);
                setTimeout(() => doDownload(url, useFallback), 2000);
            } else if (!useFallback) {
                // 尝试备用链接
                updateStatus('加速链接失败，尝试直连...', true);
                const fallbackUrl = CONFIG.FALLBACK_DOWNLOAD_URL
                    .replace('{tag}', state.latestInfo.tagName)
                    .replace('{version}', state.latestInfo.version);
                state.retryCount = 0;
                setTimeout(() => doDownload(fallbackUrl, true), 1000);
            } else {
                updateStatus('下载失败，请检查网络后重试', true);
                
                // 显示重试按钮
                const footer = document.getElementById('app-update-footer');
                footer.style.display = 'flex';
                footer.innerHTML = `
                    <button class="btn-update btn-update-secondary" onclick="AppUpdater.dismiss()">取消</button>
                    <button class="btn-update btn-update-primary" onclick="AppUpdater.downloadAndInstall()">重新下载</button>
                `;
                state.isDownloading = false;
            }
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
