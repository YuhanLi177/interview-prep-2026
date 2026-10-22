// 每日轮换计划：根据 daily_rotation.json 的规则，把日期映射成当天任务和作业条目。
// 纯函数模块（传入 rotation 数据和日期字符串），便于测试。
import { diffDays, weekdayOf, WEEKDAY_ZH } from './util.js';

export const TOTAL_WEEKS = 10;

/** 距开始日的天数（开始日为第 0 天）；负数表示还没开始 */
export function dayIndex(rotation, dateStr) {
  return diffDays(rotation.rules.start_date, dateStr);
}

/** 当前计划周（1 起），未开始返回 0，超出封顶 TOTAL_WEEKS */
export function planWeek(rotation, dateStr) {
  const idx = dayIndex(rotation, dateStr);
  if (idx < 0) return 0;
  return Math.min(TOTAL_WEEKS, Math.floor(idx / 7) + 1);
}

/** 把本周题目切成 n 份，取第 k 份（k 从 0 起） */
export function chunkProblems(problems, parts, k) {
  if (!problems.length) return [];
  const size = Math.ceil(problems.length / parts);
  return problems.slice(k * size, (k + 1) * size);
}

/**
 * 计算某天的任务。
 * @returns {{ kind, title, desc, links:[{name,url}], items:[作业条目], week, weekday, dayIdx }}
 * 作业条目: { slug, title, kind:'code'|'written', url?, sources? }
 */
export function taskForDate(rotation, dateStr, { diagnosticDone = true } = {}) {
  const idx = dayIndex(rotation, dateStr);
  const wd = weekdayOf(dateStr); // 0=周日
  const base = { dayIdx: idx, weekday: wd, weekdayZh: WEEKDAY_ZH[wd], week: planWeek(rotation, dateStr), links: [], items: [] };

  if (idx < 0) {
    return { ...base, kind: 'before', title: '计划还没开始', desc: `计划从 ${rotation.rules.start_date}（${rotation.rules.timezone}）开始。` };
  }
  if (!diagnosticDone) {
    return {
      ...base, kind: 'diagnostic', title: '诊断测验（45 分钟）',
      desc: rotation.rules.day_zero_zh + ' —— 先做诊断，确定你的路线和薄弱 track。',
      links: [], items: [],
    };
  }
  const week = base.week;
  if (idx >= TOTAL_WEEKS * 7) {
    return { ...base, kind: 'after', title: '10 周计划已结束', desc: '继续复习到期知识点和错题本，或自由做 mock。' };
  }
  const weekData = rotation.weeks[week - 1];

  // 周五（第 1–4 周）：Stripe 替换日
  if (wd === 5 && week <= 4) {
    return {
      ...base, kind: 'stripe',
      title: `第 ${week} 周 · 周五 · Stripe 替换日`,
      desc: rotation.rules.by_weekday_zh['周五（第 1–4 周）'],
      links: rotation.rules.stripe_friday_links.map((u) => ({ name: u, url: u })),
      items: [
        { slug: 'stripe-bug', title: 'Stripe 练习仓库：用 debugger 修一个 bug', kind: 'code' },
        { slug: 'stripe-rest', title: 'JSON → REST → 解析 → UI 的小练习', kind: 'code' },
      ],
    };
  }

  if (wd === 1 || wd === 3 || wd === 5) {
    // T1 Coding 日
    const problems = weekData.T1.problems || [];
    const parts = week <= 4 ? 2 : 3;
    const slot = week <= 4 ? { 1: 0, 3: 1 }[wd] : { 1: 0, 3: 1, 5: 2 }[wd];
    const todays = chunkProblems(problems, parts, slot ?? 0);
    if (!problems.length) {
      return {
        ...base, kind: 'coding',
        title: `第 ${week} 周 · ${WEEKDAY_ZH[wd]} · Coding（${weekData.T1.pattern}）`,
        desc: '本周没有固定题目：做 2 道随机 Medium，并按计划安排 mock。',
        links: [], items: [{ slug: 'random-medium', title: '2 道随机 Medium（贴题目链接 + 你的代码）', kind: 'code' }],
      };
    }
    return {
      ...base, kind: 'coding',
      title: `第 ${week} 周 · ${WEEKDAY_ZH[wd]} · Coding：${weekData.T1.pattern}`,
      desc: `${rotation.rules.by_weekday_zh['周一/周三/周五']}${weekData.T1.gm_link_zh && weekData.T1.gm_link_zh !== '—' ? `（车机联想：${weekData.T1.gm_link_zh}）` : ''}`,
      links: todays.map((p) => ({ name: p.name, url: p.url })),
      items: [
        ...todays.map((p) => ({ slug: slugify(p.name), title: p.name, kind: 'code', url: p.url })),
        { slug: 'old-review', title: '最后 15 分钟：复习一道旧题（写下题名和收获）', kind: 'written' },
      ],
    };
  }
  if (wd === 2) {
    return {
      ...base, kind: 'reading',
      title: `第 ${week} 周 · 周二 · Android/Platform：${weekData.T2.topic_zh}`,
      desc: `${rotation.rules.by_weekday_zh['周二']}${weekData.T2.detail_zh ? ` —— ${weekData.T2.detail_zh}` : ''}`,
      links: (weekData.T2.docs || []).map((u) => ({ name: u, url: u })),
      items: [{ slug: 't2-diagram', title: `读资料并画一张图：${weekData.T2.topic_zh}（文字描述你的图）`, kind: 'written' }],
    };
  }
  if (wd === 4) {
    return {
      ...base, kind: 'notes',
      title: `第 ${week} 周 · 周四 · Android/Platform：${weekData.T2.topic_zh}`,
      desc: `${rotation.rules.by_weekday_zh['周四']}${weekData.T2.gm_link_zh ? `（车机联想：${weekData.T2.gm_link_zh}）` : ''}`,
      links: (weekData.T2.docs || []).map((u) => ({ name: u, url: u })),
      items: [{ slug: 't2-note', title: `1 页笔记（一张图 + 三条车机经验）：${weekData.T2.topic_zh}`, kind: 'written' }],
    };
  }
  if (wd === 6) {
    return {
      ...base, kind: 'backend',
      title: `第 ${week} 周 · 周六 · Backend：${weekData.T3.topic_zh}`,
      desc: rotation.rules.by_weekday_zh['周六'],
      links: (weekData.T3.docs || []).map((u) => ({ name: u, url: u })),
      items: [{ slug: 't3-cards', title: `5 张复习卡：${weekData.T3.topic_zh}（每张一问一答）`, kind: 'written' }],
    };
  }
  // 周日
  return {
    ...base, kind: 'review',
    title: `第 ${week} 周 · 周日 · 复习日`,
    desc: rotation.rules.by_weekday_zh['周日'],
    links: [],
    items: [
      { slug: 'redo', title: '重做一道这周没做顺的题', kind: 'code' },
      { slug: 'self-eval', title: '三个 track 自评 0–3（写理由）', kind: 'written' },
    ],
  };
}

export function slugify(name) {
  return name.toLowerCase().replace(/[（(].*?[)）]/g, '').trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'item';
}
