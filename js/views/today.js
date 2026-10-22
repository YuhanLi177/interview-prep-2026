// 今日任务页：按每日轮换展示当天任务，可前后翻日、标记完成。
import { el, addDays, escapeHtml, toast } from '../util.js';
import { taskForDate, dayIndex } from '../plan.js';
import { getState, setEntry } from '../store.js';
import { dueCount } from '../engine.js';

export function renderToday(container, ctx) {
  const { data } = ctx;
  let date = ctx.routeParam() || ctx.today();

  const draw = () => {
    container.innerHTML = '';
    const state = getState();
    const diagDone = !!(state.diag.summary && state.diag.summary.done);
    const task = taskForDate(data.rotation, date, { diagnosticDone: diagDone });
    const isToday = date === ctx.today();
    const dayRec = state.days[date] || {};

    // 日期导航
    container.append(el('div', { class: 'date-nav' }, [
      el('button', { class: 'btn btn-ghost', text: '← 前一天', onclick: () => { date = addDays(date, -1); draw(); } }),
      el('div', { class: 'date-title' }, [
        el('div', { class: 'date-main', text: `${date} ${task.weekdayZh}` }),
        el('div', { class: 'date-sub', text: isToday ? '今天' : '' }),
      ]),
      el('button', { class: 'btn btn-ghost', text: '后一天 →', onclick: () => { date = addDays(date, 1); draw(); } }),
    ]));
    if (!isToday) {
      container.append(el('button', { class: 'btn btn-ghost small center', text: '回到今天', onclick: () => { date = ctx.today(); draw(); } }));
    }

    // 任务卡
    const card = el('div', { class: 'card task-card' });
    card.append(el('h2', { text: task.title }));
    if (task.dayIdx >= 0 && task.kind !== 'after') {
      card.append(el('div', { class: 'muted', text: `第 ${task.dayIdx} 天 / 共 70 天 · 每天约 ${data.rotation.rules.daily_minutes} 分钟` }));
    }
    card.append(el('p', { text: task.desc }));

    if (task.kind === 'diagnostic') {
      card.append(el('a', { href: '#/diagnostic', class: 'btn btn-primary', text: '开始诊断测验 →' }));
    }
    if (task.links.length) {
      const list = el('ul', { class: 'link-list' });
      for (const l of task.links) {
        list.append(el('li', {}, [el('a', { href: l.url, target: '_blank', rel: 'noopener', text: l.name })]));
      }
      card.append(el('h3', { text: '链接' }), list);
    }
    if (task.items.length) {
      const list = el('ul', { class: 'item-list' });
      const hw = getState().homework;
      for (const it of task.items) {
        const rec = hw[`${date}:${it.slug}`];
        const status = !rec || !rec.status ? '○' : rec.status === 'awaiting' ? '⏳' : rec.status === 'graded' ? `✅ ${rec.score}/10` : '✍️';
        list.append(el('li', {}, [`${status} ${it.title}`]));
      }
      card.append(el('h3', { text: '作业条目' }), list,
        el('a', { href: `#/homework/${date}`, class: 'btn', text: '去写作业 →' }));
    }

    // 完成标记
    if (task.kind !== 'before') {
      card.append(el('div', { class: 'row gap' }, [
        el('button', {
          class: 'btn ' + (dayRec.done ? 'btn-done' : 'btn-primary'),
          text: dayRec.done ? '✓ 已完成（点击取消）' : '标记今天完成',
          onclick: () => {
            setEntry('days', date, { done: !dayRec.done });
            toast(dayRec.done ? '已取消完成标记' : '已标记完成 🎉');
            draw();
          },
        }),
      ]));
    }
    container.append(card);

    // 复习提醒
    const due = dueCount(data.kps, state.kp, ctx.today());
    const reminder = el('div', { class: 'card' });
    reminder.append(el('h3', { text: '练习提醒' }));
    reminder.append(el('p', {
      html: due > 0
        ? `今天有 <b>${due}</b> 个知识点到期复习。`
        : '今天没有到期的复习，可以推进新知识点。',
    }));
    reminder.append(el('a', { href: '#/practice', class: 'btn', text: '去练习 →' }));
    container.append(reminder);

    // 诊断结果摘要
    if (diagDone) {
      const s = state.diag.summary;
      const diagCard = el('div', { class: 'card' });
      diagCard.append(el('h3', { text: '诊断结果' }));
      diagCard.append(el('p', { html: `得分 <b>${s.score}</b> / 15 —— ${escapeHtml(s.route || '')}` }));
      if (s.weak && s.weak.length) {
        diagCard.append(el('p', { html: `薄弱 track：<b>${s.weak.map(escapeHtml).join('、')}</b>（练习时优先）` }));
      }
      container.append(diagCard);
    }

    // 连续完成天数
    let streak = 0;
    let d = ctx.today();
    if (!(state.days[d] && state.days[d].done)) d = addDays(d, -1);
    while (state.days[d] && state.days[d].done && dayIndex(data.rotation, d) >= 0) {
      streak++;
      d = addDays(d, -1);
    }
    if (streak > 0) {
      container.append(el('div', { class: 'card streak-card', html: `🔥 连续完成 <b>${streak}</b> 天` }));
    }
  };

  draw();
}
