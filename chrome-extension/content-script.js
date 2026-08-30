// Content Script for Smart Clipboard Form Filler Pro v1.1.0

if (window.smartFillerLoaded) {
  // Prevent duplicate execution
} else {
  window.smartFillerLoaded = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "autofill") {
      try {
        const result = performAutofill(message.data, message.customRules || {});
        showInPageNotification(`⚡ Smart Filler: Filled ${result.count} field(s)`);
        sendResponse({ success: true, count: result.count, unmapped: result.unmapped });
      } catch (err) {
        console.error("Autofill error:", err);
        sendResponse({ success: false, error: err.message });
      }
    } else if (message.action === "scan_fields") {
      try {
        const scanned = scanFormFields();
        sendResponse({ success: true, fields: scanned });
      } catch (err) {
        console.error("Scan error:", err);
        sendResponse({ success: false, error: err.message });
      }
    }
    return true;
  });

  // Default Synonym Dictionary
  const BASE_SYNONYMS = {
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

  /**
   * Scan active page for all interactive inputs and labels
   */
  function scanFormFields() {
    const selectors = [
      "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='image'])",
      "textarea",
      "select"
    ];
    const elements = Array.from(document.querySelectorAll(selectors.join(",")));
    const scanned = [];

    elements.forEach(el => {
      const labels = getElementLabels(el);
      const name = el.getAttribute("name") || "";
      const id = el.getAttribute("id") || "";
      const placeholder = el.getAttribute("placeholder") || "";
      const primaryLabel = labels[0] || placeholder || name || id || "Field";

      scanned.push({
        id: id,
        name: name,
        label: primaryLabel,
        type: el.type || el.tagName.toLowerCase(),
        currentValue: el.value || ""
      });
    });

    return scanned;
  }

  /**
   * Extract label text for an element
   */
  function getElementLabels(element) {
    const labels = [];
    
    if (element.id) {
      const labelFor = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      if (labelFor) labels.push(labelFor.textContent.trim());
    }
    
    const parentLabel = element.closest("label");
    if (parentLabel) {
      labels.push(parentLabel.textContent.trim());
    }
    
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const ids = labelledBy.split(/\s+/);
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) labels.push(el.textContent.trim());
      });
    }

    // Preceding text or table column header if in a table
    const td = element.closest("td");
    if (td && td.previousElementSibling) {
      labels.push(td.previousElementSibling.textContent.trim());
    }

    return labels.filter(Boolean);
  }

  /**
   * Fuzzy scoring algorithm
   */
  function scoreMatch(fieldDescriptors, userKey, customRules) {
    const cleanUserKey = userKey.toLowerCase().replace(/[^a-z0-9]/g, "");
    let bestScore = 0;

    const mergedRules = Object.assign({}, BASE_SYNONYMS, customRules);

    // Direct descriptor match
    for (const desc of fieldDescriptors) {
      if (!desc) continue;
      const cleanDesc = desc.toLowerCase().trim();
      const cleanStrippedDesc = cleanDesc.replace(/[^a-z0-9]/g, "");
      
      // Exact match
      if (cleanDesc === userKey.toLowerCase().trim() || cleanStrippedDesc === cleanUserKey) {
        return 100;
      }
      
      // Substring match
      if (cleanDesc.includes(userKey.toLowerCase()) || userKey.toLowerCase().includes(cleanDesc)) {
        bestScore = Math.max(bestScore, 80);
      }

      if (cleanStrippedDesc.includes(cleanUserKey) || cleanUserKey.includes(cleanStrippedDesc)) {
        bestScore = Math.max(bestScore, 65);
      }
    }

    // Synonym Dictionary Match
    for (const [standardKey, synonymList] of Object.entries(mergedRules)) {
      const userKeyMatchesStandard = (standardKey === userKey.toLowerCase()) || 
                                     (Array.isArray(synonymList) && synonymList.some(s => s.toLowerCase() === userKey.toLowerCase().trim()));
      
      if (userKeyMatchesStandard) {
        for (const desc of fieldDescriptors) {
          if (!desc) continue;
          const cleanDesc = desc.toLowerCase().trim();
          const cleanStrippedDesc = cleanDesc.replace(/[^a-z0-9]/g, "");
          
          if (Array.isArray(synonymList)) {
            for (const syn of synonymList) {
              const cleanSyn = syn.toLowerCase();
              const cleanStrippedSyn = cleanSyn.replace(/[^a-z0-9]/g, "");
              
              if (cleanDesc === cleanSyn || cleanStrippedDesc === cleanStrippedSyn) {
                return 95;
              }
              if (cleanDesc.includes(cleanSyn) || cleanStrippedDesc.includes(cleanStrippedSyn)) {
                bestScore = Math.max(bestScore, 70);
              }
            }
          }

          if (cleanDesc.includes(standardKey) || cleanStrippedDesc.includes(standardKey.replace(/[^a-z0-9]/g, ""))) {
            bestScore = Math.max(bestScore, 60);
          }
        }
      }
    }

    return bestScore;
  }

  /**
   * Framework-safe input setter (React 16+, Vue 2/3, Angular)
   */
  function setElementValue(element, value) {
    if (element.tagName === "SELECT") {
      return fillSelect(element, value);
    } else if (element.type === "checkbox") {
      return fillCheckbox(element, value);
    } else if (element.type === "radio") {
      return fillRadio(element, value);
    }

    // React 16+ Overrides .value setter
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueDescriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    const nativeValueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value") ||
                                  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");

    if (nativeValueDescriptor && nativeValueDescriptor.set) {
      nativeValueDescriptor.set.call(element, value);
    } else if (prototypeValueDescriptor && prototypeValueDescriptor.set) {
      prototypeValueDescriptor.set.call(element, value);
    } else {
      element.value = value;
    }

    triggerEvents(element);
    highlightField(element);
    return true;
  }

  function fillSelect(element, value) {
    const cleanValue = String(value).toLowerCase().trim();
    let bestOptionIndex = -1;

    for (let i = 0; i < element.options.length; i++) {
      const option = element.options[i];
      const optVal = option.value.toLowerCase().trim();
      const optText = option.text.toLowerCase().trim();

      if (optVal === cleanValue || optText === cleanValue) {
        element.selectedIndex = i;
        triggerEvents(element);
        highlightField(element);
        return true;
      }
      
      if (optVal.includes(cleanValue) || optText.includes(cleanValue) || cleanValue.includes(optVal) || cleanValue.includes(optText)) {
        if (optVal !== "") bestOptionIndex = i;
      }
    }

    if (bestOptionIndex >= 0) {
      element.selectedIndex = bestOptionIndex;
      triggerEvents(element);
      highlightField(element);
      return true;
    }

    return false;
  }

  function fillCheckbox(element, value) {
    const truthyValues = ["true", "yes", "1", "check", "checked", "on", "agree"];
    const shouldCheck = truthyValues.includes(String(value).toLowerCase().trim()) || value === true;
    
    element.checked = shouldCheck;
    triggerEvents(element);
    highlightField(element);
    return true;
  }

  function fillRadio(element, value) {
    const cleanVal = String(value).toLowerCase().trim();
    const radioVal = element.value.toLowerCase().trim();
    const labels = getElementLabels(element);
    const labelMatch = labels.some(lbl => lbl.toLowerCase().trim() === cleanVal || lbl.toLowerCase().includes(cleanVal));

    if (radioVal === cleanVal || labelMatch) {
      element.checked = true;
      triggerEvents(element);
      highlightField(element);
      return true;
    }
    return false;
  }

  function triggerEvents(element) {
    element.focus();
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true }));
    element.blur();
  }

  function highlightField(element) {
    const originalOutline = element.style.outline;
    const originalBoxShadow = element.style.boxShadow;
    const originalTransition = element.style.transition;
    
    element.style.transition = "outline 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease";
    element.style.outline = "2px solid #00f0ff";
    element.style.boxShadow = "0 0 10px rgba(0, 240, 255, 0.6)";
    
    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.boxShadow = originalBoxShadow;
      setTimeout(() => {
        element.style.transition = originalTransition;
      }, 200);
    }, 1800);
  }

  /**
   * In-Page HUD Toast
   */
  function showInPageNotification(message) {
    let hud = document.getElementById("smart-filler-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "smart-filler-hud";
      hud.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(10, 8, 20, 0.95);
        color: #00f0ff;
        border: 1px solid #00f0ff;
        border-radius: 30px;
        padding: 10px 18px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 15px rgba(0,240,255,0.4);
        z-index: 999999999;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.3s ease, transform 0.3s ease;
        backdrop-filter: blur(12px);
      `;
      document.body.appendChild(hud);
    }

    hud.textContent = message;
    hud.style.opacity = "1";
    hud.style.transform = "translateY(0)";

    setTimeout(() => {
      hud.style.opacity = "0";
      hud.style.transform = "translateY(15px)";
    }, 2800);
  }

  /**
   * Main Autofill Driver
   */
  function performAutofill(data, customRules) {
    const selectors = [
      "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='image'])",
      "textarea",
      "select"
    ];
    const elements = Array.from(document.querySelectorAll(selectors.join(",")));
    let filledCount = 0;
    const filledElements = new Set();
    const unmapped = [];

    for (const [userKey, userValue] of Object.entries(data)) {
      if (!userValue || String(userValue).trim() === "") continue;

      let bestElement = null;
      let highestScore = 0;

      for (const element of elements) {
        if (filledElements.has(element)) continue;

        const descriptors = [
          element.getAttribute("id"),
          element.getAttribute("name"),
          element.getAttribute("placeholder"),
          element.getAttribute("autocomplete"),
          element.getAttribute("aria-label"),
          ...getElementLabels(element)
        ];

        if (element.className && typeof element.className === "string") {
          descriptors.push(...element.className.split(/\s+/));
        }

        const score = scoreMatch(descriptors, userKey, customRules);
        if (score > highestScore && score >= 40) {
          highestScore = score;
          bestElement = element;
        }
      }

      if (bestElement) {
        const success = setElementValue(bestElement, userValue);
        if (success) {
          filledElements.add(bestElement);
          filledCount++;
        }
      } else {
        unmapped.push(userKey);
      }
    }

    return { count: filledCount, unmapped: unmapped };
  }
}
