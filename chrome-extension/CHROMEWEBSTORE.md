# Chrome Web Store Listing — Smart Clipboard Form Filler

> Last Updated: 2026-07-07

## Store Listing

**Extension Name** [REQUIRED]
Smart Clipboard Form Filler

**Short Description** [REQUIRED]
Autofills web forms from chat history or clipboard text using smart fuzzy matching.

**Detailed Description** [REQUIRED]
Smart Clipboard Form Filler helps you automate the tedious task of completing web forms by parsing unstructured text (like chat history, support transcripts, or notes) and automatically injecting the fields onto the active webpage.

Simply copy your text details, paste them into the side panel, and click "Auto-fill". The extension reads the page elements, uses fuzzy matching to map details to inputs, selects, and textareas, and fills them in.

Key Features:
- Convenient side panel that stays open as you browse and switch tabs.
- Smart regex parser that extracts name, email, phone, address, and custom fields from unstructured text.
- Interactive list to edit, delete, or manually add fields before filling.
- Save details as reuseable profiles (e.g. personal profiles, client records, shipping templates).
- Full support for modern JavaScript frameworks (React, Vue, Angular) by dispatching proper DOM events on inputs.
- Safe and local execution — no data leaves your browser.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Autofills form fields on web pages using key-value pairs parsed from clipboard text.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |

### Screenshot Notes
- **Screenshot 1:** Display the side panel open alongside a sample web contact form, highlighting parsed key-value pairs matching the form fields.
- **Screenshot 2:** Visual showing how fields are highlighted in blue outlines when automated.
- **Screenshot 3:** Close-up of the "Saved Profiles" dropdown demonstrating multiple configurations.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `sidePanel` | permissions | Required to display the extension interface persistently as the user navigates tabs. |
| `tabs` | permissions | Required to obtain information (URLs) of the current active tab and identify safe target domains. |
| `scripting` | permissions | Required to inject the helper DOM filler script into the active tab to execute the form-filling automation. |
| `storage` | permissions | Required to save user-defined profile presets locally on-device. |
| `<all_urls>` | host_permissions | Required to execute the autofill scripts on whichever webpage the user chooses to automate. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

All operations are run strictly locally. Clipboard text is parsed in-memory and form-filling scripts run inside the active browser sandbox. No data is stored externally, collected, or transmitted over the internet.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
Not applicable (No data collected or stored off-device)

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

## Developer Info

**Publisher Name**
Colorlab Studios

**Contact Email**
arman@example.com

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-07-07 | Initial release of Chrome Extension with Side Panel UI and local fuzzy-match parser. | Draft |

## Review Notes

### Known Issues / Limitations
- Does not autofill fields embedded within nested cross-origin `iframe` elements due to browser security restrictions.
