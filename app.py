from flask import Flask, request, jsonify, send_from_directory
from pathlib import Path
import csv
import re

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / 'transportnagar_all_regions.csv'

app = Flask(__name__, static_folder=str(BASE_DIR / 'static'), static_url_path='')


def normalize_number(num: str) -> str:
    if not num:
        return ''
    return re.sub(r"\D", "", num)


def load_data():
    data = []
    if not CSV_PATH.exists():
        return data
    with CSV_PATH.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            mobile = normalize_number(row.get('mobile',''))
            landline = normalize_number(row.get('landline',''))
            # create a lowercase search blob
            search_blob = ' '.join([str(row.get(col,'')) for col in ['region','category','name','location','contact_person', 'email']]).lower()
            data.append({
                'region': row.get('region',''),
                'category': row.get('category',''),
                'name': row.get('name',''),
                'location': row.get('location',''),
                'contact_person': row.get('contact_person',''),
                'mobile': mobile,
                'landline': landline,
                'email': row.get('email',''),
                'search_blob': search_blob
            })
    return data


DATA = load_data()


@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


@app.route('/')
def index():
    return send_from_directory(str(BASE_DIR / 'static'), 'index.html')


@app.route('/assets/<path:filename>')
def assets(filename):
    # serve files from project root (useful for logo/assets kept alongside CSV)
    return send_from_directory(str(BASE_DIR), filename)


@app.route('/team')
def team_page():
    return send_from_directory(str(BASE_DIR / 'static'), 'team.html')


@app.route('/lookup')
def lookup_page():
    return send_from_directory(str(BASE_DIR / 'static'), 'lookup.html')


@app.route('/api/search')
def api_search():
    q = (request.args.get('q') or '').strip()
    limit = int(request.args.get('limit') or 100)
    if not q:
        return jsonify([])

    q_norm = q.lower()
    q_digits = normalize_number(q)

    results = []
    for item in DATA:
        if q_digits:
            # if query contains digits, match against mobile/landline using contains
            if q_digits in item.get('mobile','') or q_digits in item.get('landline',''):
                results.append(item)
                continue
        # fallback: substring match on searchable text
        if q_norm in item.get('search_blob',''):
            results.append(item)
        if len(results) >= limit:
            break
    return jsonify(results)


@app.route('/api/lookup')
def api_lookup():
    mobile = (request.args.get('mobile') or '').strip()
    if not mobile:
        return jsonify({'error':'mobile param required'}), 400
    m = normalize_number(mobile)
    for item in DATA:
        if item.get('mobile') == m or item.get('landline') == m:
            return jsonify(item)
    return jsonify({}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
