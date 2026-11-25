import { describe, it, expect } from 'vitest';
import { parseRegionDomains, applyRegionDomains } from '../src/services/regionDomainService.js';

describe('parseRegionDomains', () => {
    it('parses multiple regions and domains', () => {
        const parsed = parseRegionDomains(
            'HK=voxy-hk-1.pages.dev,voxy-hk-2.pages.dev;JP=voxy-jp-1.pages.dev;US=voxy-us-1.pages.dev'
        );
        expect(parsed.HK).toEqual(['voxy-hk-1.pages.dev', 'voxy-hk-2.pages.dev']);
        expect(parsed.JP).toEqual(['voxy-jp-1.pages.dev']);
        expect(parsed.US).toEqual(['voxy-us-1.pages.dev']);
    });

    it('returns empty object for empty or malformed input', () => {
        expect(parseRegionDomains('')).toEqual({});
        expect(parseRegionDomains('HK')).toEqual({});
        expect(parseRegionDomains('; ;')).toEqual({});
    });
});

describe('applyRegionDomains', () => {
    const mapping = parseRegionDomains(
        'HK=voxy-hk-1.pages.dev,voxy-hk-2.pages.dev;JP=voxy-jp-1.pages.dev'
    );

    const makeProxy = (tag) => ({
        tag,
        type: 'vless',
        tls: { enabled: true, server_name: 'example.com' },
        transport: { type: 'ws', headers: { host: 'example.com' } }
    });

    it('adds flag prefix and assigns domain round-robin per region', () => {
        const proxies = [
            makeProxy('HK Node A'),
            makeProxy('JP Node B'),
            makeProxy('HK Node C')
        ];
        const result = applyRegionDomains(proxies, mapping);

        expect(result[0].tag).toBe('🇭🇰 HK Node A');
        expect(result[0].tls.server_name).toBe('voxy-hk-1.pages.dev');
        expect(result[0].transport.headers.host).toBe('voxy-hk-1.pages.dev');

        expect(result[1].tag).toBe('🇯🇵 JP Node B');
        expect(result[1].tls.server_name).toBe('voxy-jp-1.pages.dev');

        expect(result[2].tag).toBe('🇭🇰 HK Node C');
        expect(result[2].tls.server_name).toBe('voxy-hk-2.pages.dev');
    });

    it('does not duplicate flag if already present', () => {
        const proxies = [makeProxy('🇭🇰 HK Node')];
        const result = applyRegionDomains(proxies, mapping);
        expect(result[0].tag).toBe('🇭🇰 HK Node');
    });

    it('leaves unmatched regions unchanged', () => {
        const proxy = makeProxy('US Node');
        const result = applyRegionDomains([proxy], mapping);
        expect(result[0]).toBe(proxy);
    });

    it('returns original array when no mapping configured', () => {
        const proxies = [makeProxy('HK Node')];
        expect(applyRegionDomains(proxies, {})).toBe(proxies);
    });
});
