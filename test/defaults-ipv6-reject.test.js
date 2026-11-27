import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { CLASH_CONFIG } from '../src/config/clashConfig.js';

const createTestApp = () => createApp({
    kv: new MemoryKVAdapter(), assetFetcher: null, logger: console,
    config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
});

const SS = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@1.2.3.4:8388#HK-Node';

describe('IPv6 off by default', () => {
    it('clash: dns.ipv6 false', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/clash?config=' + encodeURIComponent(SS));
        const config = yaml.load(await res.text());
        expect(config.dns.ipv6).toBe(false);
    });

    it('clash: Ad Block is a visible group defaulting to a node, not REJECT', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/clash?config=' + encodeURIComponent(SS) + '&selectedRules=' + encodeURIComponent('["Ad Block"]'));
        const config = yaml.load(await res.text());
        const adGroup = config['proxy-groups'].find(g => /广告/.test(g.name || ''));
        expect(adGroup).toBeDefined();
        expect(adGroup.type).toBe('select');
        expect(adGroup.proxies[0]).not.toBe('REJECT');
        expect(config.rules.some(r => /category-ads-all,\* 广告/.test(r) || /category-ads-all,🛑/.test(r))).toBe(true);
    });

    it('singbox: IPv6 reject rule, no fakeip v6, ads rejected', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/singbox?config=' + encodeURIComponent(SS) + '&selectedRules=' + encodeURIComponent('["Ad Block"]'));
        const text = await res.text();
        const config = JSON.parse(text);
        expect(config.route.rules.some(r => r.ip_version === 6 && r.action === 'reject')).toBe(true);
        expect(text).not.toContain('inet6_range');
        expect(config.route.rules.some(r => r.rule_set?.includes?.('category-ads-all'))).toBe(true);
    });

    it('surge: ipv6 false', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/surge?config=' + encodeURIComponent(SS));
        const text = await res.text();
        expect(text).toContain('ipv6 = false');
    });
});


describe('IPv6 forced off with custom base config', () => {
    it('clash overrides base config ipv6:true', async () => {
        const base = JSON.parse(JSON.stringify(CLASH_CONFIG));
        base.ipv6 = true;
        base.dns.ipv6 = true;
        const builder = new ClashConfigBuilder(SS, 'minimal', [], base, 'zh-CN', 'test-agent');
        const config = yaml.load(await builder.build());
        expect(config.ipv6).toBe(false);
        expect(config.dns.ipv6).toBe(false);
    });
});

