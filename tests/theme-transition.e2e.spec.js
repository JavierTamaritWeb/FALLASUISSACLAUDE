const { test, expect } = require('@playwright/test');

test.describe('Transición de Tema Oscuro/Claro', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Asegurar estado inicial claro
    await page.evaluate(() => {
      localStorage.setItem('darkMode', 'false');
      document.body.classList.remove('modo-oscuro');
      document.body.classList.add('modo-claro');
    });
    await page.reload();
  });

  test('Debe aplicar la clase de transición al cambiar de oscuro a claro', async ({ page }) => {
    const botonModo = page.locator('#botonModoOscuro');
    
    // 1. Activar modo oscuro
    await botonModo.click();
    await expect(page.locator('body')).toHaveClass(/modo-oscuro/);
    
    // Esperar un poco para asegurar que la transición a oscuro termina o está avanzada
    await page.waitForTimeout(1000); 
    
    // 2. Volver a modo claro (esto activa la transición problemática)
    await botonModo.click();
    
    // 3. Verificar que se añade la clase helper para la transición
    await expect(page.locator('body')).toHaveClass(/transicion-a-claro/);
    
    // 4. Verificar computed styles del Header durante la transición
    // El header debería tener una transición definida
    const header = page.locator('.header');
    await expect(header).toHaveCSS('transition-duration', /2\.4s|2400ms/);
    
    // Verificar que el modal content también tiene la transición
    // Forzamos abrir el modal para que esté en el DOM visible (aunque opacity 0, computed styles aplican)
    // await page.locator('#open-quieres-modal').click();
    const modalContent = page.locator('#modal-quieres .modal-content');
    await expect(modalContent).toHaveCSS('transition-duration', /2\.4s|2400ms/);
  });
});
