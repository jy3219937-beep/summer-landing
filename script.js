// 정율사관 SUMMER HOT習 — landing interactions

// 1) FAQ accordion
document.querySelectorAll('.faq-q').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.getAttribute('data-open') === 'true';
    item.setAttribute('data-open', String(!isOpen));
    btn.setAttribute('aria-expanded', String(!isOpen));
  });
});

// 2) Countdown to 2026-07-20 (개강일) — animated number on first reveal
const COUNTDOWN_TARGET = new Date('2026-07-20T00:00:00+09:00').getTime();
function daysToOpening() {
  const diff = COUNTDOWN_TARGET - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}
(function tickCountdown() {
  const el = document.querySelector('[data-countdown]');
  if (!el) return;
  // initial value set once shown
  el.dataset.target = String(daysToOpening());
  // hourly refresh (display refresh, not animation)
  setInterval(() => {
    el.textContent = String(daysToOpening());
  }, 60 * 60 * 1000);
})();

// 3) Count-up animator
function animateCount(el, target, duration = 1100) {
  const start = performance.now();
  const from = 0;
  // ease-out cubic
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    el.textContent = String(Math.round(from + (target - from) * ease(p)));
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = String(target);
  }
  requestAnimationFrame(frame);
}

// 4) Combined intersection observer
//    - .reveal → add .in (fires CSS transition)
//    - [data-stagger] → add .in (children animate via CSS nth-child delays)
//    - [data-count] → animate from 0 to target
//    - [data-countdown] → animate from 0 to days-remaining
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;

    // reveal & stagger
    el.classList.add('in');

    // count-up on the element itself
    if (el.hasAttribute('data-count') && !el.hasAttribute('data-counted')) {
      el.setAttribute('data-counted', '1');
      const target = Number(el.dataset.count);
      if (!Number.isNaN(target)) animateCount(el, target);
    }
    // count-up on descendants (for revealed containers)
    el.querySelectorAll && el.querySelectorAll('[data-count]:not([data-counted])').forEach((node) => {
      node.setAttribute('data-counted', '1');
      const target = Number(node.dataset.count);
      if (!Number.isNaN(target)) animateCount(node, target);
    });
    // countdown — also animate on first reveal
    const cd = el.matches && el.matches('[data-countdown]') ? el : (el.querySelector ? el.querySelector('[data-countdown]') : null);
    if (cd && !cd.hasAttribute('data-counted')) {
      cd.setAttribute('data-counted', '1');
      const target = Number(cd.dataset.target || daysToOpening());
      animateCount(cd, target, 1400);
    }

    io.unobserve(el);
  });
}, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, [data-stagger], [data-count], [data-countdown], [data-words]').forEach((el) => io.observe(el));

// 5) Mobile sticky bar — show after scrolling past hero
(function stickybar() {
  const bar = document.querySelector('.stickybar');
  if (!bar) return;
  const hero = document.querySelector('.hero');
  function onScroll() {
    const past = hero ? window.scrollY > hero.offsetHeight * 0.6 : window.scrollY > 400;
    bar.classList.toggle('show', past);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// 6) Word splitter for `.word-reveal[data-words]`
//    Splits each whitespace-separated word in the element into <span class="w">
//    while preserving nested inline elements (em, span[data-count] ...).
(function splitWords() {
  document.querySelectorAll('[data-words]').forEach((root) => {
    const wrap = (textNode) => {
      const parts = textNode.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((p) => {
        if (!p) return;
        if (/^\s+$/.test(p)) {
          frag.appendChild(document.createTextNode(p));
        } else {
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = p;
          frag.appendChild(s);
        }
      });
      textNode.parentNode.replaceChild(frag, textNode);
    };
    // walk only direct text nodes + wrap inline children whole
    Array.from(root.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        wrap(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // wrap entire inline child as one word unit (keeps <em>, count spans intact)
        const w = document.createElement('span');
        w.className = 'w';
        node.parentNode.insertBefore(w, node);
        w.appendChild(node);
      }
    });

    // stagger delays — direct children .w
    Array.from(root.querySelectorAll(':scope > .w')).forEach((w, i) => {
      w.style.transitionDelay = (i * 0.07) + 's';
    });
  });
})();

// 7) Parallax sun glow in hero + hero content scroll-out fade
(function heroScroll() {
  const sun = document.querySelector('.hero-bg .sun');
  const glow = document.querySelector('.hero-bg .glow');
  const inner = document.querySelector('.hero-inner');
  const hero = document.querySelector('.hero');
  if (!hero) return;
  let ticking = false;
  function update() {
    const y = window.scrollY;
    const h = hero.offsetHeight;
    // 0 at top, 1 at bottom of hero
    const p = Math.min(1, Math.max(0, y / h));
    if (sun)  sun.style.transform  = `translate3d(0, ${y * 0.22}px, 0)`;
    if (glow) glow.style.transform = `translate3d(0, ${y * -0.14}px, 0)`;
    if (inner) {
      inner.style.opacity = String(1 - p * 1.15);
      inner.style.transform = `translate3d(0, ${-y * 0.18}px, 0)`;
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
})();

// 8) Scroll progress bar (top of page)
(function scrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);
  let ticking = false;
  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${p})`;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
})();

// 9) MOMENT label/claim drift — soft vertical parallax for moment text
(function momentDrift() {
  const section = document.querySelector('.moment');
  const claim = section && section.querySelector('.moment-claim');
  const label = section && section.querySelector('.moment-lbl');
  if (!section || !claim) return;
  let ticking = false;
  function update() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const sectionCenter = rect.top + rect.height / 2;
    const t = (sectionCenter - vh / 2) / vh; // -1 ~ 1
    const y = Math.max(-30, Math.min(30, t * -40));
    if (claim) claim.style.transform = `translate3d(0, ${y}px, 0)`;
    if (label) label.style.transform = `translate3d(0, ${y * 0.4}px, 0)`;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
})();
