const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const {
  generateDailyReport,
  getChinaDate,
  getReportByDate,
  readReports,
  searchReports
} = require("./scripts/report-engine");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const DAILY_REPORT_TIME = process.env.DAILY_REPORT_TIME || "08:00";
const PUBLIC_DIR = path.join(__dirname, "public");
const AUDIO_DIR = path.join(__dirname, "data", "audio");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function sendText(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    const type = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

function toMarkdownDownload(report) {
  return [
    `---`,
    `date: ${report.date}`,
    `tags: ${report.tags.join(", ")}`,
    `created_at: ${report.created_at}`,
    `---`,
    "",
    report.content
  ].join("\n");
}

function reportToSpeechText(report) {
  return report.content
    .replace(/^#+\s/gm, "")
    .replace(/\[S(\d+)\]/g, "参考来源S$1")
    .replace(/[-*]\s/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 5000);
}

function createSpeechAudio(report) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const filePath = path.join(AUDIO_DIR, `ops-briefing-${report.date}.aiff`);
  if (fs.existsSync(filePath)) {
    return Promise.resolve(filePath);
  }

  const text = reportToSpeechText(report);
  return new Promise((resolve, reject) => {
    execFile("say", ["-v", "Tingting", "-o", filePath, text], { timeout: 120_000 }, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(filePath);
    });
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/reports") {
    const reports = searchReports({
      query: url.searchParams.get("q") || "",
      tag: url.searchParams.get("tag") || "",
      period: url.searchParams.get("period") || "all"
    });
    sendJson(res, 200, { today: getChinaDate(), reports });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/reports/")) {
    const date = decodeURIComponent(url.pathname.replace("/api/reports/", ""));
    const report = getReportByDate(date);
    if (!report) {
      sendJson(res, 404, { error: "Report not found" });
      return;
    }
    sendJson(res, 200, { report });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/export/")) {
    const date = decodeURIComponent(url.pathname.replace("/api/export/", ""));
    const report = getReportByDate(date);
    if (!report) {
      sendJson(res, 404, { error: "Report not found" });
      return;
    }
    const format = url.searchParams.get("format") || "md";
    if (format === "json") {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="ops-briefing-${date}.json"`
      });
      res.end(JSON.stringify(report, null, 2));
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="ops-briefing-${date}.md"`
    });
    res.end(toMarkdownDownload(report));
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/speech/")) {
    const date = decodeURIComponent(url.pathname.replace("/api/speech/", ""));
    const report = getReportByDate(date);
    if (!report) {
      sendJson(res, 404, { error: "Report not found" });
      return;
    }
    try {
      const audioPath = await createSpeechAudio(report);
      res.writeHead(200, {
        "Content-Type": "audio/aiff",
        "Cache-Control": "no-store"
      });
      fs.createReadStream(audioPath).pipe(res);
    } catch (error) {
      sendJson(res, 501, { error: "当前系统无法生成语音音频" });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/generate") {
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const report = generateDailyReport(payload.date || getChinaDate());
    sendJson(res, 201, { report, message: "今日经营简报已生成，可查看" });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/notifications/read") {
    const reports = readReports();
    const today = getReportByDate(getChinaDate());
    if (today && today.notification) {
      today.notification.unread = false;
      const next = reports.map((item) => (item.date === today.date ? today : item));
      fs.writeFileSync(path.join(__dirname, "data", "reports.json"), `${JSON.stringify(next, null, 2)}\n`, "utf8");
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "API route not found" });
}

function shouldGenerateNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());
  const hour = parts.find((part) => part.type === "hour").value;
  const minute = parts.find((part) => part.type === "minute").value;
  return `${hour}:${minute}` === DAILY_REPORT_TIME;
}

let lastAutoGeneratedDate = "";
function startDailyScheduler() {
  setInterval(() => {
    const today = getChinaDate();
    if (shouldGenerateNow() && lastAutoGeneratedDate !== today) {
      generateDailyReport(today);
      lastAutoGeneratedDate = today;
      console.log(`Auto generated daily ops briefing for ${today}`);
    }
  }, 60_000);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch((error) => {
      console.error(error);
      sendJson(res, 500, { error: error.message || "Internal server error" });
    });
    return;
  }
  serveStatic(req, res);
});

if (!getReportByDate(getChinaDate())) {
  generateDailyReport(getChinaDate());
}

server.listen(PORT, HOST, () => {
  console.log(`Daily ops briefing app running at http://${HOST}:${PORT}`);
  console.log(`Daily scheduler checks ${DAILY_REPORT_TIME} Asia/Shanghai`);
});

startDailyScheduler();
