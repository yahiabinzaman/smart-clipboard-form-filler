// Side Panel script for Smart Clipboard Form Filler Pro v1.1.0

// DOM Elements - Navigation
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanes = document.querySelectorAll(".tab-pane");

// DOM Elements - Fill Tab
const rawInput = document.getElementById("rawInput");
const rawCharCount = document.getElementById("rawCharCount");
const parseBtn = document.getElementById("parseBtn");
const pasteClipboardBtn = document.getElementById("pasteClipboardBtn");
const scanPageBtn = document.getElementById("scanPageBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const autofillBtn = document.getElementById("autofillBtn");
const addFieldBtn = document.getElementById("addFieldBtn");
const filterFieldsInput = document.getElementById("filterFieldsInput");
const fieldsContainer = document.getElementById("fieldsContainer");
const emptyState = document.getElementById("emptyState");
const fieldCountBadge = document.getElementById("fieldCountBadge");

// Text Transformers
const transformUpper = document.getElementById("transformUpper");
const transformTitle = document.getElementById("transformTitle");
const transformCleanPhone = document.getElementById("transformCleanPhone");
const transformDateIso = document.getElementById("transformDateIso");

// DOM Elements - CSV Tab
const csvFileInput = document.getElementById("csvFileInput");
const importCsvBtn = document.getElementById("importCsvBtn");
const csvFileName = document.getElementById("csvFileName");
const csvNavigator = document.getElementById("csvNavigator");
const csvSearchInput = document.getElementById("csvSearchInput");
const prevRecordBtn = document.getElementById("prevRecordBtn");
const csvRecordSelect = document.getElementById("csvRecordSelect");
const nextRecordBtn = document.getElementById("nextRecordBtn");
const csvRecordStatus = document.getElementById("csvRecordStatus");
const csvRecordTotal = document.getElementById("csvRecordTotal");
const fillCurrentCsvBtn = document.getElementById("fillCurrentCsvBtn");
const fillAndNextBtn = document.getElementById("fillAndNextBtn");

// DOM Elements - Rules Tab
const newRuleStandard = document.getElementById("newRuleStandard");
const newRuleAliases = document.getElementById("newRuleAliases");
const addRuleBtn = document.getElementById("addRuleBtn");
const rulesContainer = document.getElementById("rulesContainer");
const resetRulesBtn = document.getElementById("resetRulesBtn");
const exportRulesBtn = document.getElementById("exportRulesBtn");

// DOM Elements - Profiles Tab
const profileSelect = document.getElementById("profileSelect");
const profileNameInput = document.getElementById("profileNameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const deleteProfileBtn = document.getElementById("deleteProfileBtn");
const profileCountBadge = document.getElementById("profileCountBadge");
const exportAllDataBtn = document.getElementById("exportAllDataBtn");
const importAllDataBtn = document.getElementById("importAllDataBtn");
const importBackupInput = document.getElementById("importBackupInput");

// Toast
const toast = document.getElementById("toast");

// State
let savedProfiles = {};
let loadedCsvRecords = [];
let filteredCsvIndices = [];
let currentCsvIndex = -1;
let customRules = {};

// Default Rules Preset
const DEFAULT_RULES = {
  first_name: ["fname", "first name", "given name", "forename", "first_name", "first-name"],
  last_name: ["lname", "last name", "surname", "family name", "last_name", "last-name"],
  name: ["name", "fullname", "full name", "applicant name", "candidate name", "user", "contact name", "display name", "nam"],
  email: ["email", "e-mail", "mail", "email address", "gmail", "email_address"],
  phone: ["phone", "tel", "telephone", "mobile", "cell", "contact number", "phone number", "phonenumber", "mobile_no", "contact_no"],
  dob: ["dob", "date of birth", "birth date", "birthdate", "birthday", "d_o_b"],
  gender: ["gender", "sex", "lingo"],
  nid: ["nid", "nid no", "nid number", "national id", "national identity", "voter id", "citizen id"],
  passport: ["passport", "passport no", "passport number", "pass no", "pp no", "pass_num"],
  father_name: ["father name", "father's name", "fathers name", "father", "babar nam", "pitar nam"],
  mother_name: ["mother name", "mother's name", "mothers name", "mother", "mar nam", "matar nam"],
  address: ["address", "street", "location", "residence", "address line 1", "address1", "street address", "present address", "permanent address"],
  city: ["city", "town", "locality", "district", "zila"],
  division: ["division", "state", "province", "region"],
  zip: ["zip", "postal", "postcode", "zipcode", "zip code", "postal code", "post code"],
  country: ["country", "nation", "desh"],
  passing_year: ["passing year", "year of passing", "exam year", "graduation year", "pass year"],
  roll: ["roll", "roll no", "roll number", "board roll", "registration no", "reg no"],
  company: ["company", "organization", "org", "employer", "institution", "school", "college", "university"]
};

// Initial Load
document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  await loadCustomRules();
  await loadProfiles();
  await loadCsvData();
  setupListeners();
  updateFieldCounter();
});

// Toast Helper
function showToast(message, isSuccess = true) {
  toast.textContent = message;
  toast.style.borderColor = isSuccess ? "var(--primary-color)" : "var(--danger-color)";
  toast.style.boxShadow = isSuccess ? "0 8px 24px rgba(0,0,0,0.6), 0 0 15px var(--primary-glow)" : "0 8px 24px rgba(0,0,0,0.6), 0 0 15px var(--danger-glow)";
  toast.classList.remove("hidden");
  
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

// Navigation Tabs
function setupNavigation() {
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));
      
      btn.classList.add("active");
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.classList.add("active");
    });
  });
}

// Setup Event Listeners
function setupListeners() {
  // Parsing & Input
  rawInput.addEventListener("input", () => {
    rawCharCount.textContent = `${rawInput.value.length} chars`;
  });
  
  parseBtn.addEventListener("click", handleExtract);
  
  rawInput.addEventListener("paste", () => {
    setTimeout(handleExtract, 80);
  });

  pasteClipboardBtn.addEventListener("click", async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        rawInput.value = clipText;
        rawCharCount.textContent = `${clipText.length} chars`;
        handleExtract();
      } else {
        showToast("Clipboard is empty", false);
      }
    } catch (e) {
      showToast("Clipboard access denied. Please paste manually into the box.", false);
    }
  });

  // Page Form Scanner
  scanPageBtn.addEventListener("click", handleScanPage);

  // Clear All
  clearAllBtn.addEventListener("click", () => {
    rawInput.value = "";
    rawCharCount.textContent = "0 chars";
    fieldsContainer.querySelectorAll(".field-row").forEach(el => el.remove());
    updateEmptyState();
    updateFieldCounter();
    showToast("Cleared fields");
  });

  // Adding fields
  addFieldBtn.addEventListener("click", () => {
    addFieldRow("", "");
    updateEmptyState();
    updateFieldCounter();
  });

  // Filter fields
  filterFieldsInput.addEventListener("input", handleFilterFields);

  // Transformers
  transformUpper.addEventListener("click", () => transformValues("upper"));
  transformTitle.addEventListener("click", () => transformValues("title"));
  transformCleanPhone.addEventListener("click", () => transformValues("phone"));
  transformDateIso.addEventListener("click", () => transformValues("date"));

  // Autofill
  autofillBtn.addEventListener("click", () => handleAutofill());

  // Profile Management
  saveProfileBtn.addEventListener("click", handleSaveProfile);
  deleteProfileBtn.addEventListener("click", handleDeleteProfile);
  profileSelect.addEventListener("change", handleProfileSelect);
  exportAllDataBtn.addEventListener("click", handleExportAllData);
  importAllDataBtn.addEventListener("click", () => importBackupInput.click());
  importBackupInput.addEventListener("change", handleImportBackup);

  // CSV Listeners
  importCsvBtn.addEventListener("click", () => csvFileInput.click());
  csvFileInput.addEventListener("change", handleCsvUpload);
  csvRecordSelect.addEventListener("change", handleCsvRecordSelect);
  prevRecordBtn.addEventListener("click", () => navigateRecord(-1));
  nextRecordBtn.addEventListener("click", () => navigateRecord(1));
  csvSearchInput.addEventListener("input", handleCsvSearch);
  fillCurrentCsvBtn.addEventListener("click", () => handleAutofill());
  fillAndNextBtn.addEventListener("click", handleFillAndNext);

  // Custom Rules Listeners
  addRuleBtn.addEventListener("click", handleAddRule);
  resetRulesBtn.addEventListener("click", handleResetRules);
  exportRulesBtn.addEventListener("click", handleExportRules);
}

// Extraction Engine
function handleExtract() {
  const text = rawInput.value.trim();
  if (!text) {
    showToast("Please paste some text first", false);
    return;
  }

  const extracted = {};
  const separatorRegex = /[:=\-–—]/;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
  
  let i = 0;
  let lastContext = ""; // Tracks "father", "mother", "present", "permanent", etc.

  while (i < lines.length) {
    const line = lines[i];
    const match = separatorRegex.exec(line);

    if (match) {
      const idx = match.index;
      let rawKey = line.substring(0, idx).trim();
      let rawVal = line.substring(idx + 1).trim();
      let key = rawKey.replace(/[^a-zA-Z0-9\s_-]/g, "").trim();

      if (rawVal === "" && i + 1 < lines.length) {
        if (!separatorRegex.test(lines[i + 1])) {
          rawVal = lines[i + 1];
          i++;
        }
      }

      if (key && rawVal) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes("father") || lowerKey.includes("baba")) lastContext = "father";
        else if (lowerKey.includes("mother") || lowerKey.includes("ma")) lastContext = "mother";
        else if (lowerKey.includes("permanent")) lastContext = "permanent";
        else if (lowerKey.includes("present")) lastContext = "present";

        if ((lowerKey === "nid" || lowerKey === "nid no" || lowerKey === "nid number" || lowerKey === "dob") && lastContext) {
          key = `${lastContext.toUpperCase()} ${key}`;
        }

        extracted[key] = rawVal;
      }
    } else {
      // Check known keywords on standalone lines
      const labelKeywords = [
        "name", "passport", "date of birth", "dob", "nid", "father name", 
        "mother name", "gmail", "email", "phone", "mobile", "address", "passing year", "gender"
      ];
      
      const lowerLine = line.toLowerCase();
      const isKnown = labelKeywords.some(kw => lowerLine === kw || lowerLine.startsWith(kw));

      if (isKnown && i + 1 < lines.length) {
        if (!separatorRegex.test(lines[i + 1])) {
          let key = line.replace(/[^a-zA-Z0-9\s_-]/g, "").trim();
          const rawVal = lines[i + 1];
          if (key && rawVal) {
            extracted[key] = rawVal;
            i++;
          }
        }
      }
    }
    i++;
  }

  // Backup regex for standalone Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails && !hasValueForLikeKey(extracted, "email") && !hasValueForLikeKey(extracted, "mail")) {
    extracted["Email"] = emails[0];
  }

  // Backup regex for standalone Phone
  const phoneRegex = /(?:\+?88)?01[3-9]\d{8}|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones && !hasValueForLikeKey(extracted, "phone") && !hasValueForLikeKey(extracted, "mobile")) {
    extracted["Phone"] = phones[0];
  }

  // Populate UI
  fieldsContainer.querySelectorAll(".field-row").forEach(el => el.remove());
  
  const keys = Object.keys(extracted);
  if (keys.length > 0) {
    keys.forEach(key => addFieldRow(key, extracted[key]));
    showToast(`Extracted ${keys.length} field(s)!`);
  } else {
    showToast("No structured fields detected. Add manually or scan page.", false);
  }

  updateEmptyState();
  updateFieldCounter();
}

function hasValueForLikeKey(obj, searchKey) {
  return Object.keys(obj).some(k => k.toLowerCase().includes(searchKey.toLowerCase()));
}

// Add a Field Row
function addFieldRow(key = "", value = "") {
  const row = document.createElement("div");
  row.className = "field-row";

  const keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.className = "field-key";
  keyInput.placeholder = "Field Name / Key";
  keyInput.value = key;

  const valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.className = "field-value";
  valueInput.placeholder = "Value to fill";
  valueInput.value = value;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-field-btn";
  deleteBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  `;
  deleteBtn.addEventListener("click", () => {
    row.remove();
    updateEmptyState();
    updateFieldCounter();
  });

  row.appendChild(keyInput);
  row.appendChild(valueInput);
  row.appendChild(deleteBtn);
  fieldsContainer.appendChild(row);
}

function updateEmptyState() {
  const rows = fieldsContainer.querySelectorAll(".field-row");
  emptyState.style.display = rows.length > 0 ? "none" : "flex";
}

function updateFieldCounter() {
  const rows = fieldsContainer.querySelectorAll(".field-row");
  fieldCountBadge.textContent = rows.length;
}

function handleFilterFields() {
  const filter = filterFieldsInput.value.toLowerCase().trim();
  const rows = fieldsContainer.querySelectorAll(".field-row");
  
  rows.forEach(row => {
    const key = row.querySelector(".field-key").value.toLowerCase();
    const val = row.querySelector(".field-value").value.toLowerCase();
    if (!filter || key.includes(filter) || val.includes(filter)) {
      row.style.display = "flex";
    } else {
      row.style.display = "none";
    }
  });
}

function getFieldsFromUI() {
  const data = {};
  const rows = fieldsContainer.querySelectorAll(".field-row");
  rows.forEach(row => {
    const key = row.querySelector(".field-key").value.trim();
    const val = row.querySelector(".field-value").value.trim();
    if (key) data[key] = val;
  });
  return data;
}

// Text Transformations
function transformValues(mode) {
  const rows = fieldsContainer.querySelectorAll(".field-row");
  if (rows.length === 0) {
    showToast("No fields to format", false);
    return;
  }

  rows.forEach(row => {
    const key = row.querySelector(".field-key").value.toLowerCase();
    const valInput = row.querySelector(".field-value");
    let val = valInput.value.trim();
    if (!val) return;

    if (mode === "upper") {
      valInput.value = val.toUpperCase();
    } else if (mode === "title") {
      valInput.value = val.replace(/\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    } else if (mode === "phone") {
      if (key.includes("phone") || key.includes("mobile") || key.includes("tel")) {
        // Clean non-digits except leading +
        let cleaned = val.replace(/[^\d+]/g, "");
        if (cleaned.startsWith("880")) cleaned = "0" + cleaned.substring(3);
        else if (cleaned.startsWith("+880")) cleaned = "0" + cleaned.substring(4);
        valInput.value = cleaned;
      }
    } else if (mode === "date") {
      if (key.includes("dob") || key.includes("birth") || key.includes("date")) {
        // Match DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
        const dmyMatch = val.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
        if (dmyMatch) {
          const d = dmyMatch[1].padStart(2, "0");
          const m = dmyMatch[2].padStart(2, "0");
          const y = dmyMatch[3];
          valInput.value = `${y}-${m}-${d}`;
        }
      }
    }
  });

  showToast(`Applied ${mode.toUpperCase()} formatting!`);
}

// Scan Active Page Form
async function handleScanPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showToast("No active webpage found", false);
      return;
    }

    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
      showToast("Cannot scan Chrome system pages", false);
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-script.js"]
    });

    chrome.tabs.sendMessage(tab.id, { action: "scan_fields" }, (response) => {
      if (chrome.runtime.lastError) {
        showToast("Scan failed. Reload page and try again.", false);
        return;
      }

      if (response && response.fields && response.fields.length > 0) {
        fieldsContainer.querySelectorAll(".field-row").forEach(el => el.remove());
        response.fields.forEach(field => {
          addFieldRow(field.label || field.name || field.id, field.currentValue || "");
        });
        updateEmptyState();
        updateFieldCounter();
        showToast(`Detected ${response.fields.length} form inputs from page!`);
      } else {
        showToast("No interactive form fields found on this page", false);
      }
    });
  } catch (err) {
    console.error("Scan error:", err);
    showToast("Failed to scan page form", false);
  }
}

// Autofill Core
async function handleAutofill(customData = null) {
  const data = customData || getFieldsFromUI();
  if (Object.keys(data).length === 0) {
    showToast("No fields to autofill. Extract or add some first.", false);
    return false;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showToast("No active tab found", false);
      return false;
    }

    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
      showToast("Cannot autofill Chrome system pages", false);
      return false;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-script.js"]
    });

    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, {
        action: "autofill",
        data: data,
        customRules: customRules
      }, (response) => {
        if (chrome.runtime.lastError) {
          showToast("Injection failed. Reload webpage and try again.", false);
          resolve(false);
          return;
        }

        if (response && response.success) {
          if (response.count > 0) {
            showToast(`⚡ Successfully filled ${response.count} field(s)!`);
          } else {
            showToast("No matching fields found on this page.", false);
          }
          resolve(true);
        } else {
          showToast("Filling failed: " + (response?.error || "Unknown error"), false);
          resolve(false);
        }
      });
    });
  } catch (err) {
    console.error("Autofill scripting error:", err);
    showToast("Autofill failed: script injection blocked", false);
    return false;
  }
}

// Bulk CSV & Advance
async function handleFillAndNext() {
  if (loadedCsvRecords.length === 0 || currentCsvIndex < 0) {
    showToast("No CSV record selected", false);
    return;
  }

  const success = await handleAutofill();
  if (success && currentCsvIndex < loadedCsvRecords.length - 1) {
    setTimeout(() => {
      navigateRecord(1);
    }, 400);
  }
}

// CSV Engine
async function loadCsvData() {
  try {
    const res = await chrome.storage.local.get(["csvRecords", "csvIndex", "csvName"]);
    if (res.csvRecords && res.csvRecords.length > 0) {
      loadedCsvRecords = res.csvRecords;
      filteredCsvIndices = loadedCsvRecords.map((_, i) => i);
      currentCsvIndex = res.csvIndex !== undefined ? res.csvIndex : 0;
      csvFileName.textContent = res.csvName || "Loaded Dataset";
      csvRecordTotal.textContent = `${loadedCsvRecords.length} records`;
      
      csvNavigator.classList.remove("hidden");
      refreshCsvDropdown();
      
      if (currentCsvIndex >= 0 && currentCsvIndex < loadedCsvRecords.length) {
        csvRecordSelect.value = currentCsvIndex;
      }
    }
  } catch (e) {
    console.error("CSV load error:", e);
  }
}

function handleCsvUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  csvFileName.textContent = file.name;
  const reader = new FileReader();
  
  reader.onload = async function(evt) {
    try {
      const text = evt.target.result;
      const records = parseCSV(text);
      
      if (records.length === 0) {
        showToast("Invalid file format. Make sure headers exist.", false);
        return;
      }

      loadedCsvRecords = records;
      filteredCsvIndices = loadedCsvRecords.map((_, i) => i);
      currentCsvIndex = 0;
      
      await chrome.storage.local.set({
        csvRecords: loadedCsvRecords,
        csvIndex: currentCsvIndex,
        csvName: file.name
      });

      csvRecordTotal.textContent = `${records.length} records`;
      csvNavigator.classList.remove("hidden");
      refreshCsvDropdown();
      
      csvRecordSelect.value = 0;
      loadCsvRecordFields(loadedCsvRecords[0]);
      showToast(`Imported ${records.length} records!`);
    } catch (err) {
      console.error(err);
      showToast("Error parsing CSV/TSV file", false);
    }
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  const isTSV = text.includes("\t") && !text.includes(",");
  const delimiter = isTSV ? "\t" : ",";
  const lines = [];
  let row = [""];
  lines.push(row);
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row = [""];
      lines.push(row);
    } else {
      row[row.length - 1] += c;
    }
    i++;
  }

  const cleanRows = lines
    .map(r => r.map(v => v.trim()))
    .filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));

  if (cleanRows.length < 2) return [];

  const headers = cleanRows[0].map(h => h.replace(/[^a-zA-Z0-9\s_-]/g, "").trim());
  const records = [];

  for (let r = 1; r < cleanRows.length; r++) {
    const record = {};
    const currentRow = cleanRows[r];
    headers.forEach((h, idx) => {
      if (h) record[h] = currentRow[idx] || "";
    });
    records.push(record);
  }

  return records;
}

function refreshCsvDropdown() {
  csvRecordSelect.innerHTML = "";
  
  filteredCsvIndices.forEach(origIdx => {
    const record = loadedCsvRecords[origIdx];
    let label = `Record ${origIdx + 1}`;
    
    const nameKey = Object.keys(record).find(k => k.toLowerCase().includes("name"));
    if (nameKey && record[nameKey]) {
      label = `${origIdx + 1}. ${record[nameKey]}`;
    } else {
      const firstKey = Object.keys(record)[0];
      if (firstKey && record[firstKey]) label = `${origIdx + 1}. ${record[firstKey]}`;
    }

    const opt = document.createElement("option");
    opt.value = origIdx;
    opt.textContent = label;
    csvRecordSelect.appendChild(opt);
  });

  updateCsvStatus();
}

function updateCsvStatus() {
  const total = loadedCsvRecords.length;
  if (total === 0) {
    csvRecordStatus.textContent = "No records loaded";
    prevRecordBtn.disabled = true;
    nextRecordBtn.disabled = true;
    return;
  }

  csvRecordStatus.textContent = `Record ${currentCsvIndex + 1} of ${total}`;
  prevRecordBtn.disabled = currentCsvIndex <= 0;
  nextRecordBtn.disabled = currentCsvIndex >= total - 1;
}

function handleCsvSearch() {
  const query = csvSearchInput.value.toLowerCase().trim();
  if (!query) {
    filteredCsvIndices = loadedCsvRecords.map((_, i) => i);
  } else {
    filteredCsvIndices = loadedCsvRecords
      .map((rec, i) => ({ rec, i }))
      .filter(({ rec }) => Object.values(rec).some(val => String(val).toLowerCase().includes(query)))
      .map(({ i }) => i);
  }

  refreshCsvDropdown();
  if (filteredCsvIndices.length > 0) {
    currentCsvIndex = filteredCsvIndices[0];
    csvRecordSelect.value = currentCsvIndex;
    loadCsvRecordFields(loadedCsvRecords[currentCsvIndex]);
  }
}

async function handleCsvRecordSelect() {
  const idx = parseInt(csvRecordSelect.value, 10);
  if (isNaN(idx)) return;
  currentCsvIndex = idx;
  await chrome.storage.local.set({ csvIndex: currentCsvIndex });
  loadCsvRecordFields(loadedCsvRecords[idx]);
  updateCsvStatus();
}

function loadCsvRecordFields(record) {
  fieldsContainer.querySelectorAll(".field-row").forEach(el => el.remove());
  Object.entries(record).forEach(([k, v]) => addFieldRow(k, v));
  updateEmptyState();
  updateFieldCounter();
}

async function navigateRecord(dir) {
  const nextIdx = currentCsvIndex + dir;
  if (nextIdx >= 0 && nextIdx < loadedCsvRecords.length) {
    currentCsvIndex = nextIdx;
    csvRecordSelect.value = currentCsvIndex;
    await chrome.storage.local.set({ csvIndex: currentCsvIndex });
    loadCsvRecordFields(loadedCsvRecords[currentCsvIndex]);
    updateCsvStatus();
    showToast(`Loaded candidate #${currentCsvIndex + 1}`);
  }
}

// Custom Rules Manager
async function loadCustomRules() {
  try {
    const res = await chrome.storage.local.get("customRules");
    customRules = res.customRules || DEFAULT_RULES;
    renderRules();
  } catch (e) {
    console.error("Rules load error:", e);
  }
}

function renderRules() {
  rulesContainer.innerHTML = "";
  Object.entries(customRules).forEach(([standardKey, aliases]) => {
    const item = document.createElement("div");
    item.className = "rule-item";

    const content = document.createElement("div");
    content.className = "rule-item-content";

    const title = document.createElement("div");
    title.className = "rule-standard-key";
    title.textContent = standardKey;

    const aliasesText = document.createElement("div");
    aliasesText.className = "rule-aliases-text";
    aliasesText.textContent = Array.isArray(aliases) ? aliases.join(", ") : aliases;

    content.appendChild(title);
    content.appendChild(aliasesText);

    const delBtn = document.createElement("button");
    delBtn.className = "delete-field-btn";
    delBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    delBtn.addEventListener("click", async () => {
      delete customRules[standardKey];
      await chrome.storage.local.set({ customRules });
      renderRules();
      showToast(`Removed rule "${standardKey}"`);
    });

    item.appendChild(content);
    item.appendChild(delBtn);
    rulesContainer.appendChild(item);
  });
}

async function handleAddRule() {
  const std = newRuleStandard.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const aliasesRaw = newRuleAliases.value.trim();

  if (!std || !aliasesRaw) {
    showToast("Please enter both standard key and aliases", false);
    return;
  }

  const aliases = aliasesRaw.split(",").map(a => a.trim().toLowerCase()).filter(Boolean);
  customRules[std] = aliases;

  await chrome.storage.local.set({ customRules });
  renderRules();

  newRuleStandard.value = "";
  newRuleAliases.value = "";
  showToast(`Added custom rule for "${std}"!`);
}

async function handleResetRules() {
  customRules = JSON.parse(JSON.stringify(DEFAULT_RULES));
  await chrome.storage.local.set({ customRules });
  renderRules();
  showToast("Reset rules to default presets");
}

function handleExportRules() {
  const blob = new Blob([JSON.stringify(customRules, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "smart-filler-rules.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Profiles & Backup
async function loadProfiles() {
  try {
    const res = await chrome.storage.local.get("profiles");
    savedProfiles = res.profiles || {};
    profileSelect.innerHTML = '<option value="">-- Select a Profile --</option>';
    
    const names = Object.keys(savedProfiles).sort();
    profileCountBadge.textContent = `${names.length} profiles`;

    names.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      profileSelect.appendChild(opt);
    });

    deleteProfileBtn.disabled = true;
  } catch (e) {
    console.error("Profile load error:", e);
  }
}

function handleProfileSelect() {
  const name = profileSelect.value;
  if (!name) {
    deleteProfileBtn.disabled = true;
    profileNameInput.value = "";
    return;
  }

  const data = savedProfiles[name];
  if (data) {
    fieldsContainer.querySelectorAll(".field-row").forEach(el => el.remove());
    Object.entries(data).forEach(([k, v]) => addFieldRow(k, v));
    updateEmptyState();
    updateFieldCounter();
    deleteProfileBtn.disabled = false;
    profileNameInput.value = name;
    showToast(`Loaded profile "${name}"`);
  }
}

async function handleSaveProfile() {
  const fields = getFieldsFromUI();
  if (Object.keys(fields).length === 0) {
    showToast("No fields to save in profile", false);
    return;
  }

  let name = profileNameInput.value.trim() || profileSelect.value;
  if (!name) {
    showToast("Please enter a profile name", false);
    return;
  }

  savedProfiles[name] = fields;
  await chrome.storage.local.set({ profiles: savedProfiles });
  await loadProfiles();
  profileSelect.value = name;
  deleteProfileBtn.disabled = false;
  profileNameInput.value = "";
  showToast(`Saved profile "${name}"!`);
}

async function handleDeleteProfile() {
  const name = profileSelect.value;
  if (!name) return;

  delete savedProfiles[name];
  await chrome.storage.local.set({ profiles: savedProfiles });
  await loadProfiles();
  profileNameInput.value = "";
  showToast(`Deleted profile "${name}"`);
}

function handleExportAllData() {
  const backup = {
    version: "1.1.0",
    date: new Date().toISOString(),
    profiles: savedProfiles,
    customRules: customRules,
    csvRecords: loadedCsvRecords
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "smart-form-filler-backup.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported complete backup JSON!");
}

function handleImportBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(evt) {
    try {
      const backup = JSON.parse(evt.target.result);
      if (backup.profiles) savedProfiles = backup.profiles;
      if (backup.customRules) customRules = backup.customRules;
      if (backup.csvRecords) loadedCsvRecords = backup.csvRecords;

      await chrome.storage.local.set({
        profiles: savedProfiles,
        customRules: customRules,
        csvRecords: loadedCsvRecords
      });

      await loadProfiles();
      await loadCustomRules();
      await loadCsvData();
      showToast("Restored backup successfully!");
    } catch (err) {
      console.error(err);
      showToast("Invalid backup JSON file", false);
    }
  };
  reader.readAsText(file);
}
