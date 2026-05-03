from flask import Flask, abort, jsonify, render_template, send_from_directory
from supabase import create_client, Client
import os

app = Flask(__name__)
ASSET_MIME_TYPES = {
    "styles.css": "text/css",
    "main.js": "application/javascript",
    "ui.js": "application/javascript",
    "event.js": "application/javascript",
    "api.js": "application/javascript",
}

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

def fetch_copupons():
    try:
        response = supabase.from_("coupons").select("*").execute()
        return response.data
    except Exception as e:
        print(f"Error occurred while fetching coupons from database: {e}")
        return []

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/<asset_name>")
def assets(asset_name):
    if asset_name not in ASSET_MIME_TYPES:
        abort(404)
    return send_from_directory(
        app.template_folder,
        asset_name,
        mimetype=ASSET_MIME_TYPES[asset_name],
    )

@app.route("/api/coupons")
def get_coupons():
    return jsonify(fetch_copupons())

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
