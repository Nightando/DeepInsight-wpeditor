// ============================================================
// 深维公众号组件库 · 扩展自检脚本
// 用法：node tools/check-extension.mjs
// 4.7.0 / 4.7.1 / 4.8.0 / 4.8.1 检查项：
//   · 4.8.1：悬停预览高度按视口自适应（上限 210px → min(480, vh*0.55)），内容放大到 90%
//   · 4.8.0：交互 bug 修复与便利易用（跨帧选区/拖拽粘滞/resize/键盘可达/状态清理）
//   · 4.7.1：浮窗高度随视口自适应（无 720px 上限），拖拽/展开后底部不裁切、内容可滚动
//   · 组件卡片点击即插入编辑器光标处；有选中文字则用组件样式替换
//   · 卡片只保留一个「快捷」按钮，其余按钮全部删除
//   · 常驻实时预览框已移除，改为组件库悬停预览（内容为组件预设文案）
//   · 唯一入口（无 side_panel / default_popup），页面浮窗承载全部 UI
//   · 注入链 = 11-08 备份版原样（禁止整段插入、禁止强清洗导入网页）
//   · 统一浮窗：单一滚动流 / 常驻滚动轨 / 位置同步 / 通知可读
//   · 快捷功能在浮窗上方、无重复控件；导入前后注入按钮常驻可点
//   · manifest / HTML 引用完整性、JS 语法、组件渲染、体积统计
// 无第三方依赖，退出码 0 = 通过，1 = 存在错误
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// ---------- 1. manifest 基础 ----------
let manifest;
try {
  manifest = JSON.parse(read('manifest.json'));
} catch (e) {
  console.error('[FATAL] manifest.json 无法解析:', e.message);
  process.exit(1);
}
if (manifest.manifest_version !== 3) err('manifest_version 必须为 3');
if (!/^\d+\.\d+\.\d+$/.test(manifest.version || '')) err('version 不符合 x.y.z 格式');
if (manifest.version !== '4.8.1') err(`版本号应为 4.8.1，实际 ${manifest.version}`);

// ---------- 2. manifest 引用文件 ----------
const refs = [];
Object.values(manifest.icons || {}).forEach((p) => refs.push(p));
Object.values(manifest.action?.default_icon || {}).forEach((p) => refs.push(p));
if (manifest.action?.default_popup) refs.push(manifest.action.default_popup);
if (manifest.side_panel?.default_path) refs.push(manifest.side_panel.default_path);
if (manifest.background?.service_worker) refs.push(manifest.background.service_worker);
(manifest.content_scripts || []).forEach((cs) => {
  (cs.js || []).forEach((p) => refs.push(p));
  (cs.css || []).forEach((p) => refs.push(p));
});
[...new Set(refs)].forEach((p) => {
  if (!exists(p.replace(/^\//, ''))) err(`manifest 引用的文件不存在: ${p}`);
});

// ---------- 3. 唯一入口：不得再注册第二个窗口 ----------
if (manifest.side_panel) err('仍声明 side_panel，4.3.0 起唯一窗口是页面浮窗');
if (manifest.action?.default_popup) err('仍声明 action.default_popup，会与浮窗形成第二个窗口');
if ((manifest.permissions || []).includes('sidePanel')) err('仍申请 sidePanel 权限');
if (!manifest.action?.default_title) err('缺少 action.default_title');
const csJs = (manifest.content_scripts || []).flatMap((cs) => cs.js || []);
['shared/sanitize.js', 'components/components.js', 'content/content.js', 'content/panel.js']
  .forEach((p) => { if (!csJs.includes(p)) err(`content_scripts 缺少 ${p}`); });

// ---------- 4. 本地 HTML 资源引用 ----------
const htmlFiles = ['tools/test.html', 'tools/selftest.html'].filter(exists);
const htmlRefs = [];
htmlFiles.forEach((html) => {
  const dir = path.dirname(html);
  const src = read(html);
  const re = /<(?:script|link)\b[^>]*?(?:src|href)\s*=\s*"([^"]+)"/gi;
  let m;
  while ((m = re.exec(src))) {
    const url = m[1];
    if (/^(https?:|chrome-extension:|data:|#|javascript:|\.\.\/shared\/webpage)/i.test(url)) continue;
    const rel = path.normalize(path.join(dir, url.split('?')[0])).replace(/\\/g, '/');
    if (!exists(rel)) err(`HTML 引用的文件不存在: ${html} -> ${url}`);
    htmlRefs.push({ html, url });
  }
});

// ---------- 5. JS 语法 ----------
const jsFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const rel = path.join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) walk(rel);
    else if (entry.name.endsWith('.js')) jsFiles.push(rel);
  }
}
walk('.');
jsFiles.forEach((file) => {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, file)], { stdio: 'pipe' });
  } catch (e) {
    err(`JS 语法错误: ${file}\n${String(e.stderr || e.message).trim()}`);
  }
});

// ---------- 6. 注入链 = 11-08 备份版逐段插入（第一原则） ----------
const bgSrc = read('background/background.js');
const ctSrc = read('content/content.js');
const panelSrc = read('content/panel.js');

// 6a. 备份版原文逐字比对（备份存在时执行）
// 11-08 是用户认可的注入基准；若该目录被清理，退回到已知注入链未改动的
// 近期快照继续逐字比对（4.1.0 曾改坏注入链，不能作为基准）。
const BAK_CANDIDATES = [
  path.resolve(ROOT, '../DeepInsight wpeditor_backup_20261108'),
  path.resolve(ROOT, '../DeepInsight wpeditor_backup_20261122_pre480'),
  path.resolve(ROOT, '../DeepInsight wpeditor_backup_20261116_pre471'),
];
const BAK = BAK_CANDIDATES.find((p) => fs.existsSync(path.join(p, 'background/background.js')));
function slice(src, from, to) {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a + 1);
  return a < 0 || b < 0 ? null : src.slice(a, b);
}
if (BAK) {
  const readBak = (f) => fs.readFileSync(path.join(BAK, f), 'utf8').replace(/\r\n/g, '\n');
  const checks = [
    ['background/background.js', bgSrc,
      'function buildInsertFunc()', '// ---------- 通过 chrome.scripting.executeScript 直接注入 ----------'],
    ['background/background.js', bgSrc,
      'function tryMultiFrameInsert(', '// ---------- 消息监听 ----------'],
    ['content/content.js', ctSrc,
      '  // ---------- 在当前帧中插入 HTML ----------', '  // ---------- postMessage 监听'],
    ['content/content.js', ctSrc,
      '  // ---------- 插入处理（仅在 top-level 执行） ----------', '  // 缓存 tabId'],
  ];
  checks.forEach(([file, cur, from, to]) => {
    const a = slice(readBak(file), from, to);
    const b = slice(cur, from, to);
    if (a == null || b == null) err(`注入链段落定位失败: ${file} / ${from}`);
    else if (a !== b) err(`注入链与基准备份版不一致: ${file} / ${from}`);
  });
} else {
  warn('未找到 11-08 或近期基准备份目录，跳过逐字比对，仅执行关键字断言');
}

// 6b. 关键字与禁止回归断言
if (!bgSrc.includes('var fragments = parseToParagraphFragments(h);')) {
  err('background 注入函数不再是「原样 HTML 逐段拆分」，导入网页会被改写');
}
if (!ctSrc.includes('var fragments = parseToParagraphFragments(html);')) {
  err('content script 不再是「原样 HTML 逐段拆分」');
}
if (!ctSrc.includes('function handleInsert(html, sendResp)') ||
    !ctSrc.includes('function injectIntoIframe(')) {
  err('备份版 iframe 广播兜底链被删除，主帧无编辑器时插入会失败');
}
if (!ctSrc.includes("window.addEventListener('message'")) {
  err('postMessage 跨帧插入监听缺失');
}
// 禁止 4.1/4.2 引入的破坏性写法
[['background/background.js', bgSrc], ['content/content.js', ctSrc], ['content/panel.js', panelSrc]]
  .forEach(([f, src]) => {
    if (src.includes('normalizeForInsert(')) err(`${f} 含 normalizeForInsert，会重写导入的网页文档`);
    if (/\?\s*\[(?:normalizeForInsert\(|String\()/.test(src)) err(`${f} 又出现「整段一次插入」写法`);
    if (src.includes('webpage: true')) err(`${f} 残留 webpage 模式标记，备份版注入链不认识它`);
    if (src.includes('DI_WEBPAGE') || src.includes('importPreserve') || src.includes('importCompatible')) {
      err(`${f} 残留已废弃的注入模式`);
    }
  });
if (exists('shared/webpage.js')) err('shared/webpage.js 不应随扩展打包');
if (!bgSrc.includes('chrome.action.onClicked') || !ctSrc.includes("action === 'togglePanel'")) {
  err('点击图标展开/收起唯一浮窗的入口链不完整');
}

// ---------- 7. 导入预处理链与注入触发（承接备份版语义） ----------
['function processHTMLContent(html)', 'function wrapHTMLContent(html)',
 'function expandNestedBlocks(container)', 'globalStyles.join',
 'wrapHTMLContent(processHTMLContent(htmlContent))',
 "action: 'directInsert', html: htmlContent, tabId: tab.id",
 "action: 'insertHTML', html: htmlContent }"].forEach((kw) => {
  if (!panelSrc.includes(kw)) err(`导入链缺失或与备份版不一致: ${kw}`);
});
if (!panelSrc.includes('minimalHTML(html)')) err('导入预览缺少 minimal 清洗');
if (!read('shared/sanitize.js').includes('function minimal(')) err('缺少 minimal 清洗实现');
// DocumentFragment.innerHTML 会得到 undefined，曾导致预览显示 "undefined"
['shared/sanitize.js', 'background/background.js'].forEach((file) => {
  const src = read(file);
  if (/return\s+(?:root|fragment|content|tpl\.content)\.innerHTML\s*;/.test(src)) {
    err(`${file} 用 DocumentFragment.innerHTML 序列化，结果会是 undefined`);
  }
});

// ---------- 8. 唯一浮窗：结构、适配层、能力归位 ----------
let PANEL_HTML = '';
const htmlMatch = panelSrc.match(/var PANEL_HTML = ("(?:\\.|[^"\\])*");/);
if (!htmlMatch) err('panel.js 缺少内嵌的面板 HTML');
else {
  try { PANEL_HTML = JSON.parse(htmlMatch[1]); } catch (e) { err('PANEL_HTML 无法解析'); }
}
let PANEL_CSS = '';
const cssMatch = panelSrc.match(/var PANEL_CSS = ("(?:\\.|[^"\\])*");/);
if (!cssMatch) err('panel.js 缺少内嵌样式');
else {
  try { PANEL_CSS = JSON.parse(cssMatch[1]); } catch (e) { err('PANEL_CSS 无法解析'); }
}
if (!panelSrc.includes("attachShadow({ mode: 'open' })")) err('面板未用 Shadow DOM 隔离样式');
if (!panelSrc.includes('var chrome = window.__DI_PANEL_CTX.chrome;')) err('面板缺少 chrome 适配层');
if (!panelSrc.includes('var document = window.__DI_PANEL_CTX.document;')) err('面板缺少 document 适配层');
if (!panelSrc.includes('__DI_PANEL_CTX.host.register({')) err('面板未把插槽选择/定位能力注册给浮窗');
if (!ctSrc.includes('window.__DI_HOST = {')) err('content script 未暴露页面内能力桥');
if (!ctSrc.includes('window.__DI_TOOLBAR = {')) err('浮窗控制柄未暴露');
if (!ctSrc.includes('window.__DI_REFRESH_SLOTS')) err('自定义插槽刷新未暴露');
if (!panelSrc.includes("id='di-panel-host'") && !panelSrc.includes("id = 'di-panel-host'")) {
  // panel.js 用 hostEl.id = 'di-panel-host'
  if (!panelSrc.includes("'di-panel-host'")) err('面板宿主节点未创建');
}

const requiredIds = [
  'btnImportHTML', 'btnSettings', 'btnOpenSidePanel', 'appVersion', 'componentCount',
  'statusBar', 'searchInput', 'categoryTabs', 'componentList',
  'importModal', 'importTextarea', 'importFileArea', 'importFileInput', 'importFileName',
  'importPreview', 'importPreviewContent', 'importPreviewHint', 'btnImportInsert',
  'editModal', 'modalTitle', 'modalBody', 'btnPreview', 'btnInsert',
  'previewArea', 'previewContent', 'footerVersion'
];
requiredIds.forEach((id) => {
  if (!PANEL_HTML.includes(`id="${id}"`)) err(`浮窗面板缺少元素 #${id}`);
});
// 面板主体引用的 id 必须能在内嵌 HTML 或运行时创建的元素里找到
const usedIds = [...panelSrc.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
const runtimeIds = new Set([
  '_copyPreview', 'di-floating-toolbar', 'di-panel-host', 'di-tb-body',
  'di-panel-root', 'di-conn-dot', 'di-conn-text',
  // 4.7.0 悬停预览浮层：节点由 shadow root 内的 innerHTML 运行时创建
  'diHpName', 'diHpContentHost'
]);
[...new Set(usedIds)].forEach((id) => {
  if (!PANEL_HTML.includes(`id="${id}"`) && !runtimeIds.has(id)) {
    err(`面板引用了不存在的 id: #${id}`);
  }
});

const requiredActions = ['pinToToolbar'];
requiredActions.forEach((a) => {
  if (!panelSrc.includes(`data-action="${a}"`)) err(`组件卡片缺少操作入口: ${a}`);
  if (!panelSrc.includes(`action === '${a}'`)) err(`组件卡片操作未绑定: ${a}`);
});
// 4.5.0：卡片只留「快捷」一个按钮，其余按钮与对应的 data-action 必须消失
['direct', 'quickInsert', 'edit', 'insert', 'copySource', 'copy'].forEach((a) => {
  if (panelSrc.includes(`data-action="${a}"`)) err(`组件卡片仍在渲染多余按钮: ${a}`);
});
if (!panelSrc.includes('>快捷</button>')) err('「快捷」按钮文案缺失或未重命名');
['btnPreview', 'insertToEditorFull', 'fallbackToClipboard', 'copyComponentHTML',
 'retryAfterInject', 'showModalPreview', 'stripHTML', 'startSlotSelect',
 'pendingSlotIndex', 'checkEditorStatus', 'showHoverPreview', 'copyToClipboard',
 'handleHTMLFile', 'mergeStyles', 'handleDrop', 'visibilitychange'].forEach((kw) => {
  if (!panelSrc.includes(kw)) err(`浮窗缺少原窗口能力: ${kw}`);
});
// 快捷排版工具条仍在同一个浮窗内
['beautify', 'indentFirst', 'titleBig', 'hlYellow', 'insertDivider', 'di-tb-custom-slots']
  .forEach((kw) => { if (!ctSrc.includes(kw)) err(`原浮窗快捷排版能力缺失: ${kw}`); });

// ---------- 9. 陈旧标记 ----------
['background/background.js', 'content/content.js', 'content/panel.js',
 'shared/sanitize.js'].forEach((file) => {
  const stale = read(file).match(/v[34]\.\d+(?:\.\d+)?/g);
  if (stale) warn(`${file} 仍含硬编码旧版本号: ${[...new Set(stale)].join(', ')}`);
});
if (!read('content/panel.js').includes('getManifest().version')) {
  err('面板版本号未从 manifest 动态读取');
}

// ---------- 10. 组件库渲染冒烟 ----------
let componentCount = 0;
try {
  const sandbox = { window: {}, console };
  vm.runInNewContext(read('components/components.js'), sandbox, { filename: 'components.js' });
  const C = sandbox.window.DEEPINSIGHT_COMPONENTS;
  if (!C || !Array.isArray(C.list)) err('组件库结构异常：缺少 DEEPINSIGHT_COMPONENTS.list');
  else {
    componentCount = C.list.length;
    const broken = [], dirty = [];
    C.list.forEach((comp) => {
      let html = '';
      try { html = C.renderComponent(comp.id, {}); } catch (e) { broken.push(comp.id); return; }
      if (typeof html !== 'string' || !html.trim()) broken.push(comp.id);
      else if (/undefined|NaN/.test(html)) dirty.push(comp.id);
    });
    if (broken.length) err(`组件渲染失败或为空: ${broken.join(', ')}`);
    if (dirty.length) warn(`组件默认渲染含 undefined/NaN: ${dirty.join(', ')}`);
  }
} catch (e) {
  err(`组件库执行失败: ${e.message}`);
}

// ---------- 10b. 统一浮窗 UI（4.4.0 新增，防结构/反馈回归） ----------
const uiCss = read('content/content.css');

// ① 一套界面：面板内不得再有第二套品牌头部；两套分区共用同一语言
if (PANEL_HTML.includes('app-header')) err('面板仍有第二套品牌头部，界面被切成两块');
['快捷操作', '组件库'].forEach((name) => {
  if (!PANEL_HTML.includes(`data-di-section="${name}"`)) err(`面板缺少统一分区标记: ${name}`);
});
['快捷排版', '自定义插槽'].forEach((name) => {
  if (!ctSrc.includes(`data-di-section="${name}"`)) err(`快捷排版块缺少统一分区标记: ${name}`);
});
if (!PANEL_CSS.includes('user-select: text !important')) err('阴影内输入框无法选中文字');

// ② 单一纵向滚动流：面板不得再自带 100vh / 第二层 list 滚动
const rootRule = (PANEL_CSS.match(/#di-panel-root\s*\{[^}]*\}/) || [''])[0];
if (/height:\s*100vh/.test(rootRule)) err('面板根节点仍用 100vh 撑出第二个滚动容器');
if (/\.app\s*\{\s*[^}]*height:\s*100vh/.test(PANEL_CSS)) err('.app 仍用 100vh 撑出第二个滚动容器');
if (/max-height:\s*300px/.test(PANEL_CSS) || /\.component-list\s*\{[^}]*overflow-y:\s*auto/.test(PANEL_CSS)) {
  err('组件列表又出现独立滚动，整窗不再是单一滚动流');
}
if (!uiCss.includes('scrollbar-width: none') || !uiCss.includes('overflow-y: auto')) {
  err('唯一滚动容器或原生滚动条隐藏规则缺失');
}

// ③ 常驻可见的滚动轨与位置同步
['di-rail', 'di-rail-thumb', 'di-rail-ticks', 'di-scroll-wrap', 'di-posbar',
 'di-pos-section', 'di-pos-item', 'di-pos-nav', 'di-pos-progress-fill', 'di-notice']
  .forEach((id) => { if (!ctSrc.includes(`id="${id}"`)) err(`统一浮窗缺少节点 #${id}`); });
['collectSections', 'di:ui-changed', 'di:goto-section', 'di-card-current',
 'requestAnimationFrame(update)', 'di-rail-tick', 'syncNav('].forEach((kw) => {
  if (!ctSrc.includes(kw)) err(`滚动位置同步逻辑缺失: ${kw}`);
});
// 分区导航静态预置，滚动时只切高亮，不重建 DOM（静态与滚动中视觉一致）
['快捷操作', '组件库', '快捷排版', '自定义插槽'].forEach((name) => {
  if (!ctSrc.includes(`data-di-goto="${name}"`)) err(`位置条缺少静态分区导航: ${name}`);
});
if (ctSrc.includes('renderNav(')) err('位置条又在滚动时重建导航节点，会造成跳动');
if (!uiCss.includes('.di-rail-thumb') || !uiCss.includes('.di-posbar')) {
  err('滚动轨或位置条样式缺失');
}

// ④ 通知可读：旧版 translateX(-50%) + left/right 冲突会把文字推出可视区
const toastRule = PANEL_CSS.match(/\.toast\s*\{[^}]*\}/);
if (!toastRule) err('面板缺少 toast 兜底样式');
else {
  if (/translateX\(\s*-50%/.test(toastRule[0])) err('toast 仍带 translateX(-50%)，文字会被推出可视区');
  if (!/transform:\s*none/.test(toastRule[0])) err('toast 未显式清除位移');
  if (/white-space:\s*nowrap/.test(toastRule[0])) err('toast 仍在截断文字');
}
if (!ctSrc.includes('window.__DI_NOTICE =') || !panelSrc.includes('__DI_NOTICE.push(message, type)')) {
  err('通知未统一走浮窗常驻通知条');
}
if (!uiCss.includes('.di-notice-line') || !uiCss.includes('[hidden] { display: none')) {
  err('常驻通知条样式或 hidden 状态缺失');
}
if (!panelSrc.includes('checkEditorStatus(true)')) err('「检测状态」未输出明确探测结果');
if (!panelSrc.includes('function setStatus(')) err('状态未镜像到浮窗头部');
if (!panelSrc.includes('function openModal(') || !PANEL_CSS.includes('position: fixed')) {
  err('弹窗未覆盖整个浮窗，滚动后可能不可见');
}
if (!panelSrc.includes('function notifyUIChanged(')) err('组件列表重渲染后位置条不会同步');

// ---------- 10c. 点击即插入 / 选中文字替换（4.5.0 新增） ----------
['insertCardToEditor', 'pickPrimaryTextField', 'textToFieldValue',
 'refreshSelectionHint', 'readEditorSelection'].forEach((kw) => {
  if (!panelSrc.includes(kw)) err(`卡片点击插入逻辑缺失: ${kw}`);
});
['TEXT_SKIP_RE', 'LABEL_SKIP_RE'].forEach((kw) => {
  if (!panelSrc.includes(kw)) err(`缺少「非正文组件不替换选中文字」的判断: ${kw}`);
});
if (!panelSrc.includes('restoreEditorFocus')) err('插入前未把焦点交还编辑器，会插到末尾而不是光标处');
if (!panelSrc.includes("addEventListener('mousedown'")) {
  err('组件列表未阻止 mousedown 抢焦点，编辑器选区会丢失');
}
if (!panelSrc.includes('shiftKey')) err('Shift+点击调参数的入口缺失，组件参数无法修改');
['readSelection: function', 'restoreEditorFocus: function'].forEach((kw) => {
  if (!ctSrc.includes(kw)) err(`content script 能力桥缺少: ${kw}`);
});
['findEditorTarget', 'readEditorSelectionInfo', 'pickEditorElIn'].forEach((kw) => {
  if (!ctSrc.includes(kw)) err(`编辑器光标 / 选区读取缺失: ${kw}`);
});
// 选中文字是直接拼进组件 HTML 的，必须转义 + 换行转 <br>
if (!panelSrc.includes("replace(/\\r\\n|\\r|\\n/g, '<br>')")) {
  err('选中文字未做换行转换，多行内容会被压成一段');
}
if (!panelSrc.includes('DI_SANITIZE.escapeHtml')) err('选中文字未转义，可能破坏组件 HTML');

// ---------- 10d. 快捷功能归位 / 注入按钮常驻可点（4.6.0 新增） ----------
// ① 原生菜单合并判定：微信公众平台编辑器没有对外开放菜单项注册接口，
//    因此采用备用方案。快捷排版与插槽必须排在组件库面板之前（浮窗上方）。
const quickRule = (uiCss.match(/#di-floating-toolbar \.di-quick \{[^}]*\}/) || [''])[0];
const slotsRule = (uiCss.match(/#di-floating-toolbar \.di-slots \{[^}]*\}/) || [''])[0];
const hostRule = (uiCss.match(/#di-floating-toolbar #di-panel-host \{[^}]*\}/) || [''])[0];
if (!/order:\s*1/.test(quickRule)) err('快捷排版没有移到浮窗上方（应为 order: 1）');
if (!/order:\s*2/.test(slotsRule)) err('自定义插槽没有跟着移到上方（应为 order: 2）');
if (!/order:\s*3/.test(hostRule)) err('组件库面板没有排在快捷功能之后（应为 order: 3）');
if (/overflow-y:\s*auto/.test(quickRule) || /overflow-y:\s*auto/.test(slotsRule)) {
  err('快捷区又自带了一条纵向滚动，整窗不再是单一滚动流');
}
// 位置条导航顺序与视觉顺序一致，靠 rect.top 排序，不重建 DOM
const navOrder = [...ctSrc.matchAll(/data-di-goto=\\?"([^"\\]+)\\?"/g)]
  .map((m) => m[1]);
['快捷排版', '自定义插槽', '快捷操作', '组件库'].forEach((name, i) => {
  if (navOrder[i] !== name) err(`位置条导航顺序与分区顺序不符（第 ${i + 1} 项应为 ${name}）`);
});
if (navOrder.length !== 4) err(`位置条芯片数应为 4，实际 ${navOrder.length}`);
if (ctSrc.includes('renderNav(')) err('位置条又在重建导航节点，滚动会跳动');
// ② 无重复控件：快捷排版里的「组件库」跳转按钮必须移除，面板里仍保留一个
if (ctSrc.includes('data-action="openSidebar"')) err('快捷排版里仍渲染重复的「组件库」跳转按钮');
if ((PANEL_HTML.match(/id="btnOpenSidePanel"/g) || []).length !== 1) {
  err('「组件库」跳转入口数量异常（应只保留快捷操作里的一个）');
}
['beautify', 'indentFirst', 'lineHeight175', 'lineHeight2', 'alignCenter', 'alignLeft',
 'quoteStyle', 'titleBig', 'titleMedium', 'titleSmall', 'subtitleDecor', 'chapterTitle',
 'hlYellow', 'hlPink', 'hlGreen', 'boldText', 'colorRed', 'colorBlue',
 'insertSpace', 'insertDash', 'insertQuote', 'insertDivider', 'insertEndMark'
].forEach((a) => {
  if (!ctSrc.includes(`data-action="${a}"`)) err(`快捷排版动作丢失: ${a}`);
});
if (!ctSrc.includes('function handleToolbarAction(') || !ctSrc.includes('function buildInsertHTML(')) {
  err('快捷排版处理函数缺失，行为可能被改掉');
}

// ③ 注入按钮：弹窗底部常驻，导入内容后不被 overflow:hidden 裁掉
if (!/\.modal-header \{ flex: 0 0 auto; \}/.test(PANEL_CSS) ||
    !/\.modal-footer \{ flex: 0 0 auto; background: #fff; \}/.test(PANEL_CSS)) {
  err('弹窗头部 / 底部没有固定为 flex: 0 0 auto，导入后注入按钮会被挤走');
}
const modalBodyRule = (PANEL_CSS.match(/\.modal-body \{[^}]*\}/) || [''])[0];
if (!/flex:\s*1 1 auto/.test(modalBodyRule) || !/min-height:\s*0/.test(modalBodyRule)) {
  err('弹窗中间区不能伸缩滚动，长内容会把底部注入按钮顶出可视区');
}
if (/max-height:\s*40vh/.test(modalBodyRule)) err('弹窗正文仍被 40vh 锁死，无法参与伸缩');
const importPreviewRule = (PANEL_CSS.match(/\.import-preview \{[^}]*\}/) || [''])[0];
if (!/min-height:\s*0/.test(importPreviewRule) || !/overflow-y:\s*auto/.test(importPreviewRule)) {
  err('导入预览区不能收缩，预览一出现就会撑破弹窗');
}
if (!PANEL_CSS.includes('#btnImportInsert.is-ready')) err('注入按钮缺少「已导入」就绪态');
if (!PANEL_CSS.includes('#di-import-preview-host')) err('预览隔离容器样式缺失');

// ④ 预览 CSS 隔离 + 状态复位：导入网页的 <style> 不能污染面板
if (!panelSrc.includes('attachShadow({ mode: \'open\' })')) err('导入预览未挂独立 shadow root，网页 CSS 会污染弹窗');
if (!panelSrc.includes("'di-import-preview-host'")) err('预览隔离宿主节点缺失');
if (!panelSrc.includes('function getPreviewShadow(')) err('预览隔离初始化逻辑缺失');
if (!panelSrc.includes("insertBtn.classList.add('is-ready')")) err('导入后未把注入按钮置为就绪态');
if (!panelSrc.includes("updatePreview('')")) err('重新打开导入弹窗时未复位预览 / 提示 / 按钮状态');
if (!PANEL_HTML.includes('id="btnImportInsert"')) err('注入按钮节点缺失');
if (!panelSrc.includes("getElementById('btnImportInsert').addEventListener")) err('注入按钮点击处理缺失');
// 注入链与导入预处理本身不能被这次 UI 改动碰到
if (!panelSrc.includes("{ action: 'directInsert', html: htmlContent, tabId: tab.id }")) {
  err('导入注入入口不再是备份版 directInsert 路径');
}
if (!panelSrc.includes('htmlContent = wrapHTMLContent(processHTMLContent(htmlContent));')) {
  err('导入预处理链被改动');
}

// ---------- 10e. 组件库悬停预览 / 常驻预览框已移除（4.7.0 新增） ----------
// ① 常驻预览框必须彻底消失：DOM、CSS、JS 调用三处都不能残留
if (PANEL_HTML.includes('data-di-section="实时预览"')) err('面板里又出现了常驻「实时预览」分区');
if (PANEL_HTML.includes('mainPreviewContent') || PANEL_HTML.includes('main-preview-content')) {
  err('常驻实时预览框的 DOM 仍在，组件库又被挤到滚动区下方');
}
if (PANEL_CSS.includes('.main-preview-content') || PANEL_CSS.includes('.main-preview-bar')) {
  err('常驻实时预览框的样式仍在');
}
if (panelSrc.includes('function showMainPreview(')) err('仍在往已删除的主区域预览框写内容');
if (ctSrc.includes('data-di-goto="实时预览"')) err('位置条仍保留已删除分区的「预览」芯片');
// ② 悬停预览：存在、预设内容、隔离、不抢焦点
['showHoverPreview', 'hideHoverPreview', 'scheduleHoverPreview', 'placeHoverPreview',
 'ensureHoverHost', 'HOVER_CSS', 'HOVER_CONTENT_CSS'].forEach((kw) => {
  if (!panelSrc.includes(kw)) err(`组件库悬停预览缺少逻辑: ${kw}`);
});
if (!panelSrc.includes("listEl.addEventListener('mouseover'")) err('组件卡片未绑定悬停进入事件');
if (!panelSrc.includes("listEl.addEventListener('mouseleave', hideHoverPreview)")) err('组件列表未绑定悬停离开收起');
if (!panelSrc.includes('realDoc.body.appendChild(host)')) {
  err('悬停浮层没有挂到真实 body，会被浮窗的 overflow:hidden 裁掉');
}
if (!panelSrc.includes("hoverRoot.getElementById('diHpContentHost').attachShadow")) {
  err('悬停预览内容缺少第二层 shadow root，组件 <style> 会污染面板');
}
if (!panelSrc.includes('pointer-events:none')) err('悬停浮层会抢鼠标事件，卡片点击会被打断');
if (!panelSrc.includes('DEEPINSIGHT_COMPONENTS.renderComponent(comp.id, {})')) {
  err('悬停预览没有用组件预设字段值渲染（预览内容必须是预设内容）');
}
// 4.8.1：悬停浮层仍缩略，但比例提到 90%；高度按视口自适应，不能退回 210px 封顶
if (!panelSrc.includes('transform: scale(.9)')) err('悬停预览缩略比例不是 4.8.1 的 90%');
if (/transform:\s*scale\(\.78\)/.test(panelSrc)) err('悬停预览仍是旧的 78% 缩放，内容偏小');
if (!/Math\.min\(480,\s*Math\.max\(280,/.test(panelSrc)) err('悬停预览高度上限未按视口自适应');
if (!/vh\s*\*\s*0\.55/.test(panelSrc)) err('悬停预览高度未随视口高度变化');
if (/Math\.min\(210,\s*Math\.max\(72,/.test(panelSrc)) err('悬停预览仍封顶 210px，长组件看不完整');
if (!panelSrc.includes('di-hp-clipped')) err('底部渐隐遮罩未改为仅内容溢出时显示');
if (!panelSrc.includes('hideHoverPreview();\n    var listEl')) {
  err('列表重渲染时没有收起悬停浮层，会对着已销毁的卡片定位');
}
if (!panelSrc.includes("addEventListener('scroll', hideHoverPreview")) {
  err('滚动时没有收起悬停浮层，浮层会与卡片位置错位');
}
// ③ 组件库标题与卡片 tooltip 要显式告诉用户「悬停看效果」
if (!PANEL_HTML.includes('悬停预览')) err('组件库标题没有提示悬停预览');
if (!panelSrc.includes('悬停看预设效果')) err('组件卡片 tooltip 没有提示悬停预览');
// ④ 调参弹窗里的预览仍在（它不是常驻框，Shift+点击调参要用）
if (!PANEL_HTML.includes('参数效果预览')) err('调参弹窗内的参数预览被误删');
if (!panelSrc.includes("getElementById('btnPreview').addEventListener")) err('调参弹窗「预览」按钮失效');

// ---------- 10f. 浮窗视口自适应高度（4.7.1 新增） ----------
// ① 浮窗高度必须由视口算出，不得再有 720px 之类的固定上限
const vtToolbarRule = (uiCss.match(/#di-floating-toolbar\s*\{[^}]*\}/) || [''])[0];
if (!/height:\s*calc\(100vh\s*-\s*var\(--di-toolbar-top\)/.test(vtToolbarRule)) {
  err('浮窗高度未用视口自适应算式 calc(100vh - top - bottom)');
}
if (/min\(\s*720px/.test(vtToolbarRule) || /(?:^|;)\s*height:\s*\d+px/m.test(vtToolbarRule)) {
  err('浮窗又出现固定高度上限，大屏无法随视口增高');
}
if (!/--di-toolbar-bottom/.test(vtToolbarRule) || !/min-height:\s*160px/.test(vtToolbarRule)) {
  err('浮窗缺少底部留白变量或矮视口保底高度');
}
if (/@media\s*\(max-height:\s*620px\)[\s\S]{0,200}height:/.test(uiCss)) {
  err('矮屏媒体查询又用固定 height 覆盖了视口自适应算式');
}
// ② 滚动仍只发生在唯一的 .di-tb-body，浮窗本身不能变成第二滚动容器
if (!/overflow:\s*hidden/.test(vtToolbarRule)) err('浮窗本身不再是 overflow:hidden，会出现第二条滚动');
const vtBodyRule = (uiCss.match(/#di-floating-toolbar \.di-tb-body\s*\{[^}]*\}/) || [''])[0];
if (!/overflow-y:\s*auto/.test(vtBodyRule) || !/min-height:\s*0/.test(vtBodyRule)) {
  err('唯一滚动容器 .di-tb-body 的伸缩/滚动规则被破坏');
}
const vtWrapRule = (uiCss.match(/#di-floating-toolbar \.di-scroll-wrap\s*\{[^}]*\}/) || [''])[0];
if (!/flex:\s*1/.test(vtWrapRule) || !/min-height:\s*0/.test(vtWrapRule)) {
  err('.di-scroll-wrap 不再随浮窗伸缩，滚动区高度无法自适应');
}
const vtCollapsedRule = (uiCss.match(/#di-floating-toolbar\.di-collapsed\s*\{[^}]*\}/) || [''])[0];
if (!/min-height:\s*0/.test(vtCollapsedRule)) {
  err('收起态未清除 160px 保底高度，32px 细把手会被撑成一条高柱');
}
// ③ JS 每次改 top 都要同步 CSS 变量，拖拽上界要给自适应高度留空间
if (!/function setToolbarTop\(px\)/.test(ctSrc)) err('缺少 top 同步函数，拖到中间后浮窗高度会错位');
if ((ctSrc.match(/root\.style\.top\s*=/g) || []).length > 2) {
  err('仍有绕过 setToolbarTop 直接写 top 的地方，CSS 变量会失步');
}
if (!/setProperty\('--di-toolbar-top'/.test(ctSrc)) err('未同步 --di-toolbar-top 变量');
if (!/vh\s*-\s*200/.test(ctSrc)) err('拖拽上界未给自适应高度预留空间，底部会溢出视口');

// ---------- 10g. 4.8.0 交互修复与易用性（防回归） ----------
// ① 收起态单击不再留下粘滞拖拽
if (!/pendingDragStart/.test(ctSrc)) err('收起态单击仍可能留下粘滞拖拽');
if (/setTimeout\(\s*function\s*\(\)\s*\{\s*beginDrag/.test(ctSrc)) {
  err('仍在用延迟 beginDrag，快速单击会让浮窗粘着鼠标走');
}
// ② resize 同时处理水平吸附与垂直越界
if (!/dockSide = null/.test(ctSrc)) err('中间态未标记未吸附，resize 会把浮窗弹回边缘');
if (!/setToolbarTop\(top\)/.test(ctSrc)) err('resize 未处理垂直越界，矮窗口下底部会溢出');
// ③ 快捷排版必须跟随编辑器所在文档读选区、执行命令，并转义选中文字
if (!/var target = findEditorTarget\(\);/.test(ctSrc) || !/var editorDoc = target \? target\.doc : document;/.test(ctSrc)) {
  err('快捷排版仍只读主文档，iframe 编辑器里选中文字改样式失效');
}
if (!/doc\.execCommand\('insertHTML'/.test(ctSrc)) err('样式命令仍作用在错误文档');
if (!/DI_SANITIZE\.escapeHtml\(rawText\)/.test(ctSrc)) err('选中文字拼进 HTML 前未转义');
// ④ 非法插槽索引必须回包，避免发送方挂起
if (!/sendResp\(\{ success: false \}\)/.test(ctSrc)) err('非法插槽索引不回包，发送方会一直等 reply');
// ⑤ 面板便利性与键盘可达
if (!/function resetLibraryScroll\(/.test(panelSrc)) err('搜索/切分类后未把结果滚回视口');
if (!/data-action="resetFilter"/.test(panelSrc)) err('空状态缺少一键清除筛选');
if (!/tabindex="0" role="button"/.test(panelSrc)) err('组件卡片不支持键盘聚焦');
if (!/e\.key === 'Enter'/.test(panelSrc)) err('组件卡片没有键盘插入路径');
if (!/childElementCount/.test(panelSrc)) err('分类切换仍重建标签栏，键盘焦点会丢失');
if (!/importFileName'\).style\.display = 'none'/.test(panelSrc)) err('手动改写 HTML 后文件名仍残留，误导内容来源');
if ((panelSrc.match(/pendingSlotIndex = -1;/g) || []).length < 4) err('待选插槽状态清理不完整，会填错快捷位');

// ---------- 11. 统计 ----------
let totalSize = 0;
function sizeWalk(dir) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const rel = path.join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) sizeWalk(rel);
    else totalSize += fs.statSync(path.join(ROOT, rel)).size;
  }
}
sizeWalk('.');

// ---------- 输出 ----------
console.log('=== 深维公众号组件库 · 自检报告 ===');
console.log(`版本        : ${manifest.version} (Chrome >= ${manifest.minimum_chrome_version || '未声明'})`);
console.log('窗口        : 页面浮窗（唯一入口 · 视口自适应 · 单一滚动流 · 常驻滚动轨 · 悬停预览高度自适应 · 卡片键盘可达）');
console.log(`注入方案    : 11-08 备份版原样（逐段插入）${BAK ? '，已逐字比对，基准 ' + path.basename(BAK) : '，仅关键字断言'}`);
console.log(`组件数量    : ${componentCount}`);
console.log(`JS 文件     : ${jsFiles.length} 个，语法检查 ${errors.some((e) => e.startsWith('JS 语法错误')) ? '有失败' : '全部通过'}`);
console.log(`资源引用    : manifest ${new Set(refs).size} 项 / HTML ${htmlRefs.length} 项`);
console.log(`打包体积    : ${(totalSize / 1024).toFixed(1)} KB`);
console.log('');
warnings.forEach((w) => console.log(`[WARN] ${w}`));
errors.forEach((e) => console.log(`[ERROR] ${e}`));
if (!errors.length) console.log('[OK] 全部关键检查通过');
console.log('');
process.exit(errors.length ? 1 : 0);
