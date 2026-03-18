
import { test, expect } from '@playwright/test';

async function abrirModalQuierese(page) {
    const openModalBtn = page.locator('#open-quieres-modal');
    await openModalBtn.scrollIntoViewIfNeeded();
    await expect(openModalBtn).toBeVisible();
    await openModalBtn.click();
    await expect(page.locator('#modal-quieres')).toBeVisible();
}

test.describe('Modal Theme Transition', () => {
  test.beforeEach(async ({ page }) => {
        await page.goto('/index.html');
  });

    test('modal content should keep the transition contract', async ({ page }) => {
        await abrirModalQuierese(page);

    const modal = page.locator('#modal-quieres');
        const modalContent = page.locator('#modal-quieres-content');
    await expect(modal).toBeVisible();

    await expect(modalContent).toHaveCSS('transition-property', /background-color/);

    const transitionDuration = await modalContent.evaluate((el) => {
            return window.getComputedStyle(el).transitionDuration;
    });

        expect(transitionDuration).toContain('2.4s');
  });

  test('modal background color should change when theme is toggled', async ({ page }) => {
      await abrirModalQuierese(page);
        const modalContent = page.locator('#modal-quieres-content');
        await expect(modalContent).toBeVisible();

        const initialBg = await modalContent.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });

        await page.evaluate(() => {
            document.body.classList.toggle('modo-oscuro');
            document.body.classList.toggle('modo-claro');
        });

        await expect
            .poll(async () => {
                return modalContent.evaluate((el) => {
                    return window.getComputedStyle(el).backgroundColor;
                });
            }, {
                message: 'Background color should change after theme toggle',
                timeout: 5000
            })
            .not.toBe(initialBg);
  });
});
