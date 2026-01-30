// js/image-optimizer.js
// Sistema avanzado de optimización y lazy loading de imágenes

class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Configurar Intersection Observer para lazy loading
    this.setupLazyLoading();
    
    // Optimizar imágenes existentes
    this.optimizeExistingImages();
    
    // Configurar responsive images
    this.setupResponsiveImages();
  }

  setupLazyLoading() {
    // Verificar soporte de Intersection Observer
    if (!('IntersectionObserver' in window)) {
      // Fallback para navegadores antiguos
      this.loadAllImages();
      return;
    }

    const options = {
      root: null,
      rootMargin: '50px 0px', // Cargar 50px antes de que sea visible
      threshold: 0.01
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, options);

    // Observar todas las imágenes lazy
    document.querySelectorAll('img[data-src], img[loading="lazy"]').forEach(img => {
      this.observer.observe(img);
    });
  }

  loadImage(img) {
    // Cargar imagen con soporte WebP/AVIF
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }

    // Añadir clase cuando la imagen se carga
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    }, { once: true });

    // Manejar errores de carga
    img.addEventListener('error', () => {
      img.classList.add('error');
      // Fallback a imagen original si WebP/AVIF falla
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback;
      }
    }, { once: true });
  }

  optimizeExistingImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      // Marcar como optimizada
      img.setAttribute('data-optimized', 'true');
      
      // Añadir atributos de optimización si no existen
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      
      // Configurar loading apropiado
      if (!img.hasAttribute('loading') && !this.isAboveFold(img)) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Añadir dimensiones si no existen (evita layout shift)
      this.addDimensions(img);
    });
  }

  isAboveFold(img) {
    const rect = img.getBoundingClientRect();
    return rect.top < window.innerHeight;
  }

  addDimensions(img) {
    // Si la imagen no tiene dimensiones explícitas, añadir aspecto ratio
    if (!img.width && !img.height && !img.style.aspectRatio) {
      img.addEventListener('load', () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        img.style.aspectRatio = aspectRatio.toFixed(3);
      }, { once: true });
    }
  }

  setupResponsiveImages() {
    // Crear picture elements para imágenes críticas
    const criticalImages = document.querySelectorAll('img[fetchpriority="high"]');
    
    criticalImages.forEach(img => {
      this.createResponsivePicture(img);
    });
  }

  createResponsivePicture(img) {
    if (img.parentElement.tagName === 'PICTURE') return; // Ya es responsive

    const picture = document.createElement('picture');
    const imgSrc = img.src;
    const imgAlt = img.alt;
    
    // Crear source para AVIF
    const avifSource = document.createElement('source');
    avifSource.srcset = imgSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '.avif');
    avifSource.type = 'image/avif';
    
    // Crear source para WebP
    const webpSource = document.createElement('source');
    webpSource.srcset = imgSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    webpSource.type = 'image/webp';
    
    // Mantener imagen original como fallback
    img.alt = imgAlt;
    
    // Construir picture element
    picture.appendChild(avifSource);
    picture.appendChild(webpSource);
    picture.appendChild(img.cloneNode(true));
    
    // Reemplazar imagen original
    img.parentElement.replaceChild(picture, img);
  }

  // Precargar imágenes críticas
  preloadCriticalImages() {
    const criticalImages = [
      'img/Escudo_falla.avif',
      'img/foto_2425_01.avif'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.type = 'image/avif';
      document.head.appendChild(link);
    });
  }

  // Método público para cargar todas las imágenes (fallback)
  loadAllImages() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.loadImage(img);
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.imageOptimizer = new ImageOptimizer();
  
  // Precargar imágenes críticas
  window.imageOptimizer.preloadCriticalImages();
});

// CSS para efectos de carga (se puede mover a SCSS)
const style = document.createElement('style');
style.textContent = `
  img {
    transition: opacity 0.3s ease;
  }
  
  img[loading="lazy"]:not(.loaded):not(.animate-icon) {
    opacity: 0.1;
  }
  
  img.loaded {
    opacity: 1;
  }
  
  img.error {
    opacity: 0.5;
    filter: grayscale(100%);
  }
  
  /* Skeleton loading para imágenes */
  img:not(.loaded):not(.error):not(.animate-icon) {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
document.head.appendChild(style);