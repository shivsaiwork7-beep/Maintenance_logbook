// DOM Elements
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
const loginScreen = document.getElementById("login-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout-button");
const appContent = document.getElementById("app-content");
const syncStatus = document.getElementById("sync-status");
const syncText = document.getElementById("sync-text");

let entries = [];
let isOnline = false;

// Initialize Firebase and set up auth listeners
async function initializeApp() {
  const firebaseReady = await initializeFirebase();
  if (!firebaseReady) {
    console.warn("Firebase not available, using local storage only");
  }

  // Check if using test credentials
  const testUserId = sessionStorage.getItem("test-user-uid");
  if (testUserId) {
    setAuthenticated(true);
    showApp();
    loadAndRenderEntries();
    return;
  }

  // Listen for auth state changes (Firebase)
  if (typeof onAuthStateChanged === 'function') {
    onAuthStateChanged((user) => {
      if (user) {
        setAuthenticated(true);
        showApp();
        loadAndRenderEntries();
        setupRealtimeSync();
      } else {
        setAuthenticated(false);
        showLogin();
      }
    });
  } else {
    console.warn("Firebase auth not available");
    showLogin();
  }
}

function setAuthenticated(value) {
  sessionStorage.setItem("maintenance-logbook-auth", value ? "true" : "false");
}

function showApp() {
  loginScreen.style.display = "none";
  appContent.style.display = "block";
  updateSyncIndicator(true);
}

function showLogin() {
  loginScreen.style.display = "flex";
  appContent.style.display = "none";
  updateSyncIndicator(false);
}

function updateSyncIndicator(isLoggedIn) {
  if (!isLoggedIn) {
    syncStatus.style.backgroundColor = "#999"; // Gray
    syncText.textContent = "Offline";
    return;
  }

  if (isOnline) {
    syncStatus.style.backgroundColor = "#22c55e"; // Green
    syncText.textContent = "Synced";
  } else {
    syncStatus.style.backgroundColor = "#f59e0b"; // Amber
    syncText.textContent = "Syncing...";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get("email").trim();
  const password = formData.get("password").trim();

  try {
    loginError.textContent = "Signing in...";
    
    // Test credentials for development/testing
    const TEST_EMAIL = "test@jswmi.com";
    const TEST_PASSWORD = "password123";
    
    // Check if using test credentials
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      setAuthenticated(true);
      loginError.textContent = "";
      loginForm.reset();
      // Set a mock user for local testing
      sessionStorage.setItem("test-user-uid", "test-user-123");
      showApp();
      loadAndRenderEntries();
      return;
    }
    
    // Try Firebase authentication if configured
    if (typeof signInUser === 'function') {
      await signInUser(email, password);
      loginError.textContent = "";
      loginForm.reset();
    } else {
      loginError.textContent = "Invalid email or password.";
    }
  } catch (error) {
    loginError.textContent = error.message || "Invalid email or password.";
  }
});

logoutButton?.addEventListener("click", async () => {
  try {
    // Check if using test credentials
    const testUserId = sessionStorage.getItem("test-user-uid");
    if (testUserId) {
      sessionStorage.removeItem("test-user-uid");
      loginForm.reset();
      loginError.textContent = "";
      showLogin();
      return;
    }
    
    stopRealtimeSync();
    if (typeof signOutUser === 'function') {
      await signOutUser();
    }
    loginForm.reset();
    loginError.textContent = "";
    showLogin();
  } catch (error) {
    console.error("Logout error:", error);
  }
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Load entries from cloud storage (async)
async function loadAndRenderEntries() {
  try {
    updateSyncIndicator(false); // Show syncing
    const loadedEntries = await loadEntriesFromCloud();
    entries = Array.isArray(loadedEntries)
  ? loadedEntries.filter(
      entry =>
        entry &&
        entry.shiftIncharge &&
        entry.shiftIncharge.toString().trim() !== ""
    )
  : [];
    
    // Clean up entries without shiftIncharge
    if (loadedEntries.length !== entries.length) {
      await saveEntriesToCloud(entries);
    }

    setTodayDate();
    render();
    isOnline = true;
    updateSyncIndicator(true); // Show synced
  } catch (error) {
    console.error("Error loading entries:", error);
    updateSyncIndicator(false);
  }
}

// Set up real-time sync
function setupRealtimeSync() {
  try {
    syncEntriesRealtime((data) => {
      const filteredEntries = data.filter((entry) => entry.shiftIncharge && entry.shiftIncharge.toString().trim() !== "");
      entries = filteredEntries;
      isOnline = true;
      render();
      updateSyncIndicator(true);
    });
  } catch (error) {
    console.error("Error setting up real-time sync:", error);
  }
}

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
  
  // Save to cloud (async)
  updateSyncIndicator(false); // Show syncing
  saveEntriesToCloud(entries).then(() => {
    isOnline = true;
    updateSyncIndicator(true);
  }).catch((error) => {
    console.error("Error saving entry:", error);
    updateSyncIndicator(false);
  });
  
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

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Cloud storage functions moved to firebase-config.js
// These are now handled by:
// - loadEntriesFromCloud() - loads from Firebase
// - saveEntriesToCloud() - saves to Firebase
// - loadEntriesLocal() - local fallback
// - saveEntriesLocal() - local fallback

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

