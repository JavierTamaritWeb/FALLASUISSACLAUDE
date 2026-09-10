// tests/accordion-hover.e2e.spec.js
// Los titulares de acordeón replican el hover de `.boton` (v4.27.0):
// degradado coral→salmón (claro) / salmón→amarillo (oscuro), texto e icono en
// $negro-casi, brillo que recorre la fila y el ▼ desplazado. Sin elevación:
// la fila no se mueve (se anula el `button:hover` global de _accessibility.scss).
const { test, expect } = require('@playwright/test');

const NEGRO_CASI = 'rgb(17, 17, 17)';
const CORAL = 'rgb(255, 111, 97)';

async function preparar(page, ruta) {
  await page.addInitScript(() => {
    localStorage.setItem('bannerSubvencionCerrado', 'true');
    localStorage.setItem('cookieConsent', 'all');
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(ruta);
  await page.waitForLoadState('networkidle');
}

async function pasarRaton(page, titular) {
  await titular.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const bb = await titular.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(700); // brillo 520 ms + margen
}

function estilos(titular) {
  return titular.evaluate((el) => {
    const c = getComputedStyle(el);
    const h = getComputedStyle(el.querySelector('.accordion__header'));
    const i = getComputedStyle(el.querySelector('.accordion__icon'));
    const b = getComputedStyle(el, '::before');
    return {
      bg: c.backgroundImage,
      transform: c.transform,
      outline: c.outlineStyle,
      outlineColor: c.outlineColor,
      header: h.color,
      icono: i.color,
      iconoTransform: i.transform,
      brilloOpacidad: b.opacity,
      brilloTransform: b.transform,
      // offsetTop (relativo al padre): no depende del scroll ni del reveal
      top: el.offsetTop,
    };
  });
}

test.describe('Hover de los titulares de acordeón (como .boton)', () => {
  test('Nosotros: reposo coral sin degradado, hover con degradado y texto oscuro sin mover la fila', async ({ page }) => {
    await preparar(page, '/index.html');
    const titular = page.locator('.accordion').first().locator('.accordion__titular').nth(1);
    await titular.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400);

    const antes = await estilos(titular);
    expect(antes.bg).toBe('none');
    expect(antes.header).toBe(CORAL);
    expect(antes.brilloOpacidad).toBe('0');

    await pasarRaton(page, titular);
    const durante = await estilos(titular);
    expect(durante.bg).toContain('linear-gradient(135deg, rgba(255, 111, 97, 0.98)');
    expect(durante.header).toBe(NEGRO_CASI);
    expect(durante.icono).toBe(NEGRO_CASI);
    expect(durante.transform).toBe('none');
    expect(durante.top).toBe(antes.top);
    expect(durante.brilloOpacidad).toBe('1');
    // El brillo ha recorrido la fila hacia la derecha (translateX positivo)
    const tx = Number(durante.brilloTransform.match(/matrix\(1, 0, 0, 1, (-?[\d.]+),/)[1]);
    expect(tx).toBeGreaterThan(0);
    // El ▼ se desplaza hacia abajo
    expect(durante.iconoTransform).toBe('matrix(1, 0, 0, 1, 0, 2.5)');
  });

  test('Nosotros: con la sección abierta el ▼ girado mantiene el giro en hover', async ({ page }) => {
    await preparar(page, '/index.html');
    const titular = page.locator('.accordion').first().locator('.accordion__titular').nth(1);
    await titular.scrollIntoViewIfNeeded();
    await titular.click();
    await page.waitForTimeout(900);
    await pasarRaton(page, titular);
    const s = await estilos(titular);
    expect(s.bg).toContain('linear-gradient');
    // rotate(180deg) translateY(-.25rem) → matriz con a = -1
    expect(s.iconoTransform).toMatch(/^matrix\(-1, /);
  });

  test('Modo oscuro: degradado salmón→amarillo con texto oscuro', async ({ page }) => {
    await preparar(page, '/index.html');
    await page.evaluate(() => document.body.classList.add('modo-oscuro'));
    await page.waitForTimeout(300);
    const titular = page.locator('.accordion').first().locator('.accordion__titular').nth(2);
    await pasarRaton(page, titular);
    const s = await estilos(titular);
    expect(s.bg).toContain('rgba(255, 140, 122, 0.98)');
    expect(s.bg).toContain('rgba(255, 169, 71, 0.94)');
    expect(s.header).toBe(NEGRO_CASI);
    expect(s.icono).toBe(NEGRO_CASI);
  });

  test('Archivos (titular <button>): mismo hover, sin elevación y sin contorno azul en foco por ratón', async ({ page }) => {
    await preparar(page, '/index.html');
    const titular = page.locator('.accordion--representantes .accordion__titular').first();
    await expect(titular).toHaveJSProperty('tagName', 'BUTTON');
    const antes = await estilos(titular);
    await pasarRaton(page, titular);
    const s = await estilos(titular);
    expect(s.bg).toContain('linear-gradient(135deg, rgba(255, 111, 97, 0.98)');
    expect(s.transform).toBe('none');
    expect(s.top).toBe(antes.top);

    // Clic con ratón: enfoca el botón sin :focus-visible → sin outline azul de _seo.scss
    await titular.click();
    await page.waitForTimeout(300);
    const foco = await estilos(titular);
    expect(foco.outline).toBe('none');
  });

  test('Foco por teclado: degradado y anillo coral sin outline azul', async ({ page }) => {
    await preparar(page, '/index.html');
    const titular = page.locator('.accordion--representantes .accordion__titular').first();
    await titular.scrollIntoViewIfNeeded();
    // Enfocar el elemento anterior y llegar con Tab (foco visible garantizado)
    await titular.evaluate((el) => {
      const prev = document.createElement('button');
      prev.id = 'foco-previo-test';
      el.parentElement.insertBefore(prev, el);
      prev.focus();
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(400);
    await expect(titular).toBeFocused();
    const s = await estilos(titular);
    expect(s.bg).toContain('linear-gradient');
    expect(s.outline).toBe('none');
    expect(s.outlineColor).not.toBe('rgb(0, 123, 255)');
    const sombra = await titular.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(sombra).toContain('rgba(255, 111, 97, 0.16)');
  });

  test('HOPE en colaboraciones.html comparte el hover', async ({ page }) => {
    await preparar(page, '/colaboraciones.html');
    const titular = page.locator('.accordion__titular').first();
    await pasarRaton(page, titular);
    const s = await estilos(titular);
    expect(s.bg).toContain('linear-gradient(135deg, rgba(255, 111, 97, 0.98)');
    expect(s.header).toBe(NEGRO_CASI);
  });

  test('prefers-reduced-motion: sin transiciones y brillo estático', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await preparar(page, '/index.html');
    const titular = page.locator('.accordion').first().locator('.accordion__titular').nth(1);
    await pasarRaton(page, titular);
    const s = await titular.evaluate((el) => ({
      dur: getComputedStyle(el).transitionDuration,
      brilloDur: getComputedStyle(el, '::before').transitionDuration,
      brilloOp: getComputedStyle(el, '::before').opacity,
      brilloT: getComputedStyle(el, '::before').transform,
    }));
    // El reset global de movimiento reducido usa 0.01ms: cualquier valor < 1 ms vale
    expect(parseFloat(s.dur)).toBeLessThan(0.001);
    expect(parseFloat(s.brilloDur)).toBeLessThan(0.001);
    expect(s.brilloOp).toBe('0.35');
    expect(s.brilloT).toBe('none');
  });
});
