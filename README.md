# NetOps

> 以拓扑学网络，以实验验原理，以画布沉淀知识。

NetOps 是中文优先的网络拓扑学习与个人知识整理网站：用独立合成的拓扑讲清网络机制，用外部实验指导核验原理，用同一套画布沉淀课程图解与个人笔记。它不是浏览器里的协议模拟器，也不连接真实设备。

## 当前状态

V0.1 初始集成 MVP 已在本地完成实现与验证，功能按真实边界交付；功能与文档已完成，当前位于功能分支 `feat/netops-v0.1-mvp`，准备一次 Ready PR；尚未合并 `main`。后续按负责人实际体验迭代 Bug、课程与体验细节。

本版已实现的核心闭环：

- 学习首页、课程目录、课程工作台；
- 课程步骤高亮、通俗讲解与专业理论双层阅读、外部实验指导、挑战题、复制为个人画布；
- 自由画布：图标放置、拖动、连线、属性编辑、节点备注、撤销/重做、本地保存、JSON 导入导出；
- 我的记录、深色/浅色主题、全屏看图。

真实边界：课程内容基于本地解析稿的通用知识重新编写，使用独立合成拓扑；实验状态逐课标注，未实机验证的指导不会写成已通过。

## 功能

### 学习

- **首页**：能力层级说明、推荐入口与课程概览，可直接进入任意已发布课程。
- **课程目录**：按 L1–L5 展示 13 门已发布课程与 5 条学习路径。
- **课程工作台**：左侧步骤导航，中间只读拓扑，右侧可切换通俗讲解、专业理论、外部实验与挑战；步骤切换会高亮对应节点与链路；支持全屏看图与“复制为我的画布”。

### 自由画布

- 19 个本地蓝色设备图标，按类别检索；
- 拖拽或点击放置，节点拖动、手动连线、节点/连线/画布属性与备注；
- 撤销/重做（最多 30 步）、本地自动保存与手动保存；
- 多画布列表、重命名、复制、删除确认；
- JSON 导出与导入（导入仅接受受限 schema）。

### 我的记录与界面

- **我的记录**：本机阅读记录与本机画布入口；
- **深浅主题**：首次会话默认深色，可随时切换；
- **全屏看图**：课程只读拓扑放大查看，保留步骤切换与关闭回焦。

## 技术栈

| 项目 | 版本/说明 |
| --- | --- |
| Node.js | 22.19.0（`.nvmrc`；`package.json` 要求 `>=20.19.0`） |
| Vue | 3.5.46 |
| Vite | 7.3.8 |
| Vue Router | 4.6.5，hash 路由 |
| Vue Flow | 1.48.2 |
| TypeScript | 5.9.3 |
| Vitest | 4.1.12 |
| Playwright | 1.65.1（Chromium） |
| ESLint | 9.39.5 |

## 本地启动

安装依赖：

```bash
npm ci
```

开发模式：

```bash
npm run dev
```

默认开发地址为 `http://localhost:5173/`。

生产构建与本地预览：

```bash
npm run build
npm run preview -- --port 8080 --strictPort
```

访问 `http://127.0.0.1:8080/`。生产预览只提供静态 `dist/`，不需要后端、账号或数据库。

路由使用 hash 模式（`createWebHashHistory`），深链形如：

- `/#/learn/l1-ping-path`
- `/#/canvas/canvas-...`
- `/#/notes`

静态托管只需提供 `index.html` 与构建资源，不依赖服务器 SPA fallback；hash 片段由浏览器处理，刷新深链不会落到服务器 404。

## 校验命令

以下命令均在 `repo/` 目录执行，且已在当前工作区实际运行：

| 命令 | 作用 |
| --- | --- |
| `npm run lint` | ESLint，零警告 |
| `npm run typecheck` | `vue-tsc --noEmit` 类型检查 |
| `npm run test` | Vitest 单元测试（4 个文件、52 个用例） |
| `npm run test:e2e` | Playwright + Chromium 端到端测试（6 个用例） |
| `npm run build` | 类型检查并生成 `dist/` |
| `npm run verify` | 依次执行 lint、typecheck、test、build |
| `npm run check:boundary` | 公共边界检查：敏感词、私有地址、SVG 危险内容、凭据与参考素材路径 |

`test:e2e` 需要本机已安装 Playwright Chromium；测试会自行构建并启动预览服务器。当前 E2E 仅覆盖 Chromium，未覆盖 Firefox/WebKit。

## 目录结构

```text
repo/
├── src/
│   ├── app/                 # 路由、主题、Toast
│   ├── assets/network-icons/ # 本地设备图标（visio/ 为 19 个 PNG）
│   ├── components/          # 共用节点、卡片、进度环等
│   ├── content/             # 课程、合成拓扑、公共主题与统计
│   ├── domain/              # 类型、画布操作、内容校验、图标注册表
│   ├── features/            # 学习、画布、记录页面
│   ├── storage/             # localStorage 版本化读写与 typed error
│   └── styles/              # 深/浅主题 tokens 与布局样式
├── tests/                   # Vitest 单元测试
├── e2e/                     # Playwright 端到端测试
├── scripts/                 # 签名实验记录脚本、公共边界检查
├── docs/                    # 资产、内容地图、交付报告、实验记录、截图
├── 蓝图.md                  # V0.1 实施范围
└── AGENTS.md                # 协作约定
```

## 内容与安全边界

- 公开内容只使用**独立合成拓扑**、RFC 5737 文档保留 IPv4 地址、必要的 RFC 3849 文档前缀与公开标准来源。
- 不包含 27 份原始解析、原图、真实网络结构、组织/地址/配置/内部标识、可逆映射或厂商镜像；原始资料只做本地只读研究，不入库、不入 CI、不出现在截图与网页中。
- eNSP、EVE-NG、OpenSSL 实验由用户在自行取得且隔离的环境中运行；本网站不连接设备、不发包、不执行 CLI、不读取真实回显。
- 画布与学习记录只写入浏览器 `localStorage`，属于本机数据，不代表认证、技能等级或云端同步；清除站点数据会丢失，可用 JSON 导出备份。
- 导入 JSON 限制为 2 MiB、40 个节点、80 条边、6 个区域；本地存储失败不会覆盖可恢复的旧稿；错误使用固定 `code` 区分，如 `IMPORT_INVALID`、`STORAGE_FULL`。

## 已知限制

- **课程与拓扑是 13 门、13 套合成拓扑，不是 27 张原图的一一对应**；V0.1 只覆盖已提炼的通用知识主题。
- 实验共 13 门：1 门 OpenSSL 实验实机验证（`l5-signature`，OpenSSL 3.0.13，2026-11-28），12 门为文档指导、未实机验证（其中 11 门为 eNSP/EVE-NG，1 门为 Linux 隔离环境）。
- 未做 5 人真实用户试学；未做 Firefox/WebKit 全矩阵；E2E 仅 Chromium。
- 19 个图标的原始许可文本未随附，由项目负责人提供并明确指定用于本项目；详见 [docs/ASSETS.md](docs/ASSETS.md)。
- 课程工作台默认适配下拓扑实测约 53%，阅读细节建议使用“全屏看图”；全屏看图在 1440×1000 实测 zoom 107%，未实现完整焦点陷阱与完整移动端编辑。
- 移动端 390×844 已做人工截图检查（`docs/screenshots/09-mobile-course.png`），未纳入自动 E2E。
- 27 张原图的全部通用知识尚未逐图映射；IPv6/双栈、5G/移动专网为后续扩展，未做 HCIE 覆盖率声明。

## 文档入口

- [docs/ASSETS.md](docs/ASSETS.md)：图标来源、授权状态与替换流程
- [docs/CONTENT-MAP.md](docs/CONTENT-MAP.md)：课程地图、主题覆盖与内容缺口
- [docs/DELIVERY-V0.1.md](docs/DELIVERY-V0.1.md)：V0.1 交付、测试、部署与回退
- [docs/lab-results/signature-openssl-3.0.13.txt](docs/lab-results/signature-openssl-3.0.13.txt)：数字签名实验真实记录
- [蓝图.md](蓝图.md)：V0.1 实施范围
- [AGENTS.md](AGENTS.md)：协作约定
- [docs/PROJECT-STATE.md](docs/PROJECT-STATE.md)：项目进度唯一状态源