// ============================================================
// 深维公众号组件库 · Content Script（注入链为 11-08 基准版）
// 通信架构：
//   Side Panel → chrome.runtime → content script (top-level)
//   → webNavigation.getAllFrames 找 iframe frameId
//   → chrome.scripting.executeScript 在 iframe 中执行 DOM 插入
// 注入策略（优先级从高到低）：
//   1. execCommand('insertHTML') — 最兼容富文本编辑器
//   2. Range API 直接操作 DOM
//   3. insertAdjacentHTML 兜底
//   4. 剪贴板复制（最终降级）
// 新增功能：
//   · 页面悬浮工具栏（Editor Toolbar）
//   · 快速排版：一键美化、标题样式、段落格式、缩进、对齐、行距
//   · 常用符号快速插入
//   · 悬浮工具条：优先直接插入，降级剪贴板
// ============================================================

(function () {
  'use strict';

  if (window.__DEEPINSIGHT_CONTENT__) return;
  window.__DEEPINSIGHT_CONTENT__ = true;

  var IS_TOP = window === window.top;

  // ---------- 在页面（top-level）注入悬浮工具栏 ----------
  if (IS_TOP) {
    // 延迟注入，等页面初始化完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectFloatingToolbar);
    } else {
      setTimeout(injectFloatingToolbar, 800);
    }
  }

  // ---------- 悬浮工具栏注入 ----------
  function injectFloatingToolbar() {
    // 只在看起来像微信公众号编辑器的页面出现
    var url = location.href || '';
    var isEditorPage =
      url.indexOf('mp.weixin.qq.com') > -1 ||
      url.indexOf('/edit') > -1 ||
      document.querySelector('[contenteditable="true"]');
    if (!isEditorPage) return;

    // 已经注入过就跳过
    if (document.getElementById('di-floating-toolbar')) return;

    // 快捷排版与自定义插槽固定在浮窗上方（见 content.css 的 order）。
    // 编辑器原生菜单没有开放注册接口，且把触发点搬过去会改变 execCommand
    // 的作用文档，因此不并入原生菜单。
    var root = document.createElement('div');
    root.id = 'di-floating-toolbar';
    // 默认吸附右边缘
    root.style.right = '0';
    root.style.left = 'auto';
    root.style.top = '80px';
    root.style.setProperty('--di-toolbar-top', '80px');
    root.innerHTML =
      '<div class="di-head" id="di-tb-drag">' +
        '<div class="di-head-left">' +
          '<span class="di-brand-mark">深维</span>' +
          '<div class="di-brand-text">' +
            '<div class="di-brand-title">公众号组件库</div>' +
            '<div class="di-brand-sub">工作台 · 网页注入 / 组件 / 快捷排版</div>' +
          '</div>' +
        '</div>' +
        '<div class="di-head-right">' +
          '<span class="di-head-ver" id="di-head-version">v…</span>' +
          '<span class="di-conn"><span class="di-conn-dot" id="di-conn-dot"></span>' +
            '<span id="di-conn-text">检测中</span></span>' +
          '<span class="di-tb-handle" id="di-tb-handle"><span class="di-tb-handle-icon">◀</span></span>' +
          '<span class="di-tb-toggle" id="di-tb-toggle" title="折叠/展开">—</span>' +
        '</div>' +
      '</div>' +
      '<div class="di-notice" id="di-notice" role="status" aria-live="polite" hidden>' +
        '<div class="di-notice-lines" id="di-notice-lines"></div>' +
        '<button class="di-notice-close" id="di-notice-close" title="关闭提示">×</button>' +
      '</div>' +
      '<div class="di-posbar" id="di-posbar">' +
        '<div class="di-pos-row">' +
          '<span class="di-pos-tag">当前位置</span>' +
          '<span class="di-pos-section" id="di-pos-section">准备中</span>' +
          '<span class="di-pos-item" id="di-pos-item">正在载入组件库…</span>' +
          '<span class="di-pos-pct" id="di-pos-pct">0%</span>' +
        '</div>' +
        '<div class="di-pos-nav" id="di-pos-nav">' +
          '<button class="di-pos-chip" data-di-goto="快捷排版">排版</button>' +
          '<button class="di-pos-chip" data-di-goto="自定义插槽">插槽</button>' +
          // 常驻「实时预览」分区已移除，对应芯片一并去掉，
          // 组件效果改由悬停卡片时的轻量浮层呈现，不占滚动流也不占导航位。
          '<button class="di-pos-chip" data-di-goto="快捷操作">操作</button>' +
          '<button class="di-pos-chip" data-di-goto="组件库">组件库</button>' +
        '</div>' +
        '<div class="di-pos-progress"><span id="di-pos-progress-fill"></span></div>' +
      '</div>' +
      '<div class="di-scroll-wrap" id="di-scroll-wrap">' +
        '<div class="di-tb-body" id="di-tb-body">' +
          '<div class="di-quick" data-di-section="快捷排版" data-di-hint="选中文字改样式 · 未选中则插入示例">' +
            '<div class="di-block">' +
              '<div class="di-section-head">' +
                '<span class="di-section-title">快捷排版</span>' +
                '<span class="di-section-meta">选中文字后点击即可应用</span>' +
              '</div>' +
              '<div class="di-subhead">常用操作</div>' +
              '<div class="di-tb-row">' +
                // 删掉这里的「📦 组件库」按钮。它与下方「快捷操作」里的
                // 「⇥ 组件库」以及位置条「组件库」芯片是同一个动作，属重复控件。
                '<button class="di-tb-btn di-tb-btn-primary" data-action="beautify">✨ 一键美化</button>' +
              '</div>' +
              '<div class="di-subhead">段落格式</div>' +
              '<div class="di-tb-row">' +
                '<button class="di-tb-btn" data-action="indentFirst">↳ 首行缩进</button>' +
                '<button class="di-tb-btn" data-action="lineHeight175">↔ 行高1.75</button>' +
                '<button class="di-tb-btn" data-action="lineHeight2">↔ 行高2.0</button>' +
              '</div>' +
              '<div class="di-tb-row">' +
                '<button class="di-tb-btn" data-action="alignCenter">═ 居中</button>' +
                '<button class="di-tb-btn" data-action="alignLeft">═ 居左</button>' +
                '<button class="di-tb-btn" data-action="quoteStyle">&ldquo; 引用段</button>' +
              '</div>' +
              '<div class="di-subhead">标题样式</div>' +
              '<div class="di-tb-row">' +
                '<button class="di-tb-btn" data-action="titleBig">标题-大号</button>' +
                '<button class="di-tb-btn" data-action="titleMedium">标题-中号</button>' +
                '<button class="di-tb-btn" data-action="titleSmall">标题-小号</button>' +
              '</div>' +
              '<div class="di-tb-row">' +
                '<button class="di-tb-btn" data-action="subtitleDecor">·装饰标题</button>' +
                '<button class="di-tb-btn" data-action="chapterTitle">◆ 章节标题</button>' +
              '</div>' +
              '<div class="di-subhead">文字强调</div>' +
              '<div class="di-tb-row">' +
                '<button class="di-tb-btn" data-action="hlYellow">🟨 黄色高亮</button>' +
                '<button class="di-tb-btn" data-action="hlPink">🌸 粉色高亮</button>' +
                '<button class="di-tb-btn" data-action="hlGreen">🟩 绿色高亮</button>' +
              '</div>' +
              '<div class="di-tb-row">' +
                '<button class="di-tb-btn" data-action="boldText"><b>B 加粗</b></button>' +
                '<button class="di-tb-btn" data-action="colorRed">🔴 红色字</button>' +
                '<button class="di-tb-btn" data-action="colorBlue">🔵 蓝色字</button>' +
              '</div>' +
              '<div class="di-subhead">常用插入</div>' +
              '<div class="di-tb-row">' +
                '<button class="di-tb-btn" data-action="insertSpace">⬜ 全角空格</button>' +
                '<button class="di-tb-btn" data-action="insertDash">— 破折号</button>' +
                '<button class="di-tb-btn" data-action="insertQuote">&ldquo;&rdquo; 引号</button>' +
              '</div>' +
              '<div class="di-tb-row">' +
                '<button class="di-tb-btn" data-action="insertDivider">✦ 插入分隔符</button>' +
                '<button class="di-tb-btn" data-action="insertEndMark">◆ END ◆</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="di-slots" data-di-section="自定义插槽" data-di-hint="3 个可固定的常用组件">' +
            '<div class="di-block">' +
              '<div class="di-section-head">' +
                '<span class="di-section-title">自定义插槽</span>' +
                '<span class="di-section-meta">从组件库点「快捷」固定到这里</span>' +
              '</div>' +
              '<div class="di-tb-custom-slots" id="di-tb-custom-slots">' +
                '<button class="di-tb-custom-slot di-tb-custom-slot-empty" data-slot="0" title="点击从组件库选择组件">+ 添加组件</button>' +
                '<button class="di-tb-custom-slot di-tb-custom-slot-empty" data-slot="1" title="点击从组件库选择组件">+ 添加组件</button>' +
                '<button class="di-tb-custom-slot di-tb-custom-slot-empty" data-slot="2" title="点击从组件库选择组件">+ 添加组件</button>' +
              '</div>' +
              '<div class="di-tb-tip">提示：选中文字可 <b>修改样式</b>，无选中则 <b>插入示例</b></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="di-rail" id="di-rail" aria-hidden="true">' +
          '<div class="di-rail-track" id="di-rail-track">' +
            '<div class="di-rail-thumb" id="di-rail-thumb"></div>' +
            '<div class="di-rail-ticks" id="di-rail-ticks"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="di-foot">' +
        '<span id="di-foot-version">深维 DeepInsight · 公众号组件库</span>' +
        '<span>拖动顶部移动 · 点击图标收起</span>' +
      '</div>';
    try {
      var verEl = root.querySelector('#di-head-version');
      var footVerEl = root.querySelector('#di-foot-version');
      var ver = chrome.runtime.getManifest().version;
      if (verEl) verEl.textContent = 'v' + ver;
      if (footVerEl) footVerEl.textContent = '深维 DeepInsight · 公众号组件库 v' + ver;
    } catch (e) {}
    document.body.appendChild(root);

    // ---- 状态变量 ----
    var isCollapsed = false;          // 是否处于收起态
    var dockSide = 'right';           // 当前吸附侧: 'right' | 'left'
    var savedTop = 80;                // 展开态时记录的 top 位置
    var savedExpandedWidth = 260;     // 展开时的宽度

    // ---- 元素引用 ----
    var body = root.querySelector('#di-tb-body');
    var toggleBtn = root.querySelector('#di-tb-toggle');
    var handleEl = root.querySelector('#di-tb-handle');
    var dragHandle = root.querySelector('#di-tb-drag');

    // 浮窗高度按视口自适应（calc(100vh - top - bottom)）。
    // 凡改动 top 的地方都必须同步 --di-toolbar-top，
    // 否则拖到中间后高度仍按初始 top 计算，底部会被裁掉。
    function setToolbarTop(px) {
      var v = Math.round(px * 100) / 100;
      root.style.top = v + 'px';
      root.style.setProperty('--di-toolbar-top', v + 'px');
    }

    // ---- 边缘吸附阈值 (px) ----
    var SNAP_THRESHOLD = 80;

    // ---- 辅助函数：应用吸附 ----
    function snapToEdge() {
      var rect = root.getBoundingClientRect();
      var vw = window.innerWidth;
      var centerX = rect.left + rect.width / 2;

      // 移除过渡类，吸附瞬间完成（非拖拽触发时保留过渡）
      if (centerX < vw / 2) {
        // 吸附左侧
        root.style.left = '0';
        root.style.right = 'auto';
        root.classList.add('di-dock-left');
        root.classList.remove('di-dock-right');
        dockSide = 'left';
        if (handleEl) handleEl.querySelector('.di-tb-handle-icon').textContent = '▶';
      } else {
        // 吸附右侧
        root.style.right = '0';
        root.style.left = 'auto';
        root.classList.remove('di-dock-left');
        dockSide = 'right';
        if (handleEl) handleEl.querySelector('.di-tb-handle-icon').textContent = '◀';
      }
    }

    // ---- 展开工具栏 ----
    function expand() {
      if (!isCollapsed) return;
      isCollapsed = false;
      root.classList.remove('di-collapsed');
      // 清除收起态 inline width，让 CSS 默认 260px 接管
      root.style.width = '';
      // 清除可能残留的 right/left inline，让吸附逻辑统一管理
      root.style.left = '';
      root.style.right = '';
      setToolbarTop(savedTop);
      toggleBtn.textContent = '—';
      // 重新触发吸附定位（带过渡动画平滑滑入）
      // 用 requestAnimationFrame 确保 class 移除后 CSS 已重新计算
      requestAnimationFrame(function () {
        if (dockSide === 'left') {
          root.classList.add('di-dock-left');
          root.style.left = '0';
        } else {
          root.classList.remove('di-dock-left');
          root.style.right = '0';
        }
      });
    }

    // ---- 收起工具栏 ----
    function collapse() {
      if (isCollapsed) return;
      // 记录当前展开状态（在读宽度之前，先确保读取到 CSS 计算宽度）
      var rect = root.getBoundingClientRect();
      savedTop = rect.top;
      savedExpandedWidth = rect.width;
      isCollapsed = true;
      // 先清除 inline width，再添加 collapsed class，
      // 让 CSS .di-collapsed { width: 32px } 能够生效
      root.style.width = '';
      root.classList.add('di-collapsed');
      toggleBtn.textContent = '+';
    }

    // ---- 切换展开/收起 ----
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isCollapsed) {
        expand();
      } else {
        collapse();
      }
    });

    // ---- 点击收起态的把手也可以展开 ----
    root.addEventListener('click', function (e) {
      if (isCollapsed && !e.target.closest('.di-tb-btn')) {
        expand();
      }
    });

    // ---- 拖拽：只拖拽 header 部分，释放后边缘吸附 ----
    var dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    // 收起态按下时先只展开，等真正移动超过阈值才进入拖拽。
    // 旧写法用 setTimeout 延迟 50ms 再 beginDrag，快速单击时 mouseup 先到、
    // beginDrag 迟到，dragging 永远没人复位，浮窗会粘着鼠标走。
    var pendingDragStart = null;

    dragHandle.addEventListener('mousedown', function (e) {
      if (isCollapsed) {
        expand();
        pendingDragStart = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        return;
      }
      beginDrag(e);
    });

    function beginDrag(e) {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      var rect = root.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      // 切换到 left 定位模式（放弃 right 定位）
      root.style.right = 'auto';
      root.style.left = startLeft + 'px';
      setToolbarTop(startTop);
      // 拖拽中禁用过渡动画
      root.classList.add('di-dragging');
      // 拖拽时临时移除吸附类
      root.classList.remove('di-dock-left');
      e.preventDefault();
    }

    document.addEventListener('mousemove', function (e) {
      if (pendingDragStart) {
        var moved = Math.abs(e.clientX - pendingDragStart.x) + Math.abs(e.clientY - pendingDragStart.y);
        if (moved <= 4) return;
        beginDrag({ clientX: pendingDragStart.x, clientY: pendingDragStart.y, preventDefault: function () {} });
        pendingDragStart = null;
      }
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var newLeft = startLeft + dx;
      var newTop = startTop + dy;

      // 边界约束：不允许完全拖出屏幕
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var w = root.offsetWidth;
      var h = root.offsetHeight;
      newLeft = Math.max(-w + 20, Math.min(newLeft, vw - 20));
      // 为自适应高度留足空间（min-height 160 + 底部留白 32），
      // 否则拖到很低时 calc 高度被 min-height 顶开，底部反而溢出视口。
      newTop = Math.max(0, Math.min(newTop, vh - 200));

      root.style.left = newLeft + 'px';
      setToolbarTop(newTop);
    });

    document.addEventListener('mouseup', function () {
      pendingDragStart = null;
      if (!dragging) return;
      dragging = false;

      // 恢复过渡动画
      root.classList.remove('di-dragging');

      // 边缘吸附判定
      var rect = root.getBoundingClientRect();
      var vw = window.innerWidth;
      var distToLeft = rect.left;
      var distToRight = vw - rect.right;

      if (distToLeft < SNAP_THRESHOLD) {
        // 吸附左侧
        dockSide = 'left';
        root.style.left = '0';
        root.style.right = 'auto';
        root.classList.add('di-dock-left');
        if (handleEl) handleEl.querySelector('.di-tb-handle-icon').textContent = '▶';
      } else if (distToRight < SNAP_THRESHOLD) {
        // 吸附右侧
        dockSide = 'right';
        root.style.right = '0';
        root.style.left = 'auto';
        root.classList.remove('di-dock-left');
        if (handleEl) handleEl.querySelector('.di-tb-handle-icon').textContent = '◀';
      } else {
        // 中间态明确记为未吸附，避免 resize 时按旧 dockSide 弹回边缘
        dockSide = null;
        root.classList.remove('di-dock-left');
      }

      // 更新记录的位置
      savedTop = parseFloat(root.style.top) || rect.top;
      savedExpandedWidth = parseFloat(root.style.width) || rect.width;
    });

    // ---- 窗口 resize 时重新吸附，并把浮窗拉回可视区 ----
    window.addEventListener('resize', function () {
      if (dragging || isCollapsed) return;
      var rect = root.getBoundingClientRect();
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      if (dockSide === 'left' && rect.left > 10) {
        root.style.left = '0';
        root.style.right = 'auto';
      } else if (dockSide === 'right' && (vw - rect.right) > 10) {
        root.style.right = '0';
        root.style.left = 'auto';
      }
      // 窗口变矮后 top 可能落到视口外，同步变量让高度算式重算，
      // 避免 min-height 把底部顶出屏幕。中间态（dockSide=null）只管垂直，不弹回边缘。
      var top = Math.max(0, Math.min(rect.top, vh - 200));
      if (Math.abs(top - rect.top) > 1) setToolbarTop(top);
    });

    // ---- 初始吸附 ----
    snapToEdge();

    // ---- 自定义组件插槽逻辑 ----
    var customComponents = [null, null, null];  // 3个插槽
    var slotsEl = root.querySelector('#di-tb-custom-slots');

    // 从 chrome.storage 加载自定义组件配置
    function loadCustomComponents() {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['di_custom_toolbar'], function (result) {
          if (result && result.di_custom_toolbar && Array.isArray(result.di_custom_toolbar)) {
            customComponents = result.di_custom_toolbar.slice(0, 3);
            while (customComponents.length < 3) customComponents.push(null);
          }
          renderCustomSlots();
        });
      } else {
        renderCustomSlots();
      }
    }

    // 保存自定义组件配置到 chrome.storage
    function saveCustomComponents() {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ di_custom_toolbar: customComponents });
      }
    }

    // 渲染自定义组件插槽
    function renderCustomSlots() {
      if (!slotsEl) return;
      var html = '';
      for (var i = 0; i < 3; i++) {
        var comp = customComponents[i];
        if (comp && comp.id) {
          html += '<button class="di-tb-custom-slot di-tb-custom-slot-filled" data-slot="' + i + '" data-comp-id="' + comp.id + '">' +
                    '<span class="di-tb-custom-slot-label">' + (comp.icon || '◆') + ' ' + (comp.name || '') + '</span>' +
                    '<span class="di-tb-custom-slot-clear" data-slot="' + i + '" data-clear="1" title="移除">×</span>' +
                  '</button>';
        } else {
          html += '<button class="di-tb-custom-slot di-tb-custom-slot-empty" data-slot="' + i + '" title="从组件库中选择一个组件添加到此位置">+ 添加组件</button>';
        }
      }
      slotsEl.innerHTML = html;
    }

    // 处理自定义插槽点击
    slotsEl.addEventListener('click', function (e) {
      e.stopPropagation();

      // 处理清除按钮
      var clearBtn = e.target.closest('[data-clear]');
      if (clearBtn) {
        var slotIdx = parseInt(clearBtn.getAttribute('data-slot'));
        if (!isNaN(slotIdx) && slotIdx >= 0 && slotIdx < 3) {
          customComponents[slotIdx] = null;
          saveCustomComponents();
          renderCustomSlots();
        }
        return;
      }

      // 处理插槽点击（空插槽→定位组件库选择；已填充→插入组件）
      var slotBtn = e.target.closest('.di-tb-custom-slot');
      if (!slotBtn) return;
      var idx = parseInt(slotBtn.getAttribute('data-slot'));
      if (isNaN(idx) || idx < 0 || idx >= 3) return;

      var comp = customComponents[idx];
      if (comp && comp.id) {
        // 已填充 → 点击插入组件
        insertCustomComponent(comp);
      } else {
        // 空插槽 → 通知同一个浮窗内的组件库进入选择模式
        if (window.__DI_HOST && window.__DI_HOST.requestSlotSelect) {
          window.__DI_HOST.requestSlotSelect(idx);
        } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: 'startSlotSelect', slotIndex: idx }, function () {});
        }
        showToast('请在组件库中选择组件，点击「快捷」', 'info');
      }
    });

    // 插入自定义组件到编辑器
    function insertCustomComponent(comp) {
      var editor = findEditor();
      if (!editor) {
        showToast('未找到编辑器', 'error');
        return;
      }
      var html = DEEPINSIGHT_COMPONENTS.renderComponent(comp.id, comp.fieldValues || {});
      if (!html) {
        showToast('组件渲染失败', 'error');
        return;
      }
      var inserted = insertInFrame(editor, html);
      if (inserted) {
        showToast('✓ 已插入「' + (comp.name || '组件') + '」', 'success');
      } else {
        // 降级
        try {
          chrome.runtime.sendMessage({ action: 'directInsert', html: html }, function (resp) {
            if (resp && resp.success) {
              showToast('✓ 已插入到编辑器', 'success');
            } else {
              copyHTMLToClipboard(html);
              showToast('已复制！请 Ctrl+V 粘贴', 'info');
            }
          });
        } catch (e) {
          copyHTMLToClipboard(html);
          showToast('已复制！请 Ctrl+V 粘贴', 'info');
        }
      }
    }

    // 监听来自浮窗面板的消息：组件选择确认
    // 面板选择组件后，发送消息 { action: 'setSlotComponent', slotIndex, component }
    chrome.runtime.onMessage.addListener(function (req, sender, sendResp) {
      if (req && req.action === 'setSlotComponent' && req.slotIndex !== undefined && req.component) {
        var idx = parseInt(req.slotIndex);
        if (!isNaN(idx) && idx >= 0 && idx < 3) {
          customComponents[idx] = req.component;
          saveCustomComponents();
          renderCustomSlots();
          showToast('✓ 「' + (req.component.name || '组件') + '」已添加到悬浮窗', 'success');
          if (sendResp) sendResp({ success: true });
        } else if (sendResp) {
          // 非法索引也要回包，否则发送方会一直等 reply 到超时
          sendResp({ success: false });
        }
        return true;
      }
      if (req && req.action === 'refreshCustomSlots') {
        loadCustomComponents();
        if (sendResp) sendResp({ success: true });
        return true;
      }
      return false;
    });

    // 初始加载
    loadCustomComponents();

    // 把浮窗控制能力交给统一入口层（仅暴露，不改逻辑）
    window.__DI_TOOLBAR = {
      expand: expand,
      collapse: collapse,
      toggle: function () { if (isCollapsed) expand(); else collapse(); }
    };
    window.__DI_REFRESH_SLOTS = loadCustomComponents;

    // 按钮点击
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.di-tb-btn');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      handleToolbarAction(action);
    });
  }

  // ---------- 工具栏操作 ----------
  function handleToolbarAction(action) {
    // openSidebar → 统一入口：定位到同一个浮窗内的组件库
    if (action === 'openSidebar') {
      if (window.__DI_HOST && window.__DI_HOST.focusLibrary) window.__DI_HOST.focusLibrary();
      return;
    }

    // 公众号正文几乎总在同源 iframe 里。原来只扫主文档、
    // 只读 window.getSelection()，选中文字套样式永远不触发。
    // 这里优先复用已有的跨帧探测，找不到再回退主文档。
    var target = findEditorTarget();
    var editor = target ? target.el : findEditor();
    var editorDoc = target ? target.doc : document;

    if (!editor) {
      showToast('未找到编辑器', 'error');
      return;
    }

    // 选区也要在编辑器所在文档里读，不能再用主文档的 selection
    var sel = null;
    var hasSelection = false;
    try {
      var docSel = editorDoc.getSelection ? editorDoc.getSelection() :
                   (editorDoc.defaultView && editorDoc.defaultView.getSelection());
      if (docSel && docSel.rangeCount > 0 && !docSel.isCollapsed) {
        var range = docSel.getRangeAt(0);
        if (editor.contains(range.startContainer) && editor.contains(range.endContainer) &&
            String(docSel.toString() || '').trim()) {
          sel = docSel;
          hasSelection = true;
        }
      }
    } catch (e) {}

    if (hasSelection) {
      // 有选中文本 → 修改选中文字样式
      var ok = applyStyleToSelection(action, editor, sel, editorDoc);
      if (ok) {
        showToast('✓ 已应用样式', 'success');
        return;
      }
      // 样式应用失败，回退到插入模式
    }

    // 无选中文本（或样式应用失败）→ 在光标位置插入示例内容
    var html = buildInsertHTML(action);
    if (!html) return;

    // 策略1: 优先直接插入到编辑器 DOM
    var inserted = insertInFrame(editor, html);
    if (inserted) {
      showToast(hasSelection ? '✓ 已替换选中内容' : '✓ 已插入到编辑器', 'success');
      return;
    }

    // 策略2: 通过 background 尝试多帧注入
    try {
      chrome.runtime.sendMessage({ action: 'directInsert', html: html }, function (resp) {
        if (resp && resp.success) {
          showToast('✓ 已插入到编辑器', 'success');
          return;
        }
        // 策略3: 降级到剪贴板
        try {
          copyHTMLToClipboard(html);
          showToast('已复制！请在编辑器中按 Ctrl+V 粘贴', 'info');
        } catch (e) {
          showToast('插入失败，请手动粘贴', 'error');
        }
      });
    } catch (e) {
      // 策略3: 降级到剪贴板
      try {
        copyHTMLToClipboard(html);
        showToast('已复制！请在编辑器中按 Ctrl+V 粘贴', 'info');
      } catch (e2) {
        showToast('插入失败', 'error');
      }
    }
  }

  // ---------- 对选中文本应用样式 ----------
  function applyStyleToSelection(action, editor, sel, editorDoc) {
    var doc = editorDoc || document;
    // focus 可能让 iframe 里的选区丢失，先保存再恢复
    try { restoreEditorFocus(false); } catch (e) { try { editor.focus(); } catch (e2) {} }
    var rawText = sel ? String(sel.toString() || '') : '';
    // 选中文字含 < & 时必须转义，否则拼进 insertHTML 会被当标签解析
    var text = (window.DI_SANITIZE && window.DI_SANITIZE.escapeHtml)
      ? window.DI_SANITIZE.escapeHtml(rawText)
      : rawText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 简单格式：execCommand 必须作用在编辑器所在的文档
    switch (action) {
      case 'boldText':
        return doc.execCommand('bold', false, null);
      case 'alignCenter':
        return doc.execCommand('justifyCenter', false, null);
      case 'alignLeft':
        return doc.execCommand('justifyLeft', false, null);
    }

    // 复杂格式：包裹选中文字
    var wrapHTML = null;
    switch (action) {
      case 'colorRed':
        wrapHTML = '<span style="color:#c0392b;font-weight:600;">' + text + '</span>'; break;
      case 'colorBlue':
        wrapHTML = '<span style="color:#0d2540;font-weight:600;">' + text + '</span>'; break;
      case 'hlYellow':
        wrapHTML = '<span style="background:#fff3b0;padding:0 3px;border-radius:2px;">' + text + '</span>'; break;
      case 'hlPink':
        wrapHTML = '<span style="background:#ffd9e4;padding:0 3px;border-radius:2px;">' + text + '</span>'; break;
      case 'hlGreen':
        wrapHTML = '<span style="background:#cfeeda;padding:0 3px;border-radius:2px;">' + text + '</span>'; break;
      case 'indentFirst':
        wrapHTML = '<section style="margin:18px 0;font-size:15px;line-height:1.85;color:#2d2d2d;text-indent:2em;">' + text + '</section>'; break;
      case 'lineHeight175':
        wrapHTML = '<section style="margin:18px 0;font-size:15px;line-height:1.75;color:#2d2d2d;">' + text + '</section>'; break;
      case 'lineHeight2':
        wrapHTML = '<section style="margin:18px 0;font-size:15px;line-height:2;color:#2d2d2d;">' + text + '</section>'; break;
      case 'quoteStyle':
        wrapHTML = '<section style="margin:22px 0;padding:14px 20px;background:#f7f7f4;border-left:4px solid #b2d9c4;color:#555;font-size:14.5px;line-height:1.8;font-style:italic;">' + text + '</section>'; break;
      case 'titleBig':
        wrapHTML = '<section style="margin:32px 0 18px;font-size:22px;font-weight:700;color:#0d2540;letter-spacing:1px;line-height:1.6;">' + text + '</section>'; break;
      case 'titleMedium':
        wrapHTML = '<section style="margin:26px 0 14px;font-size:18px;font-weight:700;color:#0d2540;line-height:1.6;">' + text + '</section>'; break;
      case 'titleSmall':
        wrapHTML = '<section style="margin:22px 0 12px;font-size:16px;font-weight:700;color:#0d2540;line-height:1.6;">' + text + '</section>'; break;
      case 'subtitleDecor':
        wrapHTML = '<section style="margin:24px 0 14px;padding-left:14px;border-left:5px solid #b2d9c4;font-size:17px;font-weight:700;color:#0d2540;line-height:1.6;">' + text + '</section>'; break;
      case 'chapterTitle':
        wrapHTML = '<section style="margin:36px 0 18px;text-align:center;">' +
                   '<div style="font-size:13px;letter-spacing:4px;color:#b2d9c4;">CHAPTER</div>' +
                   '<div style="margin-top:6px;font-size:22px;font-weight:700;color:#0d2540;letter-spacing:2px;">◆ ' + text + ' ◆</div>' +
                   '<div style="margin:8px auto 0;width:40px;height:2px;background:#b2d9c4;"></div>' +
                 '</section>'; break;
    }

    if (wrapHTML) {
      return doc.execCommand('insertHTML', false, wrapHTML);
    }
    return false;
  }

  // ---------- 构造插入用 HTML（无选中时使用） ----------
  function buildInsertHTML(action) {
    switch (action) {
      case 'beautify':
        return '<section style="margin:24px 0;padding:16px 20px;background:#f7f7f4;border-left:4px solid #0d2540;border-radius:0 8px 8px 0;font-size:15px;line-height:1.85;color:#2d2d2d;">✨ 提示：请将下方段落依次用「首行缩进」「行高1.75」等工具重新排版，即可获得精致的阅读体验。</section>';

      case 'indentFirst':
        return '<section style="margin:18px 0;font-size:15px;line-height:1.85;color:#2d2d2d;text-indent:2em;">这是首行缩进的示例文字，段落开头会自动缩进两个字符宽度，适合正文排版的规范格式。</section>';

      case 'lineHeight175':
        return '<section style="margin:18px 0;font-size:15px;line-height:1.75;color:#2d2d2d;">这是行高1.75倍的示例文字，行间距适中，阅读体验舒适，是公众号最常用的行距设置。</section>';

      case 'lineHeight2':
        return '<section style="margin:18px 0;font-size:15px;line-height:2;color:#2d2d2d;">这是行高2.0倍的示例文字，行间距更加宽松，适合长文阅读，呼吸感更强。</section>';

      case 'alignCenter':
        return '<section style="margin:18px 0;text-align:center;font-size:15px;line-height:1.85;color:#2d2d2d;">居中展示的文字，通常用于引言或总结</section>';

      case 'alignLeft':
        return '<section style="margin:18px 0;text-align:left;font-size:15px;line-height:1.85;color:#2d2d2d;">左对齐的正文段落，是最常见的阅读排版方式。</section>';

      case 'quoteStyle':
        return '<section style="margin:22px 0;padding:14px 20px;background:#f7f7f4;border-left:4px solid #b2d9c4;color:#555;font-size:14.5px;line-height:1.8;font-style:italic;">&ldquo;这是一段引用文字，适合用于别人的话、资料摘录或者金句展示。引号使用中文弯引号，整体采用浅灰色背景与左侧薄荷绿竖线。&rdquo;</section>';

      case 'titleBig':
        return '<section style="margin:32px 0 18px;font-size:22px;font-weight:700;color:#0d2540;letter-spacing:1px;line-height:1.6;">这是一级大标题</section>';

      case 'titleMedium':
        return '<section style="margin:26px 0 14px;font-size:18px;font-weight:700;color:#0d2540;line-height:1.6;">这是二级中号标题</section>';

      case 'titleSmall':
        return '<section style="margin:22px 0 12px;font-size:16px;font-weight:700;color:#0d2540;line-height:1.6;">这是三级小号标题</section>';

      case 'subtitleDecor':
        return '<section style="margin:24px 0 14px;padding-left:14px;border-left:5px solid #b2d9c4;font-size:17px;font-weight:700;color:#0d2540;line-height:1.6;">装饰性小标题（左侧竖线）</section>';

      case 'chapterTitle':
        return '<section style="margin:36px 0 18px;text-align:center;">' +
                 '<div style="font-size:13px;letter-spacing:4px;color:#b2d9c4;">CHAPTER</div>' +
                 '<div style="margin-top:6px;font-size:22px;font-weight:700;color:#0d2540;letter-spacing:2px;">◆ 章节标题 ◆</div>' +
                 '<div style="margin:8px auto 0;width:40px;height:2px;background:#b2d9c4;"></div>' +
               '</section>';

      case 'hlYellow':
        return '<span style="background:#fff3b0;padding:0 3px;border-radius:2px;">黄色高亮文字</span>';

      case 'hlPink':
        return '<span style="background:#ffd9e4;padding:0 3px;border-radius:2px;">粉色高亮文字</span>';

      case 'hlGreen':
        return '<span style="background:#cfeeda;padding:0 3px;border-radius:2px;">绿色高亮文字</span>';

      case 'boldText':
        return '<strong style="font-weight:700;color:#0d2540;">加粗的强调文字</strong>';

      case 'colorRed':
        return '<span style="color:#c0392b;font-weight:600;">红色强调的文字</span>';

      case 'colorBlue':
        return '<span style="color:#0d2540;font-weight:600;">蓝色强调的文字</span>';

      case 'insertSpace':
        return '<span>&emsp;</span>';

      case 'insertDash':
        return '<span style="color:#2d2d2d;">——</span>';

      case 'insertQuote':
        return '<span>&ldquo;引用内容&rdquo;</span>';

      case 'insertDivider':
        return '<section style="margin:28px 0;text-align:center;font-size:14px;color:#b2d9c4;letter-spacing:14px;">✦ &nbsp; ✦ &nbsp; ✦</section>';

      case 'insertEndMark':
        return '<section style="margin:36px 0 10px;text-align:center;font-size:14px;color:#0d2540;letter-spacing:6px;">◆ &nbsp; END &nbsp; ◆</section>';

      default:
        return null;
    }
  }

  // ---------- 尝试直接插入（top frame） ----------
  function tryInsertInTop(html) {
    var editor = findEditor();
    if (editor && window.frameElement === null) {
      return insertInFrame(editor, html);
    }
    // 通知 side panel / runtime 来处理
    chrome.runtime.sendMessage({ action: 'insertHTML', html: html }, function () {});
    return true;
  }

  // ---------- 复制 HTML + 文本到剪贴板 ----------
  function copyHTMLToClipboard(html) {
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      var blobHtml = new Blob([html], { type: 'text/html' });
      var plainText = stripHTML(html);
      var blobText = new Blob([plainText], { type: 'text/plain' });
      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        })
      ]).then(function () {}, function () {
        fallbackCopy(html);
      });
      return;
    }
    fallbackCopy(html);
  }

  function fallbackCopy(html) {
    var ta = document.createElement('textarea');
    ta.value = stripHTML(html);
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function stripHTML(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  // ---------- Toast 提示 ----------
  // 统一走浮窗内的常驻通知条（滚动区之外，任意滚动位置都看得到）。
  // 通知条尚未挂载时回退到页面级 toast，保证早期提示不丢。
  function showToast(msg, type) {
    if (window.__DI_NOTICE && window.__DI_NOTICE.push(msg, type)) return;
    var exist = document.getElementById('di-toast');
    if (exist) exist.remove();
    var t = document.createElement('div');
    t.id = 'di-toast';
    t.className = 'di-toast-' + (type || 'info');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .4s';
      t.style.opacity = '0';
      setTimeout(function () { try { t.remove(); } catch (e) {} }, 420);
    }, 1800);
  }

  // ---------- 在当前帧中查找正文编辑器 ----------
  function findEditor() {
    var els = document.querySelectorAll('[contenteditable="true"], [contenteditable=""]');
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.width > 200 && r.height > 60) return els[i];
    }
    if (document.body) {
      var be = document.body.getAttribute('contenteditable');
      if (be === 'true' || be === '') return document.body;
    }
    return document.querySelector('.edui-editor-body') ||
           document.querySelector('#ueditor_0') ||
           document.querySelector('.ke-container') || null;
  }

  // ---------- 在当前帧中插入 HTML ----------
  // 核心修复：确保每个块级段落作为独立兄弟节点注入，
  // 避免被包裹在单个div中导致UEditor扁平化段落结构
  function insertInFrame(editor, html) {
    var el = editor;
    try { el.focus(); } catch (e) {}

    // 解析HTML，识别并拆分为独立段落片段
    var fragments = parseToParagraphFragments(html);
    
    // 策略1: execCommand('insertHTML') — 对 UEditor 等富文本编辑器最友好
    // 逐段插入，确保每个段落是独立的兄弟节点
    try {
      var sel = window.getSelection();
      var range = null;
      if (sel && sel.rangeCount > 0) range = sel.getRangeAt(0);
      if (!range || !el.contains(range.startContainer)) {
        range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
      }
      sel.removeAllRanges();
      sel.addRange(range);

      var allInserted = true;
      for (var i = 0; i < fragments.length; i++) {
        var inserted = document.execCommand('insertHTML', false, fragments[i]);
        if (!inserted) { allInserted = false; break; }
      }
      if (allInserted && fragments.length > 0) {
        dispatchUpdate(el);
        return true;
      }
    } catch (e) {
      // execCommand 失败，回退到 Range API
    }

    // 策略2: Range API（精准控制）— 逐段作为兄弟节点插入
    try {
      var sel2 = window.getSelection();
      var range2 = null;
      if (sel2 && sel2.rangeCount > 0) range2 = sel2.getRangeAt(0);
      if (!range2 || !el.contains(range2.startContainer)) {
        range2 = document.createRange();
        range2.selectNodeContents(el);
        range2.collapse(false);
      }
      
      sel2.removeAllRanges();
      sel2.addRange(range2);

      // 将所有段落解析为DOM节点，逐个作为兄弟节点插入到编辑器中
      var lastInsertedNode = null;
      for (var j = 0; j < fragments.length; j++) {
        var temp = document.createElement('div');
        temp.innerHTML = fragments[j];
        
        var blockFrag = document.createDocumentFragment();
        var node;
        while ((node = temp.firstChild)) {
          blockFrag.appendChild(node);
        }
        
        // 获取当前选区
        var curRange = sel2.getRangeAt(0);
        curRange.deleteContents();
        curRange.insertNode(blockFrag);
        
        // 记录最后插入的节点，用于光标定位
        lastInsertedNode = blockFrag.lastChild || blockFrag;
        
        // 将光标移到刚插入内容之后，下一个片段将在其后插入
        var nextRange = document.createRange();
        nextRange.setStartAfter(lastInsertedNode);
        nextRange.collapse(true);
        sel2.removeAllRanges();
        sel2.addRange(nextRange);
      }
      
      // 确保光标在最后
      if (lastInsertedNode) {
        var finalRange = document.createRange();
        finalRange.setStartAfter(lastInsertedNode);
        finalRange.collapse(true);
        sel2.removeAllRanges();
        sel2.addRange(finalRange);
      }
      
      dispatchUpdate(el);
      return true;
    } catch (e) {
      // Range API 也失败，尝试兜底
    }

    // 策略3: 兜底 — 逐段使用 insertAdjacentHTML，段落间用块级分隔
    try {
      // 使用块级包装但确保段落是独立结构
      var joinedHTML = fragments.join('');
      el.insertAdjacentHTML('beforeend', joinedHTML);
      dispatchUpdate(el);
      return true;
    } catch (e) { return false; }
  }
  
  // 解析HTML为独立的段落片段，每个片段是一个带样式隔离的块级元素
  function parseToParagraphFragments(html) {
    var temp = document.createElement('div');
    temp.innerHTML = html;
    
    var BLOCK_TAGS = ['div', 'p', 'section', 'article', 'aside', 'header', 'footer',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre',
      'table', 'figure', 'main', 'nav', 'details', 'fieldset', 'form'];
    var BLOCK_SET = {};
    BLOCK_TAGS.forEach(function(t) { BLOCK_SET[t] = true; });
    
    var fragments = [];
    var childNodes = Array.prototype.slice.call(temp.childNodes);
    
    childNodes.forEach(function(node) {
      if (node.nodeType === 3) { // TEXT_NODE
        var text = (node.textContent || '').trim();
        if (text.length > 0) {
          // 纯文本包装为独立的隔离段落
          fragments.push(
            '<section class="di-html-import" style="display:block;clear:both;margin:0 0 1em 0;padding:0;border:0;box-sizing:border-box;">' +
            text +
            '</section>'
          );
        }
      } else if (node.nodeType === 1) { // ELEMENT_NODE
        var tag = node.tagName.toLowerCase();
        if (tag === 'br') return; // 跳过独立br
        
        if (tag === 'p') {
          // 将 <p> 转换为 <section>，保留其样式和内容，避免微信编辑器破坏段落
          var innerHTML = node.innerHTML;
          var style = node.getAttribute('style') || '';
          var mergedStyle = 'display:block;clear:both;margin:0 0 1em 0;padding:0;box-sizing:border-box;' + 
                           (style ? ';' + style : '');
          fragments.push(
            '<section class="di-html-import" style="' + mergedStyle + '">' + innerHTML + '</section>'
          );
        } else if (tag === 'style') {
          // 保留全局样式标签
          fragments.push(node.outerHTML);
        } else if (BLOCK_SET[tag]) {
          // 其他块级元素：添加隔离样式后保留
          var clone = node.cloneNode(true);
          clone.className = (clone.className ? clone.className + ' ' : '') + 'di-html-import';
          var existingStyle = clone.getAttribute('style') || '';
          var blockStyle = 'display:block;clear:both;';
          if (existingStyle.indexOf('margin') === -1) blockStyle += 'margin:0 0 1em 0;';
          if (existingStyle.indexOf('box-sizing') === -1) blockStyle += 'box-sizing:border-box;';
          clone.setAttribute('style', blockStyle + existingStyle);
          fragments.push(clone.outerHTML);
        } else {
          // 内联元素或其他：用section包装
          fragments.push(
            '<section class="di-html-import" style="display:block;clear:both;margin:0 0 1em 0;padding:0;box-sizing:border-box;">' +
            node.outerHTML +
            '</section>'
          );
        }
      }
    });
    
    return fragments;
  }

  function dispatchUpdate(el) {
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {}
    try {
      var inst = window.UE && window.UE.instants && window.UE.instants['ueditor_0'];
      if (inst) {
        if (inst.fireEvent) inst.fireEvent('contentChange');
        if (inst.sync) inst.sync();
      }
    } catch (e) {}
  }

  // ---------- postMessage 监听（iframe 响应来自 top-level 的消息） ----------
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.__DI__ !== true) return;
    if (data.type === 'doInsert') {
      var editor = findEditor();
      if (!editor) {
        try { event.source.postMessage({ __DI__: true, type: 'insertDone', rid: data.rid, ok: false }, '*'); } catch (e) {}
        return;
      }
      var ok = insertInFrame(editor, data.html);
      try { event.source.postMessage({ __DI__: true, type: 'insertDone', rid: data.rid, ok: ok }, '*'); } catch (e) {}
    }
  });

  // ---------- chrome.runtime 消息 ----------
  chrome.runtime.onMessage.addListener(function (req, sender, sendResp) {
    if (!req || !req.action) return;

    if (req.action === 'insertHTML') {
      handleInsert(req.html, sendResp);
      return true;
    }

    if (req.action === 'ping') {
      sendResp({ success: true, version: chrome.runtime.getManifest().version, ready: true, isTop: IS_TOP, hasEditor: !!findEditor() });
      return false;
    }

    if (req.action === 'getEditorInfo') {
      sendResp({ success: true, isTop: IS_TOP, hasEditor: !!findEditor(), url: location.href });
      return false;
    }

    if (req.action === 'cacheTabId') {
      window.__DI_tabId = req.tabId;
      return false;
    }

    return false;
  });

  // ---------- 暴露给 background 直接调用的插入方法 ----------
  // background → chrome.scripting.executeScript → window.__DI_insertHTML(html)
  window.__DI_insertHTML = function (html) {
    var editor = findEditor();
    if (editor) {
      return insertInFrame(editor, html);
    }
    return false;
  };

  // ---------- 插入处理（仅在 top-level 执行） ----------
  function handleInsert(html, sendResp) {
    var editor = findEditor();

    // 情况1: 当前帧就是编辑器（直接插入）
    if (editor) {
      var ok = insertInFrame(editor, html);
      sendResp({ success: ok, mode: 'direct' });
      return;
    }

    // 情况2: 通过 webNavigation + scripting 向 iframe 注入
    injectIntoIframe(html, sendResp);
  }

  // ---------- 通过 webNavigation.frameId + scripting 注入 ----------
  function injectIntoIframe(html, sendResp) {
    // 需要 tabId（由 background 缓存）
    var tabId = window.__DI_tabId;
    if (!tabId) {
      // 尝试通过 chrome.tabs.query 获取
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs[0] && tabs[0].id) {
          doInjection(tabs[0].id, html, sendResp);
        } else {
          sendResp({ success: false, message: '无法获取标签页 ID' });
        }
      });
      return;
    }
    doInjection(tabId, html, sendResp);
  }

  function doInjection(tabId, html, sendResp) {
    // 策略A: 通过 postMessage 找同源 iframe
    var rid = 'r' + Date.now();
    var done = false;
    var timer = setTimeout(function () {
      done = true;
      // 策略B: webNavigation.getAllFrames 找 frameId
      tryWebNavInjection(tabId, html, sendResp);
    }, 1500);

    window.addEventListener('message', function handler(ev) {
      var d = ev.data;
      if (!d || d.__DI__ !== true || d.type !== 'insertDone' || d.rid !== rid) return;
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      sendResp({ success: !!d.ok, mode: 'postMessage' });
    });

    // 向所有 iframe 广播 postMessage
    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      try {
        iframes[i].contentWindow.postMessage({ __DI__: true, type: 'doInsert', html: html, rid: rid }, '*');
      } catch (e) {}
    }
  }

  function tryWebNavInjection(tabId, html, sendResp) {
    if (!chrome.webNavigation || !chrome.webNavigation.getAllFrames) {
      sendResp({ success: false, message: 'webNavigation 不可用，请刷新页面重试' });
      return;
    }

    chrome.webNavigation.getAllFrames({ tabId: tabId }, function (frames) {
      if (chrome.runtime.lastError || !frames) {
        sendResp({ success: false, message: '无法枚举子帧' });
        return;
      }

      var target = null;
      for (var i = 0; i < frames.length; i++) {
        var f = frames[i];
        // 排除主帧 (frameId=0)，找编辑相关 URL 的子帧
        if (f.frameId !== 0 && f.url) {
          var u = f.url;
          if (u.indexOf('ueditor') !== -1 || u.indexOf('editor') !== -1 ||
              u.indexOf('appmsg') !== -1 || u.indexOf('mp_weixin') !== -1 ||
              u.indexOf('weixin') !== -1) {
            target = f;
            break;
          }
        }
      }

      if (!target) {
        // 降级：取第一个非主帧
        for (var j = 0; j < frames.length; j++) {
          if (frames[j].frameId !== 0) { target = frames[j]; break; }
        }
      }

      if (!target) {
        sendResp({ success: false, message: '未找到编辑器子帧' });
        return;
      }

      // 通过 scripting.executeScript 向目标帧注入执行
      chrome.scripting.executeScript({
        target: { tabId: tabId, frameIds: [target.frameId] },
        func: function (h) {
          // 在 iframe 中执行的插入函数
          // 解析HTML为独立的段落片段
          function parseToFragments(html) {
            var temp = document.createElement('div');
            temp.innerHTML = html;
            var BLOCK_SET = {};
            ['div','p','section','article','aside','header','footer','h1','h2','h3','h4','h5','h6','ul','ol','blockquote','pre','table','figure','main','nav','details','fieldset','form'].forEach(function(t){BLOCK_SET[t]=true;});
            var frags = [];
            Array.prototype.slice.call(temp.childNodes).forEach(function(node){
              if (node.nodeType === 3) {
                var text = (node.textContent||'').trim();
                if (text.length > 0) {
                  frags.push('<section class="di-html-import" style="display:block;clear:both;margin:0 0 1em 0;padding:0;border:0;box-sizing:border-box;">'+text+'</section>');
                }
              } else if (node.nodeType === 1) {
                var tag = node.tagName.toLowerCase();
                if (tag === 'br') return;
                if (tag === 'p') {
                  var inner = node.innerHTML;
                  var st = node.getAttribute('style')||'';
                  frags.push('<section class="di-html-import" style="display:block;clear:both;margin:0 0 1em 0;padding:0;box-sizing:border-box;'+(st?';'+st:'')+'">'+inner+'</section>');
                } else if (tag === 'style') {
                  frags.push(node.outerHTML);
                } else if (BLOCK_SET[tag]) {
                  var clone = node.cloneNode(true);
                  clone.className = (clone.className?clone.className+' ':'')+'di-html-import';
                  var es = clone.getAttribute('style')||'';
                  var bs = 'display:block;clear:both;';
                  if (es.indexOf('margin')===-1) bs += 'margin:0 0 1em 0;';
                  if (es.indexOf('box-sizing')===-1) bs += 'box-sizing:border-box;';
                  clone.setAttribute('style', bs+es);
                  frags.push(clone.outerHTML);
                } else {
                  frags.push('<section class="di-html-import" style="display:block;clear:both;margin:0 0 1em 0;padding:0;box-sizing:border-box;">'+node.outerHTML+'</section>');
                }
              }
            });
            return frags;
          }

          var els = document.querySelectorAll('[contenteditable="true"], [contenteditable=""]');
          var el = null;
          for (var i = 0; i < els.length; i++) {
            var r = els[i].getBoundingClientRect();
            if (r.width > 200 && r.height > 60) { el = els[i]; break; }
          }
          if (!el && document.body) el = document.body;
          if (!el) return false;

          try { el.focus(); } catch (e) {}
          
          var fragments = parseToFragments(h);
          
          // 策略1: execCommand 逐段插入
          try {
            var sel = window.getSelection();
            var range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
            if (!range || !el.contains(range.startContainer)) {
              range = document.createRange();
              range.selectNodeContents(el);
              range.collapse(false);
            }
            range.deleteContents();
            var allOk = true;
            for (var j = 0; j < fragments.length; j++) {
              if (!document.execCommand('insertHTML', false, fragments[j])) { allOk = false; break; }
            }
            if (allOk && fragments.length > 0) {
              el.dispatchEvent(new Event('input', { bubbles: true }));
              return true;
            }
          } catch(e) {}
          
          // 策略2: Range API 逐段作为兄弟节点插入
          try {
            var sel2 = window.getSelection();
            var range2 = sel2 && sel2.rangeCount > 0 ? sel2.getRangeAt(0) : null;
            if (!range2 || !el.contains(range2.startContainer)) {
              range2 = document.createRange();
              range2.selectNodeContents(el);
              range2.collapse(false);
            }
            range2.deleteContents();
            
            var lastNode = null;
            for (var k = 0; k < fragments.length; k++) {
              var t = document.createElement('div');
              t.innerHTML = fragments[k];
              var bf = document.createDocumentFragment();
              var n;
              while ((n = t.firstChild)) bf.appendChild(n);
              
              var cr = sel2.getRangeAt(0);
              cr.deleteContents();
              cr.insertNode(bf);
              lastNode = bf.lastChild || bf;
              
              var nr = document.createRange();
              nr.setStartAfter(lastNode);
              nr.collapse(true);
              sel2.removeAllRanges();
              sel2.addRange(nr);
            }
            if (lastNode) {
              var fr = document.createRange();
              fr.setStartAfter(lastNode);
              fr.collapse(true);
              sel2.removeAllRanges();
              sel2.addRange(fr);
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          } catch (e) {}
          
          // 策略3: 兜底
          try {
            el.insertAdjacentHTML('beforeend', fragments.join(''));
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          } catch (e2) { return false; }
        },
        args: [html]
      }, function (results) {
        if (chrome.runtime.lastError) {
          sendResp({ success: false, message: '注入失败: ' + chrome.runtime.lastError.message });
          return;
        }
        var ok = results && results[0] && results[0].result;
        sendResp({ success: !!ok, mode: 'scripting' });
      });
    });
  }

  // 缓存 tabId（从 background 接收）
  chrome.runtime.onMessage.addListener(function (req) {
    if (req && req.action === 'tabIdUpdate' && req.tabId) {
      window.__DI_tabId = req.tabId;
    }
  });

  console.log('[深维] ' + chrome.runtime.getManifest().version + ' · ' +
    (IS_TOP ? 'top-level' : 'iframe') + '帧 · 注入链为 11-08 备份版');


  // ============================================================
  // 4.5.0 编辑器光标 / 选区读取（只读能力，完全不碰注入链）
  // 组件卡片改成「点击即插入」后需要两件事：
  //   ① 读编辑器里当前选中的文字，用来替换组件模板的正文
  //   ② 把焦点交还编辑器，让 execCommand('insertHTML') 落在原光标处
  // 插入动作本身仍由备份版 insertInFrame / buildInsertFunc 完成。
  // ============================================================
  var _diEditorCache = null;

  // 在单个 document 里挑「最大的一块可编辑区域」，标题框之类的小输入框会被面积筛掉
  function pickEditorElIn(doc) {
    var best = null;
    var els = doc.querySelectorAll('[contenteditable="true"], [contenteditable=""]');
    for (var i = 0; i < els.length; i++) {
      var node = els[i];
      var r;
      try { r = node.getBoundingClientRect(); } catch (e) { continue; }
      var w = r.width || 0;
      var h = r.height || 0;
      if (w < 120 || h < 40) continue;
      var area = w * h;
      if (!best || area > best.area) best = { el: node, area: area };
    }
    if (best) return best.el;
    var sels = ['.edui-body-container', '.edui-editor-body', '.ProseMirror', 'body[contenteditable]'];
    for (var j = 0; j < sels.length; j++) {
      var hit = doc.querySelector(sels[j]);
      if (hit) return hit;
    }
    return null;
  }

  // 广度优先扫同源 iframe（编辑器几乎总在子帧里），跨域帧静默跳过
  function findEditorTarget() {
    var now = Date.now();
    if (_diEditorCache && now - _diEditorCache.at < 1500) {
      try {
        if (_diEditorCache.el.isConnected && _diEditorCache.doc.defaultView) return _diEditorCache;
      } catch (e) {}
    }
    var best = null;
    var queue = [{ doc: document, depth: 0 }];
    var step = 0;
    while (queue.length && step < 24) {
      var item = queue.shift();
      step++;
      var el = pickEditorElIn(item.doc);
      if (el) {
        var r = { width: 0, height: 0 };
        try { r = el.getBoundingClientRect(); } catch (e) {}
        var area = (r.width || 0) * (r.height || 0);
        if (!best || area > best.area) best = { doc: item.doc, el: el, area: area };
      }
      if (item.depth >= 3) continue;
      var frames = item.doc.querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i++) {
        try {
          var cd = frames[i].contentDocument;
          if (cd && cd.documentElement) queue.push({ doc: cd, depth: item.depth + 1 });
        } catch (e) {}
      }
    }
    if (best) { best.at = now; _diEditorCache = best; }
    return best;
  }

  function readEditorSelectionInfo() {
    var t = findEditorTarget();
    if (!t) return { ok: false, text: '', inEditor: false };
    try {
      var win = t.doc.defaultView;
      var sel = t.doc.getSelection ? t.doc.getSelection() : (win && win.getSelection());
      if (!sel || !sel.rangeCount) return { ok: true, text: '', inEditor: false };
      var text = String(sel.toString() || '');
      var inEditor = false;
      try {
        var range = sel.getRangeAt(0);
        inEditor = t.el.contains(range.startContainer) && t.el.contains(range.endContainer);
      } catch (e) {}
      return {
        ok: true,
        text: text.replace(/\u00a0/g, ' '),
        inEditor: inEditor,
        collapsed: !text.trim()
      };
    } catch (e) {
      return { ok: false, text: '', inEditor: false };
    }
  }

  // collapseSelection=true：把选区收成光标（组件不带文字时用，避免误删选中内容）
  function restoreEditorFocus(collapseSelection) {
    var t = findEditorTarget();
    if (!t) return false;
    try {
      var win = t.doc.defaultView;
      var sel = t.doc.getSelection ? t.doc.getSelection() : (win && win.getSelection());
      var saved = null;
      if (sel && sel.rangeCount) {
        try { saved = sel.getRangeAt(0).cloneRange(); } catch (e) {}
      }
      try { t.el.focus({ preventScroll: true }); } catch (e) { try { t.el.focus(); } catch (e2) {} }
      if (saved && sel) {
        try {
          if (collapseSelection && !saved.collapsed) saved.collapse(false);
          sel.removeAllRanges();
          sel.addRange(saved);
        } catch (e) {}
      }
      return true;
    } catch (e) { return false; }
  }

  // ============================================================
  // 4.3.0 统一入口桥：把「备份版插入能力」直接暴露给同页浮窗面板。
  // 这里只做转发，handleInsert / injectIntoIframe / insertInFrame /
  // parseToParagraphFragments / postMessage 广播等全部保持备份版原文。
  // ============================================================
  var _slotSelectHandler = null;
  var _focusLibraryHandler = null;

  window.__DI_HOST = {
    isTop: IS_TOP,
    tabId: function () { return window.__DI_tabId || null; },
    manifestVersion: function () { return chrome.runtime.getManifest().version; },

    // 模拟扩展页的 chrome.tabs.query：浮窗就工作在目标页面里
    queryActiveTab: function (cb) {
      chrome.runtime.sendMessage({ action: 'getTabId' }, function (r) {
        var id = (r && r.tabId) || window.__DI_tabId || null;
        // 备份版 injectIntoIframe 依赖 window.__DI_tabId，这里顺手同步
        if (id != null) window.__DI_tabId = id;
        cb([{ id: id, url: location.href }]);
      });
    },

    // 模拟 chrome.tabs.sendMessage：优先本地插入（备份版 handleInsert，
    // 当前帧无编辑器时自动 postMessage 广播到 iframe），其余转发 background
    sendMessage: function (msg, cb) {
      if (!msg || !msg.action) { if (cb) cb(null); return; }
      if (msg.action === 'insertHTML') {
        // 备份版 handleInsert 在极端情况下（postMessage 广播 + 帧兜底都失效）
        // 可能不回调；加超时保护，保证降级链不会卡死在半路。
        var settled = false;
        var timer = setTimeout(function () {
          if (settled) return;
          settled = true;
          if (cb) cb({ success: false, reason: 'local_insert_timeout' });
        }, 2500);
        handleInsert(msg.html, function (r) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (cb) cb(r);
        });
        return;
      }
      if (msg.action === 'ping') {
        if (cb) cb({ success: true, version: chrome.runtime.getManifest().version,
                     ready: true, isTop: IS_TOP, hasEditor: !!findEditor() });
        return;
      }
      if (msg.action === 'refreshCustomSlots') {
        if (window.__DI_REFRESH_SLOTS) window.__DI_REFRESH_SLOTS();
        if (cb) cb({ success: true });
        return;
      }
      chrome.runtime.sendMessage(msg, cb);
    },

    // 浮窗本身即 content script，四级降级链里的「主动注入脚本」必然已完成
    ensureInjected: function (cb) { if (cb) cb(true); },

    // 读编辑器选区（点击组件时用来替换组件正文），以及把焦点交还编辑器
    readSelection: function () { return readEditorSelectionInfo(); },
    restoreEditorFocus: function (collapseSelection) { return restoreEditorFocus(collapseSelection); },

    register: function (handlers) {
      if (handlers && handlers.slotSelect) _slotSelectHandler = handlers.slotSelect;
      if (handlers && handlers.focusLibrary) _focusLibraryHandler = handlers.focusLibrary;
    },
    requestSlotSelect: function (idx) {
      if (_slotSelectHandler) _slotSelectHandler(idx);
      else showToast('请在组件库中点击「快捷」', 'info');
    },
    focusLibrary: function () {
      if (_focusLibraryHandler) _focusLibraryHandler();
      else if (window.__DI_TOOLBAR) window.__DI_TOOLBAR.expand();
    },
    togglePanel: function () {
      if (window.__DI_TOOLBAR) window.__DI_TOOLBAR.toggle();
    }
  };

  // 点击扩展图标：展开/收起唯一浮窗
  chrome.runtime.onMessage.addListener(function (req) {
    if (req && req.action === 'togglePanel') window.__DI_HOST.togglePanel();
    if (req && req.action === 'openPanel' && window.__DI_TOOLBAR) window.__DI_TOOLBAR.expand();
  });

})();


// ============================================================
// 4.4.0 统一浮窗：常驻通知层 + 单滚动体位置同步 + 可见滚动轨
// 与注入链完全无关，仅为 UI 层。所有 DOM 查询都做惰性解析，
// 面板（Shadow DOM）晚于工具条挂载也不会失效。
// ============================================================
(function () {
  'use strict';

  // 浮窗只存在于顶层页面；iframe 里无需建位置层，也不必轮询
  if (window !== window.top) return;

  var noticeTimer = null;

  // ---------- 常驻通知条：高对比、可排队、滚动位置无关 ----------
  window.__DI_NOTICE = {
    push: function (msg, type) {
      var box = document.getElementById('di-notice');
      if (!box) return false;
      var lines = box.querySelector('#di-notice-lines');
      if (!lines) return false;

      var line = document.createElement('div');
      line.className = 'di-notice-line di-notice-' + (type || 'info');
      line.textContent = String(msg == null ? '' : msg);   // textContent，杜绝注入
      lines.appendChild(line);
      while (lines.children.length > 3) lines.removeChild(lines.firstChild);
      box.hidden = false;

      if (noticeTimer) clearTimeout(noticeTimer);
      noticeTimer = setTimeout(function () {
        box.hidden = true;
        while (lines.firstChild) lines.removeChild(lines.firstChild);
      }, 3600);
      return true;
    }
  };

  // ---------- 位置同步 ----------
  var el = function (id) { return document.getElementById(id); };
  var toolbar = null, body = null, rail = null, track = null, thumb = null, ticks = null;
  var secEl = null, itemEl = null, pctEl = null, navEl = null, fillEl = null;
  var rafPending = false;
  var lastSection = '', lastItem = '', lastPct = '', lastCard = null;
  var lastTicksHtml = '';

  function ready() {
    toolbar = el('di-floating-toolbar');
    body = el('di-tb-body');
    rail = el('di-rail');
    track = el('di-rail-track');
    thumb = el('di-rail-thumb');
    ticks = el('di-rail-ticks');
    secEl = el('di-pos-section');
    itemEl = el('di-pos-item');
    pctEl = el('di-pos-pct');
    navEl = el('di-pos-nav');
    fillEl = el('di-pos-progress-fill');
    return !!(toolbar && body && rail && track && thumb && ticks &&
              secEl && itemEl && pctEl && navEl && fillEl);
  }

  function shadowRoot() {
    var host = el('di-panel-host');
    return host && host.shadowRoot ? host.shadowRoot : null;
  }

  // 跨 Shadow DOM 边界收集分区，按视觉顺序（rect.top）排序
  // 一次读齐分区矩形，返回 { el, name, hint, top, off }，按视觉顺序排序
  function collectSections(bodyRect) {
    var out = [];
    function add(nodes) {
      for (var j = 0; j < nodes.length; j++) {
        var n = nodes[j], r = n.getBoundingClientRect();
        out.push({
          el: n,
          name: n.getAttribute('data-di-section'),
          hint: n.getAttribute('data-di-hint') || '',
          top: r.top,
          off: r.top - bodyRect.top + body.scrollTop
        });
      }
    }
    add(toolbar.querySelectorAll('[data-di-section]'));
    var sr = shadowRoot();
    if (sr) add(sr.querySelectorAll('[data-di-section]'));
    out.sort(function (a, b) { return a.top - b.top; });
    return out;
  }

  // 分区导航为静态预置，滚动时只切换高亮，不重建 DOM：静态与滚动中完全一致
  function syncNav(activeName) {
    var chips = navEl.querySelectorAll('.di-pos-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('active', chips[i].getAttribute('data-di-goto') === activeName);
    }
  }

  function setText(node, value, cacheKey) {
    var old = cacheKey === 'section' ? lastSection : (cacheKey === 'item' ? lastItem : lastPct);
    if (old === value) return;
    if (cacheKey === 'section') lastSection = value;
    else if (cacheKey === 'item') lastItem = value;
    else lastPct = value;
    node.textContent = value;
  }

  function update() {
    rafPending = false;
    if (!body || !body.isConnected) return;

    // ---- 读阶段：一次性取完所有几何量，避免逐帧强制重排 ----
    var bodyRect = body.getBoundingClientRect();
    var readingLine = bodyRect.top + 18;
    var sections = collectSections(bodyRect);
    if (!sections.length) return;

    var maxScroll = Math.max(0, body.scrollHeight - body.clientHeight);
    var ratio = maxScroll > 0 ? Math.min(1, Math.max(0, body.scrollTop / maxScroll)) : 0;
    var docH = Math.max(1, body.scrollHeight);
    var trackH = track.clientHeight || 1;

    // 当前分区：最后一个越过阅读线的分区
    var activeIdx = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].top <= readingLine + 1) activeIdx = i;
    }
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 2) activeIdx = sections.length - 1;
    var active = sections[activeIdx];

    // 当前条目：组件库里定位最靠上的可见卡片
    var itemText = active.hint;
    var sr = shadowRoot();
    var currentCard = null;
    if (active.name === '组件库' && sr) {
      var cards = sr.querySelectorAll('.component-card');
      for (i = 0; i < cards.length; i++) {
        var r = cards[i].getBoundingClientRect();
        if (r.bottom > readingLine && r.top < bodyRect.bottom) {
          var title = cards[i].querySelector('.card-title');
          currentCard = cards[i];
          itemText = '第 ' + (i + 1) + ' / ' + cards.length + ' 项' +
                     (title ? ' · ' + title.textContent : '');
          break;
        }
      }
      if (!currentCard && cards.length) itemText = '共 ' + cards.length + ' 个组件 · 继续向下滚动';
    }

    var pct = Math.round(ratio * 100) + '%';
    var thumbH = Math.max(38, Math.min(trackH, (body.clientHeight / docH) * trackH));
    var thumbTop = Math.max(0, Math.min(trackH - thumbH, ratio * (trackH - thumbH)));
    var ticksHtml = '';
    for (i = 0; i < sections.length; i++) {
      var y = Math.max(0, Math.min(trackH - 2, (sections[i].off / docH) * trackH));
      ticksHtml += '<span class="di-rail-tick' + (i === activeIdx ? ' active' : '') +
                   '" style="top:' + y.toFixed(1) + 'px" title="' +
                   String(sections[i].name).replace(/"/g, '') + '"></span>';
    }

    // ---- 写阶段：只在值变化时写，静态与滚动中视觉完全一致 ----
    for (i = 0; i < sections.length; i++) {
      sections[i].el.classList.toggle('di-section-active', i === activeIdx);
    }
    syncNav(active.name);
    setText(secEl, active.name, 'section');

    if (lastCard !== currentCard) {
      if (lastCard) lastCard.classList.remove('di-card-current');
      if (currentCard) currentCard.classList.add('di-card-current');
      lastCard = currentCard;
    }
    setText(itemEl, itemText, 'item');
    setText(pctEl, pct, 'pct');
    fillEl.style.width = pct;
    thumb.style.height = thumbH + 'px';
    thumb.style.top = thumbTop + 'px';
    if (ticksHtml !== lastTicksHtml) { ticks.innerHTML = ticksHtml; lastTicksHtml = ticksHtml; }
  }

  function schedule() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(update);
  }

  function scrollToSection(name, allowRetry) {
    var sections = collectSections(body.getBoundingClientRect());
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].name !== name) continue;
      var top = Math.max(0, sections[i].off - 6);
      try { body.scrollTo({ top: top, behavior: 'smooth' }); }
      catch (e) { body.scrollTop = top; }
      return;
    }
    // 面板尚未挂载时，等它出现后补一次跳转
    if (allowRetry !== false) setTimeout(function () { scrollToSection(name, false); }, 350);
  }

  function bind() {
    if (!ready()) return false;

    body.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    navEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.di-pos-chip');
      if (chip) scrollToSection(chip.getAttribute('data-di-goto'));
    });
    window.addEventListener('di:goto-section', function (e) {
      var name = e && e.detail && e.detail.section;
      if (name) scrollToSection(name);
    });
    window.addEventListener('di:ui-changed', schedule);

    el('di-notice-close').addEventListener('click', function () {
      var box = el('di-notice'), lines = el('di-notice-lines');
      box.hidden = true;
      while (lines.firstChild) lines.removeChild(lines.firstChild);
    });

    // 滚动轨：点击跳转 / 拖拽滑块 / 滚轮透传
    var maxScroll = function () { return Math.max(0, body.scrollHeight - body.clientHeight); };
    track.addEventListener('click', function (e) {
      if (e.target === thumb) return;
      var r = track.getBoundingClientRect();
      var frac = Math.min(1, Math.max(0, (e.clientY - r.top) / (r.height || 1)));
      body.scrollTop = frac * maxScroll();
    });
    rail.addEventListener('wheel', function (e) {
      body.scrollTop += e.deltaY;
      e.preventDefault();
    }, { passive: false });

    var dragging = false, startY = 0, startTop = 0;
    thumb.addEventListener('mousedown', function (e) {
      dragging = true; startY = e.clientY; startTop = body.scrollTop;
      e.preventDefault(); e.stopPropagation();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var trackH = track.clientHeight || 1;
      var thumbH = thumb.offsetHeight || 38;
      var usable = Math.max(1, trackH - thumbH);
      body.scrollTop = startTop + ((e.clientY - startY) / usable) * maxScroll();
    });
    document.addEventListener('mouseup', function () { dragging = false; });

    // 面板内容重新渲染 / 弹窗开关后，分区高度会变，重算一次
    var mo = new MutationObserver(schedule);
    // 只观察 childList：若观察 style 属性，滑块自身的写入会触发回调形成自激循环
    mo.observe(toolbar, { childList: true, subtree: true });
    observeShadow(mo, 40);
    return true;
  }

  // Shadow Root 晚于工具条挂载，补齐对面板内部变动的观察
  function observeShadow(mo, attempt) {
    var sr = shadowRoot();
    if (sr) {
      mo.observe(sr, { childList: true, subtree: true, characterData: true });
      schedule();
      return;
    }
    if (attempt > 0) setTimeout(function () { observeShadow(mo, attempt - 1); }, 200);
  }

  function boot(attempt) {
    if (!bind()) {
      if (attempt > 0) setTimeout(function () { boot(attempt - 1); }, 160);
      return;
    }
    schedule();
    // 面板挂载 / 组件列表渲染后再补算，确保初始状态就显示正确位置
    setTimeout(schedule, 500);
    setTimeout(schedule, 1400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(60); });
  } else {
    boot(60);
  }
})();
