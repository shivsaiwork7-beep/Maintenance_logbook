const STORAGE_KEY = "maintenance-logbook-entries";

const form = document.getElementById("entry-form");
const entriesList = document.getElementById("entries-list");
const emptyState = document.getElementById("entries-empty");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const exportButton = document.getElementById("download-csv");
const template = document.getElementById("entry-template");
const summaryTitle = document.getElementById("summary-title");
const summaryCopy = document.getElementById("summary-copy");
const summaryJob = document.getElementById("summary-job");
const summaryLocation = document.getElementById("summary-location");
const summaryFollowup = document.getElementById("summary-followup");
const statToday = document.getElementById("stat-today");
const statFollowups = document.getElementById("stat-followups");
const statHours = document.getElementById("stat-hours");

let storedEntries = loadEntries();
let entries = storedEntries.filter((entry) => entry.shiftIncharge && entry.shiftIncharge.toString().trim() !== "");

if (storedEntries.length !== entries.length) {
  saveEntries(entries);
}

setTodayDate();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const entry = {
    id: crypto.randomUUID(),
    technician: formData.get("technician").trim(),
    workDate: formData.get("workDate"),
    site: formData.get("site").trim(),
    shift: formData.get("shift"),
    shiftIncharge: formData.get("shiftIncharge").trim(),
    fromTime: formData.get("from_time"),
    toTime: formData.get("to_time"),
    breakdownTime: calculateMinutes(formData.get("from_time"), formData.get("to_time")),
    subEquipment: formData.get("subEquipment").trim(),
    equipment: formData.get("equipment").trim(),
    spareParts: formData.get("spareParts").trim(),
    status: formData.get("status"),
    workDone: formData.get("workDone").trim(),
    followUp: formData.get("followUp").trim(),
    executedBy: formData.get("executedBy").trim(),
    verifiedBy: formData.get("verifiedBy").trim(),
    createdAt: Date.now(),
  };

  entries = [entry, ...entries].slice(0, 50);
  saveEntries(entries);
  form.reset();
  setTodayDate();
  render();
  form.querySelector("input[name='technician']").focus();
});

form.addEventListener("reset", () => {
  window.requestAnimationFrame(() => setTodayDate());
});

searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
if (exportButton) exportButton.addEventListener("click", exportTodayEntriesCsv);


function exportTodayEntriesCsv() {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((entry) => entry.workDate === today);

  if (todayEntries.length === 0) {
    window.alert("No entries available for today. Save a log entry first, then try exporting again.");
    return;
  }

  exportEntriesAsWorkbook(todayEntries, `maintenance-logbook-${today}.xlsx`);
}

function exportEntriesAsWorkbook(rows, fileName) {
  if (!window.XLSX) {
    window.alert("Excel export is unavailable right now. Please try again after the spreadsheet library finishes loading.");
    return;
  }

  const columns = [
    { header: "Shift", key: "shift" },
    { header: "Shift Incharge", key: "shiftIncharge" },
    { header: "Technician name", key: "technician" },
    { header: "Work Date", key: "workDate" },
    { header: "Site / Location", key: "site" },
    { header: "Work From", key: "fromTime" },
    { header: "Work To", key: "toTime" },
    { header: "Breakdown minutes", key: "breakdownTime" },
    { header: "Sub equipment", key: "subEquipment" },
    { header: "Equipment serviced", key: "equipment" },
    { header: "Spare parts used", key: "spareParts" },
    { header: "Status", key: "status" },
    { header: "Job executed", key: "workDone" },
    { header: "Follow-up actions", key: "followUp" },
    { header: "Executed by", key: "executedBy" },
    { header: "Verified by", key: "verifiedBy" },
  ];

  const sheetRows = rows.map((entry) => ({
    shift: entry.shift || "",
    shiftIncharge: entry.shiftIncharge || "",
    technician: entry.technician || "",
    workDate: entry.workDate || "",
    site: entry.site || "",
    fromTime: entry.fromTime || "",
    toTime: entry.toTime || "",
    breakdownTime: entry.breakdownTime != null ? String(entry.breakdownTime) : "",
    subEquipment: entry.subEquipment || "",
    equipment: entry.equipment || "",
    spareParts: entry.spareParts || "",
    status: entry.status || "",
    workDone: entry.workDone || "",
    followUp: entry.followUp || "",
    executedBy: entry.executedBy || "",
    verifiedBy: entry.verifiedBy || "",
  }));

  const headerLabels = columns.map((column) => column.header);
  const worksheet = XLSX.utils.json_to_sheet(sheetRows, { header: columns.map((column) => column.key) });

  XLSX.utils.sheet_add_aoa(worksheet, [headerLabels], { origin: "A1" });

  worksheet["!cols"] = columns.map((column) => {
    const maxCellLength = Math.max(
      column.header.length,
      ...sheetRows.map((row) => String(row[column.key] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxCellLength + 2, column.header.length + 2), 40) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Today Logs");
  XLSX.writeFile(workbook, fileName);
}
  const headers = [
    "Shift",
    "Shift Incharge",
    "Technician name",
    "Work Date",
    "Site / Location",
    "Work From",
    "Work To",
    "Breakdown minutes",
    "Sub equipment",
    "Equipment serviced",
    "Spare parts used",
    "Status",
    "Job executed",
    "Follow-up actions",
    "Executed by",
    "Verified by",
  ];

  const csvRows = [headers.join(",")];

  for (const entry of rows) {
    const values = [
      entry.shift || "",
      entry.shiftIncharge || "",
      entry.technician || "",
      entry.workDate,
      entry.site,
      entry.fromTime || "",
      entry.toTime || "",
      entry.breakdownTime != null ? String(entry.breakdownTime) : "",
      entry.subEquipment || "",
      entry.equipment || "",
      entry.spareParts || "",
      entry.status || "",
      entry.workDone || "",
      entry.followUp || "",
      entry.executedBy || "",
      entry.verifiedBy || "",
    ];
    csvRows.push(values.map(csvEscape).join(","));
  }

  const blob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function setTodayDate() {
  form.workDate.value = new Date().toISOString().slice(0, 10);
}

function calculateMinutes(from, to) {
  if (!from || !to) return 0;
  let fromTime = new Date("1970-01-01T" + from);
  let toTime = new Date("1970-01-01T" + to);
  if (toTime < fromTime) {
    toTime.setDate(toTime.getDate() + 1);
  }
  return Math.round((toTime - fromTime) / (1000 * 60));
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const statusValue = statusFilter.value;
  const filtered = entries.filter((entry) => {
    const matchesQuery = [entry.shift, entry.shiftIncharge, entry.technician, entry.site, entry.subEquipment, entry.equipment, entry.status, entry.workDone, entry.followUp, entry.spareParts]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesStatus = statusValue === "all" || entry.status === statusValue;
    return matchesQuery && matchesStatus;
  });

  entriesList.innerHTML = "";

  filtered.forEach((entry) => {
    const node = template.content.cloneNode(true);
    const article = node.querySelector(".entry-card");
    const breakdownLabel = Number.isFinite(entry.breakdownTime) ? entry.breakdownTime.toString() : "0";

    node.querySelector(".entry-date").textContent = formatDate(entry.workDate);
    node.querySelector(".entry-title").textContent = `${entry.site} - ${entry.equipment}`;
    node.querySelector(".entry-status").textContent = entry.status;
    node.querySelector(".entry-shift").textContent = entry.shiftIncharge || "-";
    node.querySelector(".entry-shift-name").textContent = entry.shift || "-";
    node.querySelector(".entry-tech").textContent = entry.technician;
    node.querySelector(".entry-site").textContent = entry.site;
    node.querySelector(".entry-hours").textContent = breakdownLabel;
    node.querySelector(".entry-sub-equipment").textContent = entry.subEquipment || "-";
    node.querySelector(".entry-equipment").textContent = entry.equipment;
    node.querySelector(".entry-work").textContent = entry.workDone;
    node.querySelector(".entry-spareparts").textContent = entry.spareParts || "None used.";
    node.querySelector(".entry-followup").textContent = entry.followUp || "No follow-up recorded.";
    node.querySelector(".entry-executed").textContent = entry.executedBy || "-";
    node.querySelector(".entry-verified").textContent = entry.verifiedBy || "-";

    article.dataset.status = entry.status.toLowerCase().replace(/\s+/g, "-");
    entriesList.appendChild(node);
  });

  emptyState.style.display = filtered.length ? "none" : "block";
  updateSummary(filtered);
  updateStats();
}

function updateSummary(filteredEntries) {
  if (filteredEntries.length === 0) {
    summaryTitle.textContent = "No matching logs";
    summaryCopy.textContent = "Try another search term or clear the status filter to see all technician entries.";
    summaryJob.textContent = "No job recorded";
    summaryLocation.textContent = "No location set";
    summaryFollowup.textContent = "No instructions yet";
    return;
  }

  const latest = filteredEntries[0];
  summaryTitle.textContent = `${latest.technician} at ${latest.site}`;
  summaryCopy.textContent = `${latest.status} work on ${formatDate(latest.workDate)} covering ${latest.equipment}.`;
  summaryJob.textContent = latest.workDone ? `${latest.workDone.slice(0, 60)}${latest.workDone.length > 60 ? "..." : ""}` : "No job recorded";
  summaryLocation.textContent = latest.site || "No location set";
  summaryFollowup.textContent = latest.followUp || "No instructions yet";
}

function updateStats() {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((entry) => entry.workDate === today);
  const followUps = entries.filter((entry) => entry.status === "Needs follow-up").length;
  const totalMinutes = entries.reduce((sum, entry) => sum + (Number(entry.breakdownTime) || 0), 0);

  statToday.textContent = `${todayEntries.length} ${todayEntries.length === 1 ? "entry" : "entries"}`;
  statFollowups.textContent = String(followUps);
  statHours.textContent = totalMinutes.toString();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

