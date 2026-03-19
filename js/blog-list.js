// js/blog-list.js
// Genera tarjetas de blog dinámicamente desde data/blog.json
// Se usa tanto en blog.html como en index.html

let blogListData = null;

function refreshBlogListReveal(root) {
  if (window.scrollReveal && typeof window.scrollReveal.refresh === 'function') {
    window.scrollReveal.refresh(root);
  }
}

/**
 * Carga datos del JSON de blog
 * @returns {Promise<Object>} Datos del blog
 */
async function loadBlogListData() {
  try {
    const response = await fetch('data/blog.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    blogListData = data;
    return data;
  } catch (error) {
    console.error('Error cargando blog.json:', error);
    blogListData = { articles: [] };
    return { articles: [] };
  }
}

/**
 * Genera HTML de una tarjeta de blog
 * @param {Object} article - Datos del artículo
 * @returns {string} HTML de la tarjeta
 */
function renderBlogCard(article) {
  const key = article.translationKey;
  const featuredClass = article.featured ? ' blog__post--featured' : '';

  return `
    <article class="blog__post${featuredClass} reveal reveal--soft">
      <h3 class="blog__post-title" data-i18n="${key}.cardTitle"></h3>
      <time class="blog__date" datetime="${article.dateISO.slice(0, 7)}" data-i18n="${key}.date"></time>
      <p class="blog__post-content" data-i18n="${key}.excerpt"></p>
      <div class="flex_button">
        <div class="boton-blog">
          <a class="boton" data-i18n="blog.leermas" data-i18n-aria-label="${key}.ctaAria" href="blog-detail.html?slug=${article.slug}">Ver más</a>
        </div>
      </div>
    </article>`;
}

/**
 * Renderiza las tarjetas de blog en el contenedor .blog__posts
 */
function renderBlogList() {
  const container = document.querySelector('.blog__posts');
  if (!container) return;

  if (!blogListData?.articles) return;

  const limit = parseInt(container.getAttribute('data-blog-limit'), 10) || 0;

  // Ordenar: featured primero, luego por fecha descendente
  const sorted = [...blogListData.articles].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.dateISO.localeCompare(a.dateISO);
  });

  const articles = limit > 0 ? sorted.slice(0, limit) : sorted;

  container.innerHTML = articles.map(renderBlogCard).join('');

  // Aplicar traducciones a los elementos recién insertados
  if (typeof updateTranslations === 'function') {
    updateTranslations();
  }

  refreshBlogListReveal(container);
}

/**
 * Inicialización del listado de blog
 */
async function initBlogList() {
  await loadBlogListData();

  // Si las traducciones ya están listas, renderizar directamente
  if (window.translations && Object.keys(window.translations).length > 0) {
    renderBlogList();
  } else {
    // Esperar a que lang.js cargue las traducciones
    document.addEventListener('translationsReady', renderBlogList, { once: true });
  }
}

// Re-renderizar cuando cambia el idioma
document.addEventListener('langChanged', renderBlogList);

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initBlogList);
