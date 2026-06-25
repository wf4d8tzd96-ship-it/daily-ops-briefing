const state = {
  reports: [],
  selectedDate: "",
  today: ""
};

const dateList = document.querySelector("#dateList");
const reportTitle = document.querySelector("#reportTitle");
const reportTags = document.querySelector("#reportTags");
const reportContent = document.querySelector("#reportContent");
const filters = document.querySelector("#filters");
const queryInput = document.querySelector("#queryInput");
const periodSelect = document.querySelector("#periodSelect");
const generateButton = document.querySelector("#generateButton");
const speakButton = document.querySelector("#speakButton");
const copyButton = document.querySelector("#copyButton");
const exportMarkdown = document.querySelector("#exportMarkdown");
const exportJson = document.querySelector("#exportJson");
const sourceStrip = document.querySelector("#sourceStrip");
const notice = document.querySelector("#notice");
const noticeReadButton = document.querySelector("#noticeReadButton");
const toast = document.querySelector("#toast");
const speechAudio = document.querySelector("#speechAudio");
const isStaticMode = window.APP_MODE === "static";
const downloadUrls = [];

function getTodayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function inlineMarkdownToHtml(value, options = {}) {
  const { citations = true } = options;
  let html = escapeHtml(value);

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label, url) => {
    return `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  if (citations) {
    html = html.replace(/【(\d+)】/g, (_match, id) => {
      return `<sup class="citation"><a href="#ref-${id}" aria-label="跳转到参考文献 ${id}">[${id}]</a></sup>`;
    });
  }

  return html;
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inList = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  for (const line of lines) {
    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inlineMarkdownToHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdownToHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inlineMarkdownToHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      const item = line.slice(2);
      const referenceMatch = item.match(/^【(\d+)】/);
      const idAttribute = referenceMatch ? ` id="ref-${referenceMatch[1]}" class="reference-item"` : "";
      if (referenceMatch) {
        const rest = item.replace(/^【\d+】/, "");
        html.push(`<li${idAttribute}><span class="reference-index">[${referenceMatch[1]}]</span>${inlineMarkdownToHtml(rest, { citations: false })}</li>`);
      } else {
        html.push(`<li${idAttribute}>${inlineMarkdownToHtml(item)}</li>`);
      }
    } else {
      closeList();
      html.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
    }
  }

  closeList();
  return html.join("");
}

function getSelectedReport() {
  return state.reports.find((item) => item.date === state.selectedDate);
}

function reportToMarkdown(report) {
  return [
    "---",
    `date: ${report.date}`,
    `tags: ${report.tags.join(", ")}`,
    `created_at: ${report.created_at}`,
    "---",
    "",
    report.content
  ].join("\n");
}

function setDownloadLink(anchor, content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  downloadUrls.push(url);
  anchor.href = url;
  anchor.download = filename;
}

function configureExportLinks(report) {
  if (isStaticMode) {
    setDownloadLink(exportMarkdown, reportToMarkdown(report), `ops-briefing-${report.date}.md`, "text/markdown;charset=utf-8");
    setDownloadLink(exportJson, JSON.stringify(report, null, 2), `ops-briefing-${report.date}.json`, "application/json;charset=utf-8");
    return;
  }

  exportMarkdown.href = `/api/export/${encodeURIComponent(report.date)}?format=md`;
  exportJson.href = `/api/export/${encodeURIComponent(report.date)}?format=json`;
}

function renderSources(report) {
  const sources = report?.sources || [];
  if (!sources.length) {
    sourceStrip.innerHTML = "";
    sourceStrip.hidden = true;
    return;
  }

  sourceStrip.hidden = false;
  sourceStrip.innerHTML = `
    <div>
      <p class="eyebrow">参考依据</p>
      <h3>本简报引用了 ${sources.length} 条热点与竞品观察</h3>
    </div>
    <div class="source-pills">
      ${sources
        .map((source) => {
          return `<a class="source-pill" href="#ref-${escapeAttribute(source.id)}">[${escapeHtml(source.id)}] ${escapeHtml(source.company || source.name)} · ${escapeHtml(source.name)}</a>`;
        })
        .join("")}
    </div>
  `;
}

function renderDateList() {
  dateList.innerHTML = "";

  if (!state.reports.length) {
    dateList.innerHTML = '<div class="empty">暂无日报，点击“生成今日”创建第一份。</div>';
    return;
  }

  state.reports.forEach((report) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `date-item${report.date === state.selectedDate ? " active" : ""}`;
    button.innerHTML = `
      <strong>${report.date}</strong>
      <span>${report.tags.join(" / ")}</span>
    `;
    button.addEventListener("click", () => selectReport(report.date));
    dateList.appendChild(button);
  });
}

function renderReport(report) {
  if (!report) {
    reportTitle.textContent = "暂无日报";
    reportTags.innerHTML = "";
    reportContent.innerHTML = '<div class="empty">没有找到匹配的经营简报。</div>';
    copyButton.disabled = true;
    speakButton.disabled = true;
    exportMarkdown.removeAttribute("href");
    exportJson.removeAttribute("href");
    renderSources(null);
    return;
  }

  reportTitle.textContent = `${report.date} 经营简报`;
  reportTags.innerHTML = report.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  reportContent.innerHTML = markdownToHtml(report.content);
  copyButton.disabled = false;
  speakButton.disabled = false;
  configureExportLinks(report);
  renderSources(report);

  notice.hidden = !(report.date === state.today && report.notification && report.notification.unread);
}

function selectReport(date) {
  state.selectedDate = date;
  renderDateList();
  renderReport(state.reports.find((report) => report.date === date));
}

async function loadReports() {
  if (isStaticMode) {
    const response = await fetch("./reports.json");
    const reports = await response.json();
    const q = queryInput.value.trim().toLowerCase();
    const period = periodSelect.value;
    const today = getTodayString();
    const todayDate = new Date(`${today}T00:00:00+08:00`);
    const maxAgeDays = period === "week" ? 7 : period === "month" ? 31 : null;
    state.reports = reports.filter((report) => {
      const sourceText = (report.sources || [])
        .map((source) => `${source.id} ${source.type} ${source.company} ${source.name} ${source.title} ${source.url} ${source.action} ${source.takeaway}`)
        .join(" ");
      const inText = !q || `${report.date}\n${report.content}\n${report.tags.join(" ")}\n${sourceText}`.toLowerCase().includes(q);
      const inPeriod = !maxAgeDays || (todayDate - new Date(`${report.date}T00:00:00+08:00`)) / 86400000 < maxAgeDays;
      return inText && inPeriod;
    });
    state.today = today;

    const todayReport = state.reports.find((report) => report.date === state.today);
    const fallback = state.reports[0];
    const stillVisible = state.reports.find((report) => report.date === state.selectedDate);
    state.selectedDate = stillVisible?.date || todayReport?.date || fallback?.date || "";

    renderDateList();
    renderReport(state.reports.find((report) => report.date === state.selectedDate));
    return;
  }

  const params = new URLSearchParams();
  if (queryInput.value.trim()) params.set("q", queryInput.value.trim());
  params.set("period", periodSelect.value);

  const response = await fetch(`/api/reports?${params.toString()}`);
  const data = await response.json();
  state.reports = data.reports;
  state.today = data.today;

  const todayReport = state.reports.find((report) => report.date === state.today);
  const fallback = state.reports[0];
  const stillVisible = state.reports.find((report) => report.date === state.selectedDate);
  state.selectedDate = stillVisible?.date || todayReport?.date || fallback?.date || "";

  renderDateList();
  renderReport(state.reports.find((report) => report.date === state.selectedDate));
}

filters.addEventListener("submit", (event) => {
  event.preventDefault();
  loadReports().catch(() => showToast("筛选失败，请稍后重试"));
});

generateButton.addEventListener("click", async () => {
  if (isStaticMode) {
    showToast("GitHub Pages 静态版不支持在线生成，请在本地生成后重新发布");
    return;
  }

  generateButton.disabled = true;
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await response.json();
    state.selectedDate = data.report.date;
    await loadReports();
    showToast(data.message);
  } catch (error) {
    showToast("生成失败，请稍后重试");
  } finally {
    generateButton.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  const report = getSelectedReport();
  if (!report) return;
  await navigator.clipboard.writeText(report.content);
  showToast("已复制日报全文");
});

speakButton.addEventListener("click", () => {
  const report = getSelectedReport();
  if (!report) return;

  if (speechAudio && !speechAudio.paused) {
    speechAudio.pause();
    speechAudio.currentTime = 0;
    speakButton.textContent = "语音播报";
    showToast("已停止播报");
    return;
  }

  if ("speechSynthesis" in window && speechSynthesis.speaking) {
    speechSynthesis.cancel();
    speakButton.textContent = "语音播报";
    showToast("已停止播报");
    return;
  }

  if (isStaticMode) {
    playStaticSpeech(report);
    return;
  }

  playServerSpeech(report);
});

async function playAudioSource(src, fallback) {
  if (!speechAudio) {
    fallback();
    return;
  }

  speakButton.textContent = "停止播报";
  speechAudio.src = src;
  speechAudio.onended = () => {
    speakButton.textContent = "语音播报";
  };
  speechAudio.onerror = () => {
    speakButton.textContent = "语音播报";
    fallback();
  };

  try {
    await speechAudio.play();
    showToast("开始语音播报");
  } catch (error) {
    speakButton.textContent = "语音播报";
    showToast("浏览器阻止了自动播放，请再点一次");
  }
}

function playBrowserSpeech(report) {
  if (!("speechSynthesis" in window)) {
    showToast("当前浏览器不支持语音播报");
    return;
  }

  const cleanText = report.content
    .split(/\n##\s+五、参考文献/)[0]
    .replace(/^#+\s/gm, "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1")
    .replace(/【(\d+)】/g, "")
    .replace(/[-*]\s/g, "")
    .slice(0, 6000);
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "zh-CN";
  utterance.rate = 0.95;
  utterance.pitch = 1.08;
  utterance.onend = () => {
    speakButton.textContent = "语音播报";
  };
  utterance.onerror = () => {
    speakButton.textContent = "语音播报";
    showToast("播报被浏览器中断");
  };
  speakButton.textContent = "停止播报";
  speechSynthesis.speak(utterance);
  showToast("开始语音播报");
}

function playStaticSpeech(report) {
  playAudioSource(`./audio/${encodeURIComponent(report.date)}.mp3`, () => {
    playAudioSource(`./audio/${encodeURIComponent(report.date)}.wav`, () => {
      showToast("未找到预生成音频，改用浏览器语音");
      playBrowserSpeech(report);
    });
  });
}

async function playServerSpeech(report) {
  if (isStaticMode) {
    playStaticSpeech(report);
    return;
  }

  if (!speechAudio) {
    showToast("当前环境无法播放语音");
    return;
  }
  playAudioSource(`/api/speech/${encodeURIComponent(report.date)}?t=${Date.now()}`, () => {
    showToast("当前系统无法生成语音音频");
  });
}

noticeReadButton.addEventListener("click", async () => {
  if (isStaticMode) {
    notice.hidden = true;
    return;
  }

  await fetch("/api/notifications/read", { method: "POST" });
  notice.hidden = true;
});

loadReports().catch(() => {
  reportTitle.textContent = "加载失败";
  reportContent.innerHTML = '<div class="empty">服务暂时不可用，请刷新页面。</div>';
});
