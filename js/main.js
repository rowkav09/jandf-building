/* ============================================
   J&F Building — Site Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Auto-filter projects by URL param ---
  if (window.location.pathname.endsWith('projects.html')) {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam) {
      setTimeout(() => {
        const btn = document.querySelector(`.filter-btn[data-filter="${filterParam}"]`);
        if (btn) btn.click();
      }, 10);
    }
  }

  // --- Scroll-triggered fade-in animations ---
  const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
    observer.observe(el);
  });

  // --- Navbar scroll effect ---
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // --- Mobile hamburger toggle ---
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // --- Active nav link based on current page ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // --- Project filter (projects page) ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        projectCards.forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = '';
            requestAnimationFrame(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            });
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => { card.style.display = 'none'; }, 300);
          }
        });
      });
    });
  }

  // --- Lightbox with gallery navigation ---
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
  const lightboxPrev = lightbox ? lightbox.querySelector('.lightbox-prev') : null;
  const lightboxNext = lightbox ? lightbox.querySelector('.lightbox-next') : null;
  const lightboxCounter = lightbox ? lightbox.querySelector('.lightbox-counter') : null;
  let galleryImages = [];
  let galleryIndex = 0;

  function showGalleryImage(index) {
    if (!galleryImages.length) return;
    galleryIndex = index;
    lightboxImg.src = galleryImages[galleryIndex];
    if (lightboxCounter) {
      lightboxCounter.textContent = (galleryIndex + 1) + ' / ' + galleryImages.length;
    }
    if (lightboxPrev) lightboxPrev.style.display = galleryImages.length > 1 ? 'flex' : 'none';
    if (lightboxNext) lightboxNext.style.display = galleryImages.length > 1 ? 'flex' : 'none';
    if (lightboxCounter) lightboxCounter.style.display = galleryImages.length > 1 ? '' : 'none';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    galleryImages = [];
  }

  if (lightbox) {
    document.querySelectorAll('.project-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const galleryData = card.dataset.gallery;
        if (galleryData) {
          galleryImages = JSON.parse(galleryData);
        } else {
          const img = card.querySelector('img');
          galleryImages = img ? [img.src] : [];
        }
        galleryIndex = 0;
        showGalleryImage(0);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        showGalleryImage((galleryIndex - 1 + galleryImages.length) % galleryImages.length);
      });
    }
    if (lightboxNext) {
      lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        showGalleryImage((galleryIndex + 1) % galleryImages.length);
      });
    }

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === lightboxImg) closeLightbox();
    });
    const closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showGalleryImage((galleryIndex - 1 + galleryImages.length) % galleryImages.length);
      if (e.key === 'ArrowRight') showGalleryImage((galleryIndex + 1) % galleryImages.length);
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Contact form (basic client-side) ---
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('.btn');
      const originalText = btn.textContent;
      btn.textContent = 'Message Sent!';
      btn.style.background = '#4CAF50';
      btn.style.borderColor = '#4CAF50';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.borderColor = '';
        contactForm.reset();
      }, 3000);
    });
  }

});
