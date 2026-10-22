// 掌握循环 + Leitner 复习引擎的单元测试
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newKpState, pickQuestion, recordServed, applyAnswer, isDue, isUnlocked,
  buildQueue, kpProgress, RECENT_AVOID,
} from '../js/engine.js';
import { addDays } from '../js/util.js';

const OPTS = { today: '2026-10-22', addDays, streakTarget: 3, gaps: [1, 3, 7] };

function answerTimes(state, results) {
  let s = state;
  for (const r of results) s = applyAnswer(s, r, OPTS);
  return s;
}

test('连对达到阈值才进入复习（3 连对）', () => {
  let s = newKpState();
  s = answerTimes(s, [true, true]);
  assert.equal(s.phase, 'learning');
  assert.equal(s.streak, 2);
  s = applyAnswer(s, true, OPTS);
  assert.equal(s.phase, 'review');
  assert.equal(s.due, '2026-10-23'); // +1 天
  assert.equal(s.box, 0);
});

test('答错把连对清零，继续留在学习循环', () => {
  let s = answerTimes(newKpState(), [true, true, false]);
  assert.equal(s.phase, 'learning');
  assert.equal(s.streak, 0);
  // 之后仍需完整 3 连对
  s = answerTimes(s, [true, true]);
  assert.equal(s.phase, 'learning');
  s = applyAnswer(s, true, OPTS);
  assert.equal(s.phase, 'review');
});

test('掌握阈值可配置（2 和 5）', () => {
  let s2 = applyAnswer(applyAnswer(newKpState(), true, { ...OPTS, streakTarget: 2 }), true, { ...OPTS, streakTarget: 2 });
  assert.equal(s2.phase, 'review');
  let s5 = newKpState();
  for (let i = 0; i < 4; i++) s5 = applyAnswer(s5, true, { ...OPTS, streakTarget: 5 });
  assert.equal(s5.phase, 'learning');
  s5 = applyAnswer(s5, true, { ...OPTS, streakTarget: 5 });
  assert.equal(s5.phase, 'review');
});

test('Leitner 间隔推进：1 → 3 → 7 → 之后每 7 天', () => {
  let s = answerTimes(newKpState(), [true, true, true]); // 进入复习，due +1
  assert.equal(s.due, '2026-10-23');
  s = applyAnswer(s, true, { ...OPTS, today: '2026-10-23' });
  assert.equal(s.box, 1);
  assert.equal(s.due, '2026-10-26'); // +3
  s = applyAnswer(s, true, { ...OPTS, today: '2026-10-26' });
  assert.equal(s.box, 2);
  assert.equal(s.due, '2026-11-02'); // +7
  s = applyAnswer(s, true, { ...OPTS, today: '2026-11-02' });
  assert.equal(s.box, 3);
  assert.equal(s.due, '2026-11-09'); // 之后固定 +7
});

test('复习时答错 → 回到学习循环，重新掌握后从 1 天重来', () => {
  let s = answerTimes(newKpState(), [true, true, true]);
  s = applyAnswer(s, true, { ...OPTS, today: '2026-10-23' }); // box 1
  s = applyAnswer(s, false, { ...OPTS, today: '2026-10-26' }); // 复习失败
  assert.equal(s.phase, 'learning');
  assert.equal(s.streak, 0);
  assert.equal(s.box, 0);
  assert.equal(s.due, null);
  // 重新 3 连对
  s = answerTimes(s, [true, true, true].map((x) => x));
  assert.equal(s.phase, 'review');
  assert.equal(s.due, addDays(OPTS.today, 1));
});

test('isDue：到期判断', () => {
  const s = answerTimes(newKpState(), [true, true, true]); // due 2026-10-23
  assert.equal(isDue(s, '2026-10-22'), false);
  assert.equal(isDue(s, '2026-10-23'), true);
  assert.equal(isDue(s, '2026-11-01'), true);
  assert.equal(isDue(newKpState(), '2026-11-01'), false);
});

test('选题避开最近出过的 ~4 题', () => {
  const qs = Array.from({ length: 6 }, (_, i) => ({ id: 'q' + i }));
  const recent = ['q0', 'q1', 'q2', 'q3'];
  for (let i = 0; i < 50; i++) {
    const picked = pickQuestion(qs, recent);
    assert.ok(!recent.includes(picked.id), `不应选中最近出过的 ${picked.id}`);
  }
});

test('题目太少避不开时：至少不重复上一题', () => {
  const qs = [{ id: 'a' }, { id: 'b' }];
  const recent = ['a', 'b']; // 全部都在 recent 里
  for (let i = 0; i < 20; i++) {
    const picked = pickQuestion(qs, recent);
    assert.equal(picked.id, 'a'); // 只避开最近一题 b
  }
  // 只有一道题时允许重复
  assert.equal(pickQuestion([{ id: 'only' }], ['only']).id, 'only');
});

test('recordServed 维护最近出题窗口', () => {
  let s = newKpState();
  for (const id of ['q1', 'q2', 'q3', 'q4', 'q5']) s = recordServed(s, id);
  assert.equal(s.recent.length, RECENT_AVOID);
  assert.deepEqual(s.recent, ['q2', 'q3', 'q4', 'q5']);
  // 重复出题会移到末尾而不是重复出现
  s = recordServed(s, 'q3');
  assert.deepEqual(s.recent, ['q2', 'q4', 'q5', 'q3']);
});

test('按周解锁', () => {
  assert.equal(isUnlocked({ week: 1 }, 1), true);
  assert.equal(isUnlocked({ week: 2 }, 1), false);
  assert.equal(isUnlocked({ week: 2 }, 3), true);
});

test('队列顺序：到期复习 > 学习中 > 新解锁；锁定的不进队列', () => {
  const kps = [
    { id: 'a', week: 1, track: 'T1' },
    { id: 'b', week: 1, track: 'T2' },
    { id: 'c', week: 1, track: 'T3' },
    { id: 'd', week: 2, track: 'T1' }, // 未解锁（当前第 1 周）
  ];
  const states = {
    a: { ...newKpState(), phase: 'review', due: '2026-10-20', box: 0 },
    b: { ...newKpState(), phase: 'learning', streak: 1 },
    // c 全新
  };
  const queue = buildQueue(kps, states, 1, '2026-10-22');
  assert.deepEqual(queue.map((x) => [x.kp.id, x.reason]), [
    ['a', 'due'], ['b', 'learning'], ['c', 'new'],
  ]);
});

test('未到期的复习知识点不进队列', () => {
  const kps = [{ id: 'a', week: 1, track: 'T1' }];
  const states = { a: { ...newKpState(), phase: 'review', due: '2026-12-01' } };
  assert.equal(buildQueue(kps, states, 1, '2026-10-22').length, 0);
});

test('kpProgress 展示 ●●○ 2/3', () => {
  const p = kpProgress({ ...newKpState(), phase: 'learning', streak: 2 }, 3);
  assert.equal(p.dots, '●●○');
  assert.equal(p.detail, '2/3');
});
