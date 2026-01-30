import { validateFile, validateMultipleFiles, sanitizeFilename } from "../../lib/fileValidation";
import { only } from "node:test";

process.env.MAX_FILE_SIZE = '10485760';
process.env.ALLOWED_FILE_TYPES = 'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain';
process.env.MAX_FILES_PER_REQUEST = '10';

describe('sanitizeFilename', () => {
    test('Remove path traversal attempts', () => {
        const danger = '../../../etc/password';

        const result = sanitizeFilename(danger);

        expect(result).not.toContain('..');
        expect(result).toBe('///etc/password');
    });

    test('Replace special characters with underscore', () => {
        const special = 'file_name#test!.pdf';

        const result = sanitizeFilename(special);

        expect(result).toBe('file_name_test_.pdf');
    });

    test('Preserve valid characters', () => {
        const valid = 'Syllabus-CS148_W26.pdf';

        const result = sanitizeFilename(valid);

        expect(result).toBe('Syllabus_CS148_W26.pdf');
    });

    test('Preserve file extension', () => {
        const filename = 'syllabus-to-cal.pdf';

        const result = sanitizeFilename(filename);

        expect(result).toContain('.pdf');
        expect(result).toBe('syllabus_to_cal.pdf');
    });

    test('Truncate long filename, preserving extension', () => {
        const longFilename = 'a'.repeat(250) + '.pdf';

        const result = sanitizeFilename(longFilename);

        expect(result.length).toBeLessThanOrEqual(200);
        expect(result).toMatch(/\.pdf$/);
    });

    test('Filename with multiple dots is handled correctly', () => {
        const multipleDots = 'syllabus.final.version.pdf';

        const result = sanitizeFilename(multipleDots);

        expect(result).toBe('syllabus.final.version.pdf');
    });

    test('Filename with no extension is handled correctly', () => {
        const noExtension = 'syllabus-no-ext';

        const result = sanitizeFilename(noExtension);

        expect(result).toBe('syllabus_no_ext');
    });

    test('Consecutive special characters are handled correctly', () => {
        const consecutiveSpecial = 'syllabus###$$$cs**1%4&8.pdf';

        const result = sanitizeFilename(consecutiveSpecial);

        expect(result).toBe('syllabus______cs__1_4_8.pdf');
    });

    test('Empty string is handled correctly', () => {
        const emptyName = '';

        const result = sanitizeFilename(emptyName);

        expect(result).toBe('');
    });

    test('Only special characters name is handled correctly', () => {
        const onlySpecial = '#$%~&*$!!.pdf';

        const result = sanitizeFilename(onlySpecial);

        expect(result).toBe('_________.pdf');
    });
});

describe('validateFile', () => {
    const createMockFile = (name: string, size: number, type: string): File => {
        const file = new File(['mock content'], name, { type });
        Object.defineProperty(file, 'size', { value: size, writable: false });
        return file;
    };

    test('Accept valid PDF file within size limit', () => {
        const validPDF = createMockFile('document.pdf', 5000000, 'application/pdf');

        const result = validateFile(validPDF);

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    test('Reject non-PDF file', () => {
        const jpgFile = createMockFile('image.jpg', 1000000, 'image/jpeg');

        const result = validateFile(jpgFile);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid file type. Only application/pdf allowed');
    });

    test('Reject file exceeding size limit', () => {
        const largePDF = createMockFile('large.pdf', 15000000, 'application/pdf');

        const result = validateFile(largePDF);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('File size exceeds');
        expect(result.error).toContain('10.0MB');
    });

    test('Reject file with filename longer than 255 characters', () => {
        const longName = 'a'.repeat(256) + '.pdf';
        const file = createMockFile(longName, 1000000, 'application/pdf');

        const result = validateFile(file);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Filename too long');
    });

    test('Accept file with filename exactly 255 characters', () => {
        const maxLengthName = 'a'.repeat(251) + '.pdf';
        const file = createMockFile(maxLengthName, 1000000, 'application/pdf');

        const result = validateFile(file);

        expect(result.valid).toBe(true);
    });

    test('Reject null or undefined file', () => {
        const result = validateFile(null as any);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('No file provided');
    });

    test('Accept PDF file at exactly the size limit', () => {
        const maxSizePDF = createMockFile('max.pdf', 10485760, 'application/pdf');

        const result = validateFile(maxSizePDF);

        expect(result.valid).toBe(true);
    });

    test('Reject file one byte over the limit', () => {
        const overLimitPDF = createMockFile('over.pdf', 10485761, 'application/pdf');

        const result = validateFile(overLimitPDF);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('exceeds');
    });

    test('Accept a very small PDF file', () => {
        const tinyPDF = createMockFile('tiny.pdf', 100, 'application/pdf');

        const result = validateFile(tinyPDF);

        expect(result.valid).toBe(true);
    });
});

describe('validateMultipleFiles', () => {
    const createMockFile = (name: string, size: number, type: string): File => {
        const file = new File(['mock content'], name, { type });
        Object.defineProperty(file, 'size', { value: size, writable: false });
        return file;
    };

    test('Accept valid array of PDF files', () => {
        const files = [
            createMockFile('file1.pdf', 1000000, 'application/pdf'),
            createMockFile('file2.pdf', 2000000, 'application/pdf'),
            createMockFile('file3.pdf', 3000000, 'application/pdf'),
        ];

        const result = validateMultipleFiles(files);

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    test('Reject empty array of files', () => {
        const result = validateMultipleFiles([]);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('No files provided');
    });

    test('Reject array exceeding maximum file count', () => {
        const files = Array(11).fill(null).map((_, i) =>
        createMockFile(`file${i}.pdf`, 1000000, 'application/pdf')
        );

        const result = validateMultipleFiles(files);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Maximum 10 files allowed per request');
    });

    test('Reject array at exactly the maximum file count', () => {
        const files = Array(10).fill(null).map((_, i) =>
        createMockFile(`file${i}.pdf`, 1000000, 'application/pdf')
        );

        const result = validateMultipleFiles(files);

        expect(result.valid).toBe(true);
    });

    test('Reject if any file is invalid', () => {
        const files = [
        createMockFile('file1.pdf', 1000000, 'application/pdf'),
        createMockFile('image.jpg', 1000000, 'image/jpeg'),
        createMockFile('file3.pdf', 1000000, 'application/pdf'),
        ];

        const result = validateMultipleFiles(files);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid file type');
    });

    test('Reject if any file exceeds size limit', () => {
        const files = [
            createMockFile('file1.pdf', 1000000, 'application/pdf'),
            createMockFile('huge.pdf', 20000000, 'application/pdf'),
            createMockFile('file3.pdf', 1000000, 'application/pdf'),
        ];

        const result = validateMultipleFiles(files);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('File size exceeds');
    });

    test('Reject if any file exceeds filename length', () => {
        const longName = 'a'.repeat(260) + '.pdf';
        const files = [
            createMockFile('file1.pdf', 1000000, 'application/pdf'),
            createMockFile(longName, 1000000, 'application/pdf'),
        ];

        const result = validateMultipleFiles(files);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Filename too long');
    });

    test('Accept single file in array', () => {
        const files = [createMockFile('single.pdf', 1000000, 'application/pdf')];

        const result = validateMultipleFiles(files);

        expect(result.valid).toBe(true);
    });
});

describe('Environment variable handling', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        process.env.MAX_FILE_SIZE = '10485760';
        process.env.ALLOWED_FILE_TYPES = 'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain';
        process.env.MAX_FILES_PER_REQUEST = '10';
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test('uses default values when environment variables are not set', () => {
        delete process.env.MAX_FILE_SIZE;
        delete process.env.ALLOWED_FILE_TYPES;

        jest.resetModules();
        const { validateFile } = require('@/lib/fileValidation');

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'size', { value: 1000000, writable: false });

        const result = validateFile(file);

        expect(result.valid).toBe(true);
    });
});