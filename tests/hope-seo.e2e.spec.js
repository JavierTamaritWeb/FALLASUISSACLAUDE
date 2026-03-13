import { test, expect } from '@playwright/test';

function getGraphNode(graph, id) {
  return graph.find((node) => node['@id'] === id);
}

test.describe('SEO HOPE-INCLIVA', () => {
  test('index.html expone la colaboración con HOPE-INCLIVA en metadatos y JSON-LD válido', async ({ page }) => {
    await page.goto('/index.html');

    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /HOPE-INCLIVA/i);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /HOPE-INCLIVA/i);

    const data = await page.locator('script[type="application/ld+json"]').evaluate((element) => JSON.parse(element.textContent || '{}'));
    const graph = data['@graph'];

    expect(Array.isArray(graph)).toBeTruthy();

    const hopeWebsite = getGraphNode(graph, 'https://hope-incliva.com/#website');
    const webpage = getGraphNode(graph, 'https://fallasuissa.es/#webpage');

    expect(hopeWebsite).toBeTruthy();
    expect(hopeWebsite.url).toBe('https://hope-incliva.com/');
    expect(webpage).toBeTruthy();
    expect(webpage.about).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ '@id': 'https://hope-incliva.com/#website' })
      ])
    );
  });

  test('colaboraciones.html dedica su SEO técnico a HOPE-INCLIVA', async ({ page }) => {
    await page.goto('/colaboraciones.html');

    await expect(page).toHaveTitle(/HOPE-INCLIVA/i);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Linfoma No Hodgkin Pediátrico/i);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /HOPE-INCLIVA/i);

    const data = await page.locator('script[type="application/ld+json"]').evaluate((element) => JSON.parse(element.textContent || '{}'));
    const graph = data['@graph'];

    expect(Array.isArray(graph)).toBeTruthy();

    const hopeWebsite = getGraphNode(graph, 'https://hope-incliva.com/#website');
    const collaboration = getGraphNode(graph, 'https://fallasuissa.es/colaboraciones.html#hope-collaboration');
    const webpage = getGraphNode(graph, 'https://fallasuissa.es/colaboraciones.html#webpage');

    expect(hopeWebsite).toBeTruthy();
    expect(collaboration).toBeTruthy();
    expect(webpage).toBeTruthy();
    expect(webpage.mainEntity).toEqual(
      expect.objectContaining({ '@id': 'https://fallasuissa.es/colaboraciones.html#hope-collaboration' })
    );
  });
});