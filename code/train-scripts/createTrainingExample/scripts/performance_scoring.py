import spacy
from spacy.tokens import Doc
from spacy.tokens import DocBin
from spacy.scorer import Scorer
from spacy.training import Example

nlp = spacy.load("en_core_web_lg")


def score_with_doc(testdir, modeldir):
    global nlp
    scorer = Scorer(nlp)

    examples = []
    model = spacy.load(modeldir)

    test = DocBin().from_disk(testdir)
    for doc in test.get_docs(nlp.vocab):
        prediction = model(doc.text)
        examples.append(Example(prediction, doc))
    
    scores = scorer.score(examples)
    return scores

print(score_with_doc("../training/test/phil_3_syllabus (1).spacy", "../training/models/model7/model-best"))


