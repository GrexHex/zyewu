/* Zyewu Studio. Behaviour follows the reference site: Lenis smooth scroll, a drag slider with inertia,
   service tabs that cross-fade, line reveals on the two big statements, a small load sequence,
   current-section highlighting in the nav and a clip-path mobile menu.
   By request the logo and the three characters are never animated. */
(function () {
  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var gsapOk = window.gsap && window.ScrollTrigger && window.SplitText;

  /* ---------- smooth scroll ---------- */
  if (window.Lenis && !reduce) {
    new Lenis({ autoRaf: true, anchors: true, allowNestedScroll: true, lerp: 0.15, wheelMultiplier: 1.25 });
  }

  /* ---------- projects slider: moves only by drag or sideways trackpad, stops at both ends ---------- */
  (function slider() {
    if (!window.Swiper || !$('.swiper')) return;
    var FRICTION = 0.05, POWER = 1.2, WHEEL = 0.12, VMAX = 60, GRAB_SCALE = 0.95;
    var swiper = new Swiper('.swiper', {
      loop: false, slidesPerView: 'auto', speed: 0, allowTouchMove: false,
      breakpoints: { 1: { slidesPerView: 1 }, 480: { slidesPerView: 1 }, 768: { slidesPerView: 'auto' }, 992: { slidesPerView: 'auto' } }
    });
    var el = swiper.el, wrapper = swiper.wrapperEl;

    function move(px) {
      var a = swiper.minTranslate(), b = swiper.maxTranslate();
      var t = Math.min(a, Math.max(b, swiper.translate + px));
      swiper.setTranslate(t);
      return t !== a && t !== b;
    }
    if (window.ResizeObserver) new ResizeObserver(function () { swiper.update(); move(0); }).observe(el);

    function scaleCards(v) {
      if (reduce) return;
      $$('.swiper-slide', wrapper).forEach(function (s) {
        s.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        s.style.transform = 'scale(' + v + ')';
      });
    }

    var v = 0, dragging = false, travelled = 0, lastX = 0, lastT = 0, running = false, prev = 0;
    function tick(now) {
      var k = Math.min((now - prev) / 16.667, 3); prev = now;
      if (!dragging) {
        var inside = move(-v * k);
        v *= Math.pow(1 - FRICTION, k);
        if (!inside || Math.abs(v) < 0.05) v = 0;
      }
      if (v !== 0 && !dragging) requestAnimationFrame(tick); else running = false;
    }
    function coast() { if (running || v === 0) return; running = true; prev = performance.now(); requestAnimationFrame(tick); }

    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; travelled = 0; lastX = e.clientX; lastT = performance.now(); v = 0;
      scaleCards(GRAB_SCALE);
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var now = performance.now(), dx = e.clientX - lastX, dt = Math.max(now - lastT, 1);
      travelled += Math.abs(dx);
      move(dx);
      v = v * 0.6 + ((-dx / dt) * 16.667) * 0.4;
      lastX = e.clientX; lastT = now;
    });
    function release() {
      if (!dragging) return;
      dragging = false; scaleCards(1);
      if (performance.now() - lastT > 80) v = 0;
      v = Math.max(-VMAX, Math.min(VMAX, v * POWER));
      coast();
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    el.addEventListener('click', function (e) { if (travelled > 5) { e.preventDefault(); e.stopPropagation(); } }, true);
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    el.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scroll stays with the page
      e.preventDefault();
      v = Math.max(-VMAX, Math.min(VMAX, e.deltaX * WHEEL * 16.667 / 6));
      coast();
    }, { passive: false });
  })();

  /* ---------- service tabs: fade out, swap, fade in ---------- */
  $$('[data-tabs]').forEach(function (root, n) {
    var links = $$('.tab', root), panes = $$('.pane', root), busy = null;
    var current = (links.filter(function (a) { return a.classList.contains('is-current'); })[0] || links[0]).dataset.tab;
    links.forEach(function (a, i) {
      var pane = panes.filter(function (p) { return p.dataset.pane === a.dataset.tab; })[0];
      a.id = 'tab-' + n + '-' + i; a.setAttribute('role', 'tab');
      if (pane) { pane.id = 'pane-' + n + '-' + i; pane.setAttribute('role', 'tabpanel'); pane.setAttribute('aria-labelledby', a.id); a.setAttribute('aria-controls', pane.id); }
    });
    function paint() {
      links.forEach(function (a) {
        var on = a.dataset.tab === current;
        a.classList.toggle('is-current', on); a.setAttribute('aria-selected', String(on)); a.setAttribute('tabindex', on ? '0' : '-1');
      });
    }
    paint();
    function go(name) {
      if (!name || name === current) return;
      var from = panes.filter(function (p) { return p.dataset.pane === current; })[0];
      var to = panes.filter(function (p) { return p.dataset.pane === name; })[0];
      current = name; paint();
      var swap = function () {
        panes.forEach(function (p) { p.classList.toggle('is-active', p === to); });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        if (window.gsap && !reduce) busy = gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'none', clearProps: 'opacity' });
      };
      if (busy) busy.kill();
      if (window.gsap && !reduce && from) busy = gsap.to(from, { opacity: 0, duration: 0.5, ease: 'none', clearProps: 'opacity', onComplete: swap });
      else swap();
    }
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); go(a.dataset.tab); });
      a.addEventListener('keydown', function (e) {
        var d = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
        var s = e.key in d ? i + d[e.key] : e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : null;
        if (s === null) return;
        e.preventDefault(); s = (s + links.length) % links.length; links[s].focus(); go(links[s].dataset.tab);
      });
    });
  });

  if (!gsapOk) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  if (window.CustomEase) gsap.registerPlugin(CustomEase);

  /* ---------- nav: grey out the link of the section you are in ---------- */
  $$('a[data-nav]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href.charAt(0) !== '#') return; // links to other pages
    var target = document.getElementById(href.slice(1));
    if (!target) return;
    ScrollTrigger.create({ trigger: target, start: 'top center', end: 'bottom center', onToggle: function (st) { a.classList.toggle('is-current', st.isActive); } });
  });

  /* ---------- mobile menu: white sheet wipes down, links rise in ---------- */
  if ($('[data-menu="open"]')) {
    var ease = window.CustomEase ? CustomEase.create('menuOpen', 'M0,160 C36.8,0 51.2,0 160,0') : 'power4.inOut';
    gsap.matchMedia().add('(max-width: 991px)', function () {
      var tl = gsap.timeline({ paused: true, onReverseComplete: function () { doc.style.removeProperty('overflow'); } });
      tl.to(doc, { '--clip': '0%', duration: reduce ? 0 : 1.4, ease: ease }, 0)
        .from('[data-nav]', { opacity: 0, y: '1rem', duration: reduce ? 0 : 0.5, stagger: 0.06 }, reduce ? 0 : 0.5)
        .set(doc, { overflow: 'hidden' }, 0.001);
      var off = [];
      var on = function (sel, fn) { $$(sel).forEach(function (n) { n.addEventListener('click', fn); off.push([n, fn]); }); };
      on('[data-menu="open"]', function () { tl.timeScale(1).play(); });
      on('[data-menu="close"]', function () { tl.timeScale(1.2).reverse(); });
      on('[data-nav], [data-nav-cta]', function () { if (tl.progress() > 0) tl.timeScale(1.2).reverse(); });
      return function () { off.forEach(function (p) { p[0].removeEventListener('click', p[1]); }); doc.style.removeProperty('overflow'); doc.style.removeProperty('--clip'); };
    });
  }

  if (reduce) return;

  document.fonts.ready.then(function () {
    /* load sequence: the hero text block and the navbar ease in. Logo and characters stay still. */
    var load = gsap.timeline();
    if ($('[data-hero-bottom]')) load.from('[data-hero-bottom]', { y: '1rem', opacity: 0, duration: 0.6, ease: 'power2.out' }, 1.1);
    load.from('[data-navbar]', { y: '-1rem', opacity: 0, duration: 0.6, ease: 'power2.out', clearProps: 'transform' }, $('[data-hero-bottom]') ? 1.1 : 0.2);

    /* the three pictures fade up one after another */
    if ($('.three')) gsap.from('.three .slot', { opacity: 0, y: '1rem', duration: 0.5, stagger: 0.2, ease: 'sine.inOut', scrollTrigger: { trigger: '.three', start: 'top 50%', once: true } });

    /* project cards fade up one after another when the section arrives */
    if ($('#projects')) gsap.from('#projects .swiper-slide', { opacity: 0, y: '1rem', duration: 0.5, stagger: 0.15, ease: 'sine.out', clearProps: 'opacity', scrollTrigger: { trigger: '#projects', start: 'top 60%', once: true } });

    /* the two big statements: each line rises out of its own mask */
    $$('[data-reveal]').forEach(function (text) {
      SplitText.create(text, {
        type: 'lines', linesClass: 'split-line', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 100, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: text, start: 'top 80%', once: true } });
        }
      });
    });
  });

  /* ---------- project pages: the clicked card picture morphs into the first project image ---------- */
  var lastCard = null;
  document.addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('.card'); if (c) lastCard = c; }, true);
  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !e.activation) return;
    var path = function (u) { return new URL(u, location.href).pathname.replace(/\/$/, ''); };
    var dest = path(e.activation.entry.url);
    var cards = $$('.card').filter(function (c) { return c.getAttribute('href') && path(c.href) === dest && $('.card__img img', c); });
    if (!cards.length) return;
    var pick = lastCard && cards.indexOf(lastCard) !== -1 ? lastCard : cards[0];
    var slide = pick.closest('.swiper-slide');
    if (slide) { slide.style.transition = 'none'; slide.style.transform = 'none'; }
    $('.card__img img', pick).style.viewTransitionName = 'hero';
  });
  window.addEventListener('pageshow', function () {
    lastCard = null;
    $$('.card__img img').forEach(function (i) { i.style.viewTransitionName = ''; });
  });
})();
