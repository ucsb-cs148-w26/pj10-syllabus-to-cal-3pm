import { config, validateConfig, getConfigSummary } from '@/lib/config';

describe ('Config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('config object', () => {
        test('Default upload configuration exists', () => {
            expect(config.upload.maxFileSize).toBeDefined();
            expect(config.upload.maxFiles).toBeDefined();
            expect(config.upload.allowedTypes).toContain('application/pdf');
            expect(config.upload.uploadDir).toBeDefined();
        });

        test('Storage configuration exists', () => {
            expect(config.app.name).toBe('Syllabus to Calendar');
            expect(config.app.version).toBeDefined();
        });
    });

    describe('validateConfig', () => {
        test('Successful validation with proper config', () => {
            process.env.MAX_FILE_SIZE = '10485760';
            process.env.MAX_FILES_PER_REQUEST = '10';
            process.env.ALLOWED_FILE_TYPES = 'application/pdf';
            process.env.UPLOAD_DIR = 'uploads';

            expect(() => validateConfig()).not.toThrow();
        });

        test('Throw error for invalid max file size', () => {
            process.env.MAX_FILE_SIZE = '0';

            jest.resetModules();
            const { validateConfig: newValidateConfig } = require('@/lib/config');

            expect(() => newValidateConfig()).toThrow('MAX_FILE_SIZE must be a positive number');
        });

        test('Throw error for invalid max files', () => {
            process.env.MAX_FILES_PER_REQUEST = '-1';

            jest.resetModules();
            const { validateConfig: newValidateConfig } = require('@/lib/config');

            expect(() => newValidateConfig()).toThrow('MAX_FILES_PER_REQUEST must be a positive number');
        });
    });

    describe('getConfigSummary', () => {
        test('Return formatted config summary', () => {
            const summary = getConfigSummary();

            expect(summary).toContain('Application Configuration');
            expect(summary).toContain('Max File Size');
            expect(summary).toContain('Allowed Types');
        });
    });
});