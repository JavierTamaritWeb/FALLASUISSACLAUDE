const { test, expect } = require('@playwright/test');

for (const pagePath of ['/index.html', '/ofrenda.html']) {
  test(`${pagePath} usa markup de vídeo endurecido para Safari`, async ({ page }) => {
    await page.goto(pagePath);

    for (const selector of ['#videoOfrenda', '#videoOfrendaFs']) {
      const video = page.locator(selector);
      const source = video.locator('source[type="video/mp4"]');

      await expect(video).toHaveAttribute('preload', 'none');
      await expect(video).toHaveAttribute('poster', /ofrenda-2026-001\.jpeg$/);
      await expect(video).not.toHaveAttribute('src', /.+/);
      await expect(source).toHaveAttribute('src', /ofrenda-2026\.mp4$/);
    }

    await expect(page.locator('#videoOfrendaStatus')).toHaveAttribute('hidden', '');
    await expect(page.locator('#videoOfrendaFsStatus')).toHaveAttribute('hidden', '');
  });
}

test('index.html publica los iconos TikTok saneados en la CSS compilada', async ({ page }) => {
  await page.goto('/index.html');

  const cssContent = await page.evaluate(async () => {
    const mainStylesheet = Array.from(document.styleSheets)
      .map((sheet) => sheet.href)
      .find((href) => href && href.includes('/css/main.css'));

    if (!mainStylesheet) {
      return '';
    }

    const response = await fetch(mainStylesheet, { cache: 'no-store' });
    return response.text();
  });

  expect(cssContent).toContain('icono_tiktok1-v2.svg');
  expect(cssContent).toContain('icono_tiktok-v2.svg');
  expect(cssContent).toContain('.sociales__enlace[href*="tiktok.com"]:hover:before');
});