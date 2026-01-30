import { POST, GET } from "@/src/app/api/upload/route";
import { NextRequest } from "next/server";

describe('POST /api/upload', () => {
    test('Successful upload of a valid PDF file', async () => {
        const formData = new FormData();
        const file = new File(['Test content'], 'test.pdf', {
            type: 'application/pdf'
        });

        formData.append('file', file);

        const request = new NextRequest('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.files).toHaveLength(1);
        expect(data.files[0].originalName).toBe('test.pdf');
    });

    test('Reject non-PDF files', async () => {
        const formData = new FormData();
        const file = new File(['Test content'], 'test.txt', {
            type: 'text/plain'
        });

        formData.append('file', file);

        const request = new NextRequest('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('No files uploaded successfully');
    });

    test('Reject files exceeding size limit', async () => {
        const exceedingContent = 'a'.repeat(15 * 1024 * 1024);
        const formData = new FormData();
        const file = new File([exceedingContent], 'largeTest.pdf', {
            type: 'application/pdf'
        });

        formData.append('file', file);

        const request = new NextRequest('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('No files uploaded successfully');
    });

    test('Multiple file uploads handled correctly', async () => {
        const formData = new FormData();
        const mock1 = new File(['Mock test content 1'], 'mock1.pdf', {
            type: 'application/pdf'
        });
        const mock2 = new File(['Mock test content 2'], 'mock2.pdf', {
            type: 'application/pdf'
        });
        formData.append('file', mock1);
        formData.append('file', mock2);

        const request = new NextRequest('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.files).toHaveLength(2);
        expect(data.files[0].originalName).toBe('mock1.pdf');
    });

    test('Return status 400 when no files are given', async () => {
        const formData = new FormData();

        const request = new NextRequest('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('No files provided');
    });
});

describe('GET /api/upload', () => {
    test('Return list of uploaded files', async () => {
        const request = new NextRequest('http://localhost:3000/api/upload', {
            method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.files)).toBe(true);
        expect(typeof data.count).toBe('number');
        expect(typeof data.totalSize).toBe('number');
    });
});