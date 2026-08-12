/* ==========================================================================
   Commerce Wright — interaction & motion
   Everything here is progressive. Without JS, or without GSAP, or with
   reduced-motion on, the page stays fully readable — nothing is hidden by
   default in CSS unless this file adds `.js-motion` first.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var animate = hasGSAP && !reduced;

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (animate) root.classList.add('js-motion');

  /* --------------------------------------------------------------------
     Theme — cyanotype toggle, remembered
     -------------------------------------------------------------------- */
  (function theme() {
    var btn = document.getElementById('themeToggle');
    var stored = null;
    try { stored = localStorage.getItem('cw-theme'); } catch (e) {}

    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var current = stored || (systemDark ? 'dark' : 'light');
    apply(current);

    function apply(mode) {
      current = mode;
      root.setAttribute('data-theme', mode);
      if (!btn) return;
      var dark = mode === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Switch to drafting-paper (light) theme' : 'Switch to cyanotype (dark) theme');
    }

    if (btn) {
      btn.addEventListener('click', function () {
        var next = current === 'dark' ? 'light' : 'dark';
        apply(next);
        try { localStorage.setItem('cw-theme', next); } catch (e) {}
      });
    }
  })();

  /* --------------------------------------------------------------------
     Accordion — works with or without GSAP
     -------------------------------------------------------------------- */
  (function accordion() {
    var buttons = document.querySelectorAll('.acc__q');

    Array.prototype.forEach.call(buttons, function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));

        if (!animate) {
          panel.hidden = open;
          return;
        }

        if (open) {
          gsap.to(panel, {
            height: 0, duration: 0.28, ease: 'power2.inOut',
            onComplete: function () { panel.hidden = true; gsap.set(panel, { height: 'auto' }); ScrollTrigger.refresh(); }
          });
        } else {
          panel.hidden = false;
          gsap.fromTo(panel, { height: 0 }, {
            height: 'auto', duration: 0.32, ease: 'power2.out',
            onComplete: function () { ScrollTrigger.refresh(); }
          });
        }
      });
    });
  })();

  /* --------------------------------------------------------------------
     Bench tabs — roving tabindex, arrow keys, schematic redraw
     -------------------------------------------------------------------- */
  var benchDraw = { play: function () {} };

  (function tabs() {
    var list = document.querySelector('.benchtabs');
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('is-active', on);
        if (!panel) return;
        panel.hidden = !on;
        panel.tabIndex = on ? 0 : -1;
        panel.classList.toggle('is-active', on);
      });
      if (focus) tab.focus();

      var active = document.getElementById(tab.getAttribute('aria-controls'));
      if (!active) return;

      if (animate) {
        benchDraw.play(active);
        gsap.fromTo(active.querySelector('.bench-copy'),
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out' });
        ScrollTrigger.refresh();
      }
    }

    tabs.forEach(function (t) {
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.tabIndex = t.classList.contains('is-active') ? 0 : -1;
    });

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        select(next, true);
      });
    });
  })();

  /* --------------------------------------------------------------------
     Form — client-side validation only; no backend wired up
     -------------------------------------------------------------------- */
  (function form() {
    var f = document.getElementById('reviewForm');
    if (!f) return;
    var done = document.getElementById('formDone');

    function fail(input, msg) {
      var field = input.closest('.field');
      var err = field && field.querySelector('.field__err');
      field && field.classList.add('is-bad');
      if (err) err.textContent = msg;
    }
    function clear(input) {
      var field = input.closest('.field');
      var err = field && field.querySelector('.field__err');
      field && field.classList.remove('is-bad');
      if (err) err.textContent = '';
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = f.querySelectorAll('[required]');
      var firstBad = null;

      Array.prototype.forEach.call(required, function (input) {
        clear(input);
        var v = (input.value || '').trim();
        if (!v) {
          fail(input, 'Required');
          firstBad = firstBad || input;
        } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
          fail(input, 'That address does not look right');
          firstBad = firstBad || input;
        }
      });

      if (firstBad) { firstBad.focus(); return; }

      f.querySelectorAll('.field').forEach(function (fl) { fl.classList.remove('is-bad'); });
      if (done) {
        done.hidden = false;
        if (animate) gsap.fromTo(done, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
      }
      f.reset();
    });

    Array.prototype.forEach.call(f.querySelectorAll('input, select, textarea'), function (input) {
      input.addEventListener('input', function () { clear(input); });
      input.addEventListener('change', function () { clear(input); });
    });
  })();

  /* ====================================================================
     Everything past this point is motion. Bail out cleanly if we can't
     or shouldn't animate.
     ==================================================================== */
  if (!animate) return;

  gsap.defaults({ ease: 'power2.out' });

  /* Browser scroll restoration and ScrollTrigger pinning don't mix: on reload
     the browser restores the old offset, ScrollTrigger measures against it, and
     the pin bakes in a start position thousands of pixels wrong. Start every
     load at the top and measure from there. Any #hash still resolves after. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (window.scrollY > 0 && !window.location.hash) window.scrollTo(0, 0);

  /* --- hero headline: word-level mask reveal --------------------------- */
  (function splitHeadline() {
    var h1 = document.querySelector('.js-split');
    if (!h1) return;
    var words = h1.textContent.split(/\s+/).filter(Boolean);
    h1.textContent = '';
    words.forEach(function (w, i) {
      var outer = document.createElement('span');
      outer.className = 'w';
      var inner = document.createElement('span');
      inner.className = 'wi';
      inner.textContent = w;
      outer.appendChild(inner);
      h1.appendChild(outer);
      if (i < words.length - 1) h1.appendChild(document.createTextNode(' '));
    });
  })();

  /* --- prepare every schematic for a line-draw ------------------------- */
  function prepDraw(scope) {
    var groups = scope.querySelectorAll('.draw');
    Array.prototype.forEach.call(groups, function (g) {
      var geo = g.querySelectorAll('path, rect, circle, line, polyline');
      Array.prototype.forEach.call(geo, function (el) {
        var len = 0;
        try { len = el.getTotalLength(); } catch (err) { len = 0; }
        if (!len || !isFinite(len)) len = 400;
        el.style.strokeDasharray = len;
        el.style.strokeDashoffset = len;
      });
    });
  }

  function drawIn(scope, opts) {
    opts = opts || {};
    var groups = scope.querySelectorAll('.draw');
    var geo = scope.querySelectorAll('.draw path, .draw rect, .draw circle, .draw line, .draw polyline');
    var tl = gsap.timeline({ delay: opts.delay || 0 });
    tl.to(groups, { opacity: 1, duration: 0.2, stagger: 0.05 }, 0);
    tl.to(geo, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.035 }, 0);
    // labels ride in just behind their boxes
    var text = scope.querySelectorAll('.sch-lab, .sch-sub, .sch-dimtext, .sch-note-text');
    if (text.length) {
      gsap.set(text, { opacity: 0 });
      tl.to(text, { opacity: 1, duration: 0.35, stagger: 0.02 }, 0.35);
    }
    return tl;
  }

  var schematics = document.querySelectorAll('.schematic');
  Array.prototype.forEach.call(schematics, prepDraw);

  // bench panels redraw when their tab is chosen
  benchDraw.play = function (panel) {
    var svg = panel.querySelector('.schematic');
    if (!svg) return;
    prepDraw(svg);
    drawIn(svg);
  };

  /* --- hero entrance ---------------------------------------------------- */
  (function heroIn() {
    var tl = gsap.timeline({ delay: 0.15 });
    var label = document.querySelector('.hero .label');
    var wordsIn = document.querySelectorAll('.hero__h1 .wi');
    var heroSvg = document.querySelector('.schematic--hero');

    gsap.set('.hero__lede, .hero__cta, .hero__stats', { y: 16 });

    if (label) tl.from(label, { opacity: 0, y: 10, duration: 0.5 }, 0);
    if (wordsIn.length) {
      tl.from(wordsIn, {
        yPercent: 108, opacity: 0, duration: 0.72,
        ease: 'expo.out', stagger: 0.045
      }, 0.1);
    }
    tl.to('.hero__lede, .hero__cta, .hero__stats, .drawing-title',
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.35);

    if (heroSvg) drawIn(heroSvg, { delay: 0.55 });
  })();

  /* --- generic scroll reveals ------------------------------------------ */
  gsap.utils.toArray('.reveal').forEach(function (el) {
    if (el.closest('.hero')) return; // hero is handled by its own timeline
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.55,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    });
    gsap.set(el, { y: 22 });
  });

  /* --- staggered groups ------------------------------------------------- */
  function stagger(selector, sel, opts) {
    var container = document.querySelector(selector);
    if (!container) return;
    var items = container.querySelectorAll(sel);
    if (!items.length) return;
    gsap.set(items, { y: (opts && opts.y) || 20 });
    gsap.to(items, {
      opacity: 1, y: 0, duration: 0.5,
      stagger: (opts && opts.stagger) || 0.08,
      ease: (opts && opts.ease) || 'power2.out',
      scrollTrigger: { trigger: container, start: 'top 82%' }
    });
  }

  stagger('.breaks__list', '.brk', { stagger: 0.12, y: 28 });
  stagger('.proof__grid', '.case', { stagger: 0.08, ease: 'back.out(1.3)', y: 24 });
  stagger('.plans', '.plan', { stagger: 0.08, ease: 'back.out(1.3)' });
  stagger('.people__grid', '.person', { stagger: 0.06, ease: 'back.out(1.4)' });
  stagger('.band__grid', '.band__item', { stagger: 0.07 });
  stagger('.acc', '.acc__item', { stagger: 0.05, y: 14 });

  // bench schematic draws the first time it scrolls in
  (function firstBench() {
    var panel = document.querySelector('.benchpanel.is-active .schematic');
    if (!panel) return;
    ScrollTrigger.create({
      trigger: panel, start: 'top 82%', once: true,
      onEnter: function () { drawIn(panel); }
    });
  })();

  /* --- counters --------------------------------------------------------- */
  gsap.utils.toArray('.num[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: function () {
        el.textContent = dec ? obj.v.toFixed(dec) : Math.round(obj.v).toLocaleString('en-US');
      },
      onComplete: function () {
        el.textContent = dec ? target.toFixed(dec) : target.toLocaleString('en-US');
      }
    });
  });

  /* --- pinned horizontal process --------------------------------------- */
  var mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', function () {
    var pin = document.getElementById('processPin');
    var track = document.getElementById('processTrack');
    var section = document.getElementById('process');
    if (!pin || !track || !section) return;

    // Switch to the horizontal rail only now that the rail actually exists.
    section.classList.add('is-pinned');

    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 40); };

    gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: function () { return '+=' + (distance() + window.innerHeight * 0.4); },
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    // No separate entrance tween for the steps: the scrub already carries them
    // in, and a `from` tween here would strand them at opacity 0 if the page is
    // reloaded or deep-linked past its trigger.

    return function () { section.classList.remove('is-pinned'); };
  });

  mm.add('(max-width: 900px)', function () {
    var steps = document.querySelectorAll('.process .step, .process__intro');
    gsap.set(steps, { opacity: 0, y: 22 });
    gsap.to(steps, {
      opacity: 1, y: 0, duration: 0.5, stagger: 0.08,
      scrollTrigger: { trigger: '.process', start: 'top 78%' }
    });
  });

  /* --- background grid parallax (decorative layers only) ---------------- */
  gsap.utils.toArray('.gridfield__layer').forEach(function (layer) {
    gsap.to(layer, {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: layer.parentElement, scrub: true }
    });
  });

  /* --- marquee ---------------------------------------------------------- */
  (function marquee() {
    var row = document.querySelector('.marquee__row');
    if (!row) return;
    var tween = gsap.to(row, { xPercent: -50, duration: 42, ease: 'none', repeat: -1 });
    var wrap = document.getElementById('marquee');
    if (!wrap) return;
    wrap.addEventListener('pointerenter', function () { tween.timeScale(0.25); });
    wrap.addEventListener('pointerleave', function () { tween.timeScale(1); });
  })();

  /* --- nav scroll progress ---------------------------------------------- */
  (function progress() {
    var bar = document.getElementById('navProgress');
    if (!bar) return;
    var setter = gsap.quickSetter(bar, 'width', '%');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) { setter(self.progress * 100); }
    });
  })();

  /* --- drafting crosshair over the hero schematic ----------------------- */
  mm.add('(min-width: 1024px) and (pointer: fine)', function () {
    var fig = document.getElementById('heroFigure');
    var cross = document.getElementById('crosshair');
    if (!fig || !cross) return;

    var h = cross.querySelector('i');
    var v = cross.querySelector('b');
    var toY = gsap.quickTo(h, 'y', { duration: 0.32, ease: 'power3.out' });
    var toX = gsap.quickTo(v, 'x', { duration: 0.32, ease: 'power3.out' });

    function move(e) {
      var r = fig.getBoundingClientRect();
      toY(e.clientY - r.top);
      toX(e.clientX - r.left);
    }
    fig.addEventListener('pointermove', move);
    return function () { fig.removeEventListener('pointermove', move); };
  });

  /* --- magnetic buttons -------------------------------------------------- */
  mm.add('(pointer: fine)', function () {
    var cleanups = [];
    gsap.utils.toArray('.magnetic').forEach(function (el) {
      var toX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      var toY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });

      function move(e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        toX(gsap.utils.clamp(-6, 6, dx * 0.3));
        toY(gsap.utils.clamp(-6, 6, dy * 0.4));
      }
      function reset() { toX(0); toY(0); }

      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', reset);
      el.addEventListener('blur', reset);
      cleanups.push(function () {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', reset);
        el.removeEventListener('blur', reset);
        gsap.set(el, { x: 0, y: 0 });
      });
    });
    return function () { cleanups.forEach(function (fn) { fn(); }); };
  });

  /* --- recalc once webfonts have settled -------------------------------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(true); });
  }
  window.addEventListener('load', function () {
    ScrollTrigger.refresh(true);
    // one more after layout has fully settled — pinned sections are unforgiving
    setTimeout(function () { ScrollTrigger.refresh(true); }, 400);
  });

})();
