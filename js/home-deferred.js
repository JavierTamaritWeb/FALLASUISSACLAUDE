// js/home-deferred.js

(function () {
  const currentScript = document.currentScript;
  const versionedScriptSrc = currentScript && currentScript.getAttribute('src');
  let assetVersion = '';

  if (versionedScriptSrc) {
    try {
      assetVersion = new URL(versionedScriptSrc, window.location.href).searchParams.get('v') || '';
    } catch (error) {
      console.warn('No se pudo resolver la versión de assets de la home:', error);
    }
  }

  const loadedScripts = new Map();

  function withAssetVersion(src) {
    if (!assetVersion) {
      return src;
    }

    return `${src}${src.includes('?') ? '&' : '?'}v=${assetVersion}`;
  }

  function loadScript(src) {
    const versionedSrc = withAssetVersion(src);

    if (loadedScripts.has(versionedSrc)) {
      return loadedScripts.get(versionedSrc);
    }

    const existingScript = document.querySelector(`script[src="${versionedSrc}"]`);
    if (existingScript) {
      return Promise.resolve(existingScript);
    }

    const scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = versionedSrc;
      script.async = true;
      script.dataset.homeDeferred = 'true';
      script.addEventListener('load', () => resolve(script), { once: true });
      script.addEventListener('error', () => {
        loadedScripts.delete(versionedSrc);
        reject(new Error(`No se pudo cargar ${versionedSrc}.`));
      }, { once: true });
      document.body.appendChild(script);
    });

    loadedScripts.set(versionedSrc, scriptPromise);
    return scriptPromise;
  }

  function loadScripts(scriptList) {
    return Promise.all(scriptList.map(loadScript));
  }

  function reportDeferredError(error) {
    console.warn('Error cargando scripts diferidos de la home:', error);
  }

  function isNearViewport(element) {
    return element.getBoundingClientRect().top <= window.innerHeight * 1.2;
  }

  function loadOnVisible(selector, scriptList, rootMargin) {
    const trigger = document.querySelector(selector);
    if (!trigger) {
      return;
    }

    const startLoad = () => {
      loadScripts(scriptList).catch(reportDeferredError);
    };

    if (isNearViewport(trigger) || typeof window.IntersectionObserver !== 'function') {
      startLoad();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      observer.disconnect();
      startLoad();
    }, { rootMargin });

    observer.observe(trigger);
  }

  function loadAfterPaint(scriptList) {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        loadScripts(scriptList).catch(reportDeferredError);
      }, 0);
    });
  }

  function loadOnIdle(scriptList) {
    const startLoad = () => {
      loadScripts(scriptList).catch(reportDeferredError);
    };

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(startLoad, { timeout: 600 });
      return;
    }

    window.setTimeout(startLoad, 200);
  }

  function initDeferredHomeScripts() {
    loadAfterPaint(['js/cookie-banner.js']);
    loadOnIdle(['js/timeline.js', 'js/acc.js']);
    loadOnVisible('#videoDron', ['js/video-dron.js'], '320px');
    loadOnVisible('#videoOfrenda', ['js/ofrenda-video.js'], '320px');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeferredHomeScripts, { once: true });
    return;
  }

  initDeferredHomeScripts();
})();