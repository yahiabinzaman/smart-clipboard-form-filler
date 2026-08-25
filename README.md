# Smart Form Filler & Clipboard Automation Suite

This workspace contains two solutions for automating form-filling from structured profiles or raw clipboard text (e.g. chat messages):

1. **[Chrome Extension (Smart Clipboard Form Filler)](file:///Users/colorlab/Downloads/Arman%20Vai%20automation/chrome-extension/)**: A browser extension that runs in a Side Panel. Perfect for interactive, real-time filling as you browse.
2. **[Python Automation (Playwright Form Filler)](file:///Users/colorlab/Downloads/Arman%20Vai%20automation/python-automation/)**: A standalone Python CLI command that runs Playwright in headful or headless browser automation mode.

---

## 1. Chrome Extension (Recommended for Chat Clipboard)

The Chrome Extension uses a **Side Panel** which stays open as you change tabs. You can paste raw text (like a chat with details), and it extracts keys/values, showing them in an editable list. With one click, it fills the form fields of the current web page.

### Installation:
1. Open Google Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the `chrome-extension` folder in this workspace.

### Usage:
1. Click the extension icon in your Chrome toolbar.
2. The **Smart Form Filler** panel will open on the side of your window.
3. Paste any text (e.g. *"Name: John Doe, Email: john@example.com..."*) into the textarea.
4. Click **Extract Fields** (or it extracts automatically on paste).
5. Tweak any values in the list.
6. Click **Auto-Fill Active Tab**.

*Tip: You can save sets of fields as "Profiles" using the dropdown at the bottom, so you can re-use them later without copy-pasting.*

---

## 2. Python Automation Script

For programmatic browser automation. It opens a browser, matches inputs, and completes forms automatically.

### Installation:
```bash
cd python-automation
pip install -r requirements.txt
playwright install
```

### Usage:
- **Using a JSON file**:
  ```bash
  python form_filler.py --url "https://example.com/form" --data config.json
  ```
- **Using clipboard content**:
  ```bash
  # First copy your profile text or chat details, then run:
  python form_filler.py --url "https://example.com/form" --clipboard
  ```

---

## Technical Features (Both Solutions)
- **Fuzzy Match Engine:** Matches keys using name, id, placeholder, class name, ARIA labels, and associated `<label>` tag text, combined with preset synonyms (e.g. `first name` matches `fname`, `given name`).
- **Modern Framework Support:** Triggers native DOM events (`input`, `change`, `blur`) so form states in React, Angular, Vue, and Svelte update properly.
- **Visual Highlights:** Highlights filled fields in the browser with a glowing blue border so you can verify what was automated.
