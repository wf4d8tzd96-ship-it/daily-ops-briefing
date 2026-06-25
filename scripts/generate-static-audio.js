const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const reportsFile = path.join(root, "dist", "reports.json");
const audioDir = path.join(root, "dist", "audio");
const edgeScript = path.join(__dirname, "tts-edge.py");
const edgeVoice = process.env.EDGE_TTS_VOICE || "zh-CN-XiaoxiaoNeural";

function hasCommand(name) {
  try {
    execFileSync("which", [name], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function stripReportForSpeech(content) {
  const beforeReferences = content.split(/\n##\s+五、参考文献/)[0];
  return beforeReferences
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1")
    .replace(/^#+\s/gm, "")
    .replace(/^-\s/gm, "")
    .replace(/【(\d+)】/g, "")
    .replace(/[>#*_`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 5000);
}

function generateAudio(report) {
  const safeDate = report.date.replace(/[^0-9-]/g, "");
  const textFile = path.join(os.tmpdir(), `ops-briefing-${safeDate}.txt`);
  const mp3File = path.join(audioDir, `${safeDate}.mp3`);
  const wavFile = path.join(audioDir, `${safeDate}.wav`);

  fs.writeFileSync(textFile, stripReportForSpeech(report.content), "utf8");
  if (hasCommand("python3")) {
    try {
      execFileSync("python3", [edgeScript, textFile, mp3File, edgeVoice], { stdio: "inherit" });
      fs.rmSync(textFile, { force: true });
      console.log(`Generated ${mp3File}`);
      return;
    } catch (error) {
      console.warn("edge-tts generation failed; falling back to espeak-ng.");
    }
  }

  if (!hasCommand("espeak-ng")) {
    console.warn("No TTS generator is available; skipping static audio generation.");
    fs.rmSync(textFile, { force: true });
    return;
  }

  execFileSync("espeak-ng", ["-v", "zh", "-s", "150", "-w", wavFile, "-f", textFile], { stdio: "inherit" });
  fs.rmSync(textFile, { force: true });
  console.log(`Generated ${wavFile}`);
}

if (!fs.existsSync(reportsFile)) {
  throw new Error("dist/reports.json not found. Run npm run export:static first.");
}

const reports = JSON.parse(fs.readFileSync(reportsFile, "utf8"));
fs.mkdirSync(audioDir, { recursive: true });
reports.forEach(generateAudio);
