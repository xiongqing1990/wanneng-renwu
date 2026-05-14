var fs = require('fs');
var path = require('path');

// ===== Mock Browser =====
var els = {};
function mk(tag) {
    var e = {
        id: '', className: '', style: {}, textContent: '', innerHTML: '',
        children: [], value: '', attributes: {},
        appendChild: function(c) { this.children.push(c); return c; },
        remove: function() {},
        classList: { _s: new Set(), add: function(x) { this._s.add(x); }, remove: function(x) { this._s.delete(x); }, contains: function(x) { return this._s.has(x); } },
        setAttribute: function(n, v) { this.attributes[n] = String(v); },
        getAttribute: function(n) { return this.attributes[n] || ''; },
        querySelectorAll: function() { return { forEach: function() {} }; },
        querySelector: function() { return mk(); },
        addEventListener: function() {},
        getComputedStyle: function() { return { getPropertyValue: function() { return '0px'; } }; }
    };
    if (tag === 'style') e.textContent = '';
    return e;
}
global.document = {
    readyState: 'loading',
    getElementById: function(id) { if (!els[id]) els[id] = mk(); return els[id]; },
    querySelectorAll: function() { return { forEach: function() {} }; },
    querySelector: function() { return null; },
    addEventListener: function(t, f) { if (t === 'DOMContentLoaded') this._dr = f; },
    createElement: mk,
    head: { appendChild: function() {} },
    body: { appendChild: function() {} },
    documentElement: { style: { getPropertyValue: function() { return '0px'; } } },
    _triggerReady: function() { this.readyState = 'complete'; if (this._dr) try { this._dr(); } catch (e) { console.error('[DOMReady]', e.message); } }
};
global.window = {
    navigator: { onLine: true, serviceWorker: { register: function() { return Promise.resolve(); } } },
    addEventListener: function() {},
    localStorage: { _d: {}, getItem: function(k) { return this._d[k] || null; }, setItem: function(k, v) { this._d[k] = String(v); }, removeItem: function(k) { delete this._d[k]; }, clear: function() { this._d = {}; } },
    sessionStorage: { _d: {}, getItem: function() { return null; }, setItem: function() {}, removeItem: function() {} },
    scrollTo: function() {},
    scrollY: 0,
    statusBarHeight: 0,
    safeAreaInsetBottom: 0,
    location: { href: 'file:///index.html' },
    fetch: function() { return Promise.resolve({ ok: true, status: 200, json: function() { return Promise.resolve({ tag_name: 'v4.9.1' }); } }); }
};
global.navigator = global.window.navigator;
global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;

// ===== Test Framework =====
var passCount = 0, failCount = 0;
var failures = [];

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected:' + JSON.stringify(b) + ' got:' + JSON.stringify(a)); }
function assertExists(val, name) { if (val === undefined || val === null) throw new Error((name || 'Value') + ' is undefined/null'); }

// Helper: check if value exists in any scope
function checkExists(name) {
    if (typeof globalThis[name] !== 'undefined') return globalThis[name];
    if (typeof eval('typeof ' + name) !== 'undefined') try { return eval(name); } catch(e) {}
    return undefined;
}

function test(name, fn) {
    try {
        fn();
        passCount++;
        console.log('  [PASS]  ' + name);
    } catch (e) {
        failCount++;
        failures.push({ name: name, error: e.message });
        console.log('  [FAIL]  ' + name);
        console.log('          -> ' + e.message);
    }
}

// ===== Main =====
var assetsDir = process.argv[2] || path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
if (!fs.existsSync(assetsDir)) { console.error('[ERROR] Assets dir not found: ' + assetsDir); process.exit(1); }

console.log('');
console.log('============================================================');
console.log('  QA TEST - wanneng-task APP v4.9.1');
console.log('============================================================');
console.log('');
console.log('[DIR]  ' + assetsDir);
console.log('');

// --- Load business code ---
console.log('[1/4] Loading app-core.js ...');
try { var coreCode = fs.readFileSync(path.join(assetsDir, 'app-core.js'), 'utf8'); eval(coreCode.replace(/const\s+AppCore\s*=/, 'globalThis.AppCore = ')); }
catch (e) { test('app-core.js load', function () { throw e; }); }

console.log('[2/4] Loading app-update.js ...');
try { var updateCode = fs.readFileSync(path.join(assetsDir, 'app-update.js'), 'utf8'); eval(updateCode.replace(/const\s+AppUpdater\s*=/, 'globalThis.AppUpdater = ')); }
catch (e) { test('app-update.js load', function () { throw e; }); }

console.log('[3/4] Loading index.html inline script ...');
var indexHtml = '';
try {
    indexHtml = fs.readFileSync(path.join(assetsDir, 'index.html'), 'utf8');
    var m = indexHtml.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
    if (m) { eval(m[1].replace(/^(const|let)\s+/gm, 'var ')); }
    else { throw new Error('Cannot extract inline script'); }
} catch (e) { test('index.html script load', function () { throw e; }); }

console.log('[4/4] Triggering DOM Ready ...');
try { document._triggerReady(); }
catch (e) { test('DOMReady trigger', function () { throw e; }); }

console.log('');
console.log('--- Running Tests ---');
console.log('');

// ===== TEST SUITES =====

test('AppCore object exists with version 4.9.1', function () { assertExists(globalThis.AppCore); assertEqual(AppCore.config.VERSION, '4.9.1'); });
test('AppUpdater object exists with version 4.9.1', function () { assertExists(globalThis.AppUpdater); assertEqual(AppUpdater.getCurrentVersion(), '4.9.1'); });
test('Versions match between core and updater', function () { assertEqual(AppCore.config.VERSION, AppUpdater.getCurrentVersion()); });
test('AppCore has required modules', function () { assertExists(AppCore.init); assertExists(AppCore.splash); assertExists(AppCore.network); assertExists(AppCore.cache); assertExists(AppCore.errors); });

// Data layer - these use var after replacement so they're in eval scope
test('allTasks data exists (>=10 items)', function () { assert(allTasks.length >= 10, 'Got ' + allTasks.length); });
test('categories defined (>=8)', function () { assert(categories.length >= 8, 'Got ' + categories.length); });
test('sortOptions defined (>=4)', function () { assert(sortOptions.length >= 4, 'Got ' + sortOptions.length); });
test('USER_LEVELS complete (levels 1-10)', function () { for (var i = 1; i <= 10; i++) { assertExists(USER_LEVELS[i]); assertExists(USER_LEVELS[i].name); } });
test('Task data field completeness', function () { var fields = ['id','title','desc','budget','publisher','userLevel','credit']; allTasks.forEach(function(t) { fields.forEach(function(f) { assertExists(t[f]); }); }); });
test('Budget values are positive', function () { allTasks.forEach(function(t) { assert(t.budget > 0); }); });
test('Credit scores in valid range [500,1000]', function () { allTasks.forEach(function(t) { assert(t.credit >= 500 && t.credit <= 1000); }); });

// Function checks - functions are defined with 'function' keyword so they exist in eval scope
test('renderCategories is callable', function () { assert(typeof renderCategories === 'function'); });
test('renderSortBar is callable', function () { assert(typeof renderSortBar === 'function'); });
test('renderTasks is callable', function () { assert(typeof renderTasks === 'function'); });
test('initApp is callable', function () { assert(typeof initApp === 'function'); });
test('setCategory is callable', function () { assert(typeof setCategory === 'function'); });
test('setType is callable', function () { assert(typeof setType === 'function'); });
test('setSort is callable', function () { assert(typeof setSort === 'function'); });
test('handleSearch is callable', function () { assert(typeof handleSearch === 'function'); });
test('goPublish is callable', function () { assert(typeof goPublish === 'function'); });
test('switchTab is callable', function () { assert(typeof switchTab === 'function'); });
test('showNotif is callable', function () { assert(typeof showNotif === 'function'); });
test('getPublisherRating is callable', function () { assert(typeof getPublisherRating === 'function'); });

// Logic tests
test('Category filter: switch to ticket and back', function () { setCategory('ticket'); assert(currentCategory === 'ticket'); setCategory('all'); assert(currentCategory === 'all'); });
test('Type filter: switch short/long/all', function () { setType('short'); assert(taskTypeFilter === 'short'); setType('long'); assert(taskTypeFilter === 'long'); setType('all'); assert(taskTypeFilter === 'all'); });
test('Sort: switch credit/newest/budget/smart', function () { setSort('credit'); assert(currentSort === 'credit'); setSort('newest'); assert(currentSort === 'newest'); setSort('budget_high'); assert(currentSort === 'budget_high'); setSort('smart'); assert(currentSort === 'smart'); });
test('getPublisherRating returns correct levels', function () { assert(getPublisherRating(500).level === 1); assert(getPublisherRating(720).level === 2); assert(getPublisherRating(850).level === 4); assert(getPublisherRating(960).level === 5); });

// UI checks
test('UI: No heavy blue gradient on header', function () { assert(indexHtml.indexOf('background:linear-gradient(135deg,#1677FF,#4096FF)') === -1); });
test('UI: Primary color #1677FF present', function () { assert(indexHtml.indexOf('#1677FF') >= 0); });
test('UI: Light body background #f7f8fa', function () { assert(indexHtml.indexOf('#f7f8fa') >= 0); });
test('UI: Search box background #f5f6fa', function () { assert(indexHtml.indexOf('#f5f6fa') >= 0); });
test('UI: user-scalable=no in viewport', function () { assert(indexHtml.indexOf('user-scalable=no') >= 0); });

// Updater system
test('Updater: 4+ mirror sources configured', function () { assert(AppUpdater._config.DOWNLOAD_URLS.length >= 4); });
test('Updater: URLs contain {tag}, {version}, .apk', function () { AppUpdater._config.DOWNLOAD_URLS.forEach(function(url, i) { assert(url.indexOf('{tag}') >= 0, 'Source' + (i+1)); assert(url.indexOf('{version}') >= 0); assert(url.indexOf('.apk') >= 0); }); });
test('Updater: GitHub API URL correct', function () { var url = AppUpdater._config.CHECK_URL; assert(url.indexOf('github.com') >= 0); assert(url.indexOf('xiongqing1990/wanneng-renwu') >= 0); });

// Error handling
test('initApp wrapped in try-catch', function () { assert(indexHtml.indexOf('try{') >= 0); assert(indexHtml.indexOf('catch(') >= 0); });
test('DOMContentLoaded guard present', function () { assert(indexHtml.indexOf('DOMContentLoaded') >= 0); });

// Resource files
var reqFiles = ['index.html','app-core.js','app-update.js','vue.min.js','service-worker.js','manifest.json','chat.html','chat-detail.html','profile.html','publish.html','task-detail.html','plan.html','review.html','App.css'];
reqFiles.forEach(function(file) { test('Resource exists: ' + file, function () { assert(fs.existsSync(path.join(assetsDir, file))); }); });

// Safety
test('showNotif can be called safely', function () { try { showNotif('QA test'); assert(true); } catch(e) { assert(false, 'Should not throw: ' + e.message); } });


// ===== Report =====
console.log('');
console.log('============================================================');
var total = passCount + failCount;
console.log('  RESULT:  ' + total + ' tests | PASS: ' + passCount + ' | FAIL: ' + failCount);

if (failCount === 0) {
    console.log('  STATUS:  ALL PASS! Ready to release.');
} else {
    console.log('  STATUS:  HAS FAILURES - Fix required!');
    console.log('');
    console.log('  Failed tests:');
    failures.forEach(function (f) { console.log('    * ' + f.name + ': ' + f.error); });
}
console.log('============================================================');

process.exit(failCount > 0 ? 1 : 0);
