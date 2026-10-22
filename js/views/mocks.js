// 模拟面试页：按公司列出面试项目，带倒计时、题面、评分 rubric 和作答框。
import { el, escapeHtml, sourcesHtml, confidenceBadge, enableTabIndent, debounce } from '../util.js';
import { getState, setEntry } from '../store.js';

const COMPANY_NAMES = { stripe: 'Stripe', capone: 'Capital One', life360: 'Life360' };
const KIND_ZH = { coding: '编码', design: '设计', behavioral: '行为', domain: '领域知识' };

export function renderMocks(container, ctx) {
  const { mocks } = ctx.data;
  container.innerHTML = '';

  const head = el('div', { class: 'card' });
  head.append(el('h2', { text: '模拟面试' }));
  head.append(el('p', { class: 'muted small-text', html: `⚠️ ${escapeHtml(mocks.verification_note_zh)} ${confidenceBadge('community')}` }));
  if (mocks.official_links && mocks.official_links.length) {
    head.append(el('div', { html: sourcesHtml(mocks.official_links) }));
  }
  container.append(head);

  for (const [cid, company] of Object.entries(mocks.companies)) {
    const sec = el('div', { class: 'card compact' });
    sec.append(el('h3', { text: COMPANY_NAMES[cid] || cid }));
    sec.append(el('p', { class: 'muted small-text', text: company.note }));
    container.append(sec);
    company.items.forEach((item, i) => {
      container.append(mockCard(ctx, mocks, `${cid}:${i}`, item));
    });
  }
}

function mockCard(ctx, mocks, key, item) {
  const rec = getState().mocks[key] || {};
  const card = el('div', { class: 'card' });
  card.append(el('div', {
    class: 'q-meta',
    html: `<span class="chip">${KIND_ZH[item.kind] || item.kind}</span> <span class="chip">${item.mins} 分钟</span> ${confidenceBadge(item.confidence || 'community')}`,
  }));
  card.append(el('h3', { text: item.title }));
  card.append(el('p', { class: 'small-text', text: item.prompt }));

  // 倒计时
  const timerWrap = el('div', { class: 'row gap timer-row' });
  const display = el('span', { class: 'timer', text: fmt(item.mins * 60) });
  let remaining = item.mins * 60;
  let intervalId = null;
  const startBtn = el('button', {
    class: 'btn small', text: '▶ 开始计时',
    onclick: () => {
      if (intervalId) {
        clearInterval(intervalId); intervalId = null;
        startBtn.textContent = '▶ 继续';
        return;
      }
      startBtn.textContent = '⏸ 暂停';
      intervalId = setInterval(() => {
        remaining--;
        display.textContent = fmt(Math.max(remaining, 0));
        display.classList.toggle('timer-over', remaining <= 0);
        if (remaining === 0) display.textContent = '⏰ 时间到';
        if (remaining <= -1) display.textContent = '⏰ 超时 ' + fmt(-remaining);
      }, 1000);
    },
  });
  const resetBtn = el('button', {
    class: 'btn btn-ghost small', text: '重置',
    onclick: () => {
      clearInterval(intervalId); intervalId = null;
      remaining = item.mins * 60;
      display.textContent = fmt(remaining);
      display.classList.remove('timer-over');
      startBtn.textContent = '▶ 开始计时';
    },
  });
  timerWrap.append(display, startBtn, resetBtn);
  card.append(timerWrap);

  // rubric
  const rubric = mocks.rubric[item.kind];
  if (rubric) {
    const det = el('details', {}, [el('summary', { text: '评分 rubric' })]);
    const tbl = el('table', { class: 'rubric-table' });
    for (const [dim, desc] of rubric) {
      tbl.append(el('tr', {}, [el('td', { class: 'rubric-dim', text: dim }), el('td', { text: desc })]));
    }
    det.append(tbl);
    card.append(det);
  }

  const ta = el('textarea', {
    class: 'answer-box' + (item.kind === 'coding' ? ' code-box' : ''),
    rows: item.kind === 'coding' ? 10 : 6,
    placeholder: '在这里作答（自动保存）…',
    spellcheck: 'false',
  });
  ta.value = rec.text || '';
  enableTabIndent(ta);
  ta.addEventListener('input', debounce(() => setEntry('mocks', key, { text: ta.value, title: item.title }), 700));
  card.append(ta);
  return card;
}

function fmt(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
