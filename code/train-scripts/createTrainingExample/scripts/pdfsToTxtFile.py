import pymupdf
import re
from pathlib import Path

#takes all files from folder named "data" in the directory and creates/overwrites syllabus.txt with contents of each file separated by \n\n\n

def get_pdf_text(pdfdir):
    """
    ===================================
    in:
        -pdfdir: str w/ file dir to pdf
    out:
        -text: str of pdf contents
    ===================================
    """
    text = ""
    doc = pymupdf.open(pdfdir)
    for page in doc:
        text = f"{text}\n\n{page.get_text().encode('utf8')}"
    return text

def clean_text(text):
    """
    ==============================================================
    in:
        -text: str
    out:
        -text: removed excess spaces, and newlines
    ===============================================================
    """ 
    text = text.lower() #lowercase, may or may not be necessary
    # for word in stopwords.words('english'): #remove stopwords
        # text = text.replace(f" {word} ", " ")
    text = text.replace("\\n", " ")
    text = re.sub(" +", " ", text)
    text = re.sub("\t+", " ", text)
    text = re.sub(r"\\.{3}", "", text) #removing weird pdf stuff
    #set of valid chars are going to be alphanumeric all case, colon, forward slash, period, comma, newline?
    return text


files = [p for p in Path("../data/pdfs").iterdir() if (p.is_file() and str(p)[-3:] == 'pdf')]

for file in files:
    try:
        with open(f"../data/text/{str(file)[4:-3] + 'txt'}", "w") as output:
            text = get_pdf_text(str(file))
            text = clean_text(text)
            text = text.split("\n")
            text = [text_piece[2:-2] for text_piece in text]
            count = 1
            for text_piece in text:
                if text_piece.isspace() or len(text_piece) == 0:
                    continue
                output.write(f"\n\nCHUNK {count}==========================================================================================================================================================================\n\n")
                output.write(text_piece)
                count += 1
    except pymupdf.FileDataError:
        pass

