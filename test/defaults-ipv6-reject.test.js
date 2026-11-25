import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const createTestApp = () => createApp({
    kv: new MemoryKVAdapter(), assetFetcher: null, logger: console,
    config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
});

const SS = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@1.2.3.4:8388#HK-Node';

describe('IPv6 off and ad traffic REJECT by default', () => {
    it('clash: dns.ipv6 false and ads rejected with no select group', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/clash?config=' + encodeURIComponent(SS));
        const config = yaml.load(await res.text());
        expect(config.dns.ipv6).toBe(false);
        expect(config.rules.some(r => /category-ads-all,REJECT/.test(r))).toBe(true);
        expect(config['proxy-groups'].some(g => /广告/.test(g.name || ''))).toBe(false);
    });

    it('singbox: IPv6 reject rule, no fakeip v6, ads rejected', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/singbox?config=' + encodeURIComponent(SS));
        const text = await res.text();
        const config = JSON.parse(text);
        expect(config.route.rules.some(r => r.ip_version === 6 && r.action === 'reject')).toBe(true);
        expect(text).not.toContain('inet6_range');
        expect(config.route.rules.some(r => r.rule_set?.includes?.('category-ads-all') && r.action === 'reject')).toBe(true);
    });

    it('surge: ipv6 false and ads rejected with no select group', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/surge?config=' + encodeURIComponent(SS));
        const text = await res.text();
        expect(text).toContain('ipv6 = false');
        expect(/category-ads-all\.conf,REJECT/.test(text)).toBe(true);
        expect(/广告拦截 = select/.test(text)).toBe(false);
    });
});
