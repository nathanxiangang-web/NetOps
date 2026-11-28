# NetOps V0.1 交付报告

- 交付版本：V0.1 初始集成 MVP
- 日期：2026-11-28
- 基线 `main`：`623e5be5dc92423971653ec500894ba9d588483b`
- 功能分支：`feat/netops-v0.1-mvp`
- 功能提交 head SHA：`a84651f`（`feat: deliver NetOps V0.1 integrated learning MVP`；docs 回填提交后最新 head 以 PR 页面为准）
- PR 链接：https://github.com/nathanxiangang-web/NetOps/pull/1 （Ready）
- CI run：https://github.com/nathanxiangang-web/NetOps/actions/runs/46142450429
- 合并状态：未合并 `main`；Ready PR #1 已创建

## 目标与完成范围

**目标**：交付一个可本地运行、可体验、可继续扩课的静态学习网站——用合成拓扑讲清机制，用外部实验指导核验原理，用统一画布沉淀课程图解与个人笔记；不做协议模拟器。

**已完成**：

- Vue 3 + TypeScript + Vite 静态前端，hash 路由，生产构建可预览；
- 学习首页、课程目录、课程工作台（步骤高亮、通俗/专业双层理论、实验、挑战、复制画布、全屏看图）；
- 自由画布：19 个本地图标、拖拽/点击放置、连线、属性、节点备注、撤销/重做、多画布列表、本地保存、JSON 导入导出；
- 我的记录、深色/浅色主题；
- 13 门已发布课程、13 套合成拓扑、5 条学习路径、49 个 topicId、16 项公共主题覆盖；
- Vitest 单元测试、Playwright Chromium E2E、公共边界检查脚本；
- 1 门 OpenSSL 实机实验记录与 12 门文档指导实验；
- 本报告、`docs/ASSETS.md`、`docs/CONTENT-MAP.md` 与合成截图。

**明确不做**：真实流量与协议状态机、设备镜像管理、真实网络/SSH/CLI 执行、后端/账号/数据库、云同步、认证等级、付费或社交功能、HCIE 覆盖率承诺。

## 输入清点

| 输入 | 实际数量 | 处理 |
| --- | --- | --- |
| 本地逐图解析 Markdown | 27 份 | 本地只读清点，提炼通用知识；未入库 |
| 学习总目录 | 1 份 | 本地用于主题归类；未入库 |
| NetOps-Lab 参考文档 | 8 份 | 产品方向、需求、架构、阶段蓝图、迁移、提审、开发提示词、拓扑分析台账；未入库 |
| 图标 PPT | 1 份，约 17.8 MiB（18,648,576 字节） | 本地提取、裁切、缩放；PPT 未入库 |
| 实际提取图标 | 19 个 PNG | 存入 `src/assets/network-icons/visio/` |
| 原始素材入库情况 | 0 | `git status` 不含参考目录、PPT 或原始解析 |

输入主题覆盖通用网络机制、园区与纵向接入、广域/MPLS VPN、安全域与跨域交换、身份与签名、虚拟化/云桌面、旁路观测、应用依赖与灾备等。原始文件名、路径、源图结构、组织信息与可逆映射不在本仓库出现。

## 内容与实验统计

| 指标 | 实际值 |
| --- | --- |
| 已发布课程 | 13 |
| 合成拓扑 | 13 |
| 图解步骤 | 78（每门 6 步） |
| 学习路径 | 5 |
| `topicId` 去重数 | 49 |
| 公共主题覆盖 | 16（14 已覆盖，2 后续扩展） |
| 层级分布 | L1 2 / L2 2 / L3 2 / L4 2 / L5 5 |
| 已实机验证实验 | 1 |
| 仅文档指导实验 | 12 |

实验平台分布：

- eNSP：9 门（L1–L4 基础与进阶、旁路观测），全部 `guide-only`；
- EVE-NG：2 门（统一认证、云桌面），全部 `guide-only`；
- Linux 隔离环境：2 门（跨域灾备为 `guide-only`，数字签名为 `verified`）。

`l5-signature` 于 2026-11-28 使用 OpenSSL 3.0.13 在隔离主机执行四项判定（原文验签、篡改验签、错误公钥、有效期检查），通过 4 项、失败 0 项。完整记录见 [docs/lab-results/signature-openssl-3.0.13.txt](lab-results/signature-openssl-3.0.13.txt)。

其余 12 门实验为基于公开文档编写的指导，**未在 eNSP/EVE-NG 或对应平台实机执行**，页面与数据均标注 `guide-only` / “文档指导，尚未实机”。

13 门课程与 13 套合成拓扑不是 27 张原图的一一对应；覆盖缺口见 [docs/CONTENT-MAP.md](CONTENT-MAP.md)。

## 真实测试结果

在当前工作区实际执行：

```text
npm run lint        # 通过，0 error / 0 warning
npm run typecheck   # 通过
npm run test        # Test Files 4 passed (4)；Tests 52 passed (52)
npm run build       # 通过，生成 dist/
npm run verify      # 通过（lint + typecheck + test + build）
npm run test:e2e    # 6 passed (6)，Chromium，约 8.6s
npm run check:boundary  # 通过：已扫描 108 个文件，敏感词 0 / 私有IP 0 / SVG 0 / 凭据 0 / 路径 0
```

- Vitest：4 个测试文件、52 个用例全部通过；覆盖内容统计与校验、画布操作、导入导出、本地存储。
- Playwright：6 个用例全部通过（6 passed），覆盖课程主流程、全屏看图与焦点归还、深色默认主题、画布放置/连线/备注持久化/拖拽持久化、画布列表新建/复制/删除/导入校验。
- 实测视口数据：工作台默认适配下拓扑约 53%；全屏看图在 1440×1000 实测 zoom 107%。
- 公共边界扫描通过：已扫描 108 个文件，敏感词 0 / 私有 IP 0 / SVG 0 / 凭据 0 / 路径 0。
- E2E 仅运行 Chromium，未运行 Firefox/WebKit。

截图（`docs/screenshots/` 实际 9 个文件，全部作为验收入口）：

- [01-home.png](screenshots/01-home.png)
- [02-catalog.png](screenshots/02-catalog.png)
- [03-course.png](screenshots/03-course.png)
- [04-course-fullscreen.png](screenshots/04-course-fullscreen.png)
- [05-canvas-edit.png](screenshots/05-canvas-edit.png)
- [06-canvas-list.png](screenshots/06-canvas-list.png)
- [07-notes.png](screenshots/07-notes.png)
- [08-signature-lab.png](screenshots/08-signature-lab.png)
- [09-mobile-course.png](screenshots/09-mobile-course.png)

其中 `09-mobile-course.png` 为 390×844 移动端人工检查截图，非自动测试产物；其他 8 张为桌面端验收截图。

## 本地部署

```bash
npm ci
npm run build
npm run preview -- --port 8080 --strictPort
```

- 访问 `http://127.0.0.1:8080/`，本地 preview 实际返回 HTTP 200，页面标题为 `NetOps · 网络拓扑学习与自由画布`；
- 路由为 hash 模式，深链如 `/#/learn/l1-ping-path`、`/#/canvas/canvas-...`、`/#/notes`；静态托管只需 `index.html` 与构建资源，不依赖服务器 SPA fallback；
- 当前 8080 由本地 preview 进程提供，**不是公网部署**，没有域名、CDN、反向代理或生产环境验证；
- 浏览器检查范围：E2E 默认视口 1440×900；全屏看图与深色默认首页用例使用 1440×1000；移动端 390×844 已做人工截图检查（`09-mobile-course.png`），未纳入自动 E2E，未做移动端完整编辑验证。

## 安全与数据边界

- 无原始解析、原图、真实网络结构、组织/地址/配置、内部标识或厂商镜像入库；公开内容为合成拓扑与重写后的通用知识。
- 拓扑与课件使用 RFC 5737 文档保留 IPv4 地址块，必要时使用 RFC 3849 文档前缀；`check:boundary` 对公开文档与内容数据检查私有/保留地址。
- 无外部运行时资源：图标、字体、样式、脚本均本地打包；页面不请求远程 API、CDN、埋点或外部图片。
- 图标只通过本地注册表与白名单资源渲染；SVG 禁止脚本、事件处理器、`foreignObject`、`javascript:` 与外部 `href`。
- 导入限制：2 MiB、40 个节点、80 条边、6 个区域；节点/画布备注分别限制 2000/5000 字符。
- 存储错误使用 typed code：`CANVAS_NOT_FOUND`、`INVALID_CANVAS`、`STORAGE_FULL`、`STORAGE_UNAVAILABLE`、`IMPORT_INVALID`；保存或导入失败不会覆盖可恢复的旧稿。
- 本网站不连接设备、不发包、不执行 CLI、不读取真实回显；eNSP/EVE-NG/OpenSSL 由用户自行在隔离环境运行。
- `localStorage` 数据仅为本机记录，不代表认证或技能等级；可通过 JSON 导出备份。

## 已知缺陷与 P2 列表

以下均为非阻断问题，进入后续迭代：

1. **P2** 课程工作台默认适配下拓扑偏小（约 53%），细节阅读需切换到全屏看图。
2. **P2** 全屏看图未实现完整焦点陷阱（Esc 关闭并归还焦点已实现，Tab 循环未封闭）。
3. **P2** 未做 Firefox/WebKit 全矩阵；E2E 仅 Chromium。
4. **P2** 未做 5 人真实用户试学，无学习效果数据。
5. **P2** 12 门实验未实机验证；仅数字签名实验有 OpenSSL 实机记录。
6. **P2** 19 个图标的原始许可文本未随附，需项目负责人提供并确认。
7. **P2** 27 张原图的全部通用知识尚未逐图映射；本版为 13 门课程的通用知识重构。

## 未验证项与待负责人确认

- 8080 由本地 preview 提供，非公网部署；生产托管、域名、HTTPS、缓存策略均未验证。
- 已提交 `.github/workflows/ci.yml`，jobs 为 `quality`、`test`、`browser`、`safety`、`netops-gate`；已实际运行 [CI run 46142450429](https://github.com/nathanxiangang-web/NetOps/actions/runs/46142450429)，`quality`、`test`、`browser`、`safety`、`netops-gate` 全部 pass。综合检查名为 `netops-gate`，其通过条件是前述 4 个必需 job 全部成功；最新 head 的 checks 以 [PR #1 页面](https://github.com/nathanxiangang-web/NetOps/pull/1) 为准。
- PR 已创建为 Ready 状态，最新 head 以 PR 页面为准；本文不伪造运行记录、审批或合并结果。
- 不自行合并 `main`。
- 图标原始许可文本、27 图逐图覆盖范围、后续课程优先级待负责人确认。
- 移动端编辑、Firefox/WebKit、真实试学、平台实机实验均未验证。

## 回退

1. 关闭本地 preview 进程（当前 8080 由本地 preview 提供）。
2. 切回 `main`：`git switch main`（基线 `623e5be5dc92423971653ec500894ba9d588483b`）。
3. 重新安装与构建：`npm ci && npm run build`。
4. 无数据库、后端或数据迁移；回退不涉及服务端。
5. 浏览器侧 `localStorage` 数据可在回退前通过画布列表“导出 JSON”备份；回退或清除站点数据会删除本机画布与阅读记录。

## 可复核链接

| 项目 | 链接/位置 |
| --- | --- |
| Ready PR #1 | https://github.com/nathanxiangang-web/NetOps/pull/1 |
| CI run（46142450429，全部 pass） | https://github.com/nathanxiangang-web/NetOps/actions/runs/46142450429 |
| 数字签名实验记录 | [lab-results/signature-openssl-3.0.13.txt](lab-results/signature-openssl-3.0.13.txt) |
| 验收截图目录 | [screenshots/](screenshots/)（9 个文件） |
| 本地 preview | `http://127.0.0.1:8080/`（本机 preview，非公网部署） |

## 验收入口与建议体验路径

1. 打开首页，确认品牌、课程概览与深浅主题切换；
2. 进入 `/#/learn/l1-ping-path`，逐步切换 6 个步骤，观察节点/链路高亮；
3. 切换“专业理论”“外部实验”“挑战”，确认实验状态标注与命令参考；
4. 点击“全屏看图”，确认缩放可读、步骤可切换、Esc 关闭并回焦；
5. 点击“复制为我的画布”，进入自由画布，移动节点、连线、编辑备注、撤销/重做；
6. 刷新页面，确认画布与备注恢复；回到“我的记录”，确认本机阅读记录与画布入口；
7. 进入 `/#/learn/l5-signature`，确认实验状态为 `verified` 并查看 OpenSSL 3.0.13 实验记录。