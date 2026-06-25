const { generateDailyReport, getChinaDate } = require("./report-engine");

const date = process.argv[2] || getChinaDate();
const report = generateDailyReport(date);

console.log(`Generated daily ops briefing for ${report.date}`);
