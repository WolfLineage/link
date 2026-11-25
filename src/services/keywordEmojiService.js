/**
 * User-defined keyword -> emoji rules for node names.
 * Each line: KEYWORD EMOJI [add|replace]
 *   add     -> insert emoji before the keyword, keep the keyword text
 *   replace -> replace the keyword text with the emoji
 * Keywords may contain spaces; parsing is done from the right.
 */

import { parseCountryFromNodeName, COUNTRY_DATA } from '../utils.js';

const MODES = new Set(['add', 'replace']);

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Map each configured emoji to the country resolved from its keyword.
 * Group names then display the user's emoji instead of the hardcoded flag.
 */
export function buildEmojiCountryMap(rules) {
    const map = {};
    if (!Array.isArray(rules)) return map;

    for (const rule of rules) {
        const info = parseCountryFromNodeName(rule.keyword);
        if (!info) continue;
        // Keep the country name from COUNTRY_DATA; only the emoji is user-driven.
        map[rule.emoji] = { ...info, emoji: rule.emoji };
    }
    return map;
}

export function isStandardCountryEmoji(emoji) {
    return Object.values(COUNTRY_DATA).some(c => c.emoji === emoji);
}

export function parseKeywordEmojiRules(raw) {
    if (!raw || typeof raw !== 'string') return [];

    const rules = [];
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const tokens = trimmed.split(/\s+/);
        if (tokens.length < 2) continue;

        let mode = 'add';
        const last = tokens[tokens.length - 1].toLowerCase();
        if (MODES.has(last)) {
            mode = last;
            tokens.pop();
        }

        const emoji = tokens.pop();
        const keyword = tokens.join(' ');
        if (!keyword || !emoji) continue;

        rules.push({ keyword, emoji, mode });
    }
    return rules;
}

export function applyKeywordEmojiRules(proxies, rules) {
    if (!Array.isArray(rules) || rules.length === 0 || !Array.isArray(proxies)) {
        return proxies;
    }

    return proxies.map(proxy => {
        if (!proxy || typeof proxy !== 'object' || typeof proxy.tag !== 'string' || !proxy.tag) {
            return proxy;
        }

        let name = proxy.tag;
        for (const { keyword, emoji, mode } of rules) {
            const pattern = escapeRegex(keyword);
            const matcher = new RegExp(pattern, 'i');
            if (!matcher.test(name)) continue;

            if (mode === 'replace') {
                name = name.replace(new RegExp(pattern, 'gi'), emoji);
            } else {
                name = name.replace(new RegExp(pattern, 'gi'), (match, offset, full) => {
                    const before = full.slice(0, offset);
                    // Avoid stacking the same emoji when the rule runs twice.
                    if (before.trimEnd().endsWith(emoji)) return match;
                    const separator = before.length > 0 && !/\s$/.test(before) ? ' ' : '';
                    return `${separator}${emoji} ${match}`;
                });
            }
        }

        if (name === proxy.tag) return proxy;
        return { ...proxy, tag: name };
    });
}
