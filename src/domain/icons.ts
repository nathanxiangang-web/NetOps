import ap from '@/assets/network-icons/visio/ap.png'
import certificate from '@/assets/network-icons/visio/certificate.png'
import cloud from '@/assets/network-icons/visio/cloud.png'
import controller from '@/assets/network-icons/visio/controller.png'
import desktop from '@/assets/network-icons/visio/desktop.png'
import firewall from '@/assets/network-icons/visio/firewall.png'
import gateway from '@/assets/network-icons/visio/gateway.png'
import identity from '@/assets/network-icons/visio/identity.png'
import internet from '@/assets/network-icons/visio/internet.png'
import loadBalancer from '@/assets/network-icons/visio/load-balancer.png'
import monitor from '@/assets/network-icons/visio/monitor.png'
import pc from '@/assets/network-icons/visio/pc.png'
import router from '@/assets/network-icons/visio/router.png'
import server from '@/assets/network-icons/visio/server.png'
import storage from '@/assets/network-icons/visio/storage.png'
import switchL2 from '@/assets/network-icons/visio/switch-l2.png'
import switchL3 from '@/assets/network-icons/visio/switch-l3.png'
import vm from '@/assets/network-icons/visio/vm.png'
import vpn from '@/assets/network-icons/visio/vpn.png'
import type { IconDefinition } from './types'

const source = '项目负责人提供的《最全VISIO图标集.ppt》'
const license = '项目负责人指定用于 NetOps；原始许可文本未随附'

export const iconRegistry: IconDefinition[] = [
  {
    id: 'endpoint.pc',
    deviceType: 'PC',
    labelZh: '终端 / PC',
    labelEn: 'End-user terminal',
    aliases: ['电脑', '主机', '终端', 'client', 'host'],
    category: 'terminal',
    asset: pc,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'endpoint.desktop',
    deviceType: 'CloudDesktop',
    labelZh: '云桌面终端',
    labelEn: 'Cloud desktop',
    aliases: ['云桌面', '瘦终端', 'VDI', 'desktop'],
    category: 'terminal',
    asset: desktop,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'endpoint.server',
    deviceType: 'Server',
    labelZh: '服务器',
    labelEn: 'Server',
    aliases: ['应用服务器', '数据库', 'service', 'host'],
    category: 'terminal',
    asset: server,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'endpoint.storage',
    deviceType: 'Storage',
    labelZh: '存储',
    labelEn: 'Storage',
    aliases: ['磁盘阵列', '对象存储', 'SAN', 'NAS', '备份'],
    category: 'terminal',
    asset: storage,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'device.switch.l2',
    deviceType: 'SwitchL2',
    labelZh: '二层交换机',
    labelEn: 'Layer 2 switch',
    aliases: ['接入交换机', '交换机', 'switch', 'access'],
    category: 'switching',
    asset: switchL2,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'device.switch.l3',
    deviceType: 'SwitchL3',
    labelZh: '三层交换机',
    labelEn: 'Layer 3 switch',
    aliases: ['核心交换', '汇聚交换', 'VLANIF', 'core switch'],
    category: 'switching',
    asset: switchL3,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'device.router',
    deviceType: 'Router',
    labelZh: '路由器',
    labelEn: 'Router',
    aliases: ['出口路由', '边界路由', 'router', 'PE', 'CE'],
    category: 'routing',
    asset: router,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'device.firewall',
    deviceType: 'Firewall',
    labelZh: '防火墙',
    labelEn: 'Firewall',
    aliases: ['安全网关', '安全域', 'firewall', 'FW'],
    category: 'security',
    asset: firewall,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'security.identity',
    deviceType: 'IdentityProvider',
    labelZh: '身份提供方',
    labelEn: 'Identity provider',
    aliases: ['统一认证', 'RADIUS', 'IAM', 'IdP', '认证中心'],
    category: 'security',
    asset: identity,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'security.certificate',
    deviceType: 'CertificateAuthority',
    labelZh: '证书服务',
    labelEn: 'Certificate service',
    aliases: ['CA', 'RA', '签名', '证书', 'PKI'],
    category: 'security',
    asset: certificate,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'security.vpn',
    deviceType: 'VPNAccess',
    labelZh: '安全接入',
    labelEn: 'Secure access',
    aliases: ['VPN', '远程接入', 'SSL VPN', '零信任网关'],
    category: 'security',
    asset: vpn,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'security.gateway',
    deviceType: 'CrossDomainGateway',
    labelZh: '跨域交换网关',
    labelEn: 'Cross-domain gateway',
    aliases: ['网闸', '隔离交换', '数据交换', 'gateway'],
    category: 'security',
    asset: gateway,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'cloud.internet',
    deviceType: 'Internet',
    labelZh: '互联网 / 外部云',
    labelEn: 'Internet or external cloud',
    aliases: ['互联网', '云', '运营商', 'Internet', 'WAN'],
    category: 'cloud',
    asset: internet,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'cloud.private',
    deviceType: 'PrivateCloud',
    labelZh: '私有云 / 承载云',
    labelEn: 'Private cloud',
    aliases: ['专有云', '云资源池', 'cloud'],
    category: 'cloud',
    asset: cloud,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'cloud.vm',
    deviceType: 'VirtualMachine',
    labelZh: '虚拟机 / 宿主机',
    labelEn: 'Virtual machine',
    aliases: ['虚机', '计算节点', 'VM', 'vNIC', '宿主机'],
    category: 'cloud',
    asset: vm,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'cloud.loadbalancer',
    deviceType: 'LoadBalancer',
    labelZh: '负载均衡',
    labelEn: 'Load balancer',
    aliases: ['LB', 'ADC', '应用交付', '负载'],
    category: 'cloud',
    asset: loadBalancer,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'device.ap',
    deviceType: 'AccessPoint',
    labelZh: '无线接入点',
    labelEn: 'Access point',
    aliases: ['AP', 'Wi-Fi', '无线', 'WLAN'],
    category: 'switching',
    asset: ap,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'operations.monitor',
    deviceType: 'Monitor',
    labelZh: '监控 / IDS 探针',
    labelEn: 'Monitoring probe',
    aliases: ['探针', '采集器', '镜像', 'SIEM', 'IDS', 'IPS', '观测'],
    category: 'operations',
    asset: monitor,
    source,
    license,
    version: '1.0.0',
  },
  {
    id: 'operations.controller',
    deviceType: 'Controller',
    labelZh: '控制器',
    labelEn: 'Controller',
    aliases: ['管理平台', '控制器', 'MCU', '云桌面控制器', 'SDN 控制器'],
    category: 'operations',
    asset: controller,
    source,
    license,
    version: '1.0.0',
  },
]

export const iconById = new Map(iconRegistry.map((icon) => [icon.id, icon]))

export function getIcon(iconId: string): IconDefinition {
  return iconById.get(iconId) ?? iconRegistry[0]
}

export const iconCategories: { id: IconDefinition['category']; label: string }[] = [
  { id: 'terminal', label: '终端与算力' },
  { id: 'switching', label: '交换与接入' },
  { id: 'routing', label: '路由与广域' },
  { id: 'security', label: '安全与身份' },
  { id: 'cloud', label: '云与互联网' },
  { id: 'operations', label: '观测与运维' },
]