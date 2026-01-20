const { test, expect } = require('@playwright/test');

const PAGES = [
  'index.html',
  'lafalla.html',
  'eventos.html',
  'meteo.html',
  'blog.html',
  'galerias.html',
  'calendario.html',
  'mapa.html',
  'organigrama.html',
  'galeria_1.html',
  'galeria_2.html',
  'galeria_3.html',
  'galeria_4.html'
];

function centerX(box) {
  return box.x + box.width / 2;
}

function centerY(box) {
  return box.y + box.height / 2;
}

test.describe('Header móvil: botones/notificación/menú en una fila', () => {
  for (const pageName of PAGES) {
    test(`${pageName} (mobile): botones izquierda, notificación centrada, menú derecha`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(`/${pageName}`);

      const bar = page.locator('.header__barra, .header-inner__barra').first();
      await expect(bar).toBeVisible();

      const botones = bar.locator('.header__botones').first();
      await expect(botones).toBeVisible();

      const menuToggle = bar.locator('button.header__menu-toggle').first();
      await expect(menuToggle).toBeVisible();

      // Forzamos una notificación real (la UI solo la muestra cuando tiene `.mostrar`).
      const modo = bar.locator('#botonModoOscuro').first();
      await expect(modo).toBeVisible();
      await modo.click();

      // En algunas páginas hay IDs duplicados; nos quedamos con el primer #notificacion dentro de la barra.
      const notificacion = bar.locator('#notificacion').first();
      await expect(notificacion).toHaveClass(/mostrar/);
      await expect(notificacion).toBeVisible();

      const botonesBox = await botones.boundingBox();
      const notifBox = await notificacion.boundingBox();
      const menuBox = await menuToggle.boundingBox();

      expect(botonesBox).toBeTruthy();
      expect(notifBox).toBeTruthy();
      expect(menuBox).toBeTruthy();

      const botonesRight = botonesBox.x + botonesBox.width;
      const menuLeft = menuBox.x;

      // Orden horizontal: izquierda -> centro -> derecha.
      expect(botonesRight).toBeLessThan(notifBox.x + 1);
      expect(notifBox.x + notifBox.width).toBeLessThan(menuLeft + menuBox.width);

      // Misma fila (alineación vertical): centros Y muy parecidos.
      const yBotones = centerY(botonesBox);
      const yNotif = centerY(notifBox);
      const yMenu = centerY(menuBox);
      expect(Math.abs(yBotones - yNotif)).toBeLessThanOrEqual(6);
      expect(Math.abs(yBotones - yMenu)).toBeLessThanOrEqual(6);

      // Notificación centrada entre el borde derecho de los botones y el borde izquierdo del menú.
      const midBetween = (botonesRight + menuLeft) / 2;
      expect(Math.abs(centerX(notifBox) - midBetween)).toBeLessThanOrEqual(14);

      // Altura comparable a los botones (min-height similar).
      const modoBox = await modo.boundingBox();
      expect(modoBox).toBeTruthy();
      expect(Math.abs(modoBox.height - notifBox.height)).toBeLessThanOrEqual(8);
    });
  }
});
