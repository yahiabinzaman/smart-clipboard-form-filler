# Smart Form Filler - Python Automation

A standalone command-line automation script that reads form-profile data (either from a JSON file or parsed directly from your clipboard) and uses **Playwright** to load a browser, find inputs, and automate the form filling.

## Installation

1. Make sure Python 3 is installed.
2. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Install Playwright browser drivers:
   ```bash
   playwright install
   ```

## Usage

The script supports filling forms from either a saved JSON configuration file or directly from your clipboard (where you can copy any chat conversation containing your profile details).

### Option A: Automate using a JSON Profile
Create a profile (like the sample `config.json` provided) and run:
```bash
python form_filler.py --url "https://example.com/contact-form" --data config.json
```

### Option B: Automate using Clipboard Text (e.g. Chat Messages)
Copy a chat transcript or clipboard text containing your profile details (e.g., *"Name: John Doe, Email: john@example.com, Phone: +1 555 0199"*), then run:
```bash
python form_filler.py --url "https://example.com/contact-form" --clipboard
```

### Additional Flags
* `--headless`: Run the browser in the background (headless mode, no UI displayed).
* `--submit`: Auto-submit the form as soon as it's done filling.
* `--delay <ms>`: Delay (in milliseconds) between key presses to simulate human-like typing (default: `50ms`).

## How it Works
The script queries all visible inputs, selects, and textareas on the webpage. It extracts labels, names, IDs, placeholders, classes, and ARIA labels. It computes a similarity score for each field against the profile keys and populates the best-matching input.
After filling, it fires the DOM events (`input`, `change`, `blur`) to satisfy validation on SPA sites (React/Angular/Vue).
