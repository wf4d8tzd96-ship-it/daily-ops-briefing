# 部署说明

## 推荐路径

这个项目有两种上线方式：

1. GitHub Pages 静态展示版
   - 适合快速公开访问、演示日报、查看历史归档。
   - 不支持在线生成、服务器语音音频、在线写入 JSON。
   - 支持搜索、切换历史、复制、导出、引用跳转、原文链接。
   - 支持播放 GitHub Actions 预生成的系统 TTS 音频。

2. Node 服务部署版
   - 适合正式使用。
   - 可以保留 `/api/generate`、本地/云端存储、定时生成、服务端语音接口。
   - 代码放 GitHub，服务部署到 Render、Railway、Fly.io、Vercel Node Server 或自有服务器。

## GitHub Pages 静态展示版

本项目已经包含 GitHub Actions 配置：

```text
.github/workflows/pages.yml
```

推送到 GitHub 的 `main` 分支后，Actions 会：

1. 生成当日日报
2. 导出静态文件到 `dist`
3. 安装开源 `edge-tts` 客户端并生成更自然的中文 MP3 音频，失败时降级到 `espeak-ng`
4. 部署到 GitHub Pages

### 手动本地导出

```bash
npm run export:static
```

输出目录：

```text
dist/
```

### GitHub 上需要做的设置

1. 新建 GitHub 仓库，比如 `daily-ops-briefing`
2. 把本项目推送到仓库的 `main` 分支
3. 打开仓库 `Settings -> Pages`
4. Source 选择 `GitHub Actions`
5. 等待 Actions 执行完成
6. 访问：

```text
https://<你的用户名>.github.io/daily-ops-briefing/
```

## 推送到 GitHub

如果这是一个新仓库：

```bash
git init
git add .
git commit -m "Initial daily ops briefing app"
git branch -M main
git remote add origin https://github.com/<你的用户名>/daily-ops-briefing.git
git push -u origin main
```

## Node 服务部署版

如果你希望线上仍能每天自动生成并写入历史，需要部署 Node 服务。

启动命令：

```bash
npm start
```

环境变量：

```text
PORT=3000
HOST=0.0.0.0
DAILY_REPORT_TIME=08:00
```

注意：

- `data/reports.json` 在多数云平台的临时磁盘上可能会丢失，正式版建议换 SQLite/PostgreSQL。
- GitHub Pages 不运行 Node 服务，也不支持服务端写文件。
- GitHub Pages 静态版音频由 GitHub Actions 中的开源 `edge-tts` 客户端预生成，失败时降级到 `espeak-ng`。
- 服务端语音当前依赖 macOS `say` 命令，云服务器上建议换成浏览器语音、`espeak-ng` 或第三方 TTS。
