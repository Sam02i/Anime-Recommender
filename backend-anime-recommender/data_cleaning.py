import pandas as pd
import html
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(BASE_DIR, "data", "yume_master_dataset.csv")

# utf-8-sig handles UTF-8 with or without BOM
df = pd.read_csv(data_path, encoding="utf-8-sig")

print("Columns:", df.columns.tolist())
print("Shape:", df.shape)

# Expected: Name, Score, Episodes, Genres, Synopsis, Image_URL
print("Columns found:", df.columns.tolist())


def fix_mojibake(text):
    if not isinstance(text, str):
        return text
    try:
        return text.encode("latin-1").decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        return text  # already clean

df["Name"]     = df["Name"].apply(fix_mojibake)
df["Synopsis"] = df["Synopsis"].apply(fix_mojibake)


df["Episodes"] = pd.to_numeric(df["Episodes"], errors="coerce")
df["Score"]    = pd.to_numeric(df["Score"],    errors="coerce")


df["Episodes"] = df["Episodes"].fillna(df["Episodes"].median())
df["Score"]    = df["Score"].fillna(df["Score"].median())


df.dropna(subset=["Name"], inplace=True)
df["Name"] = df["Name"].apply(html.unescape).str.strip().str.lower()
df = df[df["Name"].str.strip() != ""]

print(f"Duplicates found: {df.duplicated(subset=['Name']).sum()}")
df.drop_duplicates(subset=["Name"], inplace=True)


df.dropna(subset=["Genres", "Synopsis"], inplace=True)
df = df[df["Synopsis"].str.strip() != ""]


df["Genres"] = (
    df["Genres"]
    .fillna("")
    .apply(fix_mojibake)
    .str.replace("unknown", "", case=False, regex=False)
    .str.lower()
    .str.strip()
)

df["Synopsis"] = (
    df["Synopsis"]
    .fillna("")
    .str.replace("unknown", "", case=False, regex=False)
    .str.strip())

df = df[df["Synopsis"] != ""]

df["Image_URL"] = df["Image_URL"].fillna("")


df["combined_features"] = (df["Genres"] + " ") * 4 + df["Synopsis"].fillna("")


df = df.reset_index(drop=True)

print("\nFinal shape:", df.shape)
print("\nMissing values after cleaning:")
print(df.isna().sum())
print("\nSample:")
print(df[["Name","Score","Episodes","Genres","Image_URL"]].head())


output_path = os.path.join(BASE_DIR, "data", "anime-data-cleaned.csv")
df.to_csv(output_path, index=False, encoding="utf-8-sig")
print(f"\nSaved to {output_path}")