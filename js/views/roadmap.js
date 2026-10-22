// 路线图页：10 周 × 3 track 总览 + 进度。
import { el, escapeHtml, addDays } from '../util.js';
import { getState } from '../store.js';
import { planWeek, dayIndex } from '../plan.js';
import { newKpState } from '../engine.js';

export function renderRoadmap(container, ctx) {
  const { data } = ctx;
  container.innerHTML = '';
  const state = getState();
  const today = ctx.today();
  const week = planWeek(data.rotation, today);
  const idx = dayIndex(data.rotation, today);

  // 总进度
  const doneDays = Object.values(state.days).filter((d) => d.done).length;
  const masteredKps = data.kps.filter((k) => (state.kp[k.id] || newKpState()).phase === 'review').length;
  const head = el('div', { class: 'card' });
  head.append(el('h2', { text: '路线图' }));
  head.append(el('p', {
    html: idx < 0
      ? `计划从 <b>${data.rotation.rules.start_date}</b> 开始。`
      : `当前第 <b>${week}</b> 周（第 ${idx} 天）· 已完成 <b>${doneDays}</b> 天 · 已掌握知识点 <b>${masteredKps}/${data.kps.length}</b>`,
  }));
  const pct = Math.min(100, Math.round((Math.max(idx, 0) / 70) * 100));
  head.append(el('div', { class: 'progress-bar' }, [el('div', { class: 'progress-fill', style: `width:${pct}%` })]));
  container.append(head);

  // track 图例
  const legend = el('div', { class: 'card compact' });
  legend.append(el('p', {
    html: data.roadmap.tracks.map((t) => `<b>${t.id}</b> ${escapeHtml(t.name)}`).join(' · '),
  }));
  legend.append(el('p', { class: 'muted small-text', text: `练习题目前覆盖第 ${data.roadmap.quiz_coverage_weeks.join('、')} 周的知识点。` }));
  container.append(legend);

  // 每周卡片
  for (const w of data.roadmap.plan) {
    const isCurrent = w.week === week;
    const isPast = week > w.week;
    const card = el('div', { class: 'card week-card' + (isCurrent ? ' current-week' : '') });
    const weekStart = addDays(data.rotation.rules.start_date, (w.week - 1) * 7);
    // 本周完成天数
    let wDone = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      if (state.days[d] && state.days[d].done) wDone++;
    }
    // 本周知识点掌握
    const weekKps = data.kps.filter((k) => k.week === w.week);
    const weekMastered = weekKps.filter((k) => (state.kp[k.id] || newKpState()).phase === 'review').length;

    card.append(el('h3', {
      html: `第 ${w.week} 周 ${isCurrent ? '<span class="chip due-chip">本周</span>' : isPast ? '<span class="chip ok-chip">已过</span>' : ''}` +
        ` <span class="muted small-text">${weekStart} 起 · 完成 ${wDone}/7 天${weekKps.length ? ` · 知识点 ${weekMastered}/${weekKps.length}` : ''}</span>`,
    }));
    card.append(el('div', { class: 'week-rows', html: [
      `<div><b>T1</b> ${escapeHtml(w.T1)}</div>`,
      `<div><b>T2</b> ${escapeHtml(w.T2)}</div>`,
      `<div><b>T3</b> ${escapeHtml(w.T3)}</div>`,
    ].join('') }));
    container.append(card);
  }
}
