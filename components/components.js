// ============================================================
// 深维公众号插件 - 组件库 v5.0
// 基于 inline style · 全组件支持 Ctrl+V 粘贴
// ============================================================

window.DEEPINSIGHT_COMPONENTS = {
  version: '5.0.0',
  categories: {
    layout: '布局与分隔',
    text: '文本与段落',
    box: '信息框',
    data: '数据展示',
    media: '图片与媒体',
    tag: '标签与分类',
    end: '结尾模块',
    quote: '引用与金句',
    list: '列表与序号',
    qa: '问答与教程',
    timeline: '时间轴',
    divider: '分隔与装饰'
  },
  list: [

    // ===== 文本段落类 =====
    {
      id: 'paragraph',
      name: '正文段落',
      category: 'text',
      description: '标准正文段落 · 16px/1.9行高',
      icon: '¶',
      fields: [
        { name: 'text', label: '段落文字', type: 'textarea', default: '这里是段落文字内容，直接输入即可。建议每段控制在3-5行，保持阅读节奏。' }
      ],
      render: function(f) {
        return '<section style="margin:0 0 16px;color:#2d2d2d;font-size:16px;line-height:1.9;letter-spacing:0.5px;text-align:justify">' + (f.text || '') + '</section>';
      }
    },
    {
      id: 'paragraph-first-line-indent',
      name: '首行缩进段落',
      category: 'text',
      description: '中文排版首行缩进2字符',
      icon: '⇥',
      fields: [
        { name: 'text', label: '段落文字', type: 'textarea', default: '这是一段采用首行缩进格式的正文内容。中文排版规范中，正文段落通常会在开头缩进两个字符的位置，使文章结构更加清晰，阅读体验更舒适。' }
      ],
      render: function(f) {
        return '<section style="margin:0 0 16px;color:#2d2d2d;font-size:16px;line-height:1.9;text-indent:2em;letter-spacing:0.5px">' + (f.text || '') + '</section>';
      }
    },
    {
      id: 'paragraph-dashed',
      name: '虚线边框段落',
      category: 'text',
      description: '带虚线边框的重点段落',
      icon: '▢',
      fields: [
        { name: 'text', label: '段落文字', type: 'textarea', default: '这是一段带有虚线边框的重点内容，适合用来强调某段文字或作为过渡段落。' },
        { name: 'color', label: '边框颜色', type: 'color', default: '#b2d9c4' },
        { name: 'bgColor', label: '背景颜色', type: 'color', default: '#fafcfa' }
      ],
      render: function(f) {
        return '<section style="margin:20px 0;padding:16px 20px;background:' + (f.bgColor || '#fafcfa') + ';border-top:1px dashed ' + (f.color || '#b2d9c4') + ';border-bottom:1px dashed ' + (f.color || '#b2d9c4') + ';font-size:16px;line-height:1.9;color:#2d2d2d">' + (f.text || '') + '</section>';
      }
    },
    {
      id: 'paragraph-quote',
      name: '引用段落',
      category: 'text',
      description: '灰色斜体引用段落',
      icon: '❝',
      fields: [
        { name: 'text', label: '引用文字', type: 'textarea', default: '这是一段引用他人的话语或观点，用斜体和灰色来区分于正文，适合表达引用的内容。' }
      ],
      render: function(f) {
        return '<section style="margin:20px 0;padding:12px 20px;color:#7a7a7a;font-size:15px;line-height:1.9;font-style:italic;background:#fafafa">' + (f.text || '') + '</section>';
      }
    },
    {
      id: 'paragraph-indent',
      name: '首行缩进正文',
      category: 'text',
      description: '带边框的首行缩进段落',
      icon: '↳',
      fields: [
        { name: 'text', label: '段落文字', type: 'textarea', default: '这是一段带有装饰边框的首行缩进正文内容。适合用于重要段落或章节开头，既保持中文传统排版习惯，又有视觉亮点。' },
        { name: 'color', label: '装饰色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:20px 0;padding:16px 22px;background:#fafcfb;border-top:2px solid ' + (f.color || '#b2d9c4') + ';border-bottom:2px solid ' + (f.color || '#b2d9c4') + ';color:#2d2d2d;font-size:16px;line-height:1.9;text-indent:2em;letter-spacing:0.5px">' + (f.text || '') + '</section>';
      }
    },
    {
      id: 'paragraph-bold',
      name: '加粗强调段落',
      category: 'text',
      description: '加粗重点段落 · 吸引目光',
      icon: 'B',
      fields: [
        { name: 'text', label: '段落文字', type: 'textarea', default: '这是一段需要重点强调的内容，通过加粗和主色调来突出显示，适合放在文章重要位置。' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:20px 0;padding:14px 20px;background:#f7f9fc;color:' + (f.color || '#0d2540') + ';font-size:16px;font-weight:700;line-height:1.9;letter-spacing:0.5px">' + (f.text || '') + '</section>';
      }
    },

    // ===== 小标题/装饰类 =====
    {
      id: 'subtitle-decor',
      name: '美化小标题',
      category: 'layout',
      description: '带装饰线的章节小标题',
      icon: '§',
      fields: [
        { name: 'title', label: '小标题文字', type: 'text', default: '核心发现' },
        { name: 'color', label: '标题颜色', type: 'color', default: '#0d2540' },
        { name: 'lineColor', label: '装饰线颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:32px 0 16px;display:flex;align-items:center">' +
                 '<div style="display:inline-block;padding-right:16px">' +
                   '<span style="font-size:18px;font-weight:700;color:' + (f.color || '#0d2540') + ';letter-spacing:1px">' + (f.title || '小标题') + '</span>' +
                 '</div>' +
                 '<div style="flex:1;height:2px;background:linear-gradient(to right,' + (f.lineColor || '#b2d9c4') + ',transparent)"></div>' +
               '</section>';
      }
    },
    {
      id: 'subtitle-number',
      name: '编号小标题',
      category: 'layout',
      description: '带圆形编号的章节标题',
      icon: '①',
      fields: [
        { name: 'title', label: '标题文字', type: 'text', default: '第一步：分析需求' },
        { name: 'number', label: '编号', type: 'text', default: '01' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0 16px;display:flex;align-items:center;gap:12px">' +
                 '<div style="width:34px;height:34px;background:' + (f.color || '#0d2540') + ';color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">' + (f.number || '01') + '</div>' +
                 '<div style="font-size:17px;font-weight:700;color:' + (f.color || '#0d2540') + ';letter-spacing:0.5px">' + (f.title || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'subtitle-center',
      name: '居中装饰标题',
      category: 'layout',
      description: '居中对称装饰线的二级标题',
      icon: '❖',
      fields: [
        { name: 'title', label: '标题文字', type: 'text', default: '本章要点' },
        { name: 'color', label: '标题颜色', type: 'color', default: '#0d2540' },
        { name: 'lineColor', label: '装饰线颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0 20px;text-align:center">' +
                 '<div style="display:inline-block;position:relative;padding:0 40px">' +
                   '<span style="font-size:18px;font-weight:700;color:' + (f.color || '#0d2540') + ';letter-spacing:3px">' + (f.title || '') + '</span>' +
                   '<div style="position:absolute;top:50%;left:0;width:30px;height:2px;background:' + (f.lineColor || '#b2d9c4') + '"></div>' +
                   '<div style="position:absolute;top:50%;right:0;width:30px;height:2px;background:' + (f.lineColor || '#b2d9c4') + '"></div>' +
                 '</div>' +
               '</section>';
      }
    },
    {
      id: 'subtitle-left-border',
      name: '左侧竖线标题',
      category: 'layout',
      description: '左侧彩色竖线+标题',
      icon: '▌',
      fields: [
        { name: 'title', label: '标题文字', type: 'text', default: '重点章节' },
        { name: 'color', label: '竖线颜色', type: 'color', default: '#0d2540' },
        { name: 'bgColor', label: '背景色', type: 'color', default: '#f7f9fc' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0 16px;padding:10px 18px;background:' + (f.bgColor || '#f7f9fc') + '">' +
                 '<span style="font-size:17px;font-weight:700;color:' + (f.color || '#0d2540') + ';letter-spacing:1px">' + (f.title || '') + '</span>' +
               '</section>';
      }
    },
    {
      id: 'subtitle-bottom-border',
      name: '下渐变线标题',
      category: 'layout',
      description: '文字下方渐变短装饰线',
      icon: '═',
      fields: [
        { name: 'title', label: '标题文字', type: 'text', default: '数据洞察' },
        { name: 'color', label: '标题颜色', type: 'color', default: '#0d2540' },
        { name: 'lineColor', label: '装饰线颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0 18px;padding-bottom:10px;border-bottom:3px solid transparent">' +
                 '<div style="display:inline-block;padding-bottom:8px;border-bottom:3px solid ' + (f.lineColor || '#b2d9c4') + '">' +
                   '<span style="font-size:18px;font-weight:700;color:' + (f.color || '#0d2540') + ';letter-spacing:2px">' + (f.title || '') + '</span>' +
                 '</div>' +
               '</section>';
      }
    },
    {
      id: 'subtitle-bg-tag',
      name: '背景色标签标题',
      category: 'layout',
      description: '背景色标签式小标题',
      icon: '▣',
      fields: [
        { name: 'title', label: '标题文字', type: 'text', default: 'KEY POINT' },
        { name: 'subtitle', label: '副标题', type: 'text', default: '核心观点' },
        { name: 'color', label: '文字颜色', type: 'color', default: '#ffffff' },
        { name: 'bgColor', label: '标签背景色', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0 16px;display:flex;align-items:center;gap:14px">' +
                 '<span style="display:inline-block;padding:6px 16px;background:' + (f.bgColor || '#0d2540') + ';color:' + (f.color || '#ffffff') + ';font-size:13px;font-weight:700;letter-spacing:2px;border-radius:4px;flex-shrink:0">' + (f.title || '') + '</span>' +
                 '<span style="font-size:17px;font-weight:700;color:#2d2d2d;letter-spacing:1px">' + (f.subtitle || '') + '</span>' +
               '</section>';
      }
    },
    {
      id: 'subtitle-number-circle',
      name: '圆形数字标题',
      category: 'layout',
      description: '圆形数字+右侧标题',
      icon: '◯',
      fields: [
        { name: 'number', label: '数字', type: 'text', default: '1' },
        { name: 'title', label: '标题文字', type: 'text', default: '问题定义' },
        { name: 'subtitle', label: '副标题说明', type: 'text', default: '明确问题边界与目标' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0 16px;display:flex;align-items:center;gap:14px">' +
                 '<div style="width:42px;height:42px;border:3px solid ' + (f.color || '#0d2540') + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:' + (f.color || '#0d2540') + ';flex-shrink:0">' + (f.number || '1') + '</div>' +
                 '<div style="flex:1">' +
                   '<div style="font-size:17px;font-weight:700;color:' + (f.color || '#0d2540') + ';letter-spacing:1px;margin-bottom:2px">' + (f.title || '') + '</div>' +
                   (f.subtitle ? '<div style="font-size:13px;color:#7a7a7a">' + f.subtitle + '</div>' : '') +
                 '</div>' +
               '</section>';
      }
    },

    // ===== 高亮金句/引用类 =====
    {
      id: 'highlight-sentence',
      name: '金句高亮',
      category: 'quote',
      description: '重点句子高亮显示 · 吸引读者目光',
      icon: '★',
      fields: [
        { name: 'text', label: '金句内容', type: 'textarea', default: '真正重要的，往往是那些容易被忽略的小事。' },
        { name: 'color', label: '文字颜色', type: 'color', default: '#0d2540' },
        { name: 'bgColor', label: '背景颜色', type: 'color', default: '#e8f1f7' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0;padding:20px 24px;background:' + (f.bgColor || '#e8f1f7') + ';border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07);position:relative">' +
                 '<div style="position:absolute;top:8px;left:12px;font-size:32px;color:rgba(13,37,64,0.15);font-family:Georgia,serif;line-height:1">"</div>' +
                 '<div style="font-size:16px;font-weight:600;line-height:1.9;color:' + (f.color || '#0d2540') + ';position:relative;z-index:2;letter-spacing:0.5px">' + (f.text || '') + '</div>' +
                 '<div style="position:absolute;bottom:8px;right:16px;font-size:32px;color:rgba(13,37,64,0.15);font-family:Georgia,serif;line-height:1">"</div>' +
               '</section>';
      }
    },
    {
      id: 'drop-cap',
      name: '首字下沉',
      category: 'text',
      description: '杂志风首字母大写 · 提升排版质感',
      icon: 'A',
      fields: [
        { name: 'text', label: '段落内容（首个字将放大）', type: 'textarea', default: '深维研究表明，AI 正在以前所未有的速度重塑各个行业。从传统制造业到现代服务业，从医疗健康到教育培训，智能算法的身影无处不在。' },
        { name: 'color', label: '首字颜色', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        var text = f.text || '';
        var firstChar = text.charAt(0);
        var rest = text.substring(1);
        return '<section style="margin:20px 0;font-size:16px;line-height:1.9;color:#2d2d2d">' +
                 '<span style="float:left;font-size:58px;line-height:1;font-weight:700;color:' + (f.color || '#0d2540') + ';padding:6px 10px 0 0;margin-right:4px;margin-top:4px">' + firstChar + '</span>' +
                 rest + '</section>';
      }
    },
    {
      id: 'quote-block',
      name: '名人引用',
      category: 'quote',
      description: '带装饰引号的名人名言',
      icon: '❝',
      fields: [
        { name: 'quote', label: '引用内容', type: 'textarea', default: '预测未来的最好方式，就是亲手创造它。' },
        { name: 'author', label: '作者/出处', type: 'text', default: '— 彼得·德鲁克' },
        { name: 'color', label: '装饰颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0;padding:20px 28px;background:#fafafa;position:relative">' +
                 '<div style="font-size:16px;line-height:1.9;color:#2d2d2d;font-style:italic;letter-spacing:0.5px">' + (f.quote || '') + '</div>' +
                 (f.author ? '<div style="font-size:12px;color:#9a9a9a;margin-top:10px;text-align:right;font-style:normal">' + f.author + '</div>' : '') +
               '</section>';
      }
    },
    {
      id: 'quote-float-left',
      name: '左侧大引号引用',
      category: 'quote',
      description: '左侧大引号引用块',
      icon: '❝',
      fields: [
        { name: 'text', label: '引用内容', type: 'textarea', default: '技术从来不是中立的，它承载着创造者的价值观和选择。理解这一点，才能真正把握技术发展的方向。' },
        { name: 'author', label: '作者', type: 'text', default: '' },
        { name: 'color', label: '主色调', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0;padding:24px 28px 24px 60px;background:#fafcfb;position:relative">' +
                 '<div style="position:absolute;left:16px;top:10px;font-size:72px;font-family:Georgia,serif;color:' + (f.color || '#b2d9c4') + ';line-height:1;opacity:0.5">❝</div>' +
                 '<div style="font-size:16px;line-height:1.9;color:#2d2d2d;letter-spacing:0.5px;font-style:italic">' + (f.text || '') + '</div>' +
                 (f.author ? '<div style="font-size:12px;color:#7a7a7a;margin-top:12px;text-align:right">— ' + f.author + '</div>' : '') +
               '</section>';
      }
    },
    {
      id: 'highlight-text-marker',
      name: '荧光笔高亮',
      category: 'quote',
      description: '荧光笔文字高亮效果',
      icon: '✎',
      fields: [
        { name: 'text', label: '段落内容（含高亮标记）', type: 'textarea', default: '在数字化转型的浪潮中，[[真正有价值的不是技术本身，而是如何将技术与业务场景深度结合]]，创造出可持续的竞争优势。' },
        { name: 'color', label: '荧光色（黄/粉/绿）', type: 'color', default: '#fff59d' }
      ],
      render: function(f) {
        var text = f.text || '';
        var highlightColor = f.color || '#fff59d';
        var highlighted = text.replace(/\[\[([^\]]+)\]\]/g, '<span style="background:' + highlightColor + ';padding:2px 4px;border-radius:2px">$1</span>');
        return '<section style="margin:20px 0;color:#2d2d2d;font-size:16px;line-height:1.9;letter-spacing:0.5px">' + highlighted + '</section>';
      }
    },

    // ===== 信息框类 =====
    {
      id: 'insight-box',
      name: '洞察框',
      category: 'box',
      description: '暖天蓝底 · 冷静专业',
      icon: '◈',
      fields: [
        { name: 'title', label: '标题（可不填）', type: 'text', default: '' },
        { name: 'text', label: '洞察内容', type: 'textarea', default: '这里是洞察内容。暖天蓝底，冷静专业。适合放置研究发现、方法论、关键分析结论。' },
        { name: 'titleColor', label: '标题颜色', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:16px 20px;background:#e8f1f7;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 (f.title ? '<div style="font-size:14px;font-weight:700;color:' + (f.titleColor || '#0d2540') + ';margin-bottom:8px">' + f.title + '</div>' : '') +
                 '<div style="font-size:16px;line-height:1.85;color:#0d2540">' + (f.text || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'warning-box',
      name: '警示框',
      category: 'box',
      description: '暖杏黄底 · 温和醒目',
      icon: '⚠',
      fields: [
        { name: 'title', label: '标题（可不填）', type: 'text', default: '' },
        { name: 'text', label: '警示内容', type: 'textarea', default: '这里是警示内容。暖杏黄底，温和但醒目。适合放置风险提示和需要注意的细节。' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:16px 20px;background:#faf3e8;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 (f.title ? '<div style="font-size:14px;font-weight:700;color:#4a2a00;margin-bottom:8px">' + f.title + '</div>' : '') +
                 '<div style="font-size:16px;line-height:1.85;color:#4a2a00">' + (f.text || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'tip-box',
      name: '提示/小贴士',
      category: 'box',
      description: '暖薄荷绿 · 友好提示',
      icon: '💡',
      fields: [
        { name: 'title', label: '标题（可不填）', type: 'text', default: '' },
        { name: 'text', label: '提示内容', type: 'textarea', default: '小贴士内容' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:16px 20px;background:#edf7f2;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 (f.title ? '<div style="font-size:14px;font-weight:700;color:#1a3d1f;margin-bottom:8px">' + f.title + '</div>' : '') +
                 '<div style="font-size:16px;line-height:1.85;color:#1a3d1f">' + (f.text || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'danger-box',
      name: '警告框',
      category: 'box',
      description: '珊瑚红底 · 强调风险',
      icon: '⛔',
      fields: [
        { name: 'title', label: '标题（可不填）', type: 'text', default: '' },
        { name: 'text', label: '警告内容', type: 'textarea', default: '警告内容' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:16px 20px;background:#faeae8;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 (f.title ? '<div style="font-size:14px;font-weight:700;color:#7a1f1f;margin-bottom:8px">' + f.title + '</div>' : '') +
                 '<div style="font-size:16px;line-height:1.85;color:#5a1010">' + (f.text || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'case-box',
      name: '案例分析框',
      category: 'box',
      description: '雾紫底 · 实际案例',
      icon: '📋',
      fields: [
        { name: 'title', label: '案例标题', type: 'text', default: '案例' },
        { name: 'text', label: '案例详情', type: 'textarea', default: '案例描述' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:16px 20px;background:#f2ebf7;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 '<div style="font-size:14px;font-weight:700;color:#3a1a5a;margin-bottom:10px">◉ ' + (f.title || '案例') + '</div>' +
                 '<div style="font-size:15px;line-height:1.85;color:#3a1a5a">' + (f.text || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'note-card',
      name: '便签卡片',
      category: 'box',
      description: '仿便利贴样式 · 生动有趣',
      icon: '📝',
      fields: [
        { name: 'title', label: '便签标题', type: 'text', default: '小笔记' },
        { name: 'text', label: '便签内容', type: 'textarea', default: '便签正文内容' },
        { name: 'bgColor', label: '便签底色', type: 'color', default: '#fff59d' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:18px 22px;background:' + (f.bgColor || '#fff59d') + ';border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07);transform:rotate(-1deg);font-family:\'PingFang SC\',sans-serif">' +
                 '<div style="font-size:14px;font-weight:700;color:#5a4a00;margin-bottom:8px">📝 ' + (f.title || '') + '</div>' +
                 '<div style="font-size:15px;line-height:1.85;color:#5a4a00">' + (f.text || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'info-box-icon',
      name: '图标信息框',
      category: 'box',
      description: '带图标的信息框',
      icon: '★',
      fields: [
        { name: 'icon', label: '图标字符（★☆✔⚠❖）', type: 'text', default: '★' },
        { name: 'title', label: '标题', type: 'text', default: '重点信息' },
        { name: 'text', label: '内容', type: 'textarea', default: '这里是需要强调的信息内容，通过图标和边框来吸引读者注意。' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' },
        { name: 'bgColor', label: '背景色', type: 'color', default: '#f7f9fc' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:18px 22px;background:' + (f.bgColor || '#f7f9fc') + ';border:1px solid ' + (f.color || '#0d2540') + ';border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 '<div style="display:flex;align-items:flex-start;gap:12px">' +
                   '<span style="font-size:22px;color:' + (f.color || '#0d2540') + ';font-weight:700;line-height:1;flex-shrink:0">' + (f.icon || '★') + '</span>' +
                   '<div style="flex:1">' +
                     '<div style="font-size:15px;font-weight:700;color:' + (f.color || '#0d2540') + ';margin-bottom:6px">' + (f.title || '') + '</div>' +
                     '<div style="font-size:15px;line-height:1.8;color:#2d2d2d">' + (f.text || '') + '</div>' +
                   '</div>' +
                 '</div>' +
               '</section>';
      }
    },
    {
      id: 'info-box-gradient',
      name: '渐变背景信息框',
      category: 'box',
      description: '渐变背景信息框',
      icon: '◐',
      fields: [
        { name: 'title', label: '标题', type: 'text', default: '核心洞察' },
        { name: 'text', label: '内容', type: 'textarea', default: '这是一段具有视觉冲击力的内容，通过渐变背景来突出。适合用于关键结论或核心观点。' },
        { name: 'colorStart', label: '渐变起始色', type: 'color', default: '#0d2540' },
        { name: 'colorEnd', label: '渐变结束色', type: 'color', default: '#1a4a7a' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:20px 24px;background:linear-gradient(135deg,' + (f.colorStart || '#0d2540') + ',' + (f.colorEnd || '#1a4a7a') + ');border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.12)">' +
                 (f.title ? '<div style="font-size:15px;font-weight:700;color:#ffffff;margin-bottom:10px;letter-spacing:1px">' + f.title + '</div>' : '') +
                 '<div style="font-size:15px;line-height:1.85;color:#e8f1f7">' + (f.text || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'info-box-dashed',
      name: '虚线边框信息框',
      category: 'box',
      description: '虚线边框信息框',
      icon: '▭',
      fields: [
        { name: 'title', label: '标题', type: 'text', default: '备注说明' },
        { name: 'text', label: '内容', type: 'textarea', default: '这是一段补充说明的内容，使用虚线边框来表示次要信息或备注。' },
        { name: 'color', label: '边框/标题色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:18px 22px;background:#fafcfa;border:2px dashed ' + (f.color || '#b2d9c4') + ';border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 (f.title ? '<div style="font-size:14px;font-weight:700;color:#2d5d4a;margin-bottom:10px">' + f.title + '</div>' : '') +
                 '<div style="font-size:15px;line-height:1.85;color:#2d2d2d">' + (f.text || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'info-box-blueprint',
      name: '读书笔记卡片',
      category: 'box',
      description: '仿知乎/微信读书笔记卡片',
      icon: '📖',
      fields: [
        { name: 'text', label: '笔记内容', type: 'textarea', default: '当我们谈论创新时，往往会忽略一个关键事实：大多数突破性创新并非来自单一的灵光一闪，而是源于对现有知识和技术的重新组合与深度思考。' },
        { name: 'source', label: '来源/书名', type: 'text', default: '《创新者的窘境》' },
        { name: 'page', label: '页码/章节', type: 'text', default: '第 42 页' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:20px 24px 20px 24px;background:#fef9e7;border-top:3px solid #d4a853;border-bottom:3px solid #d4a853;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07);position:relative">' +
                 '<div style="font-size:16px;line-height:1.9;color:#4a3a1a;font-style:italic;letter-spacing:0.3px">"' + (f.text || '') + '"</div>' +
                 '<div style="margin-top:14px;padding-top:10px;border-top:1px solid #e8dcb8;display:flex;justify-content:space-between;align-items:center">' +
                   '<span style="font-size:13px;color:#7a6a3a;font-weight:600">📚 ' + (f.source || '读书笔记') + '</span>' +
                   (f.page ? '<span style="font-size:12px;color:#9a8a5a">' + f.page + '</span>' : '') +
                 '</div>' +
               '</section>';
      }
    },

    // ===== 分隔/装饰类 =====
    {
      id: 'svg-divider',
      name: '波浪分隔线',
      category: 'divider',
      description: '波浪描边动画 · 章节引导',
      icon: '〜',
      fields: [
        { name: 'color', label: '线条颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0 16px;text-align:center">' +
                 '<svg viewBox="0 0 300 40" style="width:200px;height:auto;display:inline-block">' +
                   '<path d="M0,20 Q75,0 150,20 Q225,40 300,20" fill="none" stroke="' + (f.color || '#b2d9c4') + '" stroke-width="2.5" stroke-linecap="round"></path>' +
                 '</svg>' +
               '</section>';
      }
    },
    {
      id: 'divider-line',
      name: '渐变分隔线',
      category: 'divider',
      description: '细线渐变 · 章节分隔',
      icon: '—',
      fields: [
        { name: 'color', label: '主颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0;padding:0 40px"><div style="height:1px;background:linear-gradient(to right,transparent,' + (f.color || '#b2d9c4') + ',transparent)"></div></section>';
      }
    },
    {
      id: 'dot-divider',
      name: '三点分隔符',
      category: 'divider',
      description: '优雅三点装饰 · 场景切换',
      icon: '•',
      fields: [
        { name: 'color', label: '圆点颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="text-align:center;margin:28px 0;letter-spacing:12px">' +
                 '<span style="color:' + (f.color || '#b2d9c4') + ';font-size:14px">● ● ●</span>' +
               '</section>';
      }
    },
    {
      id: 'star-divider',
      name: '星形分隔符',
      category: 'divider',
      description: '居中星形装饰线',
      icon: '✦',
      fields: [
        { name: 'color', label: '主颜色', type: 'color', default: '#0d2540' },
        { name: 'centerChar', label: '中间字符', type: 'text', default: '✦' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0;display:flex;align-items:center;justify-content:center;gap:10px">' +
                 '<div style="flex:0 0 60px;height:1px;background:linear-gradient(to right,transparent,' + (f.color || '#0d2540') + ')"></div>' +
                 '<span style="color:' + (f.color || '#0d2540') + ';font-size:14px;font-weight:700">' + (f.centerChar || '✦') + '</span>' +
                 '<div style="flex:0 0 60px;height:1px;background:linear-gradient(to left,transparent,' + (f.color || '#0d2540') + ')"></div>' +
               '</section>';
      }
    },
    {
      id: 'leaf-divider',
      name: '文字分隔符',
      category: 'divider',
      description: '带文字的优雅分隔线',
      icon: '❋',
      fields: [
        { name: 'text', label: '分隔文字', type: 'text', default: 'CHAPTER' },
        { name: 'color', label: '主颜色', type: 'color', default: '#0d2540' },
        { name: 'lineColor', label: '线条颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:32px 0;display:flex;align-items:center;justify-content:center;gap:12px">' +
                 '<div style="flex:1;height:2px;background:' + (f.lineColor || '#b2d9c4') + '"></div>' +
                 '<span style="color:' + (f.color || '#0d2540') + ';font-size:12px;font-weight:700;letter-spacing:4px;padding:0 10px">' + (f.text || '') + '</span>' +
                 '<div style="flex:1;height:2px;background:' + (f.lineColor || '#b2d9c4') + '"></div>' +
               '</section>';
      }
    },
    {
      id: 'divider-star-text',
      name: '星号文字装饰线',
      category: 'divider',
      description: '✦ 居中文字装饰线',
      icon: '✦',
      fields: [
        { name: 'text', label: '中间文字', type: 'text', default: '精彩继续' },
        { name: 'color', label: '主颜色', type: 'color', default: '#0d2540' },
        { name: 'lineColor', label: '线条颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:32px 0;display:flex;align-items:center;justify-content:center;gap:12px">' +
                 '<div style="flex:0 0 50px;height:1px;background:' + (f.lineColor || '#b2d9c4') + '"></div>' +
                 '<span style="color:' + (f.color || '#0d2540') + ';font-size:14px">✦</span>' +
                 '<span style="color:' + (f.color || '#0d2540') + ';font-size:14px;font-weight:700;letter-spacing:2px;padding:0 4px">' + (f.text || '') + '</span>' +
                 '<span style="color:' + (f.color || '#0d2540') + ';font-size:14px">✦</span>' +
                 '<div style="flex:0 0 50px;height:1px;background:' + (f.lineColor || '#b2d9c4') + '"></div>' +
               '</section>';
      }
    },
    {
      id: 'divider-image',
      name: '图表情分隔符',
      category: 'divider',
      description: '小图/表情分隔符',
      icon: '🌸',
      fields: [
        { name: 'emoji', label: '表情/符号', type: 'text', default: '🌸' },
        { name: 'count', label: '重复数量', type: 'text', default: '3' }
      ],
      render: function(f) {
        var count = parseInt(f.count || '3') || 3;
        var html = '<section style="text-align:center;margin:32px 0;letter-spacing:16px">';
        for (var i = 0; i < count; i++) {
          html += '<span style="font-size:18px">' + (f.emoji || '🌸') + '</span>';
        }
        html += '</section>';
        return html;
      }
    },
    {
      id: 'divider-dotted',
      name: '三点居中装饰',
      category: 'divider',
      description: '三点居中装饰（●●●）',
      icon: '•',
      fields: [
        { name: 'color', label: '圆点颜色', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="text-align:center;margin:28px 0">' +
                 '<span style="display:inline-block;width:8px;height:8px;background:' + (f.color || '#0d2540') + ';border-radius:50%;margin:0 6px"></span>' +
                 '<span style="display:inline-block;width:8px;height:8px;background:' + (f.color || '#0d2540') + ';border-radius:50%;margin:0 6px;opacity:0.7"></span>' +
                 '<span style="display:inline-block;width:8px;height:8px;background:' + (f.color || '#0d2540') + ';border-radius:50%;margin:0 6px;opacity:0.4"></span>' +
               '</section>';
      }
    },
    {
      id: 'divider-ornament',
      name: '菱形装饰分隔',
      category: 'divider',
      description: '❖ 菱形装饰符分隔',
      icon: '❖',
      fields: [
        { name: 'color', label: '装饰颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="text-align:center;margin:32px 0;display:flex;align-items:center;justify-content:center;gap:16px">' +
                 '<span style="color:' + (f.color || '#b2d9c4') + ';font-size:16px">❖</span>' +
                 '<span style="color:' + (f.color || '#b2d9c4') + ';font-size:20px;font-weight:700">❖</span>' +
                 '<span style="color:' + (f.color || '#b2d9c4') + ';font-size:16px">❖</span>' +
               '</section>';
      }
    },
    {
      id: 'divider-chapter',
      name: '章节大分隔',
      category: 'divider',
      description: 'Chapter 01 + 副标题',
      icon: '⚑',
      fields: [
        { name: 'chapter', label: '章节编号', type: 'text', default: 'Chapter 01' },
        { name: 'title', label: '章节标题', type: 'text', default: '问题的本质' },
        { name: 'subtitle', label: '副标题', type: 'text', default: '理解核心问题是一切的开始' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' },
        { name: 'lineColor', label: '装饰线色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:40px 0 32px;text-align:center;padding:24px 20px;background:#fafcfb;border-top:3px solid ' + (f.lineColor || '#b2d9c4') + ';border-bottom:3px solid ' + (f.lineColor || '#b2d9c4') + ';border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 '<div style="font-size:12px;font-weight:700;color:' + (f.color || '#0d2540') + ';letter-spacing:4px;margin-bottom:10px">' + (f.chapter || 'CHAPTER') + '</div>' +
                 '<div style="font-size:22px;font-weight:700;color:' + (f.color || '#0d2540') + ';letter-spacing:2px;margin-bottom:8px">' + (f.title || '') + '</div>' +
                 (f.subtitle ? '<div style="font-size:13px;color:#7a7a7a;letter-spacing:1px">' + f.subtitle + '</div>' : '') +
                 '<div style="margin-top:14px;display:flex;justify-content:center;gap:8px">' +
                   '<div style="width:30px;height:2px;background:' + (f.lineColor || '#b2d9c4') + '"></div>' +
                   '<div style="width:8px;height:8px;border-radius:50%;background:' + (f.lineColor || '#b2d9c4') + ';margin-top:-3px"></div>' +
                   '<div style="width:30px;height:2px;background:' + (f.lineColor || '#b2d9c4') + '"></div>' +
                 '</div>' +
               '</section>';
      }
    },

    // ===== 数据展示类 =====
    {
      id: 'data-card-single',
      name: '数据卡片（单卡）',
      category: 'data',
      description: '单个数据突出展示',
      icon: '①',
      fields: [
        { name: 'number', label: '数据数字', type: 'text', default: '62%' },
        { name: 'color', label: '数字颜色', type: 'color', default: '#06b6d4' },
        { name: 'description', label: '数据描述', type: 'textarea', default: '数据描述文字，简明扼要地解释这个数字的含义。' },
        { name: 'source', label: '数据来源', type: 'text', default: '来源：机构名称 / 报告名称' }
      ],
      render: function(f) {
        var viewBoxW = Math.max(140, (f.number || '').length * 32);
        return '<section style="margin:24px 0;padding:20px 24px;background:#f7f7f4;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 '<svg viewBox="0 0 ' + viewBoxW + ' 52" style="display:block;height:38px;width:auto"><text x="0" y="44" font-size="48" font-weight="700" fill="' + (f.color || '#06b6d4') + '" font-family="-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif">' + (f.number || '62%') + '</text></svg>' +
                 '<div style="font-size:15px;color:#5a5a5a;margin-top:8px;line-height:1.6">' + (f.description || '') + '</div>' +
                 (f.source ? '<div style="font-size:13px;color:#9a9a9a;margin-top:6px">' + f.source + '</div>' : '') +
               '</section>';
      }
    },
    {
      id: 'data-card-double',
      name: '数据双卡片（2列）',
      category: 'data',
      description: '双数据对比展示',
      icon: '②',
      fields: [
        { name: 'num1', label: '左数字', type: 'text', default: '3000万' },
        { name: 'color1', label: '左颜色', type: 'color', default: '#10b981' },
        { name: 'desc1', label: '左描述', type: 'text', default: '数据描述' },
        { name: 'src1', label: '左来源', type: 'text', default: '来源：xxx' },
        { name: 'num2', label: '右数字', type: 'text', default: '35%' },
        { name: 'color2', label: '右颜色', type: 'color', default: '#f97316' },
        { name: 'desc2', label: '右描述', type: 'text', default: '数据描述' },
        { name: 'src2', label: '右来源', type: 'text', default: '来源：xxx' }
      ],
      render: function(f) {
        function makeCard(num, color, desc, src) {
          var viewBoxW = Math.max(120, (num || '').length * 26);
          return '<section style="flex:1;background:#f7f7f4;padding:16px 18px">' +
                   '<svg viewBox="0 0 ' + viewBoxW + ' 44" style="display:block;height:28px;width:auto"><text x="0" y="36" font-size="38" font-weight="700" fill="' + color + '" font-family="-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif">' + num + '</text></svg>' +
                   '<div style="font-size:14px;color:#5a5a5a;margin-top:6px;line-height:1.6">' + desc + '</div>' +
                   (src ? '<div style="font-size:12px;color:#9a9a9a;margin-top:4px">' + src + '</div>' : '') +
                 '</section>';
        }
        return '<section style="display:flex;gap:12px;margin:24px 0">' +
                 makeCard(f.num1 || '3000', f.color1 || '#10b981', f.desc1 || '数据描述', f.src1 || '') +
                 makeCard(f.num2 || '35%', f.color2 || '#f97316', f.desc2 || '数据描述', f.src2 || '') +
                 '</section>';
      }
    },
    {
      id: 'data-stat-box',
      name: '统计数据框',
      category: 'data',
      description: '简洁统计数字展示',
      icon: '📊',
      fields: [
        { name: 'num1', label: '数字1', type: 'text', default: '98%' },
        { name: 'label1', label: '标签1', type: 'text', default: '用户满意度' },
        { name: 'num2', label: '数字2', type: 'text', default: '50万+' },
        { name: 'label2', label: '标签2', type: 'text', default: '活跃用户' },
        { name: 'num3', label: '数字3', type: 'text', default: '12年' },
        { name: 'label3', label: '标签3', type: 'text', default: '行业经验' },
        { name: 'color', label: '主颜色', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        function statCell(num, label) {
          return '<div style="flex:1;text-align:center;padding:8px 4px">' +
                   '<div style="font-size:28px;font-weight:700;color:' + (f.color || '#0d2540') + ';line-height:1;margin-bottom:4px">' + num + '</div>' +
                   '<div style="font-size:12px;color:#5a5a5a;line-height:1.5">' + label + '</div>' +
                 '</div>';
        }
        return '<section style="margin:24px 0;padding:16px 12px;background:#f7f7f4;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07);display:flex">' +
                 statCell(f.num1 || '98%', f.label1 || '') +
                 '<div style="width:1px;background:#e0e0e0"></div>' +
                 statCell(f.num2 || '50万+', f.label2 || '') +
                 '<div style="width:1px;background:#e0e0e0"></div>' +
                 statCell(f.num3 || '12年', f.label3 || '') +
               '</section>';
      }
    },
    {
      id: 'data-highlight',
      name: '大号高亮数字',
      category: 'data',
      description: '大号高亮数字+文字',
      icon: '⓵',
      fields: [
        { name: 'number', label: '数字', type: 'text', default: '200%' },
        { name: 'text', label: '说明文字', type: 'text', default: '同比增长' },
        { name: 'description', label: '详细描述', type: 'textarea', default: '这是一个显著的增长数据，反映了业务的快速发展。' },
        { name: 'color', label: '数字颜色', type: 'color', default: '#f59e0b' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:24px 28px;background:#fff9e6;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 '<div style="display:flex;align-items:baseline;gap:16px;margin-bottom:10px">' +
                   '<span style="font-size:48px;font-weight:700;color:' + (f.color || '#f59e0b') + ';line-height:1;font-family:-apple-system,\'PingFang SC\',sans-serif">' + (f.number || '200%') + '</span>' +
                   '<span style="font-size:16px;font-weight:700;color:#2d2d2d">' + (f.text || '') + '</span>' +
                 '</div>' +
                 '<div style="font-size:14px;line-height:1.7;color:#5a5a5a">' + (f.description || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'data-vertical',
      name: '竖向数据栏',
      category: 'data',
      description: '竖向数据栏（指标+数值）',
      icon: '▮',
      fields: [
        { name: 'label1', label: '指标1', type: 'text', default: '用户增长' },
        { name: 'value1', label: '数值1', type: 'text', default: '+45%' },
        { name: 'label2', label: '指标2', type: 'text', default: '转化率' },
        { name: 'value2', label: '数值2', type: 'text', default: '12.8%' },
        { name: 'label3', label: '指标3', type: 'text', default: '留存率' },
        { name: 'value3', label: '数值3', type: 'text', default: '78%' },
        { name: 'label4', label: '指标4', type: 'text', default: 'ARPU' },
        { name: 'value4', label: '数值4', type: 'text', default: '¥128' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        function makeRow(label, value) {
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f7f7f4;border-radius:6px;margin-bottom:8px">' +
                   '<span style="font-size:14px;color:#5a5a5a">' + label + '</span>' +
                   '<span style="font-size:18px;font-weight:700;color:' + (f.color || '#0d2540') + '">' + value + '</span>' +
                 '</div>';
        }
        return '<section style="margin:24px 0;padding:4px">' +
                 makeRow(f.label1 || '指标1', f.value1 || '--') +
                 makeRow(f.label2 || '指标2', f.value2 || '--') +
                 makeRow(f.label3 || '指标3', f.value3 || '--') +
                 makeRow(f.label4 || '指标4', f.value4 || '--') +
               '</section>';
      }
    },
    {
      id: 'data-compare-table',
      name: '对比表格',
      category: 'data',
      description: '对比表格（两列/三列）',
      icon: '▥',
      fields: [
        { name: 'columns', label: '列数(2或3)', type: 'text', default: '3' },
        { name: 'header1', label: '表头1', type: 'text', default: '方案A' },
        { name: 'header2', label: '表头2', type: 'text', default: '方案B' },
        { name: 'header3', label: '表头3', type: 'text', default: '方案C' },
        { name: 'row1_label', label: '行1标签', type: 'text', default: '成本' },
        { name: 'row1_col1', label: '行1-列1', type: 'text', default: '低' },
        { name: 'row1_col2', label: '行1-列2', type: 'text', default: '中' },
        { name: 'row1_col3', label: '行1-列3', type: 'text', default: '高' },
        { name: 'row2_label', label: '行2标签', type: 'text', default: '效率' },
        { name: 'row2_col1', label: '行2-列1', type: 'text', default: '慢' },
        { name: 'row2_col2', label: '行2-列2', type: 'text', default: '中' },
        { name: 'row2_col3', label: '行2-列3', type: 'text', default: '快' },
        { name: 'row3_label', label: '行3标签', type: 'text', default: '质量' },
        { name: 'row3_col1', label: '行3-列1', type: 'text', default: '一般' },
        { name: 'row3_col2', label: '行3-列2', type: 'text', default: '良好' },
        { name: 'row3_col3', label: '行3-列3', type: 'text', default: '优秀' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        var cols = parseInt(f.columns || '3') || 3;
        if (cols < 2) cols = 2;
        if (cols > 3) cols = 3;
        var color = f.color || '#0d2540';
        var html = '<section style="margin:24px 0;background:#ffffff;overflow:hidden">';
        html += '<div style="display:flex;background:' + color + ';color:white;font-weight:700;font-size:14px">';
        html += '<div style="flex:0 0 30%;padding:12px 14px;letter-spacing:1px">对比项</div>';
        html += '<div style="flex:1;padding:12px 14px;text-align:center">' + (f.header1 || '方案A') + '</div>';
        html += '<div style="flex:1;padding:12px 14px;text-align:center">' + (f.header2 || '方案B') + '</div>';
        if (cols > 2) html += '<div style="flex:1;padding:12px 14px;text-align:center">' + (f.header3 || '方案C') + '</div>';
        html += '</div>';
        for (var r = 1; r <= 3; r++) {
          var bg = r % 2 === 0 ? '#fafafa' : '#ffffff';
          html += '<div style="display:flex;font-size:14px;' + (r > 1 ? 'border-top:1px solid #e8e8e8;' : '') + '">';
          html += '<div style="flex:0 0 30%;padding:12px 14px;color:#5a5a5a;font-weight:600;background:' + bg + '">' + (f['row' + r + '_label'] || ('项目' + r)) + '</div>';
          html += '<div style="flex:1;padding:12px 14px;text-align:center;color:#2d2d2d;background:' + bg + '">' + (f['row' + r + '_col1'] || '--') + '</div>';
          html += '<div style="flex:1;padding:12px 14px;text-align:center;color:#2d2d2d;background:' + bg + '">' + (f['row' + r + '_col2'] || '--') + '</div>';
          if (cols > 2) html += '<div style="flex:1;padding:12px 14px;text-align:center;color:#2d2d2d;background:' + bg + '">' + (f['row' + r + '_col3'] || '--') + '</div>';
          html += '</div>';
        }
        html += '</section>';
        return html;
      }
    },

    // ===== 横向滑动卡片组 =====
    {
      id: 'horizontal-scroll-cards',
      name: '横向滑动卡片组',
      category: 'data',
      description: '左右滑动查看更多 · 多卡片并列展示',
      icon: '⇄',
      fields: [
        { name: 'count', label: '卡片数量 (2~6)', type: 'number', default: '4' },
        { name: 'title', label: '标题（可不填）', type: 'text', default: '' },
        { name: 'hint', label: '滑动提示文字', type: 'text', default: '左右滑动查看更多' },
        { name: 'card1_title', label: '卡片1标题', type: 'text', default: '卡片 1' },
        { name: 'card1_text', label: '卡片1内容', type: 'textarea', default: '横向滑动卡片的描述文字，简洁明了地传达信息。' },
        { name: 'card1_bg', label: '卡片1底色', type: 'color', default: '#edf7f2' },
        { name: 'card1_color', label: '卡片1文字色', type: 'color', default: '#1a3d1f' },
        { name: 'card2_title', label: '卡片2标题', type: 'text', default: '卡片 2' },
        { name: 'card2_text', label: '卡片2内容', type: 'textarea', default: '横向滑动卡片的描述文字，简洁明了地传达信息。' },
        { name: 'card2_bg', label: '卡片2底色', type: 'color', default: '#e8f1f7' },
        { name: 'card2_color', label: '卡片2文字色', type: 'color', default: '#0d2540' },
        { name: 'card3_title', label: '卡片3标题', type: 'text', default: '卡片 3' },
        { name: 'card3_text', label: '卡片3内容', type: 'textarea', default: '横向滑动卡片的描述文字，简洁明了地传达信息。' },
        { name: 'card3_bg', label: '卡片3底色', type: 'color', default: '#faf3e8' },
        { name: 'card3_color', label: '卡片3文字色', type: 'color', default: '#4a2a00' },
        { name: 'card4_title', label: '卡片4标题', type: 'text', default: '卡片 4' },
        { name: 'card4_text', label: '卡片4内容', type: 'textarea', default: '横向滑动卡片的描述文字，简洁明了地传达信息。' },
        { name: 'card4_bg', label: '卡片4底色', type: 'color', default: '#f2ebf7' },
        { name: 'card4_color', label: '卡片4文字色', type: 'color', default: '#3a1a5a' },
        { name: 'card5_title', label: '卡片5标题', type: 'text', default: '' },
        { name: 'card5_text', label: '卡片5内容', type: 'textarea', default: '' },
        { name: 'card5_bg', label: '卡片5底色', type: 'color', default: '#faeae8' },
        { name: 'card5_color', label: '卡片5文字色', type: 'color', default: '#5a1010' },
        { name: 'card6_title', label: '卡片6标题', type: 'text', default: '' },
        { name: 'card6_text', label: '卡片6内容', type: 'textarea', default: '' },
        { name: 'card6_bg', label: '卡片6底色', type: 'color', default: '#f7eaee' },
        { name: 'card6_color', label: '卡片6文字色', type: 'color', default: '#5a1a3a' }
      ],
      render: function(f) {
        // 读取卡片数量，默认4，范围2~6
        var count = parseInt(f.count || '4') || 4;
        if (count < 2) count = 2;
        if (count > 6) count = 6;

        var html = '<section style="margin:28px 0;">';
        // 标题
        if (f.title) {
          html += '<div style="font-size:16px;font-weight:700;color:#2d2d2d;margin-bottom:8px;letter-spacing:0.5px">' + f.title + '</div>';
        }
        // 滑动提示
        if (f.hint) {
          html += '<div style="font-size:13px;color:#9a9a9a;margin-bottom:10px;">' + f.hint + '</div>';
        }
        // 卡片容器：flex + 横向滚动 + scroll-snap
        html += '<div style="display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory;padding-bottom:8px;">';
        for (var i = 1; i <= count; i++) {
          var cardTitle = f['card' + i + '_title'];
          var cardText = f['card' + i + '_text'];
          var bg = f['card' + i + '_bg'] || '#f7f7f4';
          var color = f['card' + i + '_color'] || '#2d2d2d';
          html += '<div style="flex:0 0 auto;width:160px;background:' + bg + ';border-radius:10px;padding:16px 14px;scroll-snap-align:start;box-shadow:0 2px 8px rgba(0,0,0,0.06);">';
          if (cardTitle) {
            html += '<div style="font-size:14px;font-weight:600;color:' + color + ';margin-bottom:6px;">' + cardTitle + '</div>';
          }
          if (cardText) {
            html += '<div style="font-size:13px;color:#5a5a5a;line-height:1.6;">' + cardText + '</div>';
          }
          html += '</div>';
        }
        html += '</div></section>';
        return html;
      }
    },

    {
      id: 'image-caption-bottom',
      name: '图文说明卡',
      category: 'media',
      description: '图片+底部图文说明',
      icon: '🖼',
      fields: [
        { name: 'src', label: '图片地址', type: 'text', default: 'https://placehold.co/600x340/f7f7f4/9a9a9a?text=示例图片' },
        { name: 'title', label: '标题', type: 'text', default: '图片标题' },
        { name: 'caption', label: '详细说明', type: 'textarea', default: '这里是图片的详细说明文字，用于解释图片的内容和背景。' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;background:#fafafa;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden">' +
                 '<img src="' + (f.src || '') + '" style="width:100%;display:block" alt="" />' +
                 '<div style="padding:14px 18px;border-top:3px solid ' + (f.color || '#0d2540') + '">' +
                   '<div style="font-size:15px;font-weight:700;color:' + (f.color || '#0d2540') + ';margin-bottom:6px">' + (f.title || '') + '</div>' +
                   '<div style="font-size:13px;line-height:1.7;color:#5a5a5a">' + (f.caption || '') + '</div>' +
                 '</div>' +
               '</section>';
      }
    },
    {
      id: 'image-left-text-right',
      name: '左图右文',
      category: 'media',
      description: '左图+右文图文并排',
      icon: '▥',
      fields: [
        { name: 'src', label: '图片地址', type: 'text', default: 'https://placehold.co/200x200/f7f7f4/9a9a9a?text=图' },
        { name: 'title', label: '标题', type: 'text', default: '核心观点' },
        { name: 'text', label: '正文内容', type: 'textarea', default: '这里是与图片配合的文字说明，图文并排在视觉上更具吸引力，也能更好地传递信息。' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:16px;background:#fafafa;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07);display:flex;gap:14px">' +
                 '<img src="' + (f.src || '') + '" style="width:120px;height:120px;border-radius:8px;object-fit:cover;flex-shrink:0" alt="" />' +
                 '<div style="flex:1;min-width:0">' +
                   '<div style="font-size:15px;font-weight:700;color:' + (f.color || '#0d2540') + ';margin-bottom:6px">' + (f.title || '') + '</div>' +
                   '<div style="font-size:13px;line-height:1.7;color:#5a5a5a">' + (f.text || '') + '</div>' +
                 '</div>' +
               '</section>';
      }
    },
    {
      id: 'image-shadow',
      name: '阴影边框图片',
      category: 'media',
      description: '带阴影边框的图片卡片',
      icon: '🖾',
      fields: [
        { name: 'src', label: '图片地址', type: 'text', default: 'https://placehold.co/600x400/f7f7f4/9a9a9a?text=图片' },
        { name: 'caption', label: '图片说明', type: 'text', default: '' },
        { name: 'color', label: '装饰边色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;text-align:center;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 '<div style="display:inline-block;padding:6px;background:' + (f.color || '#b2d9c4') + ';border-radius:12px">' +
                   '<img src="' + (f.src || '') + '" style="width:100%;max-width:600px;display:block;border-radius:8px" alt="" />' +
                 '</div>' +
                 (f.caption ? '<div style="font-size:12px;color:#9a9a9a;margin-top:10px;letter-spacing:1px">' + f.caption + '</div>' : '') +
               '</section>';
      }
    },

    // ===== 列表序号类 =====
    {
      id: 'list-bullet',
      name: '项目符号列表',
      category: 'list',
      description: '项目符号列表（● ▶ ◆）',
      icon: '•',
      fields: [
        { name: 'bullet', label: '符号(●▶◆★✔)', type: 'text', default: '●' },
        { name: 'item1', label: '项目1', type: 'textarea', default: '这是第一个要点，包含重要的基础信息。' },
        { name: 'item2', label: '项目2', type: 'textarea', default: '这是第二个要点，对第一个要点进行补充说明。' },
        { name: 'item3', label: '项目3', type: 'textarea', default: '这是第三个要点，提供进一步的参考信息。' },
        { name: 'item4', label: '项目4', type: 'textarea', default: '' },
        { name: 'item5', label: '项目5', type: 'textarea', default: '' },
        { name: 'color', label: '符号颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        var html = '<section style="margin:24px 0">';
        for (var i = 1; i <= 5; i++) {
          var item = f['item' + i];
          if (!item || !item.trim()) continue;
          html += '<div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start">' +
                    '<span style="color:' + (f.color || '#b2d9c4') + ';font-size:16px;font-weight:700;line-height:1.7;flex-shrink:0">' + (f.bullet || '●') + '</span>' +
                    '<div style="flex:1;font-size:15px;line-height:1.8;color:#2d2d2d">' + item + '</div>' +
                  '</div>';
        }
        html += '</section>';
        return html;
      }
    },
    {
      id: 'list-numbered-square',
      name: '方形数字编号',
      category: 'list',
      description: '方形数字编号列表',
      icon: '⒈',
      fields: [
        { name: 'item1', label: '项目1', type: 'textarea', default: '定义问题：清晰地描述需要解决的核心问题。' },
        { name: 'item2', label: '项目2', type: 'textarea', default: '分析原因：找出问题产生的根本原因。' },
        { name: 'item3', label: '项目3', type: 'textarea', default: '制定方案：基于分析结果设计可行的解决方案。' },
        { name: 'item4', label: '项目4', type: 'textarea', default: '' },
        { name: 'item5', label: '项目5', type: 'textarea', default: '' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        var html = '<section style="margin:24px 0">';
        for (var i = 1; i <= 5; i++) {
          var item = f['item' + i];
          if (!item || !item.trim()) continue;
          html += '<div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start">' +
                    '<div style="width:28px;height:28px;background:' + (f.color || '#0d2540') + ';color:white;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">' + i + '</div>' +
                    '<div style="flex:1;font-size:15px;line-height:1.8;color:#2d2d2d;padding-top:3px">' + item + '</div>' +
                  '</div>';
        }
        html += '</section>';
        return html;
      }
    },
    {
      id: 'list-timeline-dots',
      name: '点状时间线',
      category: 'list',
      description: '点状时间线列表',
      icon: '○',
      fields: [
        { name: 'date1', label: '时间1', type: 'text', default: '2020' },
        { name: 'event1', label: '事件1', type: 'textarea', default: '项目启动，团队建立，初始规划完成。' },
        { name: 'date2', label: '时间2', type: 'text', default: '2022' },
        { name: 'event2', label: '事件2', type: 'textarea', default: '产品发布首个版本，获得市场初步反馈。' },
        { name: 'date3', label: '时间3', type: 'text', default: '2024' },
        { name: 'event3', label: '事件3', type: 'textarea', default: '产品迭代至第三版，用户规模突破百万。' },
        { name: 'date4', label: '时间4', type: 'text', default: '' },
        { name: 'event4', label: '事件4', type: 'textarea', default: '' },
        { name: 'color', label: '主色调', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        var html = '<section style="margin:24px 0;padding:10px 0">';
        for (var i = 1; i <= 4; i++) {
          var date = f['date' + i];
          var event = f['event' + i];
          if (!date && !event) continue;
          var isLast = (function() {
            for (var j = i + 1; j <= 4; j++) {
              if (f['date' + j] || f['event' + j]) return false;
            }
            return true;
          })();
          html += '<div style="display:flex;gap:14px;margin-bottom:' + (isLast ? '0' : '0') + ';position:relative">' +
                    '<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;width:60px">' +
                      '<span style="font-size:13px;font-weight:700;color:#0d2540;margin-bottom:8px">' + (date || '') + '</span>' +
                      '<div style="width:12px;height:12px;border:3px solid ' + (f.color || '#b2d9c4') + ';border-radius:50%;background:white;position:relative;z-index:2"></div>' +
                      (isLast ? '' : '<div style="width:2px;flex:1;background:' + (f.color || '#b2d9c4') + ';opacity:0.5;margin:4px 0"></div>') +
                    '</div>' +
                    '<div style="flex:1;padding-bottom:20px;padding-top:24px">' +
                      '<div style="background:#f7f7f4;padding:10px 14px;border-radius:8px;font-size:14px;line-height:1.75;color:#2d2d2d">' + (event || '') + '</div>' +
                    '</div>' +
                  '</div>';
        }
        html += '</section>';
        return html;
      }
    },

    {
      id: 'qa-toggle',
      name: 'Q&A 折叠问答',
      category: 'qa',
      description: '带上下箭头的 Q&A',
      icon: '?',
      fields: [
        { name: 'q1', label: '问题1', type: 'text', default: '这个产品适合什么人群？' },
        { name: 'a1', label: '回答1', type: 'textarea', default: '本产品适合所有希望提升效率的用户，无论是学生、职场人士还是自由职业者都能从中获益。' },
        { name: 'q2', label: '问题2', type: 'text', default: '如何开始使用？' },
        { name: 'a2', label: '回答2', type: 'textarea', default: '注册账号后，系统会自动引导您完成初始化设置，整个过程只需 3-5 分钟。' },
        { name: 'q3', label: '问题3', type: 'text', default: '支持哪些设备？' },
        { name: 'a3', label: '回答3', type: 'textarea', default: '支持 iOS、Android、Windows 和 macOS 全平台，数据实时同步。' },
        { name: 'q4', label: '问题4', type: 'text', default: '' },
        { name: 'a4', label: '回答4', type: 'textarea', default: '' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        var html = '<section style="margin:24px 0">';
        for (var i = 1; i <= 4; i++) {
          var q = f['q' + i];
          var a = f['a' + i];
          if (!q || !q.trim()) continue;
          html += '<div style="margin-bottom:10px">' +
                    '<div style="background:' + (f.color || '#0d2540') + ';color:white;padding:12px 16px;border-radius:8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:10px">' +
                      '<span style="flex-shrink:0;background:rgba(255,255,255,0.2);color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700">Q</span>' +
                      '<span style="flex:1">' + q + '</span>' +
                    '</div>' +
                    '<div style="padding:12px 18px;background:#f7f9fc;border-radius:0 0 8px 8px;font-size:14px;line-height:1.8;color:#2d2d2d;margin-top:2px">' + (a || '') + '</div>' +
                  '</div>';
        }
        html += '</section>';
        return html;
      }
    },
    {
      id: 'tutorial-step-card',
      name: '步骤教程卡片',
      category: 'qa',
      description: '卡片式步骤教程',
      icon: '➊',
      fields: [
        { name: 'title', label: '教程标题', type: 'text', default: '快速上手指南' },
        { name: 'step1_title', label: '步骤1标题', type: 'text', default: '注册账号' },
        { name: 'step1_desc', label: '步骤1描述', type: 'textarea', default: '点击注册按钮，使用邮箱或手机号完成账号创建。' },
        { name: 'step2_title', label: '步骤2标题', type: 'text', default: '设置偏好' },
        { name: 'step2_desc', label: '步骤2描述', type: 'textarea', default: '根据向导设置您的个人偏好和使用习惯。' },
        { name: 'step3_title', label: '步骤3标题', type: 'text', default: '开始使用' },
        { name: 'step3_desc', label: '步骤3描述', type: 'textarea', default: '熟悉界面后即可开始日常使用，逐步解锁高级功能。' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        var html = '<section style="margin:24px 0;padding:18px 20px;background:#fafcfb;border-top:4px solid ' + (f.color || '#0d2540') + '">';
        if (f.title) html += '<div style="font-size:17px;font-weight:700;color:' + (f.color || '#0d2540') + ';margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #e8e8e8;letter-spacing:1px">' + f.title + '</div>';
        for (var i = 1; i <= 3; i++) {
          var ti = f['step' + i + '_title'];
          var desc = f['step' + i + '_desc'];
          if (!ti && !desc) continue;
          html += '<div style="display:flex;gap:14px;margin-bottom:14px">' +
                    '<div style="flex-shrink:0;width:36px;height:36px;background:' + (f.color || '#0d2540') + ';color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700">' + i + '</div>' +
                    '<div style="flex:1;padding-top:6px">' +
                      '<div style="font-size:15px;font-weight:700;color:' + (f.color || '#0d2540') + ';margin-bottom:4px">' + (ti || '') + '</div>' +
                      '<div style="font-size:14px;line-height:1.7;color:#5a5a5a">' + (desc || '') + '</div>' +
                    '</div>' +
                  '</div>';
        }
        html += '</section>';
        return html;
      }
    },

    {
      id: 'tag-multi-line',
      name: '多行标签组',
      category: 'tag',
      description: '分类标题+标签多行展示',
      icon: '🏷',
      fields: [
        { name: 'title', label: '分类标题', type: 'text', default: '关键词标签' },
        { name: 'tags', label: '标签（逗号分隔）', type: 'textarea', default: '人工智能, 大数据分析, 云计算, 机器学习, 深度学习, 自然语言处理' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' },
        { name: 'bgColor', label: '标签底色', type: 'color', default: '#e8f1f7' }
      ],
      render: function(f) {
        var tags = (f.tags || '').split(/[,，]/).map(function(t) { return t.trim(); }).filter(Boolean);
        var html = '<section style="margin:24px 0;padding:16px 18px;background:#fafafa">';
        if (f.title) html += '<div style="font-size:13px;color:#7a7a7a;margin-bottom:12px;font-weight:600;letter-spacing:1px">🏷 ' + f.title + '</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
        tags.forEach(function(tag) {
          html += '<span style="display:inline-block;padding:6px 14px;background:' + (f.bgColor || '#e8f1f7') + ';color:' + (f.color || '#0d2540') + ';font-size:13px;border-radius:20px;font-weight:600">' + tag + '</span>';
        });
        html += '</div></section>';
        return html;
      }
    },
    {
      id: 'tag-chip',
      name: '彩色圆片标签',
      category: 'tag',
      description: '彩色圆片标签 Chip 样式',
      icon: '●',
      fields: [
        { name: 'tag1', label: '标签1', type: 'text', default: '热门' },
        { name: 'color1', label: '颜色1', type: 'color', default: '#ef4444' },
        { name: 'tag2', label: '标签2', type: 'text', default: '推荐' },
        { name: 'color2', label: '颜色2', type: 'color', default: '#f59e0b' },
        { name: 'tag3', label: '标签3', type: 'text', default: '新品' },
        { name: 'color3', label: '颜色3', type: 'color', default: '#10b981' },
        { name: 'tag4', label: '标签4', type: 'text', default: '精选' },
        { name: 'color4', label: '颜色4', type: 'color', default: '#06b6d4' },
        { name: 'tag5', label: '标签5', type: 'text', default: '深度' },
        { name: 'color5', label: '颜色5', type: 'color', default: '#8b5cf6' }
      ],
      render: function(f) {
        var html = '<section style="margin:24px 0;display:flex;flex-wrap:wrap;gap:10px">';
        for (var i = 1; i <= 5; i++) {
          var tag = f['tag' + i];
          var color = f['color' + i];
          if (!tag || !tag.trim()) continue;
          html += '<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px 5px 5px;background:' + (color || '#0d2540') + ';color:white;font-size:12px;border-radius:20px;font-weight:600">' +
                    '<span style="width:18px;height:18px;background:rgba(255,255,255,0.25);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px">★</span>' +
                    tag +
                  '</span>';
        }
        html += '</section>';
        return html;
      }
    },

    {
      id: 'timeline-arrow',
      name: '箭头时间轴',
      category: 'timeline',
      description: '箭头式时间轴',
      icon: '→',
      fields: [
        { name: 'title1', label: '阶段1标题', type: 'text', default: '起步阶段' },
        { name: 'desc1', label: '阶段1描述', type: 'textarea', default: '2020-2021：产品构想与原型设计' },
        { name: 'title2', label: '阶段2标题', type: 'text', default: '成长阶段' },
        { name: 'desc2', label: '阶段2描述', type: 'textarea', default: '2022-2023：产品发布与市场验证' },
        { name: 'title3', label: '阶段3标题', type: 'text', default: '扩张阶段' },
        { name: 'desc3', label: '阶段3描述', type: 'textarea', default: '2024-2025：规模扩张与生态建设' },
        { name: 'title4', label: '阶段4标题', type: 'text', default: '' },
        { name: 'desc4', label: '阶段4描述', type: 'textarea', default: '' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        var html = '<section style="margin:28px 0;display:flex;flex-wrap:wrap;gap:10px">';
        for (var i = 1; i <= 4; i++) {
          var title = f['title' + i];
          var desc = f['desc' + i];
          if (!title && !desc) continue;
          html += '<div style="flex:1;min-width:140px;background:#f7f7f4;padding:14px 12px;border-radius:8px;border-top:4px solid ' + (f.color || '#0d2540') + '">' +
                    '<div style="font-size:14px;font-weight:700;color:' + (f.color || '#0d2540') + ';margin-bottom:6px">' + (title || '') + '</div>' +
                    '<div style="font-size:12px;line-height:1.6;color:#5a5a5a">' + (desc || '') + '</div>' +
                  '</div>';
        }
        html += '</section>';
        return html;
      }
    },
    {
      id: 'timeline-stats',
      name: '里程碑数据时间轴',
      category: 'timeline',
      description: '时间+关键指标里程碑',
      icon: '📈',
      fields: [
        { name: 'date1', label: '时间1', type: 'text', default: '2021' },
        { name: 'stat1', label: '指标1', type: 'text', default: '1万用户' },
        { name: 'title1', label: '标题1', type: 'text', default: '产品上线' },
        { name: 'date2', label: '时间2', type: 'text', default: '2022' },
        { name: 'stat2', label: '指标2', type: 'text', default: '10万用户' },
        { name: 'title2', label: '标题2', type: 'text', default: '种子轮融资' },
        { name: 'date3', label: '时间3', type: 'text', default: '2023' },
        { name: 'stat3', label: '指标3', type: 'text', default: '50万用户' },
        { name: 'title3', label: '标题3', type: 'text', default: 'A轮融资' },
        { name: 'date4', label: '时间4', type: 'text', default: '2024' },
        { name: 'stat4', label: '指标4', type: 'text', default: '100万用户' },
        { name: 'title4', label: '标题4', type: 'text', default: 'B轮融资' },
        { name: 'color', label: '主色调', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        var html = '<section style="margin:28px 0;padding:20px 16px;background:#fafcfb">';
        html += '<div style="display:flex;align-items:stretch;gap:8px">';
        for (var i = 1; i <= 4; i++) {
          var date = f['date' + i];
          var stat = f['stat' + i];
          var title = f['title' + i];
          if (!date && !stat && !title) continue;
          html += '<div style="flex:1;text-align:center">' +
                    '<div style="font-size:12px;font-weight:700;color:#0d2540;margin-bottom:8px;letter-spacing:1px">' + (date || '') + '</div>' +
                    '<div style="position:relative;padding:10px 6px">' +
                      '<div style="width:16px;height:16px;background:' + (f.color || '#b2d9c4') + ';border-radius:50%;margin:0 auto 8px;border:3px solid #0d2540"></div>' +
                      '<div style="font-size:16px;font-weight:700;color:#0d2540;margin-bottom:4px">' + (stat || '') + '</div>' +
                      '<div style="font-size:12px;color:#5a5a5a;line-height:1.5">' + (title || '') + '</div>' +
                    '</div>' +
                  '</div>';
        }
        html += '</div></section>';
        return html;
      }
    },



    {
      id: 'end-card-signature',
      name: '作者签名卡',
      category: 'end',
      description: '作者签名/留言卡',
      icon: '✍',
      fields: [
        { name: 'author', label: '作者名', type: 'text', default: '深维研究员' },
        { name: 'message', label: '留言/寄语', type: 'textarea', default: '感谢您的阅读。如果觉得文章有价值，欢迎点赞分享，让更多人看到。' },
        { name: 'date', label: '日期', type: 'text', default: '' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0;padding:20px 24px;background:linear-gradient(135deg,#fafcfb,#f7f9fc);border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">' +
                   '<div style="width:44px;height:44px;background:' + (f.color || '#0d2540') + ';border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700">' + ((f.author || '作').charAt(0)) + '</div>' +
                   '<div>' +
                     '<div style="font-size:15px;font-weight:700;color:' + (f.color || '#0d2540') + '">' + (f.author || '作者') + '</div>' +
                     (f.date ? '<div style="font-size:12px;color:#9a9a9a;margin-top:2px">' + f.date + '</div>' : '') +
                   '</div>' +
                 '</div>' +
                 '<div style="font-size:15px;line-height:1.8;color:#2d2d2d;margin-top:10px;padding:10px 14px;background:#ffffff;border-radius:8px;font-style:italic">' + (f.message || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'end-cta-button',
      name: 'CTA 按钮引导',
      category: 'end',
      description: '引导关注的按钮式 CTA',
      icon: '👆',
      fields: [
        { name: 'text', label: '引导文案', type: 'textarea', default: '长按识别二维码，关注我们获取更多深度内容。' },
        { name: 'buttonText', label: '按钮文字', type: 'text', default: '关注公众号' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0;padding:24px;text-align:center;background:' + (f.color || '#0d2540') + ';border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15)">' +
                 '<div style="font-size:16px;color:#ffffff;line-height:1.8;margin-bottom:16px">' + (f.text || '') + '</div>' +
                 '<div style="display:inline-block;padding:12px 32px;background:#ffffff;color:' + (f.color || '#0d2540') + ';border-radius:30px;font-size:15px;font-weight:700;letter-spacing:2px">' + (f.buttonText || '关注') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'end-article-meta',
      name: '文末作者元信息',
      category: 'end',
      description: '文末作者+日期+字数',
      icon: '📝',
      fields: [
        { name: 'author', label: '作者', type: 'text', default: '深维研究团队' },
        { name: 'editor', label: '编辑', type: 'text', default: '' },
        { name: 'date', label: '发布日期', type: 'text', default: '2025年1月1日' },
        { name: 'words', label: '文章字数', type: 'text', default: '约 3500 字' },
        { name: 'color', label: '主色调', type: 'color', default: '#0d2540' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:16px 20px;background:#fafafa;border-top:2px solid ' + (f.color || '#0d2540') + ';border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 '<div style="display:flex;flex-wrap:wrap;gap:8px 20px;font-size:13px;line-height:1.8;color:#5a5a5a">' +
                   '<span><span style="color:' + (f.color || '#0d2540') + ';font-weight:700">作者：</span>' + (f.author || '') + '</span>' +
                   (f.editor ? '<span><span style="color:' + (f.color || '#0d2540') + ';font-weight:700">编辑：</span>' + f.editor + '</span>' : '') +
                   (f.date ? '<span><span style="color:' + (f.color || '#0d2540') + ';font-weight:700">日期：</span>' + f.date + '</span>' : '') +
                   (f.words ? '<span><span style="color:' + (f.color || '#0d2540') + ';font-weight:700">字数：</span>' + f.words + '</span>' : '') +
                 '</div>' +
               '</section>';
      }
    },
    {
      id: 'end-ornament-line',
      name: 'END 装饰结束线',
      category: 'end',
      description: '❖ END ❖ 装饰结束线',
      icon: '❖',
      fields: [
        { name: 'text', label: '中间文字', type: 'text', default: 'END' },
        { name: 'color', label: '主色调', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:32px 0;display:flex;align-items:center;justify-content:center;gap:14px">' +
                 '<span style="color:' + (f.color || '#b2d9c4') + ';font-size:16px">❖</span>' +
                 '<div style="flex:0 0 40px;height:1px;background:' + (f.color || '#b2d9c4') + ';opacity:0.6"></div>' +
                 '<span style="color:' + (f.color || '#b2d9c4') + ';font-size:13px;font-weight:700;letter-spacing:4px">' + (f.text || 'END') + '</span>' +
                 '<div style="flex:0 0 40px;height:1px;background:' + (f.color || '#b2d9c4') + ';opacity:0.6"></div>' +
                 '<span style="color:' + (f.color || '#b2d9c4') + ';font-size:16px">❖</span>' +
               '</section>';
      }
    },

    {
      id: 'references',
      name: '参考资料区',
      category: 'end',
      description: '可滚动引用来源列表',
      icon: '📚',
      fields: [
        { name: 'text', label: '参考列表（每行为一条）', type: 'textarea', default: '[1] 新浪科技．文章标题．2025-05-31\n[2] 央视网．文章标题．2025-05-31\n[3] 知乎专栏．文章标题．2025-05-31\n[4] 百度百科．词条标题．引用日期：2025-05-31' }
      ],
      render: function(f) {
        var lines = (f.text || '').split('\n').filter(function(l) { return l && l.trim(); });
        var content = lines.join('<br>');
        return '<section style="padding:0 24px 8px">' +
                 '<div style="font-size:13px;font-weight:600;color:#5a5a5a;margin:0 0 8px">参考资料</div>' +
                 '<div style="height:140px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;padding-right:6px">' +
                   '<div style="font-size:12px;color:#9a9a9a;line-height:1.9;padding-right:8px">' + content + '</div>' +
                 '</div>' +
               '</section>';
      }
    },
    {
      id: 'end-mark',
      name: 'END 结束标志',
      category: 'end',
      description: '文章结尾 · 分隔线+END',
      icon: '▣',
      fields: [
        { name: 'text', label: '结束文字', type: 'text', default: 'END' },
        { name: 'color', label: '主色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="text-align:center;padding:24px 24px 8px">' +
                 '<div style="display:inline-block;width:32px;height:2px;background:' + (f.color || '#b2d9c4') + ';margin-bottom:16px"></div>' +
                 '<div style="font-size:13px;font-weight:600;color:#2d2d2d;letter-spacing:4px">' + (f.text || 'END') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'author-card',
      name: '作者名片',
      category: 'end',
      description: '文章末尾作者介绍',
      icon: '👤',
      fields: [
        { name: 'name', label: '作者姓名', type: 'text', default: '作者名' },
        { name: 'title', label: '身份/职位', type: 'text', default: '深维研究员' },
        { name: 'intro', label: '简介', type: 'textarea', default: '专注于 AI 与行业应用研究，关注技术落地与商业价值。' },
        { name: 'avatar', label: '头像图片（可选）', type: 'text', default: '' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0;padding:20px;background:#fafafa;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07);display:flex;gap:16px;align-items:center">' +
                 (f.avatar
                   ? '<img src="' + f.avatar + '" style="width:60px;height:60px;border-radius:50%;flex-shrink:0" alt="" />'
                   : '<div style="width:60px;height:60px;border-radius:50%;background:#0d2540;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:700">' + ((f.name || '作者').charAt(0)) + '</div>'
                 ) +
                 '<section style="flex:1">' +
                   '<div style="font-size:15px;font-weight:700;color:#2d2d2d;margin-bottom:4px">' + (f.name || '作者名') + '</div>' +
                   '<div style="font-size:12px;color:#0d2540;margin-bottom:6px">' + (f.title || '') + '</div>' +
                   '<div style="font-size:13px;line-height:1.6;color:#7a7a7a">' + (f.intro || '') + '</div>' +
                 '</section>' +
               '</section>';
      }
    },
    {
      id: 'disclaimer',
      name: '免责声明',
      category: 'end',
      description: '文章末尾免责说明',
      icon: '§',
      fields: [
        { name: 'text', label: '免责内容', type: 'textarea', default: '本文仅代表作者个人观点，不构成任何投资建议或决策依据。文中数据和观点仅供参考，读者应根据自身情况独立判断。' },
        { name: 'title', label: '标题', type: 'text', default: '免责声明' }
      ],
      render: function(f) {
        return '<section style="margin:24px 0;padding:14px 18px;background:#f5f5f0;border:1px dashed #ccc;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07)">' +
                 '<div style="font-size:12px;font-weight:700;color:#7a7a7a;margin-bottom:6px">' + (f.title || '免责声明') + '</div>' +
                 '<div style="font-size:12px;line-height:1.7;color:#9a9a9a">' + (f.text || '') + '</div>' +
               '</section>';
      }
    },
    {
      id: 'call-to-action',
      name: 'CTA 引导关注',
      category: 'end',
      description: '引导读者互动',
      icon: '↗',
      fields: [
        { name: 'text', label: '引导内容', type: 'textarea', default: '如果觉得本文有帮助，欢迎点赞、在看、转发三连，您的支持是我们持续创作的最大动力！' },
        { name: 'bgColor', label: '背景颜色', type: 'color', default: '#0d2540' },
        { name: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
        { name: 'iconColor', label: '底部按钮颜色', type: 'color', default: '#b2d9c4' }
      ],
      render: function(f) {
        return '<section style="margin:28px 0;padding:18px 24px;background:' + (f.bgColor || '#0d2540') + ';text-align:center;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">' +
                 '<div style="font-size:15px;line-height:1.8;color:' + (f.textColor || '#ffffff') + '">' + (f.text || '') + '</div>' +
                 '<div style="margin-top:12px;letter-spacing:8px;font-size:14px;color:' + (f.iconColor || '#b2d9c4') + '">●  点赞  ●  在看  ●  转发  ●</div>' +
               '</section>';
      }
    }
  ],

  getById: function(id) {
    return this.list.find(function(c) { return c.id === id; });
  },

  renderComponent: function(id, fieldValues) {
    var comp = this.getById(id);
    if (!comp) return '';
    var values = {};
    comp.fields.forEach(function(f) {
      values[f.name] = fieldValues && fieldValues[f.name] !== undefined ? fieldValues[f.name] : f.default;
    });
    return comp.render(values);
  },

  renderWithDefaults: function(id) {
    return this.renderComponent(id, {});
  }
};

window.DI_COMPONENTS = window.DEEPINSIGHT_COMPONENTS;