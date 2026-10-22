// 跨设备同步：把状态文档存到一个私密（secret）GitHub gist。
// token 只存在本设备 localStorage，绝不进入仓库或状态文档。
// 策略：加载/聚焦时拉取合并；变更后防抖推送（推送前先拉取合并，避免互相覆盖）。
import { getState, mergeRemote, onChange } from './store.js';
import { debounce } from './util.js';

const TOKEN_KEY = 'prep_gh_token';
const GIST_ID_KEY = 'prep_gist_id';
const FILE_NAME = 'interview-prep-progress.json';
const API = 'https://api.github.com';

export const syncStatus = {
  state: 'off',       // off | syncing | ok | error
  lastSync: null,     // ts
  message: '',
};
const statusListeners = new Set();

export function onSyncStatus(fn) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

function setStatus(state, message = '') {
  syncStatus.state = state;
  syncStatus.message = message;
  if (state === 'ok') syncStatus.lastSync = Date.now();
  for (const fn of statusListeners) fn(syncStatus);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token.trim());
  else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GIST_ID_KEY);
  }
  setStatus(token ? 'ok' : 'off', token ? '已保存 token' : '未配置');
}

async function gh(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 140)}`);
  }
  return res.json();
}

/** 找到（或创建）名为 interview-prep-progress.json 的 secret gist，返回 gist id */
async function findOrCreateGist() {
  const cached = localStorage.getItem(GIST_ID_KEY);
  if (cached) {
    try {
      await gh(`/gists/${cached}`);
      return cached;
    } catch { localStorage.removeItem(GIST_ID_KEY); }
  }
  for (let page = 1; page <= 5; page++) {
    const gists = await gh(`/gists?per_page=100&page=${page}`);
    const hit = gists.find((g) => g.files && g.files[FILE_NAME]);
    if (hit) {
      localStorage.setItem(GIST_ID_KEY, hit.id);
      return hit.id;
    }
    if (gists.length < 100) break;
  }
  const created = await gh('/gists', {
    method: 'POST',
    body: JSON.stringify({
      description: 'interview-prep-2026 学习进度（由 app 自动同步）',
      public: false,
      files: { [FILE_NAME]: { content: JSON.stringify(getState()) } },
    }),
  });
  localStorage.setItem(GIST_ID_KEY, created.id);
  return created.id;
}

async function readRemote(gistId) {
  const gist = await gh(`/gists/${gistId}`);
  const file = gist.files && gist.files[FILE_NAME];
  if (!file) return null;
  let content = file.content;
  if (file.truncated && file.raw_url) {
    content = await (await fetch(file.raw_url)).text();
  }
  try { return JSON.parse(content); } catch { return null; }
}

async function writeRemote(gistId, doc) {
  await gh(`/gists/${gistId}`, {
    method: 'PATCH',
    body: JSON.stringify({ files: { [FILE_NAME]: { content: JSON.stringify(doc) } } }),
  });
}

let syncing = false;

/** 完整一轮同步：拉取 → 合并 → 推送合并结果 */
export async function syncNow() {
  if (!getToken()) { setStatus('off', '未配置 token'); return false; }
  if (syncing) return false;
  syncing = true;
  setStatus('syncing', '同步中…');
  try {
    const gistId = await findOrCreateGist();
    const remote = await readRemote(gistId);
    if (remote) mergeRemote(remote);
    const local = getState();
    if (!remote || JSON.stringify(remote) !== JSON.stringify(local)) {
      await writeRemote(gistId, local);
    }
    setStatus('ok', '已同步');
    return true;
  } catch (e) {
    setStatus('error', e.message || '同步失败');
    return false;
  } finally {
    syncing = false;
  }
}

const pushDebounced = debounce(() => { syncNow(); }, 3000);
let lastPull = 0;

/** 初始化：加载时拉取；窗口聚焦时拉取（节流 30s）；本地变更后防抖推送 */
export function initSync() {
  onChange(() => {
    if (getToken()) pushDebounced();
  });
  const pullOnFocus = () => {
    if (!getToken() || document.visibilityState !== 'visible') return;
    if (Date.now() - lastPull < 30000) return;
    lastPull = Date.now();
    syncNow();
  };
  window.addEventListener('focus', pullOnFocus);
  document.addEventListener('visibilitychange', pullOnFocus);
  if (getToken()) {
    lastPull = Date.now();
    syncNow();
  }
}
