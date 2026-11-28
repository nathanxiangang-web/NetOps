import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

interface Box {
  x: number
  y: number
  width: number
  height: number
}

function overlaps(left: Box, right: Box): boolean {
  return (
    left.x < right.x + right.width &&
    right.x < left.x + left.width &&
    left.y < right.y + right.height &&
    right.y < left.y + left.height
  )
}

async function boundingBoxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  expect(box, '元素应已渲染并具有 boundingBox').not.toBeNull()
  return box as Box
}

async function readZoomPercent(page: Page): Promise<number> {
  const text = await page.locator('.flow-zoom').textContent()
  const matched = text?.match(/(\d+)%/)
  expect(matched, `无法从 "${text ?? ''}" 读取缩放比例`).not.toBeNull()
  return Number(matched?.[1] ?? '0')
}

async function dragConnection(page: Page, source: Locator, target: Locator): Promise<void> {
  const sourceBox = await boundingBoxOf(source)
  const targetBox = await boundingBoxOf(target)
  const start = { x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2 }
  const end = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 12, start.y, { steps: 3 })
  await page.mouse.move(end.x, end.y, { steps: 16 })
  await page.mouse.up()
}

async function readFirstNodePosition(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const canvasKey = Object.keys(localStorage).find((key) => key.startsWith('netops.canvas.v1.'))
    if (!canvasKey) throw new Error('未找到本地画布数据')
    const raw = localStorage.getItem(canvasKey)
    if (!raw) throw new Error('画布数据为空')
    const canvas = JSON.parse(raw) as { nodes: { position: { x: number; y: number } }[] }
    return canvas.nodes[0].position
  })
}

test('编辑画布：网格放置、手动连线、备注持久化', async ({ page }) => {
  await page.goto('/#/canvas')
  await page.getByRole('button', { name: '新建空白画布', exact: true }).click()
  await expect(page).toHaveURL(/#\/canvas\/canvas-/)

  const canvas = page.locator('.netops-flow-canvas')
  await expect(canvas).toBeVisible()

  await page.getByRole('button', { name: '添加 路由器', exact: true }).click()
  await page.getByRole('button', { name: '添加 终端 / PC', exact: true }).click()

  const nodes = page.locator('.vue-flow__node')
  await expect(nodes).toHaveCount(2)

  const firstBox = await boundingBoxOf(nodes.nth(0))
  const secondBox = await boundingBoxOf(nodes.nth(1))
  const nodeOverlap = overlaps(firstBox, secondBox)
  expect(nodeOverlap, '两个节点 boundingBox 不应重叠').toBe(false)

  const sourceHandles = page.locator('.vue-flow__handle.source')
  const targetHandles = page.locator('.vue-flow__handle.target')
  await expect(sourceHandles).toHaveCount(2)
  await expect(targetHandles).toHaveCount(2)
  for (let index = 0; index < 2; index += 1) {
    await expect(sourceHandles.nth(index)).toBeVisible()
    await expect(targetHandles.nth(index)).toBeVisible()
  }

  const zoom = await readZoomPercent(page)
  expect(zoom, '新增节点后不应把初始缩放 fit 到 1.8').toBeLessThanOrEqual(115)
  console.log(
    `[canvas] 添加后 nodes=${await nodes.count()} bbox1=${JSON.stringify(firstBox)} bbox2=${JSON.stringify(secondBox)} overlap=${nodeOverlap} zoom=${zoom}%`,
  )

  const edges = page.locator('.vue-flow__edge')
  await expect(edges).toHaveCount(0)
  await dragConnection(page, sourceHandles.nth(0), targetHandles.nth(1))
  await expect(edges).toHaveCount(1)
  console.log(`[canvas] 手动 Handle 拖动后 edges=${await edges.count()}`)

  await nodes.nth(0).click()
  const noteField = page.getByLabel('节点备注')
  await expect(noteField).toBeVisible()
  await noteField.fill('Playwright 真实浏览器备注')
  await noteField.press('Tab')
  await expect(page.getByRole('button', { name: '立即保存画布' })).toBeVisible()
  await page.getByRole('button', { name: '立即保存画布' }).click()
  await expect(page.getByText(/已保存/)).toBeVisible()

  await page.reload()
  await expect(page.locator('.vue-flow__node')).toHaveCount(2)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(1)

  const reloadedFirst = page.locator('.vue-flow__node').nth(0)
  const reloadedSecond = page.locator('.vue-flow__node').nth(1)
  const reloadOverlap = overlaps(await boundingBoxOf(reloadedFirst), await boundingBoxOf(reloadedSecond))
  expect(reloadOverlap).toBe(false)

  await reloadedFirst.click()
  const persistedNote = await page.getByLabel('节点备注').inputValue()
  await expect(page.getByLabel('节点备注')).toHaveValue('Playwright 真实浏览器备注')
  await expect(page.locator('.note-mark')).toHaveCount(1)
  console.log(
    `[canvas] 刷新后 nodes=${await page.locator('.vue-flow__node').count()} edges=${await page.locator('.vue-flow__edge').count()} note="${persistedNote}" overlap=${reloadOverlap}`,
  )

  await page.screenshot({ path: 'test-results/visual-canvas-edit.png', fullPage: true })
})
test('编辑画布：节点拖拽仍生效并持久化位置', async ({ page }) => {
  await page.goto('/#/canvas')
  await page.getByRole('button', { name: '新建空白画布', exact: true }).click()
  await expect(page).toHaveURL(/#\/canvas\/canvas-/)

  await page.getByRole('button', { name: '添加 路由器', exact: true }).click()
  const node = page.locator('.vue-flow__node').first()
  await expect(node).toHaveCount(1)

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const canvasKey = Object.keys(localStorage).find((key) => key.startsWith('netops.canvas.v1.'))
        if (!canvasKey) return 0
        const raw = localStorage.getItem(canvasKey)
        if (!raw) return 0
        return (JSON.parse(raw) as { nodes: unknown[] }).nodes.length
      })
    })
    .toBe(1)

  const before = await readFirstNodePosition(page)
  const box = await boundingBoxOf(node)
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  await page.mouse.move(centerX, centerY)
  await page.mouse.down()
  await page.mouse.move(centerX + 80, centerY + 60, { steps: 12 })
  await page.mouse.up()

  await expect
    .poll(async () => {
      const current = await readFirstNodePosition(page)
      return current.x - before.x
    })
    .toBeGreaterThan(30)

  const afterDrag = await readFirstNodePosition(page)
  await page.reload()
  await expect(page.locator('.vue-flow__node')).toHaveCount(1)
  const afterReload = await readFirstNodePosition(page)
  expect(afterReload).toEqual(afterDrag)
  console.log(
    `[canvas] 拖拽前=${JSON.stringify(before)} 拖拽后=${JSON.stringify(afterDrag)} 刷新后=${JSON.stringify(afterReload)}`,
  )
})