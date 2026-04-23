'use strict';

/* ============================================================
   APP.JS — Digital Love Letter
   ============================================================ */

// ─── Utilities ───────────────────────────────────────────────
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
window.scrollToSection = scrollToSection;

// ─── Hero entrance (staggered fade-up) ───────────────────────
function initHero() {
  qsa('.fade-up').forEach(el => {
    const delay = parseInt(el.dataset.delay || 0);
    setTimeout(() => el.classList.add('in'), delay);
  });

  const ctaBtn = qs('.hero__cta');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      const song = qs('#hero-song');
      if (song) song.play().catch(() => { });
    });
  }
}

function initAudioPlayer() {
  const playerBtn = qs('#audio-player-btn');
  const trackLabel = qs('#audio-player-track');
  if (!playerBtn || !trackLabel) return;

  const songs = qsa('audio');
  let activeSong = null;

  function syncPlayerUI() {
    const hasActiveSong = activeSong && !activeSong.paused;
    playerBtn.textContent = hasActiveSong ? 'Pause Music' : 'Play Music';
    playerBtn.setAttribute('aria-pressed', String(Boolean(hasActiveSong)));
    if (hasActiveSong) {
      trackLabel.textContent = activeSong.dataset.trackName || activeSong.id;
    } else {
      trackLabel.textContent = 'No song yet';
    }
  }

  songs.forEach(song => {
    song.addEventListener('play', () => {
      songs.forEach(otherSong => {
        if (otherSong !== song && !otherSong.paused) otherSong.pause();
      });
      activeSong = song;
      syncPlayerUI();
    });

    song.addEventListener('pause', () => {
      if (activeSong === song) {
        const stillPlaying = Array.from(songs).find(otherSong => !otherSong.paused);
        activeSong = stillPlaying || null;
      }
      syncPlayerUI();
    });

    song.addEventListener('ended', syncPlayerUI);
  });

  playerBtn.addEventListener('click', () => {
    if (activeSong && !activeSong.paused) {
      activeSong.pause();
      return;
    }

    const fallbackSong = activeSong || qs('#hero-song') || songs[0];
    if (fallbackSong) {
      fallbackSong.play().catch(() => { });
    }
  });

  syncPlayerUI();
}

function initChapterProgress() {
  const progressWrap = qs('#chapter-progress');
  const progressLabel = qs('#chapter-progress-label');
  const progressFill = qs('#chapter-progress-fill');
  const progressBar = progressWrap ? progressWrap.querySelector('.chapter-progress__bar') : null;
  const sections = qsa('.page[id]');

  if (!progressWrap || !progressLabel || !progressFill || !progressBar || !sections.length) return;

  const total = sections.length;

  function setProgress(index) {
    const current = index + 1;
    progressLabel.textContent = `Chapter ${current} / ${total}`;
    progressFill.style.width = `${(current / total) * 100}%`;
    progressBar.setAttribute('aria-valuenow', String(current));
  }

  setProgress(0);

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const index = Array.from(sections).findIndex(section => section.id === entry.target.id);
      if (index >= 0) setProgress(index);
    });
  }, { threshold: 0.55 });

  sections.forEach(section => io.observe(section));
}

function initLetterTyping() {
  const letterBody = qs('#letter-body');
  if (!letterBody || letterBody.dataset.typing !== 'true') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paragraphs = Array.from(letterBody.querySelectorAll('p'));
  if (!paragraphs.length) return;

  const originalTexts = paragraphs.map(paragraph => paragraph.textContent || '');
  let hasTyped = false;

  function showStaticText() {
    paragraphs.forEach((paragraph, index) => {
      paragraph.textContent = originalTexts[index];
    });
    letterBody.classList.remove('is-typing');
    letterBody.classList.add('is-ready');
  }

  function typeParagraph(index) {
    if (index >= paragraphs.length) {
      letterBody.classList.remove('is-typing');
      letterBody.classList.add('is-ready');
      return;
    }

    const paragraph = paragraphs[index];
    const fullText = originalTexts[index];
    let pointer = 0;

    paragraph.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'letter__typing-cursor';
    cursor.textContent = '|';
    paragraph.appendChild(cursor);

    function tick() {
      pointer += 1;
      const nextText = fullText.slice(0, pointer);
      paragraph.textContent = nextText;
      paragraph.appendChild(cursor);

      if (pointer >= fullText.length) {
        cursor.remove();
        setTimeout(() => typeParagraph(index + 1), 220);
        return;
      }

      const delay = fullText[pointer - 1] === ' ' ? 12 : 20;
      setTimeout(tick, delay);
    }

    tick();
  }

  if (reducedMotion) {
    showStaticText();
    return;
  }

  letterBody.classList.add('is-typing');

  const section = qs('#letter') || letterBody;
  const io = new IntersectionObserver(entries => {
    if (hasTyped || !entries[0].isIntersecting) return;
    hasTyped = true;
    typeParagraph(0);
    io.disconnect();
  }, { threshold: 0.35 });

  io.observe(section);
}

// ─── Floating hearts on canvas ───────────────────────────────
function initPetals() {
  const canvas = qs('#petals-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function newParticle() {
    const size = Math.random() * 6 + 3;
    return {
      x: Math.random() * canvas.width,
      y: -20,
      size,
      opacity: Math.random() * 0.35 + 0.08,
      vy: Math.random() * 0.8 + 0.35,
      vx: (Math.random() - 0.5) * 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.018,
      sway: Math.random() * 0.008 + 0.003,
      swayOff: Math.random() * Math.PI * 2,
      hue: 335 + Math.random() * 25,
    };
  }

  function drawHeart(ctx, p, t) {
    ctx.save();
    ctx.translate(p.x + Math.sin(t * p.sway + p.swayOff) * 12, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.25);
    ctx.bezierCurveTo(s * 0.5, -s * 0.85, s, -s * 0.25, s, s * 0.25);
    ctx.bezierCurveTo(s, s * 0.7, 0, s, 0, s);
    ctx.bezierCurveTo(0, s, -s, s * 0.7, -s, s * 0.25);
    ctx.bezierCurveTo(-s, -s * 0.25, -s * 0.5, -s * 0.85, 0, -s * 0.25);
    ctx.closePath();
    ctx.fillStyle = `hsl(${p.hue}, 55%, 68%)`;
    ctx.fill();
    ctx.restore();
  }

  function tick(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (particles.length < 28 && Math.random() < 0.08) {
      particles.push(newParticle());
    }
    particles = particles.filter(p => p.y < canvas.height + 30);
    particles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx;
      p.rotation += p.rotSpeed;
      drawHeart(ctx, p, t * 0.001);
    });
    raf = requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);

  // Only animate when hero is visible — saves battery
  const hero = qs('#hero');
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
    }
  });
  io.observe(hero);
}

// ─── Scroll reveal ───────────────────────────────────────────
function initReveal() {
  const els = qsa('.reveal');

  // Stagger items within the same section
  const counters = {};
  els.forEach(el => {
    const section = el.closest('section');
    const id = section ? section.id : '_';
    counters[id] = (counters[id] || 0);
    if (!el.dataset.delay) {
      el.dataset.delay = counters[id] * 90;
      counters[id]++;
    }
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = parseInt(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
}

// ─── Dot navigation ──────────────────────────────────────────
function initDotNav() {
  const items = qsa('.dot-nav__item');
  const sections = qsa('.page[id]');

  items.forEach(item => {
    item.querySelector('.dot-nav__btn').addEventListener('click', () => {
      scrollToSection(item.dataset.target);
    });
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      items.forEach(item => {
        item.classList.toggle('active', item.dataset.target === id);
      });
    });
  }, { threshold: 0.45 });

  sections.forEach(s => io.observe(s));
}

// ─── Gallery lightbox ────────────────────────────────────────
function initGallery() {
  const lightbox = qs('#lightbox');
  if (!lightbox) return;

  const lbImg = qs('#lightbox-img');
  const lbCaption = qs('#lightbox-caption');
  const lbClose = qs('#lightbox-close');

  function open(bgImg, caption) {
    lbImg.style.backgroundImage = bgImg;
    lbCaption.textContent = caption;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  qsa('.polaroid').forEach(p => {
    p.addEventListener('click', () => {
      const img = p.querySelector('.polaroid__img');
      const caption = p.dataset.caption || '';
      if (img) open(img.style.backgroundImage, caption);
    });
  });

  lbClose.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

// ─── Reason cards — tap to flip (mobile) ─────────────────────
function initReasonCards() {
  qsa('.reason-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
      if (card.classList.contains('flipped')) {
        spawnSurpriseHearts(card);
      }
    });
  });

  let loveThrottle = false;
  const loveCard = qs('.reason-card--love');
  if (loveCard) {
    loveCard.addEventListener('mousemove', () => {
      if (loveThrottle) return;
      loveThrottle = true;
      spawnLoveScreen();
      setTimeout(() => { loveThrottle = false; }, 500);
    });

    loveCard.addEventListener('click', () => {
      [qs('#hero-song'), qs('#birthday-song')].forEach(s => {
        if (s) { s.pause(); s.currentTime = 0; }
      });
      const loveSong = qs('#love-card-song');
      if (loveSong) loveSong.play().catch(() => { });
    });
  }
}

function spawnLoveScreen() {
  const hearts = ['❤️', '♥', '💕', '💗', '💖'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('span');
    el.className = 'love-heart';
    el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    el.style.left = (Math.random() * 90) + 'vw';
    el.style.top = (Math.random() * 80) + 'vh';
    el.style.animationDelay = (Math.random() * 0.4) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function spawnSurpriseHearts(card) {
  const rect = card.getBoundingClientRect();
  const emojis = ['♥', '✦', '✨', '🌹', '♡', '⭐'];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('span');
    el.className = 'surprise-heart';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = (rect.left + Math.random() * rect.width) + 'px';
    el.style.top = (rect.top + Math.random() * rect.height * 0.6) + 'px';
    el.style.animationDelay = (Math.random() * 0.25) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ─── Birthday cake + confetti ─────────────────────────────────
function initBirthday() {
  const blowBtn = qs('#blow-btn');
  const finalMsg = qs('#birthday-final');
  const hint = qs('#birthday-hint');
  const candles = qsa('.candle');
  if (!blowBtn) return;

  blowBtn.addEventListener('click', () => {
    const heroSong = qs('#hero-song');
    if (heroSong) { heroSong.pause(); heroSong.currentTime = 0; }

    const song = qs('#birthday-song');
    if (song) song.play().catch(() => { });

    // Blow each candle with a stagger
    candles.forEach((c, i) => {
      setTimeout(() => c.classList.add('blown'), i * 280);
    });

    blowBtn.classList.add('blown');
    if (hint) hint.style.opacity = '0';

    setTimeout(() => {
      if (finalMsg) finalMsg.classList.add('visible');
      launchConfetti();
    }, candles.length * 280 + 500);
  });
}

function launchConfetti() {
  const canvas = qs('#confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#c4758a', '#e5b0bc', '#c4a070', '#e8d0a0', '#ffffff', '#f7c5d0', '#ffd700'];
  const particles = Array.from({ length: 140 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 9 + 2;
    return {
      x: canvas.width * 0.5,
      y: canvas.height * 0.38,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      w: Math.random() * 11 + 4,
      h: Math.random() * 5 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.22,
      opacity: 1,
      gravity: 0.14,
    };
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.992;
      p.rotation += p.spin;
      p.opacity = Math.max(0, p.opacity - 0.006);
      if (p.opacity <= 0 || p.y > canvas.height + 30) return;
      alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (alive) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(draw);
}

// ─── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initAudioPlayer();
  initChapterProgress();
  initPetals();
  initReveal();
  initDotNav();
  initGallery();
  initLetterTyping();
  initReasonCards();
  initBirthday();
});
