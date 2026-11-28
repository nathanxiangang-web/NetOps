<template>
  <div class="netops-flow-shell" @dragover.prevent @drop="handleDrop">
    <VueFlow
      v-model:nodes="flowNodes"
      v-model:edges="flowEdges"
      :node-types="nodeTypes"
      :nodes-draggable="mode === 'edit'"
      :nodes-connectable="mode === 'edit'"
      :edges-updatable="false"
      :delete-key-code="null"
      :selection-key-code="false"
      :multi-selection-key-code="null"
      :min-zoom="0.25"
      :max-zoom="1.8"
      :fit-view-on-init="shouldFitViewOnInit"
      :zoom-on-double-click="false"
      :prevent-scrolling="true"
      :pan-on-scroll="false"
      :is-valid-connection="isValidConnection"
      class="netops-flow-canvas"
      :class="{
        'is-course': mode === 'course',
        'show-grid': mode === 'edit' && showGrid,
      }"
      @nodes-initialized="handleNodesInitialized"
      @node-click="handleNodeClick"
      @edge-click="handleEdgeClick"
      @pane-click="handlePaneClick"
      @node-drag-start="handleNodeDragStart"
      @node-drag-stop="handleNodeDragStop"
      @connect="handleConnect"
    />

    <div v-if="nodes.length === 0" class="netops-flow-empty">
      <strong>{{ mode === 'edit' ? '画布还是空的' : '当前拓扑暂无节点' }}</strong>
      <span>
        {{ mode === 'edit' ? '从左侧图标库点击或拖入图标，开始搭建你的网络拓扑。' : '本课程暂未提供可视化节点，可先阅读步骤与讲解。' }}
      </span>
    </div>

    <div class="netops-flow-toolbar" role="toolbar" aria-label="画布视图控制">
      <button class="flow-tool" type="button" aria-label="缩小画布" title="缩小" @click="zoomIn">
        −
      </button>
      <output class="flow-zoom" aria-label="当前缩放比例">{{ zoomPercent }}%</output>
      <button class="flow-tool" type="button" aria-label="放大画布" title="放大" @click="zoomOut">
        +
      </button>
      <button class="flow-tool" type="button" aria-label="适配画布内容" title="适配" @click="fitView">
        适配
      </button>
      <button
        v-if="mode === 'edit'"
        class="flow-tool"
        :class="{ 'is-on': showGrid }"
        type="button"
        aria-label="切换网格背景"
        :aria-pressed="showGrid"
        title="网格"
        @click="showGrid = !showGrid"
      >
        网格
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, ref, watch } from 'vue'
import { MarkerType, VueFlow, useVueFlow } from '@vue-flow/core'
import type {
  Connection,
  Edge as FlowEdge,
  EdgeMouseEvent,
  Node as FlowNode,
  NodeDragEvent,
  NodeMouseEvent,
  ValidConnectionFunc,
  ViewportTransform,
} from '@vue-flow/core'
import NetworkNode from '@/components/NetworkNode.vue'
import ZoneNode from '@/components/ZoneNode.vue'
import type { TopologyEdge, TopologyNode, TopologyZone } from '@/domain/types'

interface NetworkNodeData {
  iconId: string
  label: string
  role: string
  ip?: string
  note?: string
  isActive: boolean
  isSelected: boolean
  mode: 'course' | 'edit'
}

interface ZoneNodeData {
  label: string
  tone?: TopologyZone['tone']
}

const props = withDefaults(
  defineProps<{
    topologyId: string
    nodes: TopologyNode[]
    edges: TopologyEdge[]
    zones?: TopologyZone[]
    mode: 'course' | 'edit'
    activeNodeIds?: string[]
    activeEdgeIds?: string[]
    selectedNodeId?: string
    selectedEdgeId?: string
    fitViewPadding?: number
  }>(),
  {
    zones: () => [],
    activeNodeIds: () => [],
    activeEdgeIds: () => [],
    selectedNodeId: undefined,
    selectedEdgeId: undefined,
    fitViewPadding: 0.18,
  },
)

const emit = defineEmits<{
  (event: 'node-select', id: string): void
  (event: 'edge-select', id: string): void
  (event: 'pane-click'): void
  (event: 'node-move', payload: { id: string; position: { x: number; y: number } }): void
  (event: 'connect', payload: { source: string; target: string }): void
  (event: 'node-drop', payload: { iconId: string; x: number; y: number }): void
}>()

const nodeTypes = {
  network: markRaw(NetworkNode),
  zone: markRaw(ZoneNode),
}

const FIT_VIEW_MAX_ZOOM = 1.15

const api = useVueFlow()
const flowNodes = ref<FlowNode[]>([])
const flowEdges = ref<FlowEdge[]>([])
const draggingNodeId = ref<string | null>(null)
const showGrid = ref(props.mode === 'edit')

const initialNodeCount = props.nodes.length
const shouldFitViewOnInit = computed(() => props.mode === 'course' || initialNodeCount > 0)
const didAutoFit = ref(false)

const zoomPercent = computed(() => Math.round((api.viewport.value.zoom || 1) * 100))

const isValidConnection: ValidConnectionFunc = (connection: Connection) => connection.source !== connection.target

function zoneNodeId(zoneId: string): string {
  return `__zone__${zoneId}`
}

function buildNodes(resetPositions: boolean): FlowNode[] {
  const previous = new Map(flowNodes.value.map((node) => [node.id, node]))
  const activeNodes = new Set(props.activeNodeIds ?? [])
  const hasActive = activeNodes.size > 0
  const result: FlowNode[] = []

  for (const zone of props.zones ?? []) {
    result.push({
      id: zoneNodeId(zone.id),
      type: 'zone',
      position: { x: zone.x, y: zone.y },
      width: zone.width,
      height: zone.height,
      draggable: false,
      selectable: false,
      connectable: false,
      focusable: false,
      deletable: false,
      zIndex: -2,
      class: 'netops-zone-wrapper',
      ariaLabel: `区域：${zone.label}`,
      data: { label: zone.label, tone: zone.tone ?? 'default' } satisfies ZoneNodeData,
    })
  }

  for (const node of props.nodes) {
    const previousNode = resetPositions ? undefined : previous.get(node.id)
    const isDragging = draggingNodeId.value === node.id || Boolean((previousNode as { dragging?: boolean } | undefined)?.dragging)
    const isActive = activeNodes.has(node.id)
    const isSelected = props.selectedNodeId === node.id
    result.push({
      id: node.id,
      type: 'network',
      position: isDragging && previousNode ? { ...previousNode.position } : { ...node.position },
      draggable: props.mode === 'edit',
      selectable: true,
      connectable: props.mode === 'edit',
      focusable: true,
      deletable: false,
      zIndex: isActive || isSelected ? 1 : 0,
      class: hasActive && !isActive ? 'is-dimmed' : '',
      ariaLabel: [node.label, node.role, node.ip ?? '', isActive ? '当前步骤' : '']
        .filter((part) => part.trim() !== '')
        .join('，'),
      data: {
        iconId: node.iconId,
        label: node.label,
        role: node.role,
        ip: node.ip,
        note: node.note,
        isActive,
        isSelected,
        mode: props.mode,
      } satisfies NetworkNodeData,
    })
  }

  return result
}

function buildEdges(): FlowEdge[] {
  const activeEdges = new Set(props.activeEdgeIds ?? [])
  const hasActive = activeEdges.size > 0
  return props.edges.map((edge) => {
    const direction = edge.direction ?? 'none'
    const isActive = activeEdges.has(edge.id)
    const isSelected = props.selectedEdgeId === edge.id
    const markerColor = isActive ? '#38d4ff' : '#7f9ab3'
    const classes = ['netops-edge']
    if (isActive) classes.push('is-active')
    if (isSelected) classes.push('is-selected')
    if (hasActive && !isActive) classes.push('is-dimmed')

    const nextEdge: FlowEdge = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      label: edge.label && edge.label.trim() !== '' ? edge.label : undefined,
      labelShowBg: true,
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 4,
      selectable: true,
      focusable: true,
      deletable: false,
      updatable: false,
      animated: false,
      interactionWidth: 18,
      class: classes,
      ariaLabel: edge.label ?? `${edge.source} 到 ${edge.target}`,
      data: { kind: edge.kind, direction, note: edge.note },
    }

    if (direction === 'forward') {
      nextEdge.markerEnd = { type: MarkerType.ArrowClosed, color: markerColor, width: 18, height: 18 }
    } else if (direction === 'backward') {
      nextEdge.markerStart = { type: MarkerType.ArrowClosed, color: markerColor, width: 18, height: 18 }
    }

    return nextEdge
  })
}

function syncGraph(resetPositions = false): void {
  flowNodes.value = buildNodes(resetPositions)
  flowEdges.value = buildEdges()
}

function fitWhenReady(): void {
  nextTick(() => {
    window.requestAnimationFrame(() => {
      void fitView()
    })
  })
}

function handleNodesInitialized(): void {
  if (!shouldFitViewOnInit.value || didAutoFit.value) return
  didAutoFit.value = true
  fitWhenReady()
}

function handleNodeClick(event: NodeMouseEvent): void {
  if (event.node.type === 'zone') return
  emit('node-select', event.node.id)
}

function handleEdgeClick(event: EdgeMouseEvent): void {
  emit('edge-select', event.edge.id)
}

function handlePaneClick(): void {
  emit('pane-click')
}

function handleNodeDragStart(event: NodeDragEvent): void {
  draggingNodeId.value = event.node.id
}

function handleNodeDragStop(event: NodeDragEvent): void {
  if (props.mode !== 'edit') {
    draggingNodeId.value = null
    return
  }
  emit('node-move', {
    id: event.node.id,
    position: { x: event.node.position.x, y: event.node.position.y },
  })
  draggingNodeId.value = null
}

function handleConnect(connection: Connection): void {
  if (connection.source === connection.target) return
  emit('connect', { source: connection.source, target: connection.target })
}

function screenToFlow(x: number, y: number): { x: number; y: number } {
  if (typeof api.screenToFlowCoordinate === 'function') {
    return api.screenToFlowCoordinate({ x, y })
  }
  return api.project({ x, y })
}

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  const iconId = event.dataTransfer?.getData('application/netops-icon')
  if (!iconId) return
  const point = screenToFlow(event.clientX, event.clientY)
  emit('node-drop', { iconId, x: point.x - 84, y: point.y - 52 })
}

function zoomIn(): Promise<boolean> {
  return api.zoomIn({ duration: 0 })
}

function zoomOut(): Promise<boolean> {
  return api.zoomOut({ duration: 0 })
}

function fitView(): Promise<boolean> {
  return api.fitView({ padding: props.fitViewPadding, duration: 0, maxZoom: FIT_VIEW_MAX_ZOOM })
}

function getViewport(): ViewportTransform {
  return api.getViewport()
}

function getCanvasRect(): DOMRect | null {
  return api.vueFlowRef?.value?.getBoundingClientRect() ?? null
}

function handleModeChange(mode: 'course' | 'edit'): void {
  showGrid.value = mode === 'edit'
}

watch(
  () => [props.nodes, props.edges, props.zones, props.mode, props.activeNodeIds, props.activeEdgeIds, props.selectedNodeId, props.selectedEdgeId],
  () => {
    syncGraph()
  },
  { deep: true },
)

watch(
  () => props.mode,
  (mode) => {
    handleModeChange(mode)
  },
)

watch(
  () => props.topologyId,
  () => {
    syncGraph(true)
    didAutoFit.value = false
    if (props.mode === 'course' || props.nodes.length > 0) {
      didAutoFit.value = true
      fitWhenReady()
    }
  },
)

syncGraph(true)

defineExpose({
  zoomIn,
  zoomOut,
  fitView,
  screenToFlow,
  getViewport,
  getCanvasRect,
})
</script>