import '@testing-library/jest-dom';

process.env.MAX_FILE_SIZE = '10485760';
process.env.ALLOWED_FILE_TYPES = 'application/pdf';
process.env.MAX_FILES_PER_REQUEST = '10';
process.env.UPLOAD_DIR = 'uploads-test';
// process.env.NODE_ENV = 'test';