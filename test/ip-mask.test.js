import { describe, it, expect } from 'vitest';
import { isPublicIpv4, ipToHost, applyIpMask, applyIpMaskToUriText } from '../src/services/ipMaskService.js';

describe('ipMaskService', () => {
    it('converts public IPv4 to hex sslip.io host', () => {
        expect(ipToHost('43.128.25.55')).toBe('2b801937.g06.sslip.io');
        expect(isPublicIpv4('43.128.25.55')).toBe(true);
    });

    it('excludes placeholder and private ranges', () => {
        expect(isPublicIpv4('0.0.0.0')).toBe(false);
        expect(isPublicIpv4('10.0.0.1')).toBe(false);
        expect(isPublicIpv4('192.168.1.1')).toBe(false);
        expect(isPublicIpv4('8.210.17.170')).toBe(true);
    });

    it('masks proxy.server only when enabled', () => {
        const proxies = [
            { tag: 'A', server: '43.128.25.55' },
            { tag: 'B', server: '0.0.0.0' }
        ];
        const masked = applyIpMask(proxies, true);
        expect(masked[0].server).toBe('2b801937.g06.sslip.io');
        expect(masked[1].server).toBe('0.0.0.0');
        expect(applyIpMask(proxies, false)).toBe(proxies);
    });

    it('masks only @server part of share links, leaving turn= params', () => {
        const line = 'vless://uuid@43.128.25.55:443?path=/x?turn=129.226.148.26:3478#HK';
        const out = applyIpMaskToUriText(line, true);
        expect(out).toContain('@2b801937.g06.sslip.io:443');
        expect(out).toContain('turn=129.226.148.26:3478');
    });
});
