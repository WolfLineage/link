import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { parseGroupOverrides } from '../src/services/groupOverrideService.js';

const SS = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@1.2.3.4:8388#HKNode';
const createTestApp = () => createApp({
    kv: new MemoryKVAdapter(), assetFetcher: null, logger: console,
    config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
});

describe('groupOverrides parsing', () => {
    it('parses and validates override fields', () => {
        const parsed = parseGroupOverrides(JSON.stringify([
            { name: '🚀 节点选择', members: ['HKNode', '', ' DIRECT '], type: 'select', interval: 300 },
            { name: '', members: ['HKNode'] },
            { name: '⚡ 自动选择', disabled: true }
        ]));
        expect(parsed.length).toBe(2);
        expect(parsed[0].name).toBe('🚀 节点选择');
        expect(parsed[0].members).toEqual(['HKNode', 'DIRECT']);
        expect(parsed[0].type).toBe('select');
        expect(parsed[0].interval).toBe(300);
        expect(parsed[1].name).toBe('⚡ 自动选择');
        expect(parsed[1].disabled).toBe(true);
    });

    it('ignores bad JSON', () => {
        expect(parseGroupOverrides('bad')).toEqual([]);
    });
});

describe('built-in group overrides in config', () => {
    it('clash: replaces members, changes type, disables a group', async () => {
        const app = createTestApp();
        const overrides = JSON.stringify([
            { name: '🚀 节点选择', members: ['HKNode', 'DIRECT'] },
            { name: '⚡ 自动选择', type: 'select' },
            { name: '🐟 漏网之鱼', disabled: true }
        ]);
        const res = await app.request('http://localhost/clash?config=' + encodeURIComponent(SS) + '&groupOverrides=' + encodeURIComponent(overrides));
        const config = yaml.load(await res.text());
        const nodeSelect = config['proxy-groups'].find(g => g.name === '🚀 节点选择');
        const auto = config['proxy-groups'].find(g => g.name === '⚡ 自动选择');
        expect(nodeSelect.proxies).toEqual(['HKNode', 'DIRECT']);
        expect(auto.type).toBe('select');
        expect(config['proxy-groups'].some(g => g.name === '🐟 漏网之鱼')).toBe(false);
    });

    it('singbox: applies member override', async () => {
        const app = createTestApp();
        const overrides = JSON.stringify([{ name: '🚀 节点选择', members: ['HKNode', 'DIRECT'] }]);
        const res = await app.request('http://localhost/singbox?config=' + encodeURIComponent(SS) + '&groupOverrides=' + encodeURIComponent(overrides));
        const config = JSON.parse(await res.text());
        const group = config.outbounds.find(o => o.tag === '🚀 节点选择');
        expect(group.outbounds).toEqual(['HKNode', 'DIRECT']);
    });
});
