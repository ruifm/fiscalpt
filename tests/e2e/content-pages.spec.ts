import { test, expect } from '@playwright/test'

const CONTENT_PAGES = [
  { path: '/blog', heading: /blog/i },
  { path: '/blog/como-recuperei-10000-euros', heading: /recuper/i },
  { path: '/blog/irs-expatriados-portugal', heading: /portugal/i },
  { path: '/blog/nhr-tributacao-conjunta', heading: /nhr/i },
  { path: '/blog/taxa-efetiva-vs-marginal', heading: /pagas|irs/i },
  { path: '/guia/como-funciona-irs', heading: /irs/i },
  { path: '/guia/como-preencher-irs', heading: /preencher|irs/i },
  { path: '/guia/conjunto-vs-separado', heading: /conjunta|separada/i },
  { path: '/guia/deducoes-coleta', heading: /dedu/i },
  { path: '/guia/escaloes-irs-2025', heading: /escal/i },
  { path: '/guia/irs-jovem', heading: /jovem/i },
  { path: '/guia/recibos-verdes', heading: /recibos|verdes/i },
  { path: '/legal/termos', heading: /termos/i },
  { path: '/legal/privacidade', heading: /privacidade/i },
  { path: '/carreiras', heading: /fiscalidade|equipa/i },
]

test.describe('Content pages smoke tests', () => {
  for (const { path: pagePath, heading } of CONTENT_PAGES) {
    test(`${pagePath} loads with heading`, async ({ page }) => {
      const response = await page.goto(pagePath)
      expect(response?.status()).toBe(200)

      const h1 = page.locator('h1').first()
      await expect(h1).toBeVisible({ timeout: 10_000 })
      await expect(h1).toHaveText(heading)

      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
    })
  }
})
