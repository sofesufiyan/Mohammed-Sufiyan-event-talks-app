# BigQuery Release Notes Hub & Social Composer

[![GitHub Repository](https://img.shields.io/badge/GitHub-Mohammed--Sufiyan--event--talks--app-blue?logo=github)](https://github.com/sofesufiyan/Mohammed-Sufiyan-event-talks-app)

A beautiful, premium web application built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript**. This application fetches the Google Cloud BigQuery Release Notes RSS/Atom feed, parses individual updates, and provides a polished dashboard to search, filter, and share specific updates directly to X (Twitter).

---

## 🚀 Key Features

* **Dynamic Feed Fetching & Parsing:** Pulls the official Google Cloud BigQuery release notes XML feed in real-time.
* **Granular Update Splitting:** Automatically splits unified daily release entries (grouped by date) into separate, selectable update cards using `<h3>` tags to distinguish between different categories (e.g., Feature, Change, Deprecated).
* **Smart Cache & Resilient Fallback:** Implements a 10-minute server-side memory caching mechanism to optimize feed retrieval and prevent API rate-limiting. In case of network errors, it gracefully falls back to serving stale cached data.
* **Dynamic Category Filtering:** Scans notes dynamically to build filter tabs on-the-fly, displaying live counts for each category (e.g., Feature, Bug Fix, Deprecated).
* **Keyword Search with Highlighting:** Offers a debounced text search that matches queries across titles, categories, and descriptions, highlighting matches in real-time.
* **Integrated Social Composer Modal:** Allows users to select any card and open a tweet composer populated with template content, quick-add hashtags, character limit validation (280 characters), and an interactive SVG Circular Progress ring.
* **Elegant Responsive Design:** Full support for both Light and Dark mode using custom CSS variables, persisting choices via `localStorage`.

---

## 📁 Project Structure

```text
bigquery_release_notes_app/
├── app.py                     # Flask server with feed parsing, stripping, and caching
├── requirements.txt           # Project dependencies (Flask and requests)
├── .gitignore                 # Configured git exclusions for venv, secrets, and caches
├── templates/
│   └── index.html             # UI layout and structural HTML
├── static/
│   ├── css/
│   │   └── style.css          # Design system, CSS variables, and layout styles
│   └── js/
│       └── app.js             # Client-side state manager and dynamic DOM builder
└── venv/                      # Local Python virtual environment
```

---

## 🛠️ How to Run Locally

### Prerequisites
* Python 3.8 or higher
* Git (optional)

### Setup Instructions

1. **Navigate to the Directory:**
   ```bash
   cd "C:\Users\shaik samiuddin\bigquery_release_notes_app"
   ```

2. **Activate the Virtual Environment:**
   * **On Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **On Windows (Command Prompt):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the Flask Server:**
   ```bash
   python app.py
   ```

5. **Access the Hub:**
   Open your browser and navigate to:
   [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🌐 GitHub Integration

This repository is hosted on GitHub:
👉 [https://github.com/sofesufiyan/Mohammed-Sufiyan-event-talks-app](https://github.com/sofesufiyan/Mohammed-Sufiyan-event-talks-app)

To push local modifications:
```powershell
git add .
git commit -m "Commit message"
git push
```
