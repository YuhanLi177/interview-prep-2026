// 应用入口：加载数据、注册路由、初始化同步。
import { el, todayStr } from './util.js';
import { initSync, onSyncStatus, syncStatus } from './sync.js';
import { renderToday } from './views/today.js';
import { renderDiagnostic } from './views/diagnostic.js';
import { renderPractice } from './views/practice.js';
import { renderHomework } from './views/homework.js';
import { renderRoadmap } from './views/roadmap.js';
import { renderMocks } from './views/mocks.js';
import { renderSettings } from './views/settings.js';

async function loadJson(name) {
  const res = await fetch(`data/${name}.json`);
  if (!res.ok) throw new Error(`加载 data/${name}.json 失败：${res.status}`);
  return res.json();
}

async function loadData() {
  const [questions, kps, diagnostic, rotation, roadmap, mocks, handsOn] = await Promise.all([
    loadJson('questions'), loadJson('knowledge_points'), loadJson('diagnostic'),
    loadJson('daily_rotation'), loadJson('roadmap'), loadJson('mocks'), loadJson('hands_on'),
  ]);
  const questionsByKp = {};
  for (const q of questions) (questionsByKp[q.kp_id] ??= []).push(q);
  const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
  const kpById = Object.fromEntries(kps.map((k) => [k.id, k]));
  return { questions, questionsByKp, questionById, kps, kpById, diagnostic, rotation, roadmap, mocks, handsOn };
}

const ROUTES = [
  { hash: '#/today', label: '今日', icon: '📅', render: renderToday },
  { hash: '#/diagnostic', label: '诊断', icon: '🩺', render: renderDiagnostic },
  { hash: '#/practice', label: '练习', icon: '🎯', render: renderPractice },
  { hash: '#/homework', label: '作业', icon: '📝', render: renderHomework },
  { hash: '#/roadmap', label: '路线', icon: '🗺️', render: renderRoadmap },
  { hash: '#/mocks', label: '模拟', icon: '⏱️', render: renderMocks },
  { hash: '#/settings', label: '设置', icon: '⚙️', render: renderSettings },
];

let ctx = null;

function currentRoute() {
  const hash = location.hash || '#/today';
  const base = '#/' + (hash.split('/')[1] || 'today');
  return ROUTES.find((r) => r.hash === base) || ROUTES[0];
}

export function routeParam() {
  const parts = (location.hash || '').split('/');
  return parts.length > 2 ? decodeURIComponent(parts.slice(2).join('/')) : null;
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  const route = currentRoute();
  for (const r of ROUTES) {
    nav.append(el('a', {
      href: r.hash,
      class: 'nav-item' + (r === route ? ' active' : ''),
    }, [el('span', { class: 'nav-icon', text: r.icon }), el('span', { class: 'nav-label', text: r.label })]));
  }
}

function renderView() {
  const view = document.getElementById('view');
  view.innerHTML = '';
  renderNav();
  try {
    currentRoute().render(view, ctx);
  } catch (e) {
    view.append(el('div', { class: 'card error', text: '页面渲染出错：' + e.message }));
    console.error(e);
  }
  window.scrollTo(0, 0);
}

function renderSyncDot() {
  const dot = document.getElementById('sync-dot');
  if (!dot) return;
  const map = { off: ['◌', '未配置同步'], syncing: ['…', '同步中'], ok: ['●', '已同步'], error: ['!', '同步失败'] };
  const [icon, label] = map[syncStatus.state] || map.off;
  dot.textContent = icon;
  dot.className = 'sync-dot sync-' + syncStatus.state;
  dot.title = label + (syncStatus.lastSync ? ' · ' + new Date(syncStatus.lastSync).toLocaleTimeString() : '');
}

async function main() {
  const view = document.getElementById('view');
  try {
    const data = await loadData();
    ctx = { data, rerender: renderView, routeParam, today: () => todayStr(data.rotation.rules.timezone) };
  } catch (e) {
    view.innerHTML = '';
    view.append(el('div', { class: 'card error', text: '数据加载失败：' + e.message }));
    return;
  }
  window.addEventListener('hashchange', renderView);
  onSyncStatus(renderSyncDot);
  initSync();
  renderSyncDot();
  renderView();
}

main();
