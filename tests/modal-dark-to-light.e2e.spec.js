
import { test, expect } from '@playwright/test';

test.describe('Modal Dark to Light Transition', () => {
    test('should transition smoothly from dark to light mode', async ({ page }) => {
        await page.goto('/');

        // 1. Force Dark Mode immediately
        await page.evaluate(() => {
            document.body.classList.add('modo-oscuro');
            document.body.classList.remove('modo-claro');
            // Ensure modal content reflects dark mode immediately (disable transition for setup if possible, or just wait)
        });

        // 2. Open Modal
        await page.click('#open-quieres-modal');
        const modalContent = page.locator('#modal-quieres-content');
        await expect(modalContent).toBeVisible();

        // 3. Verify it's in dark mode color (should be close to #333 defined in variables or similar)
        // From scss: v.$secondary-color is #333.
        await expect.poll(async () => {
            const rgb = await modalContent.evaluate((el) => window.getComputedStyle(el).backgroundColor);
            // rgb(51, 51, 51) is #333
            return rgb;
        }).toBe('rgb(51, 51, 51)');


        // 4. Toggle to Light Mode via JS (simulating the class logic) because modal blocks the button
        await page.evaluate(() => {
            const btn = document.getElementById('botonModoOscuro');
            // We can't click it easily if blocked, but we can execute the logic or try to force click via JS
            if(btn) btn.click();
        });

        // 5. Check progression
        console.log('Transition started...');

        // Check at 100ms
        await page.waitForTimeout(100);
        const color100ms = await modalContent.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        console.log('Color at 100ms:', color100ms);
        
        // If immediate, this is rgb(255, 255, 255)
        expect(color100ms).not.toBe('rgb(255, 255, 255)'); 
        expect(color100ms).not.toBe('rgba(0, 0, 0, 0)');

        // Check at 1000ms (should be somewhere in between if transition is 2.4s)
        await page.waitForTimeout(900); // +900 = 1000ms total
        const color1000ms = await modalContent.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        console.log('Color at 1000ms:', color1000ms);

        // It should definitely NOT be exactly #333 anymore if 1s has passed
        expect(color1000ms).not.toBe('rgb(51, 51, 51)');
        
        // And definitely NOT white yet
        expect(color1000ms).not.toBe('rgb(255, 255, 255)');


        // Check at 3000ms (should be done)
        await page.waitForTimeout(2000); // +2000 = 3000ms total
        const colorFinal = await modalContent.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        console.log('Color at 3000ms:', colorFinal);

        // Should be white
        expect(colorFinal).toBe('rgb(255, 255, 255)');
    });
});
