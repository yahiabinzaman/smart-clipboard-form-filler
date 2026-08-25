#!/usr/bin/env python3
"""
Smart Form Filler - Standalone Python Automation
Uses Playwright to automate form filling from clipboard or JSON profiles.
"""

import os
import sys
import json
import re
import argparse
import time

# Attempt imports and guide user if missing
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: 'playwright' package is not installed.")
    print("Please run: pip install playwright && playwright install")
    sys.exit(1)

try:
    import pyperclip
except ImportError:
    print("Warning: 'pyperclip' is not installed. Clipboard features will be unavailable.")
    print("Please run: pip install pyperclip")

# Synonym mapping dictionary for fuzzy field matching
SYNONYMS = {
    "first_name": ["fname", "first name", "given name", "forename", "first-name"],
    "last_name": ["lname", "last name", "surname", "family name", "last-name"],
    "name": ["name", "fullname", "full name", "user", "contact name", "display name"],
    "email": ["email", "e-mail", "mail", "email address", "email-address"],
    "phone": ["phone", "tel", "telephone", "mobile", "cell", "contact number", "phone number", "phonenumber"],
    "address": ["address", "street", "location", "residence", "address line 1", "address1", "street address"],
    "address2": ["address line 2", "address2", "apartment", "suite", "unit"],
    "city": ["city", "town", "locality"],
    "state": ["state", "province", "region", "county"],
    "zip": ["zip", "postal", "postcode", "zipcode", "zip code", "postal code"],
    "country": ["country", "nation"],
    "company": ["company", "organization", "org", "employer", "business"],
    "title": ["title", "job title", "role", "designation"],
    "username": ["username", "user name", "login", "handle"],
    "website": ["website", "url", "site", "homepage", "webpage"]
}

def parse_clipboard_text(text):
    """
    Parses unstructured text (like a chat clipboard message) into key-value pairs
    """
    extracted = {}
    if not text:
        return extracted

    separator_regex = re.compile(r'[:=\-]')
    lines = [line.strip() for line in text.splitlines() if line.strip() != ""]
    
    i = 0
    last_key_type = "" # Keeps track of "father", "mother", etc.

    while i < len(lines):
        line = lines[i]
        match = separator_regex.search(line)

        if match:
            idx = match.start()
            raw_key = line[:idx].strip()
            raw_val = line[idx+1:].strip()

            key = re.sub(r'[^a-zA-Z0-9\s_-]', '', raw_key).strip()

            # If value is empty, search next line
            if raw_val == "" and i + 1 < len(lines):
                if not separator_regex.search(lines[i + 1]):
                    raw_val = lines[i + 1]
                    i += 1 # Consume next line

            if key and raw_val:
                lower_key = key.lower()

                if "father" in lower_key:
                    last_key_type = "father"
                elif "mother" in lower_key:
                    last_key_type = "mother"

                if lower_key in ["nid no", "nid", "nid number", "nid no"] and last_key_type:
                    key = last_key_type.upper() + " " + key

                extracted[key] = raw_val
        else:
            # Check if this line is a label keyword and the next line is a value
            label_keywords = [
                "name", "passport", "date of birth", "dob", "nid", "father name",
                "mother name", "gmail", "email", "phone", "passing year", "year"
            ]

            lower_line = line.toLowerCase() if hasattr(line, 'toLowerCase') else line.lower()
            is_known_label = any(keyword in lower_line for keyword in label_keywords)

            if is_known_label and i + 1 < len(lines):
                if not separator_regex.search(lines[i + 1]):
                    key = re.sub(r'[^a-zA-Z0-9\s_-]', '', line).strip()
                    raw_val = lines[i + 1]

                    if key and raw_val:
                        lower_key = key.lower()

                        if "father" in lower_key:
                            last_key_type = "father"
                        elif "mother" in lower_key:
                            last_key_type = "mother"

                        if lower_key in ["nid no", "nid", "nid number", "nid no"] and last_key_type:
                            key = last_key_type.upper() + " " + key

                        extracted[key] = raw_val
                        i += 1 # Consume next line
        i += 1

    # Global Backup Regexes
    # Email
    email_regex = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    emails = email_regex.findall(text)
    if emails and not any(any(x in k.lower() for x in ["email", "gmail"]) for k in extracted.keys()):
        extracted["Email"] = emails[0]

    # Phone
    phone_regex = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
    phones = phone_regex.findall(text)
    if phones and not any("phone" in k.lower() for k in extracted.keys()):
        extracted["Phone"] = phones[0]

    return extracted

def compute_match_score(descriptors, user_key):
    """
    Fuzzy match logic between element descriptors and a key
    """
    clean_user_key = re.sub(r'[^a-z0-9]', '', user_key.lower())
    best_score = 0

    for desc in descriptors:
        if not desc:
            continue
        clean_desc = desc.lower().strip()
        clean_stripped_desc = re.sub(r'[^a-z0-9]', '', clean_desc)

        # Exact Match
        if clean_desc == user_key.lower().strip() or clean_stripped_desc == clean_user_key:
            return 100

        # Substring Match
        if user_key.lower() in clean_desc or clean_desc in user_key.lower():
            best_score = max(best_score, 75)

        # Fuzzy Substring Match
        if clean_user_key in clean_stripped_desc or clean_stripped_desc in clean_user_key:
            best_score = max(best_score, 50)

    # Check Synonyms Map
    for standard_key, synonym_list in SYNONYMS.items():
        user_key_matches_standard = (standard_key == user_key.lower() or 
                                     user_key.lower().strip() in synonym_list)
        
        if user_key_matches_standard:
            # Check descriptors against this synonym list
            for desc in descriptors:
                if not desc:
                    continue
                clean_desc = desc.lower().strip()
                clean_stripped_desc = re.sub(r'[^a-z0-9]', '', clean_desc)

                for syn in synonym_list:
                    clean_syn = syn.lower()
                    clean_stripped_syn = re.sub(r'[^a-z0-9]', '', clean_syn)

                    if clean_desc == clean_syn or clean_stripped_desc == clean_stripped_syn:
                        return 90
                    if clean_syn in clean_desc or clean_stripped_syn in clean_stripped_desc:
                        best_score = max(best_score, 65)

                clean_standard = re.sub(r'[^a-z0-9]', '', standard_key)
                if standard_key in clean_desc or clean_standard in clean_stripped_desc:
                    best_score = max(best_score, 60)

    return best_score

def get_element_labels(page, handle):
    """
    Uses page evaluation to retrieve labels associated with an element handle
    """
    return page.evaluate("""
        (el) => {
            const labels = [];
            if (el.id) {
                const labelFor = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
                if (labelFor) labels.push(labelFor.textContent.trim());
            }
            const parentLabel = el.closest('label');
            if (parentLabel) {
                labels.push(parentLabel.textContent.trim());
            }
            const labelledBy = el.getAttribute('aria-labelledby');
            if (labelledBy) {
                const labelElements = labelledBy.split(/\\s+/).map(id => document.getElementById(id)).filter(Boolean);
                labelElements.forEach(item => labels.push(item.textContent.trim()));
            }
            return labels;
        }
    """, handle)

def fill_field(page, handle, value, delay_ms):
    """
    Fills an element based on its tag and type
    """
    tag_name = handle.evaluate("el => el.tagName")
    type_attr = handle.evaluate("el => el.getAttribute('type')")

    if tag_name == "SELECT":
        # Dropdown selection
        clean_value = str(value).lower().strip()
        options = handle.evaluate("""
            el => Array.from(el.options).map(o => ({ index: o.index, value: o.value, text: o.text }))
        """)
        
        best_idx = None
        for opt in options:
            if opt["value"].lower().strip() == clean_value or opt["text"].lower().strip() == clean_value:
                best_idx = opt["index"]
                break
        
        if best_idx is None:
            # Substring match fallback
            for opt in options:
                if clean_value in opt["value"].lower() or clean_value in opt["text"].lower():
                    best_idx = opt["index"]
                    break
        
        if best_idx is not None:
            handle.select_option(index=best_idx)
            # Dispatch change events
            handle.evaluate("el => { el.dispatchEvent(new Event('change', { bubbles: true })); }")
            return True
            
    elif type_attr == "checkbox":
        # Checkbox selection
        truthy_values = ["true", "yes", "1", "check", "checked", "on"]
        should_check = str(value).lower().strip() in truthy_values or value is True
        
        is_checked = handle.is_checked()
        if is_checked != should_check:
            handle.set_checked(should_check)
            handle.evaluate("el => { el.dispatchEvent(new Event('change', { bubbles: true })); }")
            return True
            
    elif type_attr == "radio":
        # Radio button selection
        radio_value = handle.evaluate("el => el.value").lower().strip()
        clean_value = str(value).lower().strip()
        
        if radio_value == clean_value:
            handle.check()
            handle.evaluate("el => { el.dispatchEvent(new Event('change', { bubbles: true })); }")
            return True
            
    else:
        # Standard input field / textarea
        handle.focus()
        handle.fill("") # Clear first
        # Simulate typing with delays for realistic interaction
        if delay_ms > 0:
            handle.type(str(value), delay=delay_ms)
        else:
            handle.fill(str(value))
        
        # Trigger blur event to mimic human completion
        handle.evaluate("el => { el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); }")
        return True
        
    return False

def highlight_filled_field(handle):
    """
    Highlights filled fields in the browser using script injection
    """
    handle.evaluate("""
        el => {
            const originalOutline = el.style.outline;
            el.style.outline = "2px solid #00f0ff";
            setTimeout(() => { el.style.outline = originalOutline; }, 1500);
        }
    """)

def automate_form(url, data, headless=False, delay_ms=50, submit=False, batch_mode=False):
    """
    Automate page opening, fuzzy matches and fills fields
    """
    print(f"\nStarting form filler automation for: {url}")
    print(f"Loading data: {json.dumps(data, indent=2)}")

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        try:
            # Navigate
            page.goto(url, wait_until="networkidle")
            print("Successfully loaded page.")
            
            # Fetch all form elements
            input_handles = page.query_selector_all("input, textarea, select")
            filled_count = 0
            filled_handles = set()

            for user_key, user_value in data.items():
                if user_value is None or str(user_value).strip() == "":
                    continue

                best_handle = None
                highest_score = 0

                for handle in input_handles:
                    if handle in filled_handles:
                        continue

                    # Filter elements that are not visible or interactive
                    is_hidden = handle.evaluate("""
                        el => {
                            const style = window.getComputedStyle(el);
                            return style.display === 'none' || style.visibility === 'hidden' || el.type === 'hidden';
                        }
                    """)
                    if is_hidden:
                        continue

                    type_attr = handle.evaluate("el => el.getAttribute('type')")
                    if type_attr in ["submit", "button", "reset", "file", "image"]:
                        continue

                    # Build descriptor list
                    descriptors = [
                        handle.evaluate("el => el.getAttribute('id')"),
                        handle.evaluate("el => el.getAttribute('name')"),
                        handle.evaluate("el => el.getAttribute('placeholder')"),
                        handle.evaluate("el => el.getAttribute('autocomplete')"),
                        handle.evaluate("el => el.getAttribute('aria-label')")
                    ]
                    
                    # Fetch labels
                    labels = get_element_labels(page, handle)
                    descriptors.extend(labels)

                    # Fetch classes
                    classes = handle.evaluate("el => el.className")
                    if classes and isinstance(classes, str):
                        descriptors.extend(classes.split())

                    # Calculate scoring
                    score = compute_match_score(descriptors, user_key)
                    if score > highest_score and score >= 40:
                        highest_score = score
                        best_handle = handle

                # Fill the identified element
                if best_handle:
                    success = fill_field(page, best_handle, user_value, delay_ms)
                    if success:
                        filled_handles.add(best_handle)
                        highlight_filled_field(best_handle)
                        filled_count += 1
                        print(f"-> Filled field for '{user_key}' with value '{user_value}'")

            print(f"\nAutofill completed. Filled {filled_count} field(s).")

            if submit:
                print("Submitting the form as requested...")
                # Search for submit button or submit form
                submit_btn = page.query_selector("input[type='submit'], button[type='submit']")
                if submit_btn:
                    submit_btn.click()
                    page.wait_for_load_state("networkidle")
                    print("Form submitted successfully!")
                else:
                    print("No explicit submit button found. Trying form submit...")
                    page.evaluate("if(document.forms.length > 0) document.forms[0].submit();")
                    page.wait_for_load_state("networkidle")
                    print("Form submitted via JS submit()!")

            # Review step
            if not headless:
                if batch_mode:
                    print("\n[BATCH MODE ACTIVE]")
                    input("--> Verify details, upload photos/passports, submit, then press [Enter] in this terminal to load the next record...")
                else:
                    print("\nKeep browser open for 15 seconds to review the filled form...")
                    time.sleep(15)

        except Exception as e:
            print(f"An error occurred during form filling: {e}")
        finally:
            browser.close()

def main():
    import csv

    parser = argparse.ArgumentParser(description="Smart form-filling automation using Playwright.")
    parser.add_argument("--url", required=True, help="URL of the form webpage to automate")
    parser.add_argument("--data", help="Path to JSON profile file (e.g. config.json)")
    parser.add_argument("--clipboard", action="store_true", help="Extract profile data directly from system clipboard")
    parser.add_argument("--csv", help="Path to CSV file with multiple profile records")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode (no GUI visual window)")
    parser.add_argument("--submit", action="store_true", help="Auto-submit the form after filling")
    parser.add_argument("--delay", type=int, default=50, help="Simulated keyboard keystroke delay in ms")

    args = parser.parse_args()

    # Batch CSV Mode
    if args.csv:
        if not os.path.exists(args.csv):
            print(f"Error: CSV file not found at '{args.csv}'")
            sys.exit(1)
        
        records = []
        try:
            with open(args.csv, mode='r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    clean_row = {}
                    for k, v in row.items():
                        if k:
                            clean_key = re.sub(r'[^a-zA-Z0-9\s_-]', '', k).strip()
                            clean_row[clean_key] = v if v else ""
                    records.append(clean_row)
        except Exception as e:
            print(f"Error reading CSV file: {e}")
            sys.exit(1)

        if not records:
            print("Error: CSV file is empty or missing valid rows.")
            sys.exit(1)

        print(f"Loaded {len(records)} records from CSV.")
        for idx, record in enumerate(records):
            # Try to identify record name for display
            rec_name = "Record"
            for name_field in ["name", "fullname", "full name", "user", "username"]:
                found_key = next((k for k in record.keys() if k.lower() == name_field), None)
                if found_key and record[found_key]:
                    rec_name = record[found_key]
                    break
            
            print(f"\n==========================================")
            print(f"PROCESSING RECORD {idx + 1} OF {len(records)}: {rec_name}")
            print(f"==========================================")
            
            automate_form(
                url=args.url,
                data=record,
                headless=args.headless,
                delay_ms=args.delay,
                submit=args.submit,
                batch_mode=True
            )
        
        print("\nAll CSV records processed successfully!")
        sys.exit(0)

    # Single Record Mode (JSON or Clipboard)
    form_data = {}

    if args.clipboard:
        try:
            clipboard_text = pyperclip.paste()
            if not clipboard_text:
                print("Error: Clipboard is empty.")
                sys.exit(1)
            print("Reading and parsing text from clipboard...")
            form_data = parse_clipboard_text(clipboard_text)
            if not form_data:
                print("Error: Could not extract any key-value fields from clipboard text.")
                print(f"Raw clipboard content was:\n{clipboard_text}")
                sys.exit(1)
        except NameError:
            print("Error: Clipboard access is unavailable because 'pyperclip' package is missing.")
            sys.exit(1)
    elif args.data:
        if not os.path.exists(args.data):
            print(f"Error: Profile file not found at '{args.data}'")
            sys.exit(1)
        try:
            with open(args.data, "r") as f:
                form_data = json.load(f)
        except json.JSONDecodeError:
            print("Error: Profile file contains invalid JSON data.")
            sys.exit(1)
    else:
        print("Error: You must specify either --data <file.json>, --clipboard, or --csv <file.csv>.")
        sys.exit(1)

    automate_form(
        url=args.url,
        data=form_data,
        headless=args.headless,
        delay_ms=args.delay,
        submit=args.submit,
        batch_mode=False
    )

if __name__ == "__main__":
    main()
