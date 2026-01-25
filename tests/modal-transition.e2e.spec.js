
import { test, expect } from '@playwright/test';

test.describe('Modal Theme Transition', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('modal content should have background transition property', async ({ page }) => {
    // 1. Open the modal
    const openModalBtn = page.locator('#open-quieres-modal');
    await expect(openModalBtn).toBeVisible();
    await openModalBtn.click();

    // 2. Wait for modal to be visible
    const modal = page.locator('#modal-quieres');
    const modalContent = page.locator('#modal-quieres-content'); // or .modal-content
    await expect(modal).toBeVisible();

    // 3. Verify transition property is present on .modal-content
    // We expect transition property to include background-color
    await expect(modalContent).toHaveCSS('transition-property', /background-color/);
    
    // Also check duration if possible, but matching property is enough for "transition exists"
    // The previous fix used var(--theme-transition) which typically resolves to something like 'background-color 2.4s ease-in-out' or all.
    // Let's check computed style.
    const transitionDuration = await modalContent.evaluate((el) => {
        return window.getComputedStyle(el).transitionDuration;
    });
    // Assuming 2.4s is the variable value
    expect(transitionDuration).not.toBe('0s');
  });

  test('modal background color should change when theme is toggled', async ({ page }) => {
      // 1. Open modal
      await page.click('#open-quieres-modal');
      const modalContent = page.locator('#modal-quieres-content');
      await expect(modalContent).toBeVisible();

      // 2. Get initial background color (Light mode default?)
      // Check current theme first. If it starts in light mode (default).
      const initialBg = await modalContent.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
      });

      // 3. Toggle theme programmatically (since modal blocks click)
      await page.evaluate(() => {
          document.body.classList.toggle('modo-oscuro');
          document.body.classList.toggle('modo-claro');
      });

      // 4. Wait for transition/change. 
      // Since it's a transition, we might need to wait for the value to settle or at least change.
      // We can use expect.poll to wait for the value to be different.
      await expect.poll(async () => {
          return await modalContent.evaluate((el) => {
              return window.getComputedStyle(el).backgroundColor;
          });
      }, {
          message: 'Background color should change after theme toggle',
          timeout: 5000
      }).not.toBe(initialBg);
      
      // Optional: verify it went to dark mode color (assuming we know what it is, usually dark gray/black)
      // But differing from initial is distinct evidence of change.
  });
});
