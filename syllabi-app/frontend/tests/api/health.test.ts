import { GET } from '@/src/app/api/health/route';
import { NextRequest } from 'next/server';

describe('GET /api/health', () => {
    test('Return health status', async () => {
        const request = new NextRequest('http://localhost:3000/api/health', {
            method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('ok');
        expect(data.timestamp).toBeDefined();
        expect(data.services).toBeDefined();
    });

    test('Include service status', async () => {
        const request = new NextRequest('http://localhost:3000/api/health', {
            method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(data.services.upload).toBe('active');
        expect(data.services.storage).toBe('active');
        expect(data.services.cleanup).toBe('active');
    });

    test('Include storage statistics', async () => {
        const request = new NextRequest('http://localhost:3000/api/health');

        const response = await GET(request);
        const data = await response.json();

        expect(data.storage).toBeDefined();
        expect(typeof data.storage.fileCount).toBe('number');
        expect(typeof data.storage.totalSizeBytes).toBe('number');
    });
});