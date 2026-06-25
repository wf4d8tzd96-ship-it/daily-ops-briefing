# 每日经营简报系统 MVP

这是一个“每日自动生成 + 本地归档 + Web 回溯浏览”的轻量版本，适合先验证 AI 运营决策日报的产品形态。

## 已实现

- 每日经营简报结构化生成
- 本地 JSON 存储，按 `YYYY-MM-DD` 归档
- Web 页面浏览今日日报和历史日报
- 关键词搜索与近 7 天 / 近 31 天筛选
- 复制全文、导出 Markdown、导出 JSON
- 蓝色玻璃风格页面
- 正文来源标记与参考文献区
- 语音播报，优先使用浏览器语音能力，不支持时使用本机语音生成音频
- 站内提醒：“今日经营简报已生成，可查看”
- 服务运行时按 `08:00` 检查并自动生成日报

## 启动

```bash
npm start
```

打开：

```text
http://127.0.0.1:3000
```

## 手动生成日报

生成今天：

```bash
npm run generate
```

生成指定日期：

```bash
node scripts/generate-report.js 2026-06-24
```

## 定时配置

默认每天 `08:00` 按 Asia/Shanghai 时间检查生成。

可通过环境变量调整：

```bash
DAILY_REPORT_TIME=08:30 npm start
```

## 数据位置

日报存储在：

```text
data/reports.json
```

单条结构：

```json
{
  "date": "2026-06-24",
  "content": "日报全文",
  "tags": ["AI", "券商", "运营策略"],
  "sources": [
    {
      "id": "S1",
      "type": "AI热点",
      "name": "AI模型与智能体产品更新观察",
      "action": "参考动作或热点",
      "takeaway": "对券商APP与运营中后台的启发"
    }
  ],
  "created_at": "timestamp"
}
```

## 后续升级建议

- 将 `scripts/report-engine.js` 中的模板生成替换为真实信息源 + 大模型生成
- 将 `sources` 接入真实竞品观察、新闻链接、研报链接或内部调研记录
- 将 `data/reports.json` 替换为 SQLite 或 PostgreSQL
- 增加策略执行状态、负责人、命中率和效果回流分析
- 接入企业微信、邮件或内部消息中心作为提醒通道

## 部署

见 [DEPLOYMENT.md](DEPLOYMENT.md)。
