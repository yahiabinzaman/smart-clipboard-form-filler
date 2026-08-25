// Content Script for Smart Clipboard Form Filler

// Register a message listener if it hasn't been registered yet
if (window.smartFillerLoaded) {
  // Prevent duplicate registration
  console.log("Smart Clipboard Form Filler content script already loaded.");
} else {
  window.smartFillerLoaded = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "autofill") {
      try {
        const fieldsFilledCount = performAutofill(message.data);
        sendResponse({ success: true, count: fieldsFilledCount });
      } catch (err) {
        console.error("Autofill execution failed:", err);
        sendResponse({ success: false, error: err.message });
      }
    }
    return true; // Keep message channel open for async response
  });

  // Synonym mappings for fuzzy matching
  const SYNONYMS = {
    first_name: ["fname", "first name", "given name", "forename", "first-name"],
    last_name: ["lname", "last name", "surname", "family name", "last-name"],
    name: ["name", "fullname", "full name", "user", "contact name", "display name"],
    email: ["email", "e-mail", "mail", "email address", "email-address"],
    phone: ["phone", "tel", "telephone", "mobile", "cell", "contact number", "phone number", "phonenumber"],
    address: ["address", "street", "location", "residence", "address line 1", "address1", "street address"],
    address2: ["address line 2", "address2", "apartment", "suite", "unit"],
    city: ["city", "town", "locality"],
    state: ["state", "province", "region", "county"],
    zip: ["zip", "postal", "postcode", "zipcode", "zip code", "postal code"],
    country: ["country", "nation"],
    company: ["company", "organization", "org", "employer", "business"],
    title: ["title", "job title", "role", "designation"],
    username: ["username", "user name", "login", "handle"],
    website: ["website", "url", "site", "homepage", "webpage"]
  };

  /**
   * Helper function to find labels associated with an element
   */
  function getElementLabels(element) {
    const labels = [];
    
    // 1. Label with 'for' attribute matching element ID
    if (element.id) {
      const labelFor = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      if (labelFor) labels.push(labelFor.textContent.trim());
    }
    
    // 2. Parent label element
    const parentLabel = element.closest("label");
    if (parentLabel) {
      labels.push(parentLabel.textContent.trim());
    }
    
    // 3. Aria-labelledby text content
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelElements = labelledBy.split(/\s+/).map(id => document.getElementById(id)).filter(Boolean);
      labelElements.forEach(el => labels.push(el.textContent.trim()));
    }
    
    return labels.filter(Boolean);
  }

  /**
   * Perform fuzzy matching between field descriptors and user key
   */
  function scoreMatch(fieldDescriptors, userKey) {
    const cleanUserKey = userKey.toLowerCase().replace(/[^a-z0-9]/g, "");
    let bestScore = 0;

    // Check direct descriptors (name, id, placeholder, labels, etc.)
    for (const desc of fieldDescriptors) {
      if (!desc) continue;
      const cleanDesc = desc.toLowerCase().trim();
      const cleanStrippedDesc = cleanDesc.replace(/[^a-z0-9]/g, "");
      
      // Exact Match
      if (cleanDesc === userKey.toLowerCase().trim() || cleanStrippedDesc === cleanUserKey) {
        return 100;
      }
      
      // Substring Match
      if (cleanDesc.includes(userKey.toLowerCase()) || userKey.toLowerCase().includes(cleanDesc)) {
        bestScore = Math.max(bestScore, 75);
      }
      
      // Fuzzy Substring Match (stripped spaces/symbols)
      if (cleanStrippedDesc.includes(cleanUserKey) || cleanUserKey.includes(cleanStrippedDesc)) {
        bestScore = Math.max(bestScore, 50);
      }
    }

    // Check Synonyms Map
    for (const [standardKey, synonymList] of Object.entries(SYNONYMS)) {
      const userKeyMatchesStandard = (standardKey === userKey.toLowerCase()) || 
                                     synonymList.includes(userKey.toLowerCase().trim());
      
      if (userKeyMatchesStandard) {
        // User key maps to this standard concept.
        // Check if any field descriptor matches any synonym in this list
        for (const desc of fieldDescriptors) {
          if (!desc) continue;
          const cleanDesc = desc.toLowerCase().trim();
          const cleanStrippedDesc = cleanDesc.replace(/[^a-z0-9]/g, "");
          
          for (const syn of synonymList) {
            const cleanSyn = syn.toLowerCase();
            const cleanStrippedSyn = cleanSyn.replace(/[^a-z0-9]/g, "");
            
            if (cleanDesc === cleanSyn || cleanStrippedDesc === cleanStrippedSyn) {
              return 90; // High score for synonym group match
            }
            if (cleanDesc.includes(cleanSyn) || cleanStrippedDesc.includes(cleanStrippedSyn)) {
              bestScore = Math.max(bestScore, 65);
            }
          }
          
          // Also match standard key
          const cleanStandard = standardKey.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (cleanDesc.includes(standardKey) || cleanStrippedDesc.includes(cleanStandard)) {
            bestScore = Math.max(bestScore, 60);
          }
        }
      }
    }

    return bestScore;
  }

  /**
   * Automate filling individual fields
   */
  function fillField(element, value) {
    if (element.tagName === "SELECT") {
      return fillSelect(element, value);
    } else if (element.type === "checkbox") {
      return fillCheckbox(element, value);
    } else if (element.type === "radio") {
      return fillRadio(element, value);
    } else {
      // Standard Text Input, Textarea, Number, Email, Tel, etc.
      element.value = value;
      triggerEvents(element);
      highlightField(element);
      return true;
    }
  }

  /**
   * Select dropdown filling
   */
  function fillSelect(element, value) {
    const cleanValue = value.toLowerCase().trim();
    let bestOption = null;
    let bestScore = 0;

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
      
      // Substring match
      if (optVal.includes(cleanValue) || optText.includes(cleanValue)) {
        bestOption = i;
        bestScore = 50;
      }
    }

    if (bestOption !== null) {
      element.selectedIndex = bestOption;
      triggerEvents(element);
      highlightField(element);
      return true;
    }

    return false;
  }

  /**
   * Checkbox filling
   */
  function fillCheckbox(element, value) {
    const truthyValues = ["true", "yes", "1", "check", "checked", "on"];
    const shouldCheck = truthyValues.includes(String(value).toLowerCase().trim()) || value === true;
    
    if (element.checked !== shouldCheck) {
      element.checked = shouldCheck;
      triggerEvents(element);
      highlightField(element);
      return true;
    }
    return false;
  }

  /**
   * Radio button filling
   */
  function fillRadio(element, value) {
    const cleanVal = String(value).toLowerCase().trim();
    const radioVal = element.value.toLowerCase().trim();
    
    // Check adjacent text/labels
    const labels = getElementLabels(element);
    const labelMatch = labels.some(lbl => lbl.toLowerCase().trim() === cleanVal || lbl.toLowerCase().includes(cleanVal));

    if (radioVal === cleanVal || labelMatch) {
      if (!element.checked) {
        element.checked = true;
        triggerEvents(element);
        highlightField(element);
        return true;
      }
    }
    return false;
  }

  /**
   * Dispatch required DOM events so modern SPA frameworks track state changes
   */
  function triggerEvents(element) {
    // Focus first
    element.focus();
    
    // Fire events
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    
    // Blur to finalize validation
    element.blur();
  }

  /**
   * Highlight automated fields visually to provide premium feedback
   */
  function highlightField(element) {
    const originalOutline = element.style.outline;
    const originalTransition = element.style.transition;
    
    element.style.transition = "outline 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease";
    element.style.outline = "2px solid #00f0ff";
    element.style.boxShadow = "0 0 8px rgba(0, 240, 255, 0.5)";
    
    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.boxShadow = "none";
      setTimeout(() => {
        element.style.transition = originalTransition;
      }, 200);
    }, 1500);
  }

  /**
   * Main driver function
   */
  function performAutofill(data) {
    // Query all potential fillable fields
    const selectors = [
      "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='file']):not([type='image'])",
      "textarea",
      "select"
    ];
    const elements = Array.from(document.querySelectorAll(selectors.join(",")));
    let filledCount = 0;

    // Track which elements have been filled to avoid overwriting double matches
    const filledElements = new Set();

    // Iterate through each extracted key-value pair
    for (const [userKey, userValue] of Object.entries(data)) {
      if (!userValue || String(userValue).trim() === "") continue;

      let bestElement = null;
      let highestScore = 0;

      for (const element of elements) {
        if (filledElements.has(element)) continue;

        // Gather descriptors for this element
        const descriptors = [
          element.getAttribute("id"),
          element.getAttribute("name"),
          element.getAttribute("placeholder"),
          element.getAttribute("autocomplete"),
          element.getAttribute("aria-label"),
          ...getElementLabels(element)
        ];

        // Also check class names by splitting them
        if (element.className && typeof element.className === "string") {
          descriptors.push(...element.className.split(/\s+/));
        }

        const score = scoreMatch(descriptors, userKey);
        if (score > highestScore && score >= 40) { // minimum threshold of 40 for matches
          highestScore = score;
          bestElement = element;
        }
      }

      // If we found a matching element, populate it
      if (bestElement) {
        const success = fillField(bestElement, userValue);
        if (success) {
          filledElements.add(bestElement);
          filledCount++;
        }
      }
    }

    return filledCount;
  }
}
