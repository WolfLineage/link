import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { decodeBase64, encodeBase64 } from '../src/utils.js';
import http from 'node:http';

const createTestApp = () => createApp({
    kv: new MemoryKVAdapter(),
    assetFetcher: null,
    logger: console,
    config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
});

const SS_LINK = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@1.2.3.4:8388#TestNode';
const SS_LINK_2 = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@5.6.7.8:8388#TestNode2';

const subUrl = (params) => `http://localhost/sub?${new URLSearchParams(params)}`;

describe('subconverter compatibility endpoints', () => {
    it('GET /version returns a subconverter signature with CORS', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/version');
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text.toLowerCase()).toContain('subconverter');
        expect(res.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('OPTIONS /version returns CORS preflight', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/version', { method: 'OPTIONS' });
        expect(res.status).toBe(204);
        expect(res.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('converts target=clash', async () => {
        const app = createTestApp();
        const res = await app.request(subUrl({ target: 'clash', url: SS_LINK }));
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/yaml');
        const text = await res.text();
        expect(text).toContain('proxies:');
        expect(text).toContain('TestNode');
        expect(res.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('converts target=singbox', async () => {
        const app = createTestApp();
        const res = await app.request(subUrl({ target: 'singbox', url: SS_LINK }));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body.outbounds)).toBe(true);
    });

    it('converts target=surge', async () => {
        const app = createTestApp();
        const res = await app.request(subUrl({ target: 'surge', url: SS_LINK }));
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('[Proxy]');
    });

    it('converts target=mixed to base64 share links', async () => {
        const app = createTestApp();
        const res = await app.request(subUrl({ target: 'mixed', url: SS_LINK }));
        expect(res.status).toBe(200);
        const decoded = decodeBase64(await res.text());
        expect(decoded).toContain('ss://');
    });

    it('passes group_by_country from the top-level /sub query', async () => {
        const groupedLink = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@1.2.3.4:8388#HK Node';
        const app = createTestApp();
        const res = await app.request(subUrl({
            target: 'clash',
            url: groupedLink,
            group_by_country: 'true'
        }));
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('Hong Kong');
        expect(text).toContain('手动切换');
    });

    it('accepts pipe-separated subscriptions', async () => {
        const app = createTestApp();
        const res = await app.request(subUrl({
            target: 'clash',
            url: `${SS_LINK}|${SS_LINK_2}`
        }));
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('TestNode');
        expect(text).toContain('TestNode2');
    });

    it('honors filename as Content-Disposition', async () => {
        const app = createTestApp();
        const res = await app.request(subUrl({
            target: 'clash',
            url: SS_LINK,
            filename: 'edt-profile'
        }));
        expect(res.headers.get('content-disposition')).toContain('edt-profile');
    });

    it('returns 400 when url is missing', async () => {
        const app = createTestApp();
        const res = await app.request(subUrl({ target: 'clash' }));
        expect(res.status).toBe(400);
    });

    it('returns 400 for unsupported target', async () => {
        const app = createTestApp();
        const res = await app.request(subUrl({ target: 'loon', url: SS_LINK }));
        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toContain('Unsupported target');
    });
});

describe('base64 share-link subscriptions with encoded fields', () => {
    it('preserves node names when links contain percent-encoded ECH/path values', async () => {
        const link = 'vless://' +
            '00000000-0000-4000-8000-000000000000@1.2.3.4:443' +
            '?security=tls&type=ws' +
            '&ech=cloudflare-ech.com%2Bhttps%3A%2F%2Fdns.example.com%2Fdns-query' +
            '&path=%2Fvideo%2Fturn%3D1.2.3.4%3A443' +
            '&encryption=none' +
            '#%5BEDT%5D%20HK%20Node';
        const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(encodeBase64(link));
        });
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

        try {
            const subEndpoint = `http://127.0.0.1:${server.address().port}/sub?token=edt`;
            const app = createTestApp();
            // Disable default flag rules so this test checks only name decoding.
            const res = await app.request(subUrl({ target: 'clash', url: subEndpoint, keywordEmoji: '0' }));
            expect(res.status).toBe(200);
            const text = await res.text();
            expect(text).toContain('[EDT] HK Node');
            expect(text).toContain('server: 1.2.3.4');
        } finally {
            server.close();
        }
    });
});
