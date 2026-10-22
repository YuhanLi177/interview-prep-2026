// 作业页：按天的作业条目（LeetCode 题 / 阅读笔记）+ 动手实战任务。
// 每条有代码/笔答编辑器，「提交批改」把格式化的批改请求复制到剪贴板发给导师，
// 之后可以把分数和评语贴回来；≤6 分自动进错题本。
import { el, addDays, escapeHtml, sourcesHtml, confidenceBadge, enableTabIndent, debounce, copyText, toast } from '../util.js';
import { taskForDate } from '../plan.js';
import { getState, setEntry } from '../store.js';

export function renderHomework(container, ctx) {
  const { data } = ctx;
  let date = ctx.routeParam() || ctx.today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = ctx.today();

  const draw = () => {
    container.innerHTML = '';
    const task = taskForDate(data.rotation, date, { diagnosticDone: true });
    const isToday = date === ctx.today();

    container.append(el('div', { class: 'date-nav' }, [
      el('button', { class: 'btn btn-ghost', text: '←', onclick: () => { date = addDays(date, -1); draw(); } }),
      el('div', { class: 'date-title' }, [
        el('div', { class: 'date-main', text: `${date} ${task.weekdayZh}` }),
        el('div', { class: 'date-sub', text: isToday ? '今天' : '' }),
      ]),
      el('button', { class: 'btn btn-ghost', text: '→', onclick: () => { date = addDays(date, 1); draw(); } }),
    ]));

    const head = el('div', { class: 'card compact' });
    head.append(el('h2', { text: '作业 · ' + task.title }));
    if (task.links.length) {
      head.append(el('div', {
        html: '🔗 ' + task.links.map((l) => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.name)}</a>`).join(' · '),
      }));
    }
    container.append(head);

    if (!task.items.length) {
      container.append(el('div', { class: 'card muted', text: '这一天没有作业条目。' }));
    }
    for (const it of task.items) {
      container.append(hwCard(ctx, `${date}:${it.slug}`, {
        title: it.title, url: it.url, kind: it.kind, sources: it.url ? [{ url: it.url, verified: true }] : [],
        extraLinks: task.links,
      }, draw));
    }

    // 动手实战（不限日期，面经驱动的 HTTP/API 集成任务）
    const ho = data.handsOn;
    const sec = el('div', { class: 'card compact' });
    sec.append(el('h3', { html: `动手实战：HTTP/API 集成 ${confidenceBadge(ho.confidence)}` }));
    sec.append(el('p', { class: 'muted small-text', text: ho.note_zh }));
    container.append(sec);
    for (const it of ho.items) {
      container.append(hwCard(ctx, `handson:${it.id}`, {
        title: it.title_zh, kind: it.kind, prompt: it.prompt_zh, sources: it.sources, confidence: it.confidence,
      }, draw));
    }
  };
  draw();
}

function hwCard(ctx, key, info, redraw) {
  const state = getState();
  const rec = state.homework[key] || {};
  const card = el('div', { class: 'card' });

  const statusChip = rec.status === 'graded'
    ? `<span class="chip ${rec.score <= 6 ? 'bad-chip' : 'ok-chip'}">已批改 ${rec.score}/10${rec.score <= 6 ? ' · 已进错题本' : ''}</span>`
    : rec.status === 'awaiting'
      ? '<span class="chip wait-chip">⏳ 待批改</span>'
      : rec.text ? '<span class="chip">✍️ 草稿</span>' : '<span class="chip">○ 未开始</span>';

  card.append(el('div', {
    class: 'q-meta',
    html: `${statusChip} <span class="chip">${info.kind === 'code' ? '代码' : '笔答'}</span> ${info.confidence ? confidenceBadge(info.confidence) : ''}`,
  }));
  card.append(el('h3', {
    html: info.url
      ? `<a href="${escapeHtml(info.url)}" target="_blank" rel="noopener">${escapeHtml(info.title)}</a>`
      : escapeHtml(info.title),
  }));
  if (info.prompt) card.append(el('p', { class: 'small-text', text: info.prompt }));
  if (info.sources && info.sources.length) card.append(el('div', { html: sourcesHtml(info.sources) }));

  const ta = el('textarea', {
    class: 'answer-box' + (info.kind === 'code' ? ' code-box' : ''),
    rows: info.kind === 'code' ? 10 : 5,
    placeholder: info.kind === 'code' ? '// 在这里写代码（支持 Tab 缩进）' : '写下你的答案…',
    spellcheck: 'false',
  });
  ta.value = rec.text || '';
  enableTabIndent(ta);
  ta.addEventListener('input', debounce(() => {
    setEntry('homework', key, { text: ta.value, title: info.title, status: getState().homework[key]?.status || 'draft' });
  }, 700));
  card.append(ta);

  const row = el('div', { class: 'row gap wrap' });
  row.append(el('button', {
    class: 'btn btn-primary',
    text: '提交批改（复制到剪贴板）',
    onclick: async () => {
      const text = ta.value.trim();
      if (!text) { toast('先写点东西再提交'); return; }
      const msg = gradingRequest(info, text);
      const ok = await copyText(msg);
      setEntry('homework', key, { text: ta.value, title: info.title, status: 'awaiting' });
      toast(ok ? '批改请求已复制，去聊天里粘贴给导师吧' : '复制失败，请手动复制');
      redraw();
    },
  }));

  // 回填批改结果
  const gradeDetails = el('details', {}, [el('summary', { text: rec.status === 'graded' ? `批改结果：${rec.score}/10` : '填写批改结果' })]);
  const scoreInput = el('input', { type: 'number', min: '0', max: '10', step: '0.5', class: 'score-input', placeholder: '0–10', value: rec.score ?? '' });
  const notesTa = el('textarea', { class: 'answer-box', rows: 3, placeholder: '把导师的评语贴在这里…' });
  notesTa.value = rec.notes || '';
  gradeDetails.append(
    el('div', { class: 'row gap' }, [el('label', { text: '分数：' }), scoreInput]),
    notesTa,
    el('button', {
      class: 'btn',
      text: '保存批改结果',
      onclick: () => {
        const score = parseFloat(scoreInput.value);
        if (Number.isNaN(score) || score < 0 || score > 10) { toast('分数要在 0–10 之间'); return; }
        setEntry('homework', key, { text: ta.value, title: info.title, status: 'graded', score, notes: notesTa.value });
        toast(score <= 6 ? '已保存；分数 ≤ 6，已加入错题本' : '已保存批改结果');
        redraw();
      },
    }),
  );
  row.append(gradeDetails);
  card.append(row);
  if (rec.status === 'graded' && rec.notes) {
    card.append(el('div', { class: 'ref-answer', html: `<b>导师评语：</b>${escapeHtml(rec.notes)}` }));
  }
  return card;
}

/** 生成发给导师（人类或 AI）的批改请求文本 */
function gradingRequest(info, answerText) {
  const lines = [];
  lines.push(`【题目】${info.title}${info.url ? ' ' + info.url : ''}`);
  if (info.prompt) lines.push(`【要求】${info.prompt}`);
  lines.push('', info.kind === 'code' ? '【我的代码】' : '【我的答案】', '```', answerText, '```', '');
  const srcs = [
    ...(info.sources || []).map((s) => (typeof s === 'string' ? s : s.url)),
    ...(info.extraLinks || []).map((l) => l.url),
  ];
  if (srcs.length) {
    lines.push('【参考资料】');
    for (const u of [...new Set(srcs)]) lines.push('- ' + u);
    lines.push('');
  }
  lines.push('请像面试官一样批改：正确性、复杂度、代码风格 / 表达、边界情况；给出 0–10 分和具体改进建议，最后给一个参考解法或范例答案。');
  return lines.join('\n');
}
