
import { test, expect } from '@playwright/test';

test.describe('Modal Transition Duration', () => {
    test('modal content should have a valid transition duration', async ({ page }) => {
        await page.goto('/');
        
        // Open modal
        await page.click('#open-quieres-modal');
        await expect(page.locator('#modal-quieres-content')).toBeVisible();

        const modalContent = page.locator('#modal-quieres-content');
        
        // Check computed style for transition duration
        const duration = await modalContent.evaluate((el) => {
            return window.getComputedStyle(el).transitionDuration;
        });

        console.log(`Computed transition duration: ${duration}`);
        
        // Expect duration to be around 2.4s
        // It might be returned as '2.4s' or '2.4s, 2.4s' if multiple properties are transitioned
        expect(duration).toContain('2.4s');
    });

    test('modal background color should change gradually', async ({ page }) => {
        await page.goto('/');
        await page.click('#open-quieres-modal');
        const modalContent = page.locator('#modal-quieres-content');
        
        // Wait for modal to be fully open
        await page.waitForTimeout(500);

        // Get initial color
        const initialColor = await modalContent.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });

        // Toggle theme directly via JS to avoid UI blocking issues
        await page.evaluate(() => {
            document.body.classList.toggle('modo-oscuro');
        });

        // IMMEDIATELY check color. If transition is working, it should effectively be the OLD color 
        // (or very close to it) because transition takes 2.4s.
        // If transition is missing, it will snap to the NEW color immediately.
        
        const immediateColor = await modalContent.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });

        // We expect immediate color to be close to initialColor, NOT the final target color.
        // However, checking "close to" with RGB strings is hard. 
        // Let's just check if it CHANGED immediately to the target or not.
        
        // Let's wait 100ms and check. 100ms / 2400ms is < 5% change.
        await page.waitForTimeout(100);
        
        const shortlyAfterColor = await modalContent.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });

        // If it was immediate, shortlyAfterColor would be the final dark mode color (rgb(51, 51, 51)).
        // If it is transitioning, it should be still mostly white (light mode).
        
        // Let's assume light mode is rgb(255, 255, 255) and dark is rgb(51, 51, 51).
        
        if (initialColor === 'rgb(255, 255, 255)') {
             // We are going to Dark Mode.
             // If immediate, shortlyAfterColor would be rgb(51, 51, 51).
             // If transitioning, it should be definitely NOT rgb(51, 51, 51).
             expect(shortlyAfterColor).not.toBe('rgb(51, 51, 51)');
        }
    });

});
