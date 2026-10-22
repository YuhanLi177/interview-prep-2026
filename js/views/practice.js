// 练习页：多邻国式掌握循环 + Leitner 间隔复习 + 错题本。
import { el, shuffle, escapeHtml, sourcesHtml, confidenceBadge, enableTabIndent, addDays, uid, toast } from '../util.js';
import { getState, setEntry, getEntry, addAttempt, getSettings } from '../store.js';
import {
  newKpState, pickQuestion, recordServed, applyAnswer, isDue, isUnlocked,
  buildQueue, dueCount, kpProgress, DEFAULT_STREAK_TARGET,
} from '../engine.js';
import { planWeek } from '../plan.js';

const TRACK_ORDER = ['T1', 'T2', 'T3'];

function streakTarget() {
  const t = getSettings().streakTarget;
  return t >= 2 && t <= 5 ? t : DEFAULT_STREAK_TARGET;
}

export function renderPractice(container, ctx) {
  const param = ctx.routeParam();
  if (param === 'mistakes') return renderMistakeBook(container, ctx);
  renderOverview(container, ctx);
}

// ---------- 总览 ----------
function renderOverview(container, ctx) {
  const { data } = ctx;
  container.innerHTML = '';
  const state = getState();
  const today = ctx.today();
  const week = Math.max(1, planWeek(data.rotation, today));
  const due = dueCount(data.kps, state.kp, today);
  const target = streakTarget();

  const todayAttempts = Object.values(state.attempts).filter(
    (a) => new Date(a.ts).toDateString() === new Date().toDateString() && a.mode !== 'diag',
  ).length;
  const mistakes = Object.entries(state.mistakes).filter(([, m]) => !m.cleared).length;

  const head = el('div', { class: 'card' });
  head.append(el('h2', { text: '练习' }));
  head.append(el('p', {
    html: `到期复习 <b>${due}</b> 个 · 今日已答 <b>${todayAttempts}</b> 题 · 连对 <b>${target}</b> 次算掌握（可在设置里调）`,
  }));
  const queue = buildQueue(data.kps, state.kp, week, today);
  head.append(el('div', { class: 'row gap' }, [
    el('button', {
      class: 'btn btn-primary' + (queue.length ? '' : ' disabled'),
      text: due > 0 ? `开始今日练习（先复习 ${due} 个）` : '开始今日练习',
      onclick: () => queue.length ? startSession(container, ctx, queue) : toast('暂时没有可练的知识点'),
    }),
    el('a', { href: '#/practice/mistakes', class: 'btn', text: `错题本（${mistakes}）` }),
  ]));
  container.append(head);

  // 知识点列表（按 track 分组）
  for (const trackId of TRACK_ORDER) {
    const kps = data.kps.filter((k) => k.track === trackId);
    if (!kps.length) continue;
    const sec = el('div', { class: 'card' });
    sec.append(el('h3', { text: `${trackId} · ${kps[0].track_name}` }));
    for (const kp of kps.sort((a, b) => a.week - b.week)) {
      const st = state.kp[kp.id] || newKpState();
      const unlocked = isUnlocked(kp, week);
      const prog = kpProgress(st, target);
      const dueNow = isDue(st, today);
      const row = el('div', { class: 'kp-row' + (unlocked ? '' : ' locked') });
      row.append(el('div', { class: 'kp-main' }, [
        el('div', {
          class: 'kp-title',
          html: `${unlocked ? '' : '🔒 '}第 ${kp.week} 周 · ${escapeHtml(kp.title_zh)} ${confidenceBadge(kp.confidence)}${dueNow ? ' <span class="chip due-chip">到期</span>' : ''}`,
        }),
        el('div', { class: 'kp-progress', html: `<span class="dots">${prog.dots}</span> ${prog.label} ${prog.detail}` }),
      ]));
      if (unlocked) {
        row.append(el('button', {
          class: 'btn small', text: '练这个',
          onclick: () => startSession(container, ctx, [{ kp, state: st, reason: dueNow ? 'due' : (st.phase === 'new' ? 'new' : 'learning') }]),
        }));
      }
      sec.append(row);
      sec.append(el('details', { class: 'kp-detail' }, [
        el('summary', { text: '要点与来源' }),
        el('p', { text: kp.summary_zh }),
        kp.rumor_note_zh ? el('p', { class: 'muted small-text', text: '⚠️ ' + kp.rumor_note_zh }) : null,
        el('div', { html: sourcesHtml(kp.sources) }),
      ]));
    }
    container.append(sec);
  }
}

// ---------- 练习会话 ----------
function startSession(container, ctx, queue) {
  const { data } = ctx;
  const session = {
    queue: queue.slice(),
    idx: 0,
    answered: 0,
    correct: 0,
    mastered: [],
  };
  nextQuestion();

  function currentKp() {
    return session.idx < session.queue.length ? session.queue[session.idx].kp : null;
  }

  function nextQuestion() {
    const kp = currentKp();
    if (!kp) return renderSummary();
    const st = getEntry('kp', kp.id) || newKpState();
    const questions = data.questionsByKp[kp.id] || [];
    if (!questions.length) { session.idx++; return nextQuestion(); }
    const q = pickQuestion(questions, st.recent);
    setEntry('kp', kp.id, recordServed(st, q.id));
    renderQuestion(kp, q);
  }

  function renderQuestion(kp, q) {
    container.innerHTML = '';
    const state = getState();
    const st = state.kp[kp.id] || newKpState();
    const target = streakTarget();
    const prog = kpProgress(st, target);
    const reason = session.queue[session.idx].reason;
    const reasonZh = { due: '🔁 到期复习', learning: '📚 学习中', new: '✨ 新知识点' }[reason] || '';

    const head = el('div', { class: 'session-head card compact' });
    head.append(el('div', {
      html: `<b>${escapeHtml(kp.title_zh)}</b> ${confidenceBadge(kp.confidence)}<br>` +
        `<span class="muted">${reasonZh} · <span class="dots">${prog.dots}</span> ${prog.detail} · 第 ${session.idx + 1}/${session.queue.length} 个知识点</span>`,
    }));
    head.append(el('button', { class: 'btn btn-ghost small', text: '结束练习', onclick: renderSummary }));
    container.append(head);

    const card = el('div', { class: 'card' });
    card.append(el('p', { class: 'q-prompt', html: escapeHtml(q.prompt_zh) + ' ' + (q.confidence ? confidenceBadge(q.confidence) : '') }));

    // 先写思路（可选），之后才显示选项
    const reasonBox = el('textarea', { class: 'answer-box', rows: 2, placeholder: '先写你的思路（可选，会和作答一起保存）…' });
    enableTabIndent(reasonBox);
    card.append(reasonBox);

    const optsWrap = el('div', { class: 'options hidden' });
    const showBtn = el('button', {
      class: 'btn btn-primary', text: '显示选项',
      onclick: () => {
        showBtn.remove();
        optsWrap.classList.remove('hidden');
      },
    });
    card.append(showBtn, optsWrap);

    // 每次显示都洗牌；正确答案永远是原始 options[0]
    const correctText = q.options[0];
    const shuffled = shuffle(q.options);
    let answeredFlag = false;
    for (const opt of shuffled) {
      optsWrap.append(el('button', {
        class: 'btn option-btn',
        text: opt,
        onclick: (e) => {
          if (answeredFlag) return;
          answeredFlag = true;
          handleAnswer(kp, q, opt === correctText, reasonBox.value, optsWrap, correctText, card);
        },
      }));
    }
    container.append(card);
  }

  function handleAnswer(kp, q, correct, reasoning, optsWrap, correctText, card) {
    const today = ctx.today();
    const prevState = getEntry('kp', kp.id) || newKpState();
    const reason = session.queue[session.idx].reason;
    const mode = reason === 'due' && prevState.phase === 'review' ? 'review' : 'learn';
    const nextState = applyAnswer(prevState, correct, {
      today, addDays, streakTarget: streakTarget(),
    });
    setEntry('kp', kp.id, nextState);
    addAttempt({ id: uid(), qid: q.id, kpId: kp.id, correct, reasoning: reasoning || '', mode, ts: Date.now() });

    // 错题本维护
    const m = getEntry('mistakes', q.id);
    if (!correct) setEntry('mistakes', q.id, { count: (m?.count || 0) + 1, lastTs: Date.now(), cleared: false });
    else if (m && !m.cleared) setEntry('mistakes', q.id, { cleared: true });

    session.answered++;
    if (correct) session.correct++;

    // 高亮对错
    for (const btn of optsWrap.querySelectorAll('.option-btn')) {
      btn.disabled = true;
      if (btn.textContent === correctText) btn.classList.add('right');
      else if (!correct && btn.textContent !== correctText) btn.classList.add('dim');
    }
    // 讲解 + 来源
    const fb = el('div', { class: 'feedback ' + (correct ? 'ok' : 'bad') });
    fb.append(el('p', { html: correct ? '✅ <b>答对了！</b>' : '❌ <b>答错了。</b>正确答案已高亮。' }));
    fb.append(el('p', { text: q.explanation_zh }));
    fb.append(el('div', { html: sourcesHtml(q.sources) }));

    // 状态变化提示 + 下一步
    const target = streakTarget();
    let note = '';
    const justMastered = prevState.phase !== 'review' && nextState.phase === 'review';
    if (justMastered) {
      note = `🎉 连对 ${target} 次，已掌握！${nextState.due} 复习。`;
      session.mastered.push(kp.title_zh);
      session.idx++;
    } else if (prevState.phase === 'review' && correct) {
      note = `🔁 复习通过，下次 ${nextState.due}。`;
      session.idx++;
    } else if (prevState.phase === 'review' && !correct) {
      note = '↩️ 复习没过，回到连对循环，马上换一道同知识点的题。';
      session.queue[session.idx].reason = 'learning';
    } else if (!correct) {
      note = '马上再来一道同知识点的题。';
    } else {
      note = `还差 ${target - nextState.streak} 次连对。`;
    }
    fb.append(el('p', { class: 'muted', text: note }));
    fb.append(el('button', { class: 'btn btn-primary', text: '下一题 →', onclick: nextQuestion }));
    card.append(fb);
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderSummary() {
    container.innerHTML = '';
    const card = el('div', { class: 'card' });
    card.append(el('h2', { text: '本次练习小结' }));
    card.append(el('p', {
      html: `共答 <b>${session.answered}</b> 题，答对 <b>${session.correct}</b> 题` +
        (session.mastered.length ? `<br>🎉 新掌握：${session.mastered.map(escapeHtml).join('、')}` : ''),
    }));
    card.append(el('button', { class: 'btn btn-primary', text: '返回练习页', onclick: () => ctx.rerender() }));
    container.append(card);
  }
}

// ---------- 错题本 ----------
function renderMistakeBook(container, ctx) {
  const { data } = ctx;
  container.innerHTML = '';
  const state = getState();

  container.append(el('div', { class: 'card' }, [
    el('h2', { text: '错题本' }),
    el('a', { href: '#/practice', class: 'btn btn-ghost small', text: '← 返回练习' }),
  ]));

  // 练习错题
  const open = Object.entries(state.mistakes).filter(([, m]) => !m.cleared);
  const cleared = Object.entries(state.mistakes).filter(([, m]) => m.cleared);
  const sec = el('div', { class: 'card' });
  sec.append(el('h3', { text: `练习错题（${open.length}）` }));
  if (!open.length) sec.append(el('p', { class: 'muted', text: '没有未消灭的错题 🎉' }));
  for (const [qid, m] of open.sort((a, b) => b[1].lastTs - a[1].lastTs)) {
    const q = data.questionById[qid];
    if (!q) continue;
    const kp = data.kpById[q.kp_id];
    const row = el('div', { class: 'kp-row' });
    row.append(el('div', { class: 'kp-main' }, [
      el('div', { class: 'kp-title', html: escapeHtml(q.prompt_zh) }),
      el('div', { class: 'muted small-text', text: `${kp ? kp.title_zh : q.kp_id} · 错 ${m.count} 次` }),
    ]));
    row.append(el('button', { class: 'btn small', text: '重做', onclick: () => retryQuestion(container, ctx, q) }));
    sec.append(row);
  }
  if (cleared.length) {
    sec.append(el('details', {}, [
      el('summary', { text: `已消灭（${cleared.length}）` }),
      ...cleared.map(([qid]) => {
        const q = data.questionById[qid];
        return q ? el('p', { class: 'muted small-text', text: '✓ ' + q.prompt_zh }) : null;
      }),
    ]));
  }
  container.append(sec);

  // 作业批改不佳的条目
  const badHw = Object.entries(state.homework)
    .filter(([, h]) => h.status === 'graded' && typeof h.score === 'number' && h.score <= 6)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt);
  const hwSec = el('div', { class: 'card' });
  hwSec.append(el('h3', { text: `作业待加强（批改 ≤ 6 分，共 ${badHw.length}）` }));
  if (!badHw.length) hwSec.append(el('p', { class: 'muted', text: '没有批改不佳的作业。' }));
  for (const [key, h] of badHw) {
    const [date] = key.split(':');
    const row = el('div', { class: 'kp-row' });
    row.append(el('div', { class: 'kp-main' }, [
      el('div', { class: 'kp-title', text: h.title || key }),
      el('div', { class: 'muted small-text', text: `${h.score}/10 · ${h.notes ? h.notes.slice(0, 60) : ''}` }),
    ]));
    row.append(el('a', {
      class: 'btn small',
      href: key.startsWith('handson:') ? '#/homework' : `#/homework/${date}`,
      text: '去重写',
    }));
    hwSec.append(row);
  }
  container.append(hwSec);
}

/** 从错题本重做单题：答对即消灭 */
function retryQuestion(container, ctx, q) {
  container.innerHTML = '';
  const kp = ctx.data.kpById[q.kp_id];
  const card = el('div', { class: 'card' });
  card.append(el('div', { class: 'q-meta', html: `<span class="chip">错题重做</span> ${kp ? escapeHtml(kp.title_zh) : ''} ${confidenceBadge(q.confidence || (kp && kp.confidence))}` }));
  card.append(el('p', { class: 'q-prompt', text: q.prompt_zh }));
  const reasonBox = el('textarea', { class: 'answer-box', rows: 2, placeholder: '先写你的思路（可选）…' });
  enableTabIndent(reasonBox);
  card.append(reasonBox);

  const optsWrap = el('div', { class: 'options hidden' });
  const showBtn = el('button', {
    class: 'btn btn-primary', text: '显示选项',
    onclick: () => { showBtn.remove(); optsWrap.classList.remove('hidden'); },
  });
  const correctText = q.options[0];
  let done = false;
  for (const opt of shuffle(q.options)) {
    optsWrap.append(el('button', {
      class: 'btn option-btn', text: opt,
      onclick: () => {
        if (done) return;
        done = true;
        const correct = opt === correctText;
        addAttempt({ id: uid(), qid: q.id, kpId: q.kp_id, correct, reasoning: reasonBox.value || '', mode: 'mistake', ts: Date.now() });
        const m = getEntry('mistakes', q.id);
        if (correct) setEntry('mistakes', q.id, { cleared: true });
        else setEntry('mistakes', q.id, { count: (m?.count || 0) + 1, lastTs: Date.now(), cleared: false });
        for (const btn of optsWrap.querySelectorAll('.option-btn')) {
          btn.disabled = true;
          if (btn.textContent === correctText) btn.classList.add('right');
        }
        const fb = el('div', { class: 'feedback ' + (correct ? 'ok' : 'bad') });
        fb.append(el('p', { html: correct ? '✅ <b>消灭一道错题！</b>' : '❌ 还没消灭，下次再来。' }));
        fb.append(el('p', { text: q.explanation_zh }));
        fb.append(el('div', { html: sourcesHtml(q.sources) }));
        fb.append(el('button', { class: 'btn btn-primary', text: '返回错题本', onclick: () => renderMistakeBook(container, ctx) }));
        card.append(fb);
      },
    }));
  }
  card.append(showBtn, optsWrap);
  container.append(card);
}
