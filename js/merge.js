// 跨设备合并逻辑：按每个条目的 updatedAt 做 last-write-wins，attempts 取并集。
// 纯函数模块，便于单元测试。

/** 状态文档骨架 */
export function emptyState() {
  return {
    version: 1,
    kp: {},        // kpId -> 掌握度状态（含 updatedAt）
    attempts: {},  // attemptId -> { id, qid, kpId, correct, reasoning, mode, ts }
    mistakes: {},  // qid -> { count, lastTs, cleared, updatedAt }
    days: {},      // date -> { done, updatedAt }
    homework: {},  // key(date:slug) -> { text, status, score, notes, updatedAt }
    diag: {},      // 'n1'..'n15' -> { text, grade, updatedAt }；'summary' -> { done, score, route, weak, updatedAt }
    mocks: {},     // mockId -> { text, graded?, updatedAt }
    settings: {},  // { streakTarget?, updatedAt }
  };
}

const KEYED_MAPS = ['kp', 'mistakes', 'days', 'homework', 'diag', 'mocks'];

function later(a, b) {
  const ta = (a && a.updatedAt) || 0;
  const tb = (b && b.updatedAt) || 0;
  return tb > ta ? b : a;
}

/**
 * 合并两份状态文档。对每个带 key 的条目，updatedAt 较新者胜（LWW）；
 * attempts 是 append-only 的，按 id 取并集，两边都有时保留任意一份（内容相同）。
 */
export function mergeState(a, b) {
  const A = { ...emptyState(), ...(a || {}) };
  const B = { ...emptyState(), ...(b || {}) };
  const out = emptyState();
  out.version = Math.max(A.version || 1, B.version || 1);

  for (const map of KEYED_MAPS) {
    const keys = new Set([...Object.keys(A[map] || {}), ...Object.keys(B[map] || {})]);
    for (const k of keys) {
      out[map][k] = later((A[map] || {})[k], (B[map] || {})[k]);
    }
  }
  out.attempts = { ...(A.attempts || {}), ...(B.attempts || {}) };
  out.settings = later(A.settings, B.settings) || {};
  return out;
}

/** 粗略判断两份状态是否等价（用于决定是否需要推送） */
export function sameState(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
