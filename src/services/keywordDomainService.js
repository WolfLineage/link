/**
 * Keyword -> domain pool assignment.
 * Each line: KEYWORD=DOMAIN. Repeating a keyword builds a pool for it.
 * A node whose name matches a keyword picks a random domain from that pool.
 */

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseKeywordDomains(raw) {
    if (!raw || typeof raw !== 'string') return {};

    const pools = {};
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq < 1) continue;

        const keyword = trimmed.slice(0, eq).trim();
        const domain = trimmed.slice(eq + 1).trim();
        if (!keyword || !domain) continue;

        if (!pools[keyword]) pools[keyword] = [];
        if (!pools[keyword].includes(domain)) pools[keyword].push(domain);
    }
    return pools;
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

export function applyKeywordDomains(proxies, pools) {
    if (!pools || Object.keys(pools).length === 0 || !Array.isArray(proxies)) {
        return proxies;
    }

    const entries = Object.entries(pools);
    return proxies.map(proxy => {
        if (!proxy || typeof proxy !== 'object' || typeof proxy.tag !== 'string' || !proxy.tag) {
            return proxy;
        }

        const name = proxy.tag;
        let domain = null;
        for (const [keyword, domains] of entries) {
            if (new RegExp(escapeRegex(keyword), 'i').test(name)) {
                domain = pickRandom(domains);
                break;
            }
        }
        if (!domain) return proxy;

        const next = { ...proxy };
        if (next.tls && typeof next.tls === 'object') {
            next.tls = { ...next.tls, server_name: domain };
        }
        if (next.transport && typeof next.transport === 'object') {
            next.transport = { ...next.transport, host: domain };
            if (next.transport.headers && typeof next.transport.headers === 'object') {
                next.transport.headers = { ...next.transport.headers, host: domain };
            }
        }
        if ('servername' in next) next.servername = domain;
        if ('sni' in next) next.sni = domain;

        return next;
    });
}
