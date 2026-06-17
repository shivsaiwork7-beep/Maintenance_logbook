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

if(localStorage.getItem("auth") !== "true"){
  window.location.href = "login.html";
}

function logout(){
  localStorage.removeItem("auth");
  window.location.href = "login.html";
}

let storedEntries = loadEntries();
let entries = storedEntries.filter(
  (entry) => entry.shiftIncharge && entry.shiftIncharge.toString().trim() !== ""
);

if (storedEntries.length !== entries.length) {
  saveEntries(entries);
}

setTodayDate();
render();

/* ================= SAVE ENTRY ================= */
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  const entry = {
    id: crypto.randomUUID(),
    technician: formData.get("technician")?.trim() || "",
    workDate: formData.get("workDate"),
    site: formData.get("site")?.trim() || "",
    shift: formData.get("shift"),
    shiftIncharge: formData.get("shiftIncharge")?.trim() || "",
    fromTime: formData.get("from_time"),
    toTime: formData.get("to_time"),
    breakdownTime: calculateMinutes(
      formData.get("from_time"),
      formData.get("to_time")
    ),
    subEquipment: formData.get("subEquipment")?.trim() || "",
    equipment: formData.get("equipment")?.trim() || "",
    spareParts: formData.get("spareParts")?.trim() || "",
    status: formData.get("status"),
    workDone: formData.get("workDone")?.trim() || "",
    followUp: formData.get("followUp")?.trim() || "",
    executedBy: formData.get("executedBy")?.trim() || "",
    verifiedBy: formData.get("verifiedBy")?.trim() || "",
    createdAt: Date.now(),
  };

  entries = [entry, ...entries].slice(0, 50);
  saveEntries(entries);

  form.reset();
  setTodayDate();
  render();

  form.querySelector("input[name='technician']").focus();
});

/* ================= RESET ================= */
form.addEventListener("reset", () => {
  window.requestAnimationFrame(() => setTodayDate());
});

/* ================= FILTERS ================= */
searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);

/* ================= EXPORT BUTTON ================= */
if (exportButton) {
  exportButton.addEventListener("click", exportTodayEntriesCsv);
}

/* ================= EXPORT CSV ================= */
function exportTodayEntriesCsv() {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((e) => e.workDate === today);

  if (!todayEntries.length) {
    alert("No entries for today.");
    return;
  }

  const headers = [
    "Shift",
    "Shift Incharge",
    "Technician",
    "Work Date",
    "Site",
    "From",
    "To",
    "Minutes",
    "Sub Equipment",
    "Equipment",
    "Spare Parts",
    "Status",
    "Work Done",
    "Follow Up",
    "Executed By",
    "Verified By",
  ];

  const rows = [headers.join(",")];

  for (const e of todayEntries) {
    const values = [
      e.shift,
      e.shiftIncharge,
      e.technician,
      e.workDate,
      e.site,
      e.fromTime,
      e.toTime,
      e.breakdownTime,
      e.subEquipment,
      e.equipment,
      e.spareParts,
      e.status,
      e.workDone,
      e.followUp,
      e.executedBy,
      e.verifiedBy,
    ];

    rows.push(values.map(csvEscape).join(","));
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `maintenance-logbook-${today}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

/* ================= CSV ESCAPE ================= */
function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/* ================= STORAGE ================= */
function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEntries(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ================= DATE ================= */
function setTodayDate() {
  form.workDate.value = new Date().toISOString().slice(0, 10);
}

/* ================= TIME CALC ================= */
function calculateMinutes(from, to) {
  if (!from || !to) return 0;

  let f = new Date("1970-01-01T" + from);
  let t = new Date("1970-01-01T" + to);

  if (t < f) t.setDate(t.getDate() + 1);

  return Math.round((t - f) / 60000);
}

/* ================= RENDER ================= */
function render() {
  const q = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = entries.filter((e) => {
    const matchText = Object.values(e).join(" ").toLowerCase().includes(q);
    const matchStatus = status === "all" || e.status === status;
    return matchText && matchStatus;
  });

  entriesList.innerHTML = "";

  filtered.forEach((e) => {
    const node = template.content.cloneNode(true);

    node.querySelector(".entry-date").textContent = e.workDate;
    node.querySelector(".entry-title").textContent =
      `${e.site} - ${e.equipment}`;
    node.querySelector(".entry-status").textContent = e.status;

    node.querySelector(".entry-shift").textContent = e.shiftIncharge;
    node.querySelector(".entry-shift-name").textContent = e.shift;
    node.querySelector(".entry-tech").textContent = e.technician;
    node.querySelector(".entry-site").textContent = e.site;
    node.querySelector(".entry-hours").textContent = e.breakdownTime;

    node.querySelector(".entry-sub-equipment").textContent = e.subEquipment;
    node.querySelector(".entry-equipment").textContent = e.equipment;

    node.querySelector(".entry-work").textContent = e.workDone;
    node.querySelector(".entry-spareparts").textContent = e.spareParts;
    node.querySelector(".entry-followup").textContent = e.followUp;
    node.querySelector(".entry-executed").textContent = e.executedBy;
    node.querySelector(".entry-verified").textContent = e.verifiedBy;

    entriesList.appendChild(node);
  });

  emptyState.style.display = filtered.length ? "none" : "block";

  updateStats();
  updateSummary(filtered);
}

/* ================= SUMMARY ================= */
function updateSummary(list) {
  if (!list.length) {
    summaryTitle.textContent = "No entries";
    summaryCopy.textContent = "Add a log entry to see summary.";
    return;
  }

  const last = list[0];

  summaryTitle.textContent = `${last.technician} - ${last.site}`;
  summaryCopy.textContent = last.workDone;
  summaryJob.textContent = last.workDone;
  summaryLocation.textContent = last.site;
  summaryFollowup.textContent = last.followUp;
}

/* ================= STATS ================= */
function updateStats() {
  const today = new Date().toISOString().slice(0, 10);

  const todayCount = entries.filter((e) => e.workDate === today).length;
  const followups = entries.filter(
    (e) => e.status === "Needs follow-up"
  ).length;

  const minutes = entries.reduce(
    (a, b) => a + (Number(b.breakdownTime) || 0),
    0
  );

  statToday.textContent = `${todayCount} entries`;
  statFollowups.textContent = followups;
  statHours.textContent = minutes;
}