import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

function trackExternalRequests(page: Page): string[] {
  const external: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (!url.startsWith('http://') && !url.startsWith('https://')) return
    const parsed = new URL(url)
    if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
      external.push(url)
    }
  })
  return external
}

function readZoomPercent(text: string | null): number {
  const matched = text?.match(/(\d+)%/)
  return matched ? Number(matched[1]) : 0
}

test('课程主流程：步骤、理论、实验、挑战与复制画布', async ({ page }) => {
  const external = trackExternalRequests(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('以拓扑学网络')

  await page.getByRole('link', { name: '从第一课开始' }).first().click()
  await expect(page).toHaveURL(/#\/learn\/l1-ping-path$/)

  await expect(page.locator('h1.course-title')).toHaveText('为什么链路都 Up，Ping 仍可能失败？')
  const stepMark = page.locator('.step-mark')
  await expect(stepMark).toContainText('STEP')
  await expect(stepMark).toContainText('01')

  const stepTitle = page.locator('.step-title')
  await expect(stepTitle).toHaveText('先判断同网段还是跨网段')

  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await expect(stepTitle).toHaveText('AR 找的是网关，不是远端主机')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await expect(stepTitle).toHaveText('交换机只按 MAC 学习和转发')
  await expect(stepMark).toContainText('03')
  await expect(page.locator('.vue-flow__node .active-tag').first()).toBeVisible()

  await page.getByRole('tab', { name: '专业理论' }).click()
  const detailPanel = page.locator('.detail-panel')
  await expect(detailPanel.getByRole('heading', { name: '专业理论' })).toBeVisible()
  await expect(detailPanel).toContainText('最长前缀匹配')

  await page.getByRole('tab', { name: '外部实验' }).click()
  await expect(detailPanel).toContainText('文档指导，尚未实机')
  const commandDetails = detailPanel.locator('details.lab-details').filter({ hasText: '命令参考' })
  await expect(commandDetails).toBeVisible()
  await commandDetails.locator('summary').click()
  await expect(commandDetails.getByRole('button', { name: '复制命令' }).first()).toBeVisible()

  await page.getByRole('tab', { name: '挑战' }).click()
  const challenge = detailPanel.locator('.challenge-card').first()
  await expect(challenge).toBeVisible()
  await challenge.locator('.challenge-option').first().click()
  await challenge.getByRole('button', { name: '提交答案' }).click()
  await expect(challenge.locator('.challenge-explanations')).toBeVisible()
  await expect(challenge.locator('.challenge-explanation').first()).toBeVisible()

  await page.getByRole('button', { name: '复制为我的画布' }).first().click()
  await expect(page).toHaveURL(/#\/canvas\/canvas-/)
  await expect(page.locator('.netops-flow-canvas')).toBeVisible()

  expect(external, `页面不应访问外部网络：${external.join(', ')}`).toEqual([])
})

test('全屏看图：zoom 可读、Esc 关闭并归还焦点', async ({ page }) => {
  const external = trackExternalRequests(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#/learn/l1-ping-path')

  const trigger = page.getByRole('button', { name: '全屏看图' })
  await expect(trigger).toBeVisible()
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: '一次 Ping 的完整旅程' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.vue-flow__node').first()).toBeVisible()

  const nodeCount = await dialog.locator('.vue-flow__node').count()
  expect(nodeCount).toBeGreaterThan(0)

  const zoomReadout = dialog.locator('.flow-zoom')
  await expect(zoomReadout).toBeVisible()
  await expect
    .poll(async () => readZoomPercent(await zoomReadout.textContent()), {
      message: '全屏画布 fitView 后 zoom 应大于 80%',
    })
    .toBeGreaterThan(80)

  const zoom = readZoomPercent(await zoomReadout.textContent())
  console.log(`[course] lightbox nodes=${nodeCount} zoom=${zoom}%`)
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'test-results/visual-course-fullscreen.png' })

  await dialog.getByRole('button', { name: '下一步' }).click()
  await expect(dialog.locator('.course-lightbox-step')).toContainText('STEP 02')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(page.locator('.step-title')).toHaveText('AR 找的是网关，不是远端主机')

  expect(external, `页面不应访问外部网络：${external.join(', ')}`).toEqual([])
})

test('首页新会话默认深色主题（1440x1000）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.screenshot({ path: 'test-results/visual-home-dark.png' })
})