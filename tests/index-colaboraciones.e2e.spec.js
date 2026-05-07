const { test, expect } = require('@playwright/test');

async function expectHopeCopy(section, { minUsageRatio = 0.78 } = {}) {
  await expect(section.locator('.colaboraciones-page__logo')).toBeVisible();
  await expect(section.locator('.colaboraciones-page__texto p').nth(1)).toBeVisible();

  const copyMetrics = await section.locator('.colaboraciones-page__intro').evaluate((intro) => {
    const parent = intro.parentElement;
    const mosaic = parent?.querySelector('.colaboraciones-mosaic');
    const text = intro.querySelector('.colaboraciones-page__texto');
    const paragraphs = text ? Array.from(text.querySelectorAll('p')) : [];
    const firstParagraph = paragraphs[0] ?? null;
    const introRect = intro.getBoundingClientRect();
    const mosaicRect = mosaic?.getBoundingClientRect() ?? { width: 0 };
    const parentRect = parent?.getBoundingClientRect() ?? { width: 0 };
    const textRect = text?.getBoundingClientRect() ?? { width: 0 };
    const textStyles = text ? window.getComputedStyle(text) : null;
    const paragraphStyles = firstParagraph ? window.getComputedStyle(firstParagraph) : null;

    return {
      hasOverflow: text ? text.scrollWidth > text.clientWidth + 1 : true,
      indent: paragraphStyles?.textIndent ?? '0px',
      introWidth: Math.round(introRect.width),
      mosaicWidth: Math.round(mosaicRect.width),
      paragraphCount: paragraphs.length,
      parentWidth: Math.round(parentRect.width),
      textAlign: textStyles?.textAlign ?? '',
      textWidth: Math.round(textRect.width),
    };
  });

  expect(copyMetrics.paragraphCount).toBeGreaterThan(1);
  expect(copyMetrics.hasOverflow).toBeFalsy();
  expect(copyMetrics.textAlign).toBe('justify');
  expect(copyMetrics.indent).not.toBe('0px');
  expect(Math.abs(copyMetrics.introWidth - copyMetrics.textWidth)).toBeLessThanOrEqual(4);
  expect(Math.abs(copyMetrics.introWidth - copyMetrics.mosaicWidth)).toBeLessThanOrEqual(4);
  expect(copyMetrics.parentWidth).toBeGreaterThan(0);
  expect(copyMetrics.introWidth / copyMetrics.parentWidth).toBeGreaterThanOrEqual(minUsageRatio);
}

async function expectMosaicoHope(section) {
  await expect(section).toBeVisible();
  await expect(section.locator('.accordion')).toBeVisible();
  await expect(section.locator('.accordion__section.active')).toHaveCount(1);
  await expect(section.locator('.colaboraciones-page__logo')).toBeVisible();
  await expect(section.locator('.colaboraciones-mosaic__item')).toHaveCount(6);
  await expect(section.locator('.colaboraciones-mosaic__trigger')).toHaveCount(6);

  const mosaicMetrics = await section.locator('.colaboraciones-mosaic').evaluate((mosaic) => {
    const boxes = Array.from(mosaic.querySelectorAll('.colaboraciones-mosaic__item')).map((item) => {
      const rect = item.getBoundingClientRect();
      const image = item.querySelector('img');
      const imageStyles = image ? window.getComputedStyle(image) : null;

      return {
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        objectFit: imageStyles?.objectFit ?? '',
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      };
    });

    const heights = boxes.map((box) => box.height);
    const widths = boxes.map((box) => box.width);

    return {
      columnCount: new Set(boxes.map((box) => box.left)).size,
      hasOverflow: mosaic.scrollWidth > mosaic.clientWidth + 1,
      heightSpread: Math.max(...heights) - Math.min(...heights),
      rowCount: new Set(boxes.map((box) => box.top)).size,
      usesContain: boxes.every((box) => box.objectFit === 'contain'),
      widthSpread: Math.max(...widths) - Math.min(...widths),
    };
  });

  expect(mosaicMetrics.hasOverflow).toBeFalsy();
  expect(mosaicMetrics.columnCount).toBe(3);
  expect(mosaicMetrics.rowCount).toBe(2);
  expect(mosaicMetrics.heightSpread).toBeLessThanOrEqual(4);
  expect(mosaicMetrics.widthSpread).toBeLessThanOrEqual(4);
  expect(mosaicMetrics.usesContain).toBeTruthy();
}

async function expectLightbox(page, section, closeMode) {
  const trigger = section.locator('.colaboraciones-mosaic__trigger').first();
  const lightbox = page.locator('#colaboracionesLightbox');
  const image = lightbox.locator('.colaboraciones-lightbox__image');

  await trigger.click();

  await expect(lightbox).toHaveClass(/open/);
  await expect(lightbox).toHaveAttribute('aria-hidden', 'false');
  await expect(image).toHaveAttribute('src', /hope-001\.(jpeg|jpg)$/);
  await expect(lightbox.locator('.colaboraciones-lightbox__caption')).toContainText('Colaboración HOPE 1');

  if (closeMode === 'button') {
    await lightbox.locator('.colaboraciones-lightbox__close').click();
  }

  if (closeMode === 'escape') {
    await page.keyboard.press('Escape');
  }

  if (closeMode === 'backdrop') {
    await lightbox.click({ position: { x: 8, y: 8 } });
  }

  await expect(lightbox).not.toHaveClass(/open/);
  await expect(lightbox).toHaveAttribute('aria-hidden', 'true');
}

async function openHopeAccordion(section) {
  const accordionSection = section.locator('.accordion__section').first();
  const header = section.locator('.accordion__titular').first();
  if (!(await accordionSection.evaluate((el) => el.classList.contains('active')))) {
    await header.click();
    await expect(accordionSection).toHaveClass(/active/);
  }
}

test.describe('Colaboraciones en home', () => {
  test('index.html muestra el acordeón de colaboraciones integrado', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');

    const section = page.locator('.colaboraciones');
    // El acordeón HOPE arranca cerrado; lo abrimos para verificar el contenido.
    await openHopeAccordion(section);

    await expectMosaicoHope(section);
    await expectHopeCopy(section);
    await expectLightbox(page, section, 'button');

    const iconBox = await section.locator('.colaboraciones__imagen').boundingBox();
    expect(iconBox?.width ?? 0).toBeGreaterThan(60);
  });

  test('colaboraciones.html reutiliza el mosaico y abre el lightbox al hacer click', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/colaboraciones.html');

    const section = page.locator('main.falla');
    await openHopeAccordion(section);

    await expectMosaicoHope(section);
    await expectHopeCopy(section);
    await expectLightbox(page, section, 'escape');
  });

  test('index.html permite cerrar y reabrir el acordeón en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    const section = page.locator('.colaboraciones');
    const accordionSection = section.locator('.accordion__section').first();
    const header = section.locator('.accordion__titular').first();

    // Estado inicial: cerrado
    await expect(accordionSection).not.toHaveClass(/active/);

    // Click para abrir
    await header.click();
    await expect(accordionSection).toHaveClass(/active/);

    // Click para cerrar
    await header.click();
    await expect(accordionSection).not.toHaveClass(/active/);

    // Click para reabrir y verificar contenido
    await header.click();
    await expect(accordionSection).toHaveClass(/active/);
    await expectHopeCopy(section, { minUsageRatio: 0.9 });

    const iconBox = await section.locator('.colaboraciones__imagen').boundingBox();
    expect(iconBox?.width ?? 0).toBeGreaterThan(50);
  });
});