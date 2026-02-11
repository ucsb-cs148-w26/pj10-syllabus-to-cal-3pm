import pymupdf
import re

import spacy
from spacy.tokens import DocBin
from nltk.corpus import stopwords

POSSIBLE_LABELS = ["ASSIGNMENT", "ASSESSMENT", "LECTURE", "SECTION"]

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
    text = text.replace("(", "")
    text = text.replace(")", "")
    text = re.sub(r"https\S+", "", text) #removing urls
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
        text = f"{text}\n\n{page.get_text().encode("utf8")}"
    return text

def get_pdf_text_file(pdfdir, fname):
    """=========================================
    in:
        -pdfdir: pdf dir
        -fname: name of output file
    ============================================"""
    text = get_pdf_text(pdfdir)
    text = clean_text(text)
    with open(fname, "w") as file:
        for text_piece in text.split("\n"):
            file.write(text_piece)
            file.write("\n\n====================================================================================================================================\n\n")

def append_spans(span_list, text, ent_text, label_idx, nlp_doc):
    """=====================================================================
    behavior: fills list with span objs for every match of ent_text in text
    in:
        -span_list: list that you want to add the char spans to
        -text: training text
        -ent_text: what is being searched for
        -label_idx: label idx corresponding to the ent_text
        -nlp_doc: nlp doc obj corresponding to text
    out:
        -count: how many occurences of ent_text found in text
    ========================================================================"""
    start = text.find(ent_text)
    count = 0
    while start != -1:
        count += 1
        end = start + len(ent_text)
        span = nlp_doc.char_span(start, end, label=POSSIBLE_LABELS[label_idx - 1])
        span_list.append(span)
        start = text.find(ent_text, end)
    return count

def create_data_manually_str(text):
    """
    ==========================================================================
    in:
        -text: list of strs you want to make training dataset from
    out:
        -train_data: spacy-formatted training set as variable(list of tuples of text-dict pairs)
    ==========================================================================
    """
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
            label = input(f"What is the label index for {ent_text}? (one-based indexing) ({POSSIBLE_LABELS})\n")
            try:
                label = POSSIBLE_LABELS[int(label) - 1]
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

def create_data_manually_file(text, fname):
    """
    ==========================================================================
    behavior:
        -prompts you to type in entity text for each text element from list
    in:
        -text: list of strs you want to make training dataset from
        -fname: filename for spacy file
    out:
        -train_data: spacy-formatted training set as file 
    ==========================================================================
    """
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
            label = input(f"What is the label index for it? (one-based indexing) ({POSSIBLE_LABELS})\n")
            try:
                label = POSSIBLE_LABELS[int(label) - 1]
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
    db.to_disk(f"./{fname}")

def is_valid_annotation(annotation_no, annotation):
    """==============================================================
    helper for create_data_manually_file(text, spacy_fname, ents_path)
    in:
        -annotation_no: line number that the annotation corresponds to
        -annotation: line with ent_text>>label formatting
    out:
        if annotation is invalid:
            -message: str about what is wrong with the annotation
        if annotation is valid:
            -message: "good"
    ==================================================================="""
    if len(annotation) <= 3:
        return f'Line no: {annotation_no} not long enough (should be at least 3).'
    if annotation[-3:-1] != ">>":
        return f'No delimiter >> in line no: {annotation_no}'
    label_idx = annotation[-1]
    if not label_idx.isdigit():
        return f'label_idx {label_idx} in line {annotation_no} is NaN.'
    label_idx = int(label_idx)
    if label_idx < 1 or label_idx > len(POSSIBLE_LABELS):
        return f'label_idx {label_idx} in line {annotation_no} is out of bounds.'
    ent_text = annotation[:len(annotation) - 3]
    return "good"

#THIS ONE IS PROBABLY THE MOST CONVENIENT
#Skips over lines that do not have the right syntax, so you can also just leave comments to keep the annotation text files organized.
def create_data_manually_file(text, annotations_path, spacy_fname):
    """===================================================================================================================================
    behavior:
        -reads through each line at ents_fname and assigns entities accordingly
    in:
        -text: list of strs you want to make training set from
        -spacy_fname: name of spacy file
        -ents_path: name of file that you are reading ent text from (each line should be formatted: [ent text]>>[label num] (1-based index, >> between ent text and label num no space, don't put square brackets))
    out:
        -train_data: spacy-formatted training set as file with input name
    ===================================================================================================================================="""
    with open(annotations_path, 'r') as file:
        same_doc = False
        db = DocBin()
        nlp = spacy.blank('en')
        annotation_no = 1
        annotation = file.readline().strip()
        text_idx = 0
        while annotation != "":
            if text_idx >= len(text):
                break
            if len(text[text_idx]) == 0 or text[text_idx].isspace():
                text_idx += 1
                continue
            doc = nlp.make_doc(text[text_idx])
            if not same_doc:
                ents = []
            annotation_validation_message = is_valid_annotation(annotation_no, annotation)
            if annotation_validation_message != "good":
                print(annotation_validation_message)
                annotation_no += 1
                annotation = file.readline().strip()
                #adding docs in case end of annotation file
                if annotation == "":
                    doc.ents = ents
                    db.add(doc)
                    break
                continue
            ent_text = annotation[:-3]
            label_idx = int(annotation[-1])
            occurences = append_spans(ents, text[text_idx], ent_text, label_idx, doc)
            if occurences == 0:
                # print(f"{ent_text} not found. Moving to the next text piece") #!good for debug
                doc.ents = ents
                db.add(doc)
                text_idx += 1
                same_doc = False
            else:
                annotation = file.readline().strip()
                annotation_no += 1
                same_doc = True
            #ensuring doc is still added to db if break by end of annotation file happens
            if annotation == "":
                doc.ents = ents
                db.add(doc)
                break
            

        db.to_disk(spacy_fname)

#example use case
name = "GEOG 3 - Damilola Eyelade - Summer 2020"
text = get_pdf_text(f"data/{name}.pdf") 
text = clean_text(text)
text = text.split("\n")
create_data_manually_file(text, "annotations/{name}.txt", "train/{name}.spacy")


