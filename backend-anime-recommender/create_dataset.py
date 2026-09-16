import requests
import pandas as pd
import time

def fetch_data(url, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                return response.json().get("data", [])
            if response.status_code == 429:
                print(f"Rate limited on {url}, waiting 3s (attempt {attempt + 1}/{max_retries})...")
                time.sleep(3)
                continue
            print(f"Warning: {url} returned HTTP {response.status_code}")
            return []
        except requests.exceptions.RequestException as e:
            print(f"Warning: request to {url} failed: {e}")
            return []
    print(f"Warning: giving up on {url} after {max_retries} rate-limit retries")
    return []

def generate_master_dataset(target_count=20000):
    all_anime = []
    seen_ids = set()

    # Fetch Latest Seasonal (2020-2026)
    print("Fetching recent seasonal anime...")
    for year in range(2026, 2019, -1):
        for season in ["winter", "spring", "summer", "fall"]:
            data = fetch_data(f"https://api.jikan.moe/v4/seasons/{year}/{season}")
            for anime in data:
                if anime['mal_id'] not in seen_ids:
                    all_anime.append(process_entry(anime))
                    seen_ids.add(anime['mal_id'])
            time.sleep(1) # Be nice to the API

    # Fill the rest with Top Rated until we hit target_count
    print(f"Current count: {len(all_anime)}. Filling remainder with Top Rated...")
    page = 1
    while len(all_anime) < target_count:
        data = fetch_data(f"https://api.jikan.moe/v4/top/anime?page={page}")
        if not data: break
        for anime in data:
            if anime['mal_id'] not in seen_ids:
                all_anime.append(process_entry(anime))
                seen_ids.add(anime['mal_id'])
        page += 1
        time.sleep(1)

    # Saving
    df = pd.DataFrame(all_anime)
    df.to_csv("yume_master_dataset.csv", index=False)
    print(f"Success! Saved {len(df)} anime to 'yume_master_dataset.csv'")

def process_entry(anime):
    return {
        "Name": anime.get("title"),
        "Score": anime.get("score", 0),
        "Episodes": anime.get("episodes", 0),
        "Genres": ", ".join([g["name"] for g in anime.get("genres", [])]),
        "Synopsis": anime.get("synopsis", "No description available."),
        "Image_URL": anime.get("images", {}).get("jpg", {}).get("image_url", "")
    }

if __name__ == "__main__":
    generate_master_dataset(20000)
    
    
    