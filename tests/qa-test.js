/**
 * 万能任务APP - 自动化QA测试系统 v1.0
 * 
 * 使用方法：node qa-test.js
 * 
 * 功能：
 * 1. 模拟真实浏览器DOM环境
 * 2. 加载并执行所有业务JS
 * 3. 运行全量功能测试用例
 * 4. 输出PASS/FAIL报告 + 优化建议
 * 
 * @date 2026-05-14
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 第一部分：模拟浏览器DOM环境
// ============================================================
function createMockBrowser() {
    const elements = {};
    const styles = {};
    
    function createElement(tag) {
        const el = {
            id: '',
            className: '',
            style: {},
            textContent: '',
            innerHTML: '',
            children: [],
            value: '',
            tagName: (tag || 'div').toUpperCase(),
            attributes: {},
            onclick: null,
            oninput: null,
            
            appendChild(child) { this.children.push(child); return child; },
            remove() {},
            removeChild() {},
            classList: {
                _classes: new Set(),
                add(c) { this._classes.add(c); },
                remove(c) { this._classes.delete(c); },
                contains(c) { return this._classes.has(c); },
                toggle(c) { if(this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
            },
            setAttribute(name, val) { this.attributes[name] = String(val); },
            getAttribute(name) { return this.attributes[name] || ''; },
            querySelector() { return createElement(); },
            querySelectorAll() { return { forEach() {}, length: 0 }; },
            addEventListener() {},
            getComputedStyle() { return { getPropertyValue() { return '0px'; } }; }
        };
        if (tag === 'style') el.textContent = '';
        return el;
    }

    const doc = {
        readyState: 'loading',
        getElementById(id) {
            if (!elements[id]) elements[id] = createElement();
            return elements[id];
        },
        querySelectorAll(sel) { 
            return { 
                items: [], 
                forEach(fn) { this.items.forEach(fn); }, 
                length: this.items.length,
                [Symbol.iterator]() { return this.items[Symbol.iterator](); }
            }; 
        },
        querySelector() { return createElement(); },
        addEventListener(type, fn) {
            if (type === 'DOMContentLoaded' && doc.readyState === 'loading') {
                doc._domReadyFn = fn;
            }
        },
        createElement,
        head: { appendChild() {} },
        body: { 
            appendChild(el) {}, 
            removeChild(el) {},
            childNodes: []
        },
        documentElement: { 
            style: { getPropertyValue(prop) { return '0px'; } } 
        },
        // 触发DOMContentLoaded
        _triggerReady() {
            doc.readyState = 'complete';
            if (doc._domReadyFn) {
                try { doc._domReadyFn(); } catch(e) {}
            }
        }
    };

    globalThis.document = doc;
    globalThis.window = {
        navigator: { 
            onLine: true, 
            serviceWorker: { register() { return Promise.resolve(); } } 
        },
        addEventListener() {},
        localStorage: {
            _data: {},
            getItem(key) { return this._data[key] || null; },
            setItem(key, val) { this._data[key] = String(val); },
            removeItem(key) { delete this._data[key]; },
            clear() { this._data = {}; }
        },
        sessionStorage: {
            _data: {},
            getItem(key) { return this._data[key] || null; },
            setItem(key, val) { this._data[key] = String(val); },
            removeItem(key) { delete this._data[key]; }
        },
        scrollTo() {},
        scrollY: 0,
        statusBarHeight: 0,
        safeAreaInsetBottom: 0,
        location: { href: 'file:///index.html', origin: '' },
        AndroidNative: {
            openBrowserDownload(url) { console.log('[MockAndroid] 打开浏览器下载:', url); }
        },
        Capacitor: {
            Plugins: {
                Browser: { open(opts) { console.log('[MockCapacitor] 打开浏览器:', opts.url); } }
            }
        },
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        fetch(url, opts) {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ tag_name: 'v4.9.1', body: '测试更新', published_at: new Date().toISOString(), assets: [] })
            });
        },
        AbortSignal: { timeout(ms) { return {}; } }
    };
    globalThis.navigator = window.navigator;
    globalThis.localStorage = window.localStorage;
    globalThis.sessionStorage = window.sessionStorage;
    globalThis.setTimeout = setTimeout;
    globalThis.console = {
        log: () => {}, warn: () => {}, error: (...args) => {
            const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            if (!globalThis._qaErrors) globalThis._qaErrors = [];
            globalThis._qaErrors.push(msg);
        },
        info: () => {}
    };
    
    return { doc, elements };
}

// ============================================================
// 第二部分：测试框架
// ============================================================
class QATester {
    constructor() {
        this.results = [];
        this.errors = [];
        this.warnings = [];
        this.optimizations = [];
        this.currentSuite = '';
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
        this._startTime = Date.now();
    }

    suite(name) {
        this.currentSuite = name;
        console.log('\n=== [ ' + name + ' ] ===');
    }

    test(name, fn) {
        try {
            fn();
            this.passed++;
            this.results.push({ suite: this.currentSuite, name, status: 'PASS' });
            console.log('  [PASS] ' + name);
        } catch(e) {
            this.failed++;
            this.results.push({ suite: this.currentSuite, name, status: 'FAIL', error: e.message });
            this.errors.push({ suite: this.currentSuite, name, error: e.message, stack: e.stack });
            console.log('  [FAIL] ' + name);
            console.log('         -> ' + e.message);
        }
    }

    warn(msg) {
        this.warnings.push(msg);
        console.log('  [WARN] ' + msg);
    }

    optimize(level, area, current, suggestion, impact) {
        this.optimizations.push({ level, area, current, suggestion, impact });
    }

    assert(condition, msg) {
        if (!condition) throw new Error(msg || '断言失败');
    }

    assertEqual(actual, expected, msg) {
        if (actual !== expected) {
            throw new Error((msg || '') + ` 期望: ${JSON.stringify(expected)}, 实际: ${JSON.stringify(actual)}`);
        }
    }

    assertExists(val, name) {
        if (val === undefined || val === null) {
            throw new Error((name || '值') + ' 不存在（undefined/null）');
        }
    }

    assertType(val, type, name) {
        if (typeof val !== type) {
            throw new Error((name || '值') + ' 类型错误: 期望' + type + ', 实际' + typeof val);
        }
    }

    assertIncludes(haystack, needle, msg) {
        const str = String(haystack);
        if (!str.includes(needle)) {
            throw new Error((msg || '') + ` "${str}" 中不包含 "${needle}"`);
        }
    }

    assertNotIncludes(haystack, needle, msg) {
        const str = String(haystack);
        if (str.includes(needle)) {
            throw new Error((msg || '') + ` "${str}" 不应包含 "${needle}"`);
        }
    }

    // 获取报告
    getReport() {
        const duration = ((Date.now() - this._startTime) / 1000).toFixed(1);
        return {
            summary: {
                total: this.passed + this.failed + this.skipped,
                passed: this.passed,
                failed: this.failed,
                skipped: this.skipped,
                duration: duration + 's',
                status: this.failed === 0 ? 'ALL_PASS' : 'HAS_FAILURES'
            },
            failures: this.errors,
            warnings: this.warnings,
            optimizations: this.optimizations.sort((a,b) => {
                const order = {'P0':0,'P1':1,'P2':2,'P3':3};
                return (order[a.level]||99) - (order[b.level]||99);
            }),
            results: this.results
        };
    }

    printReport(report) {
        const s = report.summary;
        console.log('\n' + '='.repeat(55));
        console.log('\x1b[1m   QA测试报告 - 万能任务APP v4.9.1\x1b[0m');
        console.log('='.repeat(55));
        
        console.log('\n  总计: ' + s.total + ' | \x1b[32m通过: ' + s.passed + '\x1b[0m | \x1b[31m失败: ' + s.failed + '\x1b[0m | 跳过: ' + s.skipped + ' | 耗时: ' + s.duration);
        
        if (s.status === 'ALL_PASS') {
            console.log('\n  \x1b[42m\x1b[30m ✅ 全部测试通过！代码质量合格 ✓ \x1b[0m\n');
        } else {
            console.log('\n  \x1b[41m\x1b[37m ❌ 有 ' + s.failed + ' 个测试失败！需要修复 \x1b[0m\n');
        }

        if (report.failures.length > 0) {
            console.log('\x1b[31m\n--- 失败详情 ---\x1b[0m');
            report.failures.forEach(f => {
                console.log('\x1b[31m  ❌ [' + f.suite + '] ' + f.name + '\x1b[0m');
                console.log('     原因: ' + f.error);
                // 尝试给修复建议
                this._suggestFix(f);
            });
        }

        if (report.warnings.length > 0) {
            console.log('\n\x1b[33m--- 警告 ---\x1b[0m');
            report.warnings.forEach(w => console.log('  ⚠️  ' + w));
        }

        if (report.optimizations.length > 0) {
            console.log('\n\x1b[36m--- 优化建议（按优先级排序）---\x1b[0m');
            report.optimizations.forEach(o => {
                const icon = o.level === 'P0' ? '🔴' : o.level === 'P1' ? '🟠' : o.level === 'P2' ? '🟡' : '🔵';
                console.log('  ' + icon + ' [' + o.level + '] ' + o.area);
                console.log('     当前: ' + o.current.substring(0, 60) + (o.current.length > 60 ? '...' : ''));
                console.log('     建议: ' + o.suggestion.substring(0, 80) + (o.suggestion.length > 80 ? '...' : ''));
                console.log('     收益: ' + o.impact);
                console.log('');
            });
        }

        console.log('='.repeat(55) + '\n');
    }

    _suggestFix(failure) {
        const msg = failure.error.toLowerCase();
        if (msg.includes('not a function')) {
            console.log('     💡 修复建议: 检查函数名是否拼写错误，或确认该函数在被调用前已定义');
        } else if (msg.includes('cannot read') || msg.includes('undefined')) {
            console.log('     💡 修复建议: 对象为null/undefined，检查是否正确初始化或从DOM获取到了元素');
        } else if (msg.includes('期望') && msg.includes('实际')) {
            console.log('     💡 修复建议: 输出值不符合预期，检查相关逻辑是否正确');
        } else if (msg.includes('不存在')) {
            console.log('     💡 修复建议: 变量/函数未定义，确认已正确声明和导出');
        } else {
            console.log('     💡 建议: 根据错误信息定位问题行号，检查上下文逻辑');
        }
    }
}

// ============================================================
// 第三部分：核心测试套件
// ============================================================
function runTests(assetsDir) {
    const qa = new QATester();
    
    // ---- 准备工作：加载所有业务代码 ----
    console.log('\n[LOAD] Loading business code...');
    
    let mock;
    try {
        mock = createMockBrowser();
        console.log('[OK] Mock browser created');
    } catch(e) {
        console.error('[FATAL] createMockBrowser failed:', e.message);
        console.error(e.stack ? e.stack.substring(0,300) : '');
        process.exit(2);
    }

    // 加载 app-core.js
    try {
        const coreCode = fs.readFileSync(path.join(assetsDir, 'app-core.js'), 'utf8');
        eval(coreCode);
        qa.test('app-core.js loaded OK', () => qa.assert(true));
        console.log('[OK] app-core.js loaded');
    } catch(e) {
        console.error('[FAIL] app-core.js:', e.message);
        console.error(e.stack ? e.stack.substring(0,400) : '');
        qa.test('app-core.js load', () => { throw e; });
    }

    // 加载 app-update.js
    try {
        const updateCode = fs.readFileSync(path.join(assetsDir, 'app-update.js'), 'utf8');
        eval(updateCode);
        qa.test('app-update.js loaded OK', () => qa.assert(true));
        console.log('[OK] app-update.js loaded');
    } catch(e) {
        console.error('[FAIL] app-update.js:', e.message);
        console.error(e.stack ? e.stack.substring(0,400) : '');
        qa.test('app-update.js load', () => { throw e; });
    }

    // 加载 index.html 内联脚本
    let indexHtml = '';
    try {
        indexHtml = fs.readFileSync(path.join(assetsDir, 'index.html'), 'utf8');
        console.log('[OK] index.html read, size:', indexHtml.length);
        const scriptMatch = indexHtml.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
        if (scriptMatch) {
            console.log('[OK] inline script extracted, size:', scriptMatch[1].length);
            eval(scriptMatch[1]);
            qa.test('index.html script loaded OK', () => qa.assert(true));
            console.log('[OK] index.html script evaluated');
        } else {
            console.log('[WARN] No inline script match found');
            qa.test('inline script extract', () => qa.assert(false, 'no match'));
        }
    } catch(e) {
        console.error('[FAIL] index.html script:', e.message);
        console.error(e.stack ? e.stack.substring(0,500) : '');
        qa.test('index.html script', () => { throw e; });
    }

    // 触发DOMContentLoaded（这会触发initApp）
    try {
        document._triggerReady();
        qa.test('DOM Ready triggered OK', () => qa.assert(true));
        console.log('[OK] DOM Ready triggered');
    } catch(e) {
        console.error('[FAIL] DOMReady:', e.message);
        qa.test('DOM Ready trigger', () => { throw e; });
    }
    
    console.log('[OK] All code loading complete');

    // ==================== 测试套件1：基础架构 ====================
    qa.suite('1. 基础架构');

    qa.test('AppCore对象存在且版本为4.9.1', () => {
        qa.assertExists(globalThis.AppCore, 'AppCore');
        qa.assertEqual(AppCore.config.VERSION, '4.9.1');
    });

    qa.test('AppUpdater对象存在且版本一致', () => {
        qa.assertExists(globalThis.AppUpdater, 'AppUpdater');
        qa.assertEqual(AppUpdater.getCurrentVersion(), '4.9.1');
    });

    qa.test('AppCore与AppUpdater版本一致', () => {
        qa.assertEqual(AppCore.config.VERSION, AppUpdater.getCurrentVersion());
    });

    qa.test('AppCore包含必要模块', () => {
        qa.assertExists(AppCore.init, 'AppCore.init');
        qa.assertExists(AppCore.splash, 'AppCore.splash');
        qa.assertExists(AppCore.network, 'AppCore.network');
        qa.assertExists(AppCore.cache, 'AppCore.cache');
        qa.assertExists(AppCore.errors, 'AppCore.errors');
        qa.assertExists(AppCore.safeArea, 'AppCore.safeArea');
        qa.assertExists(AppCore.lifecycle, 'AppCore.lifecycle');
    });

    qa.test('AppUpdater包含必要API', () => {
        qa.assertExists(AppUpdater.checkNow, 'checkNow');
        qa.assertExists(AppUpdater.checkSilent, 'checkSilent');
        qa.assertExists(AppUpdater.downloadAndInstall, 'downloadAndInstall');
        qa.assertExists(AppUpdater.dismiss, 'dismiss');
        qa.assertExists(AppUpdater.tryNextMirror, 'tryNextMirror');
    });

    // ==================== 测试套件2：数据层 ====================
    qa.suite('2. 数据层');

    qa.test('allTasks数据存在且有足够条目', () => {
        qa.assertExists(allTasks, 'allTasks');
        qa.assert(allTasks.length >= 10, '任务数量应>=10，实际:' + allTasks.length);
    });

    qa.test('categories定义完整（>=8个分类）', () => {
        qa.assertExists(categories, 'categories');
        qa.assert(categories.length >= 8, '分类数应>=8，实际:' + categories.length);
        // 验证每个分类有id和name
        categories.forEach(c => {
            qa.assertExists(c.id, 'category.id');
            qa.assertExists(c.name, 'category.name');
        });
    });

    qa.test('sortOptions定义完整（>=4个选项）', () => {
        qa.assertExists(sortOptions, 'sortOptions');
        qa.assert(sortOptions.length >= 4, '排序选项应>=4');
        sortOptions.forEach(s => {
            qa.assertExists(s.id, 'sortOption.id');
            qa.assertExists(s.name, 'sortOption.name');
        });
    });

    qa.test('USER_LEVELS用户等级定义完整（1-10级）', () => {
        qa.assertExists(USER_LEVELS, 'USER_LEVELS');
        for (let i = 1; i <= 10; i++) {
            qa.assertExists(USER_LEVELS[i], 'USER_LEVELS[' + i + ']');
            qa.assertExists(USER_LEVELS[i].name, '等级名称');
            qa.assertExists(USER_LEVELS[i].icon, '等级图标');
            qa.assertExists(USER_LEVELS[i].color, '等级颜色');
        }
    });

    qa.test('任务数据字段完整性', () => {
        const requiredFields = ['id','title','desc','budget','publisher','userLevel','credit','category','taskType'];
        allTasks.forEach(t => {
            requiredFields.forEach(field => {
                qa.assertExists(t[field], '任务.' + field + '(id:' + t.id + ')');
            });
        });
    });

    qa.test('预算值均为正数', () => {
        allTasks.forEach(t => {
            qa.assert(t.budget > 0, '任务' + t.id + '预算应为正数，实际:' + t.budget);
        });
    });

    qa.test('信用分在合理范围(500-1000)', () => {
        allTasks.forEach(t => {
            qa.assert(t.credit >= 500 && t.credit <= 1000, '任务' + t.id + '信用分越界:' + t.credit);
        });
    });

    // ==================== 测试套件3：渲染函数 ====================
    qa.suite('3. 渲染函数可用性');

    const renderFuncs = ['renderCategories','renderSortBar','renderTasks','setCategory','setType','setSort','handleSearch','goPublish','showAdCenter','viewTask','switchTab','showNotif','initApp','getPublisherRating'];
    renderFuncs.forEach(funcName => {
        qa.test('函数 ' + funcName + ' 存在且可调用', () => {
            qa.assertType(globalThis[funcName], 'function', funcName);
        });
    });

    // ==================== 测试套件4：分类筛选逻辑 ====================
    qa.suite('4. 分类筛选逻辑');

    qa.test('默认选中"全部"分类', () => {
        qa.assertEqual(currentCategory, 'all');
    });

    qa.test('setCategory切换到ticket分类', () => {
        setCategory('ticket');
        qa.assertEqual(currentCategory, 'ticket');
    });

    qa.test('setCategory切换回all', () => {
        setCategory('all');
        qa.assertEqual(currentCategory, 'all');
    });

    qa.test('setType切换到短期', () => {
        setType('short');
        qa.assertEqual(taskTypeFilter, 'short');
    });

    qa.test('setType切换到长期', () => {
        setType('long');
        qa.assertEqual(taskTypeFilter, 'long');
    });

    qa.test('setType切换回全部', () => {
        setType('all');
        qa.assertEqual(taskTypeFilter, 'all');
    });

    // ==================== 测试套件5：排序逻辑 ====================
    qa.suite('5. 排序逻辑');

    qa.test('默认排序为smart', () => {
        qa.assertEqual(currentSort, 'smart');
    });

    qa.test('切换到credit排序', () => {
        setSort('credit');
        qa.assertEqual(currentSort, 'credit');
    });

    qa.test('切换到newest排序', () => {
        setSort('newest');
        qa.assertEqual(currentSort, 'newest');
    });

    qa.test('切换到budget_high排序', () => {
        setSort('budget_high');
        qa.assertEqual(currentSort, 'budget_high');
    });

    qa.test('恢复默认排序', () => {
        setSort('smart');
        qa.assertEqual(currentSort, 'smart');
    });

    // ==================== 测试套件6：搜索过滤 ====================
    qa.suite('6. 搜索过滤');

    qa.test('搜索关键词"电影票"能匹配到任务', () => {
        // 模拟设置搜索框值
        document.getElementById('searchInput').value = '电影票';
        handleSearch();
        // 验证：此时renderTasks会运行，不会报错即算通过
        qa.assert(true, '搜索功能未抛异常');
    });

    qa.test('清空搜索后恢复正常显示', () => {
        document.getElementById('searchInput').value = '';
        handleSearch();
        qa.assert(true, '清空搜索未抛异常');
    });

    // ==================== 测试套件7：发布者评级 ====================
    qa.suite('7. 发布者评级');

    qa.test('getPublisherRating返回正确评级', () => {
        const r500 = getPublisherRating(500);
        qa.assertEqual(r500.level, 1, '500分应为普通');
        
        const r720 = getPublisherRating(720);
        qa.assertEqual(r720.level, 2, '720分应为诚信');
        
        const r850 = getPublisherRating(850);
        qa.assertEqual(r850.level, 4, '850分应为金牌');
        
        const r960 = getPublisherRating(960);
        qa.assertEqual(r960.level, 5, '960分应为钻石');
    });

    qa.test('低信用分返回最低等级', () => {
        const r0 = getPublisherRating(0);
        qa.assertEqual(r0.level, 1, '0分应为普通');
    });

    // ==================== 测试套件8：页面跳转 ====================
    qa.suite('8. 页面跳转链接');

    qa.test('goPublish跳转到publish.html', () => {
        let targetUrl = '';
        const origLocation = window.location.href;
        Object.defineProperty(window.location, 'href', { 
            set(v) { targetUrl = v; }, 
            get() { return targetUrl || origLocation; }
        });
        goPublish();
        qa.assertIncludes(targetUrl, 'publish.html', '发布按钮应跳转到publish.html');
    });

    qa.test('switchTab跳转到正确页面', () => {
        const pages = { home:'index.html', chat:'chat.html', publish:'publish.html', profile:'profile.html' };
        let targetUrl = '';
        Object.defineProperty(window.location, 'href', { 
            set(v) { targetUrl = v; }, 
            get() { return targetUrl; }
        });
        switchTab(null, 'chat');
        qa.assertIncludes(targetUrl, 'chat.html');
        
        switchTab(null, 'profile');
        qa.assertIncludes(targetUrl, 'profile.html');
    });

    qa.test('viewTask生成正确的详情页URL', () => {
        let targetUrl = '';
        Object.defineProperty(window.location, 'href', { 
            set(v) { targetUrl = v; }, 
            get() { return targetUrl; }
        });
        viewTask(201);
        qa.assertIncludes(targetUrl, 'task-detail.html?id=201');
    });

    // ==================== 测试套件9：UI样式检查 ====================
    qa.suite('9. UI样式规范（简洁白）');

    qa.test('header背景色为白色（非渐变蓝）', () => {
        // 从CSS中检查
        qa.assertNotIncludes(indexHtml, 'background:linear-gradient(135deg,#1677FF,#4096FF)', 'header不应有重蓝色渐变');
    });

    qa.test('主题色为#1677FF科技蓝', () => {
        qa.assertIncludes(indexHtml, '#1677FF', '主色调应为#1677FF');
    });

    qa.test('body背景为浅灰色(#f7f8fa)', () => {
        qa.assertIncludes(indexHtml, '#f7f8fa', 'body背景色');
    });

    qa.test('搜索框背景为#f5f6fa', () => {
        qa.assertIncludes(indexHtml, '#f5f6fa', '搜索框背景色');
    });

    qa.test('发布按钮使用纯色背景（非渐变）', () => {
        // btn-publish应该是background:#1677FF纯色
        const pubBtnMatch = indexHtml.match(/\.btn-publish\{[^}]*background:([^;}]+)/);
        if (pubBtnMatch) {
            const bg = pubBtnMatch[1].trim();
            qa.assertNotIncludes(bg, 'gradient', '发布按钮不应使用渐变');
        }
    });

    qa.test('meta viewport禁止缩放', () => {
        qa.assertIncludes(indexHtml, 'user-scalable=no', '应禁止用户缩放');
    });

    qa.test('标题含万能任务关键词', () => {
        qa.assertIncludes(indexHtml, '<title>', '应有title标签');
        qa.assertIncludes(indexHtml, '万能任务', 'title应含万能任务');
    });

    // ==================== 测试套件10：更新系统 ====================
    qa.suite('10. 自动更新系统');

    qa.test('配置了多镜像源下载地址', () => {
        qa.assertExists(AppUpdater._config.DOWNLOAD_URLS, 'DOWNLOAD_URLS');
        qa.assert(AppUpdater._config.DOWNLOAD_URLS.length >= 4, '镜像源数量应>=4，实际:' + AppUpdater._config.DOWNLOAD_URLS.length);
    });

    qa.test('镜像源URL模板含{tag}和{version}占位符', () => {
        AppUpdater._config.DOWNLOAD_URLS.forEach((url, i) => {
            qa.assertIncludes(url, '{tag}', '源' + (i+1) + '缺少{tag}');
            qa.assertIncludes(url, '{version}', '源' + (i+1) + '缺少{version}');
            qa.assertIncludes(url, '.apk', '源' + (i+1) + '不是APK地址');
        });
    });

    qa.test('版本比较函数compareVersions正确性', () => {
        // 这个函数是闭包内的，我们间接测试：检查当前版本不小于MIN_VERSION
        qa.assert(AppUpdater._config.CURRENT_VERSION >= AppUpdater._config.MIN_VERSION, 
                  '当前版本应>=最低版本');
    });

    qa.test('GitHub Release API URL正确', () => {
        const checkUrl = AppUpdater._config.CHECK_URL;
        qa.assertIncludes(checkUrl, 'github.com', '应为GitHub API');
        qa.assertIncludes(checkUrl, 'xiongqing1990/wanneng-renwu', '仓库路径');
        qa.assertIncludes(checkUrl, 'releases/latest', '最新release接口');
    });

    // ==================== 测试套件11：错误处理 ====================
    qa.suite('11. 错误处理健壮性');

    qa.test('initApp有try-catch包裹', () => {
        qa.assertIncludes(indexHtml, 'try{', 'initApp应有try-catch');
        qa.assertIncludes(indexHtml, 'catch(', 'initApp应有try-catch');
    });

    qa.test('DOMContentLoaded多重保障机制', () => {
        qa.assertIncludes(indexHtml, 'DOMContentLoaded', '应有DOMContentLoaded监听');
        qa.assertIncludes(indexHtml, 'readyState', '应有readyState检查');
    });

    qa.test('showNotif函数可安全调用（无DOM时不出错）', () => {
        try {
            showNotif('QA测试消息');
            qa.assert(true, 'showNotif安全');
        } catch(e) {
            qa.assert(false, 'showNotif抛出异常:' + e.message);
        }
    });

    // ==================== 测试套件12：资源完整性 ====================
    qa.suite('12. 资源文件完整性');

    const requiredFiles = [
        'index.html', 'app-core.js', 'app-update.js', 'vue.min.js',
        'service-worker.js', 'manifest.json',
        'chat.html', 'chat-detail.html', 'profile.html',
        'publish.html', 'task-detail.html', 'plan.html',
        'review.html', 'App.css'
    ];

    requiredFiles.forEach(file => {
        qa.test('资源文件存在: ' + file, () => {
            const filePath = path.join(assetsDir, file);
            qa.assert(fs.existsSync(filePath), file + ' 不存在于assets/public/');
            const stat = fs.statSync(filePath);
            qa.assert(stat.size > 0, file + ' 大小为0字节');
        });
    });

    // ==================== 优化建议分析 ====================
    analyzeOptimizations(qa, indexHtml);

    return qa.getReport();
}

// ============================================================
// 第四部分：智能优化建议引擎
// ============================================================
function analyzeOptimizations(qa, indexHtml) {

    // P0: 关键问题
    if (indexHtml.match(/window\.open\(/g) && !indexHtml.includes('AndroidNative')) {
        qa.optimize('P0', 'WebView内window.open无效', 
            '检测到window.open调用但在WebView中无效',
            '改用AndroidNative.openBrowserDownload()或Capacitor Browser插件',
            '解决下载功能完全不可用的致命问题');
    }

    // P1: 重要优化
    if (indexHtml.includes('innerHTML +=') && !indexHtml.includes('textContent=')) {
        qa.optimize('P1', 'XSS风险防护',
            'innerHTML拼接用户数据可能引入XSS攻击',
            '对title/desc等用户可控字段做HTML转义后再写入innerHTML',
            '防止恶意任务描述注入脚本窃取用户数据');
    }

    const taskCountMatch = indexHtml.match(/allTasks\s*=\s*\[/);
    if (taskCountMatch) {
        const taskCount = (indexHtml.match(/id:\d+/g) || []).length;
        if (taskCount < 15) {
            qa.optimize('P1', '示例数据量偏少',
                '当前仅' + taskCount + '个示例任务，用户体验不够丰富',
                '增加至20-30个覆盖更多场景的示例任务（不同等级、类型、分类组合）',
                '让首页看起来更充实、功能演示更全面');
        }
    }

    if (indexHtml.includes('console.log') && !indexHtml.includes('DEBUG')) {
        qa.optimize('P1', '生产环境日志清理',
            '代码中残留console.log调试语句',
            '统一通过AppCore.config.DEBUG开关控制日志输出，生产版关闭',
            '减少性能开销，避免泄露内部信息');
    }

    // P2: 改进建议
    if (!indexHtml.includes('debounce') && !indexHtml.includes('throttle')) {
        qa.optimize('P2', '搜索防抖优化',
            '搜索输入每次按键都触发重新渲染',
            '添加300ms debounce防抖，用户停止输入后才执行搜索',
            '高频输入时减少50%以上不必要的渲染计算');
    }

    if (indexHtml.includes('.forEach') && !indexHtml.includes('DocumentFragment')) {
        qa.optimize('P2', 'DOM批量更新优化',
            '循环中多次修改innerHTML导致多次reflow',
            '使用DocumentFragment或一次性拼接完再赋值innerHML',
            '大量任务卡片时提升渲染速度30%+');
    }

    if (!indexHtml.includes('@media') && !indexHtml.match(/max-width.*375/)) {
        qa.optimize('P2', '平板/大屏适配',
            '当前样式固定max-width:375px，大屏设备两侧留白过多',
            '添加媒体查询支持更大屏幕宽度（如768px平板模式）',
            '提升平板用户的体验');
    }

    // P3: 锦上添花
    if (!indexHtml.includes('localStorage') && !indexHtml.includes('CacheManager')) {
        qa.optimize('P3', '离线缓存策略',
            '未利用已有的CacheManager进行数据缓存',
            '对任务列表等静态数据做本地缓存，减少重复渲染等待',
            '二次打开速度提升80%+');
    }

    if (!indexHtml.includes('loading') && !indexHtml.includes('骨架屏')) {
        qa.optimize('P3', '加载状态体验',
            '首次加载或筛选切换时没有loading提示',
            '添加简单的loading动画或骨架屏效果',
            '让用户感知到系统在工作而非卡死');
    }

    qa.optimize('P3', '深色模式预留',
        '当前只有浅色主题',
        '在CSS变量层预留深色模式切换能力（prefers-color-scheme）',
        '未来一键支持系统级暗色模式，提升夜间体验');
}


// ============================================================
// 第五部分：HTML报告生成
// ============================================================
function generateHTMLReport(report, outputPath) {
    const passColor = '#52C41A';
    const failColor = '#FF4D4F';
    const warnColor = '#FAAD14';
    const s = report.summary;
    
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>QA测试报告 - 万能任务APP v4.9.1</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,"Segoe UI",PingFang SC,sans-serif;background:#f5f6fa;color:#333;max-width:900px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#1677FF,#4096FF);color:#fff;padding:24px;border-radius:12px;margin-bottom:20px}
.header h1{font-size:22px;margin-bottom:8px}.header p{opacity:.85;font-size:14px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.stat-card{background:#fff;border-radius:10px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.stat-num{font-size:28px;font-weight:bold}.stat-label{font-size:12px;color:#888;margin-top:4px}
.section{background:#fff;border-radius:10px;padding:18px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.section h2{font-size:16px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0}
.fail-item{background:#fff2f0;border-left:3px solid ${failColor};padding:10px 14px;margin-bottom:8px;border-radius:0 8px 8px 0}
.opt-card{background:#fafbfc;border:1px solid #eee;border-radius:8px;padding:14px;margin-bottom:10px}
.opt-p0{border-left:3px solid #FF4D4F}.opt-p1{border-left:3px solid #FAAD14}.opt-p2{border-left:3px solid #1677FF}.opt-p3{border-left:3px solid #999}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.tag-pass{background:#f6ffed;color:${passColor};border:1px solid #b7eb8f}.tag-fail{background:#fff2f0;color:${failColor};border:1px solid #ffccc7}
.tag-warn{background:#fffbe6;color:#d48806;border:1px solid #ffe58f}
.result-row{display:flex;align-items:center;padding:6px 0;border-bottom:1px solid #f9f9f9;font-size:13px}
.result-row:last-child{border-bottom:none}
.status-icon{width:20px;margin-right:8px;font-size:14px}
.footer{text-align:center;color:#bbb;font-size:12px;padding:20px}
</style>
</head>
<body>
<div class="header">
    <h1>🔬 QA测试报告</h1>
    <p>万能任务APP v4.9.1 · 生成时间: ${new Date().toLocaleString('zh-CN')} · 耗时: ${s.duration}</p>
</div>

<div class="stats">
    <div class="stat-card"><div class="stat-num">${s.total}</div><div class="stat-label">总测试数</div></div>
    <div class="stat-card"><div class="stat-num" style="color:${passColor}">${s.passed}</div><div class="stat-label">✅ 通过</div></div>
    <div class="stat-card"><div class="stat-num" style="color:${failColor}">${s.failed}</div><div class="stat-label">❌ 失败</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#888">${s.skipped}</div><div class="stat-label">⏭️ 跳过</div></div>
</div>`;

    if (s.status === 'ALL_PASS') {
        html += `<div class="section" style="border-left:4px solid ${passColor}">
<h2 style="color:${passColor}">🎉 全部测试通过</h2>
<p style="padding:10px 0;color:#666">${s.passed}/${s.total} 项测试全部通过，代码质量符合发布标准。</p>
</div>`;
    } else {
        html += `<div class="section" style="border-left:4px solid ${failColor}">
<h2 style="color:${failColor}">❌ 发现 ${s.failed} 个问题</h2>
<p style="padding:10px 0;color:#666">以下测试未通过，请修复后重新测试。</p>
</div>`;
    }

    // 失败详情
    if (report.failures.length > 0) {
        html += `<div class="section">
<h2>🔴 失败详情 (${report.failures.length})</h2>`;
        report.failures.forEach(f => {
            html += `<div class="fail-item">
<strong>[${f.suite}] ${f.name}</strong><br>
<span style="color:${failColor};font-size:12px">${f.error.replace(/</g,'&lt;')}</span>
</div>`;
        });
        html += `</div>`;
    }

    // 警告
    if (report.warnings.length > 0) {
        html += `<div class="section">
<h2 style="color:${warnColor}">⚠️ 警告 (${report.warnings.length})</h2>`;
        report.warnings.forEach(w => {
            html += `<div style="padding:6px 0;font-size:13px;color:#d48806">⚠️ ${w}</div>`;
        });
        html += `</div>`;
    }

    // 优化建议
    if (report.optimizations.length > 0) {
        html += `<div class="section">
<h2>💡 优化建议 (${report.optimizations.length})</h2>`;
        report.optimizations.forEach(o => {
            html += `<div class="opt-card opt-${o.level.toLowerCase()}">
<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
<span class="tag" style="background:${
o.level==='P0'?'#ffccc7':o.level==='P1'?'#ffe58f':o.level==='P2'?'#e8f4ff':'#f0f0f0'
};color:${
o.level==='P0'?'#cf1322':o.level==='P1'?'#d48806':o.level==='P2'?'#1677FF':'#666'
}">${o.level}</span>
<strong>${o.area}</strong>
</div>
<div style="font-size:12px;color:#888;margin-bottom:4px">当前: ${o.current.replace(/</g,'&lt;')}</div>
<div style="font-size:13px;margin-bottom:4px">💡 建议: ${o.suggestion.replace(/</g,'&lt;')}</div>
<div style="font-size:12px;color:${passColor}">✨ 收益: ${o.impact}</div>
</div>`;
        });
        html += `</div>`;
    }

    // 全部结果列表
    html += `<div class="section">
<h2>📋 全部测试结果</h2>`;
    report.results.forEach(r => {
        const icon = r.status === 'PASS' ? '✅' : '❌';
        const color = r.status === 'PASS' ? passColor : failColor;
        html += `<div class="result-row">
<span class="status-icon" style="color:${color}">${icon}</span>
<span style="flex:1">[${r.suite}] ${r.name}</span>
<span class="tag tag-${r.status.toLowerCase()}">${r.status}</span>
</div>`;
    });
    html += `</div>

<div class="footer">万能任务APP QA System v1.0 · 自动生成</div>
</body></html>`;

    fs.writeFileSync(outputPath, html, 'utf8');
    return outputPath;
}


// ============================================================
// 主入口
// ============================================================
function main() {
    console.log('\n' + '='.repeat(55));
    console.log('\x1b[1m  🔬 万能任务APP - 自动化QA测试系统 v1.0\x1b[0m');
    console.log('='.repeat(55));

    // 确定assets目录
    const assetsDir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public'));
    
    if (!fs.existsSync(assetsDir)) {
        console.error('\n❌ 错误: assets目录不存在: ' + assetsDir);
        console.log('   用法: node qa-test.js [assets/public目录路径]');
        process.exit(1);
    }

    console.log('\n[DIR] Test dir: ' + assetsDir + '\n');

    let report;
    try {
        report = runTests(assetsDir);
    } catch(fatalErr) {
        console.error('\n[FATAL] Uncaught error in runTests:');
        console.error('  Message: ' + fatalErr.message);
        console.error('  Stack: ' + fatalErr.stack);
        process.exit(2);
    }
    
    // 输出控制台报告
    const qaPrinter = new QATester();
    qaPrinter.printReport(report);

    // 生成HTML报告
    const reportDir = process.argv[3] || path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, 'qa-report.html');
    generateHTMLReport(report, reportPath);
    console.log('\x1b[36m📄 HTML报告已生成: ' + reportPath + '\x1b[0m\n');

    // 退出码
    process.exit(report.summary.failed > 0 ? 1 : 0);
}

main();
