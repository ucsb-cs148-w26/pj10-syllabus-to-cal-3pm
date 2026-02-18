import requests
from pathlib import Path

TXT_DIR = Path("eval/txt")
OUT_DIR = Path("eval/outputs")

OUT_DIR.mkdir(parents=True, exist_ok=True)

API_URL = "http://localhost:3000/api/gemini"

for txt_file in TXT_DIR.glob("*.txt"):
    print(f"Processing: {txt_file.name}")

    text = txt_file.read_text(encoding="utf-8")

    response = requests.post(API_URL, json={"text": text})

    if response.status_code != 200:
        print("Error:", response.text)
        continue

    csv_output = response.text

    out_path = OUT_DIR / txt_file.with_suffix(".csv").name
    out_path.write_text(csv_output, encoding="utf-8")

    print("Saved:", out_path)
