# BigQuery Release Notes Hub & Social Composer

A beautiful, premium web application built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript**. This application fetches the Google Cloud BigQuery Release Notes RSS/Atom feed, parses individual updates, and provides a polished dashboard to search, filter, and share specific updates directly to X (Twitter).

## Features

- **Dynamic Feed Fetching & Parsing**: Pulls the official Google Cloud BigQuery release notes XML feed in real-time.
- **Granular Update Splitting**: Splits composite daily release notes into individual, selectable update cards (e.g. features, issues, changes).
- **Interactive Composer**: Select an update to preview and edit in a built-in Twitter (X) composer modal.
- **Character Count Progress Ring**: Circular indicator matching Twitter's UI that updates in real-time, warning you when nearing or exceeding 280 characters.
- **Custom Accents & Styling**: Gorgeous, glassmorphic layout supporting both Light and Dark mode options with local storage persistence.
- **Dynamic Category Filtering**: Dynamically aggregates available categories (e.g. Feature, Deprecation, Issue, Change) and displays live counts.
- **Keyword Search with Text Highlighting**: Highlight matching query strings in real-time in card descriptions and dates.
- **Smart Cache & Refresh**: 10-minute server-side memory caching to protect Google Cloud API rate limits. Bypassed instantly when you click the refresh spinner button.
- **Toast Notifications**: Interactive status notifications for all API states.

## Project Structure

```
bigquery_release_notes_app/
├── app.py                     # Flask server with feed parsing and caching
├── templates/
│   └── index.html             # Clean semantic HTML interface
├── static/
│   ├── css/
│   │   └── style.css          # Core design system stylesheet
│   └── js/
│       └── app.js             # Client-side interactive controller
└── venv/                      # Python virtual environment (dependencies)
```

## How to Run

1. Open a terminal and navigate to this directory:
   ```bash
   cd "C:\Users\shaik samiuddin\bigquery_release_notes_app"
   ```

2. Activate the virtual environment:
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - On Windows (Command Prompt):
     ```cmd
     .\venv\Scripts\activate.bat
     ```

3. Run the Flask application:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

5. Enjoy the beautiful Dashboard! Select an update and click **Tweet Update** to share it.
