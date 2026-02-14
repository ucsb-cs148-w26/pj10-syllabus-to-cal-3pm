import pymupdf
from pathlib import Path

PDF_DIR = Path("./syllabi_pdfs")
TXT_DIR = Path("./syllabi_txt")

TXT_DIR.mkdir(parents=True, exist_ok=True)

def get_pdf_text(pdf_path: str) -> str:
    """
    Extract raw text from a PDF.
    Keeps formatting and line breaks for better event detection.
    """
    text = ""
    doc = pymupdf.open(pdf_path)

    for page in doc:
        text += page.get_text()

    return text


# Convert each PDF → separate TXT file
files = [p for p in PDF_DIR.iterdir() if p.suffix.lower() == ".pdf"]

for file in files:
    try:
        txt = get_pdf_text(str(file))
        out_path = TXT_DIR / f"{file.stem}.txt"

        with open(out_path, "w", encoding="utf-8") as f:
            f.write(txt)

        print(f"Converted: {file.name}")

    except Exception as e:
        print(f"Error processing {file.name}: {e}")
