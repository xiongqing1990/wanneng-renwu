/**
 * 万能任务APP - 基础工具库
 * 启动屏、网络状态检测、错误处理、缓存管理、全局配置
 */

const AppCore = (function() {
    'use strict';

    // ========== 全局配置 ==========
    const CONFIG = {
        APP_NAME: '万能任务',
        VERSION: '4.9.1',
        THEME_COLOR: '#1677FF',
        API_BASE: '',
        DEBUG: true
    };

    // ========== 启动屏管理 ==========
    const SplashScreen = {
        el: null,

        show: function() {
            if (document.getElementById('app-splash')) return;

            const splash = document.createElement('div');
            splash.id = 'app-splash';
            splash.innerHTML = `
                <style>
                    #app-splash{position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:99998;
                        display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity .35s}
                    #app-splash.hide{opacity:0;pointer-events:none}
                    #app-splash-logo{width:80px;height:80px;border-radius:20px;
                        background:linear-gradient(135deg,#1677FF,#4096FF);
                        display:flex;align-items:center;justify-content:center;font-size:40px;
                        box-shadow:0 8px 32px rgba(22,119,255,.3);animation:logoPop .5s ease-out;margin-bottom:16px}
                    @keyframes logoPop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
                    #app-splash-name{font-size:22px;font-weight:bold;color:#1d1d1f;letter-spacing:2px}
                    #app-splash-version{font-size:12px;color:#aaa;margin-top:4px}
                    #app-splash-loader{margin-top:24px;display:flex;gap:5px}
                    #app-splash-loader span{width:8px;height:8px;border-radius:50%;background:#1677FF;
                        animation:bounce .6s infinite alternate}
                    #app-splash-loader span:nth-child(2){animation-delay:.15s}
                    #app-splash-loader span:nth-child(3){animation-delay:.3s}
                    @keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-12px)}}
                </style>
                <div id="app-splash-logo">🎯</div>
                <div id="app-splash-name">${CONFIG.APP_NAME}</div>
                <div id="app-splash-version">v${CONFIG.VERSION}</div>
                <div id="app-splash-loader"><span></span><span></span><span></div>
            `;
            document.body.appendChild(splash);
            this.el = splash;
        },

        hide: function(delay) {
            delay = delay || 800;
            setTimeout(function() {
                var splash = document.getElementById('app-splash');
                if (splash) {
                    splash.classList.add('hide');
                    setTimeout(function() { splash.remove(); }, 400);
                }
            }, delay);
        },

        /** 初始化启动屏（自动显示，延迟隐藏） */
        init: function() {
            this.show();
            this.hide(1200);
        }
    };

    // ========== 网络状态 ==========
    const NetworkManager = {
        isOnline: navigator.onLine,
        callbacks: { online: [], offline: [] },
        
        init: function() {
            var self = this;
            window.addEventListener('online', function() {
                self.isOnline = true;
                self._fire('online');
                self._showToast('🌐 网络已恢复');
            });
            window.addEventListener('offline', function() {
                self.isOnline = false;
                self._fire('offline');
                self._showToast('📴 网络已断开，请检查连接');
            });
            
            // 首次检查
            if (!this.isOnline) {
                this._showToast('⚠️ 当前无网络连接');
            }
        },

        onOnline: function(fn) { this.callbacks.online.push(fn); return this; },
        onOffline: function(fn) { this.callbacks.offline.push(fn); return this; },

        _fire: function(event) {
            this.callbacks[event].forEach(function(fn) { try { fn(); } catch(e) {} });
        },

        _showToast: function(msg) {
            if (typeof showNotif === 'function') showNotif(msg);
        }
    };

    // ========== 全局错误处理 ==========
    const ErrorHandler = {
        init: function() {
            var self = this;
            
            window.onerror = function(msg, url, line, col, error) {
                console.error('[Error]', msg, url, line, col, error);
                self._log('JS_ERROR', { message: msg, file: url, line: line, col: col });
                return false;
            };

            window.addEventListener('unhandledrejection', function(e) {
                console.error('[Promise Error]', e.reason);
                self._log('PROMISE_ERROR', { reason: String(e.reason) });
            });

            // 捕获资源加载失败
            window.addEventListener('error', function(e) {
                if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
                    console.warn('[Resource]', e.target.src || e.target.href, '加载失败');
                }
            }, true);
        },

        _log: function(type, data) {
            try {
                var logs = JSON.parse(localStorage.getItem('_error_logs') || '[]');
                logs.push({ t: type, d: data, time: new Date().toISOString() });
                if (logs.length > 50) logs = logs.slice(-50);
                localStorage.setItem('_error_logs', JSON.stringify(logs));
            } catch(e) {}
        },

        getLogs: function() {
            try { return JSON.parse(localStorage.getItem('_error_logs') || '[]'); }
            catch(e) { return []; }
        },

        clearLogs: function() { localStorage.removeItem('_error_logs'); }
    };

    // ========== 缓存管理 ==========
    const CacheManager = {
        PREFIX: '_wn_',
        DEFAULT_TTL: 30 * 60 * 1000, // 30分钟

        set: function(key, value, ttl) {
            try {
                var item = { v: value, t: Date.now(), e: ttl || this.DEFAULT_TTL };
                localStorage[this.PREFIX + key] = JSON.stringify(item);
            } catch(e) {
                // 存储满了，清理过期数据
                this._cleanup();
                try { localStorage[this.PREFIX + key] = JSON.stringify(item); } catch(e2) {}
            }
        },

        get: function(key) {
            try {
                var raw = localStorage[this.PREFIX + key];
                if (!raw) return null;
                var item = JSON.parse(raw);
                if (Date.now() - item.t > item.e) {
                    localStorage.removeItem(this.PREFIX + key);
                    return null;
                }
                return item.v;
            } catch(e) { return null; }
        },

        remove: function(key) {
            localStorage.removeItem(this.PREFIX + key);
        },

        clear: function() {
            var keys = Object.keys(localStorage).filter(function(k) {
                return k.indexOf('_wn_') === 0;
            });
            keys.forEach(function(k) { localStorage.removeItem(k); });
        },

        _cleanup: function() {
            var now = Date.now();
            Object.keys(localStorage).forEach(function(k) {
                if (k.indexOf('_wn_') !== 0) return;
                try {
                    var item = JSON.parse(localStorage[k]);
                    if (now - item.t > item.e) localStorage.removeItem(k);
                } catch(e) {}
            });
        }
    };

    // ========== 安全区域（刘海屏适配） ==========
    const SafeArea = {
        getTop: function() {
            return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0') ||
                   (window.statusBarHeight || 0);
        },
        getBottom: function() {
            return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0') ||
                   (window.safeAreaInsetBottom || 0);
        },
        applyPadding: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            if (!el) return;
            el.style.paddingTop = (this.getTop() + (parseInt(getComputedStyle(el).paddingTop)||0)) + 'px';
            el.style.paddingBottom = (this.getBottom() + (parseInt(getComputedStyle(el).paddingBottom)||0)) + 'px';
        }
    };

    // ========== 页面生命周期 ==========
    const PageLifecycle = {
        callbacks: { show: [], hide: [], resume: [] },
        
        init: function() {
            var self = this;
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'hidden') {
                    self._fire('hide');
                } else {
                    self._fire('show');
                    self._fire('resume');
                }
            });

            // 页面卸载前保存状态
            window.addEventListener('beforeunload', function() {
                self._saveState();
            });

            // 尝试恢复状态
            this._restoreState();
        },

        onPageShow: function(fn) { this.callbacks.show.push(fn); return this; },
        onHide: function(fn) { this.callbacks.hide.push(fn); return this; },
        onResume: function(fn) { this.callbacks.resume.push(fn); return this; },

        _fire: function(event) {
            this.callbacks[event].forEach(function(fn) { try { fn(); } catch(e) {} });
        },

        _saveState: function() {
            try {
                sessionStorage.setItem('_page_scroll_y', window.scrollY);
                sessionStorage.setItem('_page_visible', document.visibilityState);
            } catch(e) {}
        },

        _restoreState: function() {
            try {
                var y = sessionStorage.getItem('_page_scroll_y');
                if (y) {
                    setTimeout(function() { window.scrollTo(0, parseInt(y)); }, 100);
                }
            } catch(e) {}
        }
    };

    // ========== 初始化（一次性调用） ==========
    let initialized = false;

    function init(options) {
        if (initialized) return;
        initialized = true;

        options = options || {};

        // 启动屏
        if (options.splash !== false) SplashScreen.init();

        // 网络监测
        NetworkManager.init();

        // 错误处理
        ErrorHandler.init();

        // 页面生命周期
        PageLifecycle.init();

        // CSS变量注入安全区域
        injectSafeAreaCSS();

        console.log('[AppCore] 初始化完成 v' + CONFIG.VERSION);
    }

    function injectSafeAreaCSS() {
        var style = document.createElement('style');
        style.textContent = `
            :root { --sat: env(safe-area-inset-top, 0px); --sab: env(safe-area-inset-bottom, 0px); }
            body { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
            /* iOS安全区域 */
            @supports(padding:max(0px)){body{padding-top:constant(safe-area-inset-top);padding-bottom:constant(safe-area-inset-bottom)}}
        `;
        document.head.appendChild(style);
    }

    // ========== 公开API ==========
    return {
        init: init,
        config: CONFIG,
        splash: SplashScreen,
        network: NetworkManager,
        errors: ErrorHandler,
        cache: CacheManager,
        safeArea: SafeArea,
        lifecycle: PageLifecycle
    };
})();

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { AppCore.init(); });
} else {
    AppCore.init();
}
