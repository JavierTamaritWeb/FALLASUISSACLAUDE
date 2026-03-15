// Reveal on scroll global y repetible

class ScrollRevealManager {
  constructor() {
    this.selector = '.reveal:not([data-reveal-skip])';
    this.rootClass = 'has-scroll-reveal';
    this.readyClass = 'reveal-ready';
    this.visibleClass = 'is-visible';
    this.threshold = 0.15;
    this.observer = null;
    this.observed = new WeakSet();
    this.motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    this.handleIntersect = this.handleIntersect.bind(this);
    this.handleMotionChange = this.handleMotionChange.bind(this);
    this.init();
  }

  init() {
    document.documentElement.classList.add(this.rootClass);

    if (this.motionQuery) {
      if (typeof this.motionQuery.addEventListener === 'function') {
        this.motionQuery.addEventListener('change', this.handleMotionChange);
      } else if (typeof this.motionQuery.addListener === 'function') {
        this.motionQuery.addListener(this.handleMotionChange);
      }
    }

    if (this.shouldReduceMotion() || !('IntersectionObserver' in window)) {
      this.showAll(document);
      return;
    }

    this.createObserver();
    this.refresh(document);
  }

  shouldReduceMotion() {
    return Boolean(this.motionQuery?.matches);
  }

  createObserver() {
    this.observer = new IntersectionObserver(this.handleIntersect, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: this.threshold
    });
  }

  handleIntersect(entries) {
    entries.forEach((entry) => {
      const element = entry.target;
      const isOneShot = element.hasAttribute('data-reveal-once');

      if (entry.isIntersecting) {
        element.classList.add(this.visibleClass);

        if (isOneShot && this.observer) {
          this.observer.unobserve(element);
        }

        return;
      }

      if (!isOneShot) {
        element.classList.remove(this.visibleClass);
      }
    });
  }

  handleMotionChange() {
    if (this.shouldReduceMotion()) {
      this.disconnect();
      this.showAll(document);
      return;
    }

    if (!this.observer) {
      this.createObserver();
    }

    this.refresh(document);
  }

  refresh(root = document) {
    const scope = this.resolveRoot(root);
    const elements = this.collect(scope);

    if (elements.length === 0) {
      return;
    }

    if (this.shouldReduceMotion() || !('IntersectionObserver' in window)) {
      elements.forEach((element) => this.show(element));
      return;
    }

    if (!this.observer) {
      this.createObserver();
    }

    elements.forEach((element) => this.prepare(element));
  }

  collect(root) {
    const elements = [];

    if (root instanceof Element && root.matches(this.selector)) {
      elements.push(root);
    }

    if (typeof root.querySelectorAll === 'function') {
      elements.push(...root.querySelectorAll(this.selector));
    }

    return elements;
  }

  prepare(element) {
    element.classList.add(this.readyClass);

    if (!this.observer || this.observed.has(element)) {
      return;
    }

    this.observer.observe(element);
    this.observed.add(element);
  }

  show(element) {
    element.classList.add(this.readyClass, this.visibleClass);
  }

  showAll(root = document) {
    this.collect(root).forEach((element) => this.show(element));
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.observed = new WeakSet();
  }

  resolveRoot(root) {
    if (root instanceof Document || root instanceof DocumentFragment || root instanceof Element) {
      return root;
    }

    return document;
  }
}

function initScrollReveal() {
  if (window.scrollReveal) {
    return;
  }

  window.scrollReveal = new ScrollRevealManager();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollReveal);
} else {
  initScrollReveal();
}