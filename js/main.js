(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Header state and back-to-top button ----- */
  const header = $('#site-header');
  const toTop = $('#to-top');
  const progress = $('#scroll-progress');
  const timeline = $('.timeline');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    toTop.classList.toggle('is-visible', y > 600);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    // Fill the timeline line as it passes through the viewport
    if (timeline) {
      const box = timeline.getBoundingClientRect();
      const filled = (window.innerHeight * 0.62 - box.top) / box.height;
      timeline.style.setProperty('--progress', Math.min(Math.max(filled, 0), 1).toFixed(3));
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ----- Mobile menu ----- */
  const navToggle = $('.nav-toggle');
  const navMenu = $('#primary-nav');

  const setMenu = (open) => {
    navMenu.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  navToggle.addEventListener('click', () => {
    setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  navMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      navToggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#site-header')) setMenu(false);
  });

  /* ----- Highlight the current section in the navbar ----- */
  const navLinks = $$('.nav__link');
  const sections = $$('main section[id]');

  const setActive = (key) => {
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${key}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.dataset.nav || entry.target.id);
      });
    }, { rootMargin: '-45% 0px -54% 0px' });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ----- Scroll reveal ----- */
  const revealItems = $$('.reveal');

  // Stagger the children of grouped grids
  $$('[data-stagger]').forEach((group) => {
    const items = group.classList.contains('reveal') ? [] : $$('.reveal', group);
    items.forEach((item, index) => item.style.setProperty('--delay', `${index * 0.08}s`));
  });

  const settle = (item) => {
    item.classList.add('is-visible');
    const delay = parseFloat(item.style.getPropertyValue('--delay')) || 0;
    window.setTimeout(() => item.classList.add('is-settled'), reducedMotion ? 0 : (delay + 0.75) * 1000);
  };

  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        settle(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach(settle);
  }

  /* ----- Project filter ----- */
  const filterButtons = $$('.filter');
  const grid = $('#projects-grid');
  const cards = $$('.project-card', grid);
  const emptyMessage = $('#projects-empty');
  const filterStatus = $('#filter-status');
  let switchTimer;

  const applyFilter = (filter, label) => {
    let shown = 0;
    cards.forEach((card) => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.hidden = !match;
      if (match) {
        shown += 1;
        // Cards that were never scrolled into view must still appear
        card.style.setProperty('--delay', '0s');
        card.classList.add('is-visible', 'is-settled');
      }
    });
    emptyMessage.hidden = shown > 0;
    filterStatus.textContent = `Showing ${shown} ${shown === 1 ? 'project' : 'projects'} in ${label}.`;
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.classList.contains('is-active')) return;

      filterButtons.forEach((other) => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });

      const filter = button.dataset.filter;
      const label = button.textContent.trim();

      window.clearTimeout(switchTimer);
      if (reducedMotion) {
        applyFilter(filter, label);
        return;
      }

      grid.classList.add('is-switching');
      switchTimer = window.setTimeout(() => {
        applyFilter(filter, label);
        grid.classList.remove('is-switching');
      }, 220);
    });
  });

  /* ----- Project details modal ----- */
  const modal = $('#project-modal');
  const modalParts = {
    image: $('#modal-image'),
    type: $('#modal-type'),
    title: $('#modal-title'),
    details: $('#modal-details'),
    tags: $('#modal-tags'),
    demo: $('#modal-demo'),
    github: $('#modal-github'),
  };

  const openModal = (card) => {
    const image = $('.project-card__media img', card);
    const title = $('.project-card__title', card).cloneNode(true);
    $$('.sample-flag', title).forEach((flag) => flag.remove());
    const template = $('.project-card__details', card);

    modalParts.image.src = image.src;
    modalParts.image.alt = image.alt;
    modalParts.type.textContent = $('.project-card__type', card).textContent;
    modalParts.title.textContent = title.textContent.trim();
    modalParts.details.replaceChildren(template.content.cloneNode(true));
    modalParts.tags.replaceChildren(...$$('.tags li', card).map((tag) => tag.cloneNode(true)));
    // Link buttons are optional on a card
    ['demo', 'github'].forEach((key) => {
      const link = $(`[data-link="${key}"]`, card);
      modalParts[key].hidden = !link;
      if (link) modalParts[key].href = link.href;
    });

    modal.showModal();
  };

  if (typeof modal.showModal === 'function') {
    grid.addEventListener('click', (event) => {
      const trigger = event.target.closest('.js-details');
      if (trigger) openModal(trigger.closest('.project-card'));
    });

    $('#modal-close').addEventListener('click', () => modal.close());

    // A click on the dialog element itself is a click on the backdrop
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.close();
    });
  } else {
    $$('.js-details').forEach((button) => { button.hidden = true; });
  }

  /* ----- Contact form: validate, then open the visitor's email app ----- */
  const form = $('#contact-form');
  const status = $('#contact-status');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const messages = {
    name: 'Please enter your name.',
    email: 'Please enter a valid email address.',
    subject: 'Please enter a subject.',
    message: 'Please write a message.',
  };

  const validateField = (field) => {
    const value = field.value.trim();
    const valid = field.name === 'email' ? emailPattern.test(value) : value.length > 0;
    field.setAttribute('aria-invalid', String(!valid));
    $(`#${field.id}-error`).textContent = valid ? '' : messages[field.name];
    return valid;
  };

  const fields = $$('input, textarea', form);

  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      status.textContent = '';
      invalid[0].focus();
      return;
    }

    const data = new FormData(form);
    const body = `${data.get('message').trim()}\n\nFrom: ${data.get('name').trim()} <${data.get('email').trim()}>`;
    const url = `mailto:${form.dataset.email}?subject=${encodeURIComponent(data.get('subject').trim())}&body=${encodeURIComponent(body)}`;

    status.textContent = 'Opening your email app. Press send there to deliver the message.';
    window.location.href = url;
  });

  /* ----- Hero: type out the role once ----- */
  const role = $('.hero__role');

  if (role && !reducedMotion) {
    const fullText = role.textContent.trim();
    role.style.minHeight = `${role.offsetHeight}px`;

    // Screen readers get the full text; the typed copy is visual only
    const spoken = document.createElement('span');
    spoken.className = 'visually-hidden';
    spoken.textContent = fullText;

    const typed = document.createElement('span');
    typed.setAttribute('aria-hidden', 'true');

    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');

    role.replaceChildren(spoken, typed, caret);

    let index = 0;
    const type = () => {
      index += 1;
      typed.textContent = fullText.slice(0, index);
      if (index < fullText.length) window.setTimeout(type, 38);
      else window.setTimeout(() => caret.remove(), 2200);
    };
    window.setTimeout(type, 700);
  }

  /* ----- Hero: scrolling skills strip ----- */
  const marquee = $('.hero__marquee');

  if (marquee && !reducedMotion) {
    const startMarquee = () => {
      const list = $('.hero__stack', marquee);
      const items = $$('li', list);

      marquee.classList.add('is-marquee');
      const setWidth = list.getBoundingClientRect().width;
      if (!setWidth) return;

      // Enough copies to cover wide screens, so the loop never shows a gap
      const copies = Math.ceil(2600 / setWidth);
      for (let copy = 0; copy < copies; copy += 1) {
        items.forEach((item) => {
          const clone = item.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          list.append(clone);
        });
      }
      list.style.setProperty('--marquee-shift', `-${setWidth}px`);
    };

    // Measure after fonts load, or the loop point would be off
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(startMarquee);
    else startMarquee();
  }

  /* ----- About: count the statistics up ----- */
  const statsBlock = $('.stats');

  const countUp = (element) => {
    const match = element.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) return;

    const target = Number(match[1]);
    const suffix = match[2];
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progressRatio = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progressRatio, 3);
      element.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progressRatio < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (statsBlock && 'IntersectionObserver' in window && !reducedMotion) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      $$('dd', statsBlock).forEach(countUp);
      observer.disconnect();
    }, { threshold: 0.4 });

    statsObserver.observe(statsBlock);
  }

  /* ----- Cards: soft light that follows the pointer ----- */
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.skill-card, .project-card, .edu-card, .cert-card, .service-card, .timeline__card, .stat').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const box = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - box.left}px`);
        card.style.setProperty('--my', `${event.clientY - box.top}px`);
      });
    });
  }

  /* ----- Skills: list items appear one after another ----- */
  $$('.skill-list').forEach((list) => {
    $$('li', list).forEach((item, index) => item.style.setProperty('--i', index));
  });

  /* ----- Background: moving network of connected points ----- */
  const canvas = $('#bg-canvas');

  if (canvas && canvas.getContext && !reducedMotion) {
    const ctx = canvas.getContext('2d');
    const LINK_DISTANCE = 130;
    const POINTER_DISTANCE = 170;
    const pointer = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let particles = [];
    let frame = null;

    const makeParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.4 + 0.6,
    });

    const resize = () => {
      const widthChanged = window.innerWidth !== width;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Mobile browsers resize on scroll (address bar); keep the points then
      if (widthChanged) {
        const count = Math.min(90, Math.round((width * height) / 17000));
        particles = Array.from({ length: count }, makeParticle);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
      });

      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(110, 163, 255, 0.55)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < LINK_DISTANCE) {
            ctx.strokeStyle = `rgba(110, 163, 255, ${0.16 * (1 - distance / LINK_DISTANCE)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        const toPointer = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (toPointer < POINTER_DISTANCE) {
          ctx.strokeStyle = `rgba(127, 224, 255, ${0.35 * (1 - toPointer / POINTER_DISTANCE)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      frame = requestAnimationFrame(draw);
    };

    const start = () => { if (frame === null) frame = requestAnimationFrame(draw); };
    const stop = () => { cancelAnimationFrame(frame); frame = null; };

    let resizeTimer;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    });

    window.addEventListener('pointermove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      pointer.x = -9999;
      pointer.y = -9999;
    });

    // No drawing while the tab is in the background
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    resize();
    start();
  }

  /* ----- Footer year ----- */
  $('#year').textContent = new Date().getFullYear();
})();
