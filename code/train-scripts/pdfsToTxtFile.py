import pymupdf
from nltk.corpus import stopwords
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
        text = f"{text}\n\n{page.get_text().encode("utf8")}"
    return text

def clean_text(text):
    """
    ==============================================================
    in:
        -text: str
    out:
        -text: removed stopwords, urls, pdf stuff, etc
    ===============================================================
    """ 
    text = text.lower() #lowercase, may or may not be necessary
    for word in stopwords.words('english'): #remove stopwords
        text = text.replace(f" {word} ", " ")
    text = text.replace("\\n", " ")
    text = text.replace("(", "")
    text = text.replace(")", "")
    text = re.sub(r"https\S+", "", text) #removing urls
    text = re.sub(r"\\.{3}", "", text) #removing weird pdf stuff
    #set of valid chars are going to be alphanumeric all case, colon, forward slash, period, comma, newline?
    return text


files = [p for p in Path("./data").iterdir() if (p.is_file() and str(p)[-3:] == "pdf")]

with open("syllabus.txt", "w") as f:
    for file in files:
        try:
            # print(get_pdf_text(str(file)))
            f.write(clean_text(get_pdf_text(str(file))))
            f.write("\n\n\n\n\n")
        except pymupdf.FileDataError:
            pass