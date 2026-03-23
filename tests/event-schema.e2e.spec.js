import { test, expect } from '@playwright/test';

function collectEventNodes(schemaBlock) {
  if (!schemaBlock) {
    return [];
  }

  if (Array.isArray(schemaBlock)) {
    return schemaBlock.filter((node) => node && node['@type'] === 'Event');
  }

  if (Array.isArray(schemaBlock['@graph'])) {
    return schemaBlock['@graph'].filter((node) => node && node['@type'] === 'Event');
  }

  if (schemaBlock['@type'] === 'Event') {
    return [schemaBlock];
  }

  return [];
}

const ISO_DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?$/;

const MANAGED_EVENT_PAGES = [
  '/index.html',
  '/eventos.html',
  '/va/index.html',
  '/va/eventos.html'
];

const LEGACY_CLEANUP_PAGES = [
  '/base.html',
  '/lafalla.html',
  '/va/base.html',
  '/va/lafalla.html'
];

test.describe('Schema Event del tablón', () => {
  for (const pagePath of [...MANAGED_EVENT_PAGES, ...LEGACY_CLEANUP_PAGES]) {
    test(`${pagePath} no publica fechas placeholder y completa los campos recomendados`, async ({ page }) => {
      await page.goto(pagePath);

      const rawJsonLdBlocks = await page.locator('script[type="application/ld+json"]').evaluateAll((elements) =>
        elements.map((element) => element.textContent || '')
      );

      expect(rawJsonLdBlocks.join('\n')).not.toContain('0000-00-00T');

      const schemaBlocks = rawJsonLdBlocks.map((block) => JSON.parse(block));
      const eventNodes = schemaBlocks.flatMap(collectEventNodes);

      if (!MANAGED_EVENT_PAGES.includes(pagePath)) {
        expect(eventNodes).toHaveLength(0);
        return;
      }

      for (const eventNode of eventNodes) {
        expect(eventNode.startDate).toMatch(ISO_DATE_TIME_REGEX);
        expect(eventNode.organizer).toEqual(
          expect.objectContaining({
            '@type': 'Organization',
            name: 'Falla Suïssa - L\'Alqueria del Favero'
          })
        );
        expect(eventNode.eventStatus).toBe('https://schema.org/EventScheduled');
        expect(eventNode.description).toEqual(expect.any(String));
        expect(eventNode.description.length).toBeGreaterThan(10);
        expect(eventNode.offers).toEqual(
          expect.objectContaining({
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'EUR'
          })
        );

        const images = Array.isArray(eventNode.image) ? eventNode.image : [eventNode.image];
        expect(images[0]).toMatch(/^https:\/\/fallasuissa\.es\/img\//);
      }
    });
  }
});