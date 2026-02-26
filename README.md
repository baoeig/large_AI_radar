# AI Signal Board

中文 | [English](#english)

> 本项目基于 [LearnPrompt/ai-news-radar](https://github.com/LearnPrompt/ai-news-radar) 二次开发，原始版本来自 https://github.com/LearnPrompt/ai-news-radar

高质量 AI/科技新闻聚合项目，支持静态网页展示、24h 增量更新、WaytoAGI 更新日志、OPML RSS 批量接入、失败源替换与告警。

## 二次开发改动

- **页面显示优化**：
  - 调整统计卡片布局为 6 列一行显示
  - 压缩新闻条目上下间距，提升信息密度
  - 标题右侧增加提前换行边界，避免与时间/分区重叠
  - 标题悬停时显示英文翻译（原版为常显）
- **新增站点说明功能**：
  - 点击按钮弹出 modal，展示 10 个主站点各自包含的子站点完整清单
  - 子站点默认折叠，点击可展开查看详情
- **新增发布时间显示**：
  - 标题结束后直接显示相对时间（如"7小时前"、"2天前"）

## 下一步开发计划

- 增加更多 RSS 订阅源
- 增强去重设置选项（如按来源去重、按标题去重、相似度阈值等）

## 中文

### 1. 这个项目每天更新需要一直开 Codex 吗？

不需要。  
你只要执行一个命令，或者直接用 GitHub Actions 定时运行即可。

- 本地命令（一次）：
  - `python scripts/update_news.py --output-dir data --window-hours 24 --rss-opml feeds/follow.opml`
- 自动化（推荐）：
  - `.github/workflows/update-news.yml` 已配置定时任务，默认每 30 分钟自动更新并提交数据。

### 2. 主要能力

- 10 个网页源聚合（TechURLs / Buzzing / Info Flow / BestBlogs / TopHub / Zeli / AI HubToday / AIbase / AI今日热榜 / NewsNow）
- OPML RSS 批量接入（私有文件 `feeds/follow.opml`，仓库提供模板 `feeds/follow.example.opml`）
- 24h 双视图：`AI强相关` / `全量`
- 全量模式去重开关
- AI 模式默认去重
- 站点与分区聚合展示
- 中英双语标题显示
- WaytoAGI：`当天` / `近7日` 切换
- RSS 失败源自动处理：
  - 能替换官方源则自动替换
  - 无官方 RSS 的源自动跳过，避免浪费抓取时间
- 告警数据输出：
  - `failed_feeds` / `zero_item_feeds` / `skipped_feeds` / `replaced_feeds`

### 3. 数据输出

- `data/latest-24h.json`
- `data/archive.json`
- `data/source-status.json`
- `data/waytoagi-7d.json`
- `data/title-zh-cache.json`

### 4. 快速开始

```bash
cd /Users/carl/Downloads/10_项目代码/01_内容自动化与发布/ai-news-radar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp feeds/follow.example.opml feeds/follow.opml
# 把你自己的 OPML 内容替换到 feeds/follow.opml（不要提交到仓库）
python scripts/update_news.py --output-dir data --window-hours 24 --rss-opml feeds/follow.opml
python -m http.server 8080
```

打开：`http://localhost:8080`

### 5. Secrets / API 配置说明（重要）

默认情况下，本项目 **不需要任何 API Key** 才能运行核心抓取流程。  
你目前没有提供 API 密钥，仓库中也不会写入任何密钥信息。

推荐仅在运行环境中配置（不要提交到仓库）：

- 代理（可选）：
  - `HTTP_PROXY`
  - `HTTPS_PROXY`
- 如果你未来接入私有 API/私有 RSS：
  - 把密钥放到 GitHub Secrets（Actions）或本地环境变量
  - 不要写入代码、README、日志、`.env` 示例中的真实值
- 私有 RSS OPML（推荐）：
  - GitHub Actions Secret：`FOLLOW_OPML_B64`
  - 生成方式（macOS/Linux）：
    - `base64 < feeds/follow.opml | pbcopy`（macOS）
    - 然后把内容粘贴到 GitHub 仓库的 Secrets

### 6. GitHub 自动更新

工作流：`.github/workflows/update-news.yml`

- 定时：每 30 分钟
- 任务：执行抓取命令并提交 `data/*`
- RSS OPML：若设置了 `FOLLOW_OPML_B64`，工作流会自动解码为 `feeds/follow.opml`
- 推送权限：使用 `GITHUB_TOKEN`（workflow 内）

---

## English

> This project is a fork of [LearnPrompt/ai-news-radar](https://github.com/LearnPrompt/ai-news-radar). Original repo: https://github.com/LearnPrompt/ai-news-radar

Production-grade AI/tech news aggregator with a static web UI, 24h updates, WaytoAGI timeline, and OPML RSS ingestion.

### Fork Changes

- **UI refinements**:
  - Stats cards displayed in 6-column single row
  - Reduced vertical spacing between news items for higher information density
  - Title wraps earlier to avoid overlapping with time/source tags
  - English translation shown on hover only (original always visible)
- **New site overview feature**:
  - Button opens modal showing complete subsite list for each of the 10 main sources
  - Subsites collapsed by default, expandable on click
- **New relative timestamp**:
  - Displays relative time after title (e.g., "7 hours ago", "2 days ago")

### Next Steps

- Add more RSS feed sources
- Enhance deduplication settings (by source, by title, similarity threshold, etc.)

This repo is safe for public release and does **not** include the maintainer's private RSS subscription file.

### 1. Do I need Codex running all day?

No.  
You only need to run one command, or let GitHub Actions run it on schedule.

- One-shot local command:
  - `python scripts/update_news.py --output-dir data --window-hours 24 --rss-opml feeds/follow.opml`
- Scheduled automation:
  - `.github/workflows/update-news.yml` runs every 30 minutes and commits updated data.

### 2. Core features

- Multi-source web aggregation
- OPML RSS ingestion (private `feeds/follow.opml`; template provided as `feeds/follow.example.opml`)
- 24h two-mode UI (`AI-focused` / `All`)
- Dedup toggle in All mode, dedup-by-default in AI mode
- Site + section grouping
- Bilingual title rendering
- WaytoAGI toggle (`Today` / `Last 7 Days`)
- RSS resilience:
  - Auto-replace failed feeds with official sources when available
  - Auto-skip unsupported source types (to save crawl time)
- Alert-friendly status output (`failed_feeds`, `zero_item_feeds`, `skipped_feeds`, `replaced_feeds`)

### 3. Output files

- `data/latest-24h.json`
- `data/archive.json`
- `data/source-status.json`
- `data/waytoagi-7d.json`
- `data/title-zh-cache.json`

### 4. Quick start

```bash
cd /Users/carl/Downloads/10_项目代码/01_内容自动化与发布/ai-news-radar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp feeds/follow.example.opml feeds/follow.opml
# Replace with your own OPML subscriptions (do not commit this file)
python scripts/update_news.py --output-dir data --window-hours 24 --rss-opml feeds/follow.opml
python -m http.server 8080
```

Open: `http://localhost:8080`

### 5. Secrets / API notes

By default, this project needs **no API keys** for the core pipeline.  
No secrets are stored in this repo.

If you later add private APIs/feeds:

- Use environment variables or GitHub Secrets
- Never commit real tokens/keys
- For private RSS OPML in GitHub Actions, store `base64` content in secret `FOLLOW_OPML_B64`
