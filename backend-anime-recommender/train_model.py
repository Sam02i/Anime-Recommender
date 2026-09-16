import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
import pickle
import os
import re

print("Training the model...")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
os.makedirs(MODEL_DIR, exist_ok=True)

data_path = os.path.join(BASE_DIR, "data", "anime-data-cleaned.csv")
df = pd.read_csv(data_path, encoding="utf-8-sig")
df = df.reset_index(drop=True)

# ── STEP 1: GENRE FEATURES (most important signal) ────────────────────
# Parse genres into a binary multi-hot matrix
# "Action, Fantasy, Drama" → [1, 0, 1, 1, 0, ...]
def parse_genres(g):
    if not isinstance(g, str): return []
    return [x.strip().lower() for x in re.split(r"[,|/]", g) if x.strip()]

all_genres = sorted(set(g for genres in df["Genres"].apply(parse_genres) for g in genres))
print(f"Found {len(all_genres)} unique genres: {all_genres[:10]}...")

# Build binary genre matrix — each row is an anime, each col is a genre (0 or 1)
genre_matrix = np.zeros((len(df), len(all_genres)), dtype=np.float32)
for i, genres in enumerate(df["Genres"].apply(parse_genres)):
    for g in genres:
        if g in all_genres:
            genre_matrix[i, all_genres.index(g)] = 1.0

# Genre cosine similarity — two anime with ALL same genres = 1.0 (100%)
genre_sim = cosine_similarity(genre_matrix)
print(f"Genre sim sample top-5: {sorted(genre_sim[0], reverse=True)[1:6]}")

# ── STEP 2: SYNOPSIS TF-IDF (secondary signal) ────────────────────────
tfidf = TfidfVectorizer(
    stop_words="english",
    min_df=2,
    max_df=0.90,
    ngram_range=(1, 2),
    sublinear_tf=True,
    max_features=20000,
)
synopsis_matrix = tfidf.fit_transform(df["Synopsis"].fillna(""))
synopsis_sim = cosine_similarity(synopsis_matrix)
print(f"Synopsis sim sample top-5: {sorted(synopsis_sim[0], reverse=True)[1:6]}")

# ── STEP 3: SCORE SIMILARITY (bonus signal) ───────────────────────────
# Anime with similar scores are more likely to be comparable quality
scores = df["Score"].fillna(df["Score"].median()).values.reshape(-1, 1)
scores_norm = MinMaxScaler().fit_transform(scores)  # scale to 0-1
# Score similarity: 1 - absolute difference (so same score = 1.0)
score_sim = 1 - np.abs(scores_norm - scores_norm.T)

# ── STEP 4: WEIGHTED BLEND ────────────────────────────────────────────
# Genre: 60% — most reliable signal, directly comparable
# Synopsis: 30% — thematic similarity
# Score: 10% — quality tier matching
similarity_matrix = (
    0.60 * genre_sim +
    0.30 * synopsis_sim +
    0.10 * score_sim
)

# ── SANITY CHECK ──────────────────────────────────────────────────────
sample_idx = 0
top_scores = sorted(similarity_matrix[sample_idx], reverse=True)[1:6]
print(f"\nFinal blended top-5 for '{df.iloc[0]['Name']}': {[round(s,3) for s in top_scores]}")

# Find the best match to show it's working
best_idx = np.argsort(similarity_matrix[sample_idx])[::-1][1]
print(f"Best match: '{df.iloc[best_idx]['Name']}' — score: {similarity_matrix[sample_idx][best_idx]:.3f}")

# ── SAVE ──────────────────────────────────────────────────────────────
print("\nSaving model components...")

with open(os.path.join(MODEL_DIR, "similarity_matrix.pkl"), "wb") as f:
    pickle.dump(similarity_matrix, f)

with open(os.path.join(MODEL_DIR, "Tfidf_vectorizer.pkl"), "wb") as f:
    pickle.dump(tfidf, f)

df[["Name", "Genres", "Synopsis", "Score", "Episodes", "Image_URL"]].to_pickle(
    os.path.join(MODEL_DIR, "anime_data.pkl")
)

print(f"Done! Trained on {len(df)} anime titles.")
print(f"Similarity matrix shape: {similarity_matrix.shape}")