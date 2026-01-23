import { extractText, getDocumentProxy } from 'unpdf';
async function readPdf(link: string) {
    /*
    in:
        -link: link to a pdf document
    out:
        -text: text from the pdf in a single string
    */
    const buffer = await fetch(link).then(res => res.arrayBuffer());
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    return text;
}