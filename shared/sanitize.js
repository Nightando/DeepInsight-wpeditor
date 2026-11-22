// ============================================================
// 深维公众号组件库 · 共享 HTML 清洗模块
// 用途：
//   clean()   : 组件渲染结果的强清洗，用于组件预览与组件插入
//   minimal() : 仅剥离可执行脚本，保留全部标签、结构与样式，用于导入 HTML 预览
//   导入 HTML 的「插入」路径默认完全不清洗，保持用户网页原封不动
// 环境：页面浮窗面板与 content script 共用（isolated world）。
//       注意：导入网页的注入链为 11-08 备份版，走 background 的
//       scripting.executeScript(func)，注入函数完全自包含、不清洗输入；
//       本模块只用于组件渲染预览、组件插入与导入预览，不得套到导入插入上。
// ============================================================

(function (global) {
  'use strict';

  // 强清洗移除的标签：可执行脚本、外部资源容器、表单控件、嵌套文档
  // 注意：<svg> 为组件库在用的内联矢量图，予以保留，但危险子元素单独禁止
  var FORBIDDEN_TAGS = {
    script: 1, noscript: 1, iframe: 1, frame: 1, frameset: 1,
    object: 1, embed: 1, applet: 1, portal: 1,
    link: 1, meta: 1, base: 1, template: 1,
    form: 1, input: 1, button: 1, select: 1, textarea: 1, option: 1,
    math: 1, canvas: 1, video: 1, audio: 1, source: 1, track: 1,
    foreignobject: 1, animate: 1, animatetransform: 1, set: 1, image: 1
  };

  // 极简清洗只移除这些会执行脚本或嵌入外部文档的标签
  var SCRIPT_TAGS = {
    script: 1, noscript: 1, iframe: 1, frame: 1, frameset: 1,
    object: 1, embed: 1, applet: 1, portal: 1
  };

  // 需要校验协议的 URL 类属性
  var URL_ATTRS = ['href', 'src', 'xlink:href', 'action', 'formaction', 'poster', 'background', 'data'];

  var SAFE_URL_RE = /^(?:(?:https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)|(?:data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,))/i;
  var UNSAFE_CSS_RE = /@import|expression\s*\(|javascript\s*:|vbscript\s*:|behavior\s*:|-moz-binding|url\s*\(\s*['"]?\s*(?:javascript|vbscript|data:text\/html)/gi;

  function cleanCss(text) {
    return String(text || '').replace(UNSAFE_CSS_RE, '');
  }

  function isSafeUrl(value) {
    var v = String(value || '').trim();
    if (!v) return true;
    var normalized = v.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
    if (normalized.indexOf('javascript:') === 0 ||
        normalized.indexOf('vbscript:') === 0 ||
        normalized.indexOf('file:') === 0 ||
        normalized.indexOf('data:text/html') === 0) return false;
    if (SAFE_URL_RE.test(v)) return true;
    return !/^[a-z][a-z0-9+.-]*:/i.test(v);
  }

  function removeNode(el) {
    if (el.parentNode) el.parentNode.removeChild(el);
  }

  /** 用 <template> 惰性解析，解析阶段不执行脚本、不发起网络请求 */
  function parse(html) {
    var tpl = document.createElement('template');
    try {
      tpl.innerHTML = String(html == null ? '' : html);
    } catch (e) {
      // 保留已解析的部分
    }
    return tpl.content;
  }

  /**
   * 序列化 DocumentFragment。
   * 重点：DocumentFragment 不实现 InnerHTML mixin，读 fragment.innerHTML 会
   * 得到 undefined（曾导致预览显示 "undefined"、插入按钮静默失效）。
   * 必须把子节点转移到真实 Element 上再取其 innerHTML。
   */
  function serialize(root) {
    var out = document.createElement('div');
    while (root.firstChild) out.appendChild(root.firstChild);
    return out.innerHTML;
  }

  function stripExecutableAttrs(el) {
    var attrs = Array.prototype.slice.call(el.attributes);
    for (var j = 0; j < attrs.length; j++) {
      var name = attrs[j].name.toLowerCase();
      if (name.indexOf('on') === 0 || name === 'srcdoc') {
        el.removeAttribute(attrs[j].name);
      } else if (URL_ATTRS.indexOf(name) !== -1 && !isSafeUrl(attrs[j].value)) {
        el.removeAttribute(attrs[j].name);
      }
    }
  }

  /** 组件用强清洗 */
  function clean(html) {
    if (typeof html !== 'string' || !html) return '';

    var root = parse(html);
    var nodes = root.querySelectorAll('*');
    for (var i = nodes.length - 1; i >= 0; i--) {
      var el = nodes[i];
      var tag = (el.tagName || '').toLowerCase();

      if (FORBIDDEN_TAGS[tag]) {
        removeNode(el);
        continue;
      }
      if (tag === 'style') el.textContent = cleanCss(el.textContent);

      stripExecutableAttrs(el);

      var styleAttr = el.getAttribute('style');
      if (styleAttr) {
        UNSAFE_CSS_RE.lastIndex = 0;
        if (UNSAFE_CSS_RE.test(styleAttr)) el.setAttribute('style', cleanCss(styleAttr));
      }
    }
    return serialize(root);
  }

  /**
   * 导入 HTML 预览用极简清洗：
   * 只剥离脚本类标签、事件属性与危险协议，
   * 保留 link / meta / style / @import / svg / 表单 / 全部 class 与内联样式，
   * 不改写任何标签、不包裹 section、不加 display 样式。
   */
  function minimal(html) {
    if (typeof html !== 'string' || !html) return '';

    var root = parse(html);
    var nodes = root.querySelectorAll('*');
    for (var i = nodes.length - 1; i >= 0; i--) {
      var el = nodes[i];
      var tag = (el.tagName || '').toLowerCase();
      if (SCRIPT_TAGS[tag]) {
        removeNode(el);
        continue;
      }
      stripExecutableAttrs(el);
    }
    return serialize(root);
  }

  /** 提取纯文本，用于剪贴板的 text/plain 分支 */
  function plainText(html) {
    if (typeof html !== 'string' || !html) return '';
    return (parse(html).textContent || '').trim();
  }

  /** 转义字符串，供组件字段拼接前使用 */
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  global.DI_SANITIZE = {
    version: '1.1.0',
    clean: clean,
    minimal: minimal,
    plainText: plainText,
    escapeHtml: escapeHtml
  };
})(typeof window !== 'undefined' ? window : self);
