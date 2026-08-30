# ⚡ Smart Form Filler & Clipboard Automation Suite Pro (v1.1.0)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3_Pro-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Playwright](https://img.shields.io/badge/Automation-Playwright_Python-green.svg)](https://playwright.dev/python/)

An intelligent, multi-platform form automation suite that parses unstructured text (chat messages, emails, clipboard snippets), processes bulk CSV/Excel candidate records, and auto-fills complex web forms with customizable fuzzy field matching.

---

## 🌟 Highlights & Advanced Features

- **🧠 Smart Fuzzy Matching Engine**: Automatically maps unstructured fields to form inputs using `name`, `id`, `placeholder`, `aria-label`, class names, and surrounding `<label>` text with comprehensive synonym recognition.
- **🔍 Active Page Form Scanner**: 1-click **Scan Page Form** button inspects all inputs, selects, and checkboxes on the active web page and auto-generates field templates in your sidepanel.
- **📊 Bulk CSV & Dataset Processor**: Upload spreadsheets with 50-500+ records, search candidates, and use **⚡ Fill & Advance Next** for ultra-fast repetitive data entry.
- **⚙️ Customizable Field Mapping Rules**: Add custom synonym aliases (e.g. `nid` -> `voter_id`, `babar_nam` -> `father_name`), custom regex patterns, and export/import rule presets.
- **🔤 Built-in Data Sanitizers & Formatters**:
  - **UPPER**: Instantly uppercase all text (ideal for passports, government forms).
  - **Title Case**: Capitalize names and addresses properly.
  - **Clean Phone**: Format phone numbers cleanly with standard prefixing.
  - **ISO Date**: Automatically convert dates (`DD/MM/YYYY` / `DD-MM-YYYY` -> `YYYY-MM-DD`).
- **⚛️ Modern Web Framework Compatible**: Deep prototype property setters and synthetic DOM events (`input`, `change`, `blur`, `keyup`) ensure React 16+, Angular, Vue 3, Svelte, and Next.js form state managers never overwrite entered data.
- **🎯 Visual HUD & Highlight Feedback**: In-page floating HUD pill and glowing outlines verify filled inputs.
- **💾 Full Backup & Sync**: 1-click JSON export/import of all profiles, datasets, and custom mapping rules.

---

## 📁 Repository Structure

```
├── chrome-extension/       # Manifest V3 Chrome Extension Pro (Side Panel UI)
│   ├── manifest.json       # Extension metadata and permissions
│   ├── sidepanel.html      # 5-Tab Side panel layout (Fill, CSV, Rules, Profiles, Author)
│   ├── sidepanel.js        # Parser, scanner, CSV engine, rules & profile manager
│   ├── sidepanel.css       # Dark glassmorphism styling
│   ├── content-script.js   # In-page DOM inspector, scanner, and framework-safe injector
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

The Chrome Extension opens a persistent **Side Panel** that remains accessible across tabs (`Cmd+Shift+U` / `Ctrl+Shift+U`).

### Installation:
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `chrome-extension/` directory.

### Tab Capabilities:
1. **⚡ Fill & Parse**: Paste chat messages or raw text, click **Extract Fields**, or click **Scan Page Form** to pull all inputs from the current page.
2. **📊 Bulk CSV**: Upload CSV datasets, search candidates, and use **Fill & Advance Next** to fill candidate records sequentially.
3. **⚙️ Custom Rules**: Create your own synonyms and mapping aliases for specialized sites (BOESL, Government portals, Visa applications).
4. **💾 Profiles & Backup**: Save reusable templates, or export/import complete JSON backups.
5. **👨‍💻 Author**: Direct links to social and portfolio profiles.

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

## 👨‍💻 Author & Connect

**Yahia Bin Zaman (Yahia Mahmud)**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yahiabinzaman)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/yahia-mahmud-b4095b354/)
[![Behance](https://img.shields.io/badge/Behance-1769FF?style=for-the-badge&logo=behance&logoColor=white)](https://www.behance.net/yahiamahmud)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/YahiaBinZaman/)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/yahiabinzaman_official/)

- 🐙 **GitHub:** [@yahiabinzaman](https://github.com/yahiabinzaman)
- 💼 **LinkedIn:** [Yahia Mahmud](https://www.linkedin.com/in/yahia-mahmud-b4095b354/)
- 🎨 **Behance:** [yahiamahmud](https://www.behance.net/yahiamahmud)
- 📘 **Facebook:** [YahiaBinZaman](https://www.facebook.com/YahiaBinZaman/)
- 📸 **Instagram:** [@yahiabinzaman_official](https://www.instagram.com/yahiabinzaman_official/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

