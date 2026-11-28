import type { Course } from '../../domain/types'

const docSources = {
  rfc792: {
    title: 'RFC 792: Internet Control Message Protocol',
    url: 'https://www.rfc-editor.org/rfc/rfc792',
    note: '用于核对 ICMP 回显与超时报文的基本语义',
  },
  rfc826: {
    title: 'RFC 826: An Ethernet Address Resolution Protocol',
    url: 'https://www.rfc-editor.org/rfc/rfc826',
    note: '用于核对 ARP 请求与应答的链路层行为',
  },
  rfc791: {
    title: 'RFC 791: Internet Protocol',
    url: 'https://www.rfc-editor.org/rfc/rfc791',
    note: '用于核对 IPv4 地址、TTL 与分片等首部语义',
  },
  rfc1812: {
    title: 'RFC 1812: Requirements for IP Version 4 Routers',
    url: 'https://www.rfc-editor.org/rfc/rfc1812',
    note: '用于核对路由器转发与最长前缀匹配的要求',
  },
  rfc1122: {
    title: 'RFC 1122: Requirements for Internet Hosts -- Communication Layers',
    url: 'https://www.rfc-editor.org/rfc/rfc1122',
    note: '用于核对主机默认网关与网络层行为',
  },
  rfc2328: {
    title: 'RFC 2328: OSPF Version 2',
    url: 'https://www.rfc-editor.org/rfc/rfc2328',
    note: '用于核对 OSPF 邻居、LSA、LSDB 与 SPF 的定义',
  },
  huawei: {
    title: '华为企业业务技术支持文档',
    url: 'https://info.support.huawei.com/',
    note: '用于核对 VRP 配置语法与 display 命令的版本差异',
  },
  rfc5737: {
    title: 'RFC 5737: IPv4 Address Blocks Reserved for Documentation',
    url: 'https://www.rfc-editor.org/rfc/rfc5737',
    note: '本课程所有 IPv4 地址均取自文档保留段',
  },
  rfc3849: {
    title: 'RFC 3849: IPv6 Address Prefix Reserved for Documentation',
    url: 'https://www.rfc-editor.org/rfc/rfc3849',
    note: '本课程所有 IPv6 地址均取自文档保留前缀',
  },
  nist80041: {
    title: 'NIST SP 800-41 Rev.1: Guidelines on Firewalls and Firewall Policy',
    url: 'https://csrc.nist.gov/pubs/sp/800/41/r1/final',
    note: '用于核对边界安全域与旁路观测的通用原则',
  },
  nist800115: {
    title: 'NIST SP 800-115: Technical Guide to Information Security Testing and Assessment',
    url: 'https://csrc.nist.gov/pubs/sp/800/115/final',
    note: '用于核对分层取证与观察点选择的方法',
  },
  gb22239: {
    title: 'GB/T 22239-2019 信息安全技术 网络安全等级保护基本要求',
    url: 'https://openstd.samr.gov.cn/',
    note: '可在标准公开平台按标准号检索',
  },
}

const statusNote = '依据公开标准与厂商文档编写，尚未在指定平台实机执行'

export const foundationCourses: Course[] = [
  {
    id: 'l1-ping-path',
    title: '一次 Ping 的完整旅程',
    question: '为什么链路都 Up，Ping 仍可能失败？',
    level: 'L1',
    minutes: 35,
    goals: [
      '用掩码和网络地址判断源与目的是否在同一网段，并说明下一步是直接 ARP 目标还是交给网关。',
      '按顺序描述跨网段 Ping 中 ARP、交换机 MAC 学习、路由器选路与回程的关系。',
      '在终端、交换机和路由器上分层收集证据，把链路问题与转发问题分开。',
      '理解链路 Up 只说明二层就绪，端到端可达还需要地址、ARP、路由和回程同时成立。',
    ],
    prerequisites: [],
    topicIds: ['ip-addressing', 'arp', 'icmp', 'forwarding-path'],
    topologyId: 'topo-l1-ping',
    steps: [
      {
        id: 'l1-ping-path-s1',
        title: '先判断同网段还是跨网段',
        plainText:
          '源终端先用自己的掩码算出目标属于哪个网段，再和本机网段比较。同一网段就直接找目标，跨网段就把包交给默认网关。示意图只画判断结果，不表示已经发出真实报文。',
        professionalText:
          '主机把目的地址与自身掩码相与得到目的网络，再与本地网络地址比较，比较的是网络前缀而不是主机位。结果不同时查默认网关，结果相同才在本广播域内解析目的 MAC。',
        focusNodeIds: ['pc-a'],
        focusEdgeIds: ['edge-pc-sw'],
        evidenceText:
          '在真实实验里看源主机的地址、掩码与默认网关条目，确认网关地址落在本网段且确实存在。',
        directionHints: ['从源终端出发', '先做网段判断'],
      },
      {
        id: 'l1-ping-path-s2',
        title: 'AR 找的是网关，不是远端主机',
        plainText:
          '跨网段时，源端需要知道网关的 MAC，才能在本地链路把帧交给网关。它并不会在本地广播里直接寻找远端主机。',
        professionalText:
          'ARP 请求以广播目的 MAC 发出，询问网关 IP 对应的链路层地址，网关以单播应答，源端把结果写入 ARP 缓存。ARP 没有应答时表现为请求超时，但接口仍可能是 Up。',
        focusNodeIds: ['pc-a', 'r-edge'],
        focusEdgeIds: ['edge-pc-sw', 'edge-sw-router'],
        evidenceText:
          '在真实实验里看源端 ARP 表是否出现网关映射，并确认交换机上广播帧只在本地广播域内出现。',
        directionHints: ['请求先广播', '应答单播返回'],
      },
      {
        id: 'l1-ping-path-s3',
        title: '交换机只按 MAC 学习和转发',
        plainText:
          '接入交换机记录帧的源 MAC 和进入端口，再按目的 MAC 查表转发。查不到目的端口时就泛洪。它不读 IP，也不改 IP。',
        professionalText:
          '交换机维护 MAC 地址表，源 MAC 学习与目的 MAC 查表相互独立。未知单播和广播在同一 VLAN 内泛洪，转发过程不改写 IP 首部，TTL 保持不变。',
        focusNodeIds: ['sw-access', 'sw-core'],
        focusEdgeIds: ['edge-pc-sw', 'edge-sw-router', 'edge-router-core'],
        evidenceText:
          '在真实实验里看 MAC 地址表中源 MAC 学到了哪个端口，以及未知单播发生时泛洪到的端口范围。',
        directionHints: ['先学源 MAC', '再查目的 MAC'],
      },
      {
        id: 'l1-ping-path-s4',
        title: '路由器按最长前缀选路并递减 TTL',
        plainText:
          '包到网关后，路由器拿目的 IP 去查路由表，选择最具体的那条路由，从对应接口发出去，同时把 TTL 减一。',
        professionalText:
          '转发决策使用最长前缀匹配，前缀长度相同时再比较协议优先级和度量。出接口确定后重写二层帧头，TTL 递减并按需更新校验和，TTL 归零则丢弃并回送 ICMP 超时。',
        focusNodeIds: ['r-edge'],
        focusEdgeIds: ['edge-sw-router', 'edge-router-core'],
        evidenceText:
          '在真实实验里看路由器路由表中目标前缀的下一跳与出接口，并用逐跳探测观察 TTL 每经过一跳减少。',
        directionHints: ['查路由表', '选最长前缀'],
      },
      {
        id: 'l1-ping-path-s5',
        title: '回程是另一段独立的路',
        plainText:
          '请求到达目标，只能证明去程通了。目标回包要按它自己的网关和路由表走另一条路，任何一端缺路由，源端看到的仍是超时。',
        professionalText:
          '去程与回程分别由两端路由表决定，彼此没有绑定关系。目标侧缺少回源网段的路由，或默认网关缺失，回包就无法返回。取证时必须把两个方向分开看。',
        focusNodeIds: ['srv-b', 'sw-core'],
        focusEdgeIds: ['edge-router-core', 'edge-core-server'],
        evidenceText:
          '在真实实验里看目标主机的默认网关与目标侧路由表，确认存在回到 192.0.2.0/24 的路径。',
        directionHints: ['回程独立计算', '两端分别查表'],
      },
      {
        id: 'l1-ping-path-s6',
        title: '按层取证，而不是靠猜',
        plainText:
          '先看接口状态，再看 MAC 与 ARP，再看路由与回程，最后才看策略和主机防火墙。每一层都留下能复核的证据，结论才站得住。',
        professionalText:
          '推荐自下而上排查：物理与接口状态、二层学习、三层地址与路由、双向可达、策略与主机过滤。只有 ping 失败这一条现象不足以定位层次，需要各层状态表形成证据链。',
        focusNodeIds: ['pc-a', 'sw-access', 'r-edge', 'srv-b', 'wan'],
        focusEdgeIds: ['edge-router-wan', 'edge-router-core'],
        evidenceText:
          '在真实实验里看接口状态、MAC 表、ARP 表、路由表和双向探测结果，确认失败发生在哪一层。',
        directionHints: ['自下而上', '每层留证据'],
      },
    ],
    why: [
      {
        heading: '为什么链路灯亮着却还是不通',
        paragraphs: [
          '很多排障卡在第一步：接口都是 Up，于是认为网络没问题。实际上 Up 只说明物理层和链路层就绪，地址是否正确、ARP 是否解析、路由是否存在、回程是否可达，都是后面才成立的条件。',
          '把一次 Ping 拆成几段来看，就能解释为什么单看链路状态会误判，也能知道下一步应该在哪台设备上取什么证据。',
        ],
      },
      {
        heading: '为什么必须把去程和回程分开',
        paragraphs: [
          '源端发出的请求可以由去程路径送到目标，目标回包却可能因为缺少回程路由而出不去。两端各查各的表，才能判断问题所在的一侧。',
          '这也是本课反复强调双向取证的原因：单向现象无法区分去程丢包和回程缺失。',
        ],
      },
    ],
    theory: [
      {
        heading: '同网段判断与默认网关',
        paragraphs: [
          '主机把目的地址与本机掩码相与，得到目的网络地址，再与本地网络地址比较。相等就在同一广播域内直接解析目标 MAC，不相等就交给默认网关。',
          '默认网关必须与主机在同一网段，否则主机无法为网关解析 MAC。跨网段访问的第一步不是找目标，而是找网关。',
        ],
        bullets: ['192.0.2.10/24 的本地网络是 192.0.2.0/24', '默认网关地址必须落在本地网段内'],
      },
      {
        heading: 'ARP 与交换机 MAC 学习',
        paragraphs: [
          'ARP 把 IP 地址解析为链路层地址。请求在广播域内广播，应答单播返回。交换机在这个过程中学习源 MAC，并按目的 MAC 转发。',
          '交换机不修改 IP 首部，也不参与 ARP 语义，它只让广播在 VLAN 内扩散、让已知单播走对应端口。',
        ],
      },
      {
        heading: '路由转发、TTL 与回程',
        paragraphs: [
          '路由器按最长前缀匹配选路，确定下一跳与出接口后重写二层封装。TTL 每经过一台路由器递减一次，归零时丢弃并回送 ICMP 超时。',
          '目标收到请求后，回包按目标侧路由表独立选路。只有两个方向都具备可达条件，Ping 才会成功。',
        ],
      },
    ],
    proTheory: [
      {
        heading: '最长前缀匹配与转发决策',
        paragraphs: [
          '路由表中可能有多个前缀都覆盖同一目的地址，转发时选择前缀最长的一条，因为它最具体。前缀长度相同再比较协议优先级与度量。',
          '默认路由 0.0.0.0/0 是前缀长度为 0 的兜底项，只有在没有更具体路由时才会命中。',
        ],
        bullets: ['先比前缀长度', '再比协议优先级', '最后比度量'],
      },
      {
        heading: 'ICMP 超时的两种常见来源',
        paragraphs: [
          '一种是请求在途中因 TTL 归零被丢弃，路由器回送 ICMP 超时；另一种是目标不可达或回程缺失，主机侧只看到请求超时。',
          '两者在源端表现相似，需要结合逐跳探测和两端路由表区分。',
        ],
      },
      {
        heading: '双向可达与故障边界',
        paragraphs: [
          '双向可达要求两端都有到对端网段的路由，且沿途 ARP 与接口状态正常。任何一侧缺项，端到端探测就会失败。',
          '把故障边界定位到某一台设备或某一张表，比反复 ping 更有价值，因为结论可以直接指导修复。',
        ],
      },
    ],
    lab: {
      platform: 'eNSP',
      devices: [
        'PC-A（eNSP 终端，192.0.2.10/24）',
        'PC-B（eNSP 终端，198.51.100.20/24）',
        'S5700 接入交换机',
        'AR2220 路由器',
        'Server 或第三台 PC 作为目标节点',
      ],
      versions: '以合法可用的 VRP 镜像版本为准',
      requirements: [
        '安装 eNSP 并准备合法可用的 VRP 镜像',
        '为两台 PC 配置静态地址与默认网关',
        '本实验只使用合成地址与教学拓扑，不与任何真实网络对应',
        '命令可能因 VRP 版本差异调整，以设备实际提示为准',
      ],
      addressing: [
        'PC-A：192.0.2.10/24，默认网关 192.0.2.1',
        'PC-B：198.51.100.20/24，默认网关 198.51.100.1',
        'R-EDGE 接 PC-A 侧接口：192.0.2.1/24',
        'R-EDGE 接 PC-B 侧接口：198.51.100.1/24',
        '预留设备互联段：203.0.113.0/30，两端可用 203.0.113.1 与 203.0.113.2',
      ],
      tasks: [
        {
          title: '搭建拓扑并配置地址',
          steps: [
            '按教学图放置两台 PC、交换机与路由器并连接接口。',
            '在 PC-A 配置 192.0.2.10/24 与网关 192.0.2.1，在 PC-B 配置 198.51.100.20/24 与网关 198.51.100.1。',
            '在路由器上配置两个接口地址并保持接口开启。',
            '确认交换机接入端口处于 Up。',
          ],
          observe: '记录两端接口状态与地址，确认没有地址冲突。',
        },
        {
          title: '验证跨网段 Ping 并取证',
          steps: [
            '在 PC-A 上先 ping 网关 192.0.2.1。',
            '再 ping PC-B 的 198.51.100.20。',
            '在 PC-A 上查看 ARP 表，确认网关映射存在。',
            '在交换机上查看 MAC 地址表，观察两端 MAC 与端口对应。',
          ],
          observe: '能通时记录各表变化；不通时记录失败发生在哪一跳。',
        },
        {
          title: '注入回程缺失故障',
          steps: [
            '在 PC-B 上清空默认网关，模拟目标侧没有回程出口。',
            '从 PC-A 再次 ping PC-B。',
            '在 PC-B 上查看路由表与网关配置。',
            '恢复网关配置后复测。',
          ],
          observe: '请求能到达目标但回包无法返回，源端表现为超时。',
        },
      ],
      commands: [
        {
          title: '路由器接口与路由检查（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname R-EDGE
interface GigabitEthernet0/0/0
 ip address 192.0.2.1 255.255.255.0
 quit
interface GigabitEthernet0/0/1
 ip address 198.51.100.1 255.255.255.0
 quit
display ip interface brief
display ip routing-table`,
        },
        {
          title: '交换机基础检查（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname SW-ACCESS
interface GigabitEthernet0/0/1
 port link-type access
 quit
display interface brief
display mac-address`,
        },
        {
          title: 'PC 侧取证命令（eNSP 终端，命令随版本可能调整）',
          language: 'text',
          code: `ipconfig
arp -a
ping 192.0.2.1
ping 198.51.100.20
tracert 198.51.100.20`,
        },
      ],
      verification: [
        'PC-A 能 ping 通网关 192.0.2.1。',
        'PC-A 的 ARP 表中出现 192.0.2.1 对应的 MAC。',
        'PC-A 能 ping 通 198.51.100.20，逐跳探测只经过网关一跳。',
        '交换机 MAC 表中能看到两端终端 MAC 与端口对应。',
      ],
      expected: [
        '地址与网关正确时跨网段 Ping 通，时延为毫秒级。',
        'ARP 表先出现网关映射，再出现业务通信。',
        '清空 PC-B 网关后，PC-A 侧表现为请求超时，而到网关的 Ping 仍正常。',
        '恢复网关后连通性恢复。',
      ],
      faults: [
        'PC-B 默认网关为空或填成不在本网段的地址。',
        '路由器接口地址与 PC 网段不匹配，或接口被 shutdown。',
        '目标侧缺少回程路由或回程网关错误。',
        '接入端口被划入错误 VLAN，导致广播域不一致。',
      ],
      recovery: [
        '补齐 PC-B 默认网关并确认下一跳在 198.51.100.0/24 内。',
        '核对路由器接口地址与掩码，执行 undo shutdown 后复测。',
        '用 display ip routing-table 确认回程前缀存在且下一跳可达。',
      ],
      status: 'guide-only',
      statusNote,
      sources: [docSources.rfc792, docSources.rfc826, docSources.rfc791, docSources.huawei, docSources.rfc5737],
    },
    challenges: [
      {
        id: 'l1-ping-path-c1',
        kind: 'choice',
        prompt: 'PC-A 访问 198.51.100.20 时，ARP 请求询问的是谁的 MAC？',
        hint: '先判断两者是否在同一网段。',
        options: [
          {
            id: 'l1-ping-path-c1-a',
            label: '目标主机 198.51.100.20',
            correct: false,
            explanation: '跨网段时源端不在本地广播域直接解析远端目标。',
          },
          {
            id: 'l1-ping-path-c1-b',
            label: '默认网关 192.0.2.1',
            correct: true,
            explanation: '跨网段时源端只需要把帧交给网关，因此解析的是网关 MAC。',
          },
          {
            id: 'l1-ping-path-c1-c',
            label: '广播地址 198.51.100.255',
            correct: false,
            explanation: '广播地址不是 ARP 询问对象，只是请求帧的目的 MAC 形态。',
          },
          {
            id: 'l1-ping-path-c1-d',
            label: 'DNS 服务器',
            correct: false,
            explanation: 'ARP 只解析链路层地址，与 DNS 无关。',
          },
        ],
        explanation: '跨网段时源端解析网关 MAC，目标的 MAC 由最后一跳路由器在目标网段内解析。',
      },
      {
        id: 'l1-ping-path-c2',
        kind: 'open',
        prompt: '接口状态都是 Up，但 PC-A ping PC-B 超时。请描述你会如何证明问题出在回程而不是去程。',
        hint: '从两端路由表、目标侧默认网关和双向探测入手。',
        explanation:
          '可以先在目标侧确认是否收到请求，再查 PC-B 的默认网关与路由表是否有回到 192.0.2.0/24 的条目，并在 PC-B 上向 PC-A 发起反向探测。若去程正常而反向探测失败，且目标侧缺回程路由，就可判定问题在回程。',
      },
    ],
    summary: [
      '同网段直接解析目标 MAC，跨网段先解析网关 MAC。',
      '交换机按 MAC 学习和转发，不修改 IP 首部。',
      '路由器按最长前缀选路，并逐跳递减 TTL。',
      '去程与回程独立计算，链路 Up 只说明二层就绪。',
    ],
    misconceptions: [
      {
        wrong: '接口 Up 就说明端到端可达。',
        right: 'Up 只表示物理和链路层就绪，还需要地址、ARP、路由和回程同时成立。',
      },
      {
        wrong: 'Ping 超时一定是去程丢了。',
        right: '也可能是回程无路由或目标侧网关缺失，需要双向取证。',
      },
      {
        wrong: '跨网段时源端会先 ARP 目标主机。',
        right: '源端 ARP 的是默认网关，目标 MAC 由最后一跳解析。',
      },
    ],
    sources: [docSources.rfc792, docSources.rfc826, docSources.rfc791, docSources.rfc5737, docSources.huawei],
    publicationStatus: 'published',
  },
  {
    id: 'l1-read-topology',
    title: '先找端、路、域',
    question: '面对一张陌生拓扑，先看什么才不会迷路？',
    level: 'L1',
    minutes: 30,
    goals: [
      '先定位终端与业务目标，再从两端之间串出设备与链路组成的路径。',
      '识别广播域、路由域与安全域的边界分别落在哪些设备上。',
      '区分镜像或旁路观测链路与真正承载业务的转发路径。',
      '用故障域方法把排查范围从整张图缩小到一段链路或一台设备。',
    ],
    prerequisites: ['l1-ping-path'],
    topicIds: ['topology-reading', 'layered-model', 'traffic-path', 'fault-domain'],
    topologyId: 'topo-l1-layers',
    steps: [
      {
        id: 'l1-read-topology-s1',
        title: '先找端：谁在用，访问谁',
        plainText:
          '读图先找使用者和被访问的业务，而不是先数设备。终端和业务服务器决定了这条路径的起点与终点，也决定了后面该看哪些地址。',
        professionalText:
          '把终端与业务目标标记为路径端点，记录其所在网段和角色。端点确定后，路径分析才有明确方向，避免在无关设备和旁路链路上耗时。',
        focusNodeIds: ['branch-pc', 'web-srv'],
        focusEdgeIds: ['l2-pc-sw', 'l3-fw-web'],
        evidenceText: '在真实实验里看终端的地址与业务服务器地址，确认它们各自属于哪个网段。',
        directionHints: ['从左到右找端点', '先业务目标后设备'],
      },
      {
        id: 'l1-read-topology-s2',
        title: '再找路：把设备串成一条路径',
        plainText:
          '从终端出发，沿着连线经过接入交换机、分支路由、城域路由和核心交换，最后到业务侧。能串起来的这条线，才是业务真正走的路。',
        professionalText:
          '按接口连接关系串出路径，并标注每一跳是二层转发还是三层转发。串通过程中要核对接口地址是否成对、链路方向是否与业务方向一致。',
        focusNodeIds: ['branch-sw', 'branch-r', 'metro-r', 'core-sw'],
        focusEdgeIds: ['l2-sw-r', 'l3-branch-metro', 'l3-metro-core'],
        evidenceText: '在真实实验里看每条互联链路的接口地址是否成对，以及逐跳探测是否沿这条路径前进。',
        directionHints: ['从端到端串设备', '标注二层与三层'],
      },
      {
        id: 'l1-read-topology-s3',
        title: '划广播域：哪里是一个二层范围',
        plainText:
          '交换机和它连接的所有终端通常处在同一个广播域。广播在这里扩散，不会自动穿过路由器。看到路由器，就要想到二层范围到此结束。',
        professionalText:
          '广播域以 VLAN 和二层设备为边界，路由器接口是天然的广播边界。同一广播域内 MAC 学习与泛洪生效，跨广播域必须经过三层转发。',
        focusNodeIds: ['branch-sw', 'branch-pc'],
        focusEdgeIds: ['l2-pc-sw'],
        evidenceText: '在真实实验里看交换机 MAC 表的覆盖范围，确认广播只在同一个 VLAN 内扩散。',
        directionHints: ['找到二层边界', '路由器是三层的起点'],
      },
      {
        id: 'l1-read-topology-s4',
        title: '划路由域：哪里开始换三层决策',
        plainText:
          '一旦跨过路由器，路径就进入三层。每台三层设备都有自己的路由表，它们对目的网段的下一跳选择可能不同。',
        professionalText:
          '路由域由运行路由协议或配置静态路由的三层设备组成。分析时要确认每台设备是否知道目的前缀，以及下一跳是否指向正确的上游。',
        focusNodeIds: ['branch-r', 'metro-r', 'core-sw'],
        focusEdgeIds: ['l3-branch-metro', 'l3-metro-core', 'l3-core-fw'],
        evidenceText: '在真实实验里看每台三层设备的路由表中目标前缀的下一跳，确认逐跳接力一致。',
        directionHints: ['逐台查路由表', '确认下一跳接力'],
      },
      {
        id: 'l1-read-topology-s5',
        title: '认安全域与镜像旁路',
        plainText:
          '防火墙把网络分成内外不同的安全域，业务流量必须真正穿过它。镜像探针只是复制流量做观察，不承载业务，断开它通常不影响业务转发。',
        professionalText:
          '安全域边界由防火墙或安全网关定义，策略在穿越点生效。镜像链路通过端口镜像复制流量到探针，属于观测面而非转发面，拓扑上要单独标注。',
        focusNodeIds: ['fw-edge', 'sec-probe'],
        focusEdgeIds: ['l3-core-fw', 'mirror-core-probe'],
        evidenceText: '在真实实验里观察并对比业务链路与镜像链路：断开镜像后业务探测应不受影响，断开业务链路则业务中断。',
        directionHints: ['业务路径看穿越点', '镜像链路单独标注'],
      },
      {
        id: 'l1-read-topology-s6',
        title: '从故障域缩小范围',
        plainText:
          '先问故障影响到哪些业务、哪些终端，再问这些业务共用哪一段路径。共用段就是优先排查的故障域，与故障无关的旁路先排除。',
        professionalText:
          '故障域是受影响业务的公共路径交集。按共用设备、共用链路、共用安全策略逐层收敛，可以把排查范围从全网缩小到单点，避免无差别逐台检查。',
        focusNodeIds: ['internet', 'web-srv', 'fw-edge'],
        focusEdgeIds: ['l3-fw-internet', 'l3-fw-web'],
        evidenceText: '在真实实验里观察分别断开不同链路后，观察哪些终端受影响，用受影响集合反推公共路径。',
        directionHints: ['先问影响范围', '再找公共路径'],
      },
    ],
    why: [
      {
        heading: '为什么陌生拓扑容易看乱',
        paragraphs: [
          '一张图里同时有终端、交换机、路由器、防火墙、服务器和旁路探针，如果从设备数量入手，很容易把观测链路当成业务链路，把旁路设备当成必经节点。',
          '先找端点和路径，再看域边界，读图就有了固定顺序，不会在细节里迷路。',
        ],
      },
      {
        heading: '为什么要区分业务面和观测面',
        paragraphs: [
          '镜像探针只复制流量，不参与转发；业务链路断开会中断业务，镜像链路断开只影响观察。两者在图上长得相似，作用完全不同。',
          '把这两类链路分开标注，排障时才不会把观测面的异常误判成业务故障。',
        ],
      },
    ],
    theory: [
      {
        heading: '端点、路径与域的三层读图法',
        paragraphs: [
          '第一层找端点，确定谁访问谁；第二层串路径，确定流量经过哪些设备；第三层划域，确定广播、路由和安全策略的边界在哪里。',
          '这三层顺序固定，先端点后路径再域，可以避免一开始就陷入设备细节。',
        ],
      },
      {
        heading: '广播域、路由域与安全域',
        paragraphs: [
          '广播域由二层设备和 VLAN 划分，广播在其中扩散。路由域由三层设备和路由信息组成，决定跨网段如何转发。安全域由防火墙等边界设备划分，决定哪些流量可以穿越。',
          '同一个物理设备可能同时承担多种角色，例如三层交换机既是广播域边界，也可能是路由域的一员。',
        ],
        bullets: ['广播域看 VLAN 与二层端口', '路由域看三层接口与路由表', '安全域看穿越点与策略'],
      },
      {
        heading: '镜像旁路与业务路径',
        paragraphs: [
          '业务路径上的设备真正转发流量，任一环中断都会影响业务。镜像旁路只接收复制流量，用于观察和分析，通常不是业务可达的必要条件。',
          '读图时应把镜像边标注为观测用途，避免把它算进业务路径。',
        ],
      },
    ],
    proTheory: [
      {
        heading: '故障域收敛方法',
        paragraphs: [
          '故障域是受影响对象公共路径的交集。影响集合越大，公共路径越靠上游；影响集合越小，问题越可能靠近末端。',
          '通过对比正常与异常终端的路径差异，可以快速排除大量无关设备。',
        ],
      },
      {
        heading: '接口与地址的成对核对',
        paragraphs: [
          '每条三层互联链路两端的地址必须落在同一网段，掩码和 VLAN 归属要匹配，否则邻居或静态路由无法建立。',
          '串路径时逐段核对地址对，比只看连线更可靠。',
        ],
      },
      {
        heading: '安全域边界的判断',
        paragraphs: [
          '安全策略只在流量穿越边界时生效，绕过边界的路径不受策略约束。读图时要确认业务流量是否真的经过防火墙。',
          '镜像流量不穿越安全策略的转发路径，不能用它来判断业务是否被放行。',
        ],
      },
    ],
    lab: {
      platform: 'eNSP',
      devices: [
        'PC（分支终端）',
        '2 至 3 台 S5700 交换机',
        '2 台 AR2220 路由器',
        'Server（业务服务器）',
        '一台终端用于模拟旁路观察点',
      ],
      versions: '以合法可用的 VRP 镜像版本为准',
      requirements: [
        '安装 eNSP 并准备合法可用的 VRP 镜像',
        '本实验只验证接口、路由与连通性，不配置任何安全产品',
        '镜像链路只作标注与观察，不接入业务转发',
        '命令可能因 VRP 版本差异调整，以设备实际提示为准',
      ],
      addressing: [
        '分支终端：192.0.2.10/24，默认网关 192.0.2.1',
        '分支路由接终端侧：192.0.2.1/24',
        '分支路由与城域路由互联：203.0.113.0/30，两端 203.0.113.1 与 203.0.113.2',
        '城域路由与核心交换互联：203.0.113.4/30，两端 203.0.113.5 与 203.0.113.6',
        '业务服务器：198.51.100.20/24，默认网关 198.51.100.1',
        '核心交换业务侧：198.51.100.1/24',
        '镜像与观测预留：203.0.113.16/29，不参与业务转发',
        '外部示意网段：203.0.113.24/29，不连接真实互联网',
      ],
      tasks: [
        {
          title: '按图搭建三层结构',
          steps: [
            '放置终端、交换机、路由器和服务器，按教学图连接。',
            '为终端和服务器配置地址与网关。',
            '为路由器互联接口配置 203.0.113.0/30 与 203.0.113.4/30 地址。',
            '为核心交换配置业务侧三层接口。',
          ],
          observe: '记录所有互联接口状态，确认没有地址冲突。',
        },
        {
          title: '验证路径与路由',
          steps: [
            '在分支终端上逐跳探测到业务服务器。',
            '在每台三层设备上查看目标前缀与下一跳。',
            '确认业务路径经过分支路由、城域路由和核心交换。',
            '记录每一跳是二层还是三层转发。',
          ],
          observe: '逐跳探测的路径应与图上串出的业务路径一致。',
        },
        {
          title: '验证镜像旁路不影响业务',
          steps: [
            '按标注在核心交换上配置一个观察端口，仅用于示意镜像关系。',
            '确认业务探测仍然正常。',
            '断开或关闭镜像观察链路。',
            '再次从终端探测业务服务器。',
          ],
          observe: '镜像链路变化不应影响业务连通性。',
        },
      ],
      commands: [
        {
          title: '分支路由接口与默认路由（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname BRANCH-R
interface GigabitEthernet0/0/0
 ip address 192.0.2.1 255.255.255.0
 quit
interface GigabitEthernet0/0/1
 ip address 203.0.113.1 30
 quit
ip route-static 0.0.0.0 0.0.0.0 203.0.113.2
display ip interface brief
display ip routing-table`,
        },
        {
          title: '核心交换三层接口（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname CORE-SW
vlan batch 300 400
interface GigabitEthernet0/0/1
 port link-type access
 port default vlan 300
 quit
interface Vlanif300
 ip address 203.0.113.6 30
 quit
interface GigabitEthernet0/0/2
 port link-type access
 port default vlan 400
 quit
interface Vlanif400
 ip address 198.51.100.1 255.255.255.0
 quit
display ip interface brief
display ip routing-table`,
        },
      ],
      verification: [
        '所有互联接口状态均为 Up。',
        '分支路由与核心交换的路由表出现业务网段前缀。',
        '分支终端能 ping 通业务服务器。',
        '断开镜像观察链路后业务探测仍然正常。',
      ],
      expected: [
        '逐跳探测路径与图上业务路径一致。',
        '业务网段前缀在沿途三层设备上均可查到。',
        '镜像链路断开只影响观察，不影响业务。',
      ],
      faults: [
        '某条三层互联两端地址不在同一网段。',
        '核心交换缺少回程静态路由。',
        '镜像观察端口被误接入业务 VLAN。',
        '接口被 shutdown 或被划入错误 VLAN。',
      ],
      recovery: [
        '逐段核对互联地址与掩码，修正后复测。',
        '补齐回程静态路由并确认下一跳可达。',
        '把观察端口恢复到独立观测范围，避免影响业务转发。',
      ],
      status: 'guide-only',
      statusNote,
      sources: [docSources.rfc5737, docSources.huawei, docSources.nist800115, docSources.gb22239],
    },
    challenges: [
      {
        id: 'l1-read-topology-c1',
        kind: 'choice',
        prompt: '镜像观察链路断开，业务通常会出现什么结果？',
        hint: '先判断镜像链路属于业务面还是观测面。',
        options: [
          {
            id: 'l1-read-topology-c1-a',
            label: '业务立即中断',
            correct: false,
            explanation: '镜像链路只复制流量，不承载业务转发。',
          },
          {
            id: 'l1-read-topology-c1-b',
            label: '业务不受影响，只影响观察',
            correct: true,
            explanation: '镜像属于观测面，断开后失去的是复制流量而不是业务连通性。',
          },
          {
            id: 'l1-read-topology-c1-c',
            label: '只在广播域内中断',
            correct: false,
            explanation: '镜像链路不改变广播域的业务转发关系。',
          },
        ],
        explanation: '镜像旁路只用于观察，业务路径与观测路径要分开看待。',
      },
      {
        id: 'l1-read-topology-c2',
        kind: 'open',
        prompt: '一张图里有终端、交换机、路由器和防火墙。你会先看哪一层，为什么？',
        hint: '从端点、路径、域三个层次考虑。',
        explanation:
          '先找终端和业务目标，确定分析的起点和终点，再串出它们之间的设备与链路，最后划分广播域、路由域和安全域。这样能先建立业务路径，再判断每个域边界的作用，避免被设备细节或旁路链路带偏。',
      },
    ],
    summary: [
      '读图顺序是先端点、再路径、后域。',
      '广播域止于路由器，路由域由三层设备与路由信息组成。',
      '镜像链路属于观测面，通常不是业务可达的必要条件。',
      '故障域是受影响对象的公共路径交集。',
    ],
    misconceptions: [
      {
        wrong: '图上所有连线都同等重要。',
        right: '业务链路直接决定可达性，镜像与旁路链路只影响观察。',
      },
      {
        wrong: '有交换机的地方就是三层边界。',
        right: '二层交换机只是广播域的一部分，三层边界要看路由接口和路由表。',
      },
      {
        wrong: '设备越多，故障越可能在最远端。',
        right: '应先算受影响对象的公共路径，故障域可能在任何共用段。',
      },
    ],
    sources: [docSources.rfc5737, docSources.huawei, docSources.nist800115, docSources.gb22239],
    publicationStatus: 'published',
  },
  {
    id: 'l2-vlan-trunk',
    title: 'VLAN 与 Trunk：标签在哪里被加上和剥掉',
    question: '同一根上联，为什么两个 VLAN 一个通、一个不通？',
    level: 'L2',
    minutes: 40,
    goals: [
      '解释 Access 端口如何为无标签帧赋予 VLAN 归属。',
      '描述 Trunk 链路上标签的添加、允许列表检查与出 Access 端口剥离过程。',
      '用端口、VLAN 与 MAC 表三类信息核对配置是否符合预期。',
      '区分 VLAN 已创建与 VLAN 已在链路上放行这两种不同状态。',
    ],
    prerequisites: ['l1-ping-path', 'l1-read-topology'],
    topicIds: ['vlan', 'trunk', 'mac-learning', 'broadcast-domain'],
    topologyId: 'topo-l2-vlan',
    steps: [
      {
        id: 'l2-vlan-trunk-s1',
        title: 'Access 端口给无标签帧定归属',
        plainText:
          '终端发出的帧不带 VLAN 标签。接入端口收到后，按自己的 PVID 给这个帧打上 VLAN 归属，交换机内部就带着这个 VLAN 转发。',
        professionalText:
          'Access 端口的 PVID 决定无标签帧进入哪个 VLAN。终端本身通常不知道 VLAN，标签是在交换机入口内部加上去的。',
        focusNodeIds: ['office-a1', 'sw-a'],
        focusEdgeIds: ['vlan-a-office'],
        evidenceText: '在真实实验里看 Access 端口所属 VLAN 与终端 MAC 是否出现在对应 VLAN 的 MAC 表中。',
        directionHints: ['无标签帧入端口', '按 PVID 归属'],
      },
      {
        id: 'l2-vlan-trunk-s2',
        title: 'PVID 决定未标记帧落在哪个 VLAN',
        plainText:
          '同一个交换机上，办公终端和语音终端接在不同端口，各自端口配置不同 PVID，于是进入不同 VLAN。配置写错一个 PVID，终端就会进错广播域。',
        professionalText:
          'PVID 是端口的默认 VLAN 标识。Access 端口只属于一个 VLAN，Trunk 端口的 PVID 决定未标记帧的归属，但业务上通常让 Trunk 只承载带标签帧。',
        focusNodeIds: ['voice-a1', 'sw-a'],
        focusEdgeIds: ['vlan-a-voice'],
        evidenceText: '在真实实验里看端口 PVID 与 VLAN 成员关系，确认语音终端进入 VLAN 120 而不是 VLAN 110。',
        directionHints: ['核对端口 PVID', '确认 VLAN 成员'],
      },
      {
        id: 'l2-vlan-trunk-s3',
        title: '交换机内部带着 VLAN 转发',
        plainText:
          '帧进入交换机后，端口之间转发时会保留 VLAN 归属。只有同一 VLAN 的端口之间才能二层互通，不同 VLAN 必须经过三层。',
        professionalText:
          '交换机内部转发时维护 VLAN 标识，MAC 表按 VLAN 分别学习。同一个 MAC 表项在不同 VLAN 中互不干扰。',
        focusNodeIds: ['sw-a', 'sw-b'],
        focusEdgeIds: ['vlan-trunk'],
        evidenceText: '在真实实验里看交换机内部 VLAN 与 MAC 表的对应关系，确认不同 VLAN 的 MAC 分开学习。',
        directionHints: ['VLAN 内转发', 'MAC 按 VLAN 区分'],
      },
      {
        id: 'l2-vlan-trunk-s4',
        title: 'Trunk 允许列表决定谁能过',
        plainText:
          '两台交换机之间的上联是 Trunk。它上面可以承载多个 VLAN，但只有被允许列表放行的 VLAN 才能通过。没放行的 VLAN，即使创建了也过不去。',
        professionalText:
          'Trunk 端口用允许列表控制可穿越的 VLAN。允许列表是链路属性，与 VLAN 是否已在全局创建是两件事。',
        focusNodeIds: ['sw-b'],
        focusEdgeIds: ['vlan-trunk', 'vlan-b-office'],
        evidenceText: '在真实实验里看 Trunk 允许列表，再对比两个 VLAN 的连通性差异。',
        directionHints: ['查允许列表', '创建不等于放行'],
      },
      {
        id: 'l2-vlan-trunk-s5',
        title: '出 Access 端口时剥掉标签',
        plainText:
          '帧从 Trunk 过来，带着 VLAN 标签进入交换机。从 Access 端口发给终端时，标签被剥掉，终端看到的是普通以太帧。',
        professionalText:
          'Access 端口出口剥离 VLAN 标签，终端不需要理解 802.1Q。Trunk 出口是否保留标签取决于端口类型与配置。',
        focusNodeIds: ['office-b1', 'sw-b'],
        focusEdgeIds: ['vlan-b-office'],
        evidenceText: '在真实实验里看终端是否无感知收到帧，同时在交换机上确认 VLAN 归属仍然正确。',
        directionHints: ['出口剥标签', '终端无感知'],
      },
      {
        id: 'l2-vlan-trunk-s6',
        title: '每个 VLAN 是独立广播域',
        plainText:
          '不同 VLAN 之间广播不互相扩散，MAC 学习也彼此独立。打印机放在一个 VLAN，另一个 VLAN 的终端就不能直接二层访问它。',
        professionalText:
          'VLAN 把物理交换机划分成多个逻辑广播域，广播、未知单播泛洪和 MAC 学习都在各自 VLAN 内进行。跨 VLAN 通信需要三层网关。',
        focusNodeIds: ['print-srv', 'sw-b'],
        focusEdgeIds: ['vlan-print'],
        evidenceText: '在真实实验里看不同 VLAN 的终端访问打印机，观察二层可达与三层可达的差别。',
        directionHints: ['广播域隔离', '跨 VLAN 走三层'],
      },
    ],
    why: [
      {
        heading: '为什么一根上联会表现出一通一断',
        paragraphs: [
          '接入交换机上两个 VLAN 都已创建，终端地址也正确，但上联 Trunk 只放行了其中一个 VLAN。结果就是一个 VLAN 能通，另一个 VLAN 的帧在上联被丢弃。',
          '这说明 VLAN 创建和 VLAN 放行是两个独立条件，缺一不可。',
        ],
      },
      {
        heading: '为什么要理解标签的加与剥',
        paragraphs: [
          '终端不理解 VLAN，标签只在交换机之间传递。如果不知道标签在哪里加、在哪里剥，就很难判断故障发生在接入侧还是上联侧。',
          '掌握这条链路后，端口类型、PVID 和允许列表就能串成一个完整的转发过程。',
        ],
      },
    ],
    theory: [
      {
        heading: 'Access、Trunk 与 PVID',
        paragraphs: [
          'Access 端口连接终端，无标签帧按 PVID 进入指定 VLAN，出口时剥掉标签。Trunk 端口连接交换机或路由器，通过允许列表承载多个 VLAN。',
          'PVID 决定未标记帧归属，允许列表决定哪些 VLAN 可以通过链路。',
        ],
      },
      {
        heading: 'VLAN 内的转发与 MAC 学习',
        paragraphs: [
          '交换机在 VLAN 内转发帧，MAC 表按 VLAN 分别学习源地址。广播与未知单播只在同一 VLAN 内泛洪。',
          '不同 VLAN 之间二层隔离，任何跨 VLAN 通信都要经过三层设备。',
        ],
        bullets: ['广播不跨 VLAN', 'MAC 表按 VLAN 区分', '跨 VLAN 必过三层'],
      },
      {
        heading: '标签的添加与剥离',
        paragraphs: [
          '无标签帧在 Access 入口按 PVID 加上内部 VLAN 标识。跨交换机时由 Trunk 携带标签传输。出 Access 口时标签被剥离。',
          '标签是交换机之间的约定，终端通常不需要感知。',
        ],
      },
    ],
    proTheory: [
      {
        heading: '允许列表与 VLAN 裁剪',
        paragraphs: [
          'Trunk 允许列表可以只放行必要的 VLAN，减少无关广播扩散。允许列表过窄会导致某些 VLAN 无法跨链路，过宽会增加不必要的泛洪范围。',
          '排障时要把全局 VLAN 表与端口允许列表分开检查。',
        ],
      },
      {
        heading: '本征 VLAN 与未标记帧',
        paragraphs: [
          'Trunk 端口的 PVID 对应未标记帧的归属，有些实现称为本征 VLAN。若两端本征 VLAN 不一致，未标记帧会被放入不同广播域。',
          '业务 VLAN 通常全部使用带标签传输，避免本征 VLAN 不一致带来的隐蔽问题。',
        ],
      },
      {
        heading: '跨 VLAN 通信的边界',
        paragraphs: [
          'VLAN 隔离是二层属性，跨 VLAN 必须经过三层接口或网关。没有三层网关时，即使地址在同一物理设备上也无法互通。',
          '这也是为什么 VLAN 划分后还要规划网关和路由。',
        ],
      },
    ],
    lab: {
      platform: 'eNSP',
      devices: [
        '2 台 S5700 交换机',
        '4 台 PC（办公与语音终端各两台）',
        '1 台 Server（打印机或业务服务器）',
      ],
      versions: '以合法可用的 VRP 镜像版本为准',
      requirements: [
        '安装 eNSP 并准备合法可用的 VRP 镜像',
        '两台交换机之间使用 Trunk 互联',
        '终端使用静态地址，不依赖 DHCP',
        '命令可能因 VRP 版本差异调整，以设备实际提示为准',
      ],
      addressing: [
        'VLAN 110 办公：192.0.2.0/24，网关 192.0.2.1',
        'VLAN 120 语音：198.51.100.0/24，网关 198.51.100.1',
        '办公终端 A1：192.0.2.11/24',
        '办公终端 B1：192.0.2.12/24',
        '语音终端 A1：198.51.100.11/24',
        '语音终端 B1：198.51.100.12/24',
        '打印服务器：192.0.2.100/24，属于 VLAN 110',
      ],
      tasks: [
        {
          title: '创建 VLAN 并配置接入端口',
          steps: [
            '在两台交换机上创建 VLAN 110 与 VLAN 120。',
            '把办公终端所连端口设为 Access 并划入 VLAN 110。',
            '把语音终端所连端口设为 Access 并划入 VLAN 120。',
            '把打印服务器端口设为 Access 并划入 VLAN 110。',
          ],
          observe: '确认每个 Access 端口只属于一个 VLAN，PVID 与规划一致。',
        },
        {
          title: '配置 Trunk 并验证两个 VLAN',
          steps: [
            '在两台交换机的上联端口配置 Trunk。',
            '允许 VLAN 110 与 VLAN 120 通过。',
            '从办公终端 ping 另一台交换机的办公终端。',
            '从语音终端 ping 另一台交换机的语音终端。',
          ],
          observe: '两个 VLAN 内的终端应各自互通，跨 VLAN 不应二层互通。',
        },
        {
          title: '移除一个 VLAN 的放行并观察',
          steps: [
            '在一侧 Trunk 上移除 VLAN 120 的允许。',
            '查看端口 VLAN 信息与全局 VLAN 信息。',
            '从语音终端再次 ping 对端语音终端。',
            '恢复允许后复测。',
          ],
          observe: 'VLAN 120 的连通性应中断，而 VLAN 110 不受影响。',
        },
      ],
      commands: [
        {
          title: '交换机 A 的 VLAN 与 Trunk 配置（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname SW-A
vlan batch 110 120
interface GigabitEthernet0/0/1
 port link-type access
 port default vlan 110
 quit
interface GigabitEthernet0/0/2
 port link-type access
 port default vlan 120
 quit
interface GigabitEthernet0/0/24
 port link-type trunk
 port trunk allow-pass vlan 110 120
 quit
display port vlan
display vlan
display mac-address`,
        },
        {
          title: '交换机 B 的对应配置与故障注入（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname SW-B
vlan batch 110 120
interface GigabitEthernet0/0/1
 port link-type access
 port default vlan 110
 quit
interface GigabitEthernet0/0/2
 port link-type access
 port default vlan 120
 quit
interface GigabitEthernet0/0/24
 port link-type trunk
 port trunk allow-pass vlan 110 120
 quit
display port vlan
undo port trunk allow-pass vlan 120
display port vlan
display vlan`,
        },
      ],
      verification: [
        '同一 VLAN 内跨交换机的终端能够互通。',
        '不同 VLAN 的终端在没有三层网关时不能二层互通。',
        'display vlan 能看到两个 VLAN 及成员端口。',
        'display port vlan 显示 Trunk 允许列表符合规划。',
        'display mac-address 中两个 VLAN 的 MAC 分别学习。',
      ],
      expected: [
        'VLAN 110 与 VLAN 120 各自形成独立广播域。',
        '移除 VLAN 120 放行后，语音终端跨交换机不通，办公终端仍通。',
        '恢复允许列表后语音终端恢复互通。',
      ],
      faults: [
        'VLAN 已创建但 Trunk 未放行。',
        'Access 端口 PVID 配置错误，终端进入错误 VLAN。',
        'Trunk 两端允许列表不一致。',
        '打印服务器端口被划入错误 VLAN。',
      ],
      recovery: [
        '在 Trunk 上补回缺失的允许 VLAN。',
        '核对并修正 Access 端口 PVID。',
        '统一两端 Trunk 的允许列表与本征 VLAN 设置。',
      ],
      status: 'guide-only',
      statusNote,
      sources: [docSources.rfc5737, docSources.huawei, docSources.nist800115, docSources.gb22239],
    },
    challenges: [
      {
        id: 'l2-vlan-trunk-c1',
        kind: 'choice',
        prompt: 'VLAN 已创建、终端地址正确，但跨交换机仍不通。最可能先检查什么？',
        hint: '创建与放行是两个独立条件。',
        options: [
          {
            id: 'l2-vlan-trunk-c1-a',
            label: '终端 MAC 地址是否重复',
            correct: false,
            explanation: 'MAC 重复会引发其他现象，但不会只让某一个 VLAN 跨交换机不通。',
          },
          {
            id: 'l2-vlan-trunk-c1-b',
            label: 'Trunk 允许列表是否放行该 VLAN',
            correct: true,
            explanation: 'VLAN 创建不代表链路放行，Trunk 允许列表缺失会让该 VLAN 的帧被丢弃。',
          },
          {
            id: 'l2-vlan-trunk-c1-c',
            label: '服务器是否需要重启',
            correct: false,
            explanation: '服务器状态与该二层 VLAN 放行问题无直接关系。',
          },
        ],
        explanation: '先查 Trunk 允许列表，再看 Access 端口 PVID 与 VLAN 成员。',
      },
      {
        id: 'l2-vlan-trunk-c2',
        kind: 'open',
        prompt: '物理端口显示 Up，是否就能说明该端口所属 VLAN 一定通？请说明理由。',
        hint: '从端口状态、PVID、允许列表和 VLAN 成员四个条件考虑。',
        explanation:
          '物理 Up 只说明链路层信号正常。要判断 VLAN 是否通，还要确认端口类型、PVID、VLAN 是否创建、Trunk 是否放行该 VLAN，以及 MAC 是否在对端学习到。任何一项不满足，业务都可能不通。',
      },
    ],
    summary: [
      'Access 入口按 PVID 给无标签帧赋 VLAN 归属。',
      'Trunk 用允许列表决定哪些 VLAN 可以通过。',
      'Access 出口剥离标签，终端不需要感知 VLAN。',
      '每个 VLAN 是独立广播域，跨 VLAN 必须经过三层。',
    ],
    misconceptions: [
      {
        wrong: 'VLAN 创建了就一定能通。',
        right: '还要在 Trunk 允许列表中放行，并保证两端一致。',
      },
      {
        wrong: '物理端口 Up 就说明 VLAN 正常。',
        right: 'Up 只是链路状态，VLAN 归属与放行需要单独核对。',
      },
      {
        wrong: '所有 VLAN 的 MAC 表是同一张。',
        right: 'MAC 学习按 VLAN 区分，不同 VLAN 的表项互不干扰。',
      },
    ],
    sources: [docSources.rfc5737, docSources.huawei, docSources.nist800115, docSources.gb22239],
    publicationStatus: 'published',
  },
  {
    id: 'l2-loop-stp',
    title: '二层环路：广播为什么会转圈',
    question: '多接一根线为什么可能让整个二层网络变慢？',
    level: 'L2',
    minutes: 40,
    goals: [
      '解释广播域内泛洪如何在没有环路时正常扩散、在成环时不断放大。',
      '描述 STP 的根桥、根端口与阻塞端口如何把环状拓扑剪成树。',
      '区分管理面与业务面，判断管理通道异常是否等于业务中断。',
      '在链路变化后观察 STP 收敛对业务的实际影响。',
    ],
    prerequisites: ['l2-vlan-trunk'],
    topicIds: ['layer2-loop', 'broadcast-storm', 'stp', 'convergence'],
    topologyId: 'topo-l2-loop',
    steps: [
      {
        id: 'l2-loop-stp-s1',
        title: '广播域内泛洪本来很正常',
        plainText:
          '交换机收到广播帧时，会从同一 VLAN 的其他端口复制出去。拓扑是树时，广播扩散一次就结束，这是正常行为。',
        professionalText:
          '广播和未知单播在 VLAN 内泛洪，是二层转发的基本机制。只要拓扑无环，帧的扩散范围有界，不会反复回到起点。',
        focusNodeIds: ['pc-1', 'sw-a'],
        focusEdgeIds: ['loop-pc1'],
        evidenceText: '在真实实验里看广播帧在树形拓扑中的扩散范围与端口列表。',
        directionHints: ['从终端发广播', '观察泛洪端口'],
      },
      {
        id: 'l2-loop-stp-s2',
        title: '多接一根线就形成了环',
        plainText:
          '三台交换机两两相连，任何两点之间都有两条路。广播从一条路出去，会从另一条路回到起点，然后再次被转发。',
        professionalText:
          '交换机的冗余链路在提升可靠性的同时形成了二层环路。没有环保护机制时，广播会在环上持续循环。',
        focusNodeIds: ['sw-a', 'sw-b', 'sw-c'],
        focusEdgeIds: ['loop-ab', 'loop-bc', 'loop-ca'],
        evidenceText: '在真实实验里看三台交换机的端口互连关系，确认存在闭合回路。',
        directionHints: ['找出闭合回路', '两两相连即成环'],
      },
      {
        id: 'l2-loop-stp-s3',
        title: '广播风暴把带宽吃光',
        plainText:
          '环上的广播不会只转一圈，它会不断复制、放大。端口流量迅速升高，CPU 忙于处理，正常业务几乎发不出去。',
        professionalText:
          '广播帧在环路上被反复泛洪，形成广播风暴。链路利用率飙升，MAC 表频繁抖动，终端表现为大面积丢包或断网。',
        focusNodeIds: ['pc-2', 'sw-b'],
        focusEdgeIds: ['loop-pc2', 'loop-bc'],
        evidenceText: '在真实实验里看端口流量与 CPU 占用是否异常升高，同时观察终端业务是否大面积失败。',
        directionHints: ['流量快速上升', '业务大面积失败'],
      },
      {
        id: 'l2-loop-stp-s4',
        title: 'STP 用根桥和阻塞端口剪环',
        plainText:
          'STP 先选出一台根桥，再让每台交换机选出到根桥最近的根端口，最后在环上阻塞一个端口，把环剪成一棵树。',
        professionalText:
          'STP 通过选举根桥、确定根端口与指定端口，把冗余端口置为阻塞状态。被阻塞的端口不转发业务帧，只接收必要的协议信息。',
        focusNodeIds: ['sw-a', 'sw-b', 'sw-c'],
        focusEdgeIds: ['loop-ab', 'loop-bc'],
        evidenceText: '在真实实验里看根桥标识、各端口角色与状态，确认环上有一个端口处于阻塞。',
        directionHints: ['先选根桥', '再定端口角色'],
      },
      {
        id: 'l2-loop-stp-s5',
        title: '链路变化会触发重新收敛',
        plainText:
          '当一条链路断开，原来的阻塞端口可能要变成转发，网络重新找一棵树。收敛期间短暂丢包是正常现象。',
        professionalText:
          '拓扑变化会触发 STP 重新计算，端口状态经历阻塞、侦听、学习、转发等阶段。收敛时间取决于协议版本与定时器。',
        focusNodeIds: ['sw-c', 'sw-a'],
        focusEdgeIds: ['loop-bc', 'loop-ca'],
        evidenceText: '在真实实验里观察断开一条环上链路后，观察端口角色变化与业务恢复所需时间。',
        directionHints: ['断链触发重算', '关注收敛时间'],
      },
      {
        id: 'l2-loop-stp-s6',
        title: '管理面与业务面要分开看',
        plainText:
          '管理地址所在网络和业务 VLAN 可能不是同一条路。管理口不通，不代表业务一定中断；业务通，也不代表管理面正常。',
        professionalText:
          '管理面用于设备维护，业务面承载用户流量，两者可能共享物理链路但属于不同 VLAN 或不同地址空间。排障时要分别验证。',
        focusNodeIds: ['mgmt', 'sw-a'],
        focusEdgeIds: ['loop-mgmt'],
        evidenceText: '在真实实验里看分别从管理终端和业务终端发起的探测，确认两者结果是否一致。',
        directionHints: ['管理面单独验证', '业务面单独验证'],
      },
    ],
    why: [
      {
        heading: '为什么冗余链路反而带来风险',
        paragraphs: [
          '多接一根线可以提高可靠性，但在二层网络中，它同时制造了环路。没有环保护时，广播会沿环反复扩散，最终形成广播风暴。',
          '理解这个矛盾，才能明白为什么需要 STP，以及为什么 STP 要主动阻塞某些端口。',
        ],
      },
      {
        heading: '为什么阻塞端口不代表链路坏了',
        paragraphs: [
          'STP 阻塞端口是协议主动选择的结果，目的是剪断环路。端口物理状态可能仍是 Up，只是不转发业务帧。',
          '把阻塞当成故障，就会误换线、误改配置，反而破坏原本正常的拓扑。',
        ],
      },
    ],
    theory: [
      {
        heading: '广播、泛洪与环路',
        paragraphs: [
          '交换机对广播和未知单播执行泛洪。拓扑无环时泛洪有界，拓扑成环时帧会沿环反复传播。',
          '环路带来的不只是重复帧，还有 MAC 表抖动和带宽耗尽。',
        ],
      },
      {
        heading: 'STP 的根桥、根端口与阻塞端口',
        paragraphs: [
          'STP 先选举根桥，再让每台非根交换机选出到根桥路径开销最小的根端口，并在每条链路上确定指定端口。',
          '既不是根端口也不是指定端口的端口进入阻塞状态，从而把环剪成树。',
        ],
        bullets: ['根桥是树的顶点', '根端口指向根桥', '阻塞端口剪断环路'],
      },
      {
        heading: '收敛与业务影响',
        paragraphs: [
          '拓扑变化后 STP 重新计算，端口状态迁移需要时间。收敛期间可能出现短暂丢包或重复帧。',
          '不同 STP 版本的收敛速度不同，规划时要结合业务对中断时间的容忍度。',
        ],
      },
    ],
    proTheory: [
      {
        heading: '端口状态迁移',
        paragraphs: [
          '传统 STP 的端口会经历阻塞、侦听、学习、转发等状态。侦听与学习阶段不转发用户数据，用于避免临时环路。',
          '快速生成树等改进机制通过协商缩短收敛时间，但基本原理仍是把环剪成树。',
        ],
      },
      {
        heading: '管理面与业务面的边界',
        paragraphs: [
          '管理地址通常配置在独立的 VLAN 或管理接口上，业务流量走业务 VLAN。两者共享物理设备但逻辑上分离。',
          '管理面异常时，业务可能仍然正常，反之亦然。',
        ],
      },
      {
        heading: '环路排查的观察点',
        paragraphs: [
          '优先观察端口流量是否异常升高、MAC 表是否频繁变化、CPU 是否被广播处理占满。',
          '确认环上端口角色后，再判断是 STP 未生效还是配置不一致。',
        ],
      },
    ],
    lab: {
      platform: 'eNSP',
      devices: ['3 台 S5700 交换机', '2 台 PC（业务终端）', '1 台 PC 或终端用于管理面验证'],
      versions: '以合法可用的 VRP 镜像版本为准',
      requirements: [
        '安装 eNSP 并准备合法可用的 VRP 镜像',
        '先在隔离环境关闭 STP 观察风险，再启用 STP 对比',
        '本实验只在隔离的教学环境中进行，不连接任何真实网络',
        '命令可能因 VRP 版本差异调整，以设备实际提示为准',
      ],
      addressing: [
        '业务网段：192.0.2.0/24',
        'PC-1：192.0.2.11/24',
        'PC-2：192.0.2.12/24',
        '管理网段：198.51.100.0/24',
        '管理终端：198.51.100.100/24',
        '三台交换机管理地址：198.51.100.11 至 198.51.100.13',
      ],
      tasks: [
        {
          title: '搭三角拓扑并在关闭 STP 时观察',
          steps: [
            '三台交换机两两互连，两台 PC 分别接入不同交换机。',
            '在隔离环境中关闭 STP。',
            '从 PC-1 发送广播或大量 ping。',
            '观察端口流量、CPU 与业务连通性。',
          ],
          observe: '关闭 STP 后可能出现广播风暴，业务大面积丢包。',
        },
        {
          title: '启用 STP 并核对端口角色',
          steps: [
            '在三台交换机上启用 STP。',
            '指定其中一台为根桥。',
            '查看根桥标识与各端口角色。',
            '确认环上存在阻塞端口。',
          ],
          observe: '启用 STP 后业务恢复稳定，环上应有端口处于阻塞。',
        },
        {
          title: '断开一条链路观察收敛',
          steps: [
            '记录当前阻塞端口位置。',
            '断开环上一条链路。',
            '观察端口角色变化与业务恢复时间。',
            '恢复链路后再次观察。',
          ],
          observe: '收敛期间出现短暂丢包，恢复后业务重新稳定。',
        },
      ],
      commands: [
        {
          title: 'STP 模式、根桥与状态检查（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname SW-A
stp mode stp
stp root primary
display stp
display stp brief`,
        },
        {
          title: '关闭与恢复 STP 的对比观察（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
stp disable
display stp brief
stp enable
display stp brief`,
        },
        {
          title: '接入端口边缘设置（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
interface GigabitEthernet0/0/1
 stp edged-port enable
 quit
display stp interface GigabitEthernet0/0/1`,
        },
      ],
      verification: [
        '启用 STP 后环上存在阻塞端口。',
        '根桥标识在三台交换机上一致。',
        '业务终端在稳定状态下能持续互通。',
        '断开一条链路后业务能够恢复。',
        '管理终端能访问管理地址，且与业务探测结果分别记录。',
      ],
      expected: [
        '关闭 STP 时出现广播风暴风险，业务明显异常。',
        '启用 STP 后广播被限制在树形路径上，业务恢复。',
        '断链后阻塞端口角色变化，短暂丢包后恢复。',
      ],
      faults: [
        'STP 未启用或端口被错误设置为不参与。',
        '根桥配置不一致导致频繁重新选举。',
        '接入端口未设置边缘属性，终端上下线引发拓扑变化。',
        '管理 VLAN 与业务 VLAN 混用导致管理面异常。',
      ],
      recovery: [
        '在全部相关交换机上启用 STP 并统一模式。',
        '固定根桥，避免角色反复变化。',
        '把终端接入端口设为边缘端口，减少无谓收敛。',
      ],
      status: 'guide-only',
      statusNote,
      sources: [docSources.huawei, docSources.nist800115, docSources.gb22239, docSources.rfc5737],
    },
    challenges: [
      {
        id: 'l2-loop-stp-c1',
        kind: 'choice',
        prompt: 'STP 中某个端口显示阻塞，最合理的解释是什么？',
        hint: '阻塞是协议主动行为还是硬件故障？',
        options: [
          {
            id: 'l2-loop-stp-c1-a',
            label: '链路硬件损坏',
            correct: false,
            explanation: '阻塞是协议为剪断环路而主动设置的状态，端口物理状态可能仍正常。',
          },
          {
            id: 'l2-loop-stp-c1-b',
            label: '协议主动剪断环路',
            correct: true,
            explanation: 'STP 把冗余端口置为阻塞，使环状拓扑变成无环的树。',
          },
          {
            id: 'l2-loop-stp-c1-c',
            label: '该端口一定配置错误',
            correct: false,
            explanation: '阻塞可能是正常选举结果，不能直接判定为配置错误。',
          },
        ],
        explanation: '阻塞端口是 STP 的正常工作结果，不代表链路故障。',
      },
      {
        id: 'l2-loop-stp-c2',
        kind: 'open',
        prompt: 'STP 收敛期间业务出现短暂丢包，你会如何判断这是正常收敛还是环路未消除？',
        hint: '从端口角色、MAC 表稳定性、流量曲线和恢复时间观察。',
        explanation:
          '正常收敛的丢包时间有限，收敛完成后端口角色稳定、MAC 表不再频繁抖动、流量恢复到正常水平。若丢包持续、端口角色反复变化、MAC 表持续抖动且流量居高不下，则更像环路未消除或 STP 配置不一致。',
      },
    ],
    summary: [
      '广播在无环拓扑中有界扩散，在成环拓扑中会反复放大。',
      'STP 通过根桥、根端口和阻塞端口把环剪成树。',
      '阻塞端口是协议选择，不代表链路损坏。',
      '收敛期间短暂丢包正常，持续异常要查环路与配置。',
    ],
    misconceptions: [
      {
        wrong: '端口阻塞说明线坏了。',
        right: '阻塞是 STP 主动剪环的结果，物理链路可能完全正常。',
      },
      {
        wrong: '多接一条线总是提升可靠性。',
        right: '二层冗余链路会形成环路，需要 STP 等机制配合。',
      },
      {
        wrong: '管理口不通就是业务全断。',
        right: '管理面与业务面可能分离，要分别验证。',
      },
    ],
    sources: [docSources.huawei, docSources.nist800115, docSources.gb22239, docSources.rfc5737],
    publicationStatus: 'published',
  },
  {
    id: 'l3-static-return',
    title: '请求到了，回复为什么没回来',
    question: '去程可达，为什么源端仍然超时？',
    level: 'L3',
    minutes: 40,
    goals: [
      '解释主机默认网关与逐跳转发如何共同完成去程。',
      '说明去程和回程由两端路由表独立决定，不能用单向现象判断成功。',
      '读懂静态路由的前缀、掩码与下一跳，并核对双向配置。',
      '把回程缺失定位到具体设备的缺失路由条目。',
    ],
    prerequisites: ['l1-ping-path', 'l2-vlan-trunk'],
    topicIds: ['static-route', 'default-gateway', 'return-path', 'longest-prefix'],
    topologyId: 'topo-l3-static',
    steps: [
      {
        id: 'l3-static-return-s1',
        title: '主机先把包交给默认网关',
        plainText:
          '终端访问其他网段时，先把帧发给默认网关。网关地址必须和终端在同一网段，终端才能解析它的 MAC。',
        professionalText:
          '主机通过默认网关把跨网段流量交给第一跳路由器。网关配置错误或网关不可达时，去程在源端就无法开始。',
        focusNodeIds: ['pc-a', 'r-a'],
        focusEdgeIds: ['static-a-ra'],
        evidenceText: '在真实实验里看 PC-A 的网关地址与 ARP 表，确认网关映射存在。',
        directionHints: ['源端先找网关', '确认网关 ARP'],
      },
      {
        id: 'l3-static-return-s2',
        title: '路由器逐跳接力',
        plainText:
          '每台路由器只负责把包交给下一台更接近目的地的设备。它不需要知道完整路径，只需要知道下一跳。',
        professionalText:
          '路由器按目的前缀查表，选择下一跳与出接口，逐跳接力直到目的网段。静态路由把下一跳写死在配置里。',
        focusNodeIds: ['r-a', 'r-b'],
        focusEdgeIds: ['static-ra-rb'],
        evidenceText: '在真实实验里看 R-A 路由表中目标前缀的下一跳是否指向 R-B。',
        directionHints: ['逐跳查下一跳', '静态路由写死'],
      },
      {
        id: 'l3-static-return-s3',
        title: '回程是目标侧自己的选择',
        plainText:
          '请求到达 PC-B 后，PC-B 回包也要找自己的网关。如果它没有到源网段的路由，回复就走不回去。',
        professionalText:
          '回程由目标主机的网关与目标侧路由表决定，与去程配置无关。目标侧缺少回源网段路由是单向超时的常见原因。',
        focusNodeIds: ['pc-b', 'r-b'],
        focusEdgeIds: ['static-rb-b'],
        evidenceText: '在真实实验里看 PC-B 的网关与 R-B 的路由表，确认存在回到 192.0.2.0/24 的条目。',
        directionHints: ['回程独立选路', '目标侧查表'],
      },
      {
        id: 'l3-static-return-s4',
        title: '静态路由要写对前缀和下一跳',
        plainText:
          '静态路由由目的网段、掩码和下一跳组成。掩码写错会匹配到错误的地址范围，下一跳写错则包发不出去。',
        professionalText:
          '静态路由的前缀与掩码共同定义目的范围，下一跳必须可达。缺省路由是前缀长度为 0 的静态路由。',
        focusNodeIds: ['r-a'],
        focusEdgeIds: ['static-a-ra', 'static-ra-rb'],
        evidenceText: '在真实实验里看逐条核对的静态路由的目的网段、掩码和下一跳，确认没有多余或冲突条目。',
        directionHints: ['核对前缀掩码', '确认下一跳可达'],
      },
      {
        id: 'l3-static-return-s5',
        title: '用双向证据代替单向猜测',
        plainText:
          '只看源端 ping 失败，分不清是去程丢还是回程丢。让目标主动向源端发起探测，能直接暴露回程是否成立。',
        professionalText:
          '双向探测是区分去程与回程的有效手段。若目标向源端探测成功而源端向目标失败，问题更可能在回程或目标侧策略。',
        focusNodeIds: ['pc-a', 'pc-b'],
        focusEdgeIds: ['static-a-ra', 'static-rb-b'],
        evidenceText: '在真实实验里看从 PC-B 反向 ping PC-A 的结果，并记录两个方向的成功或失败。',
        directionHints: ['反向探测', '双向对照'],
      },
      {
        id: 'l3-static-return-s6',
        title: '把问题定位到 R-B 的缺失条目',
        plainText:
          '当去程正常、目标能收到请求，而回程探测失败时，重点看目标侧路由器是否缺少回源网段的路由。',
        professionalText:
          '在 R-B 上检查是否存在 192.0.2.0/24 的静态路由或动态路由。缺失时删除/恢复该条目可以直接验证因果关系。',
        focusNodeIds: ['r-b'],
        focusEdgeIds: ['static-ra-rb', 'static-rb-b'],
        evidenceText: '在真实实验里观察删除 R-B 的回程静态路由后，观察源端超时而目标侧反向探测仍能到达源端的变化。',
        directionHints: ['检查目标侧路由', '用增删验证因果'],
      },
    ],
    why: [
      {
        heading: '为什么去程通不代表业务通',
        paragraphs: [
          '网络通信是双向的。请求能从源端到达目标，只说明去程路径成立；回复能否回来，取决于目标侧的路由与网关。',
          '把单向成功当成端到端成功，是静态路由排障里最常见的误判。',
        ],
      },
      {
        heading: '为什么静态路由特别容易漏回程',
        paragraphs: [
          '静态路由需要人工逐台配置，去程配了、回程忘了，网络就表现为单向可达。动态路由通常能自动补齐双向，但静态场景必须两边都写。',
          '这也是本课把回程单独拿出来讲的原因。',
        ],
      },
    ],
    theory: [
      {
        heading: '默认网关与第一跳',
        paragraphs: [
          '主机访问其他网段时把流量交给默认网关。网关地址必须与主机同网段，且网关接口可达。',
          '第一跳失败时，源端连请求都发不出去。',
        ],
      },
      {
        heading: '静态路由的前缀、掩码与下一跳',
        paragraphs: [
          '静态路由用目的前缀和掩码描述目标范围，用下一跳指定交给谁。下一跳必须能通过直连或递归查询到达。',
          '掩码错误会让路由匹配错误范围，下一跳错误会让包无法封装。',
        ],
        bullets: ['目的网段加掩码定义范围', '下一跳必须可达', '缺省路由是 0.0.0.0/0'],
      },
      {
        heading: '去程与回程的独立性',
        paragraphs: [
          '两端各自查自己的路由表，去程和回程没有绑定关系。任何一侧缺路由，端到端探测就会失败。',
          '排障要同时看两端的表，而不是只盯源端。',
        ],
      },
    ],
    proTheory: [
      {
        heading: '最长前缀匹配在静态路由中的表现',
        paragraphs: [
          '当多条静态路由都能覆盖目的地址时，掩码最长的那条优先。默认路由只有在没有更具体条目时才生效。',
          '配置静态路由时要避免过宽前缀意外覆盖更具体的业务网段。',
        ],
      },
      {
        heading: '递归下一跳与直连下一跳',
        paragraphs: [
          '下一跳可以是直连邻居，也可以先通过其他路由递归查到。递归下一跳依赖被依赖路由的存在，删除被依赖条目会连带失效。',
          '静态路由排障时要把下一跳的可达性一起验证。',
        ],
      },
      {
        heading: '单向可达的判定方法',
        paragraphs: [
          '在目标侧确认请求是否到达，再从目标侧向源侧发起探测，结合两端路由表判断缺失方向。',
          '增删可疑路由条目并复测，是验证因果关系的直接方法。',
        ],
      },
    ],
    lab: {
      platform: 'eNSP',
      devices: ['2 台 AR2220 路由器', '2 台 PC'],
      versions: '以合法可用的 VRP 镜像版本为准',
      requirements: [
        '安装 eNSP 并准备合法可用的 VRP 镜像',
        '两端 PC 使用静态地址与默认网关',
        '本实验只使用合成地址与隔离拓扑',
        '命令可能因 VRP 版本差异调整，以设备实际提示为准',
      ],
      addressing: [
        'PC-A：192.0.2.10/24，默认网关 192.0.2.1',
        'PC-B：198.51.100.20/24，默认网关 198.51.100.1',
        'R-A 接 PC-A 侧：192.0.2.1/24',
        'R-B 接 PC-B 侧：198.51.100.1/24',
        'R-A 与 R-B 互联：203.0.113.0/30，R-A 203.0.113.1，R-B 203.0.113.2',
      ],
      tasks: [
        {
          title: '配置两端地址与去程路由',
          steps: [
            '为 PC-A 与 PC-B 配置地址和默认网关。',
            '在 R-A 与 R-B 上配置直连接口地址。',
            '在 R-A 上配置到 198.51.100.0/24 的静态路由，下一跳指向 R-B。',
            '确认 R-A 路由表中出现该前缀。',
          ],
          observe: '去程路由应指向 R-B 的互联地址。',
        },
        {
          title: '补齐回程并验证双向',
          steps: [
            '在 R-B 上配置到 192.0.2.0/24 的静态路由，下一跳指向 R-A。',
            '从 PC-A ping PC-B。',
            '从 PC-B 反向 ping PC-A。',
            '记录两个方向的探测结果。',
          ],
          observe: '双向都应有路由时才能稳定互通。',
        },
        {
          title: '删除回程并观察单向超时',
          steps: [
            '在 R-B 上删除到 192.0.2.0/24 的静态路由。',
            '从 PC-A 再次 ping PC-B。',
            '从 PC-B 反向探测 PC-A。',
            '恢复回程路由后复测。',
          ],
          observe: '删除回程后 PC-A 侧超时，目标侧反向探测可能仍能到达源端。',
        },
      ],
      commands: [
        {
          title: 'R-A 接口与去程静态路由（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname R-A
interface GigabitEthernet0/0/0
 ip address 192.0.2.1 255.255.255.0
 quit
interface GigabitEthernet0/0/1
 ip address 203.0.113.1 30
 quit
ip route-static 198.51.100.0 255.255.255.0 203.0.113.2
display ip routing-table`,
        },
        {
          title: 'R-B 接口与回程静态路由（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname R-B
interface GigabitEthernet0/0/0
 ip address 203.0.113.2 30
 quit
interface GigabitEthernet0/0/1
 ip address 198.51.100.1 255.255.255.0
 quit
ip route-static 192.0.2.0 255.255.255.0 203.0.113.1
display ip routing-table
undo ip route-static 192.0.2.0 255.255.255.0 203.0.113.1
display ip routing-table`,
        },
      ],
      verification: [
        'R-A 路由表出现 198.51.100.0/24，下一跳为 203.0.113.2。',
        'R-B 路由表出现 192.0.2.0/24，下一跳为 203.0.113.1。',
        'PC-A 与 PC-B 双向 ping 均成功。',
        '删除 R-B 回程路由后，PC-A 侧超时而 R-B 本地仍有到源网段的失败证据。',
      ],
      expected: [
        '双向静态路由齐全时，两端互通稳定。',
        '删除回程后，请求能到达目标但回复无法返回。',
        '恢复回程条目后连通性恢复。',
      ],
      faults: [
        '只配置去程静态路由，遗漏回程。',
        '静态路由掩码或下一跳写错。',
        'PC 默认网关未配置或网关地址不在本网段。',
        '互联接口地址不在同一网段。',
      ],
      recovery: [
        '在目标侧补回到源网段的静态路由。',
        '核对目的前缀、掩码与下一跳并修正。',
        '确认两端 PC 网关与互联接口地址正确。',
      ],
      status: 'guide-only',
      statusNote,
      sources: [docSources.rfc791, docSources.rfc1812, docSources.rfc1122, docSources.rfc5737, docSources.huawei],
    },
    challenges: [
      {
        id: 'l3-static-return-c1',
        kind: 'choice',
        prompt: '源端能 ping 通网关，但 ping 不通远端主机。仅凭这个现象能判定去程成功吗？',
        hint: 'ping 通网关只证明到第一跳。',
        options: [
          {
            id: 'l3-static-return-c1-a',
            label: '能，网关通就代表去程全通',
            correct: false,
            explanation: '到网关成功只覆盖第一跳，后续逐跳与回程尚未验证。',
          },
          {
            id: 'l3-static-return-c1-b',
            label: '不能，还需逐跳与回程证据',
            correct: true,
            explanation: '需要确认后续路由器有目标路由，且目标侧有回程路由。',
          },
          {
            id: 'l3-static-return-c1-c',
            label: '能，只要网关在线就够',
            correct: false,
            explanation: '网关在线不等于它知道目标网段怎么走。',
          },
        ],
        explanation: '到网关成功只证明第一跳，去程全程与回程都要分别验证。',
      },
      {
        id: 'l3-static-return-c2',
        kind: 'open',
        prompt: '去程可达但源端超时，你会先查哪张表，为什么？',
        hint: '先确认请求是否到达目标，再看目标侧回程。',
        explanation:
          '先查目标侧路由器与主机的路由表，确认是否有回到源网段的路由，同时核对目标主机默认网关。若目标侧缺回程条目，请求即使到达也无法回复，源端就会看到超时。',
      },
    ],
    summary: [
      '主机跨网段先交给默认网关，网关必须同网段可达。',
      '静态路由由目的前缀、掩码和下一跳组成。',
      '去程与回程独立选路，必须两端分别检查。',
      '单向超时的常见原因是目标侧缺少回程路由。',
    ],
    misconceptions: [
      {
        wrong: '能 ping 通网关就说明去程没问题。',
        right: '网关只是第一跳，后续每台路由器和回程都要验证。',
      },
      {
        wrong: '只要源端有路由，业务就能通。',
        right: '目标侧也必须知道如何回到源网段。',
      },
      {
        wrong: '静态路由会自动生成反向条目。',
        right: '静态路由需要人工在两端分别配置。',
      },
    ],
    sources: [docSources.rfc791, docSources.rfc1812, docSources.rfc1122, docSources.rfc5737, docSources.huawei],
    publicationStatus: 'published',
  },
  {
    id: 'l3-ospf-convergence',
    title: 'OSPF 邻居到收敛：路由是怎么被算出来的',
    question: '邻居 Full 了，为什么业务还可能不通？',
    level: 'L3',
    minutes: 50,
    goals: [
      '描述 OSPF 从 Hello 建立邻居、交换 LSA 到 LSDB 同步的过程。',
      '解释 SPF 如何算出最短路径并写入路由表，再影响转发。',
      '区分邻居状态 Full 与端到端业务可达这两个不同层次的结论。',
      '在链路故障后观察邻居、LSDB 与路由表的收敛变化。',
    ],
    prerequisites: ['l3-static-return'],
    topicIds: ['ospf', 'lsa', 'spf', 'convergence'],
    topologyId: 'topo-l3-ospf',
    steps: [
      {
        id: 'l3-ospf-convergence-s1',
        title: 'Hello 先建立邻居',
        plainText:
          '两台路由器先在接口上互相发送 Hello，确认网段、区域和参数匹配，才会进入邻居关系。参数不一致时连邻居都建不起来。',
        professionalText:
          'Hello 报文携带路由器标识、区域号、Hello/Dead 定时器与网络掩码等信息。双方参数匹配后才继续推进邻居状态。',
        focusNodeIds: ['r-a', 'r-b'],
        focusEdgeIds: ['ospf-a-b'],
        evidenceText: '在真实实验里看邻居状态是否从 Init 推进到 Full，并核对区域与定时器参数。',
        directionHints: ['先发 Hello', '参数匹配才建邻'],
      },
      {
        id: 'l3-ospf-convergence-s2',
        title: 'LSA 描述拓扑，LSDB 汇总',
        plainText:
          '邻居建立后，路由器互相交换链路状态通告。每台设备都维护一份链路状态数据库，里面记录着网络中的链路与网段。',
        professionalText:
          'LSA 描述路由器、网络与外部路由等信息，LSDB 是同一区域内 LSA 的集合。只有 LSDB 同步，SPF 才有完整输入。',
        focusNodeIds: ['r-b', 'r-c'],
        focusEdgeIds: ['ospf-b-c'],
        evidenceText: '在真实实验里看 LSDB 中的 LSA 类型与数量，确认三台路由器的数据库内容一致。',
        directionHints: ['交换 LSA', '同步 LSDB'],
      },
      {
        id: 'l3-ospf-convergence-s3',
        title: 'SPF 算出最短路径与下一跳',
        plainText:
          '每台路由器以自己为根，用 SPF 算法算到各网段的最短路径，得出下一跳和开销，再写入路由表。',
        professionalText:
          'SPF 以 LSDB 为输入构造最短路径树，计算结果包含目的地、下一跳与度量。度量越小越优先，最终形成 OSPF 路由条目。',
        focusNodeIds: ['r-a', 'r-c'],
        focusEdgeIds: ['ospf-c-a'],
        evidenceText: '在真实实验里看路由表中 OSPF 路由的下一跳与开销，确认与拓扑最短路径一致。',
        directionHints: ['以自己为根', '算最短路径'],
      },
      {
        id: 'l3-ospf-convergence-s4',
        title: '路由表最终要落到转发',
        plainText:
          '路由表里的条目只有被转发平面采用，才会真正影响数据包。路由存在但下一跳不可达，业务仍然不通。',
        professionalText:
          '路由表条目需要有效下一跳与出接口才能进入转发。递归下一跳依赖底层路由，底层失效时上层路由也会失效。',
        focusNodeIds: ['pc-a', 'r-a'],
        focusEdgeIds: ['ospf-pc-a'],
        evidenceText: '在真实实验里看路由表中的下一跳是否可达，且终端网关指向正确的路由器接口。',
        directionHints: ['路由要可转发', '下一跳必须可达'],
      },
      {
        id: 'l3-ospf-convergence-s5',
        title: '链路故障触发重新收敛',
        plainText:
          '一条链路断开后，邻居关系会变化，相关 LSA 被更新，路由器重新跑 SPF，路由表切换到备用路径。',
        professionalText:
          '链路故障导致邻居状态变化与 LSA 更新，LSDB 重新同步后触发 SPF 计算。收敛期间可能出现短暂路由缺失或次优路径。',
        focusNodeIds: ['r-b', 'r-c'],
        focusEdgeIds: ['ospf-b-c', 'ospf-c-a'],
        evidenceText: '在真实实验里观察断开三角中的一条链路后，观察邻居状态、LSDB 变化与路由表下一跳切换。',
        directionHints: ['断链触发更新', '观察下一跳切换'],
      },
      {
        id: 'l3-ospf-convergence-s6',
        title: 'Full 只说明邻居，不说明业务',
        plainText:
          '邻居 Full 表示两台路由器交换完了链路状态信息，但业务通不通还要看路由是否学到、下一跳是否可达、目标侧是否有回程。',
        professionalText:
          '邻居状态反映控制面关系，业务可达还依赖路由表、转发面与目标侧回程。Full 与业务可达是两个层次的结论。',
        focusNodeIds: ['srv-b', 'r-c'],
        focusEdgeIds: ['ospf-srv-c', 'ospf-c-a'],
        evidenceText: '在真实实验里同时看邻居状态、路由表与端到端探测，确认三者是否一致。',
        directionHints: ['控制面与转发面分开', '业务单独验证'],
      },
    ],
    why: [
      {
        heading: '为什么邻居 Full 仍可能不通',
        paragraphs: [
          'Full 只代表两台路由器完成了链路状态数据库同步。路由是否被算出、下一跳是否可达、目标侧是否有回程，都是另外的条件。',
          '把控制面状态当成业务状态，是 OSPF 排障里常见的误判。',
        ],
      },
      {
        heading: '为什么要理解 LSA 与 SPF 的关系',
        paragraphs: [
          'LSA 是拓扑的描述，LSDB 是描述的总和，SPF 是基于这些描述的最短路径计算。任何一步不完整，路由结果都会偏离预期。',
          '知道这个链条，才能判断问题出在邻居、数据库还是路由计算。',
        ],
      },
    ],
    theory: [
      {
        heading: 'Hello 与邻居状态',
        paragraphs: [
          'Hello 报文用于发现邻居并维持关系，携带区域号、定时器与网络掩码等参数。参数不匹配会导致邻居无法建立。',
          '邻居状态从 Init 到 Full 的过程，反映双方数据库同步的进度。',
        ],
      },
      {
        heading: 'LSA 与 LSDB',
        paragraphs: [
          'LSA 描述路由器、网络、汇总和外部路由等信息。同一区域内所有路由器维护一致的 LSDB。',
          'LSDB 不一致时，各台设备算出的最短路径树也会不同。',
        ],
        bullets: ['LSA 描述拓扑', 'LSDB 汇总 LSA', '同区域应保持一致'],
      },
      {
        heading: 'SPF 与路由表',
        paragraphs: [
          'SPF 以本地路由器为根计算最短路径树，得到目的网段的下一跳与开销。计算结果写入路由表。',
          '路由表条目还需要有效下一跳才能进入转发。',
        ],
      },
    ],
    proTheory: [
      {
        heading: '区域与 LSA 泛洪边界',
        paragraphs: [
          'OSPF 用区域划分泛洪范围，同一区域内的路由器保持相同的拓扑数据库。跨区域路由由边界路由器汇总或转发。',
          '区域号不一致会导致邻居无法建立，这是 Full 不起来的常见原因。',
        ],
      },
      {
        heading: '收敛时间与次优路径',
        paragraphs: [
          '链路故障后，邻居状态变化与 LSA 更新需要时间传播，SPF 重新计算也会占用资源。收敛期间业务可能短暂中断或走次优路径。',
          '快速检测机制可以缩短故障发现时间，但不会改变 SPF 的基本过程。',
        ],
      },
      {
        heading: 'Full 与业务可达的边界',
        paragraphs: [
          'Full 是控制面结论，业务可达还要求路由存在、下一跳可达、转发正常并且目标侧有回程。',
          '排障时要把邻居、LSDB、路由表与端到端探测四条证据放在一起看。',
        ],
      },
    ],
    lab: {
      platform: 'eNSP',
      devices: ['3 台 AR2220 路由器', '1 台 PC', '1 台 Server'],
      versions: '以合法可用的 VRP 镜像版本为准',
      requirements: [
        '安装 eNSP 并准备合法可用的 VRP 镜像',
        '三台路由器组成三角拓扑，运行单区域 OSPF',
        'PC 与服务器使用静态地址与默认网关',
        '命令可能因 VRP 版本差异调整，以设备实际提示为准',
      ],
      addressing: [
        'PC 网段：192.0.2.0/24，PC 192.0.2.10，网关 192.0.2.1',
        '服务网段：198.51.100.0/24，服务器 198.51.100.20，网关 198.51.100.1',
        'R-A 与 R-B 互联：203.0.113.4/30，R-A 203.0.113.5，R-B 203.0.113.6',
        'R-A 与 R-C 互联：203.0.113.8/30，R-A 203.0.113.9，R-C 203.0.113.10',
        'R-B 与 R-C 互联：203.0.113.12/30，R-B 203.0.113.13，R-C 203.0.113.14',
        'R-A 接 PC 侧：192.0.2.1/24，R-C 接服务侧：198.51.100.1/24',
      ],
      tasks: [
        {
          title: '配置接口地址与单区域 OSPF',
          steps: [
            '为三台路由器配置三角互联接口地址。',
            '为 R-A 与 R-C 配置终端侧接口地址。',
            '在三台路由器上启用 OSPF 进程并划入同一区域。',
            '把直连网段通过 network 命令宣告进 OSPF。',
          ],
          observe: '三台路由器的邻居关系应逐步建立。',
        },
        {
          title: '核对邻居、LSDB 与路由',
          steps: [
            '查看每台路由器的邻居状态。',
            '查看 LSDB 中的 LSA 类型与数量。',
            '查看路由表中 OSPF 路由的下一跳与开销。',
            '从 PC ping 服务器验证业务可达。',
          ],
          observe: '邻居应为 Full，路由表中应出现对端业务网段。',
        },
        {
          title: '断开三角链路观察收敛',
          steps: [
            '记录当前 PC 到服务器的路径与下一跳。',
            '断开 R-B 与 R-C 之间的链路。',
            '查看邻居状态与 LSDB 变化。',
            '再次查看路由表并复测业务。',
          ],
          observe: '路由应切换到另一条可达路径，业务短暂中断后恢复。',
        },
      ],
      commands: [
        {
          title: 'R-A 接口与 OSPF 配置（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname R-A
interface GigabitEthernet0/0/0
 ip address 192.0.2.1 255.255.255.0
 quit
interface GigabitEthernet0/0/1
 ip address 203.0.113.5 30
 quit
interface GigabitEthernet0/0/2
 ip address 203.0.113.9 30
 quit
ospf 1 router-id 203.0.113.5
 area 0
  network 192.0.2.0 0.0.0.255
  network 203.0.113.4 0.0.0.3
  network 203.0.113.8 0.0.0.3
 quit
quit
display ospf peer
display ospf lsdb
display ip routing-table`,
        },
        {
          title: 'R-B 与 R-C 的 OSPF 配置（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
sysname R-B
interface GigabitEthernet0/0/0
 ip address 203.0.113.6 30
 quit
interface GigabitEthernet0/0/1
 ip address 203.0.113.13 30
 quit
ospf 1 router-id 203.0.113.6
 area 0
  network 203.0.113.4 0.0.0.3
  network 203.0.113.12 0.0.0.3
 quit
quit
display ospf peer
display ip routing-table

system-view
sysname R-C
interface GigabitEthernet0/0/0
 ip address 203.0.113.10 30
 quit
interface GigabitEthernet0/0/1
 ip address 203.0.113.14 30
 quit
interface GigabitEthernet0/0/2
 ip address 198.51.100.1 255.255.255.0
 quit
ospf 1 router-id 203.0.113.10
 area 0
  network 203.0.113.8 0.0.0.3
  network 203.0.113.12 0.0.0.3
  network 198.51.100.0 0.0.0.255
 quit
quit
display ospf peer
display ospf lsdb
display ip routing-table`,
        },
        {
          title: '故障注入与恢复（VRP，命令随版本可能调整）',
          language: 'text',
          code: `system-view
interface GigabitEthernet0/0/1
 shutdown
 quit
display ospf peer
display ip routing-table
interface GigabitEthernet0/0/1
 undo shutdown
 quit
display ospf peer
display ip routing-table`,
        },
      ],
      verification: [
        '三台路由器的邻居状态均应达到 Full。',
        'LSDB 中可以看到区域内各路由器与网段的 LSA。',
        'R-A 路由表出现 198.51.100.0/24，R-C 路由表出现 192.0.2.0/24。',
        'PC 能 ping 通服务器。',
        '断开一条链路后路由下一跳切换，业务恢复。',
      ],
      expected: [
        '单区域 OSPF 正常时邻居 Full，业务网段互相可达。',
        '断开三角一侧后，路由改走另一条路径。',
        '恢复链路后邻居重新建立，路由回到稳定状态。',
      ],
      faults: [
        '接口地址不在同一网段导致邻居无法建立。',
        '区域号或 Hello 参数不一致。',
        'network 命令宣告范围错误，导致网段未被通告。',
        '邻居 Full 但目标侧缺少业务网段路由。',
      ],
      recovery: [
        '核对互联接口地址与掩码。',
        '统一区域号与定时器参数。',
        '修正 network 宣告范围并确认路由表出现目标前缀。',
      ],
      status: 'guide-only',
      statusNote,
      sources: [docSources.rfc2328, docSources.rfc5737, docSources.huawei, docSources.nist800115, docSources.rfc3849],
    },
    challenges: [
      {
        id: 'l3-ospf-convergence-c1',
        kind: 'choice',
        prompt: '邻居显示 Full，但业务仍不通。最可能的原因是哪一类？',
        hint: 'Full 属于控制面，业务还依赖路由与转发。',
        options: [
          {
            id: 'l3-ospf-convergence-c1-a',
            label: 'Hello 定时器不一致',
            correct: false,
            explanation: '定时器不一致通常导致邻居建不起来，而不是 Full 后业务不通。',
          },
          {
            id: 'l3-ospf-convergence-c1-b',
            label: '业务网段未宣告或下一跳不可达',
            correct: true,
            explanation: '邻居 Full 只说明数据库同步，业务网段没有进入路由或下一跳失效仍会不通。',
          },
          {
            id: 'l3-ospf-convergence-c1-c',
            label: '路由器型号不同',
            correct: false,
            explanation: '型号差异不是业务不通的直接原因。',
          },
        ],
        explanation: '先查路由表是否出现目标前缀，再查下一跳与目标侧回程。',
      },
      {
        id: 'l3-ospf-convergence-c2',
        kind: 'open',
        prompt: '三角拓扑断开一条链路后，你会先看什么，按什么顺序判断是否收敛完成？',
        hint: '控制面、数据库、路由表、业务四步。',
        explanation:
          '先看邻居状态是否变化并重新建立，再看 LSDB 是否更新出新的拓扑描述，然后看路由表下一跳是否切换到备用路径，最后用端到端探测确认业务恢复。四步都符合预期，才能判断收敛完成。',
      },
    ],
    summary: [
      'OSPF 先通过 Hello 建立邻居，再交换 LSA 同步 LSDB。',
      'SPF 以本地为根计算最短路径，结果写入路由表。',
      '链路故障触发 LSA 更新与 SPF 重算，收敛期间可能短暂中断。',
      '邻居 Full 只说明控制面同步，业务可达还要看路由、下一跳与回程。',
    ],
    misconceptions: [
      {
        wrong: '邻居 Full 就代表业务一定通。',
        right: 'Full 只说明数据库同步，业务还依赖路由、转发和目标侧回程。',
      },
      {
        wrong: 'OSPF 会自动解决所有网段宣告问题。',
        right: '未宣告或宣告范围错误的网段不会出现在 LSDB 和路由表中。',
      },
      {
        wrong: '断链后路由立即切换完成。',
        right: '需要邻居检测、LSA 更新与 SPF 重算，期间可能短暂中断。',
      },
    ],
    sources: [docSources.rfc2328, docSources.rfc5737, docSources.huawei, docSources.nist800115, docSources.rfc3849],
    publicationStatus: 'published',
  },
]