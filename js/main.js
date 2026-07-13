/* ============================================
   J&F Building — Site Scripts
   ============================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  /* --------------------------------------------
     Body scroll lock
     `overflow: hidden` alone doesn't hold on iOS Safari, so pin the body
     and restore the scroll position on release.
     -------------------------------------------- */
  const scrollLock = (() => {
    let y = 0;
    let locked = false;
    return {
      lock() {
        if (locked) return;
        y = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${y}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        locked = true;
      },
      unlock() {
        if (!locked) return;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        locked = false;
        window.scrollTo(0, y);
      },
      get isLocked() { return locked; },
    };
  })();

  document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------
       Scroll-triggered reveals
       -------------------------------------------- */
    const revealables = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      revealables.forEach(el => el.classList.add('visible'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealables.forEach(el => observer.observe(el));
    }

    /* --------------------------------------------
       Stat count-up
       -------------------------------------------- */
    const statHeadings = document.querySelectorAll('.stat h3');
    if (statHeadings.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
      const animateStat = (el) => {
        const match = el.textContent.trim().match(/^([\d.]+)(.*)$/);
        if (!match) return;
        const target = parseFloat(match[1]);
        const suffix = match[2] || '';
        const decimals = (match[1].split('.')[1] || '').length;
        const duration = 2000;
        const start = performance.now();
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          el.textContent = (target * easeOut(p)).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateStat(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      statHeadings.forEach(el => statObserver.observe(el));
    }

    /* --------------------------------------------
       Mobile menu
       -------------------------------------------- */
    const nav = document.querySelector('.nav');
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks = document.querySelector('.nav-links');

    const menu = {
      get isOpen() { return hamburger && hamburger.getAttribute('aria-expanded') === 'true'; },
      open() {
        hamburger.setAttribute('aria-expanded', 'true');
        navLinks.classList.add('open');
        nav.classList.add('menu-open');
        nav.classList.remove('nav-hidden');
        scrollLock.lock();
      },
      close({ focusToggle = false } = {}) {
        if (!this.isOpen) return;
        hamburger.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
        nav.classList.remove('menu-open');
        scrollLock.unlock();
        if (focusToggle) hamburger.focus();
      },
      toggle() { this.isOpen ? this.close() : this.open(); },
    };

    if (hamburger && navLinks && nav) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-controls', navLinks.id || 'primary-nav');
      if (!navLinks.id) navLinks.id = 'primary-nav';

      on(hamburger, 'click', () => menu.toggle());
      navLinks.querySelectorAll('a').forEach(link => on(link, 'click', () => menu.close()));

      on(document, 'keydown', (e) => {
        if (e.key === 'Escape' && menu.isOpen) menu.close({ focusToggle: true });
      });

      // Keep focus inside the open panel.
      on(navLinks, 'keydown', (e) => {
        if (e.key !== 'Tab' || !menu.isOpen) return;
        const focusable = [hamburger, ...navLinks.querySelectorAll('a')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });

      // Returning to the desktop breakpoint must not leave the body locked.
      const desktop = window.matchMedia('(min-width: 993px)');
      const onBreakpoint = (e) => { if (e.matches) menu.close(); };
      desktop.addEventListener ? desktop.addEventListener('change', onBreakpoint)
                               : desktop.addListener(onBreakpoint);
    }

    /* --------------------------------------------
       Header: shadow on scroll, hide on scroll-down
       -------------------------------------------- */
    if (nav) {
      let lastScrollY = window.scrollY;
      let ticking = false;
      on(window, 'scroll', () => {
        if (ticking || scrollLock.isLocked) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          nav.classList.toggle('scrolled', y > 60);
          if (!menu.isOpen) {
            nav.classList.toggle('nav-hidden', y > lastScrollY && y > 160);
          }
          lastScrollY = y;
          ticking = false;
        });
      }, { passive: true });
    }

    /* --------------------------------------------
       Active nav link
       -------------------------------------------- */
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    /* --------------------------------------------
       Project filter
       -------------------------------------------- */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    function applyFilter(filter) {
      filterBtns.forEach(b => {
        const active = b.dataset.filter === filter;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      projectCards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.hidden = !show;
        // Cards revealed by a filter change may never have crossed the
        // observer, so make sure they aren't stuck at opacity 0.
        if (show) card.classList.add('visible');
      });
    }

    if (filterBtns.length) {
      filterBtns.forEach(btn => on(btn, 'click', () => {
        applyFilter(btn.dataset.filter);
        history.replaceState(null, '',
          btn.dataset.filter === 'all' ? location.pathname : `?filter=${btn.dataset.filter}`);
      }));

      const requested = new URLSearchParams(window.location.search).get('filter');
      const valid = requested && [...filterBtns].some(b => b.dataset.filter === requested);
      applyFilter(valid ? requested : 'all');
    }

    /* --------------------------------------------
       Lightbox
       -------------------------------------------- */
    const lightbox = document.querySelector('.lightbox');
    if (lightbox && projectCards.length) {
      const lightboxImg = lightbox.querySelector('img');
      const btnPrev = lightbox.querySelector('.lightbox-prev');
      const btnNext = lightbox.querySelector('.lightbox-next');
      const btnClose = lightbox.querySelector('.lightbox-close');
      const counter = lightbox.querySelector('.lightbox-counter');

      let images = [];
      let index = 0;
      let lastFocused = null;

      const show = (i) => {
        if (!images.length) return;
        index = (i + images.length) % images.length;
        const src = images[index];
        lightboxImg.style.opacity = '0';
        const pre = new Image();
        const swap = () => {
          lightboxImg.src = src;
          lightboxImg.alt = `Project photo ${index + 1} of ${images.length}`;
          requestAnimationFrame(() => { lightboxImg.style.opacity = '1'; });
        };
        pre.onload = swap;
        pre.onerror = swap;
        pre.src = src;

        const multi = images.length > 1;
        if (counter) {
          counter.textContent = `${index + 1} / ${images.length}`;
          counter.hidden = !multi;
        }
        if (btnPrev) btnPrev.hidden = !multi;
        if (btnNext) btnNext.hidden = !multi;

        // Warm the neighbours so swiping feels instant.
        if (multi) {
          [images[(index + 1) % images.length], images[(index - 1 + images.length) % images.length]]
            .forEach(s => { const im = new Image(); im.src = s; });
        }
      };

      const open = (card) => {
        try {
          images = card.dataset.gallery ? JSON.parse(card.dataset.gallery) : [];
        } catch { images = []; }
        if (!images.length) {
          const img = card.querySelector('img');
          images = img ? [img.currentSrc || img.src] : [];
        }
        if (!images.length) return;
        lastFocused = document.activeElement;
        show(0);
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        scrollLock.lock();
        (btnClose || lightbox).focus();
      };

      const close = () => {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lightbox-open');
        scrollLock.unlock();
        images = [];
        if (lastFocused) lastFocused.focus();
      };

      projectCards.forEach(card => {
        on(card, 'click', () => open(card));
        // Cards are <button>s, so Enter/Space already fire click.
      });

      on(btnPrev, 'click', (e) => { e.stopPropagation(); show(index - 1); });
      on(btnNext, 'click', (e) => { e.stopPropagation(); show(index + 1); });
      on(btnClose, 'click', close);

      // Only the backdrop dismisses — tapping the photo itself used to close it.
      on(lightbox, 'click', (e) => { if (e.target === lightbox || e.target.classList.contains('lightbox-figure')) close(); });

      on(document, 'keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(index - 1);
        else if (e.key === 'ArrowRight') show(index + 1);
        else if (e.key === 'Tab') {
          const focusable = [btnClose, btnPrev, btnNext].filter(b => b && !b.hidden);
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });

      // Swipe between photos.
      let touchX = 0, touchY = 0, swiping = false;
      on(lightbox, 'touchstart', (e) => {
        if (e.touches.length !== 1) return;
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
        swiping = true;
      }, { passive: true });
      on(lightbox, 'touchend', (e) => {
        if (!swiping) return;
        swiping = false;
        const dx = e.changedTouches[0].clientX - touchX;
        const dy = e.changedTouches[0].clientY - touchY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }

    /* --------------------------------------------
       Smooth scroll for in-page anchors
       -------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      on(anchor, 'click', (e) => {
        const id = anchor.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });

    /* --------------------------------------------
       Contact form — real submission via Formspree
       -------------------------------------------- */
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
      const status = contactForm.querySelector('.form-status');
      const submitBtn = contactForm.querySelector('[type="submit"]');
      const endpoint = contactForm.getAttribute('action') || '';

      const setStatus = (msg, kind) => {
        if (!status) return;
        status.textContent = msg;
        status.className = `form-status is-${kind}`;
        status.hidden = false;
      };

      on(contactForm, 'submit', async (e) => {
        e.preventDefault();

        if (!contactForm.reportValidity()) return;

        // Honeypot: a real user never fills this in.
        if (contactForm.querySelector('input[name="_gotcha"]')?.value) return;

        if (endpoint.includes('YOUR_FORM_ID')) {
          setStatus(
            'This form isn’t connected yet. Please call 07527 106062 or email JnFbuilding@outlook.com.',
            'error'
          );
          return;
        }

        const original = submitBtn.textContent;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = 'Sending…';
        if (status) status.hidden = true;

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            body: new FormData(contactForm),
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          contactForm.reset();
          setStatus('Thank you — your enquiry has been sent. We’ll be in touch within one working day.', 'success');
        } catch {
          setStatus(
            'Sorry, that didn’t send. Please call 07527 106062 or email JnFbuilding@outlook.com.',
            'error'
          );
        } finally {
          submitBtn.removeAttribute('aria-busy');
          submitBtn.textContent = original;
        }
      });
    }
  });
})();
