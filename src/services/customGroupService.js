/**
 * User-defined proxy groups.
 * Input JSON: [{ "name": "游戏专用", "type": "select", "members": ["🇭🇰 Hong Kong", "🚀 节点选择"] }]
 * `members` may reference proxy names, auto/manual selector names, country
 * group names, or DIRECT/REJECT. Type defaults to `select`.
 */

const ALLOWED_TYPES = new Set(['select', 'url-test', 'fallback']);

export function parseCustomGroups(raw) {
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
            const type = ALLOWED_TYPES.has(g.type) ? g.type : 'select';
            const members = Array.isArray(g.members)
                ? g.members.filter(m => typeof m === 'string' && m.trim()).map(m => m.trim())
                : [];
            return { name: g.name.trim(), type, members };
        })
        .filter(g => g.members.length > 0);
}
