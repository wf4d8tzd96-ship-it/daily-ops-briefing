const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const reportsFile = path.join(root, "dist", "reports.json");
const audioDir = path.join(root, "dist", "audio");

function hasCommand(name) {
  try {
    execFileSync("which", [name], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function stripReportForSpeech(content) {
  return content
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1")
    .replace(/^#+\s/gm, "")
    .replace(/^-\s/gm, "")
    .replace(/【(\d+)】/g, "，参考文献$1，")
    .replace(/[>#*_`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 5000);
}

function generateAudio(report) {
  const safeDate = report.date.replace(/[^0-9-]/g, "");
  const textFile = path.join(os.tmpdir(), `ops-briefing-${safeDate}.txt`);
  const outputFile = path.join(audioDir, `${safeDate}.wav`);

  fs.writeFileSync(textFile, stripReportForSpeech(report.content), "utf8");
  execFileSync("espeak-ng", ["-v", "zh", "-s", "155", "-w", outputFile, "-f", textFile], {
    stdio: "inherit"
  });
  fs.rmSync(textFile, { force: true });
  console.log(`Generated ${outputFile}`);
}

if (!fs.existsSync(reportsFile)) {
  throw new Error("dist/reports.json not found. Run npm run export:static first.");
}

if (!hasCommand("espeak-ng")) {
  console.warn("espeak-ng is not available; skipping static audio generation.");
  process.exit(0);
}

const reports = JSON.parse(fs.readFileSync(reportsFile, "utf8"));
fs.mkdirSync(audioDir, { recursive: true });
reports.forEach(generateAudio);
