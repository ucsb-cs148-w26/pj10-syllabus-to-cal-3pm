import { AppError, FileUploadError, ValidationError, StorageError, handleError } from '@/lib/errorHandler';

describe('Error Classes', () => {
    describe('AppError', () => {
        test('Create error with message and status code', () => {
            const error = new AppError('Test error', 400);

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.name).toBe('AppError');
        });

        test('Include optional code and details', () => {
            const error = new AppError('Test error', 400, 'TEST_CODE', { foo: 'bar' });

            expect(error.code).toBe('TEST_CODE');
            expect(error.details).toEqual({ foo: 'bar' });
        });
    });

    describe('FileUploadError', () => {
        test('Create upload error with status 400', () => {
            const error = new FileUploadError('Upload failed', 'test.pdf');

            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('FILE_UPLOAD_ERROR');
            expect(error.details).toEqual({ filename: 'test.pdf' });
        });
    });

    describe('ValidationError', () => {
        test('Create storage error with status 500', () => {
            const error = new StorageError('Save failed', 'save');

            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('STORAGE_ERROR');
            expect(error.details).toEqual({ operation: 'save' });
        });
    });
});

describe('handleError', () => {
    test('AppError is handled correctly', () => {
        const error = new AppError('Test error', 400, 'TEST_CODE');

        const result = handleError(error);

        expect(result.error).toBe('Test error');
        expect(result.statusCode).toBe(400);
        expect(result.code).toBe('TEST_CODE');
    });

    test('Standard error is handled correctly', () => {
        const error = new Error('Standard error');

        const result = handleError(error);

        expect(result.error).toBe('Standard error');
        expect(result.statusCode).toBe(500);
    });

    test('Unknown error types are handled correctly', () => {
        const error = 'String error';

        const result = handleError(error);

        expect(result.error).toBe('An unexpected error occurred');
        expect(result.statusCode).toBe(500);
    });

    test('Include stack trace upon request', () => {
        const error = new Error('Test error');

        const result = handleError(error, true);

        expect(result.stack).toBeDefined();
    });

    test('Stack trace is excluded by default', () => {
        const error = new Error('Test error');

        const result = handleError(error, false);

        expect(result.stack).toBeUndefined();
    });
});