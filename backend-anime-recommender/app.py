from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import html
import pickle
import requests
from fuzzywuzzy import process
import os
import re
import time # Added for Jikan rate limiting

app = Flask(__name__)
CORS(app)

print("Loading ML model & data...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

try:
    with open(os.path.join(MODEL_DIR, "similarity_matrix.pkl"), "rb") as f:
        similarity_matrix = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "Tfidf_vectorizer.pkl"), "rb") as f:
        vectorizer = pickle.load(f)
    df = pd.read_pickle(os.path.join(MODEL_DIR, "anime_data.pkl"))
    all_titles = df["Name"].tolist()
    print("Successfully loaded all files")
except FileNotFoundError:
    print("Error: ML model files not found. Please run train_model.py first.")
    exit()

# --- HELPER FUNCTIONS ---
def clean_title(title):
    title = html.unescape(title)
    title = re.sub(r'^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$', '', title)
    title = title.strip().lower()
    return title

def clean_record(d):
    """Replace NaN / None with JSON-safe defaults so jsonify() never emits invalid JSON."""
    cleaned = {}
    for k, v in d.items():
        try:
            is_nan = pd.isna(v)
        except (TypeError, ValueError):
            is_nan = False

        if is_nan:
            if k in ("Genres", "Synopsis", "Name", "Image_URL"):
                cleaned[k] = ""
            elif k == "Score":
                cleaned[k] = 0.0
            elif k == "Episodes":
                cleaned[k] = 0
            else:
                cleaned[k] = None
        else:
            # Convert numpy scalars to native Python types so json.dumps never chokes
            if hasattr(v, "item"):
                cleaned[k] = v.item()
            else:
                cleaned[k] = v
    return cleaned

def find_indices_fuzzy(titles):
    matched_indices = []
    for title in titles:
        cleaned = clean_title(title)
        result = process.extractOne(cleaned, all_titles)
        if result is None:
            continue
        match, score = result[0], result[1]
        if score >= 65:
            idx = all_titles.index(match)
            matched_indices.append(idx)
    return list(set(matched_indices))

def get_recommendations_from_indices(watched_indices, n=10):
    if not watched_indices:
        return []
    avg_sim = similarity_matrix[watched_indices].mean(axis=0)
    sim_scores = sorted(enumerate(avg_sim), key=lambda x: x[1], reverse=True)

    # Collect raw scores first (excluding watched)
    raw_recs = []
    for idx, score in sim_scores:
        if idx not in watched_indices:
            raw_recs.append((idx, score))
        if len(raw_recs) >= n:
            break

    if not raw_recs:
        return []

    recs = []
    for idx, score in raw_recs:
        anime = clean_record(df.iloc[idx].to_dict())
        # Real blended similarity score (genre 60% / synopsis 30% / score 10%),
        # already bounded in [0, 1] by train_model.py's cosine similarities.
        anime["similarity_score"] = round(float(max(0.0, min(1.0, score))), 4)
        recs.append(anime)

    return recs

def fetch_all_mal_pages(username):
    """
    Get a user's completed anime directly from the official MyAnimeList API.
    This removes the Jikan dependency that was causing the 504 errors.
    """
    # Public client identifier used for public MAL API data.
    # If you register your own MAL API application, set MAL_CLIENT_ID
    # in Render and it will automatically be used instead.
    mal_client_id = os.environ.get(
        "MAL_CLIENT_ID",
        "6114d00ca681b7701d1e15fe11a4987e"
    )

    url = f"https://api.myanimelist.net/v2/users/{username}/animelist"

    headers = {
        "X-MAL-Client-ID": mal_client_id,
        "Accept": "application/json",
        "User-Agent": "Anime-Recommender/1.0"
    }

    params = {
        "status": "completed",
        "limit": 1000,
        "offset": 0,
        "fields": "node{title}"
    }

    titles = []

    while True:
        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=20
        )

        if response.status_code == 404:
            raise requests.exceptions.HTTPError(response=response)

        if response.status_code == 429:
            print("MAL rate limit hit. Waiting 5 seconds...")
            time.sleep(5)
            continue

        if response.status_code in (401, 403):
            raise RuntimeError(
                "MyAnimeList denied access to this public list. "
                "The user's anime list may be private."
            )

        response.raise_for_status()

        payload = response.json()
        entries = payload.get("data", [])

        for entry in entries:
            node = entry.get("node", {})
            title = node.get("title")
            if title:
                titles.append(title)

        # MAL supplies the next page URL when more results exist.
        next_url = payload.get("paging", {}).get("next")

        if not next_url:
            break

        url = next_url
        params = {}

        time.sleep(0.5)

    return titles

# --- API ENDPOINTS ---
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "Backend is working!"})

@app.route('/api/recommend', methods=['GET'])
def recommend_by_title():
    try:
        title = request.args.get('title', '').strip()
        n = int(request.args.get('n', 10))
        if not title:
            return jsonify({"error": "Query parameter 'title' is required"}), 400  

        result = process.extractOne(clean_title(title), all_titles)  
        if result is None or result[1] < 65:
            return jsonify({"error": f"Could not find '{title}' in the database"}), 404

        matched_title, score = result[0], result[1]
        idx = all_titles.index(matched_title)
        recs = get_recommendations_from_indices([idx], n=n)
        
        return jsonify({
            "matched_title": matched_title,
            "match_score": score,
            "recommendations": recs
        })
    except Exception as e:
        # Prevents HTML errors from crashing React
        return jsonify({"error": str(e)}), 500

@app.route('/api/recommend-multi', methods=['GET'])
def recommend_by_multiple_titles():
    """Takes up to several comma-separated anime titles (used by the
    'Initialize Recommender Engine' quickstart modal, which asks for 4)
    and returns recommendations blended across all of them. Purely
    additive endpoint — reuses the same helpers as /api/recommend,
    /api/anilist and /api/mal."""
    try:
        titles_param = request.args.get('titles', '').strip()
        n = int(request.args.get('n', 12))
        if not titles_param:
            return jsonify({"error": "Query parameter 'titles' is required"}), 400

        titles = [t.strip() for t in titles_param.split(',') if t.strip()]
        if not titles:
            return jsonify({"error": "No valid titles provided"}), 400

        indices = find_indices_fuzzy(titles)
        if not indices:
            return jsonify({"error": "None of those titles matched our database"}), 404

        return jsonify({
            "titles_submitted": len(titles),
            "titles_matched": len(indices),
            "recommendations": get_recommendations_from_indices(indices, n=n)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/anilist', methods=['GET'])
def sync_anilist():
    username = request.args.get('username', '').strip()
    n = int(request.args.get('n', 10))
    if not username:
        return jsonify({"error": "Query parameter 'username' is required"}), 400

    query = '''
    query ($name: String) {
        MediaListCollection(userName: $name, type: ANIME, status: COMPLETED) {
            lists {
                entries {
                    media {
                        title {
                            romaji
                            english
                        }
                    }
                }
            }
        }
    }
    '''
    try:
        response = requests.post(
            'https://graphql.anilist.co',
            json={'query': query, 'variables': {'name': username}},
            timeout=10
        )
        
        # Check if AniList returned an HTTP error (like 400 or 500)
        if response.status_code != 200:
            print(f"ANILIST HTTP ERROR: {response.status_code} - {response.text}")
            return jsonify({"error": f"AniList API returned HTTP {response.status_code}"}), 500

        data = response.json()


        if "errors" in data:
            error_msg = data["errors"][0].get("message", "Unknown GraphQL error")
            print(f"ANILIST GRAPHQL ERROR: {error_msg}")
            return jsonify({"error": f"AniList error: {error_msg}"}), 400


        data_obj = data.get("data")
        if not data_obj:
            return jsonify({"error": f"AniList user '{username}' not found or has no data."}), 404

        media_collection = data_obj.get("MediaListCollection")
        if not media_collection:
            return jsonify({"error": f"AniList user '{username}' not found, has no completed anime, or their list is private."}), 404

        external_titles = []
    
        for list_obj in media_collection.get("lists", []):
            if not list_obj: continue
            for entry in list_obj.get("entries", []):
                if not entry: continue
                media = entry.get("media")
                if not media: continue
                t = media.get("title", {})
                title = t.get("romaji") or t.get("english")
                if title:
                    external_titles.append(title)

        if not external_titles:
            return jsonify({"error": "No completed anime found for this user."}), 404

        indices = find_indices_fuzzy(external_titles)
        if not indices:
            return jsonify({"error": "None of your watched anime matched our database."}), 404

        return jsonify({
            "titles_fetched": len(external_titles),
            "titles_matched": len(indices),
            "recommendations": get_recommendations_from_indices(indices, n=n)
        })

    except requests.exceptions.Timeout:
        return jsonify({"error": "AniList API timed out. Try again later."}), 504
    except Exception as e:
        
        print(f" ANILIST CRASHED WITH ERROR: {str(e)} ")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/mal', methods=['GET'])
def sync_mal():
    username = request.args.get('username', '').strip()
    n = int(request.args.get('n', 10))
    if not username:
        return jsonify({"error": "Query parameter 'username' is required"}), 400

    try:
        external_titles = fetch_all_mal_pages(username)
        if not external_titles:
            return jsonify({"error": f"No completed anime found for MAL user '{username}'"}), 404

        indices = find_indices_fuzzy(external_titles)
        if not indices:
            return jsonify({"error": "None of your watched anime matched our database"}), 404

        return jsonify({
            "titles_fetched": len(external_titles),
            "titles_matched": len(indices),
            "recommendations": get_recommendations_from_indices(indices, n=n)
        })

    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 404:
            return jsonify({
                "error": f"MAL user '{username}' not found"
            }), 404

        if e.response is not None and e.response.status_code in (401, 403):
            return jsonify({
                "error": "MAL denied access to this user's anime list. The list may be private."
            }), 403

        if e.response is not None and e.response.status_code == 429:
            return jsonify({
                "error": "MyAnimeList rate limit reached. Please try again shortly."
            }), 429

        return jsonify({
            "error": f"MyAnimeList API error: {str(e)}"
        }), 502

    except RuntimeError as e:
        return jsonify({
            "error": str(e)
        }), 503

    except requests.exceptions.Timeout:
        return jsonify({
            "error": "MyAnimeList API timed out. Please try again."
        }), 504

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": f"Could not reach MyAnimeList: {str(e)}"
        }), 502

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Debug mode is opt-in only (set FLASK_DEBUG=1 locally). Keeping it off
    # by default means if this ever gets deployed for the portfolio site,
    # the interactive debugger/reloader won't accidentally be exposed.
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=debug_mode, port=port)