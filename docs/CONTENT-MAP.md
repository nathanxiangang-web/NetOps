# NetOps 内容地图（V0.1）

本文给出 V0.1 的公开内容地图、课程先修关系、主题覆盖与缺口。它只描述通用知识主题，**不发布本地解析稿的文件名、路径、源图结构、组织信息或可逆映射**。

## 本地输入清点与主题范围

本地逐条清点 27 份拓扑解析稿与 1 份学习总目录，只用于提炼通用知识。清点得到的主题范围包括：

- 全局与纵向网络架构、专线双上联、路由选路；
- 园区与办公接入、二层转发、VLAN/Trunk、MAC 学习、网关/VLANIF、ARP；
- 静态路由、OSPF、IS-IS、BGP、BFD、MPLS LDP、MP-BGP 与 VPN 实例；
- 核心交换、链路聚合、Stack/CSS/M-LAG 等高可用形态；
- 防火墙安全域、ACL、会话与回程、网闸与跨域受控交换；
- 统一认证、RADIUS、零信任、PKI/证书/RA、数字签名、TLS、电子印章、标识密码服务；
- 虚拟化云平台、虚拟交换、FC 存储、云桌面控制面与会话面；
- 旁路镜像、探针、IDS/审计、监控告警；
- 应用入口、端口映射、负载均衡、服务依赖、短信回执；
- 双机高可用/VRRP、心跳与状态同步、备份/主备/灾备/RPO、数据一致性；
- 5G 接入、APN/DNN、VPDN/L2TP。

这些主题是内容输入的范围说明，不等于 27 门课，也不表示每张原图都已逐图映射。V0.1 从中提炼通用机制，使用独立合成拓扑重新编写为 13 门课程。

## 内容统计

以下数字由 `src/content/index.ts` 的 `contentStats` 与课程数据实际导出，并与 `tests/content.test.ts` 断言一致：

| 指标 | 实际值 |
| --- | --- |
| 已发布课程（`published`） | 13 |
| 合成拓扑 | 13 |
| 图解步骤 | 78（每门 6 步） |
| 学习路径 | 5 |
| `topicId` 去重数 | 49 |
| 公共主题覆盖条目 | 16（14 项已覆盖，2 项后续扩展） |
| 实验总数 | 13 |
| 已实机验证实验（`verified`） | 1（`l5-signature`，OpenSSL 3.0.13，2026-11-28） |
| 仅文档指导实验（`guide-only`） | 12（11 门 eNSP/EVE-NG，1 门 Linux 隔离） |
| 层级分布 | L1 2 / L2 2 / L3 2 / L4 2 / L5 5 |

## 课程地图

所有课程均为 `published`，可直接进入，不设解锁门槛。实验状态逐课真实标注。

| 课程 id | 标题 | 层级 | 拓扑 | 先修 | 实验状态 | 核心知识点 |
| --- | --- | --- | --- | --- | --- | --- |
| `l1-ping-path` | 一次 Ping 的完整旅程 | L1 | `topo-l1-ping` · 一次 Ping 的完整旅程 | — | `guide-only`（eNSP） | IP 编址、ARP、ICMP、转发路径 |
| `l1-read-topology` | 先找端、路、域 | L1 | `topo-l1-layers` · 端、路、域的分层读图 | `l1-ping-path` | `guide-only`（eNSP） | 拓扑阅读、分层模型、流量路径、故障域 |
| `l2-vlan-trunk` | VLAN 与 Trunk：标签在哪里被加上和剥掉 | L2 | `topo-l2-vlan` · VLAN 与 Trunk 的边界 | `l1-ping-path`、`l1-read-topology` | `guide-only`（eNSP） | VLAN、Trunk、MAC 学习、广播域 |
| `l2-loop-stp` | 二层环路：广播为什么会转圈 | L2 | `topo-l2-loop` · 二层环路与 STP 断点 | `l2-vlan-trunk` | `guide-only`（eNSP） | 二层环路、广播风暴、STP、收敛 |
| `l3-static-return` | 请求到了，回复为什么没回来 | L3 | `topo-l3-static` · 静态路由与回程 | `l1-ping-path`、`l2-vlan-trunk` | `guide-only`（eNSP） | 静态路由、默认网关、回程、最长前缀匹配 |
| `l3-ospf-convergence` | OSPF 邻居到收敛：路由是怎么被算出来的 | L3 | `topo-l3-ospf` · OSPF 邻居与收敛 | `l3-static-return` | `guide-only`（eNSP） | OSPF、LSA、SPF、收敛 |
| `l4-mpls-vpn` | MPLS L3VPN：一张骨干装下多个隔离网络 | L4 | `topo-l4-mpls` · MPLS L3VPN 的隔离与标签 | `l3-ospf-convergence` | `guide-only`（eNSP） | MPLS、BGP、VPN、路由 |
| `l4-ha-security` | 双机热备与安全域：切换到底保住了什么 | L4 | `topo-l4-ha` · 双机安全边界与虚拟网关 | `l2-loop-stp`、`l3-static-return` | `guide-only`（eNSP） | VRRP、高可用、防火墙、路由 |
| `l5-zero-trust` | 统一认证与零信任：登录成功不等于资源可用 | L5 | `topo-l5-trust` · 身份、策略与资源访问 | `l2-vlan-trunk`、`l4-ha-security` | `guide-only`（EVE-NG） | 零信任、RADIUS、IAM、访问控制 |
| `l5-cloud-desktop` | 云桌面：控制面、会话面、数据面分开看 | L5 | `topo-l5-vdi` · 云桌面的控制面与会话面 | `l2-vlan-trunk`、`l4-ha-security` | `guide-only`（EVE-NG） | VDI、虚拟化、TLS、身份 |
| `l5-observability` | 旁路观测：镜像、探针与业务路径不是同一条 | L5 | `topo-l5-observability` · 业务路径与旁路观测 | `l2-vlan-trunk`、`l3-static-return` | `guide-only`（eNSP） | 旁路观测、端口镜像、SIEM、交换 |
| `l5-data-continuity` | 跨域交换与灾备：回执、数据新鲜度和 RPO | L5 | `topo-l5-data` · 跨域数据交换与连续性 | `l4-mpls-vpn` | `guide-only`（Linux 隔离） | 跨域交换、灾备、复制、完整性 |
| `l5-signature` | 证书、签名与验签：内容没变，为什么验签失败 | L5 | `topo-l5-signature` · 证书、签名与验签链 | `l5-zero-trust` | `verified`（OpenSSL 3.0.13，2026-11-28） | PKI、数字签名、OpenSSL、TLS |

## 学习路径

| 路径 id | 标题 | 课程 |
| --- | --- | --- |
| `path-foundation` | 看见网络 | `l1-ping-path`、`l1-read-topology`、`l2-vlan-trunk`、`l2-loop-stp` |
| `path-routing` | 三层互联 | `l3-static-return`、`l3-ospf-convergence` |
| `path-transport` | 承载与可靠 | `l4-mpls-vpn`、`l4-ha-security` |
| `path-security` | 身份与证据 | `l5-zero-trust`、`l5-signature`、`l5-observability` |
| `path-continuity` | 云、数据与连续性 | `l5-cloud-desktop`、`l5-data-continuity` |

5 条路径覆盖全部 13 门已发布课程；路径是推荐顺序，不是权限门槛。

## 公共主题覆盖

`publicTopicCoverage` 共 16 项，其中 14 项已由课程覆盖，2 项明确留作后续扩展：

| 主题 id | 名称 | 覆盖课程 | 状态 |
| --- | --- | --- | --- |
| `l2-forwarding` | 二层转发 | `l2-vlan-trunk`、`l2-loop-stp` | 已覆盖 |
| `ip-arp` | IP / ARP | `l1-ping-path` | 已覆盖 |
| `static-routing` | 静态路由 | `l3-static-return` | 已覆盖 |
| `ospf` | OSPF | `l3-ospf-convergence` | 已覆盖 |
| `mpls-l3vpn` | MPLS L3VPN | `l4-mpls-vpn` | 已覆盖 |
| `high-availability` | 高可用 | `l4-ha-security` | 已覆盖 |
| `security-zone-acl` | 安全域 / ACL | `l4-ha-security`、`l5-zero-trust` | 已覆盖 |
| `identity-zero-trust` | 身份与零信任 | `l5-zero-trust`、`l5-cloud-desktop` | 已覆盖 |
| `pki-signature` | PKI / 签名 | `l5-signature` | 已覆盖 |
| `virtualization-cloud-desktop` | 虚拟化 / 云桌面 | `l5-cloud-desktop` | 已覆盖 |
| `bypass-observability` | 旁路观测 | `l5-observability` | 已覆盖 |
| `cross-domain` | 跨域交换 | `l5-data-continuity` | 已覆盖 |
| `disaster-recovery` | 灾备 / RPO | `l5-data-continuity` | 已覆盖 |
| `ipv6-dual-stack` | IPv6 / 双栈 | — | 后续扩展 |
| `5g-private-network` | 5G / 移动专网 | — | 后续扩展 |
| `application-dependency` | 应用依赖 | `l5-cloud-desktop`、`l5-observability` | 已覆盖 |

## 来源策略

课程事实与命令说明优先采用可公开核对的来源，并在课件数据中保留来源条目：

- RFC：792（ICMP）、826（ARP）、791（IPv4）、1812（IPv4 路由器要求）、1122（主机通信层）、2328（OSPFv2）、5737（文档用 IPv4 地址块）、3849（文档用 IPv6 前缀）；
- NIST SP 800-41 Rev.1（防火墙与策略）、NIST SP 800-115（安全测试与评估）；
- 华为企业业务公开技术支持文档（VRP 配置与显示命令的通用语义）；
- OpenSSL 官方文档（签名与验签实验）；
- GB/T 22239-2019（网络安全等级保护基本要求）；
- EVE-NG 官方文档（平台与镜像准备说明）。

来源白名单由 `src/domain/contentValidation.ts` 校验，未列入的外部主机不会出现在已发布课件中。课程内容按通用原理重新组织，**不搬运原始解析文字、原图、题目或受限材料**。

## 覆盖缺口与后续

- 27 张原图的全部通用知识尚未逐图映射；V0.1 只发布 13 门可独立成立的课程。
- 源主题中出现的 IPv6/双栈、5G/移动专网、IS-IS、BFD、SRv6、Stack/CSS/M-LAG、FC 存储、EVPN/VXLAN 等，尚未逐项进入本版课程；其中 IPv6/双栈、5G/移动专网已在公共主题表中标为后续扩展。
- 12 门实验仅为文档指导，未在 eNSP/EVE-NG 或对应平台实机执行；只有 `l5-signature` 有 OpenSSL 3.0.13 的实机记录。
- 未进行 5 人真实用户试学，未收集学习效果数据。
- 未对 HCIA/HCIP/HCIE-Datacom 做覆盖率测算，不声明覆盖全部 HCIE 技术或等同官方培训。
- 无真实用户试学、无 Firefox/WebKit 全矩阵、无移动端完整编辑验证。