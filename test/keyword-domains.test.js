import { describe, it, expect } from 'vitest';
import { parseKeywordDomains, applyKeywordDomains } from '../src/services/keywordDomainService.js';

describe('parseKeywordDomains', () => {
    it('builds a domain pool per keyword from repeated lines', () => {
        const pools = parseKeywordDomains([
            'HK=voxy-hk-1.pages.dev',
            'HK=voxy-hk-2.pages.dev',
            'US=voxy-us-1.pages.dev'
        ].join('\n'));
        expect(pools.HK).toEqual(['voxy-hk-1.pages.dev', 'voxy-hk-2.pages.dev']);
        expect(pools.US).toEqual(['voxy-us-1.pages.dev']);
    });

    it('deduplicates domains and ignores comments/blank lines', () => {
        const pools = parseKeywordDomains('# comment\nHK=voxy-hk-1.pages.dev\nHK=voxy-hk-1.pages.dev\n\n\nUS=x');
        expect(pools.HK).toEqual(['voxy-hk-1.pages.dev']);
    });

    it('returns empty object for empty input', () => {
        expect(parseKeywordDomains('')).toEqual({});
    });
});

describe('applyKeywordDomains', () => {
    const pools = parseKeywordDomains('HK=voxy-hk-1.pages.dev\nHK=voxy-hk-2.pages.dev\nUS=voxy-us-1.pages.dev');

    const makeProxy = (tag) => ({
        tag,
        type: 'vless',
        tls: { enabled: true, server_name: 'example.com' },
        transport: { type: 'ws', headers: { host: 'example.com' } }
    });

    it('picks a domain from the matching keyword pool and rewrites SNI/host', () => {
        const proxies = [makeProxy('HK Node A'), makeProxy('US Node')];
        const result = applyKeywordDomains(proxies, pools);

        expect(['voxy-hk-1.pages.dev', 'voxy-hk-2.pages.dev']).toContain(result[0].tls.server_name);
        expect(result[0].tls.server_name).toBe(result[0].transport.headers.host);
        expect(result[1].tls.server_name).toBe('voxy-us-1.pages.dev');
    });

    it('is case-insensitive and leaves unmatched nodes unchanged', () => {
        const proxy = makeProxy('hk Node');
        const result = applyKeywordDomains([proxy], pools);
        expect(result[0].tls.server_name).toMatch(/voxy-hk-/);

        const other = makeProxy('JP Node');
        expect(applyKeywordDomains([other], pools)[0]).toBe(other);
    });

    it('assigns independently across duplicate-name nodes', () => {
        const proxies = [makeProxy('HK Node'), makeProxy('HK Node'), makeProxy('HK Node'), makeProxy('HK Node')];
        const result = applyKeywordDomains(proxies, pools);
        const domains = result.map(p => p.tls.server_name);
        // With random selection, at least one pool member should appear across 4 picks.
        expect(domains.every(d => ['voxy-hk-1.pages.dev', 'voxy-hk-2.pages.dev'].includes(d))).toBe(true);
    });

    it('returns original array when no pools configured', () => {
        const proxies = [makeProxy('HK Node')];
        expect(applyKeywordDomains(proxies, {})).toBe(proxies);
    });
});
