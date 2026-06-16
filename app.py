import os
import re
import time
import requests
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Cache configuration: 10 minutes cache
CACHE_DURATION = 600  # seconds
cache = {
    "data": None,
    "last_fetched": 0
}

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.convert_charrefs = True
        self.text = []
    def handle_data(self, d):
        self.text.append(d)
    def get_data(self):
        return ''.join(self.text)

def strip_html_tags(html):
    if not html:
        return ""
    # Standardize whitespace slightly
    html = re.sub(r'\s+', ' ', html)
    # Strip HTML tags
    s = HTMLStripper()
    s.feed(html)
    text = s.get_data().strip()
    # Replace multiple spaces
    text = re.sub(r' +', ' ', text)
    return text

def parse_html_content(content_html):
    """
    Splits the HTML content of a feed entry by its <h3> tags.
    Returns a list of dicts with keys: category, content_html, content_text.
    """
    pattern = re.compile(r'<h3>(.*?)</h3>', re.IGNORECASE)
    matches = list(pattern.finditer(content_html))
    
    updates = []
    if not matches:
        # Fallback if no h3 tags are present
        updates.append({
            "category": "Update",
            "content_html": content_html.strip(),
            "content_text": strip_html_tags(content_html)
        })
        return updates
        
    for idx, match in enumerate(matches):
        category = match.group(1).strip()
        start_pos = match.end()
        end_pos = matches[idx + 1].start() if idx + 1 < len(matches) else len(content_html)
        update_content = content_html[start_pos:end_pos].strip()
        updates.append({
            "category": category,
            "content_html": update_content,
            "content_text": strip_html_tags(update_content)
        })
    return updates

def fetch_and_parse_feed():
    print(f"Fetching fresh data from: {FEED_URL}")
    response = requests.get(FEED_URL, timeout=15)
    response.raise_for_status()
    
    root = ET.fromstring(response.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = root.findall('atom:entry', ns)
    notes = []
    
    for entry in entries:
        title = entry.find('atom:title', ns).text
        date_iso = entry.find('atom:updated', ns).text
        
        # Link extraction
        link_el = entry.find('atom:link', ns)
        link = link_el.attrib.get('href') if link_el is not None else "https://cloud.google.com/bigquery/docs/release-notes"
        
        # Content HTML extraction
        content_el = entry.find('atom:content', ns)
        content_html = content_el.text if content_el is not None else ""
        
        # Split daily entry into individual updates
        individual_updates = parse_html_content(content_html)
        
        for idx, update in enumerate(individual_updates):
            unique_id = f"{date_iso}_{idx}"
            # Clean up the ID to be alphanumeric and safe for JS selectors
            clean_id = re.sub(r'[^a-zA-Z0-9]', '_', unique_id)
            
            notes.append({
                "id": clean_id,
                "date": title,
                "date_iso": date_iso,
                "category": update["category"],
                "content_html": update["content_html"],
                "content_text": update["content_text"],
                "link": link
            })
            
    return notes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    force_refresh = request.args.get('force', 'false').lower() == 'true'
    current_time = time.time()
    
    if force_refresh or not cache["data"] or (current_time - cache["last_fetched"] > CACHE_DURATION):
        try:
            notes = fetch_and_parse_feed()
            cache["data"] = notes
            cache["last_fetched"] = current_time
            source = "network"
        except Exception as e:
            print(f"Error fetching feed: {e}")
            if cache["data"]:
                # Serve stale cache on network failure
                return jsonify({
                    "status": "warning",
                    "message": f"Could not refresh feed. Showing cached data from {time.ctime(cache['last_fetched'])}.",
                    "notes": cache["data"],
                    "source": "stale_cache"
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Failed to fetch release notes: {str(e)}"
                }), 500
    else:
        source = "cache"
        notes = cache["data"]
        
    return jsonify({
        "status": "success",
        "source": source,
        "notes_count": len(notes),
        "last_fetched": time.ctime(cache["last_fetched"]),
        "notes": notes
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
