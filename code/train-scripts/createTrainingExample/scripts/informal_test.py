import pymupdf
import re

import spacy
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

nlp = spacy.load("./training/models/model6/model-best")
text = get_pdf_text("data/pdfs/ENGL 50 - Felice Blake - Winter 2020.pdf")

text = clean_text(text)
text = text.split("\n")
text = [text_piece[2:-2] for text_piece in text]
count = 1
for text_piece in text:
    if text_piece.isspace() or len(text_piece) == 0:
        continue
    print(f"CHUNK {count}========================================================================\n")
    doc = nlp(text_piece)
    for ent in doc.ents:
        if ent.label_ != "IRRELEVANT":
            print(text_piece[ent.start_char:ent.end_char], ent.label_)
            print("\n")
    count += 1
