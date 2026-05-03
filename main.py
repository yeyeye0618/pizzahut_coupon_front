from flask import Flask, jsonify, render_template, send_from_directory
from supabase import create_client, Client
import os

app = Flask(__name__)

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

@app.route("/styles.css")
def styles():
    return send_from_directory(app.template_folder, "styles.css", mimetype="text/css")

@app.route("/api/coupons")
def get_coupons():
    return jsonify(fetch_copupons())

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
