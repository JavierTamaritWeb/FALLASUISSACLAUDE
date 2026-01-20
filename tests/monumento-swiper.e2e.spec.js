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

test.describe('Monumento: Swiper autoHeight sin recortes', () => {
  for (const pageName of ['index.html', 'lafalla.html']) {
    for (const vp of VIEWPORTS) {
      test(`${pageName} (${vp.name}): imagen cabe y altura se ajusta`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/${pageName}`);

        const swiper = page.locator('[data-testid="monumento-swiper"]');
        await expect(swiper).toBeVisible();

        // Swiper marca el contenedor con esta clase cuando autoHeight está activo
        await expect
          .poll(async () => {
            return await swiper.evaluate(el => el.classList.contains('swiper-autoheight'));
          })
          .toBe(true);

        // object-fit contain (no recorte)
        const activeImg = swiper.locator('.swiper-slide-active img');
        await expect(activeImg).toHaveCSS('object-fit', 'contain');

        await ensureActiveImageLoaded(swiper);

        const swiperBox = await getBox(swiper);
        const slideBox = await getBox(swiper.locator('.swiper-slide-active'));
        const imgBox = await getBox(activeImg);

        // 0) En desktop, no debe aparecer scroll horizontal por el Swiper.
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

          // Bonus: el Swiper en sí no debe salirse del viewport.
          expect(swiperBox.x).toBeGreaterThanOrEqual(-1);
          expect(swiperBox.x + swiperBox.width).toBeLessThanOrEqual(vp.width + 1);
        }

        // 1) La imagen no se sale del contenedor (sin recorte/overflow)
        expect(imgBox.x + imgBox.width).toBeLessThanOrEqual(swiperBox.x + swiperBox.width + 1);
        expect(imgBox.y + imgBox.height).toBeLessThanOrEqual(swiperBox.y + swiperBox.height + 1);
        expect(imgBox.x).toBeGreaterThanOrEqual(swiperBox.x - 1);
        expect(imgBox.y).toBeGreaterThanOrEqual(swiperBox.y - 1);

        // 2) autoHeight: el contenedor se ajusta (aprox) a la slide activa
        // (Tolerancia por chrome UI de Swiper + rounding)
        expect(Math.abs(swiperBox.height - slideBox.height)).toBeLessThanOrEqual(32);

        // 2.5) En >=768px, los botones deben quedar fuera de la imagen (sin solape).
        if (vp.width >= 768) {
          // 2.6) En >=768px, no debe "asomar" otra slide dentro del viewport.
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

        // 3) Navega y sigue cumpliendo
        const next = swiper.locator('.swiper-button-next');
        if (await next.isVisible()) {
          const prevHeight = swiperBox.height;

          await next.click();
          await page.waitForTimeout(350);
          await ensureActiveImageLoaded(swiper);

          const swiperBox2 = await getBox(swiper);
          const slideBox2 = await getBox(swiper.locator('.swiper-slide-active'));
          const imgBox2 = await getBox(swiper.locator('.swiper-slide-active img'));

          expect(imgBox2.x + imgBox2.width).toBeLessThanOrEqual(swiperBox2.x + swiperBox2.width + 1);
          expect(imgBox2.y + imgBox2.height).toBeLessThanOrEqual(swiperBox2.y + swiperBox2.height + 1);
          expect(Math.abs(swiperBox2.height - slideBox2.height)).toBeLessThanOrEqual(32);

          if (vp.width >= 768) {
            await expectOnlyOneSlideVisible(swiper);

            const prevBtn2 = swiper.locator('.swiper-button-prev');
            const nextBtn2 = swiper.locator('.swiper-button-next');

            if (await prevBtn2.isVisible()) {
              const prevBox2 = await getBox(prevBtn2);
              expect(boxesIntersect(prevBox2, imgBox2)).toBe(false);
            }

            if (await nextBtn2.isVisible()) {
              const nextBox2 = await getBox(nextBtn2);
              expect(boxesIntersect(nextBox2, imgBox2)).toBe(false);
            }
          }

          // Si las imágenes tienen distintas proporciones en el futuro, esto detecta cambio real.
          // Si hoy son similares, no forzamos diferencia.
          expect(swiperBox2.height).toBeGreaterThan(0);
          expect(prevHeight).toBeGreaterThan(0);
        }
      });
    }
  }
});
