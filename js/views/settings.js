// 设置页：同步 token、掌握阈值、导入导出备份。
import { el, toast } from '../util.js';
import { getToken, setToken, syncNow, syncStatus, onSyncStatus } from '../sync.js';
import { getSettings, setSettings, exportJson, replaceState, resetState } from '../store.js';
import { DEFAULT_STREAK_TARGET } from '../engine.js';

export function renderSettings(container, ctx) {
  container.innerHTML = '';

  // ---- 同步 ----
  const sync = el('div', { class: 'card' });
  sync.append(el('h2', { text: '跨设备同步' }));
  sync.append(el('p', {
    class: 'small-text',
    html: '进度保存在你自己的一个<b>私密 GitHub gist</b>（文件名 interview-prep-progress.json）。' +
      '在每台设备上粘贴一个只有 <b>gist 权限</b>的 GitHub token（token 只存在本设备浏览器里，不会上传到任何仓库）。' +
      '<br>创建方式见 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">github.com/settings/tokens</a>：' +
      'fine-grained token 勾选 Gists 读写，或 classic token 只勾 <code>gist</code> scope。',
  }));
  const tokenInput = el('input', {
    type: 'password', class: 'text-input', placeholder: 'ghp_… 或 github_pat_…',
    autocomplete: 'off',
  });
  tokenInput.value = getToken();
  sync.append(tokenInput);
  const statusLine = el('p', { class: 'muted small-text' });
  const renderStatus = () => {
    const map = { off: '未配置', syncing: '同步中…', ok: '✅ 正常', error: '❌ ' + syncStatus.message };
    statusLine.textContent = `状态：${map[syncStatus.state] || syncStatus.state}` +
      (syncStatus.lastSync ? ` · 上次同步 ${new Date(syncStatus.lastSync).toLocaleString()}` : '');
  };
  renderStatus();
  onSyncStatus(renderStatus);
  sync.append(el('div', { class: 'row gap wrap' }, [
    el('button', {
      class: 'btn btn-primary', text: '保存 token 并同步',
      onclick: async () => {
        setToken(tokenInput.value.trim());
        if (!tokenInput.value.trim()) { toast('已清除 token'); return; }
        const ok = await syncNow();
        toast(ok ? '同步成功' : '同步失败：' + syncStatus.message);
      },
    }),
    el('button', { class: 'btn', text: '立即同步', onclick: async () => { const ok = await syncNow(); toast(ok ? '同步成功' : '同步失败：' + syncStatus.message); } }),
    el('button', { class: 'btn btn-ghost', text: '清除 token', onclick: () => { tokenInput.value = ''; setToken(''); toast('已清除'); } }),
  ]));
  sync.append(statusLine);
  container.append(sync);

  // ---- 练习设置 ----
  const practice = el('div', { class: 'card' });
  practice.append(el('h3', { text: '练习设置' }));
  const current = getSettings().streakTarget || DEFAULT_STREAK_TARGET;
  const select = el('select', { class: 'text-input' });
  for (const n of [2, 3, 4, 5]) {
    select.append(el('option', { value: n, text: `连对 ${n} 次算掌握`, ...(n === current ? { selected: '' } : {}) }));
  }
  select.addEventListener('change', () => {
    setSettings({ streakTarget: parseInt(select.value, 10) });
    toast('已保存');
  });
  practice.append(select);
  container.append(practice);

  // ---- 备份 ----
  const backup = el('div', { class: 'card' });
  backup.append(el('h3', { text: '备份（同步的兜底方案）' }));
  backup.append(el('div', { class: 'row gap wrap' }, [
    el('button', {
      class: 'btn', text: '导出 JSON',
      onclick: () => {
        const blob = new Blob([exportJson()], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `interview-prep-backup-${ctx.today()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
    }),
    (() => {
      const input = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        try {
          const doc = JSON.parse(await file.text());
          if (!confirm('导入会与当前进度合并（按更新时间取新）。继续？')) return;
          const { mergeState } = await import('../merge.js');
          const { getState } = await import('../store.js');
          replaceState(mergeState(getState(), doc));
          toast('导入完成');
          ctx.rerender();
        } catch (e) { toast('导入失败：' + e.message); }
      });
      const btn = el('button', { class: 'btn', text: '导入 JSON', onclick: () => input.click() });
      const wrap = el('span', {});
      wrap.append(btn, input);
      return wrap;
    })(),
  ]));
  container.append(backup);

  // ---- 危险区 ----
  const danger = el('div', { class: 'card' });
  danger.append(el('h3', { text: '危险区' }));
  danger.append(el('button', {
    class: 'btn btn-danger', text: '清空本设备进度',
    onclick: () => {
      if (!confirm('确定清空本设备的全部进度吗？（gist 里的远端数据不会被删除，下次同步会拉回来）')) return;
      resetState();
      toast('已清空');
      ctx.rerender();
    },
  }));
  container.append(danger);

  container.append(el('p', { class: 'muted small-text center', text: 'interview-prep-2026 · 纯静态 · 数据只存在你的浏览器和你的私密 gist' }));
}
