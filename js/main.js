(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const booting = root.classList.contains('is-booting');

  /* ----- Start-up screen: a short boot sequence, once per session ----- */
  if (booting) {
    const boot = document.createElement('div');
    boot.className = 'boot';
    boot.setAttribute('aria-hidden', 'true');
    boot.innerHTML = `
      <div class="boot__panel">
        <p class="boot__line"><span>&gt;</span> initializing portfolio</p>
        <p class="boot__line"><span>&gt;</span> loading modules: html css javascript <b>[ok]</b></p>
        <p class="boot__line"><span>&gt;</span> starting interface <b>[ok]</b></p>
        <p class="boot__line"><span>&gt;</span> welcome</p>
        <div class="boot__bar"><i></i></div>
      </div>`;
    document.body.append(boot);

    $$('.boot__line', boot).forEach((line, index) => {
      window.setTimeout(() => line.classList.add('is-shown'), 100 + index * 190);
    });

    let finished = false;
    const finishBoot = () => {
      if (finished) return;
      finished = true;
      boot.classList.add('is-done');
      root.classList.remove('is-booting');
      try { sessionStorage.setItem('booted', '1'); } catch (error) { /* storage blocked */ }
      window.setTimeout(() => boot.remove(), 450);
    };

    window.setTimeout(finishBoot, 1250);
    boot.addEventListener('click', finishBoot);
  }

  /* ----- Header state and back-to-top button ----- */
  const header = $('#site-header');
  const toTop = $('#to-top');
  const progress = $('#scroll-progress');
  const timeline = $('.timeline');
  const statusScroll = $('#sb-scroll');
  const statusSection = $('#sb-section');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    toTop.classList.toggle('is-visible', y > 600);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = max > 0 ? Math.min(y / max, 1) : 0;
    progress.style.transform = `scaleX(${scrolled})`;
    if (statusScroll) statusScroll.textContent = `${Math.round(scrolled * 100)}%`;

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
        if (!entry.isIntersecting) return;
        setActive(entry.target.dataset.nav || entry.target.id);

        // Status bar shows the file-style label of the section in view
        const label = entry.target.querySelector('.section-title');
        if (statusSection) statusSection.textContent = (label && label.dataset.tag) || entry.target.id;
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

  // Short titles resolve out of random characters, like text being decoded
  const scrambleChars = '<>/[]{}=+*#_01';

  const scramble = (element) => {
    const finalText = element.textContent;
    const steps = 20;
    let step = 0;

    element.setAttribute('aria-label', finalText);

    const tick = () => {
      step += 1;
      const resolved = Math.floor((finalText.length * step) / steps);
      element.textContent = Array.from(finalText, (char, index) => (
        index < resolved || char === ' '
          ? char
          : scrambleChars[Math.floor(Math.random() * scrambleChars.length)]
      )).join('');

      if (step < steps) window.setTimeout(tick, 34);
      else element.textContent = finalText;
    };
    tick();
  };

  const settle = (item) => {
    item.classList.add('is-visible');

    // Only plain, short titles: long ones would re-wrap while scrambling
    const title = item.querySelector('.section-title');
    if (title && !reducedMotion && !title.children.length && title.textContent.length <= 16) {
      scramble(title);
    }
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
    // Wait for the start-up screen to clear before typing
    window.setTimeout(type, booting ? 1900 : 700);
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

        // Tilt toward the pointer, a few degrees at most
        const tiltX = (event.clientX - box.left) / box.width - 0.5;
        const tiltY = (event.clientY - box.top) / box.height - 0.5;
        card.style.setProperty('--ry', `${(tiltX * 7).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${(tiltY * -7).toFixed(2)}deg`);
      });
    });
  }

  /* ----- Page: soft light that follows the pointer ----- */
  const cursorGlow = $('#cursor-glow');

  if (cursorGlow && !reducedMotion && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', (event) => {
      cursorGlow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      cursorGlow.classList.add('is-active');
    }, { passive: true });

    document.documentElement.addEventListener('pointerleave', () => {
      cursorGlow.classList.remove('is-active');
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

  /* ----- Hero: live local time in Yangon ----- */
  const clock = $('#local-time');

  if (clock) {
    try {
      const timeFormat = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Yangon',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const statusTime = $('#sb-time');
      const updateClock = () => {
        const now = `Yangon ${timeFormat.format(new Date())}`;
        clock.textContent = now;
        if (statusTime) statusTime.textContent = now;
      };

      updateClock();
      clock.hidden = false;
      window.setInterval(updateClock, 1000);
    } catch (error) {
      // Time zone data unavailable: leave the clock hidden
    }
  }

  /* ----- About: terminal types its commands when it comes into view ----- */
  const terminal = $('#terminal');

  if (terminal && 'IntersectionObserver' in window && !reducedMotion) {
    const lines = $$('.t-line', terminal);
    const wait = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });

    // Lines keep their space while hidden, so nothing below moves
    terminal.classList.add('is-typing');

    const playTerminal = async () => {
      await wait(500);

      for (const line of lines) {
        const text = $('.t-text', line);

        if (text) {
          const command = text.textContent;
          text.textContent = '';
          line.classList.add('is-shown');

          for (let index = 1; index <= command.length; index += 1) {
            text.textContent = command.slice(0, index);
            await wait(55);
          }
          await wait(260);
        } else {
          line.classList.add('is-shown');
          await wait(line.classList.contains('t-last') ? 0 : 380);
        }
      }
    };

    const terminalObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      playTerminal();
    }, { threshold: 0.5 });

    terminalObserver.observe(terminal);
  }

  /* ----- Status bar: window size ----- */
  const statusSize = $('#sb-size');

  if (statusSize) {
    const updateSize = () => { statusSize.textContent = `${window.innerWidth} x ${window.innerHeight}`; };
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
  }

  /* ----- Command menu: Ctrl+K (or Cmd+K) jumps to any section ----- */
  const palette = $('#palette');

  if (palette && typeof palette.showModal === 'function') {
    const paletteInput = $('#palette-input');
    const paletteList = $('#palette-list');
    const paletteEmpty = $('#palette-empty');

    const goTo = (selector) => () => {
      $(selector).scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    };

    const commands = [
      { label: 'Home', hint: 'section', run: goTo('#home') },
      { label: 'About Me', hint: 'section', run: goTo('#about') },
      { label: 'Skills', hint: 'section', run: goTo('#skills') },
      { label: 'Projects', hint: 'section', run: goTo('#projects') },
      { label: 'Experience', hint: 'section', run: goTo('#experience') },
      { label: 'Education', hint: 'section', run: goTo('#education') },
      { label: 'Certifications', hint: 'section', run: goTo('#certifications') },
      { label: 'Services', hint: 'section', run: goTo('#services') },
      { label: 'Contact', hint: 'section', run: goTo('#contact') },
      { label: 'Send an email', hint: 'action', run: () => { window.location.href = `mailto:${form.dataset.email}`; } },
      { label: 'Open GitHub profile', hint: 'link', run: () => { window.open('https://github.com/bandu246', '_blank', 'noopener'); } },
    ];

    let matches = [];
    let activeIndex = 0;

    const highlight = () => {
      $$('.palette__item', paletteList).forEach((item, index) => {
        const active = index === activeIndex;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
        if (active) {
          paletteInput.setAttribute('aria-activedescendant', item.id);
          item.scrollIntoView({ block: 'nearest' });
        }
      });
    };

    const runCommand = (command) => {
      palette.close();
      command.run();
    };

    const renderCommands = () => {
      const query = paletteInput.value.trim().toLowerCase();
      matches = commands.filter((command) => command.label.toLowerCase().includes(query));
      activeIndex = 0;

      paletteList.replaceChildren(...matches.map((command, index) => {
        const item = document.createElement('li');
        item.className = 'palette__item';
        item.id = `palette-item-${index}`;
        item.setAttribute('role', 'option');

        const hint = document.createElement('span');
        hint.textContent = command.hint;
        item.append(command.label, hint);

        item.addEventListener('click', () => runCommand(command));
        item.addEventListener('pointermove', () => {
          if (activeIndex !== index) {
            activeIndex = index;
            highlight();
          }
        });
        return item;
      }));

      paletteEmpty.hidden = matches.length > 0;
      if (!matches.length) paletteInput.removeAttribute('aria-activedescendant');
      highlight();
    };

    const openPalette = () => {
      if (palette.open) return;
      paletteInput.value = '';
      renderCommands();
      palette.showModal();
      paletteInput.focus();
    };

    paletteInput.addEventListener('input', renderCommands);

    paletteInput.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!matches.length) return;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        activeIndex = (activeIndex + step + matches.length) % matches.length;
        highlight();
      } else if (event.key === 'Enter' && matches[activeIndex]) {
        event.preventDefault();
        runCommand(matches[activeIndex]);
      }
    });

    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openPalette();
      }
    });

    $('#palette-open').addEventListener('click', openPalette);

    // A click on the dialog element itself is a click on the backdrop
    palette.addEventListener('click', (event) => {
      if (event.target === palette) palette.close();
    });
  }

  /* ----- Footer year ----- */
  $('#year').textContent = new Date().getFullYear();
})();
