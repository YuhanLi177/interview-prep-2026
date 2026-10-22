# 面试备考 · Android Interview Prep（10 周）

一个纯静态、移动端友好的备考 Web App，部署在 GitHub Pages 上：

**线上地址：<https://yuhanli177.github.io/interview-prep-2026/>**

无后端、无第三方依赖（vanilla JS + ES Modules）。所有进度存在你的浏览器 localStorage，并同步到你自己的一个**私密 GitHub gist**，所以 Mac 和 iPhone 可以无缝接力。

## 功能

| 页面 | 说明 |
| --- | --- |
| 📅 今日任务 | 按 10 周轮换计划（起始 2026-10-22，多伦多时区）给出当天任务和链接；可前后翻日、标记完成。诊断没做之前，当天任务固定是诊断测验 |
| 🩺 诊断测验 | 15 道笔答题 → 对照参考答案自评 0/0.5/1 → 得出推荐路线和薄弱 track |
| 🎯 练习 | 多邻国式掌握循环：答错立刻换同一知识点的另一道题（避开最近出过的 ~4 题），连对 3 次（可调 2–5）算掌握，之后进入 1/3/7 天的 Leitner 间隔复习（复习答错打回循环）。到期复习优先，新知识点按计划周解锁。答题前可以先写思路（会保存），答完必看讲解 + 来源链接。附错题本（可重做消灭） |
| 📝 作业 | 每天的 LeetCode 题 / 阅读笔记条目 + 3 个 HTTP/API 动手实战任务；等宽代码编辑框（支持 Tab 缩进）。「提交批改」会把格式化好的批改请求（题目 + 你的解答 + 参考链接）复制到剪贴板，粘给你的真人/AI 导师即可；之后把分数和评语贴回来，≤6 分自动进错题本 |
| 🗺️ 路线图 | 10 周 × 3 track 总览，当前周高亮，按周显示完成天数和知识点掌握进度 |
| ⏱️ 模拟面试 | Stripe / Capital One / Life360 的面试项目，带倒计时、题面、评分 rubric 和作答框 |
| ⚙️ 设置 | 同步 token、掌握阈值、JSON 导出/导入备份、清空数据 |

内容带可信度标签：<b>官方来源</b>（官方文档/一手资料）和 <b>面经传闻</b>（Reddit/Blind/PracHub 等面试报告；技术事实仍引自官方文档，只有“面试会考这个”是传闻）。数据格式可扩展——给任何知识点/题目/作业条目加 `"confidence": "community"` 即可。

## 跨设备同步设置（Mac 和 iPhone 各做一次）

进度文档会保存到一个名为 `interview-prep-progress.json` 的 **secret gist**（只有你能看到）。App 自动「找到或创建」这个 gist；打开/切回页面时拉取，改动后几秒内推送；两台设备按每个条目的修改时间合并（练习记录取并集），不会互相覆盖。

1. 打开 <https://github.com/settings/tokens>，创建一个 token：
   - **Fine-grained token**：Account permissions → **Gists → Read and write**，其他都不要；或
   - **Classic token**：只勾选 **`gist`** 这一个 scope。
   - 有效期按需设（过期后重新生成粘贴即可）。
2. 打开本站 → **设置** → 粘贴 token → 「保存 token 并同步」。
3. 在另一台设备上重复第 2 步（同一个 token 或再生成一个都行）。

> token **只保存在该设备浏览器的 localStorage**，不会出现在仓库、gist 或任何请求日志里。担心丢失的话，设置页还有 JSON 导出/导入作为兜底。

## 添加到 iPhone 主屏幕（PWA）

1. 在 iPhone 的 **Safari** 里打开 <https://yuhanli177.github.io/interview-prep-2026/>；
2. 点底部**分享**按钮（方框加箭头）→ **添加到主屏幕**；
3. 确认名称「面试备考」→ 添加。之后从主屏幕图标打开就是全屏独立窗口。
4. 第一次打开记得去设置页粘贴 token 开启同步。

## 开发

```bash
# 本地预览（任何静态服务器都行）
python3 -m http.server 8000
# 单元测试（掌握循环 / 合并逻辑 / 每日轮换）
node --test
```

- `data/` —— 全部内容数据（题库、知识点、诊断、轮换计划、路线图、模拟面试、动手任务）。`questions.json` 里 `answer` 恒为 `0`（即 `options[0]` 是正确答案），**App 每次显示都会洗牌**。
- `tools/build.py` —— 生成原始核心数据的脚本（存档用，依赖当时的 `/tmp/plan.json`）；`tools/add_community_content.py` —— 追加「面经传闻」内容（幂等，可重复跑）；`tools/make_icons.py` —— 生成 PWA 图标。
- `js/engine.js`、`js/merge.js`、`js/plan.js` 是无 DOM 依赖的纯逻辑模块，被 `tests/` 里的 31 个用例覆盖。
- 部署：push 到 `main` → GitHub Actions 跑测试 → 发布到 GitHub Pages（见 `.github/workflows/pages.yml`）。

## 隐私

仓库是公开的，但其中**只有内容数据，没有任何个人状态**：你的答案、进度、token 都只存在你的浏览器和你的私密 gist 里。
