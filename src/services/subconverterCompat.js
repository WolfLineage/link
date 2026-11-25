/**
 * Subconverter-compatible endpoints for EDT panels.
 * EDT only accepts a backend after GET /version returns 200 with "subconverter"
 * in the body, then calls GET /sub?target=...&url=... for actual conversion.
 */

const TARGET_ROUTES = {
    clash: 'clash',
    clashr: 'clash',
    meta: 'clash',
    singbox: 'singbox',
    'sing-box': 'singbox',
    sb: 'singbox',
    surge: 'surge',
    mixed: 'xray',
    v2ray: 'xray',
    ss: 'xray',
    ssr: 'xray',
    sssub: 'xray'
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*'
};

export const SUBCONVERTER_VERSION = 'subconverter v2.1.0 backend';

export function resolveTargetRoute(target) {
    const key = String(target || 'clash').split('&')[0].trim().toLowerCase();
    return TARGET_ROUTES[key] ?? null;
}

export function normalizeSubscriptionInput(rawUrl) {
    if (!rawUrl) return '';
    return String(rawUrl)
        .split('|')
        .map(part => part.trim())
        .filter(Boolean)
        .join('\n');
}

// Subconverter carries its INI config URL in `config`; sublink-worker rule
// options are only meaningful when that URL explicitly contains them.
function readRuleParams(config) {
    if (!config || !config.includes('://')) return {};
    try {
        const url = new URL(config);
        const result = {};
        for (const key of ['selectedRules', 'customRules', 'group_by_country', 'include_auto_select', 'lang', 'keywordEmoji', 'keywordDomains', 'ipMask']) {
            const value = url.searchParams.get(key);
            if (value !== null) result[key] = value;
        }
        return result;
    } catch {
        return {};
    }
}

export function createSubconverterCompat({ app }) {
    const withCors = (response) => {
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Access-Control-Allow-Headers', '*');
        return new Response(response.body, { status: response.status, headers });
    };

    const version = (c) => c.text(SUBCONVERTER_VERSION, 200, CORS_HEADERS);
    const preflight = () => new Response(null, { status: 204, headers: CORS_HEADERS });

    const sub = async (c) => {
        const target = c.req.query('target') || 'clash';
        const route = resolveTargetRoute(target);
        if (!route) {
            return c.text(`Unsupported target: ${target}`, 400, CORS_HEADERS);
        }

        const rawUrl = c.req.query('url');
        const input = normalizeSubscriptionInput(rawUrl);
        if (!input) {
            return c.text('Missing url parameter', 400, CORS_HEADERS);
        }

        const internalUrl = new URL(`/${route}`, c.req.url);
        internalUrl.searchParams.set('config', input);

        for (const [key, value] of Object.entries(readRuleParams(c.req.query('config')))) {
            internalUrl.searchParams.set(key, value);
        }

        const keywordEmoji = c.req.query('keywordEmoji');
        if (keywordEmoji) internalUrl.searchParams.set('keywordEmoji', keywordEmoji);
        const keywordDomains = c.req.query('keywordDomains');
        if (keywordDomains) internalUrl.searchParams.set('keywordDomains', keywordDomains);
        const ipMask = c.req.query('ipMask');
        if (ipMask) internalUrl.searchParams.set('ipMask', ipMask);

        const lang = c.req.query('lang') || c.get('lang');
        if (lang) internalUrl.searchParams.set('lang', lang);

        const ua = c.req.query('ua');
        if (ua) internalUrl.searchParams.set('ua', ua);

        const response = await app.fetch(
            new Request(internalUrl, { headers: c.req.raw.headers })
        );
        const result = withCors(response);

        const filename = c.req.query('filename');
        if (filename) {
            result.headers.set(
                'Content-Disposition',
                `attachment; filename*=utf-8''${encodeURIComponent(filename)}`
            );
        }
        return result;
    };

    return { version, preflight, sub };
}
