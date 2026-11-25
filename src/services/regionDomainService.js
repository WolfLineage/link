/**
 * Region-based node naming and SNI/host rewriting.
 * Parses a user-supplied mapping such as
 *   HK=voxy-hk-1.pages.dev,voxy-hk-2.pages.dev;JP=voxy-jp-1.pages.dev
 * then assigns domains round-robin per region and prefixes node names with flags.
 */

import { parseCountryFromNodeName } from '../utils.js';

export function parseRegionDomains(raw) {
    if (!raw || typeof raw !== 'string') return {};

    const result = {};
    for (const chunk of raw.split(';')) {
        const segment = chunk.trim();
        if (!segment) continue;
        const eq = segment.indexOf('=');
        if (eq < 1) continue;

        const code = segment.slice(0, eq).trim().toUpperCase();
        const domains = segment.slice(eq + 1)
            .split(',')
            .map(domain => domain.trim())
            .filter(Boolean);
        if (domains.length) result[code] = domains;
    }
    return result;
}

function hasFlag(name, emoji) {
    return Boolean(emoji) && name.startsWith(emoji);
}

function rewriteProxy(proxy, info, domains, index) {
    if (!proxy || typeof proxy !== 'object') return proxy;

    const rawName = typeof proxy.tag === 'string' ? proxy.tag : '';
    const name = hasFlag(rawName, info.emoji)
        ? rawName
        : `${info.emoji}${info.emoji ? ' ' : ''}${rawName}`;

    const domain = domains[index % domains.length];
    const next = { ...proxy, tag: name };

    if (next.tls && typeof next.tls === 'object') {
        next.tls = { ...next.tls, server_name: domain };
    }
    if (next.transport && typeof next.transport === 'object') {
        next.transport = { ...next.transport, host: domain };
        if (next.transport.headers && typeof next.transport.headers === 'object') {
            next.transport.headers = { ...next.transport.headers, host: domain };
        }
    }
    // Some inputs carry SNI at the top level (Clash YAML style).
    if ('servername' in next) next.servername = domain;
    if ('sni' in next) next.sni = domain;

    return next;
}

/**
 * Apply flag prefixes and per-region domain assignment to parsed proxies.
 * Returns the original array unchanged when no mapping is configured.
 */
export function applyRegionDomains(proxies, mapping) {
    if (!mapping || Object.keys(mapping).length === 0 || !Array.isArray(proxies)) {
        return proxies;
    }

    const counters = {};
    return proxies.map(proxy => {
        const rawName = proxy && typeof proxy === 'object'
            ? (typeof proxy.tag === 'string' ? proxy.tag : '')
            : '';
        const info = parseCountryFromNodeName(rawName);
        if (!info) return proxy;

        const domains = mapping[info.code] || mapping[info.code.toUpperCase()];
        if (!domains || domains.length === 0) return proxy;

        const index = counters[info.code] || 0;
        counters[info.code] = index + 1;
        return rewriteProxy(proxy, info, domains, index);
    });
}
