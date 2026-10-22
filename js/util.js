// 通用工具函数（无 DOM 依赖的部分可被单元测试复用）

/** Fisher–Yates 洗牌，返回新数组，不修改原数组 */
export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 当前多伦多时区的日期，格式 YYYY-MM-DD */
export function todayStr(tz = 'America/Toronto', now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

/** YYYY-MM-DD 加 n 天（纯日历运算，与时区无关） */
export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 两个 YYYY-MM-DD 之间的天数差 b - a */
export function diffDays(a, b) {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
}

/** YYYY-MM-DD 对应星期几，0=周日 … 6=周六 */
export function weekdayOf(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').getUTCDay();
}

export const WEEKDAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function debounce(fn, ms) {
  let t = null;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => clearTimeout(t);
  return wrapped;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/** 创建 DOM 元素的小助手 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c instanceof Node ? c : document.createTextNode(c));
  }
  return node;
}

/**
 * 内容可信度徽章：official = 官方来源；community = 面经传闻（Reddit/Blind/PracHub 等）。
 * 缺省视为 official。数据格式可扩展：任何知识点/题目/作业/mock 条目都可带 confidence 字段。
 */
export function confidenceBadge(confidence) {
  if (confidence === 'community') {
    return '<span class="badge badge-community" title="来自面经（Reddit/Blind/PracHub 等）的传闻性内容；技术事实仍以官方文档为准">面经传闻</span>';
  }
  return '<span class="badge badge-official" title="来自官方文档/一手资料">官方来源</span>';
}

/** 来源链接列表 HTML */
export function sourcesHtml(sources) {
  if (!sources || !sources.length) return '';
  const links = sources.map((s) => {
    const url = typeof s === 'string' ? s : s.url;
    const verified = typeof s === 'object' && s.verified;
    let label;
    try { label = new URL(url).hostname.replace(/^www\./, '') + new URL(url).pathname.replace(/\/$/, ''); }
    catch { label = url; }
    if (label.length > 48) label = label.slice(0, 45) + '…';
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}${verified ? '' : ' <span class="unverified" title="未验证来源">?</span>'}</a>`;
  });
  return `<div class="sources">📖 ${links.join(' · ')}</div>`;
}

/** 给 textarea 加 Tab 缩进支持 */
export function enableTabIndent(textarea) {
  textarea.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (e.shiftKey) {
      // shift+tab：去掉行首最多 4 个空格
      const before = textarea.value.slice(0, start);
      const lineStart = before.lastIndexOf('\n') + 1;
      const line = textarea.value.slice(lineStart);
      const m = line.match(/^ {1,4}/);
      if (m) {
        textarea.value = textarea.value.slice(0, lineStart) + textarea.value.slice(lineStart + m[0].length);
        textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - m[0].length);
      }
    } else {
      textarea.value = textarea.value.slice(0, start) + '    ' + textarea.value.slice(end);
      textarea.selectionStart = textarea.selectionEnd = start + 4;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/** 复制到剪贴板，带降级方案 */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
    return ok;
  }
}

let toastTimer = null;
export function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = el('div', { id: 'toast' });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
