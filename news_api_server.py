from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

NEWSAPI_KEY = "e0a7c73f5dfe49ec8b4061e085d73ec8"
GNEWS_KEY = "a2eb63380a75f0c1fe3e20b1963bc278"

@app.route("/api/newsapi")
def get_newsapi():
    page = request.args.get("page", 1)
    page_size = request.args.get("pageSize", 3)
    url = f"https://newsapi.org/v2/everything?q=artificial%20intelligence&pageSize={page_size}&page={page}&sortBy=publishedAt&apiKey={NEWSAPI_KEY}"
    r = requests.get(url)
    return jsonify(r.json())

@app.route("/api/gnews")
def get_gnews():
    page = request.args.get("page", 1)
    max_results = request.args.get("max", 3)
    url = f"https://gnews.io/api/v4/search?q=AI&lang=en&max={max_results}&page={page}&token={GNEWS_KEY}"
    r = requests.get(url)
    return jsonify(r.json())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

