// 诊断测验：15 道笔答题 → 提交后对照参考答案自评 0/0.5/1 → 得出路线和薄弱 track。
import { el, escapeHtml, sourcesHtml, enableTabIndent, debounce, toast } from '../util.js';
import { getState, setEntry } from '../store.js';

const GRADES = [0, 0.5, 1];

export function renderDiagnostic(container, ctx) {
  const { diagnostic } = ctx.data;

  const draw = () => {
    container.innerHTML = '';
    const state = getState();
    const summary = state.diag.summary || {};
    if (summary.done) drawResult(container, ctx, draw);
    else if (summary.stage === 'grading') drawGrading(container, ctx, draw);
    else drawAnswering(container, ctx, draw);
  };
  draw();

  function drawAnswering(root, ctx2, redraw) {
    const state = getState();
    root.append(el('div', { class: 'card' }, [
      el('h2', { text: '诊断测验' }),
      el('p', { text: `${diagnostic.count} 题 · 约 ${diagnostic.minutes} 分钟 · 每题笔答，提交后对照参考答案自评（0 / 0.5 / 1）。答案会自动保存，可中途离开。` }),
    ]));
    for (const q of diagnostic.questions) {
      const key = 'n' + q.n;
      const rec = state.diag[key] || {};
      const card = el('div', { class: 'card' });
      card.append(el('div', { class: 'q-meta', html: `<span class="chip">${q.n}/${diagnostic.count}</span> <span class="chip">${escapeHtml(q.track)}</span>` }));
      card.append(el('p', { class: 'q-prompt', text: q.prompt_zh }));
      const ta = el('textarea', { class: 'answer-box', rows: 3, placeholder: '写下你的答案…' });
      ta.value = rec.text || '';
      enableTabIndent(ta);
      ta.addEventListener('input', debounce(() => setEntry('diag', key, { text: ta.value }), 600));
      card.append(ta);
      root.append(card);
    }
    root.append(el('button', {
      class: 'btn btn-primary big',
      text: '提交，对照参考答案',
      onclick: () => {
        setEntry('diag', 'summary', { stage: 'grading', done: false });
        redraw();
      },
    }));
  }

  function drawGrading(root, ctx2, redraw) {
    const state = getState();
    root.append(el('div', { class: 'card' }, [
      el('h2', { text: '自评打分' }),
      el('p', { text: '对照参考答案，给每题打 0（不会）/ 0.5（会一半）/ 1（答对）。' }),
    ]));
    let graded = 0;
    for (const q of diagnostic.questions) {
      const key = 'n' + q.n;
      const rec = state.diag[key] || {};
      if (rec.grade !== undefined && rec.grade !== null) graded++;
      const card = el('div', { class: 'card' });
      card.append(el('div', { class: 'q-meta', html: `<span class="chip">${q.n}/${diagnostic.count}</span> <span class="chip">${escapeHtml(q.track)}</span>` }));
      card.append(el('p', { class: 'q-prompt', text: q.prompt_zh }));
      card.append(el('div', { class: 'your-answer', html: `<b>你的答案：</b>${rec.text ? escapeHtml(rec.text) : '<i>（空）</i>'}` }));
      card.append(el('div', { class: 'ref-answer', html: `<b>参考答案：</b>${escapeHtml(q.answer_zh)}` }));
      card.append(el('div', { html: sourcesHtml(q.sources) }));
      const row = el('div', { class: 'row gap' });
      for (const g of GRADES) {
        row.append(el('button', {
          class: 'btn grade-btn' + (rec.grade === g ? ' selected' : ''),
          text: String(g),
          onclick: () => { setEntry('diag', key, { grade: g }); redraw(); },
        }));
      }
      card.append(row);
      root.append(card);
    }
    const allGraded = graded === diagnostic.questions.length;
    root.append(el('button', {
      class: 'btn btn-primary big' + (allGraded ? '' : ' disabled'),
      text: allGraded ? '完成评分，查看结果' : `完成评分（已评 ${graded}/${diagnostic.questions.length}）`,
      onclick: () => {
        if (!allGraded) { toast('还有题目没有打分'); return; }
        finishGrading(redraw);
      },
    }));
    root.append(el('button', {
      class: 'btn btn-ghost center',
      text: '← 返回修改答案',
      onclick: () => { setEntry('diag', 'summary', { stage: 'answering', done: false }); redraw(); },
    }));
  }

  function finishGrading(redraw) {
    const state = getState();
    let score = 0;
    const byTrack = {};
    for (const q of diagnostic.questions) {
      const g = (state.diag['n' + q.n] || {}).grade || 0;
      score += g;
      (byTrack[q.track] ??= []).push(g);
    }
    const route = (diagnostic.routing.find((r) => score <= r.max_score) || diagnostic.routing[diagnostic.routing.length - 1]).route_zh;
    const weak = Object.entries(byTrack)
      .filter(([, gs]) => gs.reduce((a, b) => a + b, 0) / gs.length < 0.6)
      .map(([t]) => t);
    setEntry('diag', 'summary', { done: true, stage: 'done', score, route, weak });
    toast('诊断完成 🎉');
    redraw();
  }

  function drawResult(root, ctx2, redraw) {
    const state = getState();
    const s = state.diag.summary;
    const card = el('div', { class: 'card' });
    card.append(el('h2', { text: '诊断结果' }));
    card.append(el('p', { class: 'score-big', html: `<b>${s.score}</b> / 15` }));
    card.append(el('p', { html: `<b>推荐路线：</b>${escapeHtml(s.route || '')}` }));
    card.append(el('p', {
      html: s.weak && s.weak.length
        ? `<b>薄弱 track：</b>${s.weak.map(escapeHtml).join('、')} —— 练习时优先这些方向。`
        : '<b>没有明显薄弱 track。</b>',
    }));
    root.append(card);

    // 逐题回顾
    for (const q of diagnostic.questions) {
      const rec = state.diag['n' + q.n] || {};
      const c = el('div', { class: 'card compact' });
      c.append(el('div', { class: 'q-meta', html: `<span class="chip">${q.n}</span> <span class="chip">${escapeHtml(q.track)}</span> <span class="chip grade-chip">${rec.grade ?? '-'} 分</span>` }));
      c.append(el('p', { class: 'q-prompt', text: q.prompt_zh }));
      c.append(el('details', {}, [
        el('summary', { text: '查看答案' }),
        el('div', { class: 'your-answer', html: `<b>你的答案：</b>${rec.text ? escapeHtml(rec.text) : '<i>（空）</i>'}` }),
        el('div', { class: 'ref-answer', html: `<b>参考答案：</b>${escapeHtml(q.answer_zh)}` }),
        el('div', { html: sourcesHtml(q.sources) }),
      ]));
      root.append(c);
    }
    root.append(el('button', {
      class: 'btn btn-ghost center',
      text: '重新测验（覆盖本次结果）',
      onclick: () => {
        if (!confirm('确定要重新测验吗？会清空本次答案和评分。')) return;
        for (const q of diagnostic.questions) setEntry('diag', 'n' + q.n, { text: '', grade: null });
        setEntry('diag', 'summary', { done: false, stage: 'answering', score: null, route: null, weak: [] });
        redraw();
      },
    }));
  }
}
