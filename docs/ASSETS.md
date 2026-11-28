# NetOps 图标资产清单

本文记录 19 个设备图标的来源、授权状态、文件对应关系与安全约束。图标注册表以 `src/domain/icons.ts` 为准，本表逐项核对。

## 来源与加工

- 原始素材：项目根目录由项目负责人提供的《最全VISIO图标集.ppt》，文件约 17.8 MiB（18,648,576 字节）。
- 加工方式：工人在本地从该 PPT 中提取、裁切、缩放并导出为 19 个 PNG，放入 `src/assets/network-icons/visio/`。PPT 本身与提取中间产物不入库。
- 文件特征：均为 RGBA 透明 PNG，原始像素边长 103–220 px，页面显示尺寸由 CSS 统一约束，不在业务数据中保存尺寸。
- 语义注册：每个文件通过稳定 `iconId` 绑定设备角色；课件、拓扑与个人画布只引用 `iconId`，不引用文件路径。

## 授权状态

- 项目负责人提供该图标集，并明确指定用于 NetOps。
- **原始许可文本未随附**，本仓库不对其开源许可证作任何声明，也不把“项目负责人指定使用”表述为开源授权。
- 如果后续确认原始素材存在使用限制，可按 `iconId` 替换 `src/assets/network-icons/visio/<文件>.png`，课件、拓扑、步骤高亮与个人画布无需改动。替换文件需保持透明背景、主体居中与相近视觉比例。
- 不把该图标集上传到第三方服务，不将 PPT、原始页或未裁切素材提交到 Git、CI、报告、网页或截图。

## 图标清单

| iconId | 文件 | labelZh | 类别 | 来源 | 授权状态 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| `endpoint.pc` | `pc.png` | 终端 / PC | 终端与算力 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | End-user terminal；别名：电脑、主机、终端、client、host |
| `endpoint.desktop` | `desktop.png` | 云桌面终端 | 终端与算力 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Cloud desktop；别名：云桌面、瘦终端、VDI、desktop |
| `endpoint.server` | `server.png` | 服务器 | 终端与算力 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Server；别名：应用服务器、数据库、service、host |
| `endpoint.storage` | `storage.png` | 存储 | 终端与算力 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Storage；别名：磁盘阵列、对象存储、SAN、NAS、备份 |
| `device.switch.l2` | `switch-l2.png` | 二层交换机 | 交换与接入 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Layer 2 switch；别名：接入交换机、交换机、switch、access |
| `device.switch.l3` | `switch-l3.png` | 三层交换机 | 交换与接入 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Layer 3 switch；别名：核心交换、汇聚交换、VLANIF、core switch |
| `device.router` | `router.png` | 路由器 | 路由与广域 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Router；别名：出口路由、边界路由、router、PE、CE |
| `device.firewall` | `firewall.png` | 防火墙 | 安全与身份 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Firewall；别名：安全网关、安全域、firewall、FW |
| `security.identity` | `identity.png` | 身份提供方 | 安全与身份 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Identity provider；别名：统一认证、RADIUS、IAM、IdP、认证中心 |
| `security.certificate` | `certificate.png` | 证书服务 | 安全与身份 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Certificate service；别名：CA、RA、签名、证书、PKI |
| `security.vpn` | `vpn.png` | 安全接入 | 安全与身份 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Secure access；别名：VPN、远程接入、SSL VPN、零信任网关 |
| `security.gateway` | `gateway.png` | 跨域交换网关 | 安全与身份 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Cross-domain gateway；别名：网闸、隔离交换、数据交换、gateway |
| `cloud.internet` | `internet.png` | 互联网 / 外部云 | 云与互联网 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Internet or external cloud；别名：互联网、云、运营商、Internet、WAN |
| `cloud.private` | `cloud.png` | 私有云 / 承载云 | 云与互联网 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Private cloud；别名：专有云、云资源池、cloud |
| `cloud.vm` | `vm.png` | 虚拟机 / 宿主机 | 云与互联网 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Virtual machine；别名：虚机、计算节点、VM、vNIC、宿主机 |
| `cloud.loadbalancer` | `load-balancer.png` | 负载均衡 | 云与互联网 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Load balancer；别名：LB、ADC、应用交付、负载 |
| `device.ap` | `ap.png` | 无线接入点 | 交换与接入 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Access point；别名：AP、Wi-Fi、无线、WLAN |
| `operations.monitor` | `monitor.png` | 监控 / IDS 探针 | 观测与运维 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Monitoring probe；别名：探针、采集器、镜像、SIEM、IDS、IPS、观测 |
| `operations.controller` | `controller.png` | 控制器 | 观测与运维 | 《最全VISIO图标集.ppt》本地提取 | 负责人指定使用；许可文本未随附 | Controller；别名：管理平台、控制器、MCU、云桌面控制器、SDN 控制器 |

## 资源安全

- 19 个 PNG 全部通过本地静态导入进入构建产物，不使用远程 URL、CDN、内联 SVG 或用户提供的资源路径。
- 画布与课程渲染只接受注册表内的 `iconId`；导入 JSON 不能指定任意文件地址，未知 `iconId` 回退到首个注册图标并保留文字标签。
- 图标不承载故障状态或链路状态语义；状态用文字、线型与标签表达，避免只靠颜色区分。
- `src/assets/network-icons/` 下另有 17 个早期 SVG 原型文件，当前 `iconRegistry` 未引用，作为备用素材保留；未进入运行时渲染。若后续启用，需继续满足下述 SVG 白名单要求。

## SVG 白名单约束

若未来启用 SVG 原型或替换为其他矢量图标，必须满足：

- 仅本地白名单资源，不使用远程 URL；
- 不包含 `<script>`、事件处理器（如 `onload=`、`onerror=`）、`javascript:` 链接、`foreignObject`；
- 不包含外部 `href` / `xlink:href`；
- 不执行 SVG 内的脚本、动画控制逻辑或网络请求。

`npm run check:boundary` 会扫描 `src/assets/` 下的 SVG 禁止内容；当前检查结果为 0 项。

## 素材排除项

图标资产与文档**不包含**：原始拓扑图、原始解析截图、真实设备照片、真实网络标识、组织名称、地址与配置、厂商设备镜像、破解软件或授权不明的配置包。