import { expect, test } from '@playwright/test'

function canvasJson(title: string): string {
  const now = new Date().toISOString()
  return JSON.stringify({
    schemaVersion: 1,
    id: 'canvas-import-test',
    title,
    canvasNote: '',
    nodes: [
      {
        id: 'import-node-1',
        iconId: 'endpoint.pc',
        label: '导入终端',
        role: '业务终端',
        position: { x: 80, y: 120 },
      },
    ],
    edges: [],
    zones: [],
    createdAt: now,
    updatedAt: now,
  })
}

test('画布列表：新建、返回、复制、删除与导入校验', async ({ page }) => {
  await page.goto('/#/canvas')
  await expect(page.getByRole('heading', { name: '我的画布' })).toBeVisible()

  await page.getByRole('button', { name: '新建空白画布', exact: true }).click()
  await expect(page).toHaveURL(/#\/canvas\/canvas-/)
  await expect(page.locator('.netops-flow-canvas')).toBeVisible()

  await page.locator('.main-nav').getByRole('link', { name: '自由画布' }).click()
  await expect(page).toHaveURL(/#\/canvas$/)
  const cards = page.locator('.canvas-card')
  await expect(cards).toHaveCount(1)

  await page.getByRole('button', { name: /复制画布/ }).first().click()
  await expect(cards).toHaveCount(2)

  await page.getByRole('button', { name: /删除画布/ }).first().click()
  await expect(page.locator('.delete-confirm')).toBeVisible()
  await page.getByRole('button', { name: /确认删除画布/ }).click()
  await expect(cards).toHaveCount(1)

  const fileInput = page.locator('input[type=file]')
  await fileInput.setInputFiles({
    name: 'valid-canvas.json',
    mimeType: 'application/json',
    buffer: Buffer.from(canvasJson('导入测试画布')),
  })
  await expect(page).toHaveURL(/#\/canvas\/canvas-/)
  await expect(page.locator('.netops-flow-canvas')).toBeVisible()

  await page.locator('.main-nav').getByRole('link', { name: '自由画布' }).click()
  await expect(page).toHaveURL(/#\/canvas$/)
  await expect(cards).toHaveCount(2)

  await fileInput.setInputFiles({
    name: 'invalid-canvas.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"not":"a canvas"}'),
  })
  await expect(page.locator('.app-toast.error')).toContainText('导入内容不是有效的画布 JSON')
  await expect(page).toHaveURL(/#\/canvas$/)
  await expect(cards).toHaveCount(2)
})