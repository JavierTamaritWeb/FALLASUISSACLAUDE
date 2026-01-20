/* js/swiper.js */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Swiper === 'undefined') return;

  const swiperEls = document.querySelectorAll('.swiper');
  if (!swiperEls.length) return;

  for (const swiperEl of swiperEls) {
    const paginationEl = swiperEl.querySelector('.swiper-pagination');
    const nextEl = swiperEl.querySelector('.swiper-button-next');
    const prevEl = swiperEl.querySelector('.swiper-button-prev');
    const scrollbarEl = swiperEl.querySelector('.swiper-scrollbar');
    const isAutoHeight = swiperEl.classList.contains('swiper--autoheight');

    const swiper = new Swiper(swiperEl, {
      direction: 'horizontal',
      loop: true,
      autoHeight: isAutoHeight,
      pagination: paginationEl
        ? {
            el: paginationEl,
            clickable: true,
          }
        : undefined,
      navigation:
        nextEl && prevEl
          ? {
              nextEl,
              prevEl,
            }
          : undefined,
      scrollbar: scrollbarEl
        ? {
            el: scrollbarEl,
            draggable: true,
          }
        : undefined,
      on: isAutoHeight
        ? {
            init(sw) {
              const imgs = swiperEl.querySelectorAll('img');
              for (const img of imgs) {
                const update = () => sw.updateAutoHeight(0);

                if (img.complete) {
                  if (typeof img.decode === 'function') {
                    img.decode().then(update).catch(update);
                  } else {
                    update();
                  }
                } else {
                  img.addEventListener('load', update, { once: true });
                  img.addEventListener('error', update, { once: true });
                }
              }

              sw.updateAutoHeight(0);
            },
            slideChangeTransitionEnd(sw) {
              sw.updateAutoHeight(300);
            },
          }
        : undefined,
    });

    // Referencia intencional (útil para depuración y evita warnings de lint)
    void swiper;
  }
});
