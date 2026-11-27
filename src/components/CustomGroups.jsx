/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

/**
 * Visual editor for user-defined proxy groups.
 * Each group: name + type (select / url-test) + member names (comma separated).
 * Members may be node names, selector names, country groups, DIRECT or REJECT.
 * State is stored in the hidden `customGroups` input as a JSON array.
 */
export const CustomGroups = (props) => {
    const { t } = props;

    return (
        <div x-data="customGroupsData()" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <i class="fas fa-layer-group text-gray-400"></i>
                    自定义代理组 (Custom Groups)
                </h3>
            </div>

            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                自己创建分组并指定成员，分组会出现在客户端的节点选择里。成员填节点名/地区组名，用逗号分隔。
            </p>

            <template x-if="groups.length === 0">
                <div class="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <p class="text-gray-500 dark:text-gray-400 mb-3">还没有自定义分组</p>
                    <button type="button" x-on:click="addGroup()" class="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
                        <i class="fas fa-plus mr-1"></i>添加分组
                    </button>
                </div>
            </template>

            <div class="space-y-4">
                <template x-for="(group, index) in groups" x-bind:key="index">
                    <div class="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                            <span class="font-medium text-gray-900 dark:text-white" x-text="'分组 ' + (index + 1)"></span>
                            <button type="button" x-on:click="removeGroup(index)" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="sm:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">分组名称</label>
                                <input type="text" x-model="group.name" placeholder="例如：🎮 游戏专用" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
                                <select x-model="group.type" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                                    <option value="select">手动选择 (select)</option>
                                    <option value="url-test">自动测速择优 (url-test)</option>
                                    <option value="fallback">故障转移 (fallback)</option>
                                </select>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">成员（逗号分隔）</label>
                                <textarea x-model="group.membersText" rows="2" placeholder="例如：HKNode, 🇭🇰 Hong Kong, 🚀 节点选择" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"></textarea>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <div class="mt-4 flex flex-wrap gap-3">
                <button type="button" x-on:click="addGroup()" class="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 font-medium">
                    <i class="fas fa-plus mr-1"></i>添加分组
                </button>
                <button type="button" x-on:click="clearAll()" x-show="groups.length > 0" class="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 font-medium">
                    <i class="fas fa-trash mr-1"></i>清空
                </button>
            </div>

            <input type="hidden" name="customGroups" x-bind:value="JSON.stringify(groups.map(g => ({ name: g.name, type: g.type, members: g.membersText.split(',').map(s => s.trim()).filter(Boolean) })).filter(g => g.name && g.members.length))" />

            <script dangerouslySetInnerHTML={{
                __html: `
        function customGroupsData() {
          return {
            groups: [],
            init() {
              window.addEventListener('restore-custom-groups', (event) => {
                if (event.detail && Array.isArray(event.detail.groups)) {
                  this.groups = event.detail.groups.map(g => ({
                    name: g.name || '',
                    type: g.type || 'select',
                    membersText: Array.isArray(g.members) ? g.members.join(', ') : ''
                  }));
                }
              });
            },
            addGroup() {
              this.groups.push({ name: '', type: 'select', membersText: '' });
            },
            removeGroup(index) {
              this.groups.splice(index, 1);
            },
            clearAll() {
              if (!confirm('确定清空所有自定义分组？')) return;
              this.groups = [];
            }
          }
        }
      `
            }} />
        </div>
    );
};
