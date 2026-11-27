/**
 * Overrides for built-in proxy groups (Node Select, Ad Block, country groups, ...).
 * Input JSON: [{ "name": "🚀 节点选择", "members": ["节点A", "DIRECT"], "type": "select", "interval": 300, "disabled": false }]
 * - name: exact group name to override (required)
 * - members: full replacement member list (optional; order preserved)
 * - type: select | url-test | fallback (optional)
 * - url / interval: url-test parameters (optional)
 * - disabled: remove the group entirely (optional)
 */

const ALLOWED_TYPES = new Set(['select', 'url-test', 'fallback']);

export function parseGroupOverrides(raw) {
    if (!raw || typeof raw !== 'string') return [];
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return [];
    }
    if (!Array.isArray(parsed)) return [];

    return parsed
        .filter(g => g && typeof g === 'object' && typeof g.name === 'string' && g.name.trim())
        .map(g => {
            const out = { name: g.name.trim() };
            if (Array.isArray(g.members)) {
                out.members = g.members.filter(m => typeof m === 'string' && m.trim()).map(m => m.trim());
            }
            if (ALLOWED_TYPES.has(g.type)) out.type = g.type;
            if (typeof g.url === 'string' && g.url.trim()) out.url = g.url.trim();
            if (typeof g.interval === 'number' && g.interval > 0) out.interval = g.interval;
            out.disabled = g.disabled === true;
            return out;
        });
}
