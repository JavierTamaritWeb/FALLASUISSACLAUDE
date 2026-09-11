const { test, expect } = require('@playwright/test');

const PAGES = [
  'index.html',
  'colaboraciones.html',
  'lafalla.html',
  'eventos.html',
  'deportes.html',
  'meteo.html',
  'blog.html',
  'blog-somni.html',
  'blog-anima.html',
  'galerias.html',
  'calendario.html',
  'mapa.html',
  'organigrama.html',
  'galeria_1.html',
  'galeria_2.html',
  'galeria_3.html',
  'galeria_4.html'
];

test.describe('Navbar responsive + idioma', () => {
  for (const pageName of PAGES) {
    test(`${pageName} (desktop): toggle visible, nav desplegable cerrada y label idioma`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pageName}`);

      // Desde v4.14.0 la nav es un desplegable también en desktop.
      const toggle = page.locator('button.header__menu-toggle');
      await expect(toggle).toBeVisible();

      const nav = page.locator('nav.navegacion');
      await expect(nav).toBeHidden();

      await toggle.click();
      await expect(nav).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(nav).toBeHidden();

      const lang = page.locator('#langSwitcher');
      await expect(lang).toBeVisible();
      await expect(lang).toHaveText(/IDIOMA · /);
    });

    test(`${pageName} (mobile): toggle visible y nav cerrada por defecto`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(`/${pageName}`);

      const toggle = page.locator('button.header__menu-toggle');
      await expect(toggle).toBeVisible();

      const nav = page.locator('nav.navegacion');
      await expect(nav).toBeHidden();

      const lang = page.locator('#langSwitcher');
      await expect(lang).toBeVisible();
      await expect(lang).toHaveAttribute('aria-label', /Cambiar idioma/);
      await expect(lang).toHaveCSS('font-size', '0px');
    });
  }

  test('mobile: abre/cierra con toggle, Escape y click fuera', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/index.html');

    const toggle = page.locator('button.header__menu-toggle');
    const nav = page.locator('nav.navegacion');

    await toggle.click();
    await expect(nav).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();

    await toggle.click();
    await expect(nav).toBeVisible();

    // Click fuera usando el backdrop - disparamos el evento directamente
    // porque el backdrop es transparente y tiene z-index menor que la barra
    await page.evaluate(() => {
      document.querySelector('.nav-backdrop').click();
    });
    await expect(nav).toBeHidden();
  });

  test('mobile: al clicar un enlace navega y el menú queda cerrado', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/index.html');

    const toggle = page.locator('button.header__menu-toggle');
    const nav = page.locator('nav.navegacion');

    await toggle.click();
    await expect(nav).toBeVisible();

    await Promise.all([
      page.waitForURL(/lafalla\.html$/),
      page.locator('nav.navegacion a[href="lafalla.html"]').click()
    ]);

    await expect(page.locator('nav.navegacion')).toBeHidden();
  });

  test('mobile: el dropdown conserva la estructura crítica y no recorta enlaces', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const navState = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      const bar = document.querySelector('.header__barra');
      const activeLinks = Array.from(document.querySelectorAll('.navegacion__enlace')).filter((link) =>
        link.classList.contains('active')
      );

      const activeLink = activeLinks[0];
      const activeAfter = activeLink ? window.getComputedStyle(activeLink, '::after') : null;

      return {
        activeColor: activeLink ? window.getComputedStyle(activeLink).color : '',
        activeUnderlineOpacity: activeAfter ? activeAfter.opacity : '',
        activeUnderlineBackground: activeAfter ? activeAfter.backgroundColor : '',
        activeLinks: activeLinks.length,
        backdropFilter: window.getComputedStyle(nav).backdropFilter,
        barBackdropFilter: window.getComputedStyle(bar).backdropFilter,
        backgroundColor: window.getComputedStyle(nav).backgroundColor,
        backgroundImage: window.getComputedStyle(nav).backgroundImage,
        left: window.getComputedStyle(nav).left,
        overflow: window.getComputedStyle(bar).overflow,
        position: window.getComputedStyle(nav).position,
        right: window.getComputedStyle(nav).right,
        top: window.getComputedStyle(nav).top,
        visibleLinkCount: Array.from(document.querySelectorAll('.navegacion__enlace')).filter((link) => {
          const rect = link.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).length
      };
    });

    expect(navState.position).toBe('absolute');
    expect(parseInt(navState.top, 10)).toBeGreaterThan(0);
    expect(navState.left).toBe('0px');
    expect(navState.right).toBe('0px');
    expect(navState.overflow).not.toBe('hidden');
    // Cristal como la barra (v4.23.6): degradado azul translúcido + blur real de la página
    expect(navState.backgroundImage).toContain('linear-gradient');
    expect(navState.backgroundImage).toMatch(/rgba\(2,\s*66,\s*122,\s*0\.7\)/);
    expect(navState.backdropFilter).toContain('blur(15px)');
    // La barra NO debe llevar backdrop-filter en el propio elemento (sería backdrop root
    // y el blur del desplegable dejaría de ver la página); lo lleva su ::before
    expect(navState.barBackdropFilter).toBe('none');
    expect(navState.visibleLinkCount).toBeGreaterThan(0);
    expect(navState.activeLinks).toBe(1);
    // El enlace activo se distingue con texto en coral claro (#FFB4AA, 5,1:1 sobre el azul; v4.29.0)
    // + subrayado permanente coral, sin pastilla de fondo blanca.
    expect(navState.activeColor).toMatch(/rgb\(255,\s*180,\s*170\)/);
    expect(navState.activeUnderlineBackground).toMatch(/rgb\(255,\s*111,\s*97\)/);
    expect(parseFloat(navState.activeUnderlineOpacity)).toBe(1);
  });

  test('mobile: el dropdown adapta el fondo en modo oscuro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    await page.click('.header__modo-boton');
    await page.waitForTimeout(500);
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const backgroundColor = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      return window.getComputedStyle(nav).backgroundColor;
    });

    expect(backgroundColor).toMatch(/rgba\(51,\s*51,\s*51,\s*0\.8\)/);
  });

  test('desktop: el desplegable en modo oscuro usa el fondo negro (no el azul del modo claro)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');

    await page.click('.header__modo-boton');
    await page.waitForTimeout(500);
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const backgroundColor = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      return window.getComputedStyle(nav).backgroundColor;
    });

    // Antes de v4.23.5 la regla oscura vivía en @media (max-width: 767px) y en
    // escritorio el menú conservaba el azul del modo claro. Desde v4.23.6: gris
    // translúcido de la barra oscura + blur real
    expect(backgroundColor).toMatch(/rgba\(51,\s*51,\s*51,\s*0\.8\)/);
  });

  test('desktop: abrir el menú con ratón no deja foco en el primer enlace', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');
    await page.click('.header__menu-toggle');
    await expect(page.locator('nav.navegacion')).toBeVisible();
    const focused = await page.evaluate(() => document.activeElement && document.activeElement.className);
    expect(focused).not.toContain('navegacion__enlace');
  });

  test('desktop: abrir el menú con teclado mueve el foco al primer enlace', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');
    await page.locator('.header__menu-toggle').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('nav.navegacion')).toBeVisible();
    const focused = await page.evaluate(() => document.activeElement && document.activeElement.className);
    expect(focused).toContain('navegacion__enlace');
  });

  test('desktop: el menú abierto se pinta por encima del título sticky y la cenefa (organigrama)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/organigrama.html');
    // Scroll hasta que el título sticky "Organigrama de la Falla" y la cenefa quedan bajo el menú
    await page.evaluate(() => window.scrollTo(0, 420));
    await page.waitForTimeout(300);
    await page.click('.header__menu-toggle');
    await expect(page.locator('nav.navegacion')).toBeVisible();

    // Antes de v4.23.6 .header-inner tenía z-index 10 (igual que la cenefa y el título
    // sticky, posteriores en el DOM), así que el contenido se pintaba sobre el menú
    const encima = await page.evaluate(() => {
      const nav = document.querySelector('nav.navegacion');
      const r = nav.getBoundingClientRect();
      const puntos = [0.15, 0.35, 0.55, 0.75, 0.95].map((f) => [r.left + r.width / 2, r.top + r.height * f]);
      return puntos.map(([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return el ? nav.contains(el) : false;
      });
    });
    expect(encima.every(Boolean)).toBe(true);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.header-inner')).zIndex)).toBe('500');
  });
});
