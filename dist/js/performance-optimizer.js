// js/performance-optimizer.js
// Sistema de optimización de Core Web Vitals y performance crítica

class PerformanceOptimizer {
  constructor() {
    this.isSupported = this.checkSupport();
    this.metrics = {};
    this.init();
  }

  checkSupport() {
    return 'PerformanceObserver' in window && 'performance' in window;
  }

  init() {
    if (!this.isSupported) return;

    // Configurar preload crítico
    this.setupCriticalResourceHints();
    
    // Configurar prefetch inteligente
    this.setupIntelligentPrefetch();
    
    // Monitorear Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Optimizar fonts
    this.optimizeFontLoading();
    
    // Configurar service worker para assets críticos
    this.setupCriticalCaching();
  }

  setupCriticalResourceHints() {
    const criticalResources = [
      // CSS crítico
      { href: '/dist/css/main.css', as: 'style', type: 'text/css' },
      
      // JavaScript crítico (core bundle)
      { href: '/dist/js/core.327ce9df.min.js', as: 'script' },
      { href: '/dist/js/vendors.a77ff8ff.min.js', as: 'script' },
      
      // Imágenes críticas above-the-fold
      { href: '/img/Escudo_falla.avif', as: 'image', type: 'image/avif' },
      { href: '/img/foto_2425_01.avif', as: 'image', type: 'image/avif' },
      
      // Fuentes críticas
      { href: '/fonts/dm-sans-v13-latin-regular.woff2', as: 'font', type: 'font/woff2', crossorigin: true }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.crossorigin) link.crossOrigin = 'anonymous';
      
      // Añadir con alta prioridad
      link.fetchPriority = 'high';
      
      document.head.appendChild(link);
    });
  }

  setupIntelligentPrefetch() {
    // Prefetch basado en hover intent
    this.setupHoverPrefetch();
    
    // Prefetch basado en viewport proximity
    this.setupViewportPrefetch();
    
    // Prefetch basado en user engagement
    this.setupEngagementPrefetch();
  }

  setupHoverPrefetch() {
    const prefetchLinks = new Set();
    let prefetchTimer;

    // Prefetch cuando el usuario hover sobre enlaces
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]');
      if (!link || prefetchLinks.has(link.href)) return;

      clearTimeout(prefetchTimer);
      prefetchTimer = setTimeout(() => {
        this.prefetchResource(link.href, 'document');
        prefetchLinks.add(link.href);
      }, 100); // Delay para evitar prefetch innecesario
    });

    document.addEventListener('mouseout', () => {
      clearTimeout(prefetchTimer);
    });
  }

  setupViewportPrefetch() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const link = entry.target;
          if (link.href && !link.dataset.prefetched) {
            this.prefetchResource(link.href, 'document');
            link.dataset.prefetched = 'true';
            observer.unobserve(link);
          }
        }
      });
    }, { 
      rootMargin: '200px' // Prefetch 200px antes de ser visible
    });

    // Observar enlaces importantes
    document.querySelectorAll('a[href^="/"], a[href*="fallasuissa"]').forEach(link => {
      observer.observe(link);
    });
  }

  setupEngagementPrefetch() {
    let engagementScore = 0;
    const engagementThreshold = 5;

    // Incrementar score por interacciones
    ['click', 'scroll', 'keydown', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => {
        engagementScore++;
        
        if (engagementScore >= engagementThreshold) {
          this.prefetchHighPriorityPages();
          engagementScore = 0; // Reset
        }
      }, { passive: true, once: true });
    });
  }

  prefetchHighPriorityPages() {
    const highPriorityPages = [
      '/calendario.html',
      '/eventos.html',
      '/galerias.html',
      '/lafalla.html'
    ];

    highPriorityPages.forEach(page => {
      this.prefetchResource(page, 'document');
    });
  }

  prefetchResource(href, as = 'document') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    if (as !== 'document') link.as = as;
    
    // Añadir silenciosamente
    document.head.appendChild(link);
  }

  monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // First Contentful Paint (FCP)
    this.observeFCP();
  }

  observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.metrics.lcp = lastEntry.startTime;
      
      // Si LCP > 2.5s, optimizar
      if (lastEntry.startTime > 2500) {
        this.optimizeLCP();
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  observeFID() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.fid = entry.processingStart - entry.startTime;
        
        // Si FID > 100ms, optimizar
        if (this.metrics.fid > 100) {
          this.optimizeFID();
        }
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
  }

  observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.metrics.cls = clsValue;
      
      // Si CLS > 0.1, optimizar
      if (clsValue > 0.1) {
        this.optimizeCLS();
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  }

  observeFCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
      });
    });

    observer.observe({ entryTypes: ['paint'] });
  }

  optimizeLCP() {
    // Precargar imagen LCP si no está ya precargada
    const lcpImage = document.querySelector('img[fetchpriority="high"]');
    if (lcpImage && !lcpImage.dataset.optimized) {
      lcpImage.fetchPriority = 'high';
      lcpImage.loading = 'eager';
      lcpImage.dataset.optimized = 'true';
    }
  }

  optimizeFID() {
    // Diferir scripts no críticos
    const nonCriticalScripts = document.querySelectorAll('script:not([data-critical])');
    nonCriticalScripts.forEach(script => {
      if (!script.defer && !script.async) {
        script.defer = true;
      }
    });
  }

  optimizeCLS() {
    // Añadir aspect-ratio a imágenes sin dimensiones
    const images = document.querySelectorAll('img:not([width]):not([height]):not([style*="aspect-ratio"])');
    images.forEach(img => {
      img.style.aspectRatio = '16 / 9'; // Ratio por defecto
    });
  }

  optimizeFontLoading() {
    // Precargar fuentes críticas con font-display: swap
    const fontPreloads = [
      '/fonts/dm-sans-v13-latin-regular.woff2',
      '/fonts/dm-sans-v13-latin-700.woff2'
    ];

    fontPreloads.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontUrl;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Configurar font-display en CSS
    this.addFontDisplaySwap();
  }

  addFontDisplaySwap() {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'DM Sans';
        font-display: swap;
        font-style: normal;
        font-weight: 400;
        src: url('/fonts/dm-sans-v13-latin-regular.woff2') format('woff2');
      }
      
      @font-face {
        font-family: 'DM Sans';
        font-display: swap;
        font-style: normal;
        font-weight: 700;
        src: url('/fonts/dm-sans-v13-latin-700.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);
  }

  setupCriticalCaching() {
    // Registrar service worker para cache crítico
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('SW registrado:', registration);
        })
        .catch(error => {
          console.log('SW error:', error);
        });
    }
  }

  // API pública para obtener métricas
  getMetrics() {
    return this.metrics;
  }

  // Reportar métricas (para analytics)
  reportMetrics() {
    // Enviar a Google Analytics o sistema de monitoreo
    if (window.gtag && Object.keys(this.metrics).length > 0) {
      Object.entries(this.metrics).forEach(([metric, value]) => {
        window.gtag('event', 'web_vitals', {
          metric_name: metric,
          metric_value: Math.round(value),
          metric_delta: Math.round(value)
        });
      });
    }
  }
}

// Inicializar tan pronto como sea posible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
  });
} else {
  window.performanceOptimizer = new PerformanceOptimizer();
}

// Reportar métricas cuando la página se va a cerrar
window.addEventListener('beforeunload', () => {
  if (window.performanceOptimizer) {
    window.performanceOptimizer.reportMetrics();
  }
});