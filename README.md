# ⚡ Smart Form Filler & Clipboard Automation Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Playwright](https://img.shields.io/badge/Automation-Playwright_Python-green.svg)](https://playwright.dev/python/)

An intelligent, multi-platform form automation suite that parses unstructured text (chat messages, emails, clipboard snippets) and auto-fills complex web forms with smart fuzzy field matching.

---

## 🌟 Highlights

- **🧠 Smart Fuzzy Matching Engine**: Automatically maps unstructured fields to form inputs using `name`, `id`, `placeholder`, `aria-label`, class names, and surrounding `<label>` text with comprehensive synonym recognition.
- **🌐 Dual Architecture**:
  - **Chrome Extension (Side Panel)**: Interactive, on-the-fly form filling directly in your browser.
  - **Python Automation (Playwright CLI)**: Headless or headful batch automation for repetitive registrations and tasks.
- **⚛️ Modern Web Framework Compatible**: Triggers native DOM events (`input`, `change`, `blur`, `compositionend`) to ensure React, Angular, Vue, Svelte, and Next.js form state managers sync correctly.
- **🎯 Visual Verification**: Highlights successfully populated fields with visual cues so you can review before submission.

---

## 📁 Repository Structure

```
├── chrome-extension/       # Manifest V3 Chrome Extension (Side Panel UI)
│   ├── manifest.json       # Extension metadata and permissions
│   ├── sidepanel.html      # Side panel layout
│   ├── sidepanel.js        # Parser, field extractor, and profile manager
│   ├── content-script.js   # In-page DOM inspector and autofill injector
│   └── icons/              # Extension icons
├── python-automation/      # Standalone Playwright Python automation
│   ├── form_filler.py      # Core CLI automation script
│   ├── config.json         # Example profile data
│   └── requirements.txt    # Python dependencies
├── mock-boesel/            # Mock multi-step registration portal for local testing
├── demo_form.html          # Interactive HTML demo form
└── README.md
```

---

## 🚀 1. Chrome Extension (Interactive Side Panel)

The Chrome Extension opens a persistent **Side Panel** that remains accessible across tabs.

### Installation:
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `chrome-extension/` directory.

### How to Use:
1. Click the extension icon in your Chrome toolbar to open the Side Panel.
2. Paste unstructured text (e.g. from WhatsApp, email, or a document):
   ```
   Name: John Doe
   Email: john.doe@example.com
   Phone: +1 555-0199
   Address: 123 Automation Way
   ```
3. The parser extracts recognized fields into an editable key-value list.
4. Click **Auto-Fill Active Tab** to populate the form on the current web page.
5. Save frequently used values as **Profiles** for one-click reuse.

---

## 🐍 2. Python Automation (Playwright CLI)

Designed for programmatic and bulk form submission tasks.

### Installation:
```bash
cd python-automation
pip install -r requirements.txt
playwright install
```

### Usage:
- **Using a JSON configuration file:**
  ```bash
  python form_filler.py --url "https://example.com/registration" --data config.json
  ```

- **Using Clipboard text directly:**
  ```bash
  # Copy text to clipboard, then run:
  python form_filler.py --url "https://example.com/registration" --clipboard
  ```

---

## ⚙️ Matching Engine Capabilities

| Field Type | Supported Synonyms & Attributes |
| :--- | :--- |
| **Personal Info** | First Name, Last Name, Full Name, DOB, Age, Gender, NID, Passport |
| **Contact Info** | Email, Phone / Mobile, WhatsApp, Fax |
| **Location** | Address, City, State / Division, Postal / Zip Code, Country |
| **Professional** | Organization, Company, Job Title, Designation, Passing Year, Institution |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
