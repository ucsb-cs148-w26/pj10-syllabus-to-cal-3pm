import { FileStorage } from "@/lib/fileStorage";
import { promises as fs } from 'fs'
import path from 'path';
import { describe, test, expect, beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals'

describe('File Storage', () => {
    let storage: FileStorage;
    const testUploadDir = 'uploads-test';

    beforeAll(() => {
        process.env.UPLOAD_DIR = testUploadDir;
    });

    beforeEach(() => {
        storage = new FileStorage();
    });

    afterEach(async () => {
        try {
            const files = await storage.listFiles();
            for (const file of files) {
                await storage.deleteFile(file);
            }
        } catch(error) {

        }
    });

    afterAll(async () => {
        try {
            const uploadPath = path.join(process.cwd(), testUploadDir);
            await fs.rm(uploadPath, { recursive: true, force: true });
        } catch(error) {

        }
    });


    describe('init', () => {
        test('Create upload directory if it does not exist', async() => {
            await storage.init();

            const uploadPath = path.join(process.cwd(), testUploadDir);
            const dirExists = await fs.access(uploadPath)
                .then(() => true)
                .catch(() => false);

            expect(dirExists).toBe(true);
        });
    });

    describe('saveFile', () => {
        test('Save file with timestamp-prefix filename', async () => {
            const mockFile = new File(['test content'], 'test.pdf', {
                type: 'application/pdf'
            });

            const result = await storage.saveFile(mockFile, 'test.pdf');

            expect(result.filename).toMatch(/^\d+-test\.pdf$/);
            expect(result.originalName).toBe('test.pdf');
            expect(result.mimeType).toBe('application/pdf');
            expect(result.path).toContain(testUploadDir);
        });

        test('Save file with correct content', async () => {
            const content = 'Test PDF with content';
            const mockFile = new File([content], 'test.pdf', {
                type: 'application/pdf'
            });

            const result = await storage.saveFile(mockFile, 'test.pdf');
            const savedContent = await fs.readFile(result.path, 'utf-8');

            expect(savedContent).toBe(content);
        });
    });

    describe('getFilePath', () => {
        test('Return correct file path', () => {
            const filename = 'test.pdf';
            const expectedPath = path.join(process.cwd(), testUploadDir, filename);
            const result = storage.getFilePath(filename);

            expect(result).toBe(expectedPath);
        });
    });

    describe('listFiles', () => {
        test('Return empty array when no files exist', async () => {
            const files = await storage.listFiles();

            expect(files).toEqual([]);
        });

        test('Return list of uploaded files', async () => {
            const mockFile = new File(['test content for list'], 'test.pdf', {
                type: 'application/pdf'
            });

            await storage.saveFile(mockFile, 'test.pdf');

            const files = await storage.listFiles();

            expect(files.length).toBeGreaterThan(0);
            expect(files[0]).toMatch(/^\d+-test\.pdf$/);
        });
    });

    describe('deleteFile', () => {
        test('Delete existing file successfully', async () => {
            const mockFile = new File(['test content to delete'], 'test.pdf', {
                type: 'application/pdf'
            });

            const saved = await storage.saveFile(mockFile, 'test.pdf');
            const deleted = await storage.deleteFile(saved.filename);

            expect(deleted).toBe(true);

            const files = await storage.listFiles();

            expect(files).not.toContain(saved.filename);
        });

        test('Return false for non-existent file attempted to delete', async () => {
            const deleted = await storage.deleteFile('deleteNotExist.pdf');

            expect(deleted).toBe(false);
        });
    });

    describe('cleanupOldFiles', () => {
        test('Delete files older than retention hours', async () => {
            const mockFile = new File(['test content for cleanup'], 'oldSyllabus.pdf', {
                type: 'application/pdf'
            });

            const saved = await storage.saveFile(mockFile, 'oldSyllabus.pdf');

            const oldTime = Date.now() - (25 * 60 * 60 * 1000);
            await fs.utimes(saved.path, new Date(oldTime), new Date(oldTime));

            const deletedCount = await storage.cleanupOldFiles(24);

            expect(deletedCount).toBe(1);
        });

        test('Does not delete recent files', async () => {
            const mockFile = new File(['test content to retain'], 'recent.pdf', {
                type: 'application/pdf'
            });

            await storage.saveFile(mockFile, 'recent.pdf');

            const deletedCount = await storage.cleanupOldFiles(24);

            expect(deletedCount).toBe(0);
        });
    });

    describe('getTotalSize', () => {
        test('Return 0 for no files', async () => {
            const maxSize = await storage.getTotalSize();

            expect(maxSize).toBe(0);
        });

        test('Calculate total size of all current files', async () => {
            const mock1 = new File(['one'.repeat(1000)], 'mock1.pdf', {
                type: 'application/pdf'
            });
            const mock2 = new File(['two'.repeat(2000)], 'mock2.pdf', {
                type: 'application/pdf'
            });

            await storage.saveFile(mock1, 'mock1.pdf');
            await storage.saveFile(mock2, 'mock2.pdf');

            const maxSize = await storage.getTotalSize();

            expect(maxSize).toBeGreaterThan(0);
        });
    });
});