# TransportNagar Lookup (Truecaller-like) — Minimal Prototype

This small prototype provides a searchable interface for `transportnagar_all_regions.csv`.

What it includes
- `app.py`: Flask backend that loads the CSV on startup and exposes two endpoints:
  - `GET /api/search?q=...` — substring search across name, location, category, region, contact person, email and mobile contains
  - `GET /api/lookup?mobile=...` — exact-match lookup on mobile or landline
- `static/index.html`: simple UI to search and lookup numbers
- `requirements.txt`: minimal Python dependency list

Run locally (PowerShell)

```powershell
cd 'd:\Gatician features'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000/ in your browser. The app reads `transportnagar_all_regions.csv` from the same folder.

Integration notes
- The backend sets a permissive CORS header so you can call the `/api` endpoints from another origin.
- To integrate into your website, either:
  - Host this Flask app and call the endpoints from your site, or
  - Export a subset of the CSV to JSON and embed a static JS lookup if you prefer no backend.

Next steps I can help with
- Add fuzzy matching / ranking
- Protect the API (rate-limiting, API keys)
- Provide a Dockerfile to containerize the app
