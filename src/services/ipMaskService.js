/**
 * Turn public IPv4 server addresses into <hex>.g06.sslip.io hostnames.
 * sslip.io resolves hex-form IPv4 back to the same address, so the connection
 * target is unchanged while plain IPs disappear from the subscription.
 * Only the proxy `server` field is rewritten; path/SNI/turn parameters stay.
 */

const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;

function isPlaceholderIp(ip) {
    return ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('0.') || ip.startsWith('10.') ||
        ip.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

export function isPublicIpv4(value) {
    const ip = String(value || '').trim();
    if (!IPV4_PATTERN.test(ip) || isPlaceholderIp(ip)) return false;
    return ip.split('.').every(part => {
        const n = Number(part);
        return Number.isInteger(n) && n >= 0 && n <= 255;
    });
}

export function ipToHost(ip) {
    const hex = String(ip).trim()
        .split('.')
        .map(part => Number(part).toString(16).padStart(2, '0'))
        .join('');
    return `${hex}.g06.sslip.io`;
}

/**
 * Rewrite proxy.server for public IPv4 addresses. Returns a new array only
 * when something changed, otherwise the original array (no allocation).
 */
export function applyIpMask(proxies, enabled) {
    if (!enabled || !Array.isArray(proxies)) return proxies;

    let changed = false;
    const result = proxies.map(proxy => {
        if (!proxy || typeof proxy !== 'object' || typeof proxy.server !== 'string') return proxy;
        if (!isPublicIpv4(proxy.server)) return proxy;
        changed = true;
        return { ...proxy, server: ipToHost(proxy.server) };
    });
    return changed ? result : proxies;
}

// Share-link text (ss/vless/vmess://...): rewrite only the @server:port part,
// leaving path/query fields (e.g. turn=IP:port) untouched.
const URI_SERVER_PATTERN = /(\b[a-z][a-z0-9+.-]*:\/\/[^\s/@]+@)(\d{1,3}(?:\.\d{1,3}){3})(:\d+)/gi;

export function applyIpMaskToUriText(text, enabled) {
    if (!enabled || typeof text !== 'string' || !text) return text;
    return text.replace(URI_SERVER_PATTERN, (whole, prefix, ip, port) => {
        return isPublicIpv4(ip) ? `${prefix}${ipToHost(ip)}${port}` : whole;
    });
}
