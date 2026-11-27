import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { parseCustomGroups } from '../src/services/customGroupService.js';

const SS = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@1.2.3.4:8388#HKNode';
const createTestApp = () => createApp({
    kv: new MemoryKVAdapter(), assetFetcher: null, logger: console,
    config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
});

describe('customGroups parsing', () => {
    it('parses name/type/members and validates', () => {
        const groups = parseCustomGroups(JSON.stringify([
            { name: '🎮 游戏', type: 'url-test', members: ['HKNode', '', ' US '] },
            { name: '', type: 'select', members: ['HKNode'] },
            { name: '空成员', type: 'select', members: [] }
        ]));
        expect(groups).toEqual([
            { name: '🎮 游戏', type: 'url-test', members: ['HKNode', 'US'] }
        ]);
    });

    it('defaults to select and ignores bad JSON', () => {
        expect(parseCustomGroups('not json')).toEqual([]);
        expect(parseCustomGroups(JSON.stringify([{ name: 'G', members: ['A'] }]))[0].type).toBe('select');
    });
});

describe('custom groups in generated config', () => {
    it('clash: creates select and url-test groups', async () => {
        const app = createTestApp();
        const customGroups = JSON.stringify([
            { name: '🎮 游戏专用', type: 'select', members: ['HKNode', 'DIRECT'] },
            { name: '🎬 流媒体', type: 'url-test', members: ['HKNode'] }
        ]);
        const res = await app.request('http://localhost/clash?config=' + encodeURIComponent(SS) + '&customGroups=' + encodeURIComponent(customGroups));
        const config = yaml.load(await res.text());
        const game = config['proxy-groups'].find(g => g.name === '🎮 游戏专用');
        const stream = config['proxy-groups'].find(g => g.name === '🎬 流媒体');
        expect(game).toBeDefined();
        expect(game.type).toBe('select');
        expect(game.proxies).toContain('HKNode');
        expect(stream).toBeDefined();
        expect(stream.type).toBe('url-test');
    });

    it('singbox and surge accept custom groups', async () => {
        const app = createTestApp();
        const customGroups = JSON.stringify([{ name: '🎮 游戏', type: 'select', members: ['HKNode'] }]);
        const sbRes = await app.request('http://localhost/singbox?config=' + encodeURIComponent(SS) + '&customGroups=' + encodeURIComponent(customGroups));
        const sb = JSON.parse(await sbRes.text());
        expect(sb.outbounds.some(o => o.tag === '🎮 游戏' && o.type === 'selector')).toBe(true);

        const sgRes = await app.request('http://localhost/surge?config=' + encodeURIComponent(SS) + '&customGroups=' + encodeURIComponent(customGroups));
        const sg = await sgRes.text();
        expect(sg).toContain('🎮 游戏 = select');
    });
});
