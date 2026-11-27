/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

import { UNIFIED_RULES } from '../config/index.js';
import { COUNTRY_DATA } from '../utils.js';

/**
 * Editor for overriding built-in proxy groups (members, order, type, params, disable).
 * Outputs JSON array to hidden input `groupOverrides`:
 * [{ name, members, type, url, interval, disabled }]
 */
export const GroupOverrides = (props) => {
    const { t } = props;

    // Built-in group display names: special selectors + rule groups + country groups.
    const specialKeys = ['Node Select', 'Auto Select', 'Manual Switch', 'Fall Back'];
    const builtinGroups = [
        ...specialKeys.map(k => ({ name: t(`outboundNames.${k}`), key: k })),
        ...UNIFIED_RULES.map(r => ({ name: t(`outboundNames.${r.name}`), key: r.name })),
        ...Object.values(COUNTRY_DATA).map(c => ({ name: `${c.emoji} ${c.name}`, key: c.code }))
    ];

    return (
        <div x-data={`groupOverridesData(${JSON.stringify(builtinGroups)})`} class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <i class="fas fa-sliders-h text-gray-400"></i>
                    编辑内置分组 (Edit Groups)
                </h3>
            </div>

            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                修改节点选择、广告拦截、地区组等内置分组的成员与顺序。改动会覆盖默认设置。
            </p>

            <div class="flex flex-wrap gap-2 mb-4">
                <select x-model="selectedGroup" class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm flex-1 min-w-[200px]">
                    <option value="">选择要编辑的内置分组…</option>
                    <template x-for="g in builtinGroups" x-bind:key="g.key">
                        <option x-bind:value="g.name" x-text="g.name"></option>
                    </template>
                </select>
                <button type="button" x-on:click="editGroup()" x-bind:disabled="!selectedGroup" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-lg font-medium text-sm">
                    编辑
                </button>
            </div>

            <template x-if="overrides.length === 0">
                <div class="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <p class="text-gray-500 dark:text-gray-400 text-sm">尚未修改任何内置分组</p>
                </div>
            </template>

            <div class="space-y-4">
                <template x-for="(ov, index) in overrides" x-bind:key="ov.name">
                    <div class="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                            <span class="font-medium text-gray-900 dark:text-white" x-text="ov.name"></span>
                            <div class="flex items-center gap-3">
                                <label class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                                    <input type="checkbox" x-model="ov.disabled" class="w-3.5 h-3.5" />
                                    禁用此组
                                </label>
                                <button type="button" x-on:click="removeOverride(index)" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">成员（逗号分隔，顺序即优先级）</label>
                                <textarea x-model="ov.membersText" rows="2" placeholder="例如：节点A, 节点B, 🇭🇰 Hong Kong, DIRECT" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"></textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">类型</label>
                                <select x-model="ov.type" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                                    <option value="">保持默认</option>
                                    <option value="select">手动选择</option>
                                    <option value="url-test">自动测速择优</option>
                                    <option value="fallback">故障转移</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">测速间隔（秒，url-test 用）</label>
                                <input type="number" x-model="ov.interval" placeholder="留空用默认" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <input type="hidden" name="groupOverrides" x-bind:value="JSON.stringify(overrides.map(o => { const r = { name: o.name, disabled: !!o.disabled }; const m = o.membersText.split(',').map(s => s.trim()).filter(Boolean); if (m.length) r.members = m; if (o.type) r.type = o.type; if (o.interval) r.interval = Number(o.interval); return r; }))" />

            <script dangerouslySetInnerHTML={{
                __html: `
        function groupOverridesData(builtinGroups) {
          return {
            builtinGroups: builtinGroups || [],
            selectedGroup: '',
            overrides: [],
            init() {
              window.addEventListener('restore-group-overrides', (event) => {
                if (event.detail && Array.isArray(event.detail.overrides)) {
                  this.overrides = event.detail.overrides.map(o => ({
                    name: o.name || '',
                    membersText: Array.isArray(o.members) ? o.members.join(', ') : '',
                    type: o.type || '',
                    interval: o.interval || '',
                    disabled: !!o.disabled
                  }));
                }
              });
            },
            editGroup() {
              if (!this.selectedGroup) return;
              if (!this.overrides.some(o => o.name === this.selectedGroup)) {
                this.overrides.push({ name: this.selectedGroup, membersText: '', type: '', interval: '', disabled: false });
              }
              this.selectedGroup = '';
            },
            removeOverride(index) {
              this.overrides.splice(index, 1);
            }
          }
        }
      `
            }} />
        </div>
    );
};
