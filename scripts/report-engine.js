const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "reports.json");
const DEFAULT_TAGS = ["AI", "券商", "运营策略", "竞品观察"];

const SOURCE_LIBRARY = [
  {
    id: "1",
    type: "AI热点",
    company: "OpenAI",
    name: "ChatGPT agent",
    action: "将 Operator 的网页交互能力、deep research 的信息综合能力与 ChatGPT 对话能力整合为统一智能体",
    takeaway: "运营中后台可借鉴“从洞察到任务”的自动拆解方式，把日报建议直接变成可跟进工单。",
    title: "Introducing ChatGPT agent: bridging research and action",
    url: "https://openai.com/index/introducing-chatgpt-agent/"
  },
  {
    id: "2",
    type: "竞品动作",
    company: "东方财富",
    name: "东方财富APP / 妙想大模型",
    action: "在官网入口中聚合行情、资讯、交易客户端、条件选股，并展示东方财富APP接入妙想大模型",
    takeaway: "可参考其高频内容入口思路，将热点、用户行为和产品转化目标串成一条运营链路。",
    title: "东方财富网：财经门户及产品入口",
    url: "https://www.eastmoney.com/"
  },
  {
    id: "3",
    type: "竞品动作",
    company: "同花顺",
    name: "同花顺财经",
    action: "以行情、财经资讯和投资决策工具作为核心入口，强调“让投资变得更简单”",
    takeaway: "适合借鉴“题材卡片 + 客群标签 + 内容触达”的组合方式，沉淀为运营策略模板。",
    title: "同花顺财经：让投资变得更简单",
    url: "https://www.10jqka.com.cn/"
  },
  {
    id: "4",
    type: "竞品动作",
    company: "富途证券",
    name: "富途牛牛",
    action: "围绕港美股交易、开户与行情服务构建一站式线上投资体验",
    takeaway: "可将热点内容和客户生命周期运营结合，用社区式内容激活低活跃客户。",
    title: "富途证券官网：FUTU 极速开户与港美股交易服务",
    url: "https://www.futuhk.com/"
  },
  {
    id: "5",
    type: "AI热点",
    company: "OpenAI",
    name: "Operator",
    action: "推出可使用浏览器执行任务的智能体，并强调用户确认、接管模式、敏感任务限制等安全机制",
    takeaway: "策略建议应明确风险提示和合规审核节点，避免把热点解读包装为确定性投资建议。",
    title: "Introducing Operator",
    url: "https://openai.com/index/introducing-operator/"
  }
];

function getChinaDate(input = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(input);
}

function nowIso() {
  return new Date().toISOString();
}

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]\n", "utf8");
  }
}

function readReports() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
  if (!raw) return [];
  const reports = JSON.parse(raw);
  return Array.isArray(reports) ? reports : [];
}

function writeReports(reports) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(reports, null, 2)}\n`, "utf8");
}

function buildReferencesSection(sources) {
  return sources.map((source) => {
    return `- 【${source.id}】${source.type}｜${source.company}《[${source.title}](${source.url})》：${source.action}。启发：${source.takeaway}`;
  });
}

function buildReportContent(date, sources = SOURCE_LIBRARY) {
  return [
    "# 每日经营简报",
    "",
    `日期：${date}`,
    "",
    "## 一、AI与科技热点",
    "",
    "- 参考 OpenAI 的 ChatGPT agent 将网页交互、深度研究和对话能力整合为统一智能体的动作【1】，运营中后台可重点关注“自动生成策略、自动拆解任务、自动归因复盘”三类能力。",
    "- 结合 OpenAI Operator 对用户确认、接管模式和敏感任务限制的安全设计【5】，资本市场信息服务应从资讯聚合转向“有边界的决策辅助”，在投顾、活动运营、客户分层和内容分发链路中保留审核节点。",
    "- 对AI涨乐2.0的影响：把热点追踪转化为可执行运营动作，而不是停留在资讯摘要，并要求每条策略能回溯到来源依据。",
    "",
    "## 二、竞品与行业动态",
    "",
    "- 参考 东方财富官网对行情、资讯、交易客户端、条件选股和妙想大模型入口的聚合方式【2】，券商APP竞争重点正在从单点功能转向完整经营闭环：识别客群、生成触达方案、跟踪转化、复盘效果。",
    "- 参考 同花顺财经以行情资讯和投资决策工具降低用户理解成本的定位【3】，智能营销可优先沉淀为运营组件，包括人群包、内容模板、触达规则、实验记录和效果看板。",
    "- 参考 富途证券围绕港美股交易、开户与行情服务构建的一站式体验【4】，可将“市场热点 + 用户行为 + 业务目标”组合为每日策略候选池，供运营人员快速选择。",
    "",
    "## 三、经营与策略建议",
    "",
    "### 策略1：热点驱动的高意向客户触达",
    "",
    "- 来源依据：参考 OpenAI ChatGPT agent 的任务整合能力【1】与 东方财富的行情资讯联动方式【2】。",
    "- 建议动作：基于当日AI、科技、市场热点生成3套内容话术，并推送给近期浏览相关板块或产品页的用户。",
    "- 目标客群/场景：关注科技主题、ETF、两融、投顾内容的活跃客户。",
    "- 预期影响：提升内容点击、产品页访问和后续咨询转化。",
    "- 风险提示：参考 OpenAI Operator 对敏感任务的控制机制【5】，避免将热点直接包装为投资建议，需保留合规审核入口。",
    "",
    "### 策略2：运营中后台策略工单化",
    "",
    "- 来源依据：参考 OpenAI ChatGPT agent 的长任务处理能力【1】与 同花顺财经的投资决策工具入口【3】。",
    "- 建议动作：把每日简报中的策略建议自动转为运营工单，包含负责人、目标人群、触达渠道和复盘指标。",
    "- 目标客群/场景：总部运营、分支机构运营、内容运营团队。",
    "- 预期影响：减少从洞察到执行的手工整理成本，提高运营效率。",
    "- 风险提示：策略发布前应确认人群规则、话术边界和触达频次。",
    "",
    "### 策略3：低活跃客户的情景化召回",
    "",
    "- 来源依据：参考 富途证券的一站式交易服务入口【4】与 东方财富的高频内容入口【2】。",
    "- 建议动作：针对7至30天未活跃但历史关注科技、市场资讯或理财内容的客户，生成轻量召回任务。",
    "- 目标客群/场景：沉默客户、近期市场关注度下降客户。",
    "- 预期影响：提升回访效率与APP日活，形成可复盘的召回实验。",
    "- 风险提示：控制触达频率，避免对低意愿客户形成打扰。",
    "",
    "## 四、今日跟进项",
    "",
    "- 运营侧选择最多1条策略进入执行，避免日报变成待办堆积。",
    "- 后台记录策略采用情况、触达范围、关键指标和复盘结论。",
    "- 次日简报优先回看已执行策略的结果变化。",
    "",
    "## 五、参考文献",
    "",
    ...buildReferencesSection(sources)
  ].join("\n");
}

function createReport(date = getChinaDate()) {
  const sources = SOURCE_LIBRARY;
  const content = buildReportContent(date, sources);
  return {
    date,
    content,
    tags: DEFAULT_TAGS,
    sources,
    created_at: nowIso(),
    notification: {
      title: "今日经营简报已生成，可查看",
      unread: true,
      created_at: nowIso()
    }
  };
}

function saveReport(report) {
  const reports = readReports();
  const index = reports.findIndex((item) => item.date === report.date);
  if (index >= 0) {
    reports[index] = { ...reports[index], ...report, updated_at: nowIso() };
  } else {
    reports.push(report);
  }
  reports.sort((a, b) => b.date.localeCompare(a.date));
  writeReports(reports);
  return report;
}

function generateDailyReport(date = getChinaDate()) {
  const report = createReport(date);
  return saveReport(report);
}

function getReportByDate(date) {
  return readReports().find((report) => report.date === date) || null;
}

function searchReports({ query = "", tag = "", period = "all" } = {}) {
  const q = query.trim().toLowerCase();
  const tagValue = tag.trim().toLowerCase();
  const today = new Date(`${getChinaDate()}T00:00:00+08:00`);
  const maxAgeDays = period === "week" ? 7 : period === "month" ? 31 : null;

  return readReports().filter((report) => {
    const sourceText = (report.sources || [])
      .map((source) => `${source.id} ${source.type} ${source.company} ${source.name} ${source.title} ${source.url} ${source.action} ${source.takeaway}`)
      .join(" ");
    const inText = !q || `${report.date}\n${report.content}\n${report.tags.join(" ")}\n${sourceText}`.toLowerCase().includes(q);
    const inTag = !tagValue || report.tags.some((item) => item.toLowerCase().includes(tagValue));
    const inPeriod = !maxAgeDays || (today - new Date(`${report.date}T00:00:00+08:00`)) / 86400000 < maxAgeDays;
    return inText && inTag && inPeriod;
  });
}

module.exports = {
  createReport,
  generateDailyReport,
  getChinaDate,
  getReportByDate,
  readReports,
  saveReport,
  searchReports
};
