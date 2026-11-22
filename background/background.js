// ============================================================
// 深维公众号组件库 · Service Worker（注入链为 11-08 基准版）
// 职责：tabId 缓存、Side Panel 打开、消息中转、直接注入
// 直接注入策略（优先级从高到低）：
//   1. 遍历所有 iframe，用 scripting 在含 contenteditable 的帧中直接插入
//   2. scripting 在 top-level 帧中插入
//   3. 回退：通知 content script 用 postMessage 广播
//   4. 最终兜底：通知 content script 复制到剪贴板
// ============================================================

var _lastTabId = null;
var _editorFrameId = null;  // 缓存找到的编辑器 iframe frameId

// 每次插件图标被点击时（Chrome 114+ sidePanel 触发）
// 唯一窗口是页面内浮窗，不再注册侧边栏。
// 点击扩展图标 → 让 content script 展开/收起同一个浮窗。
try {
  if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener(function (tab) {
      if (!tab || tab.id == null) return;
      chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }, function () {
        void chrome.runtime.lastError;   // 页面未注入脚本时忽略
      });
    });
  }
} catch (e) {}

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('[深维] ' + chrome.runtime.getManifest().version + ' 已安装 · ' + details.reason);
});

// ---------- 查找微信公众号编辑器所在 iframe ----------
// 策略：枚举所有帧，逐个用 scripting 检测是否含 contenteditable 元素
function findEditorFrame(tabId, callback) {
  // 如果已缓存且有效，直接返回
  if (_editorFrameId) {
    callback(_editorFrameId, true);  // true 表示缓存命中
    return;
  }

  if (!chrome.webNavigation || !chrome.webNavigation.getAllFrames) {
    callback(null, false);
    return;
  }

  chrome.webNavigation.getAllFrames({ tabId: tabId }, function (frames) {
    if (!frames || frames.length === 0) {
      callback(null, false);
      return;
    }

    // 优先级排序：先检查可能包含编辑器的 iframe
    var candidates = [];
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (f.frameId === 0) continue;  // 跳过主帧
      var u = f.url || '';
      // 高优先级：URL 含编辑器关键词
      var priority = 0;
      if (u.indexOf('ueditor') !== -1) priority = 3;
      else if (u.indexOf('editor') !== -1) priority = 2;
      else if (u.indexOf('appmsg') !== -1 || u.indexOf('weixin') !== -1) priority = 1;
      if (priority > 0) {
        candidates.push({ frameId: f.frameId, priority: priority });
      }
    }
    // 按优先级排序
    candidates.sort(function (a, b) { return b.priority - a.priority; });

    // 也加入所有其他非主帧作为候选
    var addedSet = {};
    candidates.forEach(function (c) { addedSet[c.frameId] = true; });
    for (var j = 0; j < frames.length; j++) {
      if (frames[j].frameId !== 0 && !addedSet[frames[j].frameId]) {
        candidates.push({ frameId: frames[j].frameId, priority: 0 });
      }
    }

    // 逐帧探测，找到含 contenteditable 的帧
    probeFramesForEditor(tabId, candidates, 0, callback);
  });
}

// 逐帧探测：用 scripting 检测帧中是否有 contenteditable 元素
function probeFramesForEditor(tabId, candidates, index, callback) {
  if (index >= candidates.length) {
    // 所有候选帧都没找到，返回 null
    callback(null, false);
    return;
  }

  var frameId = candidates[index].frameId;
  chrome.scripting.executeScript({
    target: { tabId: tabId, frameIds: [frameId] },
    func: function () {
      var els = document.querySelectorAll('[contenteditable="true"], [contenteditable=""]');
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        if (r.width > 200 && r.height > 60) return true;
      }
      return !!document.querySelector('.edui-editor-body, #ueditor_0, .ke-container');
    }
  }).then(function (results) {
    if (results && results[0] && results[0].result === true) {
      _editorFrameId = frameId;
      callback(frameId, false);
    } else {
      probeFramesForEditor(tabId, candidates, index + 1, callback);
    }
  }).catch(function () {
    // 该帧无法注入（跨域等），跳过
    probeFramesForEditor(tabId, candidates, index + 1, callback);
  });
}

// ---------- 核心：在目标帧中执行 HTML 插入 ----------
// 核心修复：确保每个块级段落作为独立兄弟节点注入，
// 避免被包裹在单个div中导致UEditor扁平化段落结构
function buildInsertFunc() {
  return function (h) {
    // 查找可编辑区域
    function findEditor() {
      var els = document.querySelectorAll('[contenteditable="true"], [contenteditable=""]');
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        if (r.width > 200 && r.height > 60) return els[i];
      }
      return document.querySelector('.edui-editor-body') ||
             document.querySelector('#ueditor_0') ||
             document.querySelector('.ke-container') || null;
    }
    
    // 解析HTML为独立的段落片段
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
            fragments.push(
              '<section class="di-html-import" style="display:block;clear:both;margin:0 0 1em 0;padding:0;border:0;box-sizing:border-box;">' +
              text +
              '</section>'
            );
          }
        } else if (node.nodeType === 1) { // ELEMENT_NODE
          var tag = node.tagName.toLowerCase();
          if (tag === 'br') return;
          
          if (tag === 'p') {
            // 将 <p> 转换为 <section>，保留样式和内容
            var innerHTML = node.innerHTML;
            var style = node.getAttribute('style') || '';
            var mergedStyle = 'display:block;clear:both;margin:0 0 1em 0;padding:0;box-sizing:border-box;' +
                             (style ? ';' + style : '');
            fragments.push(
              '<section class="di-html-import" style="' + mergedStyle + '">' + innerHTML + '</section>'
            );
          } else if (tag === 'style') {
            fragments.push(node.outerHTML);
          } else if (BLOCK_SET[tag]) {
            var clone = node.cloneNode(true);
            clone.className = (clone.className ? clone.className + ' ' : '') + 'di-html-import';
            var existingStyle = clone.getAttribute('style') || '';
            var blockStyle = 'display:block;clear:both;';
            if (existingStyle.indexOf('margin') === -1) blockStyle += 'margin:0 0 1em 0;';
            if (existingStyle.indexOf('box-sizing') === -1) blockStyle += 'box-sizing:border-box;';
            clone.setAttribute('style', blockStyle + existingStyle);
            fragments.push(clone.outerHTML);
          } else {
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

    var editor = findEditor();
    if (!editor) return { ok: false, reason: 'no_editor' };

    try { editor.focus(); } catch (e) {}
    
    var fragments = parseToParagraphFragments(h);

    // 策略1: execCommand('insertHTML') — 逐段插入，确保独立段落结构
    try {
      var sel = window.getSelection();
      var range = null;
      if (sel && sel.rangeCount > 0) range = sel.getRangeAt(0);
      if (!range || !editor.contains(range.startContainer)) {
        range = document.createRange();
        range.selectNodeContents(editor);
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
        try {
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) {}
        try {
          var inst = window.UE && window.UE.instants && window.UE.instants['ueditor_0'];
          if (inst) {
            if (inst.fireEvent) inst.fireEvent('contentChange');
            if (inst.sync) inst.sync();
          }
        } catch (e) {}
        return { ok: true, mode: 'execCommand' };
      }
    } catch (e) {
      // execCommand 失败，回退到 Range API
    }

    // 策略2: Range API — 逐段作为兄弟节点插入
    try {
      var sel2 = window.getSelection();
      var range2 = null;
      if (sel2 && sel2.rangeCount > 0) range2 = sel2.getRangeAt(0);
      if (!range2 || !editor.contains(range2.startContainer)) {
        range2 = document.createRange();
        range2.selectNodeContents(editor);
        range2.collapse(false);
      }
      
      sel2.removeAllRanges();
      sel2.addRange(range2);
      
      var lastInsertedNode = null;
      for (var j = 0; j < fragments.length; j++) {
        var temp = document.createElement('div');
        temp.innerHTML = fragments[j];
        
        var blockFrag = document.createDocumentFragment();
        var node;
        while ((node = temp.firstChild)) {
          blockFrag.appendChild(node);
        }
        
        var curRange = sel2.getRangeAt(0);
        curRange.deleteContents();
        curRange.insertNode(blockFrag);
        
        lastInsertedNode = blockFrag.lastChild || blockFrag;
        
        var nextRange = document.createRange();
        nextRange.setStartAfter(lastInsertedNode);
        nextRange.collapse(true);
        sel2.removeAllRanges();
        sel2.addRange(nextRange);
      }
      
      if (lastInsertedNode) {
        var finalRange = document.createRange();
        finalRange.setStartAfter(lastInsertedNode);
        finalRange.collapse(true);
        sel2.removeAllRanges();
        sel2.addRange(finalRange);
      }
      
      try {
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {}
      try {
        var inst2 = window.UE && window.UE.instants && window.UE.instants['ueditor_0'];
        if (inst2) {
          if (inst2.fireEvent) inst2.fireEvent('contentChange');
          if (inst2.sync) inst2.sync();
        }
      } catch (e) {}
      return { ok: true, mode: 'rangeApi' };
    } catch (e) {
      // Range API 也失败
    }

    // 策略3: 兜底 insertAdjacentHTML
    try {
      var joinedHTML = fragments.join('');
      editor.insertAdjacentHTML('beforeend', joinedHTML);
      try {
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      } catch (e) {}
      return { ok: true, mode: 'adjacentHtml' };
    } catch (e) {
      return { ok: false, reason: 'all_methods_failed' };
    }
  };
}

// ---------- 通过 chrome.scripting.executeScript 直接注入 ----------
function doScriptingInsert(tabId, frameId, html, sendResp) {
  if (!chrome.scripting || !chrome.scripting.executeScript) {
    sendResp({ success: false, reason: 'scripting API 不可用' });
    return;
  }

  var insertFunc = buildInsertFunc();

  var injectionTarget = { tabId: tabId };
  if (frameId && frameId > 0) {
    injectionTarget.frameIds = [frameId];
  } else {
    injectionTarget.frameIds = [0];  // 主帧
  }

  chrome.scripting.executeScript({
    target: injectionTarget,
    func: insertFunc,
    args: [html]
  }).then(function (results) {
    var result = results && results[0] && results[0].result;
    if (result && result.ok) {
      sendResp({ success: true, mode: result.mode, frameId: frameId });
    } else {
      sendResp({ success: false, reason: (result && result.reason) || 'insert_failed' });
    }
  }).catch(function (err) {
    console.log('[深维] scripting 插入失败:', err);
    sendResp({ success: false, reason: err.message || err });
  });
}

// ---------- 多帧尝试注入：依次尝试编辑器帧 → 所有子帧 → 主帧 ----------
function tryMultiFrameInsert(tabId, html, sendResp) {
  findEditorFrame(tabId, function (editorFrameId, fromCache) {
    if (editorFrameId) {
      // 找到编辑器帧，直接注入
      doScriptingInsert(tabId, editorFrameId, html, function (resp) {
        if (resp.success) {
          sendResp(resp);
          return;
        }
        // 编辑器帧注入失败，尝试主帧
        doScriptingInsert(tabId, 0, html, sendResp);
      });
      return;
    }

    // 未找到编辑器帧，尝试主帧
    doScriptingInsert(tabId, 0, html, function (resp) {
      if (resp.success) {
        sendResp(resp);
        return;
      }
      // 主帧也失败，回退到 content script 的 postMessage 方式
      chrome.tabs.sendMessage(tabId, {
        action: 'insertHTML',
        html: html
      }, function (r) {
        if (chrome.runtime.lastError || !r || !r.success) {
          sendResp({ success: false, reason: '所有注入策略均失败', fallback: 'clipboard' });
        } else {
          sendResp(r);
        }
      });
    });
  });
}

// ---------- 消息监听 ----------
chrome.runtime.onMessage.addListener(function (req, sender, sendResp) {
  if (!req || !req.action) return;

  if (req.action === 'cacheTabId') {
    _lastTabId = req.tabId;
    sendResp({ ok: true });
    return true;
  }

  if (req.action === 'getTabId') {
    if (sender.tab && sender.tab.id) {
      _lastTabId = sender.tab.id;
    }
    sendResp({ tabId: _lastTabId });
    return true;
  }

  if (req.action === 'getVersion') {
    sendResp({ version: chrome.runtime.getManifest().version, name: chrome.runtime.getManifest().name });
    return true;
  }

  // ---------- 直接注入（最高优先级） ----------
  if (req.action === 'directInsert') {
    var html = req.html;
    var tabId = _lastTabId || req.tabId;
    if (!tabId) {
      sendResp({ success: false, reason: '无 tabId' });
      return true;
    }
    tryMultiFrameInsert(tabId, html, sendResp);
    return true;
  }

  // ---------- 回退：让 content script 处理（postMessage 方式） ----------
  if (req.action === 'insertHTML') {
    var tabId = _lastTabId || req.tabId;
    if (!tabId) {
      sendResp({ success: false, reason: '无 tabId' });
      return true;
    }
    // 通知 content script 通过 postMessage 处理
    chrome.tabs.sendMessage(tabId, {
      action: 'insertHTML',
      html: req.html
    }, function (resp) {
      if (chrome.runtime.lastError) {
        sendResp({ success: false, reason: chrome.runtime.lastError.message });
      } else {
        sendResp(resp || { success: false });
      }
    });
    return true;
  }

  return false;
});

// ---------- 标签页切换时更新缓存 ----------
chrome.tabs.onActivated.addListener(function (activeInfo) {
  _lastTabId = activeInfo.tabId;
  _editorFrameId = null;  // 切换标签页时清空缓存
});

// ---------- 标签页更新时也更新 ----------
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab && tab.url && tab.url.indexOf('mp.weixin.qq.com') !== -1) {
    _lastTabId = tabId;
    _editorFrameId = null;  // 页面刷新时清空编辑器帧缓存
  }
});

console.log('[深维] Service Worker ' + chrome.runtime.getManifest().version + ' 已启动');
