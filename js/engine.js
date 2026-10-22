// 掌握度引擎（多邻国式连对循环 + Leitner 间隔复习）
// 纯函数模块：不触碰 DOM / localStorage，便于单元测试。

export const DEFAULT_GAPS = [1, 3, 7]; // 复习间隔（天）；走完后每 7 天一次
export const DEFAULT_STREAK_TARGET = 3; // 连对 N 次算掌握（可配置 2–5）
export const RECENT_AVOID = 4; // 出题时避开最近出过的 ~4 题

/** 新知识点的初始状态 */
export function newKpState() {
  return {
    phase: 'new',       // new | learning | review
    streak: 0,          // learning 阶段的当前连对数
    box: 0,             // review 阶段已成功复习的次数（决定下一个间隔）
    due: null,          // review 阶段的到期日 YYYY-MM-DD
    recent: [],         // 最近出过的题目 id（最多 RECENT_AVOID 个）
    seen: 0,            // 总答题次数
    updatedAt: 0,
  };
}

/**
 * 从同一知识点的题目里选下一题：避开最近 RECENT_AVOID 个出过的；
 * 若全被避开则只避开最近 1 个；再不行就任选。
 */
export function pickQuestion(questions, recent = [], rng = Math.random) {
  if (!questions.length) return null;
  const avoid = new Set(recent.slice(-RECENT_AVOID));
  let pool = questions.filter((q) => !avoid.has(q.id));
  if (!pool.length && recent.length) {
    const last = recent[recent.length - 1];
    pool = questions.filter((q) => q.id !== last);
  }
  if (!pool.length) pool = questions;
  return pool[Math.floor(rng() * pool.length)];
}

/** 记录“出过这道题” */
export function recordServed(state, qid) {
  const recent = state.recent.filter((id) => id !== qid);
  recent.push(qid);
  while (recent.length > RECENT_AVOID) recent.shift();
  return { ...state, recent };
}

/**
 * 应用一次作答，返回新的知识点状态。
 * @param state 知识点状态
 * @param correct 是否答对
 * @param opts { today: 'YYYY-MM-DD', streakTarget, gaps, addDays }
 */
export function applyAnswer(state, correct, opts) {
  const { today, addDays } = opts;
  const target = opts.streakTarget ?? DEFAULT_STREAK_TARGET;
  const gaps = opts.gaps ?? DEFAULT_GAPS;
  const s = { ...state, seen: (state.seen || 0) + 1 };

  if (s.phase === 'review') {
    if (correct) {
      // 复习成功：进入下一个间隔（走完 1/3/7 后固定每 7 天）
      const nextBox = s.box + 1;
      const gap = gaps[Math.min(nextBox, gaps.length - 1)];
      return { ...s, box: nextBox, due: addDays(today, gap), streak: 0 };
    }
    // 复习答错：回到连对循环
    return { ...s, phase: 'learning', streak: 0, box: 0, due: null };
  }

  // new / learning
  if (correct) {
    const streak = s.streak + 1;
    if (streak >= target) {
      // 掌握，进入间隔复习：第一个间隔 gaps[0]（1 天）
      return { ...s, phase: 'review', streak: 0, box: 0, due: addDays(today, gaps[0]) };
    }
    return { ...s, phase: 'learning', streak };
  }
  return { ...s, phase: 'learning', streak: 0 };
}

/** 该知识点今天是否到期复习 */
export function isDue(state, today) {
  return state.phase === 'review' && state.due != null && state.due <= today;
}

/** 按计划周解锁：知识点所属周 <= 当前计划周 */
export function isUnlocked(kp, currentWeek) {
  return kp.week <= currentWeek;
}

/**
 * 构建今日练习队列：到期复习优先，其次进行中的，再次新解锁的。
 * @returns [{ kp, state, reason: 'due'|'learning'|'new' }]
 */
export function buildQueue(kps, states, currentWeek, today) {
  const get = (id) => states[id] || newKpState();
  const due = [];
  const learning = [];
  const fresh = [];
  for (const kp of kps) {
    const st = get(kp.id);
    if (isDue(st, today)) due.push({ kp, state: st, reason: 'due' });
    else if (st.phase === 'learning') learning.push({ kp, state: st, reason: 'learning' });
    else if (st.phase === 'new' && isUnlocked(kp, currentWeek)) fresh.push({ kp, state: st, reason: 'new' });
  }
  due.sort((a, b) => (a.state.due < b.state.due ? -1 : 1));
  const byWeekTrack = (a, b) => a.kp.week - b.kp.week || a.kp.track.localeCompare(b.kp.track);
  learning.sort(byWeekTrack);
  fresh.sort(byWeekTrack);
  return [...due, ...learning, ...fresh];
}

/** 到期复习的知识点数 */
export function dueCount(kps, states, today) {
  return kps.filter((kp) => states[kp.id] && isDue(states[kp.id], today)).length;
}

/** 知识点进度描述，用于 UI：●●○ 2/3 等 */
export function kpProgress(state, streakTarget = DEFAULT_STREAK_TARGET) {
  if (!state || state.phase === 'new') {
    return { label: '未开始', dots: '○'.repeat(streakTarget), detail: `0/${streakTarget}` };
  }
  if (state.phase === 'learning') {
    const n = Math.min(state.streak, streakTarget);
    return {
      label: '学习中',
      dots: '●'.repeat(n) + '○'.repeat(streakTarget - n),
      detail: `${n}/${streakTarget}`,
    };
  }
  const stage = state.box >= DEFAULT_GAPS.length ? '长期' : `第 ${state.box + 1} 轮`;
  return { label: '已掌握', dots: '●'.repeat(streakTarget), detail: `复习${stage} · ${state.due || ''} 到期` };
}
