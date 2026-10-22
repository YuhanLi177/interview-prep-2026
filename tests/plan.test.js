// 每日轮换计划的单元测试（用仓库里的真实 rotation 数据）
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { taskForDate, planWeek, chunkProblems, dayIndex } from '../js/plan.js';

const rotation = JSON.parse(readFileSync(new URL('../data/daily_rotation.json', import.meta.url)));

// 2026-10-22 是周四，计划第 0 天
test('第 0 天：诊断未完成时当天任务就是诊断', () => {
  const t = taskForDate(rotation, '2026-10-22', { diagnosticDone: false });
  assert.equal(t.kind, 'diagnostic');
});

test('诊断完成后按星期轮换（10-22 周四 = T2 笔记日）', () => {
  const t = taskForDate(rotation, '2026-10-22', { diagnosticDone: true });
  assert.equal(t.kind, 'notes');
  assert.match(t.title, /平台架构/);
});

test('开始前的日期', () => {
  const t = taskForDate(rotation, '2026-10-20', { diagnosticDone: true });
  assert.equal(t.kind, 'before');
});

test('周计算：第 0–6 天是第 1 周，第 7 天进入第 2 周', () => {
  assert.equal(planWeek(rotation, '2026-10-22'), 1);
  assert.equal(planWeek(rotation, '2026-10-28'), 1);
  assert.equal(planWeek(rotation, '2026-10-29'), 2);
  assert.equal(dayIndex(rotation, '2026-10-29'), 7);
});

test('第 1 周周五是 Stripe 替换日；第 5 周周五是 coding 日', () => {
  const fri1 = taskForDate(rotation, '2026-10-23', { diagnosticDone: true });
  assert.equal(fri1.kind, 'stripe');
  // 第 5 周的周五：2026-10-22 + 28 = 11-19（周四），11-20 是周五
  assert.equal(planWeek(rotation, '2026-11-20'), 5);
  const fri5 = taskForDate(rotation, '2026-11-20', { diagnosticDone: true });
  assert.equal(fri5.kind, 'coding');
});

test('coding 日切题：第 1–4 周切 2 份，第 5 周起切 3 份', () => {
  // 第 1 周周一 2026-10-26：5 道题切 2 份，第 1 份 3 道
  const mon = taskForDate(rotation, '2026-10-26', { diagnosticDone: true });
  assert.equal(mon.kind, 'coding');
  assert.equal(mon.links.length, 3);
  const wed = taskForDate(rotation, '2026-10-28', { diagnosticDone: true });
  assert.equal(wed.links.length, 2);
  // 两天合起来覆盖整周 5 道题
  const all = [...mon.links, ...wed.links].map((l) => l.name);
  assert.equal(new Set(all).size, 5);
});

test('chunkProblems 完整覆盖且不重叠', () => {
  const probs = ['a', 'b', 'c', 'd', 'e'].map((n) => ({ name: n }));
  const parts = [0, 1].map((k) => chunkProblems(probs, 2, k));
  assert.deepEqual(parts.flat().map((p) => p.name), ['a', 'b', 'c', 'd', 'e']);
});

test('周日是复习日', () => {
  const sun = taskForDate(rotation, '2026-10-25', { diagnosticDone: true });
  assert.equal(sun.kind, 'review');
});

test('10 周后结束', () => {
  const t = taskForDate(rotation, '2027-01-01', { diagnosticDone: true });
  assert.equal(t.kind, 'after');
});
