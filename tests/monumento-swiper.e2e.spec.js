const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name: 'mobile', width: 360, height: 740 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'desktop', width: 1280, height: 800 }
];

async function ensureActiveImageLoaded(swiper) {
  const img = swiper.locator('.swiper-slide-active img');
  await expect(img).toBeVisible();

  // Espera a que exista un tamaño natural (evita flakiness por lazy/decoder)
  await expect
    .poll(async () => {
      return await img.evaluate(el => ({ nw: el.naturalWidth, nh: el.naturalHeight }));
    })
    .toMatchObject({ nw: expect.any(Number), nh: expect.any(Number) });

  await expect
    .poll(async () => {
      const { nw, nh } = await img.evaluate(el => ({ nw: el.naturalWidth, nh: el.naturalHeight }));
      return nw > 0 && nh > 0;
    })
    .toBe(true);

  // decode() mejora estabilidad cuando está disponible
  await img.evaluate(async el => {
    if (typeof el.decode === 'function') {
      try {
        await el.decode();
      } catch {
        // ignore
      }
    }
  });
}

async function getBox(locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('No boundingBox (element not visible?)');
  return box;
}

function boxesIntersect(a, b) {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;

  return a.x < bx2 && ax2 > b.x && a.y < by2 && ay2 > b.y;
}

function intersectionSize(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  return {
    width: Math.max(0, x2 - x1),
    height: Math.max(0, y2 - y1)
  };
}

async function expectBaseSlides(swiper, expectedSrcs) {
  const baseSlides = await swiper.locator('.swiper-slide:not(.swiper-slide-duplicate) img').evaluateAll(imgs => {
    return imgs.map(img => {
      const src = img.getAttribute('src') || '';
      return src.replace(/^\.?\//, '');
    });
  });

  expect(baseSlides).toEqual(expectedSrcs);
}

async function ensureSwiperReadyForInteraction(swiper) {
  await swiper.scrollIntoViewIfNeeded();

  await expect.poll(async () => {
    return await swiper.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
  }).toBe(true);

  await expect.poll(async () => {
    return await swiper.evaluate(el => {
      const reveal = el.closest('.reveal');
      if (!reveal || !reveal.classList.contains('reveal-ready')) {
        return true;
      }

      const style = getComputedStyle(reveal);
      const opacity = Number(style.opacity);
      const transform = style.transform;
      return opacity >= 0.99 && (transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)');
    });
  }).toBe(true);
}

async function expectOnlyOneSlideVisible(swiper) {
  const swiperBox = await getBox(swiper);
  const slideBoxes = await swiper.locator('.swiper-slide').evaluateAll(els => {
    return els.map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
  });

  // Cuenta cuántas slides tienen una intersección "real" con el viewport del Swiper.
  // Si la siguiente imagen "asoma", normalmente aparece una segunda slide con intersección visible.
  const minVisiblePx = 6;
  const visibleCount = slideBoxes.reduce((count, slideBox) => {
    const inter = intersectionSize(swiperBox, slideBox);
    return inter.width >= minVisiblePx && inter.height >= minVisiblePx ? count + 1 : count;
  }, 0);

  expect(visibleCount).toBe(1);
}

async function assertActiveSlideLayout(page, swiper, vp) {
  const activeImg = swiper.locator('.swiper-slide-active img');
  await expect(activeImg).toHaveCSS('object-fit', 'contain');

  await ensureActiveImageLoaded(swiper);

  const swiperBox = await getBox(swiper);
  const slideBox = await getBox(swiper.locator('.swiper-slide-active'));
  const imgBox = await getBox(activeImg);

  if (vp.width >= 1200) {
    const { scrollWidth, clientWidth } = await page.evaluate(() => {
      const de = document.documentElement;
      const body = document.body;
      return {
        clientWidth: de.clientWidth,
        scrollWidth: Math.max(de.scrollWidth, body ? body.scrollWidth : 0)
      };
    });
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    expect(swiperBox.x).toBeGreaterThanOrEqual(-1);
    expect(swiperBox.x + swiperBox.width).toBeLessThanOrEqual(vp.width + 1);
  }

  expect(imgBox.x + imgBox.width).toBeLessThanOrEqual(swiperBox.x + swiperBox.width + 1);
  expect(imgBox.y + imgBox.height).toBeLessThanOrEqual(swiperBox.y + swiperBox.height + 1);
  expect(imgBox.x).toBeGreaterThanOrEqual(swiperBox.x - 1);
  expect(imgBox.y).toBeGreaterThanOrEqual(swiperBox.y - 1);

  expect(Math.abs(swiperBox.height - slideBox.height)).toBeLessThanOrEqual(32);

  if (vp.width >= 768) {
    await expectOnlyOneSlideVisible(swiper);

    const prevBtn = swiper.locator('.swiper-button-prev');
    const nextBtn = swiper.locator('.swiper-button-next');

    if (await prevBtn.isVisible()) {
      const prevBox = await getBox(prevBtn);
      expect(boxesIntersect(prevBox, imgBox)).toBe(false);
    }

    if (await nextBtn.isVisible()) {
      const nextBox = await getBox(nextBtn);
      expect(boxesIntersect(nextBox, imgBox)).toBe(false);
    }
  }

  return { swiperBox };
}

test.describe('Monumento: Swiper autoHeight sin recortes', () => {
  const expectedSrcs = [
    'img/falla2026.avif',
    'img/falla2026-Infantil.avif',
    'img/falla2026-real.avif',
    'img/falla2026-infantil-real.avif'
  ];

  for (const pageName of ['index.html', 'lafalla.html']) {
    for (const vp of VIEWPORTS) {
      test(`${pageName} (${vp.name}): imagen cabe y altura se ajusta`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/${pageName}`);

        const swiper = page.locator('[data-testid="monumento-swiper"]');
        await expect(swiper).toBeVisible();
        await expectBaseSlides(swiper, expectedSrcs);
        await ensureSwiperReadyForInteraction(swiper);

        // Swiper marca el contenedor con esta clase cuando autoHeight está activo
        await expect
          .poll(async () => {
            return await swiper.evaluate(el => el.classList.contains('swiper-autoheight'));
          })
          .toBe(true);

        const { swiperBox } = await assertActiveSlideLayout(page, swiper, vp);

        // 3) Navega y sigue cumpliendo
        const next = swiper.locator('.swiper-button-next');
        if (await next.isVisible()) {
          let previousHeight = swiperBox.height;

          for (const expectedSrc of [/falla2026-Infantil\.avif/, /falla2026-real\.avif/]) {
            await next.click();
            await page.waitForTimeout(350);
            await expect(swiper.locator('.swiper-slide-active img')).toHaveAttribute('src', expectedSrc);

            const { swiperBox: swiperBoxNext } = await assertActiveSlideLayout(page, swiper, vp);

            expect(swiperBoxNext.height).toBeGreaterThan(0);
            expect(previousHeight).toBeGreaterThan(0);
            previousHeight = swiperBoxNext.height;
          }
        }
      });
    }
  }
});
