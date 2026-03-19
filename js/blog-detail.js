// js/blog-detail.js
// Carga un artículo de blog desde data/blog.json según el parámetro ?slug=

let blogDetailData = null;
let currentArticle = null;

function refreshDetailReveal(root) {
  if (window.scrollReveal && typeof window.scrollReveal.refresh === 'function') {
    window.scrollReveal.refresh(root);
  }
}

/**
 * Obtiene el slug de la URL
 * @returns {string|null}
 */
function getSlugFromURL() {
  return new URLSearchParams(location.search).get('slug');
}

/**
 * Carga datos del JSON de blog
 * @returns {Promise<Object>}
 */
async function loadBlogDetailData() {
  try {
    const response = await fetch('data/blog.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    blogDetailData = data;
    return data;
  } catch (error) {
    console.error('Error cargando blog.json:', error);
    blogDetailData = { articles: [] };
    return { articles: [] };
  }
}

/**
 * Genera HTML de una sección de texto
 * @param {string} key - Clave de traducción base
 * @param {Object} section - Datos de la sección
 * @returns {string}
 */
function renderTextSection(key, section) {
  return `<div class="blog-detail__content" data-i18n="${key}.${section.contentKey}" data-i18n-format="paragraphs"></div>`;
}

/**
 * Genera HTML de una sección de imagen
 * @param {string} key - Clave de traducción base
 * @param {Object} section - Datos de la sección
 * @returns {string}
 */
function renderImageSection(key, section) {
  const loading = section.loading || 'lazy';
  const fetchpriority = section.fetchpriority ? ` fetchpriority="${section.fetchpriority}"` : '';
  const altI18n = section.altKey ? ` data-i18n="${key}.${section.altKey}"` : '';
  const captionI18n = section.captionKey ? ` data-i18n="${key}.${section.captionKey}"` : '';

  return `
    <figure class="blog-detail__figure">
      <picture>
        <source srcset="${section.srcAvif}" type="image/avif">
        <source srcset="${section.srcWebp}" type="image/webp">
        <img class="blog-detail__image" src="${section.src}"
             alt=""${altI18n}
             loading="${loading}"${fetchpriority} decoding="async">
      </picture>
      <figcaption class="blog-detail__caption"${captionI18n}></figcaption>
    </figure>`;
}

/**
 * Renderiza un artículo completo
 * @param {Object} article - Datos del artículo
 */
function renderArticle(article) {
  const container = document.getElementById('blog-detail-container');
  if (!container) return;

  const key = article.translationKey;

  // Actualizar título de la página
  const title = typeof getNestedTranslation === 'function' ? getNestedTranslation(`${key}.title`) : '';
  if (title && title !== `${key}.title`) {
    document.title = `${title} | Blog | Falla Suïssa - L'Alqueria del Favero`;
  }

  // Actualizar h1 del header
  const heading = document.getElementById('blog-detail-heading');
  if (heading) {
    heading.setAttribute('data-i18n', `${key}.title`);
  }

  // Generar secciones
  const sectionsHTML = article.sections.map(section => {
    if (section.type === 'text') return renderTextSection(key, section);
    if (section.type === 'image') return renderImageSection(key, section);
    return '';
  }).join('\n');

  const articleHTML = `
    <article class="blog-detail__article reveal reveal--soft" aria-labelledby="blog-detail-heading">
      <div class="blog-detail__meta">
        <time class="blog-detail__date" datetime="${article.dateISO.slice(0, 7)}" data-i18n="${key}.date"></time>
        <div class="blog-detail__spacer"></div>
        <p class="blog-detail__author" data-i18n="${key}.author"></p>
      </div>
      <p class="blog-detail__lead" data-i18n="${key}.lead"></p>
      ${sectionsHTML}
      <a class="blog-detail__back" href="blog.html" data-i18n="${key}.back" data-i18n-aria-label="${key}.backAria">Volver al blog</a>
    </article>`;

  container.innerHTML = articleHTML;

  // Aplicar traducciones
  if (typeof updateTranslations === 'function') {
    updateTranslations();
  }

  // Aplicar traducciones de párrafos
  container.querySelectorAll('[data-i18n-format="paragraphs"]').forEach(elem => {
    if (typeof renderParagraphTranslation === 'function' && typeof getNestedTranslation === 'function') {
      const translation = getNestedTranslation(elem.getAttribute('data-i18n'));
      if (translation && translation !== elem.getAttribute('data-i18n')) {
        renderParagraphTranslation(elem, translation);
      }
    }
  });

  // Aplicar alt traducible a imágenes
  container.querySelectorAll('img[data-i18n]').forEach(img => {
    if (typeof getNestedTranslation === 'function') {
      const altText = getNestedTranslation(img.getAttribute('data-i18n'));
      if (altText && altText !== img.getAttribute('data-i18n')) {
        img.alt = altText;
      }
    }
  });

  refreshDetailReveal(container);
}

/**
 * Muestra mensaje de artículo no encontrado
 */
function renderNotFound() {
  const container = document.getElementById('blog-detail-container');
  if (!container) return;

  container.innerHTML = `
    <div class="blog-detail__article blog-detail__not-found reveal reveal--soft">
      <h2 data-i18n="blog.error.notFound">Artículo no encontrado</h2>
      <p data-i18n="blog.error.notFoundDesc">El artículo que buscas no existe o ha sido eliminado.</p>
      <a class="blog-detail__back" href="blog.html" data-i18n="blog.error.backToBlog">Volver al blog</a>
    </div>`;

  if (typeof updateTranslations === 'function') {
    updateTranslations();
  }

  refreshDetailReveal(container);
}

/**
 * Inicialización del detalle de blog
 */
async function initBlogDetail() {
  const slug = getSlugFromURL();
  await loadBlogDetailData();

  if (!slug || !blogDetailData?.articles) {
    renderNotFound();
    return;
  }

  currentArticle = blogDetailData.articles.find(a => a.slug === slug);

  if (!currentArticle) {
    renderNotFound();
    return;
  }

  // Si las traducciones ya están listas, renderizar directamente
  if (window.translations && Object.keys(window.translations).length > 0) {
    renderArticle(currentArticle);
  } else {
    document.addEventListener('translationsReady', () => renderArticle(currentArticle), { once: true });
  }
}

// Re-renderizar cuando cambia el idioma
document.addEventListener('langChanged', () => {
  if (currentArticle) {
    renderArticle(currentArticle);
  }
});

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initBlogDetail);
