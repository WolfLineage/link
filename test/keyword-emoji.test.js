import { describe, it, expect } from 'vitest';
import { parseKeywordEmojiRules, applyKeywordEmojiRules } from '../src/services/keywordEmojiService.js';

describe('parseKeywordEmojiRules', () => {
    it('parses add and replace modes, defaulting to add', () => {
        const rules = parseKeywordEmojiRules([
            'HK 🇭🇰 add',
            'JP 🇯🇵 replace',
            'US 🇺🇸'
        ].join('\n'));
        expect(rules).toEqual([
            { keyword: 'HK', emoji: '🇭🇰', mode: 'add' },
            { keyword: 'JP', emoji: '🇯🇵', mode: 'replace' },
            { keyword: 'US', emoji: '🇺🇸', mode: 'add' }
        ]);
    });

    it('supports keywords with spaces and ignores comments and blank lines', () => {
        const rules = parseKeywordEmojiRules('# comment\nHong Kong 🇭🇰 replace\n\n台湾 🇹🇼 add');
        expect(rules).toEqual([
            { keyword: 'Hong Kong', emoji: '🇭🇰', mode: 'replace' },
            { keyword: '台湾', emoji: '🇹🇼', mode: 'add' }
        ]);
    });

    it('returns empty for empty or incomplete input', () => {
        expect(parseKeywordEmojiRules('')).toEqual([]);
        expect(parseKeywordEmojiRules('HK')).toEqual([]);
    });
});

describe('applyKeywordEmojiRules', () => {
    const rules = parseKeywordEmojiRules('HK 🇭🇰 add;JP 🇯🇵 replace'.replace(';', '\n'));

    it('adds emoji before keyword and keeps original text in add mode', () => {
        const result = applyKeywordEmojiRules([{ tag: 'HK Node A' }], [rules[0]]);
        expect(result[0].tag).toBe('🇭🇰 HK Node A');
    });

    it('replaces keyword with emoji in replace mode', () => {
        const result = applyKeywordEmojiRules([{ tag: 'JP Node B' }], [rules[1]]);
        expect(result[0].tag).toBe('🇯🇵 Node B');
    });

    it('is case-insensitive and does not duplicate existing emoji', () => {
        const once = applyKeywordEmojiRules([{ tag: 'hk Node' }], [rules[0]]);
        expect(once[0].tag).toBe('🇭🇰 hk Node');
        const twice = applyKeywordEmojiRules(once, [rules[0]]);
        expect(twice[0].tag).toBe('🇭🇰 hk Node');
    });

    it('leaves unmatched nodes and returns original array with no rules', () => {
        const proxies = [{ tag: 'US Node' }, { tag: 'HK Node' }];
        expect(applyKeywordEmojiRules(proxies, [rules[0]])[0]).toBe(proxies[0]);
        expect(applyKeywordEmojiRules(proxies, [])).toBe(proxies);
    });
});
