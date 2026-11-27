<div align="center">
  <img src="public/favicon.png" alt="Subconverter For CF" width="120" height="120"/>

  <h1><b>Subconverter For CF</b></h1>
  <h5><i>One Worker, All Subscriptions</i></h5>

  <p><b>一个轻量级订阅转换与管理工具：把各种代理协议的订阅链接，转换成 Clash、Sing-Box、Xray、Surge 等客户端可直接使用的配置。</b></p>
  <p>可部署在 Cloudflare Workers、Vercel、Node.js 或 Docker。</p>

  <p>
    <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/WolfLineage/link">
      <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers" style="height: 36px;"/>
    </a>
  </p>
</div>

---

## 快速开始

### 一键部署（推荐）

点击页面上方的 **Deploy to Cloudflare Workers** 按钮，登录 GitHub 账号后点「Deploy」，等待 1–2 分钟即可。部署完成后会得到一个 `https://xxx.workers.dev` 的网址，打开即可使用，无需服务器、无需懂代码。

> 默认不启用短链接（KV 可选），不影响核心转换功能。开启方法见下方「常见问题」。

### 其他部署方式

- **Node.js**：`npm install && npm run dev:node`，访问 `http://localhost:8787`
- **Docker Compose**：`docker compose up -d`（含 Redis），访问 `http://服务器IP:8787`
- **Docker**：`docker build -t subconverter-for-cf . && docker run -p 8787:8787 subconverter-for-cf`
- **Vercel**：`vercel deploy`（KV 需在项目中另行配置）

### 使用步骤

1. 打开部署好的网址，把订阅链接粘贴到输入框
2. （可选）展开「高级选项」设置规则、旗帜、分组等
3. 点击「转换」，生成对应客户端的链接
4. 复制所需客户端的链接，导入客户端即可

---

## 功能特性

### 支持的协议

ShadowSocks • VMess • VLESS • Hysteria2 • Trojan • TUIC • AnyTLS

### 支持的客户端

Sing-Box（含 1.11 / 1.12 / 1.14 多版本适配）• Clash / Clash.Meta (Mihomo) • Xray / V2Ray • Surge

### 支持的输入

- Base64 编码订阅
- HTTP/HTTPS 订阅链接
- 完整配置（Sing-Box JSON、Clash YAML、Surge INI）
- 通过 `/sub`、`/subconverter` 等兼容端点对接 EDT 等面板

### 规则与分流

- **内置规则集**：最小化 / 平衡 / 全面三档预设，涵盖广告拦截、国内直连、Google、YouTube、GitHub、AI 服务等常用分流
- **广告拦截**：作为可见分组呈现，默认选中可用节点，规则直接指向该分组
- **IPv6 默认关闭**：DNS 与全局均默认关闭 IPv6，并可强制覆盖用户配置中的 IPv6 开启项
- **自定义规则**：按域名、域名关键词、IP、IP CIDR、Site 规则等条件，把指定流量导向指定出口
- **自定义代理组**：自由创建分组并指定成员，支持手动选择、自动测速择优、故障转移三种类型
- **编辑内置分组**：修改节点选择、广告拦截、地区组等内置分组的成员、顺序、类型与测速参数，也可禁用某个分组
- **地区分组**：按节点国家自动分组，分组旗帜可跟随用户为关键词设定的 emoji（未设定的地区用默认旗帜）
- **节点改名**：按关键词对节点名添加 emoji 或替换关键词（add / replace 两种模式）
- **关键词域名池**：按关键词把域名分配给不同节点组，支持随机分配
- **IP 隐藏**：把订阅中的节点 IP 替换为域名，保护真实 IP

### 配置与使用体验

- **多预设自动保存**：可建立多套配置预设，任何改动实时保存，下拉切换即恢复整套设置
- **保存的配置**：可把当前配置保存到服务端（KV 或 Redis），通过短码访问
- **短链接**：支持固定短码与随机短码（需配置 KV）
- **亮色 / 暗色主题**
- **多语言**：中文、英文、波斯语、俄语
- **灵活的 API**：`/clash`、`/singbox`、`/surge`、`/xray`、`/sub`、`/subconverter`、`/version` 等端点，便于脚本自动化

---

## 常见问题

**一键部署报错？** 多为网络问题，重试即可；确认已登录 GitHub 且账号正常。

**部署后打开是空白？** 首次部署需 1–2 分钟初始化，稍后刷新；仍不行可在 Cloudflare Workers 页面查看日志。

**短链接怎么用？** 在 Cloudflare Dashboard 创建一个 KV 命名空间，取消 `wrangler.toml` 中 `kv_namespaces` 段的注释并填入你的 Namespace ID，重新部署即可。核心转换功能不依赖 KV。

**广告拦截没生效？** 在「规则选择」中勾选「广告拦截」，重新转换并更新订阅。

**如何更新？** 一键部署的用户重新点击部署按钮即可。

---

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE)。

## 免责声明

本项目仅用于学习和交流，请勿用于非法用途。使用本项目产生的一切后果由使用者自行承担，与开发者无关。

---

## 鸣谢与出处

本项目源自 [7Sageer/sublink-worker](https://github.com/7Sageer/sublink-worker)，在其基础上进行了独立演化与功能扩展。感谢原项目作者的开源贡献。
