<div align="center">
  <img src="public/favicon.png" alt="Subconverter For CF" width="120" height="120"/>

  <h1><b>Subconverter For CF</b></h1>
  <p><b>一个订阅转换工具：把各种订阅链接转换成 Clash / Sing-Box / Surge / Xray 等客户端能用的格式。</b></p>
  <p>可部署在 Cloudflare Workers、Vercel、Node.js 或 Docker。这是 sublink-worker 的独立分支。</p>

  <p>
    <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/WolfLineage/link">
      <img src="https://deploy.workers.cloudflare.com/button" alt="一键部署到 Cloudflare Workers" style="height: 40px;"/>
    </a>
  </p>
</div>

---

## 一、这是什么（新手先看这里）

简单说：**它是一个"订阅格式转换器"**。

你手上有订阅链接，但客户端（Clash、Sing-Box 等）不认，或者你想自定义规则（广告拦截、地区分组、节点改名等）。把这个工具部署好，把订阅链接填进去，它就能生成客户端可以直接导入的新链接。

**它能做什么：**
- 转换格式：Clash、Sing-Box、Surge、Xray 等
- 内置规则：广告拦截、国内直连、Google / YouTube 等常用分流
- 自定义节点名：按关键词加旗帜 emoji、替换文字
- 自定义分组：自己建节点分组、调整内置分组的成员和顺序
- 保存配置：多套预设自动保存，一键切换
- 生成短链接（可选，需要配置 KV）

---

## 二、最简单的部署方法（推荐小白）

### 方法一：Cloudflare Workers 一键部署

1. 点上面的 **「Deploy to Cloudflare Workers」** 按钮
2. 用你的 GitHub 账号登录（没有就先注册）
3. 点击 **「Deploy」/「部署」**，等待 1-2 分钟
4. 部署完成后，会给你一个类似 `https://xxx.workers.dev` 的网址——这就是你的工具地址，打开就能用

**不需要懂代码，不需要买服务器，Cloudflare 免费额度足够个人使用。**

> 说明：默认不启用短链接功能，但这不影响核心转换功能。想开短链接请看下面的「进阶」。

### 方法二：Docker 部署（有服务器的话）

```bash
git clone https://github.com/WolfLineage/link.git
cd link
docker compose up -d
```

然后访问 `http://你的服务器IP:8787`。

### 方法三：Node.js 本地运行

```bash
npm install
npm run dev:node
```

然后访问 `http://localhost:8787`。

---

## 三、怎么用（部署完成后）

1. 打开你的工具网址（比如 `https://xxx.workers.dev`）
2. 把订阅链接粘贴到最上面的输入框
3. （可选）展开「高级选项」，勾选规则、设置旗帜、编辑分组
4. 点「转换」，会生成几个客户端链接
5. 复制对应客户端的链接，导入到 Clash / Sing-Box 等客户端即可

**给小白的建议**：刚开始只用默认设置就行。高级选项里那一堆「自定义规则 / 自定义代理组 / 编辑内置分组」都可以先不管，用熟练了再研究。

---

## 四、进阶：开启短链接（可选）

短链接能把很长的订阅链接缩短成 `https://你的域名/短码`。不开也能正常用。

开启方法：
1. 登录 Cloudflare Dashboard → 存储和数据库 → KV → 创建一个命名空间（名字随意，比如 `link-kv`）
2. 复制创建后显示的 **Namespace ID**
3. 在项目里打开 `wrangler.toml`，取消下面几行的注释，把 ID 换成你自己的：

```toml
kv_namespaces = [
  { binding = "SUBLINK_KV", id = "你的Namespace ID" }
]
```

4. 重新部署一次即可。

---

## 五、常见问题

**Q：一键部署报错怎么办？**
A：绝大多数是网络问题，重试一次即可。如果反复失败，确认你已登录 GitHub 且账号正常。

**Q：部署后打开网址是空白/报错？**
A：等 1-2 分钟再刷新（首次部署需要初始化）。仍不行就在 Cloudflare Workers 页面看日志。

**Q：转换出来的链接客户端导入失败？**
A：确认选对了客户端类型（Clash 用 Clash 链接，Sing-Box 用 Sing-Box 链接）。

**Q：广告拦截没生效？**
A：在「规则选择」里勾选「广告拦截」，然后重新转换、更新订阅。

**Q：怎么更新到最新版？**
A：如果是 Cloudflare 一键部署的，重新点一次部署按钮即可。

---

## 六、支持的协议和客户端

- **协议**：ShadowSocks、VMess、VLESS、Hysteria2、Trojan、TUIC
- **客户端**：Sing-Box、Clash、Xray / V2Ray、Surge
- **输入**：Base64 订阅、HTTP/HTTPS 订阅、完整配置（Sing-Box JSON、Clash YAML、Surge INI）

---

## 七、关于这个项目

这是 [sublink-worker](https://github.com/7Sageer/sublink-worker) 的独立分支，由 [WolfLineage](https://github.com/WolfLineage) 维护。

当前版本：**v2.6.0**

## 八、许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 九、免责声明

本项目仅用于学习和交流，请勿用于非法用途。使用本项目产生的一切后果由使用者自行承担，与开发者无关。
