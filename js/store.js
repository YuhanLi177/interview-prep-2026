// 本地状态仓库：单一 JSON 文档存 localStorage，变更时打 updatedAt 时间戳并通知订阅者。
import { emptyState, mergeState } from './merge.js';

const LS_KEY = 'prep_state_v1';

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch { /* 损坏则重置 */ }
  return emptyState();
}

function persist() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function notify() {
  for (const fn of listeners) fn(state);
}

export function getState() {
  return state;
}

/** 订阅状态变化（用于触发同步推送和 UI 刷新） */
export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 更新某个 map 里的一个条目，自动打 updatedAt */
export function setEntry(map, key, patch) {
  const prev = state[map][key] || {};
  state[map][key] = { ...prev, ...patch, updatedAt: Date.now() };
  persist();
  notify();
  return state[map][key];
}

export function getEntry(map, key) {
  return state[map][key];
}

/** 追加一条作答记录（append-only，按 id 并集合并） */
export function addAttempt(attempt) {
  state.attempts[attempt.id] = attempt;
  persist();
  notify();
}

export function setSettings(patch) {
  state.settings = { ...state.settings, ...patch, updatedAt: Date.now() };
  persist();
  notify();
}

export function getSettings() {
  return state.settings || {};
}

/** 用远端文档合并进本地（同步拉取后调用）。返回是否有变化。 */
export function mergeRemote(remote) {
  const merged = mergeState(state, remote);
  const changed = JSON.stringify(merged) !== JSON.stringify(state);
  state = merged;
  persist();
  if (changed) notify();
  return changed;
}

/** 整体替换（导入备份用） */
export function replaceState(doc) {
  state = { ...emptyState(), ...doc };
  persist();
  notify();
}

export function resetState() {
  state = emptyState();
  persist();
  notify();
}

export function exportJson() {
  return JSON.stringify(state, null, 2);
}
