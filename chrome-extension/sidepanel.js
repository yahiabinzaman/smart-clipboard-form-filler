// Side Panel script for Smart Clipboard Form Filler

// Elements
const rawInput = document.getElementById("rawInput");
const parseBtn = document.getElementById("parseBtn");
const autofillBtn = document.getElementById("autofillBtn");
const addFieldBtn = document.getElementById("addFieldBtn");
const fieldsContainer = document.getElementById("fieldsContainer");
const emptyState = document.getElementById("emptyState");
const profileSelect = document.getElementById("profileSelect");
const profileNameInput = document.getElementById("profileNameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const deleteProfileBtn = document.getElementById("deleteProfileBtn");
const toast = document.getElementById("toast");

// CSV Elements
const csvFileInput = document.getElementById("csvFileInput");
const importCsvBtn = document.getElementById("importCsvBtn");
const csvFileName = document.getElementById("csvFileName");
const csvNavigator = document.getElementById("csvNavigator");
const prevRecordBtn = document.getElementById("prevRecordBtn");
const csvRecordSelect = document.getElementById("csvRecordSelect");
const nextRecordBtn = document.getElementById("nextRecordBtn");
const csvRecordStatus = document.getElementById("csvRecordStatus");

// State
let parsedFields = {};
let savedProfiles = {};
let loadedCsvRecords = [];
let currentCsvIndex = -1;

// Initial Load
document.addEventListener("DOMContentLoaded", async () => {
  await loadProfiles();
  await loadCsvData();
  setupListeners();
});


// Toast Helper
function showToast(message, isSuccess = true) {
  toast.textContent = message;
  toast.style.borderColor = isSuccess ? "var(--primary-color)" : "var(--danger-color)";
  toast.classList.remove("hidden");
  
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// Setup Event Listeners
function setupListeners() {
  // Parsing
  parseBtn.addEventListener("click", handleExtract);
  rawInput.addEventListener("paste", () => {
    // Run extraction slightly after paste event so textarea value is updated
    setTimeout(handleExtract, 100);
  });

  // Adding fields
  addFieldBtn.addEventListener("click", () => {
    addFieldRow("", "");
    updateEmptyState();
  });

  // Autofill
  autofillBtn.addEventListener("click", handleAutofill);

  // Profile Management
  saveProfileBtn.addEventListener("click", handleSaveProfile);
  deleteProfileBtn.addEventListener("click", handleDeleteProfile);
  profileSelect.addEventListener("change", handleProfileSelect);

  // CSV Importer Listeners
  importCsvBtn.addEventListener("click", () => csvFileInput.click());
  csvFileInput.addEventListener("change", handleCsvUpload);
  csvRecordSelect.addEventListener("change", handleCsvRecordSelect);
  prevRecordBtn.addEventListener("click", () => navigateRecord(-1));
  nextRecordBtn.addEventListener("click", () => navigateRecord(1));
}


// Extract information using Regex & Heuristics
function handleExtract() {
  const text = rawInput.value.trim();
  if (!text) {
    showToast("Please paste some text first", false);
    return;
  }

  const extracted = {};
  const separatorRegex = /[:=\-]/;

  // Split into lines, clean whitespace
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
  
  let i = 0;
  let lastKeyType = ""; // Keeps track of "father", "mother", etc.

  while (i < lines.length) {
    const line = lines[i];
    const match = separatorRegex.exec(line);

    if (match) {
      // Line contains key-value separator, e.g. "NAME: ABDUL AZIZ" or "NAME:"
      const idx = match.index;
      let rawKey = line.substring(0, idx).trim();
      let rawVal = line.substring(idx + 1).trim();

      // Clear key of bad characters
      let key = rawKey.replace(/[^a-zA-Z0-9\s_-]/g, "").trim();

      // If value is empty, search next line
      if (rawVal === "" && i + 1 < lines.length) {
        if (!separatorRegex.test(lines[i + 1])) {
          rawVal = lines[i + 1];
          i++; // Consume next line
        }
      }

      if (key && rawVal) {
        const lowerKey = key.toLowerCase();
        
        // Update context tracking
        if (lowerKey.includes("father")) {
          lastKeyType = "father";
        } else if (lowerKey.includes("mother")) {
          lastKeyType = "mother";
        }

        // Apply context to duplicated field concepts
        if ((lowerKey === "nid no" || lowerKey === "nid" || lowerKey === "nid number" || lowerKey === "nid no") && lastKeyType) {
          key = lastKeyType.toUpperCase() + " " + key;
        }

        extracted[key] = rawVal;
      }
    } else {
      // Line has no separator, check if it's a known keyword label followed by the value on the next line
      const labelKeywords = [
        "name", "passport", "date of birth", "dob", "nid", "father name", 
        "mother name", "gmail", "email", "phone", "passing year", "year"
      ];
      
      const lowerLine = line.toLowerCase();
      const isKnownLabel = labelKeywords.some(keyword => lowerLine.includes(keyword));

      if (isKnownLabel && i + 1 < lines.length) {
        // Next line is the value if it doesn't contain a separator
        if (!separatorRegex.test(lines[i + 1])) {
          let key = line.replace(/[^a-zA-Z0-9\s_-]/g, "").trim();
          const rawVal = lines[i + 1];

          if (key && rawVal) {
            const lowerKey = key.toLowerCase();
            
            if (lowerKey.includes("father")) {
              lastKeyType = "father";
            } else if (lowerKey.includes("mother")) {
              lastKeyType = "mother";
            }

            if ((lowerKey === "nid no" || lowerKey === "nid" || lowerKey === "nid number" || lowerKey === "nid no") && lastKeyType) {
              key = lastKeyType.toUpperCase() + " " + key;
            }

            extracted[key] = rawVal;
            i++; // Consume next line
          }
        }
      }
    }
    i++;
  }

  // 2. Global Backup Regex (in case parsing missed standalone fields like Email/Phone/Website)
  // Email Extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails && !hasValueForLikeKey(extracted, "email") && !hasValueForLikeKey(extracted, "gmail")) {
    extracted["Email"] = emails[0];
  }

  // Phone Extraction
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones && !hasValueForLikeKey(extracted, "phone")) {
    extracted["Phone"] = phones[0];
  }

  // Clean UI and add extracted fields
  fieldsContainer.querySelectorAll(".field-row").forEach(el => el.remove());
  
  const keys = Object.keys(extracted);
  if (keys.length > 0) {
    keys.forEach(key => {
      addFieldRow(key, extracted[key]);
    });
    showToast(`Extracted ${keys.length} field(s)!`);
  } else {
    showToast("No fields could be extracted. Try adding manually.", false);
  }

  updateEmptyState();
}

// Check if any key resembles a target standard key
function hasValueForLikeKey(obj, searchKey) {
  return Object.keys(obj).some(k => k.toLowerCase().includes(searchKey.toLowerCase()));
}

// Add a key-value input row to the panel
function addFieldRow(key = "", value = "") {
  const row = document.createElement("div");
  row.className = "field-row";

  // Key Input
  const keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.className = "field-key";
  keyInput.placeholder = "Label / Name";
  keyInput.value = key;

  // Value Input
  const valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.className = "field-value";
  valueInput.placeholder = "Value to fill";
  valueInput.value = value;

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-field-btn";
  deleteBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 7L5 7M10 11V17M14 11V17M18 7L18 20C18 20.5523 17.5523 21 17 21L7 21C6.44772 21 6 20.5523 6 20L6 7M9 7L9 4C9 3.44772 9.44772 3 10 3L14 3C14.5523 3 15 3.44772 15 4L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  deleteBtn.addEventListener("click", () => {
    row.remove();
    updateEmptyState();
  });

  row.appendChild(keyInput);
  row.appendChild(valueInput);
  row.appendChild(deleteBtn);
  fieldsContainer.appendChild(row);
}

// Refresh Empty State text
function updateEmptyState() {
  const rows = fieldsContainer.querySelectorAll(".field-row");
  if (rows.length > 0) {
    emptyState.style.display = "none";
  } else {
    emptyState.style.display = "block";
  }
}

// Read current fields from the DOM
function getFieldsFromUI() {
  const data = {};
  const rows = fieldsContainer.querySelectorAll(".field-row");
  rows.forEach(row => {
    const key = row.querySelector(".field-key").value.trim();
    const val = row.querySelector(".field-value").value.trim();
    if (key) {
      data[key] = val;
    }
  });
  return data;
}

// Load profiles from storage
async function loadProfiles() {
  try {
    const result = await chrome.storage.local.get("profiles");
    savedProfiles = result.profiles || {};
    
    // Reset dropdown
    profileSelect.innerHTML = '<option value="">-- Select a Profile --</option>';
    
    // Sort profiles alphabetically
    const sortedNames = Object.keys(savedProfiles).sort();
    sortedNames.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      profileSelect.appendChild(option);
    });

    // Disable delete button
    deleteProfileBtn.disabled = true;
  } catch (err) {
    console.error("Failed to load profiles:", err);
  }
}

// Select a profile and load its fields
function handleProfileSelect() {
  const selectedName = profileSelect.value;
  if (!selectedName) {
    deleteProfileBtn.disabled = true;
    profileNameInput.value = "";
    return;
  }

  const profileData = savedProfiles[selectedName];
  if (profileData) {
    // Clear and build UI
    fieldsContainer.querySelectorAll(".field-row").forEach(el => el.remove());
    
    Object.entries(profileData).forEach(([key, val]) => {
      addFieldRow(key, val);
    });
    
    updateEmptyState();
    deleteProfileBtn.disabled = false;
    profileNameInput.value = selectedName;
    showToast(`Loaded profile "${selectedName}"`);
  }
}

// Save profile to storage
async function handleSaveProfile() {
  const fields = getFieldsFromUI();
  if (Object.keys(fields).length === 0) {
    showToast("No fields to save in profile", false);
    return;
  }

  let profileName = profileNameInput.value.trim();
  if (!profileName) {
    // Fall back to currently selected profile name
    profileName = profileSelect.value;
  }

  if (!profileName) {
    showToast("Please enter a profile name", false);
    return;
  }

  try {
    savedProfiles[profileName] = fields;
    await chrome.storage.local.set({ profiles: savedProfiles });
    await loadProfiles();
    
    // Select the newly saved profile
    profileSelect.value = profileName;
    deleteProfileBtn.disabled = false;
    profileNameInput.value = "";
    
    showToast(`Saved profile "${profileName}"!`);
  } catch (err) {
    console.error("Failed to save profile:", err);
    showToast("Failed to save profile", false);
  }
}

// Delete selected profile
async function handleDeleteProfile() {
  const selectedName = profileSelect.value;
  if (!selectedName) return;

  try {
    delete savedProfiles[selectedName];
    await chrome.storage.local.set({ profiles: savedProfiles });
    await loadProfiles();
    
    // Reset fields list
    fieldsContainer.querySelectorAll(".field-row").forEach(el => el.remove());
    updateEmptyState();
    profileNameInput.value = "";
    
    showToast(`Deleted profile "${selectedName}"`);
  } catch (err) {
    console.error("Failed to delete profile:", err);
    showToast("Failed to delete profile", false);
  }
}

// Main function to run the content script and autofill forms
async function handleAutofill() {
  const data = getFieldsFromUI();
  if (Object.keys(data).length === 0) {
    showToast("No fields to autofill. Extract or add some first.", false);
    return;
  }

  try {
    // Query the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      showToast("No active tab found. Open a webpage first.", false);
      return;
    }

    // Guard against Chrome system pages
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
      showToast("Cannot autofill Chrome system pages.", false);
      return;
    }

    // Inject the content script first to make sure it's active
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-script.js"]
    });

    // Send autofill data to content script
    chrome.tabs.sendMessage(tab.id, { action: "autofill", data: data }, (response) => {
      // Check for runtime errors
      if (chrome.runtime.lastError) {
        showToast("Injection failed. Reload the target webpage and try again.", false);
        console.error("Autofill runtime error:", chrome.runtime.lastError);
        return;
      }

      if (response && response.success) {
        if (response.count > 0) {
          showToast(`Successfully filled ${response.count} fields!`);
        } else {
          showToast("No matching fields found on this page.", false);
        }
      } else {
        showToast("Filling failed: " + (response?.error || "Unknown error"), false);
      }
    });

  } catch (err) {
    console.error("Autofill scripting failed:", err);
    showToast("Autofill failed: script injection blocked.", false);
  }
}

// CSV Importer Logic

// Load CSV data from storage
async function loadCsvData() {
  try {
    const result = await chrome.storage.local.get(["csvRecords", "csvIndex", "csvName"]);
    if (result.csvRecords && result.csvRecords.length > 0) {
      loadedCsvRecords = result.csvRecords;
      currentCsvIndex = result.csvIndex !== undefined ? result.csvIndex : -1;
      csvFileName.textContent = result.csvName || "Loaded CSV";
      
      csvNavigator.classList.remove("hidden");
      refreshCsvDropdown();
      
      // If we had a selected record, reload it
      if (currentCsvIndex >= 0 && currentCsvIndex < loadedCsvRecords.length) {
        csvRecordSelect.value = currentCsvIndex;
        loadCsvRecordFields(loadedCsvRecords[currentCsvIndex]);
      }
    }
  } catch (err) {
    console.error("Failed to load CSV data:", err);
  }
}

// Handle CSV File Selection
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
        showToast("Invalid CSV. Make sure headers are present.", false);
        return;
      }
      
      loadedCsvRecords = records;
      currentCsvIndex = 0; // Select first record by default
      
      // Save state to storage
      await chrome.storage.local.set({
        csvRecords: loadedCsvRecords,
        csvIndex: currentCsvIndex,
        csvName: file.name
      });

      csvNavigator.classList.remove("hidden");
      refreshCsvDropdown();
      
      // Load first record
      csvRecordSelect.value = 0;
      loadCsvRecordFields(loadedCsvRecords[0]);
      
      showToast(`Imported ${records.length} records!`);
    } catch (err) {
      console.error("Failed parsing CSV:", err);
      showToast("Error parsing CSV file.", false);
    }
  };
  reader.readAsText(file);
}

// Custom CSV string parser
function parseCSV(text) {
  const lines = [];
  let row = [""];
  lines.push(row);
  let i = 0;
  let inQuotes = false;
  
  while (i < text.length) {
    const c = text[i];
    const next = text[i+1];
    
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      row = [""];
      lines.push(row);
    } else {
      row[row.length - 1] += c;
    }
    i++;
  }
  
  const cleanRows = lines
    .map(r => r.map(val => val.trim()))
    .filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
    
  if (cleanRows.length < 2) return [];
  
  const headers = cleanRows[0].map(h => h.replace(/[^a-zA-Z0-9\s_-]/g, "").trim());
  const records = [];
  
  for (let r = 1; r < cleanRows.length; r++) {
    const record = {};
    const currentRow = cleanRows[r];
    
    headers.forEach((header, index) => {
      if (header) {
        record[header] = currentRow[index] || "";
      }
    });
    records.push(record);
  }
  
  return records;
}

// Refresh record select element
function refreshCsvDropdown() {
  csvRecordSelect.innerHTML = '<option value="">-- Choose Record --</option>';
  
  loadedCsvRecords.forEach((record, index) => {
    let displayLabel = `Record ${index + 1}`;
    
    // Look for name field keys to show in dropdown
    const nameKey = Object.keys(record).find(k => k.toLowerCase() === "name" || k.toLowerCase().includes("name"));
    if (nameKey && record[nameKey]) {
      displayLabel = `${index + 1}. ${record[nameKey]}`;
    } else {
      // Fallback: show first column value
      const firstKey = Object.keys(record)[0];
      if (firstKey && record[firstKey]) {
        displayLabel = `${index + 1}. ${record[firstKey]}`;
      }
    }
    
    const option = document.createElement("option");
    option.value = index;
    option.textContent = displayLabel;
    csvRecordSelect.appendChild(option);
  });
  
  updateCsvStatus();
}

// Update bottom index label and navigation button states
function updateCsvStatus() {
  const count = loadedCsvRecords.length;
  if (count === 0) {
    csvRecordStatus.textContent = "No records loaded";
    prevRecordBtn.disabled = true;
    nextRecordBtn.disabled = true;
    return;
  }
  
  csvRecordStatus.textContent = `Record ${currentCsvIndex + 1} of ${count}`;
  
  // Enable/Disable buttons based on boundaries
  prevRecordBtn.disabled = currentCsvIndex <= 0;
  nextRecordBtn.disabled = currentCsvIndex >= count - 1;
}

// Select item handler
async function handleCsvRecordSelect() {
  const idxVal = csvRecordSelect.value;
  if (idxVal === "") return;
  
  const index = parseInt(idxVal, 10);
  currentCsvIndex = index;
  
  await chrome.storage.local.set({ csvIndex: currentCsvIndex });
  loadCsvRecordFields(loadedCsvRecords[index]);
  updateCsvStatus();
}

// Load individual record into Fields view
function loadCsvRecordFields(record) {
  fieldsContainer.querySelectorAll(".field-row").forEach(el => el.remove());
  
  Object.entries(record).forEach(([key, val]) => {
    addFieldRow(key, val);
  });
  
  updateEmptyState();
}

// Navigate Next/Prev buttons
async function navigateRecord(direction) {
  const targetIndex = currentCsvIndex + direction;
  if (targetIndex >= 0 && targetIndex < loadedCsvRecords.length) {
    currentCsvIndex = targetIndex;
    csvRecordSelect.value = currentCsvIndex;
    
    await chrome.storage.local.set({ csvIndex: currentCsvIndex });
    loadCsvRecordFields(loadedCsvRecords[currentCsvIndex]);
    updateCsvStatus();
    showToast(`Loaded record #${currentCsvIndex + 1}`);
  }
}

