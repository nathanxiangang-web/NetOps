import type { Course } from '../../domain/types'

export const advancedCourses: Course[] = [
  {
    id: 'l4-mpls-vpn',
    title: 'MPLS L3VPN：一张骨干装下多个隔离网络',
    question: '不同租户使用相同私网前缀，为什么能共存？',
    level: 'L4',
    minutes: 55,
    goals: [
      '说明 CE、PE、P 三类设备在同一张骨干中的职责边界。',
      '解释 VRF、RD、RT 各自解决隔离、标识、引入中的哪一类问题。',
      '描述 MP-BGP VPNv4 路由与 LDP 传输标签如何配合形成内外层标签转发。',
      '从入口 VRF 到回程路由逐跳核对一次跨租户访问失败的原因。',
    ],
    prerequisites: ['l3-ospf-convergence'],
    topicIds: ['mpls', 'bgp', 'vpn', 'routing'],
    topologyId: 'topo-l4-mpls',
    steps: [
      {
        id: 'mpls-step-roles',
        title: '先分清 CE、PE、P',
        plainText: '客户边缘设备 CE 只知道自己这一侧的私网，运营商边缘设备 PE 负责把私网接入骨干，核心设备 P 只转发带标签的包。三者的分工决定了故障该从哪一层开始查。',
        professionalText: 'CE 与 PE 之间通常运行静态路由、OSPF 或 BGP，PE 把 CE 的路由装入对应的 VRF。P 设备不参与客户路由，只在骨干内交换外层标签。PE 同时承担 VRF 隔离、VPN 路由发布和标签压入弹出三类职责。',
        focusNodeIds: ['ce-a', 'pe-1', 'p-1', 'p-2', 'pe-2', 'ce-b', 'ce-c'],
        focusEdgeIds: ['mpls-cea-pe1', 'mpls-pe1-p1', 'mpls-p1-p2', 'mpls-p2-pe2', 'mpls-pe2-ceb', 'mpls-pe2-cec'],
        evidenceText: '在 PE 上查看 VRF 接口与绑定关系，确认客户链路落在哪个 VRF；在 P 上确认只有标签转发表，没有客户私网路由。',
        directionHints: ['从 CE 向 PE 看接入', '从 PE 向 P 看骨干', '从 PE-2 向两个 CE 看租户分离'],
      },
      {
        id: 'mpls-step-vrf',
        title: 'VRF 把一台 PE 拆成多台虚拟路由器',
        plainText: '同一台 PE-2 连接 CE-B 和 CE-C，两个租户可能都用 192.0.2.0/24。VRF 让每个租户拥有独立的路由表和接口集合，互不可见。',
        professionalText: 'VRF 是独立的路由与转发表实例，接口通过绑定语句进入某个 VRF。不同 VRF 可以配置完全相同的地址前缀而不冲突。默认情况下 VRF 之间没有路由泄漏，跨 VRF 访问必须显式配置。',
        focusNodeIds: ['pe-1', 'pe-2', 'ce-b', 'ce-c'],
        focusEdgeIds: ['mpls-pe2-ceb', 'mpls-pe2-cec'],
        evidenceText: '对比 PE-2 上两个 VRF 的路由表，观察相同前缀分别出现在不同表中，且下一跳与出接口互不影响。',
        directionHints: ['分别进入两个 VRF 查看路由表', '确认接口绑定没有串表'],
      },
      {
        id: 'mpls-step-rd-rt',
        title: 'RD 与 RT：标识和引入不是一回事',
        plainText: 'RD 像一个附加在路由前的编号，让两个租户相同的 192.0.2.0/24 在骨干里变成两条不同的路由。RT 则决定这条路由被哪些 VRF 接收。',
        professionalText: 'RD 由 8 字节组成，与 IPv4 前缀拼接成 VPNv4 前缀，用于在控制面唯一标识一条租户路由。RT 是 BGP 扩展团体属性，导出方向标记路由归属，导入方向决定哪些 VRF 接收该路由。RD 不控制导入导出，RT 不改变前缀唯一性。',
        focusNodeIds: ['pe-1', 'pe-2'],
        focusEdgeIds: ['mpls-pe1-p1', 'mpls-p2-pe2'],
        evidenceText: '查看 VPNv4 路由携带的 RD 与扩展团体，核对两端 VRF 的导入导出 RT 是否成对匹配。',
        directionHints: ['先看 RD 是否唯一', '再看 RT 导入导出是否对称'],
      },
      {
        id: 'mpls-step-vpnv4',
        title: 'MP-BGP 只传 VPNv4 路由',
        plainText: 'PE 之间建立 MP-BGP 会话，把各 VRF 的路由加上 RD 后作为 VPNv4 路由互相传递。P 设备不参与这个会话，也不保存客户路由。',
        professionalText: 'MP-BGP 通过多协议扩展承载 VPNv4 地址族，PE 之间通常使用环回口建立 IBGP 会话。路由传递的是 VPNv4 前缀、下一跳、RD 与 RT 等属性。P 设备只做标签转发，因此客户路由规模不会压到核心。',
        focusNodeIds: ['pe-1', 'p-1', 'p-2', 'pe-2'],
        focusEdgeIds: ['mpls-pe1-p1', 'mpls-p1-p2', 'mpls-p2-pe2'],
        evidenceText: '在 PE 上确认 VPNv4 邻居状态与收到的路由数量，在 P 上确认没有 VPNv4 邻居。',
        directionHints: ['PE 之间看 VPNv4 会话', 'P 上确认不承载客户路由'],
      },
      {
        id: 'mpls-step-labels',
        title: 'LDP 给外层，VPN 给内层',
        plainText: '进入骨干的包通常带两层标签：外层由 LDP 分配，用来在 P 之间逐跳转发；内层由 VPN 分配，用来告诉出口 PE 这个包属于哪个 VRF。',
        professionalText: '外层标签对应骨干的标签交换路径，P 设备按外层标签换标签并转发。内层标签在出口 PE 弹出后决定进入哪个 VRF。常见实现会在倒数第二跳弹出外层标签，出口 PE 依据内层标签完成 VRF 归属判断。',
        focusNodeIds: ['pe-1', 'p-1', 'p-2', 'pe-2'],
        focusEdgeIds: ['mpls-pe1-p1', 'mpls-p1-p2', 'mpls-p2-pe2'],
        evidenceText: '在 PE 入口查看压入的标签栈，在 P 上查看外层标签交换，在出口 PE 查看内层标签与 VRF 的对应关系。',
        directionHints: ['入口看标签栈深度', '核心看外层标签变化', '出口看内层标签归属'],
      },
      {
        id: 'mpls-step-troubleshoot',
        title: '排障顺序：入 VRF 到回程',
        plainText: '跨租户不通时，不要一上来就抓包。先确认源 CE 的路由是否进入正确 VRF，再确认 VPNv4 路由是否到达对端 PE，最后确认回程路由是否回到同一个 VRF。',
        professionalText: '排查顺序通常是接入侧 VRF 绑定与路由、PE 间 VPNv4 会话与 RT 匹配、标签转发路径、出口 VRF 路由与回程。任一环节缺失都会表现为端到端不通，但现象不同。',
        focusNodeIds: ['ce-a', 'pe-1', 'pe-2', 'ce-b'],
        focusEdgeIds: ['mpls-cea-pe1', 'mpls-pe2-ceb'],
        evidenceText: '逐段记录源 VRF 路由、VPNv4 路由、标签转发表与回程路由四项证据，定位第一处缺失。',
        directionHints: ['从源侧向目的侧推进', '每段只验证一个事实'],
      },
    ],
    why: [
      {
        heading: '同一前缀为何能重复出现',
        paragraphs: [
          '多个租户各自规划私网地址时，很容易都选到 192.0.2.0/24 这类常见前缀。若骨干只有一张全局路由表，这些前缀会互相覆盖，后学的路由把先学的挤掉。',
          'VRF 让每张租户路由表独立存在，RD 让相同前缀在骨干控制面里获得不同标识，RT 再决定谁能收到。三者合起来，才让一张物理骨干承载多个逻辑上互不可见的网络。',
        ],
        bullets: ['VRF 负责转发隔离', 'RD 负责控制面唯一标识', 'RT 负责路由导入导出'],
      },
      {
        heading: '本课要建立的最小判断链',
        paragraphs: [
          '看到一个跨租户不通的工单，先问三个问题：源接口在哪个 VRF，目标前缀是否以 VPNv4 形式到达对端，回程是否仍落在同一个 VRF。',
          '这条判断链把复杂的标签转发拆成可逐段验证的事实，避免把“Ping 不通”直接归因到某一个设备。',
        ],
      },
    ],
    theory: [
      {
        heading: '从转发面看一张 VPN 包',
        paragraphs: [
          'CE 发出的普通 IP 包到达 PE 后，PE 依据入接口绑定的 VRF 查表，找到 VPN 下一跳，并压入内层 VPN 标签。',
          '随后 PE 再为到达远端 PE 的环回口压入外层标签，形成标签栈。P 设备只看外层标签，逐跳交换；出口 PE 弹出外层后，用内层标签确定 VRF 并转发给 CE。',
        ],
        bullets: ['内层标签标识 VRF 归属', '外层标签标识骨干下一跳', 'P 设备不感知客户路由'],
      },
      {
        heading: '从控制面看路由如何跨骨干',
        paragraphs: [
          'PE 从 CE 学到私网路由后，将其放入对应 VRF，并附加 RD 与 RT 形成 VPNv4 路由。',
          'PE 之间通过 MP-BGP 交换这些路由，对端 PE 依据 RT 导入匹配的 VRF，再去掉 RD 还原为普通私网前缀。',
        ],
        bullets: ['CE 到 PE 用普通路由协议', 'PE 到 PE 用 MP-BGP VPNv4', 'P 不参与客户路由'],
      },
      {
        heading: '隔离来自哪里',
        paragraphs: [
          '隔离首先来自 VRF 的路由表分离，其次来自 RT 的导入导出控制。只有两者同时正确，租户流量才不会串到别的 VRF。',
          '标签只负责把包送到正确的出口 PE 和正确的 VRF，它本身不提供安全隔离。把标签当成加密或访问控制是常见误解。',
        ],
      },
    ],
    proTheory: [
      {
        heading: 'MP-BGP VPNv4 与路由目标',
        paragraphs: [
          'VPNv4 前缀由 RD 与 IPv4 前缀拼接而成，长度可变。扩展团体中的 Route Target 决定导入导出关系，一个 VRF 可以导入多个 RT，也可以导出多个 RT。',
          'RT 匹配是策略问题，不是连通性问题。两端 RT 不匹配时，VPNv4 路由可以存在，但不会进入目标 VRF，表现为控制面有路由、转发面没有。',
        ],
        bullets: ['RD 8 字节', 'RT 为扩展团体属性', '导入导出方向要分别核对'],
      },
      {
        heading: '标签栈与倒数第二跳弹出',
        paragraphs: [
          'MPLS 标签栈按后进先出处理，外层标签先被交换。倒数第二跳弹出可以让出口 PE 少做一次外层标签查找，但会改变出口处的标签栈形态。',
          '排障时要区分外层标签由 LDP 分配还是由 SR 分配，内层标签由 VPN 实例分配。混用不同标签分发方式时，标签栈的预期形态会不同。',
        ],
      },
      {
        heading: '常见边界：会话正常但不转发',
        paragraphs: [
          'VPNv4 会话 Established 只说明 TCP 与 BGP 能力协商成功，不保证 RT 匹配、下一跳可达或标签路径完整。',
          '若下一跳不可达，路由可能处于有效但不优的状态；若标签路径中断，控制面仍然正常。判断要同时看 BGP 路由、标签转发表和 VRF 路由表。',
        ],
        bullets: ['会话状态不等于转发可用', '下一跳与标签路径要单独验证', 'VRF 路由表是最终判据之一'],
      },
    ],
    lab: {
      platform: 'eNSP',
      devices: ['AR 系列路由器 5 台，分别扮演 CE-A、PE-1、P-1、P-2、PE-2、CE-B、CE-C', '支持 MPLS 的 AR 型号或 CE 交换机作为 PE', '实验主机一台用于记录配置与结果'],
      versions: '以合法取得且受支持的镜像版本为准',
      requirements: [
        '使用支持 MPLS、LDP 与 BGP VPNv4 的 AR 或 CE 镜像，具体型号能力以厂商文档为准。',
        '若本地 eNSP 环境不支持 MPLS 相关模块，改用两台 Linux 路由器加 FRRouting 的替代实验，仅验证 VRF 与 BGP 路由隔离，标签转发部分仅理论。',
        '替代实验同样标注 guide-only，不声称已在指定平台运行。',
      ],
      addressing: [
        '租户 A 私网 192.0.2.0/24，租户 B 私网同样使用 192.0.2.0/24。',
        '租户 C 私网 198.51.100.0/24，用于观察第三个 VRF 的导入导出。',
        'PE-1 与 PE-2 环回口及 PE 间互联使用 203.0.113.0/24。',
        'CE 与 PE 之间使用各自私网网段中的可用地址。',
      ],
      tasks: [
        {
          title: '建立 VRF 与接入',
          steps: [
            '在 PE-1 与 PE-2 上分别为租户 A、B、C 创建 VRF。',
            '把连接对应 CE 的接口绑定到 VRF 并配置私网地址。',
            '在 CE 侧配置指向 PE 的默认路由或静态路由。',
            '确认每个 VRF 的路由表只包含本租户前缀。',
          ],
          observe: '记录每个 VRF 的路由条目数量，确认相同 192.0.2.0/24 在不同 VRF 中同时存在。',
        },
        {
          title: '配置 RD、RT 与 MP-BGP',
          steps: [
            '为每个 VRF 配置唯一的 RD 与导入导出 RT。',
            '在 PE-1 与 PE-2 之间建立 IBGP 会话并启用 VPNv4 地址族。',
            '确认两端 VPNv4 邻居进入 Established。',
            '检查对端 VPNv4 路由是否携带预期 RT 并导入目标 VRF。',
          ],
          observe: '对比导入前后目标 VRF 的路由表，确认路由来自远端 PE 而非本地直连。',
        },
        {
          title: '启用 LDP 与验证标签转发',
          steps: [
            '在 PE 与 P 的骨干接口及环回口启用 MPLS 与 LDP。',
            '确认 PE 与 P 之间的 LDP 会话建立。',
            '从 CE-A 向 CE-B 发起连通性测试。',
            '在 PE 入口与 P 上分别查看标签栈与标签转发表。',
          ],
          observe: '确认入口出现两层标签，核心只交换外层标签，出口 PE 依据内层标签进入正确 VRF。',
        },
      ],
      commands: [
        {
          title: 'PE-1 上创建 VRF 并绑定接口',
          language: 'text',
          code: `ip vpn-instance tenant-a
 ipv4-family
  route-distinguisher 65000:1
  vpn-target 65000:1 export-extcommunity
  vpn-target 65000:1 import-extcommunity
interface GigabitEthernet0/0/1
 ip binding vpn-instance tenant-a
 ip address 192.0.2.1 255.255.255.0`,
        },
        {
          title: 'PE-1 上启用 MPLS LDP 与 VPNv4 邻居',
          language: 'text',
          code: `mpls lsr-id 203.0.113.1
mpls
mpls ldp
interface LoopBack0
 ip address 203.0.113.1 255.255.255.255
 mpls
 mpls ldp
bgp 65000
 peer 203.0.113.2 as-number 65000
 peer 203.0.113.2 connect-interface LoopBack0
 ipv4-family vpnv4
  peer 203.0.113.2 enable`,
        },
        {
          title: '核对 VRF 路由与标签的只读命令',
          language: 'text',
          code: `display ip routing-table vpn-instance tenant-a
display bgp vpnv4 all routing-table
display mpls ldp session
display mpls lsp`,
        },
      ],
      verification: [
        '两个租户的 VRF 路由表中同时存在 192.0.2.0/24，且下一跳分别指向各自的远端 PE。',
        'PE 间 VPNv4 邻居状态为 Established，收到的 VPNv4 路由携带预期 RT。',
        'PE 入口标签栈包含内层与外层两个标签，P 上只按外层标签交换。',
        'CE-A 到 CE-B 的往返路径都落在各自 VRF 中，未出现跨 VRF 泄漏。',
      ],
      expected: [
        '租户 A 与租户 B 使用相同私网前缀，但端到端互不可见。',
        '删除对端 RT 导入后，VPNv4 路由仍存在，目标 VRF 路由表消失。',
        '关闭 LDP 后，VPNv4 控制面仍正常，但标签转发中断。',
      ],
      faults: [
        '把两个 VRF 的 RT 配成相同值，观察是否出现本不该有的路由导入。',
        '删除某一侧 VRF 的导入 RT，观察控制面与转发面现象差异。',
      ],
      recovery: [
        '恢复 RT 配置后，确认目标 VRF 路由重新出现且无多余路由。',
        '重新启用 LDP 并等待会话恢复，确认标签路径与端到端连通性同时恢复。',
      ],
      status: 'guide-only',
      statusNote: '依据公开标准与厂商文档编写，尚未在指定平台实机执行。',
      sources: [
        { title: 'RFC 4364 BGP/MPLS IP Virtual Private Networks', url: 'https://www.rfc-editor.org/rfc/rfc4364' },
        { title: 'RFC 3031 Multiprotocol Label Switching Architecture', url: 'https://www.rfc-editor.org/rfc/rfc3031' },
        { title: '华为企业技术支持', url: 'https://info.support.huawei.com/' },
      ],
    },
    challenges: [
      {
        id: 'mpls-choice-rd-rt',
        kind: 'choice',
        prompt: '同一 PE 上两个 VRF 使用相同 192.0.2.0/24，默认情况下会怎样？',
        hint: '先想 VRF 的路由表是否共享。',
        options: [
          { id: 'a', label: '两条路由互相覆盖，只剩一条', explanation: '只有在同一张路由表内才会互相覆盖，VRF 之间默认分离。' },
          { id: 'b', label: '两个 VRF 各自保留一条，互不可见', correct: true, explanation: 'VRF 提供独立路由表，相同前缀可以同时存在于不同 VRF。' },
          { id: 'c', label: 'PE 自动做地址转换后合并', explanation: 'VRF 不执行地址转换，合并需要显式的路由泄漏或 NAT 配置。' },
        ],
        explanation: 'VRF 的核心作用就是路由表隔离，相同前缀在不同 VRF 中互不冲突。',
      },
      {
        id: 'mpls-open-established',
        kind: 'open',
        prompt: 'VPNv4 会话已经 Established，但两端 CE 仍不通，列出你的排查顺序和每一步的判定依据。',
        hint: '把控制面、标签面、转发面、回程分开。',
        explanation: '先核对两端 RT 导入导出是否匹配，再确认 VPNv4 路由的下一跳可达，随后检查 LDP 标签路径，最后确认出口 VRF 与回程路由。会话状态只证明 BGP 能力协商成功。',
      },
    ],
    summary: [
      'VRF 提供转发表隔离，是相同私网前缀能共存的基础。',
      'RD 让相同前缀在 VPNv4 控制面获得唯一标识，RT 决定路由被哪个 VRF 接收。',
      '外层标签由 LDP 或类似机制分发，内层标签标识 VRF，P 设备只处理外层。',
      '会话 Established 不等于转发可用，排障要同时看路由、标签与回程。',
    ],
    misconceptions: [
      { wrong: '配置了 RD 就能实现租户隔离。', right: '隔离主要来自 VRF 路由表分离与 RT 导入导出控制，RD 只负责控制面唯一标识。' },
      { wrong: 'VPNv4 邻居 Up 就说明业务一定通。', right: '邻居状态只反映 BGP 会话，下一跳、标签路径、RT 匹配与回程都可能单独失败。' },
      { wrong: 'MPLS 标签提供加密保护。', right: '标签只用于转发定位，不提供加密或访问控制。' },
    ],
    sources: [
      { title: 'RFC 4364 BGP/MPLS IP Virtual Private Networks', url: 'https://www.rfc-editor.org/rfc/rfc4364', note: 'L3VPN 的 VPNv4 与 RT 语义。' },
      { title: 'RFC 3031 Multiprotocol Label Switching Architecture', url: 'https://www.rfc-editor.org/rfc/rfc3031', note: '标签栈与标签交换基本模型。' },
      { title: 'RFC 4760 Multiprotocol Extensions for BGP-4', url: 'https://www.rfc-editor.org/rfc/rfc4760', note: 'MP-BGP 多协议地址族扩展。' },
      { title: '华为企业技术支持', url: 'https://info.support.huawei.com/', note: 'VRP 上 VRF、BGP 与 MPLS 配置入口。' },
      { title: 'EVE-NG How-To 文档', url: 'https://www.eve-ng.net/index.php/documentation/howtos/', note: '合法镜像准备与平台使用说明。' },
    ],
    publicationStatus: 'published',
  },
  {
    id: 'l4-ha-security',
    title: '双机热备与安全域：切换到底保住了什么',
    question: '主设备宕机后，业务为什么有时仍然断？',
    level: 'L4',
    minutes: 55,
    goals: [
      '说明 VRRP 虚拟网关在双机切换中的作用与局限。',
      '区分控制面邻居、数据面会话与业务状态三类可用性证据。',
      '解释主备设备都健康时仍可能存在单点。',
      '设计一次可复现的切换实验并给出恢复判据。',
    ],
    prerequisites: ['l2-loop-stp', 'l3-static-return'],
    topicIds: ['vrrp', 'ha', 'firewall', 'routing'],
    topologyId: 'topo-l4-ha',
    steps: [
      {
        id: 'ha-step-vrrp',
        title: 'VRRP 只解决虚拟网关',
        plainText: '两台防火墙共用一个虚拟网关地址 192.0.2.254。主机只把网关指向这个虚拟地址，主设备故障时由备设备接管。',
        professionalText: 'VRRP 通过优先级与抢占决定 Master，虚拟 IP 与虚拟 MAC 随 Master 漂移。它保护的是网关这一跳，不保护穿越设备的既有会话。',
        focusNodeIds: ['fw-a', 'fw-b', 'vrrp-gw'],
        focusEdgeIds: ['ha-fwa-vrrp', 'ha-fwb-vrrp'],
        evidenceText: '在主机上查看 ARP 表中的网关 MAC，切换前后确认虚拟 MAC 是否漂移。',
        directionHints: ['先看虚拟地址归属', '再看虚拟 MAC 归属'],
      },
      {
        id: 'ha-step-preempt',
        title: '主备与抢占',
        plainText: '优先级高的设备成为 Master。抢占开启时，原主设备恢复后会抢回虚拟网关，这可能带来第二次切换。',
        professionalText: '抢占延迟用于等待路由收敛和会话同步完成。没有延迟的抢占可能在主设备刚恢复、状态尚未同步时就把流量切回，造成短暂中断。',
        focusNodeIds: ['fw-a', 'fw-b'],
        focusEdgeIds: ['ha-fwa-vrrp', 'ha-fwb-vrrp'],
        evidenceText: '记录主设备恢复后虚拟网关归属变化的时间点，与业务恢复时间对照。',
        directionHints: ['观察抢占是否发生', '观察抢占与业务恢复的先后'],
      },
      {
        id: 'ha-step-session',
        title: '会话同步决定连接是否延续',
        plainText: '防火墙会记录每条连接的源、目的、端口与状态。备设备若没有这些状态，接管后会把已有连接当成新连接或直接丢弃。',
        professionalText: '状态化设备的热备需要同步会话表、NAT 映射与必要的应用层状态。会话同步通道本身也是一条需要保护的链路。',
        focusNodeIds: ['fw-a', 'fw-b', 'core-sw'],
        focusEdgeIds: ['ha-fwa-vrrp', 'ha-fwb-vrrp', 'ha-vrrp-core'],
        evidenceText: '切换前后对比两台设备的会话表条目数量与关键五元组是否一致。',
        directionHints: ['先看会话表是否同步', '再看 NAT 映射是否保留'],
      },
      {
        id: 'ha-step-zone',
        title: '安全域与回程',
        plainText: '流量从外部进入某安全域，回程必须命中允许它返回的策略。切换后若安全域绑定或策略顺序变化，回程会被丢弃。',
        professionalText: '安全域把接口分组，策略在域间生效。主备设备的接口到安全域映射、策略顺序与路由必须一致。非对称路径会让回程落到另一台设备，若状态未同步就会被拒绝。',
        focusNodeIds: ['internet', 'fw-a', 'fw-b', 'core-sw'],
        focusEdgeIds: ['ha-inet-fwa', 'ha-inet-fwb', 'ha-vrrp-core'],
        evidenceText: '切换后分别查看两台设备的域间策略命中计数与丢包计数。',
        directionHints: ['确认接口到安全域映射一致', '确认回程路径经过同一台设备'],
      },
      {
        id: 'ha-step-neighbor',
        title: '路由邻居与链路状态',
        plainText: 'VRRP 切换只改变网关归属，不会自动让路由协议邻居立刻收敛。上行或下行邻居若仍指向旧设备，流量会走错方向。',
        professionalText: '双机设备通常分别与上下行建立路由邻居，并通过联动或路由度量影响选路。切换后要确认邻居重建、路由更新与转发路径一致。',
        focusNodeIds: ['fw-a', 'fw-b', 'core-sw', 'internet'],
        focusEdgeIds: ['ha-inet-fwa', 'ha-inet-fwb', 'ha-vrrp-core'],
        evidenceText: '切换后查看路由邻居状态与路由表下一跳，确认流量没有仍指向故障设备。',
        directionHints: ['上行邻居单独看', '下行邻居单独看'],
      },
      {
        id: 'ha-step-boundary',
        title: '控制面与数据面分开看',
        plainText: '设备显示邻居正常，不代表业务连接能建立；设备显示会话同步正常，也不代表回程策略正确。把三层证据分开，才能判断切换保住了什么。',
        professionalText: '控制面证据包括 VRRP 状态、路由邻居、同步通道状态。数据面证据包括会话表、NAT 映射、策略命中与端到端连通性。业务证据则是应用层请求是否成功。三层要分别核对。',
        focusNodeIds: ['app-srv', 'db-srv', 'adm-pc', 'core-sw'],
        focusEdgeIds: ['ha-core-app', 'ha-core-db', 'ha-core-adm'],
        evidenceText: '同时记录 VRRP 状态、会话表与一次真实业务请求结果，形成三层证据。',
        directionHints: ['控制面先确认', '数据面再确认', '业务面最后确认'],
      },
    ],
    why: [
      {
        heading: '切换成功为什么业务仍断',
        paragraphs: [
          'VRRP 只保证虚拟网关地址有人接管。已经建立的 TCP 连接、NAT 映射、应用登录状态并不在 VRRP 的保护范围内。',
          '若备设备没有同步会话，或者回程路径落到了未同步的一侧，主机看到的就是网关还在、连接却断了。',
        ],
        bullets: ['VRRP 保护网关', '会话同步保护连接', '策略与路由保护回程'],
      },
      {
        heading: '双机不等于无单点',
        paragraphs: [
          '两台设备都健康，也可能共用一条上行链路、一个会话同步口、一台核心交换机或同一个上游邻居。',
          '判断冗余是否成立，要看故障域是否真的分离，而不是只看设备数量。',
        ],
      },
    ],
    theory: [
      {
        heading: 'VRRP 的基本行为',
        paragraphs: [
          'VRRP 路由器组共享一个虚拟 IP 与虚拟 MAC，优先级最高的设备成为 Master 并响应 ARP。',
          'Master 定期发送通告，备设备在超时后接管。抢占与延迟决定原主恢复后的行为。',
        ],
        bullets: ['虚拟 IP 与虚拟 MAC 一起漂移', '优先级与抢占决定归属', '只覆盖网关这一跳'],
      },
      {
        heading: '状态化业务的 HA 边界',
        paragraphs: [
          '状态化防火墙需要同步会话表、NAT 表与应用层状态，备设备才能在接管后延续连接。',
          '同步是异步的，切换瞬间可能存在尚未同步的最新会话，因此仍会有少量连接中断。',
        ],
      },
      {
        heading: '安全域与回程',
        paragraphs: [
          '安全域把接口分组，策略在域间匹配。接口到安全域的映射在切换前后必须一致。',
          '非对称路径会让请求与回程落在不同设备，若状态不同步，回程会被当成非法流量丢弃。',
        ],
        bullets: ['域间策略要两侧一致', '非对称路径要避免', '回程是常见盲点'],
      },
    ],
    proTheory: [
      {
        heading: '同步通道与脑裂',
        paragraphs: [
          '会话同步通常走独立心跳或专用链路。同步链路中断时，两台设备可能都认为自己应为主，形成双主。',
          '双主会同时响应虚拟网关，导致 ARP 抖动与会话分裂。心跳链路本身需要冗余与监控。',
        ],
        bullets: ['心跳链路是独立故障域', '双主比单主更难排查'],
      },
      {
        heading: '路由联动与切换收敛',
        paragraphs: [
          '切换后上下行路由需要重新指向新主设备。仅依赖 VRRP 不会让路由协议自动改变下一跳。',
          '常见做法是路由度量联动、接口监控联动或明确的静态路由切换。每种方式都要验证收敛时间。',
        ],
      },
      {
        heading: '可用性判据的分层',
        paragraphs: [
          '控制面可用看 VRRP 状态、邻居状态、同步通道状态；数据面可用看会话表、NAT 映射、策略命中；业务可用看应用请求成功率。',
          '只报“切换成功”而不给出三层证据，无法说明业务是否真的连续。',
        ],
      },
    ],
    lab: {
      platform: 'eNSP',
      devices: ['AR 路由器 2 台作为双机网关', 'S5700 交换机 1 台作为核心交换', 'Linux 服务器 2 台分别扮演应用与数据库', 'PC 1 台作为管理终端'],
      versions: '以合法取得且受支持的镜像版本为准',
      requirements: [
        'eNSP 中两台 AR 通过交换机互联，配置 VRRP 虚拟网关 192.0.2.254。',
        '防火墙会话同步不作为 eNSP 必做项，eNSP 不具备状态化安全设备能力时会话同步部分仅理论；若需观察状态化行为，在 EVE-NG 中使用合法取得的安全设备镜像做可选扩展。',
        '所有地址为合成实验地址，不对应任何真实网络。',
      ],
      addressing: [
        'VRRP 虚拟网关 192.0.2.254/24。',
        'fw-a 真实接口 192.0.2.1/24，fw-b 真实接口 192.0.2.2/24。',
        '上行互联 203.0.113.0/30，两端分别使用 .1 与 .2。',
        '服务器与管理终端位于 192.0.2.0/24 内。',
      ],
      tasks: [
        {
          title: '建立 VRRP 主备',
          steps: [
            '在两台 AR 的下行接口配置 192.0.2.1 与 192.0.2.2。',
            '配置同一个 VRRP 组与虚拟 IP 192.0.2.254。',
            '把 fw-a 优先级调高，确认其成为 Master。',
            '在管理终端查看网关 MAC 与 ARP 表。',
          ],
          observe: '确认虚拟 IP 与虚拟 MAC 都指向 fw-a，主机可以通过虚拟网关访问服务器。',
        },
        {
          title: '执行切换并观察会话',
          steps: [
            '在管理终端建立一条持续业务连接。',
            '断开 fw-a 的下行接口或关闭设备。',
            '观察 fw-b 是否接管虚拟网关。',
            '记录业务连接是否中断以及中断时长。',
          ],
          observe: '对比切换前后的会话表与业务连接状态，判断中断来自网关漂移还是会话缺失。',
        },
        {
          title: '验证回程与路由',
          steps: [
            '切换后检查 fw-b 的上行路由与邻居状态。',
            '确认回程流量经过 fw-b 而不是仍指向 fw-a。',
            '恢复 fw-a 并开启抢占。',
            '观察第二次切换对业务的影响。',
          ],
          observe: '记录抢占恢复时虚拟网关归属变化与业务恢复时间，确认回程路径一致。',
        },
      ],
      commands: [
        {
          title: 'fw-a 的 VRRP 与接口配置',
          language: 'text',
          code: `interface Vlanif10
 ip address 192.0.2.1 255.255.255.0
 vrrp vrid 10 virtual-ip 192.0.2.254
 vrrp vrid 10 priority 120
 vrrp vrid 10 preempt-mode timer delay 20`,
        },
        {
          title: '上行接口与默认路由',
          language: 'text',
          code: `interface GigabitEthernet0/0/1
 ip address 203.0.113.1 255.255.255.252
ip route-static 0.0.0.0 0.0.0.0 203.0.113.2`,
        },
        {
          title: '状态核对命令',
          language: 'text',
          code: `display vrrp
display vrrp statistics
display ip routing-table
display arp all`,
        },
      ],
      verification: [
        '切换前 fw-a 为 Master，虚拟 IP 与虚拟 MAC 均由 fw-a 持有。',
        '断开 fw-a 后 fw-b 成为 Master，管理终端仍能通过 192.0.2.254 访问服务器。',
        '恢复 fw-a 并触发抢占后，虚拟网关回到 fw-a，业务恢复时间可重复测量。',
        '切换前后回程路由下一跳与当前 Master 一致，未出现非对称路径。',
      ],
      expected: [
        'VRRP 切换成功，但无状态同步时已有 TCP 连接会中断。',
        '抢占延迟过短时，主设备恢复会造成一次额外短暂中断。',
        '上行邻居未重建时，虚拟网关正常但业务仍不通。',
      ],
      faults: [
        '关闭会话同步或跳过同步步骤，观察切换后连接是否重建。',
        '把 fw-b 的上行默认路由指向错误下一跳，观察回程失败现象。',
      ],
      recovery: [
        '恢复同步与正确路由后，重新测试切换，确认连接中断时间缩短。',
        '关闭抢占或增大抢占延迟，确认主设备恢复不再造成二次中断。',
      ],
      status: 'guide-only',
      statusNote: '依据公开标准与厂商文档编写，尚未在指定平台实机执行。',
      sources: [
        { title: 'RFC 5798 Virtual Router Redundancy Protocol Version 3', url: 'https://www.rfc-editor.org/rfc/rfc5798' },
        { title: '华为企业技术支持', url: 'https://info.support.huawei.com/' },
        { title: 'EVE-NG How-To 文档', url: 'https://www.eve-ng.net/index.php/documentation/howtos/' },
      ],
    },
    challenges: [
      {
        id: 'ha-choice-tcp',
        kind: 'choice',
        prompt: 'VRRP 切换成功，但已有 TCP 会话断开，最可能的原因是什么？',
        hint: 'VRRP 保护的是哪一层？',
        options: [
          { id: 'a', label: '虚拟网关地址配置错误', explanation: '若地址错误，切换本身就不会成功。' },
          { id: 'b', label: '备设备没有该会话的状态', correct: true, explanation: 'VRRP 只迁移网关，状态化连接需要额外的会话同步。' },
          { id: 'c', label: '交换机 STP 未收敛', explanation: 'STP 收敛会影响连通性，但题目已说明切换成功。' },
        ],
        explanation: 'VRRP 只保证网关可达，已建立连接能否延续取决于会话同步。',
      },
      {
        id: 'ha-open-single-point',
        kind: 'open',
        prompt: '主备两台设备都健康，为什么仍可能出现单点？举出至少两个共享故障域并说明如何验证。',
        hint: '从链路、邻居、同步通道、上游设备四个方向想。',
        explanation: '两台设备可能共用一条上行链路、一个上游邻居、一条同步链路或一台核心交换机。验证方法是分别断开每个共享组件，观察业务是否同时受影响。',
      },
    ],
    summary: [
      'VRRP 只迁移虚拟网关，不迁移已有会话与业务状态。',
      '状态化业务的热备需要会话、NAT 与应用状态的同步。',
      '安全域映射、回程路由与路由邻居必须与当前 Master 一致。',
      '判断切换效果要同时给出控制面、数据面与业务面证据。',
    ],
    misconceptions: [
      { wrong: '双机部署后就不存在单点。', right: '共享链路、共享上游、共享同步通道都可能成为单点。' },
      { wrong: 'VRRP 切换成功等于业务不中断。', right: '切换只保证网关接管，连接是否延续取决于会话同步与回程。' },
      { wrong: '会话同步开启后所有连接都能保留。', right: '同步是异步的，切换瞬间仍可能有少量会话丢失。' },
    ],
    sources: [
      { title: 'RFC 5798 Virtual Router Redundancy Protocol Version 3', url: 'https://www.rfc-editor.org/rfc/rfc5798', note: 'VRRP 状态机、优先级与抢占。' },
      { title: 'RFC 826 An Ethernet Address Resolution Protocol', url: 'https://www.rfc-editor.org/rfc/rfc826', note: '虚拟网关的 ARP 行为基础。' },
      { title: '华为企业技术支持', url: 'https://info.support.huawei.com/', note: 'VRRP 与安全域配置入口。' },
      { title: 'EVE-NG How-To 文档', url: 'https://www.eve-ng.net/index.php/documentation/howtos/', note: '安全设备镜像的合法准备方式。' },
    ],
    publicationStatus: 'published',
  },
  {
    id: 'l5-zero-trust',
    title: '统一认证与零信任：登录成功不等于资源可用',
    question: '账号登录成功，为什么访问资源仍被拒绝？',
    level: 'L5',
    minutes: 55,
    goals: [
      '区分认证、授权与策略决策三个阶段。',
      '说明设备状态与上下文如何影响资源访问。',
      '解释 RADIUS 认证与零信任策略的边界。',
      '用五段日志证据定位一次授权失败。',
    ],
    prerequisites: ['l2-vlan-trunk', 'l4-ha-security'],
    topicIds: ['zero-trust', 'radius', 'iam', 'access-control'],
    topologyId: 'topo-l5-trust',
    steps: [
      {
        id: 'trust-step-authn',
        title: '认证只回答你是谁',
        plainText: '用户输入账号密码，认证服务核对后返回成功。这只证明凭据匹配，不代表这个用户能访问任何具体资源。',
        professionalText: '认证建立主体身份，常见协议包括 RADIUS、OAuth 2.0 与 SAML。认证结果通常是一个身份断言或令牌，不直接携带资源权限。',
        focusNodeIds: ['user-pc', 'access-gw', 'idp'],
        focusEdgeIds: ['trust-user-gw', 'trust-gw-idp'],
        evidenceText: '在 IdP 日志中确认认证成功事件与主体标识，在网关上确认收到认证结果。',
        directionHints: ['先看用户到网关', '再看网关到 IdP'],
      },
      {
        id: 'trust-step-context',
        title: '设备状态与上下文',
        plainText: '同一账号在不同设备上访问，结果可能不同。设备是否受管、补丁是否达标、接入位置是否可信，都会进入策略判断。',
        professionalText: '零信任策略通常结合主体、设备、资源与环境上下文。设备状态由端点代理或准入系统提供，缺失状态时策略往往默认拒绝。',
        focusNodeIds: ['user-pc', 'access-gw', 'policy'],
        focusEdgeIds: ['trust-user-gw', 'trust-gw-policy'],
        evidenceText: '在策略引擎中查看本次请求携带的设备属性，确认是否缺少受管标记或健康状态。',
        directionHints: ['看设备属性是否存在', '看属性值是否满足策略'],
      },
      {
        id: 'trust-step-policy',
        title: '策略决策与最小权限',
        plainText: '策略引擎根据身份、设备与资源计算允许或拒绝。即使认证成功，策略也可能因为条件不满足而拒绝。',
        professionalText: '策略决策与策略执行分离，决策点输出允许、拒绝或附加条件，执行点负责落实。最小权限要求默认拒绝，仅放行明确需要的资源。',
        focusNodeIds: ['policy', 'app', 'resource'],
        focusEdgeIds: ['trust-policy-app', 'trust-app-res'],
        evidenceText: '查看策略命中规则与决策原因，确认拒绝来自哪一条条件。',
        directionHints: ['先看命中哪条规则', '再看拒绝原因字段'],
      },
      {
        id: 'trust-step-token',
        title: '会话令牌承载了什么',
        plainText: '登录后拿到的令牌通常只说明身份与有效期，不自动包含所有资源权限。令牌过期或受众不匹配同样会导致拒绝。',
        professionalText: '令牌包含签发者、主体、受众、有效期与签名。资源侧会校验签名、受众与时效，再结合本地策略决定是否放行。',
        focusNodeIds: ['access-gw', 'idp', 'app'],
        focusEdgeIds: ['trust-gw-idp', 'trust-policy-app'],
        evidenceText: '解码令牌头部与声明，核对签发者、受众与过期时间是否与资源要求一致。',
        directionHints: ['看签发者与受众', '看有效期是否已过'],
      },
      {
        id: 'trust-step-audit',
        title: '审计把五段证据串起来',
        plainText: '用户、网关、IdP、策略与应用各自产生日志。只有按同一请求标识关联，才能判断拒绝发生在哪一段。',
        professionalText: '审计日志应包含时间、主体、设备、资源、决策与请求标识。时间同步与统一标识是关联分析的前提。',
        focusNodeIds: ['audit', 'app', 'policy'],
        focusEdgeIds: ['trust-audit', 'trust-policy-app'],
        evidenceText: '用请求标识在五个日志源中检索同一条访问，确认各段结论是否一致。',
        directionHints: ['按请求标识关联', '按时间顺序排列'],
      },
      {
        id: 'trust-step-boundary',
        title: 'RADIUS 与零信任的边界',
        plainText: 'RADIUS 常负责网络接入认证与授权属性下发，零信任策略则面向具体资源做持续判断。两者可以配合，但不是同一件事。',
        professionalText: 'RADIUS 的 Access-Accept 可以携带属性用于网络层授权，但它不决定应用内细粒度权限。零信任策略依赖身份、设备与上下文，通常由独立策略引擎完成。',
        focusNodeIds: ['access-gw', 'idp', 'policy', 'resource'],
        focusEdgeIds: ['trust-gw-idp', 'trust-gw-policy', 'trust-app-res'],
        evidenceText: '对比 RADIUS 返回属性与策略引擎决策，确认拒绝发生在网络准入还是资源授权层。',
        directionHints: ['先分清准入层', '再分清资源层'],
      },
    ],
    why: [
      {
        heading: '登录成功只是起点',
        paragraphs: [
          '用户看到的“登录成功”通常只表示凭据校验通过。真正决定能否打开某个页面的是后续授权决策。',
          '把认证成功当成授权成功，会让排障方向完全偏离。',
        ],
        bullets: ['认证回答身份', '授权回答能做什么', '策略回答当前条件下是否允许'],
      },
      {
        heading: '为什么需要上下文',
        paragraphs: [
          '同一个账号在受管设备与未知设备上的风险不同。零信任把设备状态、接入位置与时间等因素纳入判断。',
          '上下文缺失时，策略通常按默认拒绝处理，这也是“账号没问题却打不开”的常见原因。',
        ],
      },
    ],
    theory: [
      {
        heading: '认证、授权与审计',
        paragraphs: [
          '认证确认主体身份，授权决定主体能对资源执行什么操作，审计记录发生了什么。',
          '三者分离可以让身份来源变化时不影响授权模型，也便于追责。',
        ],
        bullets: ['认证看凭据', '授权看策略', '审计看证据'],
      },
      {
        heading: '策略决策与执行分离',
        paragraphs: [
          '策略决策点计算允许或拒绝，策略执行点落实结果。分离后策略可以集中管理，执行点分布在网关与应用侧。',
          '决策需要上下文输入，上下文缺失会导致默认拒绝。',
        ],
      },
      {
        heading: 'RADIUS 的角色',
        paragraphs: [
          'RADIUS 常用于网络接入认证，Access-Request 携带凭据，Access-Accept 或 Access-Reject 返回结果与属性。',
          'RADIUS 属性可以影响 VLAN 或 ACL，但它不等同于应用级零信任策略。',
        ],
        bullets: ['Access-Accept 不等于资源授权', '属性用于网络层控制', '应用权限需单独判断'],
      },
    ],
    proTheory: [
      {
        heading: '令牌校验的四个要点',
        paragraphs: [
          '资源侧校验令牌签名、签发者、受众与有效期。任一不匹配都会拒绝。',
          '受众字段尤其容易被忽略：为应用 A 签发的令牌不应被应用 B 接受。',
        ],
        bullets: ['签名', '签发者', '受众', '有效期'],
      },
      {
        heading: '持续评估与最小权限',
        paragraphs: [
          '零信任强调持续评估，设备状态变化后原有会话可能被重新判定。',
          '最小权限要求默认拒绝，只放行明确需要的资源与操作，减少横向移动面。',
        ],
      },
      {
        heading: '日志关联的关键字段',
        paragraphs: [
          '统一请求标识、主体标识、设备标识、资源标识、决策结果与时间戳是关联分析的基础。',
          '缺少请求标识时，只能靠时间窗口猜测，容易把不同请求混在一起。',
        ],
      },
    ],
    lab: {
      platform: 'EVE-NG',
      devices: ['Linux 虚拟机 gateway-01，运行反向代理与访问控制', 'Linux 虚拟机 idp-01，运行 FreeRADIUS 3.x', 'Linux 虚拟机 app-01，运行 Apache HTTP Server', 'Linux 虚拟机 audit-01，运行 rsyslog'],
      versions: '以合法取得且受支持的镜像版本为准',
      requirements: [
        '所有虚拟机位于隔离实验网络，使用合成账号与合成口令。',
        '若无法搭建 FreeRADIUS，可只做静态流程判读，按五段证据表逐项填写。',
        '不接入任何真实身份源，不导入真实用户数据。',
      ],
      addressing: [
        '用户侧 192.0.2.0/24，user-pc 使用 192.0.2.20。',
        '应用侧 198.51.100.0/24，app-01 使用 198.51.100.20。',
        '管理侧 203.0.113.0/24，idp-01 使用 203.0.113.10，audit-01 使用 203.0.113.30。',
      ],
      tasks: [
        {
          title: '完成一次认证',
          steps: [
            '在 idp-01 上创建合成用户 alice。',
            '从 user-pc 通过网关发起认证请求。',
            '在 idp-01 日志中确认认证成功。',
            '记录认证结果与请求标识。',
          ],
          observe: '确认认证成功后，用户尚未获得任何资源访问权限。',
        },
        {
          title: '制造授权失败',
          steps: [
            '在策略中要求设备必须为受管状态。',
            '让 user-pc 以未受管状态发起访问。',
            '观察网关返回的拒绝结果。',
            '在策略日志中定位拒绝原因。',
          ],
          observe: '区分认证成功事件与授权拒绝事件，确认两者发生在不同阶段。',
        },
        {
          title: '五段证据关联',
          steps: [
            '收集用户、网关、IdP、策略与应用五段日志。',
            '按请求标识检索同一条访问。',
            '按时间顺序排列各段结论。',
            '写出拒绝发生的具体环节。',
          ],
          observe: '确认同一请求在五段日志中的主体、资源与决策一致。',
        },
      ],
      commands: [
        {
          title: 'FreeRADIUS 认证测试',
          language: 'bash',
          code: `radtest alice 'LabPass-Example' 203.0.113.10 0 testing123`,
        },
        {
          title: '合成策略决策记录示例',
          language: 'json',
          code: `{
  "request_id": "req-demo-0001",
  "subject": "alice",
  "device": { "managed": false, "posture": "unknown" },
  "resource": "app-a",
  "decision": "deny",
  "reason": "device_posture_unmet"
}`,
        },
        {
          title: '应用侧访问测试',
          language: 'bash',
          code: `curl -k -i https://198.51.100.20/app-a
curl -k -i -H 'Authorization: Bearer demo-token' https://198.51.100.20/app-a`,
        },
      ],
      verification: [
        'IdP 日志显示认证成功，策略日志显示授权拒绝，两者时间接近但阶段不同。',
        '策略拒绝原因字段指向设备状态不满足，而不是凭据错误。',
        '补齐设备状态后，同一请求的决策变为允许。',
        '五段日志能按请求标识关联到同一次访问。',
      ],
      expected: [
        '认证成功不等于资源可访问。',
        '设备上下文缺失时，策略默认拒绝。',
        '令牌受众不匹配时，资源侧拒绝访问。',
      ],
      faults: [
        '删除设备状态属性，观察策略是否转为拒绝。',
        '把令牌受众改为其他应用，观察资源侧校验结果。',
      ],
      recovery: [
        '恢复设备状态上报后，确认策略重新允许。',
        '使用正确受众重新签发令牌，确认访问恢复。',
      ],
      status: 'guide-only',
      statusNote: '依据公开标准与厂商文档编写，尚未在指定平台实机执行。',
      sources: [
        { title: 'NIST SP 800-207 Zero Trust Architecture', url: 'https://csrc.nist.gov/publications/detail/sp/800-207/final' },
        { title: 'RFC 2865 Remote Authentication Dial In User Service', url: 'https://www.rfc-editor.org/rfc/rfc2865' },
        { title: 'RFC 6749 The OAuth 2.0 Authorization Framework', url: 'https://www.rfc-editor.org/rfc/rfc6749' },
        { title: 'EVE-NG How-To 文档', url: 'https://www.eve-ng.net/index.php/documentation/howtos/' },
      ],
    },
    challenges: [
      {
        id: 'trust-choice-authz',
        kind: 'choice',
        prompt: '账号登录成功但访问应用被拒绝，最先应该区分什么？',
        hint: '认证与授权是两个阶段。',
        options: [
          { id: 'a', label: '认证失败还是授权失败', correct: true, explanation: '先确定拒绝发生在哪个阶段，才能选对日志与排查对象。' },
          { id: 'b', label: 'DNS 是否正确', explanation: 'DNS 问题通常表现为解析失败，而不是登录后拒绝。' },
          { id: 'c', label: '交换机端口速率', explanation: '端口速率与授权决策无直接关系。' },
        ],
        explanation: '认证成功只说明身份可信，资源访问由授权策略决定。',
      },
      {
        id: 'trust-open-logs',
        kind: 'open',
        prompt: '如何用日志区分“认证成功但授权失败”和“令牌无效”？分别需要哪些字段？',
        hint: '看认证事件、策略决策与令牌校验三段。',
        explanation: '认证成功会在 IdP 留下成功事件；授权失败会在策略日志留下拒绝原因；令牌无效会在资源侧留下签名、受众或时效校验失败记录。三段字段不同，可据此区分。',
      },
    ],
    summary: [
      '认证只回答身份，授权才决定能否访问资源。',
      '设备状态与上下文缺失会让策略默认拒绝。',
      '令牌需要校验签名、签发者、受众与有效期。',
      '审计日志按请求标识关联，才能定位拒绝发生的阶段。',
    ],
    misconceptions: [
      { wrong: '登录成功就应该能打开所有应用。', right: '资源访问由授权策略决定，认证成功只是前提。' },
      { wrong: 'RADIUS 返回 Access-Accept 就等于应用授权通过。', right: 'RADIUS 主要面向网络接入，应用级权限需由策略引擎判断。' },
      { wrong: '令牌只要没过期就一定有效。', right: '还要校验签名、签发者与受众是否匹配。' },
    ],
    sources: [
      { title: 'NIST SP 800-207 Zero Trust Architecture', url: 'https://csrc.nist.gov/publications/detail/sp/800-207/final', note: '零信任的决策与执行分离模型。' },
      { title: 'RFC 2865 Remote Authentication Dial In User Service', url: 'https://www.rfc-editor.org/rfc/rfc2865', note: 'RADIUS 认证与属性语义。' },
      { title: 'RFC 6749 The OAuth 2.0 Authorization Framework', url: 'https://www.rfc-editor.org/rfc/rfc6749', note: '授权框架与令牌基本概念。' },
      { title: 'RFC 7519 JSON Web Token', url: 'https://www.rfc-editor.org/rfc/rfc7519', note: '令牌声明与校验字段。' },
    ],
    publicationStatus: 'published',
  },
  {
    id: 'l5-cloud-desktop',
    title: '云桌面：控制面、会话面、数据面分开看',
    question: '桌面分配成功，画面为什么一直连不上？',
    level: 'L5',
    minutes: 50,
    goals: [
      '区分云桌面的接入面、控制面、会话面与数据面。',
      '解释桌面分配成功与会话建立成功的差别。',
      '判断显示协议端口与网关策略对连接的影响。',
      '按四段证据定位一次画面无法建立的问题。',
    ],
    prerequisites: ['l2-vlan-trunk', 'l4-ha-security'],
    topicIds: ['vdi', 'virtualization', 'tls', 'identity'],
    topologyId: 'topo-l5-vdi',
    steps: [
      {
        id: 'vdi-step-access',
        title: '接入面先过认证与网关',
        plainText: '瘦终端先连接安全网关，完成身份认证后才进入桌面访问流程。接入失败时，用户连桌面列表都看不到。',
        professionalText: '接入面通常包含 TLS 网关、身份认证与客户端校验。网关负责终结外部连接并把请求转发到内部服务。',
        focusNodeIds: ['thin-client', 'ssl-gw', 'lb'],
        focusEdgeIds: ['vdi-client-gw', 'vdi-gw-lb'],
        evidenceText: '在客户端与网关上确认 TLS 握手成功、认证通过、请求已转发到负载均衡。',
        directionHints: ['先看客户端到网关', '再看网关到负载均衡'],
      },
      {
        id: 'vdi-step-control',
        title: '控制面负责分配',
        plainText: '控制器决定把哪台虚拟机分配给哪个用户。分配成功只说明资源被选中，不代表显示通道已经建立。',
        professionalText: '控制器维护资源池、用户与虚拟机的映射，并下发连接参数。它会与身份目录交互，确认用户与桌面组的归属。',
        focusNodeIds: ['controller', 'lb', 'ad'],
        focusEdgeIds: ['vdi-ctrl-lb', 'vdi-ctrl-ad'],
        evidenceText: '在控制器日志中查看分配记录与连接参数，确认用户、虚拟机与协议端口已下发。',
        directionHints: ['先看分配是否成功', '再看连接参数是否完整'],
      },
      {
        id: 'vdi-step-session',
        title: '会话面建立显示通道',
        plainText: '分配完成后，客户端需要与虚拟机或会话网关建立显示协议连接。这一步失败时，用户看到的是黑屏或一直转圈。',
        professionalText: '显示协议通常使用独立端口，经会话网关转发。防火墙策略、NAT 映射或端口未放行都会让显示通道建立失败。',
        focusNodeIds: ['thin-client', 'ssl-gw', 'vm-host'],
        focusEdgeIds: ['vdi-client-gw', 'vdi-lb-host'],
        evidenceText: '在网关与宿主机上查看显示协议端口的连接状态与拒绝计数。',
        directionHints: ['确认显示端口已放行', '确认会话网关转发路径'],
      },
      {
        id: 'vdi-step-host',
        title: '虚拟机与宿主机',
        plainText: '虚拟机必须处于运行状态，宿主机要有足够资源。虚拟机未启动或资源不足时，显示通道也建立不起来。',
        professionalText: '宿主机提供 CPU、内存与虚拟显卡资源。虚拟机的运行状态、控制台可用性与资源余量决定会话能否启动。',
        focusNodeIds: ['vm-host', 'controller'],
        focusEdgeIds: ['vdi-ctrl-host', 'vdi-lb-host'],
        evidenceText: '在宿主机上确认虚拟机运行状态与资源余量，在控制器上确认目标虚拟机可达。',
        directionHints: ['先看虚拟机是否运行', '再看宿主机资源'],
      },
      {
        id: 'vdi-step-storage',
        title: '存储影响启动与使用',
        plainText: '存储故障有时不影响登录，却会让桌面卡死或无法打开文件。存储问题要分“启动阶段”和“使用阶段”分别看。',
        professionalText: '虚拟机镜像与用户数据通常位于共享存储。存储延迟升高会导致启动变慢，存储不可用会导致虚拟机无法启动或磁盘 I/O 失败。',
        focusNodeIds: ['vm-host', 'storage'],
        focusEdgeIds: ['vdi-host-storage'],
        evidenceText: '在宿主机上查看存储挂载状态与 I/O 延迟，在存储侧查看导出与连接数。',
        directionHints: ['先看挂载是否正常', '再看 I/O 延迟'],
      },
      {
        id: 'vdi-step-evidence',
        title: '三层证据链',
        plainText: '把接入、控制、显示、存储四段证据按同一用户会话串起来，才能判断“分配成功但连不上”卡在哪一段。',
        professionalText: '接入证据看 TLS 与认证，控制证据看分配记录，显示证据看协议端口与会话状态，存储证据看挂载与 I/O。四段缺一不可。',
        focusNodeIds: ['thin-client', 'controller', 'vm-host', 'storage'],
        focusEdgeIds: ['vdi-client-gw', 'vdi-ctrl-host', 'vdi-host-storage'],
        evidenceText: '按会话标识检索四段日志，记录每段的成功或失败结论。',
        directionHints: ['接入先确认', '控制再确认', '显示与存储分别确认'],
      },
    ],
    why: [
      {
        heading: '分配成功只是控制面结果',
        paragraphs: [
          '控制器把桌面分配给用户，只说明资源池里有可用虚拟机并完成了映射。',
          '真正把画面送到终端的是显示协议通道，它经过网关、负载均衡与宿主机，任何一段被阻断都会表现为连不上。',
        ],
        bullets: ['控制面负责选择', '会话面负责传输画面', '数据面负责读写存储'],
      },
      {
        heading: '为什么要把三层分开',
        paragraphs: [
          '把“连不上”笼统归因于云桌面平台，会让人反复重启控制器却找不到问题。',
          '按接入、控制、显示、存储分层验证，能快速缩小范围并给出可复现证据。',
        ],
      },
    ],
    theory: [
      {
        heading: '接入面',
        paragraphs: [
          '接入面处理终端到网关的连接，包括 TLS 握手、身份认证与客户端合规检查。',
          '接入成功后，网关把请求转发到内部负载均衡或控制器。',
        ],
        bullets: ['TLS 与认证', '网关转发', '客户端合规'],
      },
      {
        heading: '控制面',
        paragraphs: [
          '控制器维护桌面池、用户映射与虚拟机状态，并与身份目录交互。',
          '分配结果是连接参数，不是已经建立的显示会话。',
        ],
        bullets: ['桌面池', '用户映射', '连接参数下发'],
      },
      {
        heading: '会话面与数据面',
        paragraphs: [
          '会话面承载显示协议，通常使用独立端口并经网关转发。数据面承载虚拟机镜像与用户数据。',
          '存储问题可能只影响使用阶段，而显示端口问题会直接导致黑屏或连接超时。',
        ],
        bullets: ['显示协议端口', '共享存储', '两类故障现象不同'],
      },
    ],
    proTheory: [
      {
        heading: '显示协议的连接路径',
        paragraphs: [
          '客户端先获取连接参数，再向会话网关或宿主机发起显示协议连接。',
          '路径上的 NAT、防火墙与负载均衡都可能改变目标地址或端口，排障要以实际连接参数为准。',
        ],
      },
      {
        heading: '身份依赖的传导',
        paragraphs: [
          '控制器依赖身份目录确认用户与桌面组归属。目录不可用时，新的分配会失败，但已有会话可能继续。',
          '因此“部分用户能连、部分不能”常与目录查询或组映射有关。',
        ],
      },
      {
        heading: '存储的两个阶段',
        paragraphs: [
          '启动阶段需要读取虚拟机镜像，存储不可用会导致虚拟机无法启动。',
          '使用阶段需要读写用户数据，存储延迟升高会表现为桌面卡顿或文件打不开。',
        ],
        bullets: ['启动看镜像可用性', '使用看 I/O 延迟'],
      },
    ],
    lab: {
      platform: 'EVE-NG',
      devices: ['Linux 虚拟机 vdi-host-01，运行 KVM/libvirt', 'Linux 虚拟机 vdi-ctrl-01，模拟控制器服务', 'Linux 虚拟机 vdi-store-01，提供 NFS 存储', 'Linux 虚拟机 ad-01，提供 LDAP 目录', 'Linux 客户端一台模拟瘦终端'],
      versions: '以合法取得且受支持的镜像版本为准',
      requirements: [
        '所有虚拟机在隔离网络内运行，使用合成用户与合成桌面池。',
        '显示协议可用 VNC 或 RDP 作为受支持的实验替代，具体端口以所选软件文档为准。',
        '无法搭建虚拟化环境时，按静态判定卡填写四段预期与故障现象。',
      ],
      addressing: [
        '终端侧 192.0.2.0/24，客户端使用 192.0.2.30。',
        '控制侧 198.51.100.0/24，控制器使用 198.51.100.10，负载均衡使用 198.51.100.5。',
        '存储侧 203.0.113.0/24，存储使用 203.0.113.40。',
      ],
      tasks: [
        {
          title: '验证接入与控制',
          steps: [
            '从客户端连接网关并完成认证。',
            '在控制器日志中确认桌面分配记录。',
            '记录控制器下发的连接参数。',
            '确认参数中的目标地址与端口可达。',
          ],
          observe: '区分“分配成功”与“显示会话建立成功”两个事件。',
        },
        {
          title: '验证显示通道',
          steps: [
            '在宿主机上确认虚拟机处于运行状态。',
            '检查显示协议端口是否监听。',
            '从客户端发起显示连接。',
            '在网关与宿主机上查看连接状态。',
          ],
          observe: '确认显示端口在路径上未被防火墙或 NAT 阻断。',
        },
        {
          title: '验证存储',
          steps: [
            '在宿主机上确认存储挂载正常。',
            '读取虚拟机镜像并记录 I/O 延迟。',
            '模拟存储延迟升高。',
            '观察桌面启动与使用阶段的表现差异。',
          ],
          observe: '对比存储正常与异常时，登录阶段和使用阶段分别受到什么影响。',
        },
      ],
      commands: [
        {
          title: '查看虚拟机与显示端口',
          language: 'bash',
          code: `virsh list --all
virsh domstate vdi-01
virsh vncdisplay vdi-01
ss -lntp | grep -E '5900|3389|443'`,
        },
        {
          title: '从客户端验证控制面与显示面',
          language: 'bash',
          code: `curl -k -I https://198.51.100.5/
nc -vz 203.0.113.40 2049
nc -vz 198.51.100.10 443`,
        },
        {
          title: '核对存储挂载与延迟',
          language: 'bash',
          code: `mount | grep nfs
df -h /srv/vdi
time dd if=/dev/zero of=/srv/vdi/test.img bs=1M count=64 oflag=direct`,
        },
      ],
      verification: [
        '接入面显示 TLS 与认证成功，控制面显示桌面分配成功。',
        '显示协议端口在客户端到宿主机的路径上可达。',
        '宿主机显示虚拟机运行且资源余量充足。',
        '存储挂载正常时桌面可启动，延迟升高时使用阶段明显变慢。',
      ],
      expected: [
        '控制面分配成功但显示端口被阻断时，客户端持续转圈或黑屏。',
        '身份目录不可用时，新分配失败而部分已有会话仍可用。',
        '存储只读或延迟升高时，登录可能成功但文件操作失败。',
      ],
      faults: [
        '在网关策略中阻断显示协议端口，观察客户端表现。',
        '暂停存储服务，观察新桌面启动与已有桌面使用的差异。',
      ],
      recovery: [
        '恢复显示端口放行后，确认客户端可以建立画面。',
        '恢复存储服务并确认挂载后，重新测试桌面启动与文件读写。',
      ],
      status: 'guide-only',
      statusNote: '依据公开标准与厂商文档编写，尚未在指定平台实机执行。',
      sources: [
        { title: 'RFC 8446 The Transport Layer Security Protocol Version 1.3', url: 'https://www.rfc-editor.org/rfc/rfc8446' },
        { title: 'NIST SP 800-125 Guide to Security for Full Virtualization Technologies', url: 'https://csrc.nist.gov/publications/detail/sp/800-125/final' },
        { title: '远程桌面服务规划和设计', url: 'https://learn.microsoft.com/zh-cn/windows-server/remote/remote-desktop-services/rds-plan-and-design' },
        { title: 'EVE-NG How-To 文档', url: 'https://www.eve-ng.net/index.php/documentation/howtos/' },
      ],
    },
    challenges: [
      {
        id: 'vdi-choice-control',
        kind: 'choice',
        prompt: '控制器显示桌面分配成功，但客户端一直黑屏，最应该先检查哪一段？',
        hint: '分配成功之后还有什么没有建立？',
        options: [
          { id: 'a', label: '控制面数据库', explanation: '分配已经成功，说明控制面至少完成了选择与映射。' },
          { id: 'b', label: '显示协议通道与端口', correct: true, explanation: '分配只下发参数，画面依赖显示协议连接建立。' },
          { id: 'c', label: '终端键盘布局', explanation: '键盘布局不影响画面建立。' },
        ],
        explanation: '控制面分配成功与会话面显示通道建立是两个独立阶段。',
      },
      {
        id: 'vdi-open-storage',
        kind: 'open',
        prompt: '存储故障只影响登录还是也会影响使用？分别说明判断依据。',
        hint: '启动阶段读镜像，使用阶段读写用户数据。',
        explanation: '存储不可用会影响虚拟机启动，表现为登录失败；存储延迟升高时虚拟机可能已启动，但文件读写与桌面操作明显变慢。判断依据是宿主机挂载状态、I/O 延迟与应用侧文件操作结果。',
      },
    ],
    summary: [
      '接入面负责 TLS 与认证，控制面负责桌面分配。',
      '分配成功不等于显示通道建立成功。',
      '显示协议端口与网关策略决定画面能否到达终端。',
      '存储故障要区分启动阶段与使用阶段。',
    ],
    misconceptions: [
      { wrong: '控制器显示分配成功就说明桌面可用。', right: '分配只是控制面结果，显示会话还要单独建立。' },
      { wrong: '存储故障一定导致无法登录。', right: '存储延迟升高时可能登录成功但使用卡顿，存储不可用才影响启动。' },
      { wrong: '云桌面连不上一定是网络问题。', right: '接入、控制、显示、存储任一段失败都会表现为连不上。' },
    ],
    sources: [
      { title: 'RFC 8446 The Transport Layer Security Protocol Version 1.3', url: 'https://www.rfc-editor.org/rfc/rfc8446', note: '接入面 TLS 握手基础。' },
      { title: 'NIST SP 800-125 Guide to Security for Full Virtualization Technologies', url: 'https://csrc.nist.gov/publications/detail/sp/800-125/final', note: '虚拟化安全与宿主机边界。' },
      { title: '远程桌面服务规划和设计', url: 'https://learn.microsoft.com/zh-cn/windows-server/remote/remote-desktop-services/rds-plan-and-design', note: '会话主机与连接参数概念。' },
      { title: 'EVE-NG How-To 文档', url: 'https://www.eve-ng.net/index.php/documentation/howtos/', note: '实验虚拟机与镜像准备。' },
    ],
    publicationStatus: 'published',
  },
  {
    id: 'l5-observability',
    title: '旁路观测：镜像、探针与业务路径不是同一条',
    question: '业务正常，为什么监控平台看不到流量？',
    level: 'L5',
    minutes: 45,
    goals: [
      '区分业务转发路径与镜像副本路径。',
      '说明端口镜像的源、目的与方向配置。',
      '定位镜像链路中导致观测缺失的断点。',
      '判断旁路观测故障对业务转发的影响边界。',
    ],
    prerequisites: ['l2-vlan-trunk', 'l3-static-return'],
    topicIds: ['observability', 'port-mirroring', 'siem', 'switching'],
    topologyId: 'topo-l5-observability',
    steps: [
      {
        id: 'obs-step-path',
        title: '业务路径与观测路径分开',
        plainText: '用户访问应用的流量沿交换机、防火墙到服务器，这是业务路径。镜像口把副本送到采集器，这是另一条路径。',
        professionalText: '业务转发由转发表决定，镜像副本由镜像配置决定。两条路径独立，业务通不代表副本一定到达采集器。',
        focusNodeIds: ['user-pc', 'sw-access', 'fw', 'app'],
        focusEdgeIds: ['obs-user-sw', 'obs-sw-fw', 'obs-fw-app'],
        evidenceText: '在交换机上分别查看业务接口流量与镜像口流量，确认两者是否同时存在。',
        directionHints: ['先看业务路径', '再看副本路径'],
      },
      {
        id: 'obs-step-mirror',
        title: '镜像的源与目的',
        plainText: '端口镜像把一个或多个源接口的报文复制到观察口。源口选错、方向选错，采集器就看不到想要的流量。',
        professionalText: '镜像配置包含源接口、观察接口与方向。入方向、出方向或双向的选择决定了副本包含哪些报文。',
        focusNodeIds: ['sw-access', 'mirror'],
        focusEdgeIds: ['obs-sw-mirror'],
        evidenceText: '确认源接口是否为承载业务的那个口，方向是否覆盖请求与响应。',
        directionHints: ['核对源接口', '核对镜像方向'],
      },
      {
        id: 'obs-step-collector',
        title: '采集器与 SIEM',
        plainText: '采集器接收镜像流量并解析，SIEM 再汇聚告警与日志。采集器网卡、过滤规则或存储空间都可能让流量“到了却没记录”。',
        professionalText: '采集器需要正确网卡、混杂模式与足够缓冲。SIEM 侧还依赖日志采集通道与索引状态。',
        focusNodeIds: ['mirror', 'collector', 'siem'],
        focusEdgeIds: ['obs-mirror-col', 'obs-col-siem'],
        evidenceText: '在采集器上确认网卡收包计数增长，在 SIEM 上确认对应索引有数据写入。',
        directionHints: ['先看采集器收包', '再看 SIEM 入库'],
      },
      {
        id: 'obs-step-direction',
        title: '单向与双向观测',
        plainText: '只镜像入方向时，采集器只能看到请求，看不到响应。分析会话完整性时需要双向副本。',
        professionalText: '单向镜像适合观察请求特征，双向镜像才能还原完整会话。方向配置错误会造成“有请求无响应”的假象。',
        focusNodeIds: ['sw-access', 'mirror', 'collector'],
        focusEdgeIds: ['obs-sw-mirror', 'obs-mirror-col'],
        evidenceText: '对比采集器中的请求与响应数量，确认方向是否覆盖双向。',
        directionHints: ['先数请求', '再数响应'],
      },
      {
        id: 'obs-step-loss',
        title: '丢包位置',
        plainText: '镜像流量可能在源口、观察口、采集器网卡或采集器缓冲处丢失。逐段计数才能定位。',
        professionalText: '交换机镜像口可能因拥塞丢弃副本，采集器可能因缓冲不足丢包。业务流量不受影响时，丢包只发生在副本路径。',
        focusNodeIds: ['sw-access', 'mirror', 'collector'],
        focusEdgeIds: ['obs-sw-mirror', 'obs-mirror-col'],
        evidenceText: '对比源口计数、观察口计数与采集器收包计数，找出第一处数量不匹配。',
        directionHints: ['从源口开始计数', '逐段对比'],
      },
      {
        id: 'obs-step-boundary',
        title: '旁路不影响转发',
        plainText: '镜像口 Down 或采集器故障时，业务转发通常不受影响。这正是旁路观测的优点，也是它容易被忽略的原因。',
        professionalText: '端口镜像属于复制转发，不进入业务转发决策。观测链路故障只影响可见性，不影响业务连通性。',
        focusNodeIds: ['sw-access', 'mirror', 'collector', 'siem'],
        focusEdgeIds: ['obs-sw-mirror', 'obs-mirror-col', 'obs-col-siem'],
        evidenceText: '断开观察口后确认业务仍然连通，同时观测数据停止。',
        directionHints: ['先确认业务未受影响', '再确认观测已中断'],
      },
    ],
    why: [
      {
        heading: '业务通不等于看得见',
        paragraphs: [
          '业务转发和镜像复制是两条独立路径。镜像配置错误、观察口故障或采集器过滤都会让监控平台看不到流量。',
          '这也是旁路观测的典型盲区：它不参与转发，所以出问题时业务毫无感知。',
        ],
        bullets: ['业务路径独立', '镜像路径独立', '观测故障不影响业务'],
      },
      {
        heading: '为什么要逐段计数',
        paragraphs: [
          '只看采集器有没有数据，无法判断副本是在交换机侧就没产生，还是中途丢了。',
          '对比源口、观察口与采集器收包计数，可以把问题锁定在具体一段。',
        ],
      },
    ],
    theory: [
      {
        heading: '端口镜像的基本模型',
        paragraphs: [
          '镜像把指定源接口的报文复制到观察接口，源接口与观察接口可以在同一台设备上。',
          '镜像方向决定复制入方向、出方向还是双向报文。',
        ],
        bullets: ['源接口', '观察接口', '镜像方向'],
      },
      {
        heading: '采集与汇总',
        paragraphs: [
          '采集器接收副本并进行解析、过滤与存储，SIEM 汇聚多源日志做关联分析。',
          '采集器网卡、缓冲与磁盘空间都会影响最终可见性。',
        ],
      },
      {
        heading: '旁路边界',
        paragraphs: [
          '端口镜像不进入业务转发决策，观察口故障不会阻断业务。',
          '串联探针则不同，它位于业务路径上，故障可能直接影响转发。',
        ],
        bullets: ['旁路只复制', '串联在路径上', '两者故障影响不同'],
      },
    ],
    proTheory: [
      {
        heading: '镜像口拥塞与丢副本',
        paragraphs: [
          '观察口带宽小于源口总流量时，副本会在交换机侧被丢弃。',
          '业务流量仍然正常，但采集器看到的数量少于实际。',
        ],
      },
      {
        heading: '采集器的混杂模式与过滤',
        paragraphs: [
          '采集器网卡需要接收非本机目的的报文，通常要求混杂模式。',
          '过滤规则过窄会把需要的流量提前丢弃，表现为“收到了但没记录”。',
        ],
      },
      {
        heading: '日志关联与时间同步',
        paragraphs: [
          '采集器与 SIEM 的时间必须同步，否则同一条会话在两侧的时间戳无法对齐。',
          '统一时间源与统一会话标识是关联分析的前提。',
        ],
      },
    ],
    lab: {
      platform: 'eNSP',
      devices: ['S5700 交换机 1 台作为接入与镜像设备', 'AR 路由器 1 台模拟边界与 ACL', 'Linux 采集主机 1 台运行抓包工具', 'PC 1 台作为业务终端'],
      versions: '以合法取得且受支持的镜像版本为准',
      requirements: [
        '交换机需支持端口镜像，配置关键字 observe-port 与 port-mirroring 以实际设备版本为准。',
        '采集主机在隔离网络内运行抓包工具，只抓取合成实验流量。',
        '若设备不支持端口镜像，改用 EVE-NG 中支持镜像的交换机镜像，或只做静态配置判读。',
      ],
      addressing: [
        '业务侧 192.0.2.0/24，终端使用 192.0.2.50，服务器使用 192.0.2.80。',
        '观测侧 198.51.100.0/24，采集器使用 198.51.100.60。',
        '管理侧 203.0.113.0/24，管理终端使用 203.0.113.70。',
      ],
      tasks: [
        {
          title: '配置端口镜像',
          steps: [
            '在交换机上指定观察口。',
            '把业务接入口设为镜像源。',
            '选择双向镜像。',
            '在采集器上确认收到副本。',
          ],
          observe: '对比业务接口与观察口的流量计数，确认副本已经产生。',
        },
        {
          title: '验证采集与入库',
          steps: [
            '在采集器上启动抓包并过滤业务地址。',
            '从终端发起一次业务访问。',
            '确认抓包文件包含请求与响应。',
            '在 SIEM 侧确认对应日志已入库。',
          ],
          observe: '确认采集器收包与 SIEM 入库两个环节都有数据。',
        },
        {
          title: '制造观测断点',
          steps: [
            '把镜像方向改为仅入方向。',
            '再次发起业务访问。',
            '对比请求与响应数量。',
            '恢复双向镜像并确认完整。',
          ],
          observe: '确认单向镜像下只看到请求，业务本身仍然正常。',
        },
      ],
      commands: [
        {
          title: '交换机端口镜像配置',
          language: 'text',
          code: `observe-port 1 interface GigabitEthernet0/0/24
interface GigabitEthernet0/0/1
 port-mirroring to observe-port 1 both`,
        },
        {
          title: '采集器抓包',
          language: 'bash',
          code: `ip link set eth1 promisc on
tcpdump -i eth1 -nn -c 50 host 192.0.2.50`,
        },
        {
          title: '计数对比',
          language: 'bash',
          code: `ip -s link show eth1
ss -s`,
        },
      ],
      verification: [
        '业务终端可以正常访问服务器，业务转发未受镜像配置影响。',
        '观察口出现与业务接口方向一致的副本流量。',
        '采集器抓包文件同时包含请求与响应。',
        '断开观察口后业务仍连通，但采集器不再收到副本。',
      ],
      expected: [
        '镜像方向设为仅入方向时，采集器只看到请求。',
        '观察口带宽不足时，采集器收到数量少于业务实际。',
        '采集器过滤规则过窄时，抓包文件为空但网卡计数增长。',
      ],
      faults: [
        '关闭观察口，观察业务是否中断以及观测是否停止。',
        '把镜像源改成错误接口，观察采集器是否还能看到业务流量。',
      ],
      recovery: [
        '恢复正确源接口与双向镜像后，确认请求与响应都出现在抓包中。',
        '恢复观察口后，确认观测数据重新产生且业务保持连通。',
      ],
      status: 'guide-only',
      statusNote: '依据公开标准与厂商文档编写，尚未在指定平台实机执行。',
      sources: [
        { title: 'RFC 7011 Specification of the IP Flow Information Export Protocol', url: 'https://www.rfc-editor.org/rfc/rfc7011' },
        { title: 'RFC 5424 The Syslog Protocol', url: 'https://www.rfc-editor.org/rfc/rfc5424' },
        { title: 'NIST SP 800-92 Guide to Computer Security Log Management', url: 'https://csrc.nist.gov/publications/detail/sp/800-92/final' },
        { title: '华为企业技术支持', url: 'https://info.support.huawei.com/' },
      ],
    },
    challenges: [
      {
        id: 'obs-choice-down',
        kind: 'choice',
        prompt: '镜像观察口 Down 时，业务转发通常会怎样？',
        hint: '端口镜像是否参与转发决策？',
        options: [
          { id: 'a', label: '业务随之中断', explanation: '端口镜像只复制报文，不进入业务转发决策。' },
          { id: 'b', label: '业务正常，观测中断', correct: true, explanation: '旁路观测故障只影响可见性，不影响业务连通性。' },
          { id: 'c', label: '业务变慢但不断', explanation: '观察口故障不会改变业务转发路径。' },
        ],
        explanation: '端口镜像属于旁路复制，观察口故障不影响业务转发。',
      },
      {
        id: 'obs-open-three-breaks',
        kind: 'open',
        prompt: '业务通但监控平台没有日志，列出三个可能的断点及各自的验证方法。',
        hint: '从镜像源、观察口、采集器、SIEM 四个环节想。',
        explanation: '可能断点包括镜像源选错、观察口或链路故障、采集器过滤或缓冲问题、SIEM 入库失败。验证方法是逐段对比源口计数、观察口计数、采集器收包与 SIEM 索引。',
      },
    ],
    summary: [
      '业务转发路径与镜像副本路径相互独立。',
      '镜像配置要核对源接口、观察口与方向。',
      '采集器与 SIEM 都可能让已到达的流量不可见。',
      '旁路观测故障不影响业务，但会形成监控盲区。',
    ],
    misconceptions: [
      { wrong: '业务正常就说明镜像配置正确。', right: '镜像路径独立，业务正常时镜像仍可能完全没产生副本。' },
      { wrong: '观察口 Down 会中断业务。', right: '端口镜像不参与转发，观察口故障只影响观测。' },
      { wrong: '采集器收到包就一定能在 SIEM 看到。', right: '采集器过滤、缓冲与 SIEM 入库都可能丢失数据。' },
    ],
    sources: [
      { title: 'RFC 7011 Specification of the IP Flow Information Export Protocol', url: 'https://www.rfc-editor.org/rfc/rfc7011', note: '流观测与导出模型。' },
      { title: 'RFC 5424 The Syslog Protocol', url: 'https://www.rfc-editor.org/rfc/rfc5424', note: '日志采集与传输格式。' },
      { title: 'NIST SP 800-92 Guide to Computer Security Log Management', url: 'https://csrc.nist.gov/publications/detail/sp/800-92/final', note: '日志管理与关联实践。' },
      { title: '华为企业技术支持', url: 'https://info.support.huawei.com/', note: '交换机端口镜像配置入口。' },
    ],
    publicationStatus: 'published',
  },
  {
    id: 'l5-data-continuity',
    title: '跨域交换与灾备：回执、数据新鲜度和 RPO',
    question: '接口返回成功，数据为什么还是旧的？',
    level: 'L5',
    minutes: 55,
    goals: [
      '区分跨域任务受理、数据落库与复制完成三个阶段。',
      '解释摘要校验在完整性判断中的作用。',
      '说明 RPO 与 RTO 的差别以及复制延迟的影响。',
      '用校验值与复制位点证明主备数据是否一致。',
    ],
    prerequisites: ['l4-mpls-vpn'],
    topicIds: ['cross-domain', 'disaster-recovery', 'replication', 'integrity'],
    topologyId: 'topo-l5-data',
    steps: [
      {
        id: 'data-step-src',
        title: '源域应用与网关',
        plainText: '源域应用产生数据后，先交给源侧网关。网关负责打包、计算摘要并提交交换任务。',
        professionalText: '源侧网关把待交换数据封装为任务，附加摘要与元数据。提交成功只代表任务被受理，不代表目标已写入。',
        focusNodeIds: ['src-app', 'src-gw'],
        focusEdgeIds: ['data-app-srcgw'],
        evidenceText: '在源侧网关查看任务编号、摘要值与提交时间。',
        directionHints: ['先看任务是否生成', '再看摘要是否计算'],
      },
      {
        id: 'data-step-gate',
        title: '受控交换与闸门',
        plainText: '跨域网关按策略检查任务，决定是否允许通过。单向交换只允许数据从源域流向目标域。',
        professionalText: '跨域交换通常包含内容检查、格式校验与审批。闸门是策略执行点，可能因格式或策略拒绝任务。',
        focusNodeIds: ['src-gw', 'gate', 'dst-gw'],
        focusEdgeIds: ['data-srcgw-gate', 'data-gate-dstgw'],
        evidenceText: '在闸门日志中确认任务通过或拒绝，以及拒绝原因。',
        directionHints: ['看审批状态', '看方向是否被允许'],
      },
      {
        id: 'data-step-stage',
        title: '暂存区不是数据库',
        plainText: '数据通过闸门后先落到目标域暂存区。暂存成功只说明文件到了，不代表已经写入业务数据库。',
        professionalText: '暂存区用于隔离交换与入库两个阶段，便于重试与校验。入库程序从暂存区读取、校验摘要后再提交数据库。',
        focusNodeIds: ['dst-gw', 'stage'],
        focusEdgeIds: ['data-dstgw-stage'],
        evidenceText: '对比暂存区文件数量与摘要值，确认文件完整到达。',
        directionHints: ['先看文件是否到达', '再看摘要是否一致'],
      },
      {
        id: 'data-step-commit',
        title: '数据库提交',
        plainText: '入库程序把暂存数据写入主库。提交成功后，主库才拥有新数据。',
        professionalText: '入库包含解析、事务提交与错误回滚。部分失败可能留下不完整数据，需要幂等与重试机制。',
        focusNodeIds: ['stage', 'db-primary'],
        focusEdgeIds: ['data-stage-db'],
        evidenceText: '在主库查询本次任务对应的记录与提交时间，确认事务已提交。',
        directionHints: ['看记录是否存在', '看事务是否提交'],
      },
      {
        id: 'data-step-repl',
        title: '复制延迟与新鲜度',
        plainText: '主库写入后还要复制到备库。复制有延迟，读备库时可能读到旧数据。',
        professionalText: '异步复制下，备库落后主库一段时间。RPO 描述可容忍的数据丢失量，复制延迟直接影响实际 RPO。',
        focusNodeIds: ['db-primary', 'db-standby'],
        focusEdgeIds: ['data-db-repl'],
        evidenceText: '在主库查看当前位点，在备库查看已应用位点，计算两者差距。',
        directionHints: ['先看主库位点', '再看备库位点'],
      },
      {
        id: 'data-step-receipt',
        title: '回执不等于落库',
        plainText: '接口返回 202 只表示任务已受理。要确认数据可用，必须继续核对落库与复制两个阶段。',
        professionalText: '202 Accepted 是受理语义，不是完成语义。完整证据链应包含任务受理、闸门通过、暂存校验、数据库提交与复制位点。',
        focusNodeIds: ['src-app', 'stage', 'db-primary', 'db-standby'],
        focusEdgeIds: ['data-app-srcgw', 'data-stage-db', 'data-db-repl'],
        evidenceText: '按任务编号串联五段证据，确认每一段都有明确结论。',
        directionHints: ['受理只是第一步', '落库与复制要分别确认'],
      },
    ],
    why: [
      {
        heading: '成功回执的含义',
        paragraphs: [
          '接口返回成功往往只表示请求被接收并进入处理队列。真正写入数据库可能发生在几秒甚至几分钟后。',
          '把受理当成完成，会让查询方在数据尚未落库时读到旧值。',
        ],
        bullets: ['202 表示受理', '落库是独立阶段', '复制又是下一阶段'],
      },
      {
        heading: 'RPO 与 RTO 不是一回事',
        paragraphs: [
          'RPO 描述灾难发生时最多丢失多少数据，RTO 描述业务恢复需要多长时间。',
          '复制延迟越大，实际可达到的 RPO 越差。灾备演练要同时测量两者。',
        ],
      },
    ],
    theory: [
      {
        heading: '跨域交换的三个阶段',
        paragraphs: [
          '第一阶段是任务受理与打包，第二阶段是闸门检查与传输，第三阶段是暂存、校验与入库。',
          '每个阶段都应有独立的状态与证据，不能用一个成功标志概括。',
        ],
        bullets: ['受理', '交换', '入库'],
      },
      {
        heading: '摘要与完整性',
        paragraphs: [
          '摘要把任意长度内容映射为固定长度值，内容改变则摘要改变。',
          '摘要用于发现传输损坏或篡改，但不能证明来源身份，身份需要签名。',
        ],
      },
      {
        heading: '复制与 RPO',
        paragraphs: [
          '异步复制下备库落后主库，落后时间决定可能丢失的数据量。',
          '同步复制可以降低 RPO，但会增加主库写入延迟。',
        ],
        bullets: ['异步复制有延迟', '同步复制增加写入开销', 'RPO 由复制方式决定'],
      },
    ],
    proTheory: [
      {
        heading: '幂等与重试',
        paragraphs: [
          '跨域任务可能因超时重试，入库必须按任务编号做幂等处理，避免重复写入。',
          '幂等键应来自源侧任务标识，而不是随机生成。',
        ],
      },
      {
        heading: '复制位点与一致性证明',
        paragraphs: [
          '主库的日志位点与备库已应用位点可以直接比较，位点一致说明备库已追上。',
          '仅比较行数不足以保证一致，还要比较校验值或关键字段。',
        ],
        bullets: ['位点比较', '校验值比较', '行数只是粗判'],
      },
      {
        heading: '回执语义与状态机',
        paragraphs: [
          '任务状态机应区分受理、传输中、已暂存、已入库、已复制。',
          '对外只返回“成功”会掩盖中间失败，应按阶段暴露状态。',
        ],
      },
    ],
    lab: {
      platform: 'Linux 隔离虚拟机',
      devices: ['Linux 虚拟机 src-gw-01，模拟源域网关', 'Linux 虚拟机 dst-gw-01，模拟目标域网关', '两台虚拟机之间的隔离虚拟网络', '本地文件与校验工具'],
      versions: '以合法取得且受支持的镜像版本为准',
      requirements: [
        '两台虚拟机位于隔离网络，仅传输合成测试文件。',
        '使用 sha256sum 校验文件完整性，使用 rsync 模拟受控传输。',
        '该实验替代跨域闸门，仅演示暂存、校验与复制延迟，不对应任何真实交换设备。',
      ],
      addressing: [
        '源域 192.0.2.0/24，src-gw-01 使用 192.0.2.10。',
        '目标域 198.51.100.0/24，dst-gw-01 使用 198.51.100.10。',
        '管理侧 203.0.113.0/24，管理终端使用 203.0.113.20。',
      ],
      tasks: [
        {
          title: '生成并校验源文件',
          steps: [
            '在源域生成一个合成数据文件。',
            '计算文件的 SHA-256 摘要并记录。',
            '把文件放入待发送目录。',
            '确认源侧摘要与文件大小。',
          ],
          observe: '记录源文件摘要，作为后续完整性比对基线。',
        },
        {
          title: '传输到暂存区',
          steps: [
            '使用 rsync 把文件传到目标域暂存目录。',
            '在目标域重新计算摘要。',
            '对比源侧与目标侧摘要。',
            '确认文件已完整到达暂存区。',
          ],
          observe: '确认暂存成功不等于数据库已更新。',
        },
        {
          title: '模拟入库与复制延迟',
          steps: [
            '把暂存文件导入模拟数据库表。',
            '在模拟主库记录当前位点。',
            '延迟一段时间后再更新模拟备库。',
            '对比主备位点与记录内容。',
          ],
          observe: '记录主备位点差距，理解复制延迟如何影响数据新鲜度。',
        },
      ],
      commands: [
        {
          title: '摘要计算与校验',
          language: 'bash',
          code: `sha256sum payload.bin
sha256sum payload.bin > payload.sha256
sha256sum -c payload.sha256`,
        },
        {
          title: '受控传输与暂存',
          language: 'bash',
          code: `rsync -av --checksum payload.bin dst-gw-01:/srv/stage/
ssh dst-gw-01 'sha256sum /srv/stage/payload.bin'`,
        },
        {
          title: '复制延迟观察示例',
          language: 'bash',
          code: `psql -h 198.51.100.10 -U app -c "SELECT now() - pg_last_xact_replay_timestamp() AS lag;"
psql -h 198.51.100.10 -U app -c "SELECT count(*) FROM demo_task;"`,
        },
        {
          title: '任务回执示例',
          language: 'json',
          code: `{
  "task_id": "demo-0001",
  "accepted": true,
  "staged": true,
  "stored": false,
  "sha256": "示例摘要值",
  "note": "受理与落库为不同阶段"
}`,
        },
      ],
      verification: [
        '源文件与暂存文件的 SHA-256 摘要一致。',
        '暂存完成后模拟数据库尚未出现新记录。',
        '入库后主库可查询到任务编号对应记录。',
        '备库位点落后主库时，查询备库得到旧数据。',
      ],
      expected: [
        '摘要一致但数据库未更新时，数据仍不可用。',
        '复制延迟期间读取备库会得到旧值。',
        '文件被篡改一个字节后摘要立即变化。',
      ],
      faults: [
        '修改暂存文件一个字节，重新校验摘要。',
        '暂停模拟复制，观察备库位点停止前进。',
      ],
      recovery: [
        '重新传输正确文件后，确认摘要恢复一致并可入库。',
        '恢复复制后等待备库位点追上主库，再验证查询结果。',
      ],
      status: 'guide-only',
      statusNote: '依据公开标准与厂商文档编写，尚未在指定平台实机执行。',
      sources: [
        { title: 'RFC 7231 HTTP/1.1 Semantics and Content', url: 'https://www.rfc-editor.org/rfc/rfc7231' },
        { title: 'NIST SP 800-34 Contingency Planning Guide for Federal Information Systems', url: 'https://csrc.nist.gov/publications/detail/sp/800-34/rev-1/final' },
        { title: '国家标准全文公开系统', url: 'https://openstd.samr.gov.cn/bzgk/gb/index' },
        { title: 'EVE-NG How-To 文档', url: 'https://www.eve-ng.net/index.php/documentation/howtos/' },
      ],
    },
    challenges: [
      {
        id: 'data-choice-202',
        kind: 'choice',
        prompt: '接口返回 202 Accepted，说明什么？',
        hint: '202 是完成还是受理？',
        options: [
          { id: 'a', label: '数据已经写入主库', explanation: '202 不保证落库，只表示请求被受理。' },
          { id: 'b', label: '请求已被受理，处理可能尚未完成', correct: true, explanation: '受理语义与完成语义不同，落库与复制需要另行确认。' },
          { id: 'c', label: '数据已经复制到备库', explanation: '复制发生在落库之后，202 不覆盖该阶段。' },
        ],
        explanation: '202 表示受理，不表示处理完成，更不表示备库已同步。',
      },
      {
        id: 'data-open-consistency',
        kind: 'open',
        prompt: '如何证明主备数据一致？给出至少两种证据并说明局限。',
        hint: '位点、摘要、行数分别能说明什么？',
        explanation: '可以比较主备复制位点，直接说明备库是否追上；也可以比较关键表的校验值或摘要。行数一致只是粗判，无法发现内容差异。位点一致也不能替代业务层校验。',
      },
    ],
    summary: [
      '跨域任务分为受理、交换、暂存、入库、复制多个阶段。',
      '202 回执只表示受理，不代表落库。',
      '摘要用于完整性校验，不用于身份认证。',
      'RPO 与 RTO 分别描述数据丢失容忍度与恢复时间。',
    ],
    misconceptions: [
      { wrong: '接口返回成功就说明数据已落库。', right: '成功可能只是受理，落库与复制是后续阶段。' },
      { wrong: '摘要一致就说明数据可信。', right: '摘要只能发现内容变化，来源身份需要签名验证。' },
      { wrong: '主备行数一致就说明数据完全一致。', right: '行数一致无法发现字段内容差异，需要校验值或位点比较。' },
    ],
    sources: [
      { title: 'RFC 7231 HTTP/1.1 Semantics and Content', url: 'https://www.rfc-editor.org/rfc/rfc7231', note: '202 Accepted 的受理语义。' },
      { title: 'HTTP 状态码 202 Accepted', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/202', note: '202 的通俗说明。' },
      { title: 'NIST SP 800-34 Contingency Planning Guide for Federal Information Systems', url: 'https://csrc.nist.gov/publications/detail/sp/800-34/rev-1/final', note: '灾备与恢复目标概念。' },
      { title: '国家标准全文公开系统', url: 'https://openstd.samr.gov.cn/bzgk/gb/index', note: '灾难恢复相关国家标准检索入口。' },
    ],
    publicationStatus: 'published',
  },
  {
    id: 'l5-signature',
    title: '证书、签名与验签：内容没变，为什么验签失败',
    question: '文件能下载、TLS 也正常，为什么签名校验仍失败？',
    level: 'L5',
    minutes: 50,
    goals: [
      '区分摘要、签名、证书与信任锚四个概念。',
      '说明证书链校验中有效期、用途与主体的作用。',
      '用 OpenSSL 完成签名、篡改与验签的完整流程。',
      '判断验签失败应优先检查哪一类条件。',
    ],
    prerequisites: ['l5-zero-trust'],
    topicIds: ['pki', 'digital-signature', 'openssl', 'tls'],
    topologyId: 'topo-l5-signature',
    steps: [
      {
        id: 'sig-step-digest',
        title: '摘要先压缩内容',
        plainText: '签名并不直接对整份文件加密，而是先对文件计算摘要，再对摘要做签名。内容变一个字节，摘要就会变。',
        professionalText: '摘要算法把任意长度输入映射为固定长度输出，具备抗碰撞特性。签名操作作用于摘要，而不是原始内容。',
        focusNodeIds: ['signer', 'doc-store'],
        focusEdgeIds: ['sig-signer-store'],
        evidenceText: '对同一文件计算摘要，修改一个字节后再次计算，比较两次结果。',
        directionHints: ['先算原文摘要', '再算篡改后摘要'],
      },
      {
        id: 'sig-step-sign',
        title: '签名使用私钥',
        plainText: '签名者用私钥对摘要签名，任何人用对应公钥都能验证。私钥只留在签名者一侧。',
        professionalText: '非对称签名中，私钥用于生成签名，公钥用于验证。签名值绑定摘要与私钥，内容改变后原签名不再匹配。',
        focusNodeIds: ['signer', 'hsm'],
        focusEdgeIds: ['sig-signer-hsm'],
        evidenceText: '确认签名操作使用的是签名者私钥，且私钥未离开受控环境。',
        directionHints: ['看私钥来源', '看签名算法'],
      },
      {
        id: 'sig-step-chain',
        title: '证书链与信任锚',
        plainText: '验证者不只知道公钥，还要确认这个公钥属于谁。证书链从签名者证书一路验证到受信任的根。',
        professionalText: '证书链校验包括签名验证、有效期、基本用途与主体名称。信任锚是验证者预先信任的根证书。',
        focusNodeIds: ['verifier', 'ca', 'ra'],
        focusEdgeIds: ['sig-verifier-ca', 'sig-ra-ca'],
        evidenceText: '在验证者上构建证书链，确认每一级签名与有效期都可验证。',
        directionHints: ['从叶子到根', '逐级校验签名'],
      },
      {
        id: 'sig-step-roles',
        title: 'RA、CA 与 HSM 的职责',
        plainText: 'RA 负责受理与身份核验，CA 负责签发证书，HSM 负责保护密钥。三者分工让签发流程可审计。',
        professionalText: 'RA 收集申请并核验身份，CA 根据策略签发证书，HSM 在受控边界内执行密钥操作。职责分离降低单点失守风险。',
        focusNodeIds: ['ra', 'ca', 'hsm'],
        focusEdgeIds: ['sig-signer-ra', 'sig-ra-ca', 'sig-ca-hsm'],
        evidenceText: '查看签发记录中的申请、核验与签发三个环节是否可追溯。',
        directionHints: ['先看申请', '再看核验', '最后看签发'],
      },
      {
        id: 'sig-step-verify',
        title: '验签失败先查什么',
        plainText: '验签失败可能来自内容变化、签名值错误、公钥不匹配，也可能来自证书过期或用途不符。先确认内容摘要，再检查证书条件，并分清签名命令与证书校验命令。',
        professionalText: 'openssl dgst -sha256 -verify 只重算摘要并验证签名数学关系，不检查证书有效期、用途或证书链。证书有效期、用途与链要另用 openssl verify 或 openssl x509 -purpose 检查。两类检查都通过，才能说明内容来源可信且证书当时可用。',
        focusNodeIds: ['verifier', 'doc-store', 'ca'],
        focusEdgeIds: ['sig-verifier-store', 'sig-verifier-ca'],
        evidenceText: '分别运行 dgst 验签与 openssl verify、openssl x509 -purpose，记录签名数学结果与证书条件，定位第一处失败。',
        directionHints: ['先内容后签名', '再单独校验证书链', 'dgst 不查有效期'],
      },
      {
        id: 'sig-step-boundary',
        title: '传输成功不等于内容可信',
        plainText: 'TLS 保护的是传输通道，签名保护的是内容来源与完整性。文件能下载、TLS 正常，都不能替代业务签名校验。',
        professionalText: 'TLS 证书用于证明服务端身份并加密通道，业务签名用于证明文件由谁签发且未被修改。两者证书、密钥与用途都不同。',
        focusNodeIds: ['signer', 'verifier', 'doc-store'],
        focusEdgeIds: ['sig-signer-store', 'sig-verifier-store'],
        evidenceText: '对比 TLS 证书主体与业务签名证书主体，确认二者不是同一套信任关系。',
        directionHints: ['先分清 TLS 证书', '再分清业务签名证书'],
      },
    ],
    why: [
      {
        heading: '为什么 TLS 正常仍验签失败',
        paragraphs: [
          'TLS 只保证你与服务器之间的通道是加密且服务端身份可信的。它不保证服务器上的文件没有被替换。',
          '业务签名校验的是文件本身与签发者，和传输通道是两套独立机制。',
        ],
        bullets: ['TLS 保护通道', '签名保护内容', '两者证书不同'],
      },
      {
        heading: '验签失败不是单一原因',
        paragraphs: [
          '内容被修改、签名值与文件不匹配、公钥不属于该签名者，会让 openssl dgst 验签失败；证书过期或用途不符则由 openssl verify 或 openssl x509 -purpose 报出。',
          'dgst 只验证签名数学关系，不读取证书有效期或证书链。Verified OK 只代表签名与内容、公钥匹配，不代表证书仍在有效期或用途正确。',
        ],
      },
    ],
    theory: [
      {
        heading: '摘要与签名',
        paragraphs: [
          '摘要把内容压缩为固定长度值，签名用私钥对摘要运算。',
          '验证者用公钥验证签名，并自行重算摘要，两者都匹配才算通过。',
          'openssl dgst -sha256 -verify 只完成这一步，不检查证书有效期、用途与链。',
        ],
        bullets: ['摘要抗碰撞', '私钥签名', '公钥验证', 'dgst 不校验证书有效期'],
      },
      {
        heading: '证书与信任锚',
        paragraphs: [
          '证书把公钥与主体绑定，并由上级 CA 签名。验证者沿证书链向上直到信任锚。',
          '链上任一级过期、用途不符或签名无效，整条链都不能通过。',
        ],
        bullets: ['主体与公钥绑定', '逐级签名', '信任锚预先配置'],
      },
      {
        heading: '签名与加密的区别',
        paragraphs: [
          '签名使用私钥生成、公钥验证，目的是来源认证与完整性。加密使用公钥加密、私钥解密，目的是保密性。',
          '同一套密钥可以参与两种操作，但目的与验证方式不同。',
        ],
        bullets: ['签名不提供保密性', '加密不证明来源', '用途字段要区分'],
      },
    ],
    proTheory: [
      {
        heading: '证书用途与扩展',
        paragraphs: [
          '证书的基本用途约束它可以用于签名还是加密。用途不符时，即使签名数学上正确也应拒绝。',
          '扩展密钥用途进一步限定场景，例如仅用于 TLS 服务端认证。',
          'openssl dgst 不读取证书用途；要确认用途，使用 openssl x509 -in signer.crt -noout -purpose 或让 openssl verify 按用途校验。',
        ],
      },
      {
        heading: '密钥保护与 HSM',
        paragraphs: [
          '签名私钥泄露等同于身份被冒用。HSM 在受控边界内执行签名，私钥不以明文导出。',
          '密钥生命周期包括生成、使用、轮换与销毁，每一步都要有审计。',
        ],
        bullets: ['私钥不出边界', '操作留痕', '定期轮换'],
      },
      {
        heading: '时间与吊销',
        paragraphs: [
          '证书有效期之外不能使用。吊销状态还需要通过 CRL 或 OCSP 检查。',
          '只检查有效期不检查吊销，会接受已被撤销的证书。',
        ],
      },
    ],
    lab: {
      platform: 'Linux 隔离虚拟机',
      devices: ['Linux 隔离主机，运行 OpenSSL 3.0.13', 'signer 与 verifier 角色用同一主机上的临时目录模拟', '运行结束自动清理临时合成文件与密钥'],
      versions: 'OpenSSL 3.0.13',
      requirements: [
        '使用 OpenSSL 3.0.13，签名算法为 RSA-2048 与 SHA-256。',
        '所有密钥与证书仅用于隔离实验，运行结束即丢弃，不写入任何真实私钥。',
        '文件为合成文本，不包含任何真实数据。',
        '签名验证与证书链检查分开执行，不把 dgst 的结果当作有效期结论。',
      ],
      addressing: [
        '脚本全部在本机临时目录完成，不需要网络地址。',
        '若扩展为双机演示，可用 192.0.2.0/24 与 198.51.100.0/24 作为 RFC 5737 文档示例网段。',
      ],
      tasks: [
        {
          title: '生成密钥与自签名证书',
          steps: [
            '在隔离主机临时目录生成 RSA-2048 私钥。',
            '生成自签名证书并设置主体名称与 365 天有效期。',
            '导出证书中的公钥为 signer.pub。',
            '记录证书主体与有效期。',
          ],
          observe: '确认私钥只留在临时目录，验签只使用 signer.pub。',
        },
        {
          title: '签名与验签',
          steps: [
            '对合成文件计算 SHA-256 摘要并生成签名。',
            '使用 signer.pub 对原文验签。',
            '确认输出 Verified OK。',
            '用 sha256sum 记录原文与篡改文件摘要。',
          ],
          observe: '确认签名文件与原文、公钥三者匹配时验签通过。',
        },
        {
          title: '篡改、错误公钥与证书有效期',
          steps: [
            '复制一份文件并追加一个字节。',
            '用原签名对新文件验签，记录 bad signature。',
            '用另一对 RSA-2048 密钥的公钥验签，记录 invalid padding 或 data too large for modulus。',
            '运行 openssl verify -CAfile signer.crt signer.crt，记录 signer.crt: OK。',
            '用 -attime 模拟当前时间加 370 天，记录 certificate has expired。',
          ],
          observe: '区分 dgst 的签名数学验证与 openssl verify 的证书链、有效期校验。',
        },
      ],
      commands: [
        {
          title: '生成密钥、证书与签名',
          language: 'bash',
          code: `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out signer.key
openssl req -new -x509 -key signer.key -sha256 -days 365 -subj "/CN=Demo Signer/O=Example Lab" -out signer.crt
openssl dgst -sha256 -sign signer.key -out payload.sig payload.bin`,
        },
        {
          title: '验签与篡改验证',
          language: 'bash',
          code: `openssl dgst -sha256 -verify <(openssl x509 -in signer.crt -pubkey -noout) -signature payload.sig payload.bin
cp payload.bin payload-tampered.bin
printf 'x' >> payload-tampered.bin
openssl dgst -sha256 -verify <(openssl x509 -in signer.crt -pubkey -noout) -signature payload.sig payload-tampered.bin`,
        },
        {
          title: '查看证书信息',
          language: 'bash',
          code: `openssl x509 -in signer.crt -noout -subject -issuer -dates
openssl x509 -in signer.crt -noout -text | grep -A1 "Key Usage"`,
        },
        {
          title: '当前证书校验与用途查看',
          language: 'bash',
          code: `openssl verify -CAfile signer.crt signer.crt
openssl x509 -in signer.crt -noout -purpose`,
        },
        {
          title: '模拟 +370 天后的证书过期检查',
          language: 'bash',
          code: `openssl verify -CAfile signer.crt -attime $(( $(date +%s) + 370 * 86400 )) signer.crt`,
        },
      ],
      verification: [
        '原文与签名文件匹配时，openssl dgst -sha256 -verify 输出 Verified OK。',
        '修改文件一个字节后，dgst 输出 Verification failure 与 bad signature。',
        '使用另一对密钥的公钥时，dgst 输出 Verification failure 与 invalid padding（或 data too large for modulus）。',
        'openssl verify -CAfile signer.crt signer.crt 输出 signer.crt: OK。',
        'openssl verify -CAfile signer.crt -attime <当前时间+370天> signer.crt 输出 error 10 at 0 depth lookup: certificate has expired。',
        'dgst 的 Verified OK 不包含有效期、用途或链结论，必须由 openssl verify 与 openssl x509 -purpose 单独给出。',
      ],
      expected: [
        '内容变化会导致摘要变化，原签名不再匹配，dgst 输出 Verification failure。',
        '公钥不匹配时验签失败，与内容是否完整无关。',
        '签名数学正确不代表证书有效：dgst 不检查有效期，openssl verify -attime 才会报告 certificate has expired。',
        '证书链检查通过只说明当前时间下有效期与链成立，用途仍需 openssl x509 -purpose 或按用途调用 openssl verify 确认。',
      ],
      faults: [
        '替换为另一对密钥生成的公钥，观察 dgst 报 invalid padding 或 data too large for modulus。',
        '误以为 dgst 会检查证书过期：dgst 仍可能输出 Verified OK，过期只能由 openssl verify -attime 发现。',
        '使用用途不符的证书时，dgst 不会报错，需用 openssl x509 -purpose 或按用途调用 openssl verify。',
      ],
      recovery: [
        '恢复原文与正确公钥后，dgst 验签重新输出 Verified OK。',
        '签名验证通过后，仍需单独运行 openssl verify 检查有效期与链，并用 openssl x509 -purpose 检查用途。',
      ],
      status: 'verified',
      checkedAt: '2026-11-28',
      statusNote: '已在 Linux 隔离环境用 OpenSSL 3.0.13 执行，原文验签成功、篡改和错误公钥失败、+370 天证书链检查显示过期；未在 eNSP/EVE-NG 执行。',
      sources: [
        { title: 'RFC 8017 PKCS #1 RSA Cryptography Specifications Version 2.2', url: 'https://www.rfc-editor.org/rfc/rfc8017' },
        { title: 'RFC 5280 Internet X.509 Public Key Infrastructure Certificate and CRL Profile', url: 'https://www.rfc-editor.org/rfc/rfc5280' },
        { title: 'OpenSSL dgst 手册', url: 'https://openssl.org/docs/man3.1/man1/openssl-dgst.html' },
        { title: '国家标准全文公开系统', url: 'https://openstd.samr.gov.cn/bzgk/gb/index' },
      ],
    },
    challenges: [
      {
        id: 'sig-choice-first',
        kind: 'choice',
        prompt: '验签失败时，最先应该核对哪一项？',
        hint: '签名是对什么做的运算？',
        options: [
          { id: 'a', label: '文件内容是否与签名时一致', correct: true, explanation: '签名绑定摘要，内容变化是最直接的原因。' },
          { id: 'b', label: '服务器磁盘型号', explanation: '磁盘型号与签名校验无关。' },
          { id: 'c', label: 'TLS 会话是否复用', explanation: 'TLS 会话复用不影响业务签名。' },
        ],
        explanation: '先确认内容与签名是否对应，再检查公钥、证书链与用途。',
      },
      {
        id: 'sig-open-tls-vs-signature',
        kind: 'open',
        prompt: 'TLS 证书与业务签名证书是不是同一件事？说明它们在信任关系中的作用。',
        hint: '一个保护通道，一个保护内容。',
        explanation: '不是同一件事。TLS 证书证明服务端身份并参与通道加密，业务签名证书证明文件签发者与完整性。两者证书、密钥、用途与信任链都独立。',
      },
    ],
    summary: [
      '签名作用于摘要，内容变化会直接导致验签失败。',
      'openssl dgst 只验证签名数学关系，证书有效期、用途与链需用 openssl verify 或 openssl x509 -purpose 单独校验。',
      '证书链校验包括签名、有效期、用途与主体。',
      '私钥用于签名，公钥用于验证，私钥应受 HSM 保护。',
      'TLS 保护传输通道，签名保护内容来源与完整性。',
    ],
    misconceptions: [
      { wrong: 'TLS 正常就说明文件可信。', right: 'TLS 只保护通道，文件本身仍需业务签名校验。' },
      { wrong: '签名正确就说明证书一定有效。', right: '证书还要校验有效期、用途、主体与吊销状态。' },
      { wrong: 'dgst 验签通过就说明证书未过期且用途正确。', right: 'dgst 只验证签名数学关系，有效期、用途与链要用 openssl verify 或 openssl x509 -purpose 单独检查。' },
      { wrong: '签名和加密是同一件事。', right: '签名证明来源与完整性，加密提供保密性，目的不同。' },
    ],
    sources: [
      { title: 'RFC 8017 PKCS #1 RSA Cryptography Specifications Version 2.2', url: 'https://www.rfc-editor.org/rfc/rfc8017', note: 'RSA 签名与填充方案。' },
      { title: 'RFC 5280 Internet X.509 Public Key Infrastructure Certificate and CRL Profile', url: 'https://www.rfc-editor.org/rfc/rfc5280', note: '证书链、有效期与用途。' },
      { title: 'RFC 5652 Cryptographic Message Syntax', url: 'https://www.rfc-editor.org/rfc/rfc5652', note: '签名内容封装标准。' },
      { title: 'OpenSSL dgst 手册', url: 'https://openssl.org/docs/man3.1/man1/openssl-dgst.html', note: '摘要与签名命令参考。' },
      { title: 'OpenSSL x509 手册', url: 'https://openssl.org/docs/man3.1/man1/openssl-x509.html', note: '证书查看与校验。' },
    ],
    publicationStatus: 'published',
  },
]