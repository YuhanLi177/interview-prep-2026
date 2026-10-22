// 跨设备合并逻辑的单元测试：按条目 updatedAt 的 LWW + attempts 并集
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, mergeState } from '../js/merge.js';

function doc(patch) {
  return { ...emptyState(), ...patch };
}

test('同一条目：updatedAt 较新者胜（双向对称）', () => {
  const a = doc({ kp: { T1w1: { streak: 2, phase: 'learning', updatedAt: 100 } } });
  const b = doc({ kp: { T1w1: { streak: 0, phase: 'review', due: '2026-10-25', updatedAt: 200 } } });
  const m1 = mergeState(a, b);
  const m2 = mergeState(b, a);
  assert.equal(m1.kp.T1w1.phase, 'review');
  assert.equal(m1.kp.T1w1.due, '2026-10-25');
  assert.deepEqual(m1.kp.T1w1, m2.kp.T1w1);
});

test('不同条目互不影响：两台设备改不同知识点都保留', () => {
  const mac = doc({
    kp: { T1w1: { streak: 3, updatedAt: 500 } },
    days: { '2026-10-22': { done: true, updatedAt: 500 } },
  });
  const phone = doc({
    kp: { T2w1: { streak: 1, updatedAt: 400 } },
    homework: { '2026-10-23:two-sum': { text: 'fun twoSum()…', status: 'draft', updatedAt: 450 } },
  });
  const m = mergeState(mac, phone);
  assert.equal(m.kp.T1w1.streak, 3);
  assert.equal(m.kp.T2w1.streak, 1);
  assert.equal(m.days['2026-10-22'].done, true);
  assert.equal(m.homework['2026-10-23:two-sum'].text, 'fun twoSum()…');
});

test('attempts 取并集（append-only，两边各自新增都保留）', () => {
  const a = doc({ attempts: { x1: { id: 'x1', qid: 'q001', correct: true, ts: 1 } } });
  const b = doc({ attempts: { x2: { id: 'x2', qid: 'q002', correct: false, ts: 2 } } });
  const m = mergeState(a, b);
  assert.deepEqual(Object.keys(m.attempts).sort(), ['x1', 'x2']);
});

test('相同 attempt id 不重复', () => {
  const shared = { id: 'x1', qid: 'q001', correct: true, ts: 1 };
  const m = mergeState(doc({ attempts: { x1: shared } }), doc({ attempts: { x1: shared } }));
  assert.equal(Object.keys(m.attempts).length, 1);
});

test('诊断条目按题合并：两台设备答不同题不会互相覆盖', () => {
  const a = doc({ diag: { n1: { text: 'HashMap', grade: 1, updatedAt: 100 } } });
  const b = doc({ diag: { n2: { text: 'Stack', grade: 0.5, updatedAt: 90 } } });
  const m = mergeState(a, b);
  assert.equal(m.diag.n1.text, 'HashMap');
  assert.equal(m.diag.n2.text, 'Stack');
});

test('settings 整体 LWW', () => {
  const a = doc({ settings: { streakTarget: 4, updatedAt: 300 } });
  const b = doc({ settings: { streakTarget: 2, updatedAt: 100 } });
  assert.equal(mergeState(a, b).settings.streakTarget, 4);
  assert.equal(mergeState(b, a).settings.streakTarget, 4);
});

test('缺 updatedAt 的旧条目被带时间戳的新条目覆盖', () => {
  const a = doc({ mistakes: { q001: { count: 1, cleared: false } } }); // 无 updatedAt
  const b = doc({ mistakes: { q001: { count: 2, cleared: true, updatedAt: 50 } } });
  assert.equal(mergeState(a, b).mistakes.q001.cleared, true);
});

test('合并是幂等的：merge(m, b) == m', () => {
  const a = doc({ kp: { T1w1: { streak: 2, updatedAt: 100 } }, attempts: { x1: { id: 'x1', ts: 1 } } });
  const b = doc({ kp: { T1w1: { streak: 0, updatedAt: 200 } }, attempts: { x2: { id: 'x2', ts: 2 } } });
  const m = mergeState(a, b);
  assert.deepEqual(mergeState(m, b), m);
  assert.deepEqual(mergeState(m, a), m);
});

test('与空文档合并等于自身', () => {
  const a = doc({ kp: { T1w1: { streak: 2, updatedAt: 100 } } });
  assert.deepEqual(mergeState(a, emptyState()).kp, a.kp);
  assert.deepEqual(mergeState(emptyState(), a).kp, a.kp);
});
