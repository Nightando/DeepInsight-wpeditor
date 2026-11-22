// ============================================================
// 深维公众号组件库 · 页面浮窗统一面板
// 4.4.0：与快捷排版工具条整合为一套连贯界面（单一头部 / 单一滚动流 /
//   常驻位置条与可见滚动轨 / 常驻可读通知条），不再有第二套品牌头部。
//   组件库 / 预览 / 编辑 / 导入 HTML / 状态 / 插槽联动全部保留。
// 运行环境：content script（isolated world）。
//   · 用 Shadow DOM 隔离样式，避免与公众号页面互相污染
//   · 用局部 chrome / document 适配层复用原 sidepanel.js 主体逻辑
//   · 所有插入动作经 __DI_HOST 走 11-08 备份版注入链
// ============================================================
(function () {
  'use strict';

  var HOST = window.__DI_HOST;
  if (!HOST || !HOST.isTop || window.__DI_PANEL_READY__) return;
  window.__DI_PANEL_READY__ = true;

  var PANEL_HTML = "<div class=\"app\">\n\n    <!-- ① 快捷操作 + 连接状态：原两套界面的头部信息合并到唯一浮窗头部之下 -->\n    <section class=\"panel-section action-section\" data-di-section=\"快捷操作\" data-di-hint=\"导入网页 · 检测连接 · 定位组件库\">\n      <div class=\"section-head\">\n        <span class=\"section-title\">快捷操作</span>\n        <span class=\"section-meta\" id=\"appVersion\">组件版</span>\n      </div>\n      <div class=\"tool-bar\" role=\"toolbar\" aria-label=\"全局操作\">\n        <button class=\"tool-btn\" id=\"btnImportHTML\" title=\"导入 HTML 文件，原样注入公众号编辑器\"><span class=\"tool-ico\">📄</span>导入 HTML</button>\n        <button class=\"tool-btn\" id=\"btnSettings\" title=\"重新检测编辑器连接状态\"><span class=\"tool-ico\">⟳</span>检测状态</button>\n        <button class=\"tool-btn\" id=\"btnOpenSidePanel\" title=\"定位到组件库列表\"><span class=\"tool-ico\">⇥</span>组件库</button>\n      </div>\n      <div class=\"status-bar\" id=\"statusBar\">\n        <span class=\"status-dot\"></span>\n        <span class=\"status-text\">正在检测编辑器…</span>\n      </div>\n    </section>\n\n    <!-- ② 组件库：与快捷排版同处一条滚动流，不再自带第二层滚动。\n         4.7.0 起常驻「实时预览」框已移除，改为鼠标悬停卡片时弹出轻量预设预览，\n         让 66 个组件直接占满滚动区，不必先滚过一个空白框。 -->\n    <section class=\"panel-section library-section\" data-di-section=\"组件库\" data-di-hint=\"悬停看预设效果 · 点击即插入\">\n      <div class=\"section-head\">\n        <span class=\"section-title\">组件库</span>\n        <span class=\"section-meta\" id=\"componentCount\">66 个组件 · 悬停预览</span>\n      </div>\n\n      <div class=\"search-bar\">\n        <input type=\"text\" id=\"searchInput\" placeholder=\"搜索组件名称或描述，如：数据、金句、时间轴…\" class=\"search-input\">\n      </div>\n\n      <div class=\"category-tabs\" id=\"categoryTabs\">\n        <!-- 分类标签由 JS 动态生成 -->\n      </div>\n\n      <div class=\"component-list\" id=\"componentList\">\n        <!-- 组件卡片由 JS 动态生成 -->\n      </div>\n\n      <div class=\"list-end-meta\" id=\"footerVersion\">深维 DeepInsight · 公众号组件库</div>\n    </section>\n\n    <!-- 导入HTML弹窗：结构与 ID 完全保留 -->\n    <div class=\"modal\" id=\"importModal\" style=\"display:none;\">\n      <div class=\"modal-overlay\" data-close-import=\"1\"></div>\n      <div class=\"modal-content import-modal-content\">\n        <div class=\"modal-header\">\n          <span>📄 导入 HTML</span>\n          <button class=\"modal-close\" data-close-import=\"1\">×</button>\n        </div>\n        <div class=\"modal-body\">\n          <div class=\"import-file-area\" id=\"importFileArea\">\n            <div class=\"import-file-icon\">📁</div>\n            <div class=\"import-file-text\">点击选择 HTML 文件<br><small>或拖拽文件到此处</small></div>\n            <input type=\"file\" id=\"importFileInput\" accept=\".html,.htm\" style=\"display:none;\">\n          </div>\n          <div class=\"import-divider\">或直接粘贴 HTML 代码</div>\n          <textarea class=\"import-textarea\" id=\"importTextarea\" placeholder=\"在此粘贴 HTML 代码…\" rows=\"5\"></textarea>\n          <div class=\"import-file-name\" id=\"importFileName\" style=\"display:none;\"></div>\n        </div>\n        <div class=\"import-preview\" id=\"importPreview\" style=\"display:none;\">\n          <div class=\"import-preview-label\">✦ 预览效果 <span id=\"importPreviewHint\" style=\"font-weight:400;color:#7b8794;\">（展示网页原貌，仅剥离脚本）</span></div>\n          <div class=\"import-preview-content\" id=\"importPreviewContent\"></div>\n        </div>\n        <div class=\"modal-footer import-footer\">\n          <div class=\"import-note\">按旧版方案注入：保留 <code>&lt;style&gt;</code> 与全部样式，逐段插入编辑器</div>\n          <div class=\"import-actions\">\n            <button class=\"btn btn-secondary\" data-close-import=\"1\">取消</button>\n            <button class=\"btn btn-success\" id=\"btnImportInsert\" title=\"把导入的 HTML 按旧版方案逐段插入编辑器光标处\">⚡ 注入编辑器</button>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <!-- 组件编辑弹窗：合并弹窗版的「预览」按钮与弹窗内预览区 -->\n    <div class=\"modal\" id=\"editModal\" style=\"display:none;\">\n      <div class=\"modal-overlay\" data-close=\"1\"></div>\n      <div class=\"modal-content\">\n        <div class=\"modal-header\">\n          <span id=\"modalTitle\">编辑组件</span>\n          <button class=\"modal-close\" data-close=\"1\">×</button>\n        </div>\n        <div class=\"modal-body\" id=\"modalBody\">\n          <!-- 表单由 JS 动态生成 -->\n        </div>\n        <div class=\"modal-footer\">\n          <button class=\"btn btn-secondary\" data-close=\"1\">取消</button>\n          <button class=\"btn btn-primary\" id=\"btnPreview\">预览</button>\n          <button class=\"btn btn-success\" id=\"btnInsert\">⚡ 插入编辑器</button>\n        </div>\n        <div class=\"preview-area\" id=\"previewArea\" style=\"display:none;\">\n          <div class=\"preview-title\">参数效果预览</div>\n          <div class=\"preview-content\" id=\"previewContent\"></div>\n        </div>\n      </div>\n    </div>\n\n  </div>\n";
  var PANEL_CSS = "/* ============================================================\n   深维公众号组件库 · 统一浮窗面板\n   与 content.css 共用同一套色板 / 分区标题 / 按钮语言。\n   不再自带品牌头部，不再自带第二层纵向滚动：整窗只有一条滚动流。\n   ============================================================ */\n\n:host {\n  --di-navy: #0d2540;\n  --di-navy-2: #1a3d5f;\n  --di-mint: #b2d9c4;\n  --di-green: #10b981;\n  --di-green-d: #0d8160;\n  --di-ink: #2b3440;\n  --di-grey: #7b8794;\n  --di-line: #e6ebf0;\n  --di-bg: #f4f7f9;\n  display: block;\n}\n\n* { box-sizing: border-box; margin: 0; padding: 0; }\n\n#di-panel-root {\n  position: relative;\n  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;\n  color: var(--di-ink);\n  font-size: 13px;\n  line-height: 1.6;\n  background: transparent;\n}\n/* 外层浮窗 user-select:none，这里恢复，否则输入框与文本域无法选中文字 */\n#di-panel-root, #di-panel-root * { user-select: text !important; }\n\n.app { display: block; }\n\n/* ===== 统一分区：与快捷排版块完全相同的留白与分隔 ===== */\n.panel-section {\n  padding: 10px 14px 12px;\n  background: #fff;\n  border-bottom: 1px solid var(--di-line);\n}\n.panel-section:last-of-type { border-bottom: none; }\n\n.section-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  margin-bottom: 9px;\n}\n.section-title {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 11px;\n  font-weight: 800;\n  letter-spacing: 1px;\n  color: var(--di-navy);\n}\n.section-title::before {\n  content: '';\n  width: 3px;\n  height: 12px;\n  border-radius: 2px;\n  background: var(--di-mint);\n}\n.section-meta { font-size: 10px; color: #98a4b0; }\n\n/* 当前分区：轻微强调，静态与滚动中一致 */\n.panel-section.di-section-active .section-title { color: var(--di-navy-2); }\n.panel-section.di-section-active .section-title::before { background: var(--di-green); }\n\n/* ===== ① 快捷操作 ===== */\n.tool-bar { display: flex; gap: 6px; }\n.tool-btn {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 4px;\n  padding: 7px 4px;\n  font-size: 11px;\n  font-weight: 700;\n  color: var(--di-navy);\n  background: var(--di-bg);\n  border: 1px solid #e2e8ee;\n  border-radius: 6px;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: background .2s, border-color .2s, color .2s, transform .15s;\n}\n.tool-btn:hover { background: #e6f1ec; border-color: var(--di-mint); transform: translateY(-1px); }\n.tool-btn:active { background: var(--di-navy); color: #fff; }\n.tool-ico { font-size: 13px; line-height: 1; }\n\n.status-bar {\n  margin-top: 8px;\n  padding: 6px 9px;\n  background: var(--di-bg);\n  border: 1px solid #e6ecf1;\n  border-left: 3px solid #d8dfe6;\n  border-radius: 5px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 10.5px;\n  color: #5f6d7c;\n}\n.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #f5a623; flex-shrink: 0; }\n.status-dot.ready { background: var(--di-green); }\n.status-dot.error { background: #ef4444; animation: pulse 1.5s infinite; }\n@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }\n\n/* 4.7.0：常驻「实时预览」框已移除，组件库直接跟在快捷操作之后。\n   悬停预览浮层挂在浮窗之外的真实 document.body 上（独立 shadow root），\n   因此它的样式由 panel.js 自带，不写在这里，也不会污染面板或公众号页面。 */\n\n/* ===== ② 组件库 ===== */\n.search-bar { padding-bottom: 8px; }\n.search-input {\n  width: 100%;\n  padding: 7px 12px;\n  border: 1px solid #e2e8ee;\n  border-radius: 14px;\n  font-size: 11.5px;\n  outline: none;\n  background: var(--di-bg);\n  font-family: inherit;\n  transition: all .2s;\n}\n.search-input:focus {\n  border-color: var(--di-navy);\n  background: #fff;\n  box-shadow: 0 0 0 3px rgba(13, 37, 64, .08);\n}\n\n.category-tabs {\n  display: flex;\n  gap: 5px;\n  padding: 2px 0 9px;\n  overflow-x: auto;\n  scrollbar-width: none;\n}\n.category-tabs::-webkit-scrollbar { display: none; }\n.tab-btn {\n  flex-shrink: 0;\n  padding: 4px 10px;\n  background: var(--di-bg);\n  border: 1px solid #e2e8ee;\n  border-radius: 11px;\n  font-size: 10.5px;\n  cursor: pointer;\n  color: #65758a;\n  transition: all .2s;\n  white-space: nowrap;\n}\n.tab-btn:hover { background: #e6f1ec; color: var(--di-navy); }\n.tab-btn.active { background: var(--di-navy); color: #fff; border-color: var(--di-navy); font-weight: 700; }\n\n/* 无独立滚动：所有卡片与快捷排版同处 #di-tb-body 这一条滚动流 */\n.component-list { display: block; overflow: visible; max-height: none; }\n\n.component-card {\n  position: relative;\n  background: #fbfcfd;\n  border: 1px solid #e9eef2;\n  border-radius: 8px;\n  padding: 9px 10px 10px;\n  margin-bottom: 8px;\n  cursor: pointer;\n  transition: background .2s, border-color .2s, box-shadow .2s, transform .15s;\n}\n.component-card:hover {\n  background: #f1f7f5;\n  border-color: var(--di-mint);\n  transform: translateY(-1px);\n  box-shadow: 0 2px 8px rgba(0, 0, 0, .07);\n}\n.component-card:active { transform: scale(.995); }\n/* 当前正在滚动到的那一条：用内阴影标记，不改变盒模型尺寸，滚动中不会跳动 */\n.component-card.di-card-current {\n  background: #f2f9f5;\n  border-color: var(--di-green);\n  box-shadow: inset 3px 0 0 var(--di-green), 0 2px 8px rgba(16, 185, 129, .12);\n}\n\n.card-header { display: flex; align-items: center; gap: 8px; }\n.card-head-main { flex: 1; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }\n.card-icon {\n  width: 26px; height: 26px;\n  background: var(--di-navy); color: #fff;\n  border-radius: 6px;\n  display: flex; align-items: center; justify-content: center;\n  font-size: 12px; font-weight: 700; flex-shrink: 0;\n}\n.card-title { font-size: 12.5px; font-weight: 700; color: var(--di-ink); }\n.card-category {\n  display: inline-block;\n  background: #eaf5ef; color: #1a5c3f;\n  font-size: 9px; padding: 1px 6px; border-radius: 3px;\n}\n.card-desc { font-size: 10.5px; color: var(--di-grey); line-height: 1.5; margin: 4px 0 0; }\n\n/* 卡片上唯一的按钮：固定到浮窗「快捷」插槽。插入正文靠点击整张卡片。 */\n.mini-btn {\n  padding: 3px 10px;\n  font-size: 11px;\n  border-radius: 5px;\n  cursor: pointer;\n  border: 1px solid #dfe5ec;\n  background: #fff;\n  color: #5a6a7a;\n  transition: all .2s;\n  font-weight: 600;\n  white-space: nowrap;\n}\n.mini-btn:hover { background: var(--di-navy); color: #fff; border-color: var(--di-navy); }\n.mini-btn.pin {\n  flex-shrink: 0;\n  font-size: 10px; font-weight: 700;\n  padding: 3px 10px; border-radius: 11px;\n  background: #f2ebf7; color: #3a1a5a; border-color: #d5c4e0;\n}\n.mini-btn.pin:hover { background: #3a1a5a; color: #fff; border-color: #3a1a5a; }\n\n/* 编辑器里有选中文字时，分区标题右侧明确提示「点一下就套样式」 */\n.section-meta.has-selection { color: var(--di-green-d); font-weight: 700; }\n\n.empty-state { text-align: center; padding: 30px 14px; color: #98a4b0; font-size: 11.5px; }\n.empty-state-icon { font-size: 30px; margin-bottom: 8px; }\n.empty-reset { margin-top: 10px; padding: 5px 14px; border: 1px solid var(--di-mint); border-radius: 6px; background: #fff; color: var(--di-green-d); font-size: 11px; cursor: pointer; }\n.empty-reset:hover { border-color: var(--di-green); background: #eef9f4; }\n.component-card:focus-visible { outline: 2px solid var(--di-green); outline-offset: 1px; }\n\n.list-end-meta {\n  margin-top: 4px;\n  padding: 8px 2px 2px;\n  text-align: center;\n  font-size: 9.5px;\n  color: #a7b2be;\n  border-top: 1px dashed #e6ebf0;\n}\n\n/* ===== 弹窗：定位由 panel.js 按浮窗矩形设置，始终盖住整窗 ===== */\n.modal {\n  position: fixed;\n  left: 0; top: 0; width: 100vw; height: 100vh;\n  z-index: 10000000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 12px;\n}\n.modal-overlay { position: absolute; inset: 0; background: rgba(9, 22, 38, .55); }\n/* 4.6.0：头部与底部常驻、中间可伸缩滚动。\n   旧版所有子项都是 flex-shrink:0，导入内容后预览撑高，底部「注入编辑器」\n   被 overflow:hidden 裁到容器外，看得见一半且点不到。这里把中间区改成\n   可伸缩，footer 永远 flex:0 0 auto 钉在底部。 */\n.modal-content {\n  position: relative;\n  background: #fff;\n  border-radius: 10px;\n  width: 100%;\n  max-height: 90%;\n  display: flex;\n  flex-direction: column;\n  box-shadow: 0 12px 40px rgba(0, 0, 0, .3);\n  overflow: hidden;\n}\n.modal-header { flex: 0 0 auto; }\n.modal-footer { flex: 0 0 auto; background: #fff; }\n.modal-header {\n  padding: 11px 13px;\n  background: var(--di-navy);\n  color: #fff;\n  font-weight: 700;\n  font-size: 12.5px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-shrink: 0;\n}\n.modal-close {\n  background: none; border: none; color: #fff; font-size: 22px;\n  cursor: pointer; line-height: 1; padding: 0; width: 26px; height: 26px; border-radius: 4px;\n}\n.modal-close:hover { background: rgba(255, 255, 255, .15); }\n.modal-body { padding: 12px 13px; overflow-y: auto;\n  flex: 1 1 auto; min-height: 0;\n  scrollbar-width: thin; scrollbar-color: #9fb2c4 #eef2f6; }\n.modal-body::-webkit-scrollbar { width: 8px; }\n.modal-body::-webkit-scrollbar-track { background: #eef2f6; }\n.modal-body::-webkit-scrollbar-thumb { background: #9fb2c4; border-radius: 4px; }\n\n.form-group { margin-bottom: 10px; }\n.form-label { display: block; font-size: 11px; color: #5f6d7c; margin-bottom: 3px; font-weight: 700; }\n.form-input, .form-textarea, .form-color {\n  width: 100%;\n  padding: 6px 9px;\n  border: 1px solid #dfe5ec;\n  border-radius: 5px;\n  font-size: 11.5px;\n  outline: none;\n  transition: border-color .2s;\n  font-family: inherit;\n}\n.form-input:focus, .form-textarea:focus { border-color: var(--di-navy); }\n.form-textarea { resize: vertical; min-height: 54px; line-height: 1.6; }\n.form-color-wrapper { display: flex; gap: 6px; align-items: center; }\n.form-color { width: 36px; height: 30px; padding: 1px; cursor: pointer; border-radius: 5px; }\n.form-color-text { flex: 1; }\n\n.modal-footer {\n  padding: 10px 13px;\n  border-top: 1px solid #e9eef2;\n  display: flex;\n  justify-content: flex-end;\n  gap: 6px;\n  flex-wrap: wrap;\n  flex-shrink: 0;\n}\n.btn {\n  padding: 6px 14px;\n  border-radius: 5px;\n  font-size: 11.5px;\n  font-weight: 700;\n  cursor: pointer;\n  border: none;\n  transition: all .2s;\n}\n.btn-secondary { background: var(--di-bg); color: #5f6d7c; border: 1px solid #dfe5ec; }\n.btn-secondary:hover { background: #e6ebf0; }\n.btn-primary { background: var(--di-navy); color: #fff; }\n.btn-primary:hover { background: var(--di-navy-2); }\n.btn-success { background: var(--di-green); color: #fff; }\n.btn-success:hover { background: var(--di-green-d); }\n\n.preview-area {\n  border-top: 1px solid #e9eef2;\n  padding: 10px 13px;\n  background: var(--di-bg);\n  flex: 0 1 auto;\n  min-height: 0;\n  max-height: 220px;\n  overflow-y: auto;\n}\n.preview-title { font-size: 11px; color: var(--di-grey); margin-bottom: 6px; font-weight: 700; }\n.preview-content {\n  background: #fff; padding: 10px; border-radius: 6px;\n  border: 1px solid #e2e8ee; max-height: 150px; overflow-y: auto;\n  font-size: 11.5px; line-height: 1.6;\n}\n\n/* ===== 导入 HTML 弹窗 ===== */\n.import-file-area {\n  border: 2px dashed var(--di-mint);\n  border-radius: 8px;\n  padding: 18px 14px;\n  text-align: center;\n  cursor: pointer;\n  transition: all .3s;\n  margin-bottom: 12px;\n  background: #fafcfd;\n}\n.import-file-area:hover { background: #f1f7f5; border-color: var(--di-navy); }\n.import-file-area.dragover { background: #eaf7f0; border-color: var(--di-green); }\n.import-file-icon { font-size: 36px; margin-bottom: 6px; }\n.import-file-text { font-size: 12.5px; color: #5f6d7c; }\n.import-file-text small { font-size: 10.5px; color: #98a4b0; }\n.import-divider { text-align: center; position: relative; height: 1px; background: #e9eef2; margin: 16px 0; }\n.import-divider::before {\n  content: '或'; display: inline-block; background: #fff; color: #98a4b0;\n  font-size: 11.5px; padding: 0 14px; position: relative; top: -10px;\n}\n.import-textarea {\n  width: 100%; padding: 10px; border: 1px solid #dfe5ec; border-radius: 7px;\n  font-size: 11.5px; font-family: monospace; line-height: 1.5;\n  resize: vertical; min-height: 96px; margin-bottom: 10px;\n}\n.import-file-name { font-size: 11.5px; color: var(--di-grey); margin-top: 8px; text-align: center; }\n.import-preview { margin-top: 10px; padding: 9px; border: 1px solid #e9eef2; border-radius: 7px;\n  background: #fafcfd; flex: 0 1 auto; min-height: 0; overflow-y: auto; }\n.import-preview-label { font-size: 11.5px; color: var(--di-navy); font-weight: 700; margin-bottom: 7px; display: block; }\n.import-preview-content {\n  max-height: 180px; overflow-y: auto; padding: 8px; background: #fff;\n  border-radius: 5px; border: 1px solid #e9eef2;\n  scrollbar-width: thin; scrollbar-color: #9fb2c4 #eef2f6;\n}\n.import-footer { flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }\n.import-note { font-size: 10px; color: #8c98a6; line-height: 1.4; }\n.import-note code { font-family: inherit; color: var(--di-green-d); }\n.import-actions { display: flex; justify-content: flex-end; gap: 6px; flex-shrink: 0; }\n/* 4.6.0：注入按钮常驻可用，导入完成后给一个明确的高亮态，不会被预览挤走 */\n#btnImportInsert { flex-shrink: 0; position: relative; z-index: 1; }\n#btnImportInsert.is-ready { box-shadow: 0 0 0 2px rgba(16, 185, 129, .28); }\n/* 预览挂一层独立 shadow root，导入网页的 <style> 只作用于预览内部，\n   不会把整个面板 / 弹窗 / 注入按钮的样式改掉 */\n#di-import-preview-host { display: block; width: 100%; }\n\n/* 面板内部不再生成 toast；保留样式作为极端兜底，避免误用旧类名时不可读 */\n.toast {\n  position: absolute; top: 6px; left: 8px; right: 8px;\n  background: var(--di-navy); color: #fff;\n  padding: 8px 12px; border-radius: 6px;\n  font-size: 11.5px; font-weight: 600;\n  z-index: 10000; white-space: normal; word-break: break-word;\n  transform: none;\n}\n.toast.error { background: #c0392b; }\n.toast.info { background: var(--di-navy); }\n";

  var realDoc = document;
  var realChrome = window.chrome;
  var shadow = null;
  var inner = null;

  function mount() {
    var toolbar = realDoc.getElementById('di-floating-toolbar');
    var bodyEl = toolbar && toolbar.querySelector('#di-tb-body');
    if (!bodyEl) return false;
    if (realDoc.getElementById('di-panel-host')) return true;

    var hostEl = realDoc.createElement('div');
    hostEl.id = 'di-panel-host';
    bodyEl.insertBefore(hostEl, bodyEl.firstChild);

    shadow = hostEl.attachShadow({ mode: 'open' });
    var style = realDoc.createElement('style');
    style.textContent = PANEL_CSS;
    shadow.appendChild(style);

    inner = realDoc.createElement('div');
    inner.id = 'di-panel-root';
    inner.innerHTML = PANEL_HTML;
    shadow.appendChild(inner);
    return true;
  }

  function buildContext() {
    // document 代理：把原 sidepanel.js 里所有 DOM 查询限定到 Shadow DOM 内，
    // createElement / execCommand / addEventListener 仍走真实 document。
    var doc = new Proxy(realDoc, {
      get: function (t, k) {
        if (k === 'body') return inner;
        if (k === 'getElementById') return function (id) { return shadow.getElementById(id); };
        if (k === 'querySelector') return function (s) { return inner.querySelector(s); };
        if (k === 'querySelectorAll') return function (s) { return inner.querySelectorAll(s); };
        if (k === 'addEventListener') return function (type, fn, opt) {
          // visibilitychange 是文档级事件；其余绑到面板内部，避免事件被 retarget
          if (type === 'visibilitychange' || type === 'DOMContentLoaded') return t.addEventListener(type, fn, opt);
          return inner.addEventListener(type, fn, opt);
        };
        var v = t[k];
        return typeof v === 'function' ? v.bind(t) : v;
      }
    });

    // chrome 适配层：content script 没有 tabs / scripting / sidePanel，
    // 全部映射到 __DI_HOST 提供的页面内能力，其余 API 保持原生。
    var chrome = {
      runtime: realChrome.runtime,
      storage: realChrome.storage,
      tabs: {
        query: function (q, cb) { HOST.queryActiveTab(cb); },
        sendMessage: function (tabId, msg, a, b) {
          var cb = (typeof a === 'function') ? a : ((typeof b === 'function') ? b : null);
          HOST.sendMessage(msg, cb);
        }
      },
      scripting: {
        executeScript: function (opts, cb) {
          HOST.ensureInjected(function () { if (cb) cb(); });
        }
      },
      sidePanel: {
        open: function () { HOST.focusLibrary(); return Promise.resolve(); }
      }
    };

    window.__DI_PANEL_CTX = { chrome: chrome, document: doc, host: HOST, root: shadow };
  }

  function INIT_PANEL_BODY() {
    var chrome = window.__DI_PANEL_CTX.chrome;
    var document = window.__DI_PANEL_CTX.document;

  const CATEGORIES = {
    'all': '全部',
    'text': '文本段落',
    'box': '信息框',
    'data': '数据展示',
    'layout': '布局分隔',
    'tag': '标签',
    'quote': '引用金句',
    'list': '列表序号',
    'qa': '问答教程',
    'timeline': '时间轴',
    'media': '图片媒体',
    'divider': '分隔装饰',
    'end': '结尾模块'
  };

  let currentCategory = 'all';
  let currentComponent = null;
  let currentTab = null;
  let editorStatusChecked = false;
  let pendingSlotIndex = -1;  // 待选择的插槽索引（-1 表示无待选）

  function cleanHTML(html) {
    return window.DI_SANITIZE ? window.DI_SANITIZE.clean(html) : html;
  }

  // 导入 HTML 预览用：只去脚本，保留 link / meta / style / @import / 全部结构与样式
  function minimalHTML(html) {
    return window.DI_SANITIZE ? window.DI_SANITIZE.minimal(html) : html;
  }

  // ---------- 初始化 ----------
  function init() {
    // 版本统一从 manifest 读取，避免升级时多处硬编码不一致
    const ver = chrome.runtime.getManifest().version;
    const total = DEEPINSIGHT_COMPONENTS.list.length;
    const versionEl = document.getElementById('appVersion');
    if (versionEl) versionEl.textContent = 'v' + ver + ' · ' + total + ' 组件';
    const footerEl = document.getElementById('footerVersion');
    if (footerEl) footerEl.textContent = '深维 DeepInsight · 共 ' + total + ' 个组件 · v' + ver;
    const countEl = document.getElementById('componentCount');
    if (countEl) countEl.textContent = total + ' 个组件 · 悬停预览 · 点击即插入';
    renderCategoryTabs();
    renderComponentList();
    bindEvents();
    bindMessageListener();
    // 延迟检测，等 content script 完全加载
    setTimeout(checkEditorStatus, 800);
    notifyUIChanged();
  }

  // ---------- 监听来自 content script 的消息 ----------
  function bindMessageListener() {
    chrome.runtime.onMessage.addListener(function (req, sender, sendResp) {
      if (req && req.action === 'startSlotSelect' && req.slotIndex !== undefined) {
        pendingSlotIndex = parseInt(req.slotIndex);
        if (!isNaN(pendingSlotIndex) && pendingSlotIndex >= 0 && pendingSlotIndex < 3) {
          showToast('请在组件列表中点击「快捷」按钮选择组件', 'info');
        }
        if (sendResp) sendResp({ ok: true });
        return true;
      }
      return false;
    });
  }

  // ---------- 获取当前活动 Tab ----------
  function getActiveTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
        currentTab = tabs[0];
        callback(tabs[0]);
      } else {
        callback(null);
      }
    });
  }

  // ---------- 检测编辑器状态 ----------
  // notify=true 时把探测结果同时写进常驻通知条，点击「检测状态」一定看得到反馈。
  function setStatus(state, text) {
    var dotEl = document.querySelector('.status-dot');
    var textEl = document.querySelector('.status-text');
    if (dotEl) dotEl.className = 'status-dot' + (state === 'ready' ? ' ready' : (state === 'error' ? ' error' : ''));
    if (textEl) textEl.textContent = text;
    // 镜像到浮窗头部（滚动区之外，任何位置都可见）
    try {
      var headDot = realDoc.getElementById('di-conn-dot');
      var headText = realDoc.getElementById('di-conn-text');
      if (headDot) headDot.className = 'di-conn-dot' + (state === 'ready' ? ' ready' : (state === 'error' ? ' error' : ''));
      if (headText) headText.textContent = state === 'ready' ? '已连接' : (state === 'error' ? '未连接' : '检测中');
    } catch (e) {}
  }

  function checkEditorStatus(notify) {
    getActiveTab(function (tab) {
      if (!tab) {
        setStatus('error', '无法获取当前页面');
        if (notify) showToast('检测失败：无法获取当前页面', 'error');
        return;
      }
      if (!tab.url || tab.url.indexOf('mp.weixin.qq.com') === -1) {
        setStatus('error', '请先打开公众号编辑页面');
        if (notify) showToast('检测失败：当前不是公众号编辑页面', 'error');
        return;
      }
      // 真实探测 content script 是否在线，不再仅凭 URL 判断
      chrome.tabs.sendMessage(tab.id, { action: 'ping' }, { frameId: 0 }, function (r) {
        if (chrome.runtime.lastError || !r || !r.success) {
          setStatus('error', '未检测到编辑器脚本，请刷新公众号页面');
          editorStatusChecked = false;
          if (notify) showToast('检测结果：未连接编辑器，请刷新公众号页面', 'error');
          return;
        }
        setStatus('ready', '✓ 就绪 v' + r.version + ' · 点击组件即可插入');
        editorStatusChecked = true;
        if (notify) {
          // 4.8.0：一次检测只给一条反馈，不再连弹两条把通知条占满
          showToast('✓ 已连接编辑器 v' + r.version + '，点击组件卡片即可插入', 'success');
        }
      });
    });
  }

  // ---------- 渲染分类 ----------
  function renderCategoryTabs() {
    var tabsEl = document.getElementById('categoryTabs');
    // 4.8.0：首次才建 DOM，之后只切 active，避免键盘焦点随重建一起丢失
    if (tabsEl.childElementCount) {
      Array.prototype.forEach.call(tabsEl.querySelectorAll('.tab-btn'), function (btn) {
        btn.classList.toggle('active', btn.dataset.category === currentCategory);
      });
      return;
    }
    var html = '';
    Object.keys(CATEGORIES).forEach(function (cat) {
      html += '<button class="tab-btn' + (cat === currentCategory ? ' active' : '') + '" data-category="' + cat + '">' + CATEGORIES[cat] + '</button>';
    });
    tabsEl.innerHTML = html;
  }

  // 4.8.0：搜索/切分类后把组件库滚回视口顶部，避免列表变短后停在半截
  function resetLibraryScroll() {
    var scrollBody = realDoc.getElementById('di-tb-body');
    var section = inner && inner.querySelector('.library-section');
    if (!scrollBody || !section) return;
    try {
      var sr = section.getBoundingClientRect();
      var br = scrollBody.getBoundingClientRect();
      scrollBody.scrollTop += sr.top - br.top;
    } catch (e) {}
  }

  // ---------- 渲染组件列表 ----------
  function renderComponentList(resetScroll) {
    hideHoverPreview();
    var listEl = document.getElementById('componentList');
    var searchText = (document.getElementById('searchInput').value || '').trim().toLowerCase();

    var components = DEEPINSIGHT_COMPONENTS.list;

    if (currentCategory !== 'all') {
      components = components.filter(function (c) { return c.category === currentCategory; });
    }
    if (searchText) {
      components = components.filter(function (c) {
        return (c.name && c.name.toLowerCase().includes(searchText)) ||
               (c.description && c.description.toLowerCase().includes(searchText));
      });
    }

    if (components.length === 0) {
      // 4.8.0：区分「分类限制」与「关键词没命中」，并给一键清除入口
      var why = currentCategory !== 'all'
        ? '「' + (CATEGORIES[currentCategory] || currentCategory) + '」分类' +
          (searchText ? '下没有匹配「' + searchText + '」的组件' : '下暂无组件')
        : '未找到匹配「' + searchText + '」的组件';
      listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">∅</div>' +
        '<div>' + why + '</div>' +
        '<button type="button" class="empty-reset" data-action="resetFilter">清除筛选</button></div>';
      resetLibraryScroll();
      refreshSelectionHint();
      notifyUIChanged();
      return;
    }

    var html = '';
    components.forEach(function (comp) {
      html += '<div class="component-card" tabindex="0" role="button" data-id="' + comp.id + '" title="悬停看预设效果 · 点击或 Enter 即插入 · 有选中文字则套用该样式 · Shift+点击或 Shift+Enter 调参数">' +
                '<div class="card-header">' +
                  '<div class="card-icon">' + (comp.icon || '◆') + '</div>' +
                  '<div class="card-head-main">' +
                    '<span class="card-title">' + comp.name + '</span>' +
                    '<span class="card-category">' + (CATEGORIES[comp.category] || '组件') + '</span>' +
                  '</div>' +
                  '<button class="mini-btn pin" data-action="pinToToolbar" data-id="' + comp.id + '" title="固定到浮窗「快捷」插槽">快捷</button>' +
                '</div>' +
                '<div class="card-desc">' + (comp.description || '') + '</div>' +
              '</div>';
    });
    listEl.innerHTML = html;
    refreshSelectionHint();
    if (resetScroll) resetLibraryScroll();
    notifyUIChanged();
  }

  // ---------- 4.5.0 组件卡片：点击即插入正文 ----------
  // · 编辑器里有选中文字 → 把选中文字填进组件的正文字段，整段替换选区
  // · 没有选中文字 → 按组件默认值插到当前光标位置
  // · Shift+点击 → 打开参数弹窗（原「编辑」按钮的能力，不再占按钮位）
  // 插入仍走 doDirectInsert → 备份版注入链，不改写任何 HTML。

  var TEXT_SKIP_RE = /^(src|url|href|emoji|icon|count|number|num\d*|stat\d*|value\d*|date\d*|words|author|editor|columns|centerchar|\w*color)$/i;
  var LABEL_SKIP_RE = /颜色|链接|地址|尺寸|数量|个数|日期|字数|编号/;

  // 组件的「正文字段」= 第一个输入项；但纯数据 / 图片 / 分隔类组件的首个字段
  // 不是正文（数字、链接、图标、颜色），这类组件只按默认值插入，不吞选中文字。
  function pickPrimaryTextField(comp) {
    if (!comp || !comp.fields || !comp.fields.length) return null;
    var first = comp.fields[0];
    if (!first) return null;
    if (first.type === 'textarea') return first;
    if (first.type !== 'text') return null;
    if (TEXT_SKIP_RE.test(first.name || '')) return null;
    if (LABEL_SKIP_RE.test(first.label || '')) return null;
    return first;
  }

  // 组件字段是直接拼进 HTML 的，选中文字里的 < > & 必须转义，换行转 <br>
  function textToFieldValue(text) {
    var esc = window.DI_SANITIZE ? window.DI_SANITIZE.escapeHtml(text) : String(text);
    return esc.replace(/\r\n|\r|\n/g, '<br>');
  }

  function readEditorSelection() {
    var host = window.__DI_HOST;
    if (!host || typeof host.readSelection !== 'function') return null;
    try { return host.readSelection(); } catch (e) { return null; }
  }

  // 组件库标题右侧的实时提示：有选区时明确告诉用户「点一下就是套样式」
  function refreshSelectionHint() {
    var el = document.getElementById('componentCount');
    if (!el) return;
    var total = DEEPINSIGHT_COMPONENTS.list.length;
    var sel = readEditorSelection();
    var n = (sel && sel.ok && sel.inEditor && sel.text) ? sel.text.replace(/\s/g, '').length : 0;
    if (n > 0) {
      el.textContent = '已选中 ' + n + ' 字 · 点击组件套用样式';
      el.classList.add('has-selection');
    } else {
      el.textContent = total + ' 个组件 · 悬停预览 · 点击即插入';
      el.classList.remove('has-selection');
    }
  }

  function insertCardToEditor(componentId, evt) {
    var comp = DEEPINSIGHT_COMPONENTS.getById(componentId);
    if (!comp) return;

    // Shift+点击：调参数（原来「编辑」按钮做的事）
    if (evt && evt.shiftKey) { openEditModal(componentId); return; }

    var sel = readEditorSelection();
    var selText = (sel && sel.ok && sel.inEditor && sel.text) ? sel.text.replace(/^\s+|\s+$/g, '') : '';
    var field = selText ? pickPrimaryTextField(comp) : null;
    var values = {};
    var replacedChars = 0;
    if (field) {
      values[field.name] = textToFieldValue(selText);
      replacedChars = selText.replace(/\s/g, '').length;
    }

    // 把焦点交还编辑器：有替换就保留选区（execCommand 会用组件替换这段文字）；
    // 组件不带正文字段时把选区收成光标，避免误删用户选中的内容。
    try {
      if (window.__DI_HOST && window.__DI_HOST.restoreEditorFocus) {
        window.__DI_HOST.restoreEditorFocus(!field && !!selText);
      }
    } catch (e) {}

    // 4.7.0：常驻预览框已移除，点击后收起悬停浮层并短暂抑制重复弹出
    hideHoverPreview();
    suppressHover(450);

    doDirectInsert(componentId, values, function (ok) {
      if (!ok) return;
      if (replacedChars > 0) {
        showToast('✓ 已用「' + comp.name + '」样式替换选中文字（' + replacedChars + ' 字）', 'success');
      } else if (selText) {
        showToast('✓ 「' + comp.name + '」已插到光标处 · 该组件无正文字段，选中文字未改动', 'info');
      } else {
        showToast('✓ 「' + comp.name + '」已插到光标处', 'success');
      }
      refreshSelectionHint();
    }, { silent: true });
  }

  // ---------- 添加到悬浮窗自定义组件 ----------
  function pinComponentToToolbar(componentId) {
    var comp = DEEPINSIGHT_COMPONENTS.getById(componentId);
    if (!comp) return;

    // 读取当前悬浮窗的自定义组件配置
    chrome.storage.local.get(['di_custom_toolbar'], function (result) {
      var customList = (result && result.di_custom_toolbar && Array.isArray(result.di_custom_toolbar))
                        ? result.di_custom_toolbar.slice(0, 3) : [null, null, null];
      while (customList.length < 3) customList.push(null);

      // 构建要存储的组件信息（精简版，仅含 id/name/icon/fieldValues）
      var compData = {
        id: comp.id,
        name: comp.name,
        icon: comp.icon || '◆',
        fieldValues: {}
      };

      // 如果正有待选择的插槽（从悬浮窗点击空插槽触发），优先填入该插槽
      if (pendingSlotIndex >= 0 && pendingSlotIndex < 3) {
        var slotNum = pendingSlotIndex;
        customList[slotNum] = compData;
        pendingSlotIndex = -1;
        showToast('✓ 「' + comp.name + '」已固定到快捷插槽 ' + (slotNum + 1), 'success');
      } else {
        // 找第一个空插槽
        var filled = false;
        for (var i = 0; i < 3; i++) {
          if (!customList[i] || !customList[i].id) {
            customList[i] = compData;
            filled = true;
            showToast('✓ 「' + comp.name + '」已固定到快捷区', 'success');
            break;
          }
        }
        if (!filled) {
          // 所有插槽都满了，替换第一个
          var oldName = (customList[0] && customList[0].name) || '组件';
          customList[0] = compData;
          showToast('快捷区已满，已替换「' + oldName + '」为「' + comp.name + '」', 'info');
        }
      }

      // 保存到 storage
      chrome.storage.local.set({ di_custom_toolbar: customList }, function () {
        // 通知 content script 刷新悬浮窗
        getActiveTab(function (tab) {
          if (tab) {
            chrome.tabs.sendMessage(tab.id, { action: 'refreshCustomSlots' }, { frameId: 0 }, function () {
              if (chrome.runtime.lastError) { /* 页面未注入 content script，忽略 */ }
            });
          }
        });
      });
    });
  }

  // ---------- 复制 HTML 到剪贴板（核心方法） ----------
  function copyToClipboard(html, compName, callback) {
    // 方案 1: ClipboardItem（支持富文本 HTML，优先）
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        var blob = new Blob([html], { type: 'text/html' });
        var plain = window.DI_SANITIZE ? window.DI_SANITIZE.plainText(html) : html;
        var clipboardItem = new ClipboardItem({
          'text/html': blob,
          'text/plain': new Blob([plain], { type: 'text/plain' })
        });
        navigator.clipboard.write([clipboardItem]).then(function () {
          showToast('✓ 「' + compName + '」已复制到剪贴板', 'success');
          showToast('↩ 在编辑器中按 Ctrl+V 粘贴', 'info');
          if (callback) callback(true);
        }).catch(function (e) {
          console.warn('[深维] ClipboardItem 失败:', e);
          fallbackCopy(html, compName, callback);
        });
        return;
      } catch (e) {
        console.warn('[深维] ClipboardItem 创建失败:', e);
      }
    }

    // 方案 2: 纯文本写入（几乎所有浏览器都支持）
    fallbackCopy(html, compName, callback);

    function fallbackCopy(text, name, cb) {
      // 创建临时 textarea 写入纯文本（微信编辑器会保留 HTML 标签）
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(textarea);

      if (ok) {
        showToast('✓ 「' + name + '」已复制', 'success');
        showToast('↩ 在编辑器中按 Ctrl+V 粘贴', 'info');
      } else {
        // 降级：复制按钮触发 selectall 让用户手动 Ctrl+C
        var sel = window.getSelection();
        var range = document.createRange();
        var pre = document.getElementById('_copyPreview');
        if (!pre) {
          pre = document.createElement('pre');
          pre.id = '_copyPreview';
          pre.style.cssText = 'position:fixed;top:0;left:0;width:800px;max-height:400px;overflow:auto;background:white;padding:16px;border:2px solid #10b981;border-radius:8px;z-index:99999;font-size:12px;line-height:1.6;word-break:break-all;';
          document.body.appendChild(pre);
        }
        pre.textContent = text;
        range.selectNodeContents(pre);
        sel.removeAllRanges();
        sel.addRange(range);
        showToast('⚠ 已选中 HTML，请 Ctrl+C 复制，再 Ctrl+V 粘贴', 'info');
        setTimeout(function () {
          if (pre.parentNode) pre.parentNode.removeChild(pre);
        }, 5000);
      }
      if (cb) cb(ok);
    }
  }

  // ---------- 打开编辑弹窗（含弹窗版「预览」区与「一键插入」模式） ----------
  function openEditModal(componentId, insertMode) {
    var comp = DEEPINSIGHT_COMPONENTS.getById(componentId);
    if (!comp) return;
    currentComponent = comp;

    document.getElementById('modalTitle').textContent = comp.name;
    var modalBody = document.getElementById('modalBody');

    if (comp.fields.length === 0) {
      modalBody.innerHTML = '<div style="text-align:center;padding:16px 10px;color:#7a7a7a;font-size:12px;line-height:1.7;">该组件无需配置<br>点击下方按钮<span style="color:#10b981;font-weight:700;">直接插入</span>到编辑器</div>';
      // 弹窗内的「参数效果预览」保留；常驻预览框已在 4.7.0 移除
      hideHoverPreview();
      showPreviewForComp(comp);
      if (insertMode === 'direct') {
        doDirectInsert(componentId, {}, function (ok) {
          if (ok) setTimeout(closeModal, 600);
        });
      } else if (insertMode === 'quick') {
        insertToEditorFull();
      }
    } else {
      var formHtml = '';
      comp.fields.forEach(function (field) {
        formHtml += '<div class="form-group">';
        formHtml += '<label class="form-label">' + field.label + '</label>';
        if (field.type === 'textarea') {
          formHtml += '<textarea class="form-textarea" data-field="' + field.name + '" rows="3">' + (field.default != null ? field.default : '') + '</textarea>';
        } else if (field.type === 'color') {
          formHtml += '<div class="form-color-wrapper">' +
                        '<input type="color" class="form-color" data-field="' + field.name + '" value="' + (field.default || '#0d2540') + '">' +
                        '<input type="text" class="form-input form-color-text" data-field-text="' + field.name + '" value="' + (field.default || '#0d2540') + '">' +
                      '</div>';
        } else if (field.type === 'number') {
          formHtml += '<input type="number" class="form-input" data-field="' + field.name + '" value="' + (field.default != null ? field.default : '') + '">';
        } else {
          formHtml += '<input type="text" class="form-input" data-field="' + field.name + '" value="' + (field.default != null ? field.default : '') + '">';
        }
        formHtml += '</div>';
      });
      modalBody.innerHTML = formHtml;

      // 有字段时预览区默认收起，点「预览」或改动表单再展开
      document.getElementById('previewArea').style.display = 'none';
      hideHoverPreview();
      var inputs = modalBody.querySelectorAll('input, textarea');
      inputs.forEach(function (input) {
        input.addEventListener('input', liveUpdatePreview);
      });

      if (insertMode === 'direct') {
        setTimeout(function () {
          doDirectInsert(comp.id, {}, function (ok) {
            if (ok) setTimeout(closeModal, 600);
          });
        }, 100);
      } else if (insertMode === 'quick') {
        insertToEditorFull();
      }
    }

    openModal('editModal');
  }

  function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    currentComponent = null;
    // 4.8.0：弹窗结束即清掉待选插槽，避免下次点「快捷」填进旧索引
    pendingSlotIndex = -1;
  }

  // ---------- 弹窗内预览（合并自原弹窗版） ----------
  function showModalPreview(comp, values) {
    var html = DEEPINSIGHT_COMPONENTS.renderComponent(comp.id, values || {});
    document.getElementById('previewContent').innerHTML = cleanHTML(html);
    document.getElementById('previewArea').style.display = 'block';
  }

  function showPreviewForComp(comp) {
    showModalPreview(comp, {});
  }

  function onPreviewButton() {
    if (!currentComponent) return;
    showModalPreview(currentComponent, readFieldValues());
  }

  // ---------- 读取表单 ----------
  function readFieldValues() {
    if (!currentComponent) return {};
    var values = {};
    currentComponent.fields.forEach(function (field) {
      var input = document.querySelector('[data-field="' + field.name + '"]');
      values[field.name] = input ? input.value : field.default;
    });
    return values;
  }

  // ============================================================
  // 4.7.0 组件库悬停预览
  // 常驻「实时预览」框已移除：它占掉一整块滚动流，且插入前一直空着。
  // 现在鼠标悬停卡片时弹出轻量浮层，内容固定为组件的「预设内容」
  // （各字段默认值渲染结果），不读取编辑器选区，避免误以为预览就是插入结果。
  //
  // 三层隔离，缺一不可：
  //   · 浮层挂在真实 document.body：浮窗是 overflow:hidden 的 flex 列，
  //     放内部会被裁切，也会挤占唯一那条滚动流。
  //   · 浮层自身 shadow root：公众号页面 CSS 与面板 CSS 都进不来。
  //   · 内容再套一层 shadow root：组件自带 <style> 只作用于预览内容，
  //     不会把浮层标题/底栏或整个面板改样式（4.6.0 导入预览同一结论）。
  // pointer-events:none + 全程不改焦点，编辑器选区与点击插入行为不受影响。
  // ============================================================
  var HOVER_W = 320;
  var hoverHost = null;
  var hoverRoot = null;
  var hoverContentRoot = null;
  var hoverTimer = null;
  var hoverCardId = null;
  var hoverSuppressUntil = 0;

  var HOVER_CSS = `<style>
    :host { display: block; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .di-hp {
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: #fff; color: #2b3440;
      border: 1px solid #cfdae5; border-radius: 10px;
      box-shadow: 0 12px 34px rgba(13, 37, 64, .22);
      overflow: hidden;
    }
    .di-hp-head {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      padding: 8px 11px; background: #0d2540; color: #fff;
    }
    .di-hp-name { font-size: 12px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .di-hp-badge {
      flex-shrink: 0; font-size: 9px; font-weight: 700; letter-spacing: .5px;
      padding: 2px 7px; border-radius: 9px; background: #b2d9c4; color: #0d2540;
    }
    .di-hp-frame {
      position: relative; background: #fff;
      padding: 10px 12px; height: 320px; overflow: hidden;
    }
    /* 只有内容真的超出上限时才显示底部渐隐，完整显示时不遮住末尾内容 */
    .di-hp-frame.di-hp-clipped::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 24px;
      background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,.94));
      pointer-events: none;
    }
    .di-hp-foot {
      padding: 6px 11px 8px; border-top: 1px solid #e6ebf0; background: #f7fafc;
      color: #7b8794; font-size: 9.5px; line-height: 1.5;
    }
  </style>`;

  // 组件预设内容缩到 90%（原 78%），更接近原尺寸；高度已按视口放宽，长组件也能看完整
  var HOVER_CONTENT_CSS = `<style>
    * { box-sizing: border-box; }
    .di-hp-scale {
      transform: scale(.9); transform-origin: 0 0; width: 111.2%;
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 13px; line-height: 1.7; color: #2b3440; background: #fff;
      word-break: break-word;
    }
  </style>`;

  function ensureHoverHost() {
    if (hoverHost && hoverHost.isConnected) return true;
    var host = realDoc.createElement('div');
    host.id = 'di-hover-preview-host';
    host.setAttribute('data-di-hover-preview', '1');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + HOVER_W + 'px;' +
      'z-index:2147483000;pointer-events:none;opacity:0;visibility:hidden;' +
      'transition:opacity .12s ease;';
    try { hoverRoot = host.attachShadow({ mode: 'open' }); }
    catch (e) { return false; }
    hoverRoot.innerHTML = HOVER_CSS +
      '<div class="di-hp">' +
        '<div class="di-hp-head">' +
          '<span class="di-hp-name" id="diHpName"></span>' +
          '<span class="di-hp-badge">预设内容</span>' +
        '</div>' +
        '<div class="di-hp-frame"><div id="diHpContentHost"></div></div>' +
        '<div class="di-hp-foot">组件默认文案的缩略效果 · 点击卡片才真正插入 · Shift+点击可调参数</div>' +
      '</div>';
    hoverContentRoot = null;
    try {
      hoverContentRoot = hoverRoot.getElementById('diHpContentHost').attachShadow({ mode: 'open' });
    } catch (e) {}
    realDoc.body.appendChild(host);
    hoverHost = host;
    return true;
  }

  function hideHoverPreview() {
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
    hoverCardId = null;
    if (hoverHost) {
      hoverHost.style.opacity = '0';
      hoverHost.style.visibility = 'hidden';
    }
  }

  function placeHoverPreview(cardRect) {
    var winEl = realDoc.getElementById('di-floating-toolbar');
    var wr = winEl ? winEl.getBoundingClientRect() : null;
    var vw = window.innerWidth, vh = window.innerHeight;
    var left;
    // 优先放在浮窗左侧，不遮住卡片；空间不够再放右侧，最后才退化到浮窗内
    if (wr && wr.left - HOVER_W - 12 >= 8) left = wr.left - HOVER_W - 12;
    else if (wr && wr.right + HOVER_W + 12 <= vw - 8) left = wr.right + 12;
    else left = Math.max(8, Math.min((wr ? wr.right : cardRect.right) - HOVER_W - 14, vw - HOVER_W - 8));
    var h = hoverHost.getBoundingClientRect().height || 380;
    var top = Math.max(10, Math.min(cardRect.top - 24, vh - h - 10));
    hoverHost.style.left = Math.round(left) + 'px';
    hoverHost.style.top = Math.round(top) + 'px';
  }

  function showHoverPreview(card) {
    var comp = DEEPINSIGHT_COMPONENTS.getById(card.dataset.id);
    if (!comp || !ensureHoverHost()) return;
    hoverCardId = card.dataset.id;

    // 一律用组件自带的预设字段值，不掺入编辑器选中的文字
    var html = cleanHTML(DEEPINSIGHT_COMPONENTS.renderComponent(comp.id, {}));
    hoverRoot.getElementById('diHpName').textContent = comp.name;
    if (hoverContentRoot) {
      hoverContentRoot.innerHTML = HOVER_CONTENT_CSS + '<div class="di-hp-scale">' + html + '</div>';
    } else {
      hoverRoot.getElementById('diHpContentHost').innerHTML = html;
    }

    // 4.8.1：高度按视口自适应，不再封顶 210px。
    // 上限取约半屏、封顶 480px，矮屏收到底 280px；短组件仍按内容收起不留白。
    // 只在内容确实超出上限时挂 di-hp-clipped 显示底部渐隐，完整显示时不遮末尾内容。
    var vh = window.innerHeight;
    var maxH = Math.min(480, Math.max(280, Math.round(vh * 0.55)));
    var frame = hoverRoot.querySelector('.di-hp-frame');
    if (frame && hoverContentRoot) {
      var scaleEl = hoverContentRoot.querySelector('.di-hp-scale');
      var innerH = scaleEl ? scaleEl.getBoundingClientRect().height : maxH;
      frame.style.height = Math.round(Math.min(maxH, Math.max(88, innerH + 24))) + 'px';
      if (frame.classList) frame.classList.toggle('di-hp-clipped', innerH + 24 > maxH);
    }

    // 先隐藏测高再定位，保证贴近屏幕上下边缘时也不会被截断
    hoverHost.style.visibility = 'hidden';
    hoverHost.style.opacity = '0';
    hoverHost.style.left = '0px';
    hoverHost.style.top = '0px';
    placeHoverPreview(card.getBoundingClientRect());
    hoverHost.style.visibility = 'visible';
    hoverHost.style.opacity = '1';
  }

  // 点击插入 / 打开弹窗后浏览器会因焦点与布局变化重新派发一次 mouseover，
  // 短暂抑制，避免浮层刚收起就弹回来盖住弹窗。
  function suppressHover(ms) { hoverSuppressUntil = Date.now() + (ms || 450); }

  function modalIsOpen() {
    var editM = document.getElementById('editModal');
    var importM = document.getElementById('importModal');
    return (editM && editM.style.display === 'flex') || (importM && importM.style.display === 'flex');
  }

  function scheduleHoverPreview(card) {
    if (Date.now() < hoverSuppressUntil || modalIsOpen()) return;
    if (hoverTimer) clearTimeout(hoverTimer);
    var host = hoverHost;
    if (host) { host.style.opacity = '0'; host.style.visibility = 'hidden'; }
    hoverCardId = card.dataset.id;
    hoverTimer = setTimeout(function () {
      hoverTimer = null;
      if (!card || !card.isConnected) return;
      showHoverPreview(card);
    }, 130);
  }

  // 调参弹窗内的预览仍随表单实时刷新（与主区域预览框无关）
  function liveUpdatePreview(e) {
    if (!currentComponent) return;
    // 4.8.0：颜色文本框把值同步到拾色器的逻辑绑在 document 冒泡阶段，
    // 本函数在 target 阶段先跑，会读到上一次的旧颜色。这里先自己同步一次。
    var target = e && e.target;
    if (target && target.getAttribute && target.getAttribute('data-field-text')) {
      var fieldName = target.getAttribute('data-field-text');
      var picker = document.querySelector('[data-field="' + fieldName + '"]');
      if (picker && /^#([0-9a-fA-F]{3}){1,2}$/.test(target.value)) picker.value = target.value;
    }
    var values = readFieldValues();
    var area = document.getElementById('previewArea');
    if (area && area.style.display !== 'none') showModalPreview(currentComponent, values);
  }

  // ---------- 直接插入到编辑器（主流程） ----------
  // 降级链合并了两个旧窗口：
  //   1 background → scripting   2 content script
  //   2.5 content script 未注入时主动 executeScript 注入后重试（原弹窗版能力）
  //   3 剪贴板
  function doDirectInsert(componentId, fieldValues, callback, opts) {
    var comp = DEEPINSIGHT_COMPONENTS.getById(componentId);
    if (!comp) { if (callback) callback(false); return; }
    var values = fieldValues || {};
    var html = cleanHTML(DEEPINSIGHT_COMPONENTS.renderComponent(componentId, values));
    var compName = comp.name;
    // 卡片点击插入的提示由调用方给出（带「替换了 N 字」等上下文），这里不再重复弹
    var silent = !!(opts && opts.silent);
    function okToast(text) { if (!silent) showToast(text, 'success'); }

    function finishClipboard() {
      copyToClipboard(html, compName, function () {});
      showToast('直接插入失败，已复制到剪贴板，Ctrl+V 粘贴', 'info');
      if (callback) callback(false);
    }

    function retryAfterInject(tabId) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['shared/sanitize.js', 'components/components.js', 'content/content.js']
      }, function () {
        if (chrome.runtime.lastError) { finishClipboard(); return; }
        setTimeout(function () {
          chrome.tabs.sendMessage(tabId, { action: 'insertHTML', html: html }, { frameId: 0 }, function (r3) {
            if (r3 && r3.success) {
              okToast('✓ 「' + compName + '」已插入编辑器');
              if (callback) callback(true);
            } else {
              finishClipboard();
            }
          });
        }, 300);
      });
    }

    getActiveTab(function (tab) {
      if (!tab) { if (callback) callback(false); return; }
      if (!tab.url || tab.url.indexOf('mp.weixin.qq.com') === -1) {
        showToast('请先打开公众号编辑页面', 'info');
        if (callback) callback(false);
        return;
      }

      // 策略1：优先走 background → chrome.scripting.executeScript 直接注入
      chrome.runtime.sendMessage({ action: 'directInsert', html: html, tabId: tab.id }, function (resp) {
        if (resp && resp.success) {
          okToast('✓ 「' + compName + '」已直接插入编辑器');
          if (callback) callback(true);
          return;
        }
        // 策略2：回退到 content script
        chrome.tabs.sendMessage(tab.id, { action: 'insertHTML', html: html }, { frameId: 0 }, function (r2) {
          if (r2 && r2.success) {
            okToast('✓ 「' + compName + '」已插入编辑器');
            if (callback) callback(true);
            return;
          }
          // 策略2.5：content script 未注入 → 主动注入后重试
          if (chrome.runtime.lastError || !r2) {
            retryAfterInject(tab.id);
            return;
          }
          // 策略3：最后兜底剪贴板
          finishClipboard();
        });
      });
    });
  }

  // ---------- 一键插入（原弹窗版四级降级链，行为完整保留） ----------
  function insertToEditorFull() {
    if (!currentComponent) return;
    var values = readFieldValues();
    var html = cleanHTML(DEEPINSIGHT_COMPONENTS.renderComponent(currentComponent.id, values));
    var compId = currentComponent.id;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || !tabs[0]) { showToast('无法获取当前标签页', 'error'); return; }
      var tab = tabs[0];
      if (!tab.url || tab.url.indexOf('mp.weixin.qq.com') === -1) {
        showToast('请在微信公众号编辑器页面使用', 'info');
        return;
      }

      chrome.runtime.sendMessage({ action: 'directInsert', html: html, tabId: tab.id }, function (resp) {
        if (resp && resp.success) {
          showToast('✓ 已直接插入到编辑器', 'success');
          closeModal();
          return;
        }
        chrome.tabs.sendMessage(tab.id, {
          action: 'insertHTML', html: html, componentId: compId
        }, { frameId: 0 }, function (response) {
          if (response && response.success) {
            showToast('✓ 已插入到编辑器', 'success');
            closeModal();
            return;
          }
          if (chrome.runtime.lastError || !response) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['shared/sanitize.js', 'components/components.js', 'content/content.js']
            }, function () {
              if (chrome.runtime.lastError) {
                showToast('插件权限不足，请检查扩展设置', 'error');
                return;
              }
              setTimeout(function () {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'insertHTML', html: html, componentId: compId
                }, { frameId: 0 }, function (r3) {
                  if (r3 && r3.success) {
                    showToast('✓ 已插入到编辑器', 'success');
                    closeModal();
                  } else {
                    fallbackToClipboard(html);
                  }
                });
              }, 300);
            });
            return;
          }
          fallbackToClipboard(html);
        });
      });
    });
  }

  // 原弹窗版剪贴板降级：ClipboardItem 富文本 + text/plain
  function fallbackToClipboard(html) {
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      var blobHtml = new Blob([html], { type: 'text/html' });
      var plainText = stripHTML(html);
      var blobText = new Blob([plainText], { type: 'text/plain' });
      navigator.clipboard.write([
        new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })
      ]).then(function () {
        showToast('直接插入失败，已复制到剪贴板，Ctrl+V 粘贴', 'info');
      }).catch(function () {
        showToast('插入失败，请刷新编辑器页面', 'error');
      });
      return;
    }
    showToast('插入失败，请刷新编辑器页面', 'error');
  }

  function stripHTML(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  // 原弹窗版「复制 HTML 源码」：writeText 纯文本 + execCommand 兜底
  function copyComponentHTML(componentId) {
    var comp = DEEPINSIGHT_COMPONENTS.getById(componentId);
    if (!comp) return;
    var html = cleanHTML(DEEPINSIGHT_COMPONENTS.renderComponent(componentId, {}));

    function fallbackCopy(text) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('✓ 已复制 HTML 源码', 'success');
      } catch (e) {
        showToast('复制失败，请手动选择', 'error');
      }
      document.body.removeChild(textarea);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(function () {
        showToast('✓ 已复制 HTML 源码到剪贴板', 'success');
      }).catch(function () { fallbackCopy(html); });
      return;
    }
    fallbackCopy(html);
  }

  // ---------- 复制到剪贴板（降级方案） ----------
  function doClipboardInsertById(componentId) {
    var comp = DEEPINSIGHT_COMPONENTS.getById(componentId);
    if (!comp) return;
    var html = cleanHTML(DEEPINSIGHT_COMPONENTS.renderComponent(componentId, {}));
    copyToClipboard(html, comp.name, function () {
      showToast('已复制「' + comp.name + '」，Ctrl+V 粘贴', 'info');
    });
  }

  // ---------- 默认：直接插入到编辑器（由 currentComponent 触发） ----------
  function doDefaultInsert() {
    var comp = currentComponent;
    if (!comp) return;
    var values = readFieldValues();
    doDirectInsert(comp.id, values, function (ok) {
      if (ok) {
        setTimeout(closeModal, 600);
      }
    });
  }

  // ---------- 复制纯 HTML ----------
  function copyPureHTML(componentId) {
    var comp = DEEPINSIGHT_COMPONENTS.getById(componentId);
    if (!comp) return;
    var html = cleanHTML(DEEPINSIGHT_COMPONENTS.renderComponent(componentId, {}));
    copyToClipboard(html, comp.name);
  }

  // ---------- 弹窗定位：始终覆盖整个浮窗，不受当前滚动位置影响 ----------
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    hideHoverPreview();
    suppressHover(600);
    try {
      var win = realDoc.getElementById('di-floating-toolbar');
      if (win) {
        var r = win.getBoundingClientRect();
        m.style.position = 'fixed';
        m.style.left = r.left + 'px';
        m.style.top = r.top + 'px';
        m.style.width = r.width + 'px';
        m.style.height = r.height + 'px';
        m.style.zIndex = '10000000';
      }
    } catch (e) {}
    m.style.display = 'flex';
    notifyUIChanged();
  }

  // ---------- 通知：统一交给浮窗内常驻通知条 ----------
  // 旧实现把 .toast 放在 Shadow 根里，同时带 translateX(-50%) 与 left/right，
  // 文字被推出可视区，只剩一条空色块；且位于滚动流内，滚动后看不见。
  function showToast(message, type) {
    if (window.__DI_NOTICE && window.__DI_NOTICE.push(message, type)) return;
    // 浮窗尚未挂载时的兜底：仍在面板内，但去掉位移与截断
    var box = document.getElementById('di-panel-root');
    if (!box) return;
    var t = realDoc.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.textContent = String(message == null ? '' : message);
    box.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  }

  function notifyUIChanged() {
    try { window.dispatchEvent(new CustomEvent('di:ui-changed')); } catch (e) {}
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    // 分类切换
    document.getElementById('categoryTabs').addEventListener('click', function (e) {
      var btn = e.target.closest('.tab-btn');
      if (!btn) return;
      currentCategory = btn.dataset.category;
      renderCategoryTabs();
      renderComponentList(true);
    });

    // 搜索
    document.getElementById('searchInput').addEventListener('input', function () {
      renderComponentList(true);
    });

    // 组件库：点击卡片 = 插入正文；卡片上只保留一个「快捷」按钮
    var listEl = document.getElementById('componentList');

    // 关键：在列表上按下鼠标时不转移焦点，编辑器里的光标 / 选区才不会被清掉，
    // 随后 execCommand('insertHTML') 才能落在原位置、并替换掉选中的文字。
    listEl.addEventListener('mousedown', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
    }, true);

    listEl.addEventListener('pointerenter', function () { refreshSelectionHint(); });

    // 4.7.0 悬停预览：只在换卡片时刷新，同卡内移动不重建、不抢焦点
    listEl.addEventListener('mouseover', function (e) {
      var card = e.target && e.target.closest ? e.target.closest('.component-card') : null;
      if (!card) return;
      if (card.dataset.id !== hoverCardId) scheduleHoverPreview(card);
    });
    listEl.addEventListener('mouseout', function (e) {
      var card = e.target && e.target.closest ? e.target.closest('.component-card') : null;
      if (!card) return;
      var to = e.relatedTarget;
      if (to && to.closest && card.contains(to)) return;  // 还在同一张卡内
      hideHoverPreview();
    });
    listEl.addEventListener('mouseleave', hideHoverPreview);
    var scrollBody = realDoc.getElementById('di-tb-body');
    if (scrollBody) scrollBody.addEventListener('scroll', hideHoverPreview, { passive: true });

    listEl.addEventListener('click', function (e) {
      // 4.8.0：先处理空态的「清除筛选」，不能落进下面通用的 data-action 分支
      if (e.target.closest('[data-action="resetFilter"]')) {
        document.getElementById('searchInput').value = '';
        currentCategory = 'all';
        renderCategoryTabs();
        renderComponentList(true);
        return;
      }
      // 「快捷」按钮：固定到浮窗插槽，不触发插入
      var btn = e.target.closest('[data-action]');
      if (btn) {
        e.stopPropagation();
        if (btn.dataset.action === 'pinToToolbar') pinComponentToToolbar(btn.dataset.id);
        return;
      }
      // 卡片其余位置：直接插入到编辑器光标处（有选中文字则套用样式替换）
      var card = e.target.closest('.component-card');
      if (card) {
        // 4.8.0：放弃了插槽待选时，普通插入不该再被旧索引截走
        pendingSlotIndex = -1;
        insertCardToEditor(card.dataset.id, e);
      }
    });

    // 4.8.0：组件卡片键盘可达。Enter / 空格 = 插入，Shift+Enter = 调参，
    // 与鼠标点击 / Shift+点击一一对应。
    listEl.addEventListener('keydown', function (e) {
      if (e.target.closest('[data-action]')) return;
      var card = e.target.closest('.component-card');
      if (!card) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        pendingSlotIndex = -1;
        insertCardToEditor(card.dataset.id, e);
      }
    });

    // 弹窗关闭
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) closeModal();
    });

    // 编辑弹窗「插入编辑器」
    document.getElementById('btnInsert').addEventListener('click', function () {
      doDefaultInsert();
    });

    // 编辑弹窗「预览」（合并自原弹窗版）
    document.getElementById('btnPreview').addEventListener('click', onPreviewButton);

    // 颜色选择器与文本框同步
    document.addEventListener('input', function (e) {
      var colorField = e.target.getAttribute && e.target.getAttribute('data-field-text');
      if (colorField) {
        var picker = document.querySelector('[data-field="' + colorField + '"]');
        if (picker && /^#([0-9a-fA-F]{3}){1,2}$/.test(e.target.value)) {
          picker.value = e.target.value;
        }
      }
      var pickerField = e.target.getAttribute && e.target.getAttribute('data-field');
      if (pickerField && e.target.type === 'color') {
        var text = document.querySelector('[data-field-text="' + pickerField + '"]');
        if (text) text.value = e.target.value;
      }
    });

    // 定位组件库：统一入口后改为滚动到组件列表
    var focusBtn = document.getElementById('btnOpenSidePanel');
    if (focusBtn) {
      focusBtn.addEventListener('click', function () {
        getActiveTab(function (tab) {
          if (!tab) return;
          if (!chrome.sidePanel || !chrome.sidePanel.open) {
            showToast('请在浮窗内的组件库中操作', 'info');
            return;
          }
          Promise.resolve(chrome.sidePanel.open({ tabId: tab.id })).catch(function () {
            showToast('请点击浏览器右上角「深维」图标', 'info');
          });
        });
        checkEditorStatus();
      });
    }

    // ESC 关闭当前打开的弹窗
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (document.getElementById('editModal').style.display === 'flex') closeModal();
      if (document.getElementById('importModal').style.display === 'flex') {
        document.getElementById('importModal').style.display = 'none';
      }
    });

    // 刷新按钮
    document.getElementById('btnSettings').addEventListener('click', function () {
      editorStatusChecked = false;
      // 4.8.0：状态栏已经显示「正在检测」，不再往通知条塞一条，
      // 否则一次点击会先弹「正在检测」再弹结果，占满常驻通知区。
      setStatus('pending', '正在检测编辑器…');
      checkEditorStatus(true);
    });

    // 页面切回时重新检测
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        setTimeout(checkEditorStatus, 500);
      }
    });
  }

  // 导入HTML功能
  document.getElementById('btnImportHTML').addEventListener('click', function () {
    openModal('importModal');
    // 重置模态框内容
    document.getElementById('importTextarea').value = '';
    document.getElementById('importFileName').style.display = 'none';
    document.getElementById('importFileInput').value = '';
    // 4.6.0：走统一状态函数，顺带把「已导入 N KB」提示与按钮高亮复位，
    // 保证反复打开弹窗时注入按钮始终处于正常可点状态。
    updatePreview('');
    document.getElementById('importFileArea').classList.remove('dragover');
  });

  // 文件上传区域点击事件
  document.getElementById('importFileArea').addEventListener('click', function () {
    document.getElementById('importFileInput').click();
  });

  // 文件选择事件
  document.getElementById('importFileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      handleHTMLFile(file);
    }
  });

  // 拖拽上传功能
  const dropArea = document.getElementById('importFileArea');
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    dropArea.classList.add('dragover');
  }
  
  function unhighlight() {
    dropArea.classList.remove('dragover');
  }
  
  dropArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt && dt.files;
    if (files && files.length) {
      handleHTMLFile(files[0]);
    }
  }

  // 处理HTML文件
  function handleHTMLFile(file) {
    if (!file.name.match(/\.(html|htm)$/i)) {
      showToast('请选择有效的HTML文件', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('文件超过 2MB，请精简后再导入', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function (e) {
      const htmlContent = e.target.result;
      document.getElementById('importTextarea').value = htmlContent;
      document.getElementById('importFileName').textContent = file.name;
      document.getElementById('importFileName').style.display = 'block';
      updatePreview(htmlContent);
    };
    reader.onerror = function () {
      showToast('文件读取失败', 'error');
    };
    reader.readAsText(file);
  }

  // 实时更新预览
  document.getElementById('importTextarea').addEventListener('input', function () {
    const htmlContent = this.value;
    // 4.8.0：手动改写内容后，文件名不再代表正在注入的内容，隐藏以免误导
    const nameEl = document.getElementById('importFileName');
    if (nameEl) nameEl.style.display = 'none';
    updatePreview(htmlContent);
  });

  // 预览：展示网页原貌，只剥离脚本类标签与事件属性，
  // 保留 link / meta / style / @import / svg / class / 全部内联样式。
  // 4.6.0：预览放进一层独立 shadow root。导入的网页常带全局 <style>，
  // 直接 innerHTML 到面板里会作用于整个 Shadow DOM，网页里的 button /
  // footer / section 重置可能把注入按钮改样式、盖掉甚至隐藏。独立根让网页
  // 样式只影响预览本身，弹窗与按钮始终按插件自己的 CSS 渲染。
  var previewShadow = null;
  function getPreviewShadow() {
    if (previewShadow) return previewShadow;
    var box = document.getElementById('importPreviewContent');
    if (!box) return null;
    box.textContent = '';
    var host = realDoc.createElement('div');
    host.id = 'di-import-preview-host';
    box.appendChild(host);
    try { previewShadow = host.attachShadow({ mode: 'open' }); }
    catch (e) { previewShadow = null; }
    return previewShadow;
  }

  function updatePreview(html) {
    var previewBox = document.getElementById('importPreview');
    var hintEl = document.getElementById('importPreviewHint');
    var insertBtn = document.getElementById('btnImportInsert');
    if (typeof html === 'string' && html.trim()) {
      var root = getPreviewShadow();
      var safe = minimalHTML(html);
      if (root) root.innerHTML = safe;
      else document.getElementById('importPreviewContent').innerHTML = safe;
      previewBox.style.display = 'block';
      if (hintEl) {
        hintEl.textContent = '（已导入 ' + (html.length / 1024).toFixed(1) +
          ' KB · 点「⚡ 注入编辑器」插入）';
      }
      // 导入完成后注入按钮必须可见、可点，不受预览高度影响
      if (insertBtn) {
        insertBtn.disabled = false;
        insertBtn.style.display = '';
        insertBtn.classList.add('is-ready');
      }
    } else {
      if (previewShadow) previewShadow.innerHTML = '';
      previewBox.style.display = 'none';
      if (hintEl) hintEl.textContent = '（展示网页原貌，仅剥离脚本）';
      if (insertBtn) insertBtn.classList.remove('is-ready');
    }
  }

  // 处理HTML内容以确保样式兼容性和结构完整性
  // 核心修复：保留原始段落分段结构，为每个块级段落添加CSS作用域隔离
  function processHTMLContent(html) {
    const parser = document.createElement('div');
    parser.innerHTML = html;
    
    // 收集全局样式标签，稍后重新注入
    const globalStyles = [];
    const styleTags = parser.querySelectorAll('style');
    styleTags.forEach(st => {
      globalStyles.push(st.outerHTML);
      st.remove();
    });
    
    // 定义块级元素标签集合
    const BLOCK_TAGS = new Set([
      'div', 'p', 'section', 'article', 'aside', 'header', 'footer',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
      'blockquote', 'pre', 'hr', 'br',
      'figure', 'figcaption', 'main', 'nav', 'details', 'summary',
      'fieldset', 'legend', 'form'
    ]);
    
    // 内联元素标签集合（这些不应被拆分到独立段落）
    const INLINE_TAGS = new Set([
      'span', 'a', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
      'sub', 'sup', 'small', 'mark', 'code', 'kbd', 'samp', 'var',
      'abbr', 'cite', 'q', 'dfn', 'time', 'label', 'br', 'wbr',
      'img', 'picture', 'svg', 'video', 'audio', 'canvas', 'map',
      'input', 'select', 'textarea', 'button', 'output'
    ]);
    
    // 移除不安全的事件处理器
    const unsafeAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 
                         'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
                         'onkeyup', 'onkeypress', 'ondblclick', 'oncontextmenu',
                         'onmousedown', 'onmouseup', 'onmousemove', 'onscroll'];
    
    function cleanElement(el) {
      // 清理事件处理器
      unsafeAttrs.forEach(attr => {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
      });
      // 清理javascript:伪协议
      if (el.hasAttribute('href') && el.getAttribute('href').toLowerCase().startsWith('javascript:')) {
        el.removeAttribute('href');
      }
      if (el.hasAttribute('src') && el.getAttribute('src').toLowerCase().startsWith('javascript:')) {
        el.removeAttribute('src');
      }
    }
    
    // 清理所有元素
    parser.querySelectorAll('*').forEach(cleanElement);
    
    // ===== 核心：段落结构保护与样式作用域隔离 =====
    // 将HTML内容按块级元素拆分为独立的段落片段
    // 每个片段获得独立的CSS作用域，防止相邻段落间样式继承
    
    const blockFragments = [];
    const childNodes = Array.from(parser.childNodes);
    
    childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        // 纯文本节点：跳过纯空白节点
        const text = node.textContent || '';
        if (text.trim().length > 0) {
          // 将独立文本包装为段落
          blockFragments.push(createIsolatedBlock('section', text.trim(), null));
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        
        if (tag === 'br') {
          // 单独的 <br> 转换为段落分隔，跳过
          return;
        }
        
        if (BLOCK_TAGS.has(tag)) {
          // 块级元素：作为独立段落处理
          // 确保块级元素有 display:block
          ensureBlockDisplay(node);
          // 添加样式隔离
          blockFragments.push(wrapBlockWithIsolation(node));
        } else if (INLINE_TAGS.has(tag) || tag === '#text') {
          // 内联元素：用 <section> 包装为独立段落
          blockFragments.push(createIsolatedBlock('section', node.outerHTML, null));
        } else {
          // 未知标签：作为块级元素处理
          ensureBlockDisplay(node);
          blockFragments.push(wrapBlockWithIsolation(node));
        }
      }
    });
    
    // 如果所有内容都在一个顶层块级元素中（常见于完整HTML文档），
    // 递归提取其内部块级子元素作为独立段落
    if (blockFragments.length === 1) {
      const expanded = expandNestedBlocks(parser.firstElementChild);
      if (expanded.length > 1) {
        blockFragments.length = 0;
        expanded.forEach(b => blockFragments.push(b));
      }
    }
    
    // 重新组合：全局样式 + 独立段落
    let resultHTML = globalStyles.join('\n');
    resultHTML += blockFragments.join('\n');
    
    return resultHTML;
  }
  
  // 确保块级元素有 display:block
  function ensureBlockDisplay(el) {
    const style = el.getAttribute('style') || '';
    const tag = el.tagName.toLowerCase();
    // 对于 <p> 标签，转换为 <section> 以避免微信编辑器对 <p> 的特殊处理
    if (tag === 'p') {
      // 将 <p> 替换为 <section>，通过后续处理实现
    }
    // 确保 display 属性为 block
    if (!style.includes('display:')) {
      el.style.setProperty('display', 'block', 'important');
    }
  }
  
  // 将块级元素包装为带样式隔离的HTML字符串
  function wrapBlockWithIsolation(el) {
    const tag = el.tagName.toLowerCase();
    let html = '';
    
    if (tag === 'p') {
      // 将 <p> 转换为 <section> 以避免微信编辑器破坏段落结构
      const innerHTML = el.innerHTML;
      const style = el.getAttribute('style') || '';
      // 保留原始样式，同时添加强制块级显示和样式隔离
      const mergedStyle = mergeStyles(style, {
        'display': 'block',
        'clear': 'both',
        'margin': extractStyleValue(style, 'margin') || '0 0 1em 0',
        'padding': extractStyleValue(style, 'padding') || '0',
        'box-sizing': 'border-box'
      });
      html = '<section style="' + mergedStyle + '">' + innerHTML + '</section>';
    } else if (tag === 'br') {
      // <br> 转换为分隔section
      html = '<section style="display:block;clear:both;margin:0;padding:0;height:0;font-size:0;line-height:0;">&nbsp;</section>';
    } else {
      // 其他块级元素：保留标签，增强样式隔离
      const existingStyle = el.getAttribute('style') || '';
      const mergedStyle = mergeStyles(existingStyle, {
        'display': 'block',
        'clear': 'both',
        'box-sizing': 'border-box'
      });
      el.setAttribute('style', mergedStyle);
      html = el.outerHTML;
    }
    
    return html;
  }
  
  // 创建带样式隔离的块级元素HTML
  function createIsolatedBlock(tag, content, existingStyle) {
    const style = existingStyle || '';
    const baseStyle = 'display:block;clear:both;margin:0 0 1em 0;padding:0;box-sizing:border-box;';
    const mergedStyle = style ? baseStyle + style : baseStyle;
    return '<' + tag + ' style="' + mergedStyle + '">' + content + '</' + tag + '>';
  }
  
  // 合并样式，后者的值覆盖前者
  function mergeStyles(baseStyle, overrides) {
    const styleMap = {};
    // 解析base样式
    if (baseStyle) {
      baseStyle.split(';').forEach(decl => {
        const colonIdx = decl.indexOf(':');
        if (colonIdx > 0) {
          const prop = decl.substring(0, colonIdx).trim();
          const val = decl.substring(colonIdx + 1).trim();
          if (prop && val) styleMap[prop] = val;
        }
      });
    }
    // 应用覆盖
    Object.keys(overrides).forEach(prop => {
      if (overrides[prop] && overrides[prop] !== 'undefined') {
        styleMap[prop] = overrides[prop];
      }
    });
    // 重新序列化
    return Object.keys(styleMap).map(p => p + ':' + styleMap[p]).join(';');
  }
  
  // 从样式中提取特定属性值
  function extractStyleValue(style, prop) {
    if (!style) return null;
    const regex = new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*([^;]+)', 'i');
    const match = style.match(regex);
    return match ? match[1].trim() : null;
  }
  
  // 递归展开嵌套块级元素，提取顶层块级子元素作为独立段落
  function expandNestedBlocks(container) {
    if (!container || container.nodeType !== Node.ELEMENT_NODE) return [];
    
    const tag = container.tagName.toLowerCase();
    const result = [];
    
    // 如果容器是 body 或 html，直接提取其子元素
    if (tag === 'body' || tag === 'html') {
      Array.from(container.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const childTag = child.tagName.toLowerCase();
          if (['div', 'p', 'section', 'article', 'header', 'footer', 'main',
               'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
               'blockquote', 'pre', 'ul', 'ol', 'table', 'figure'].includes(childTag)) {
            result.push(wrapBlockWithIsolation(child));
          } else {
            result.push(wrapBlockWithIsolation(child));
          }
        } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
          result.push(createIsolatedBlock('section', child.textContent.trim(), null));
        }
      });
      return result;
    }
    
    // 对于其他容器，提取直接块级子元素
    const blockChildren = [];
    Array.from(container.children).forEach(child => {
      const childTag = child.tagName.toLowerCase();
      if (['div', 'p', 'section', 'article', 'header', 'footer', 'main',
           'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
           'blockquote', 'pre', 'ul', 'ol', 'table', 'figure',
           'li', 'td', 'th'].includes(childTag)) {
        blockChildren.push(child);
      }
    });
    
    if (blockChildren.length > 1) {
      blockChildren.forEach(child => result.push(wrapBlockWithIsolation(child)));
    }
    
    return result;
  }
  
  // 为HTML内容添加隔离包装，防止样式污染，同时保持结构完整性
  // 核心改进：不再将多个段落包裹在单个div中（这会导致UEditor扁平化段落结构），
  // 而是确保每个段落是独立的兄弟节点，各自具有独立的CSS作用域
  function wrapHTMLContent(html) {
    const parser = document.createElement('div');
    parser.innerHTML = html;
    
    // 收集所有顶层节点
    const topNodes = Array.from(parser.childNodes);
    const childElements = Array.from(parser.children);
    const textNodes = topNodes.filter(
      node => node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim() !== ''
    );
    
    // 情况1: 只有一个根元素 → 确保它是块级且隔离的
    if (childElements.length === 1 && textNodes.length === 0) {
      const rootElement = childElements[0];
      
      // 添加隔离标记类
      rootElement.classList.add('di-isolated-content');
      
      // 确保块级显示
      const existingDisplay = (rootElement.style && rootElement.style.display) || '';
      if (!existingDisplay || existingDisplay === 'inline') {
        rootElement.style.setProperty('display', 'block', 'important');
      }
      
      // 添加样式隔离属性
      rootElement.style.clear = 'both';
      rootElement.style.margin = rootElement.style.margin || '0 0 1em 0';
      rootElement.style.padding = rootElement.style.padding || '0';
      rootElement.style.setProperty('box-sizing', 'border-box', 'important');
      
      // 如果根元素内部包含多个块级子元素，将它们提升为顶层独立段落
      const innerBlocks = Array.from(rootElement.querySelectorAll(':scope > div, :scope > p, :scope > section, :scope > blockquote, :scope > pre, :scope > ul, :scope > ol, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > figure, :scope > table'));
      if (innerBlocks.length > 1) {
        // 提取内部块级元素为独立段落
        const fragments = innerBlocks.map(function(block) {
          var clone = block.cloneNode(true);
          clone.classList.add('di-isolated-content');
          clone.style.setProperty('display', 'block', 'important');
          clone.style.clear = 'both';
          clone.style.margin = clone.style.margin || '0 0 1em 0';
          clone.style.setProperty('box-sizing', 'border-box', 'important');
          return clone.outerHTML;
        });
        return fragments.join('\n');
      }
      
      return rootElement.outerHTML;
    }
    
    // 情况2: 多个根元素或混合内容 → 每个独立包装为兄弟节点
    var fragments = [];
    topNodes.forEach(function(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var text = (node.textContent || '').trim();
        if (text.length > 0) {
          // 纯文本包装为独立段落
          fragments.push(
            '<section class="di-isolated-content" style="display:block;clear:both;margin:0 0 1em 0;padding:0;box-sizing:border-box;">' + text + '</section>'
          );
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        var tag = node.tagName.toLowerCase();
        if (tag === 'br') return; // 跳过独立的br
        // 每个元素独立包装，添加隔离类
        var clone = node.cloneNode(true);
        clone.classList.add('di-isolated-content');
        clone.style.setProperty('display', 'block', 'important');
        clone.style.clear = 'both';
        if (!clone.style.margin) {
          clone.style.margin = '0 0 1em 0';
        }
        clone.style.setProperty('box-sizing', 'border-box', 'important');
        fragments.push(clone.outerHTML);
      }
    });
    
    return fragments.join('\n');
  }

  // ---------- 注入编辑器（恢复 11-08 备份版方案，唯一路径） ----------
  // processHTMLContent 拆出独立段落并把 <style> 提到最前，
  // wrapHTMLContent 为每个顶层块加隔离，得到一串独立片段。
  // background / content script 逐段 execCommand('insertHTML') 插入，
  // 这样即使编辑器为空、光标在首行 <p> 内，块级片段也会被提升为
  // 独立兄弟节点，不会被 UEditor 压平，样式得以完整保留。
  // 绝不能改回「整段一次插入」。
  document.getElementById('btnImportInsert').addEventListener('click', function () {
    let htmlContent = document.getElementById('importTextarea').value;
    if (!htmlContent || !htmlContent.trim()) {
      showToast('请输入或上传HTML内容', 'error');
      return;
    }

    htmlContent = wrapHTMLContent(processHTMLContent(htmlContent));
    if (!htmlContent || !htmlContent.trim()) {
      showToast('HTML 内容为空或不合法', 'error');
      return;
    }

    getActiveTab(function (tab) {
      if (!tab) {
        showToast('无法获取当前标签页', 'error');
        return;
      }
      if (!tab.url || tab.url.indexOf('mp.weixin.qq.com') === -1) {
        showToast('请在微信公众号编辑器页面使用', 'info');
        return;
      }

      // 策略1：background → chrome.scripting.executeScript 注入编辑器帧
      chrome.runtime.sendMessage(
        { action: 'directInsert', html: htmlContent, tabId: tab.id },
        function (resp) {
          // 后台通信失败也要继续走降级链，不能静默无反应
          const bgError = chrome.runtime.lastError ? chrome.runtime.lastError.message : '';
          if (resp && resp.success) {
            showToast('✓ HTML已插入编辑器', 'success');
            document.getElementById('importModal').style.display = 'none';
            return;
          }
          // 策略2：回退到 content script
          chrome.tabs.sendMessage(tab.id,
            { action: 'insertHTML', html: htmlContent },
            { frameId: 0 }, function (r2) {
              if (r2 && r2.success) {
                showToast('✓ HTML已插入编辑器', 'success');
              } else {
                // 策略3：最后兜底剪贴板
                copyToClipboard(htmlContent, 'HTML内容', function () {});
                const reason = (resp && resp.reason) || (r2 && r2.reason) || bgError || '未知原因';
                showToast('插入失败（' + reason + '），已复制到剪贴板，请 Ctrl+V 粘贴', 'error');
              }
              document.getElementById('importModal').style.display = 'none';
            });
        });
    });
  });

  // 关闭导入模态框
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-close-import]')) {
      document.getElementById('importModal').style.display = 'none';
    }
  });

  // ---------- 启动 ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 4.3.0：浮窗内注册的回调（可访问主体作用域的 pendingSlotIndex）
  window.__DI_PANEL_CTX.host.register({
    slotSelect: function (idx) {
      pendingSlotIndex = parseInt(idx);
      if (!isNaN(pendingSlotIndex) && pendingSlotIndex >= 0 && pendingSlotIndex < 3) {
        showToast('请在组件列表中点击「快捷」按钮', 'info');
      }
    },
    focusLibrary: function () {
      var tb = window.__DI_TOOLBAR;
      if (tb && tb.expand) tb.expand();
      try {
        window.dispatchEvent(new CustomEvent('di:goto-section', { detail: { section: '组件库' } }));
      } catch (e) {
        var list = document.getElementById('componentList');
        if (list && list.scrollIntoView) {
          try { list.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e2) {}
        }
      }
    }
  });

  }

  function boot(attempt) {
    if (!mount()) {
      if (attempt > 0) { setTimeout(function () { boot(attempt - 1); }, 200); }
      return;
    }
    buildContext();
    try {
      INIT_PANEL_BODY();
      window.dispatchEvent(new CustomEvent('di:ui-changed'));
    } catch (e) {
      console.error('[深维] 浮窗面板初始化失败:', e);
    }
  }

  boot(50);
})();
