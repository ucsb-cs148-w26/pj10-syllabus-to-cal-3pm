import spacy
import pymupdf
from spacy.tokens import DocBin
from nltk.corpus import stopwords
import re

TRAIN_DATA = [] #list of tuples (text, {"entities": [(start, end, label), ...]]})

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
        -text: removed stopwords, excess spaces, and newlines
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

def create_data_manually_str(text):
    """
    ==========================================================================
    in:
        -text: list of strs you want to make training dataset from
    out:
        -train_data: spacy-formatted training set as variable(list of tuples of text-dict pairs)
    ==========================================================================
    """
    possible_labels = ["ASSIGNMENT", "ASSESSMENT", "LECTURE", "SECTION"]
    train_data = []
    for text_piece in text:
        if len(text_piece) == 0 or text_piece.isspace():
            continue
        text_ent_tuple = (text_piece, {"entities":[]})
        ent_text = "temp"
        print(f"Text:-----------------------------------\n{text_piece}\n----------------------------------------------")
        while 1:
            ent_text = input("What is the ent_text? (enter blank to move to next text piece)\n")
            if ent_text == "":
                break
            start = text_piece.find(ent_text)
            if start == -1:
                print(f"{ent_text} not found. Try something else.")
                continue
            count = 0
            label = input(f"What is the label index for {ent_text}? (one-based indexing) ({possible_labels})\n")
            try:
                label = possible_labels[int(label) - 1]
            except (ValueError, IndexError) as e:
                print(f"Invalid index. Prompting for ents again")
                continue
            while start != -1: #annotates all such strings
                count += 1
                end = start + len(ent_text)
                text_ent_tuple[1]["entities"].append((start, end, label))
                start = text_piece.find(ent_text, end)
            print(f"found {count} matches for {ent_text}")
        if len(text_ent_tuple[1]["entities"]) != 0:
            train_data.append(text_ent_tuple)
    return train_data

def create_data_manually_file(text):
    """
    ==========================================================================
    in:
        -text: list of strs you want to make training dataset from
    out:
        -train_data: spacy-formatted training set as file (list of tuples of text-dict pairs)
    ==========================================================================
    """
    possible_labels = ["ASSIGNMENT", "ASSESSMENT", "LECTURE", "SECTION"]
    db = DocBin()
    nlp = spacy.blank("en")
    for text_piece in text:

        if len(text_piece) == 0 or text_piece.isspace():
            continue

        doc = nlp.make_doc(text_piece)
        ents = []
        ent_text = "temp"
        print(f"Text:-----------------------------------\n{text_piece}\n----------------------------------------------")
        while 1:
            ent_text = input("What is the ent_text? (enter blank to move to next text piece)\n")
            if ent_text == "":
                break
            start = text_piece.find(ent_text)
            if start == -1:
                print(f"{ent_text} not found. Try something else.")
                continue
            count = 0
            label = input(f"What is the label index for {ent_text}? (one-based indexing) ({possible_labels})\n")
            try:
                label = possible_labels[int(label) - 1]
            except (ValueError, IndexError) as e:
                print(f"Invalid index. Prompting for ents again")
                continue
            while start != -1: #annotates all such strings
                count += 1
                end = start + len(ent_text)
                span = doc.char_span(start, end, label=label)
                if span is not None:
                    ents.append(span)
                start = text_piece.find(ent_text, end)
            print(f"found {count} matches for {ent_text}")
        if len(ents) != 0:
            doc.ents = ents
            db.add(doc)
    db.to_disk("./train.spacy")

