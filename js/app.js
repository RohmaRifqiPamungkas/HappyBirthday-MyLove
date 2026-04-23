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
  const player = qs('#audio-player');
  const playerBtn = qs('#audio-player-btn');
  const trackLabel = qs('#audio-player-track');
  const timeLabel = qs('#audio-player-time');
  if (!player || !playerBtn || !trackLabel) return;

  const songs = Array.from(qsa('audio'));
  const defaultSong = qs('#hero-song') || songs[0] || null;
  let activeSong = null;
  let selectedSong = defaultSong;

  function formatTime(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
    const safeSeconds = Math.floor(totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function updateTimeLabel(song) {
    if (!timeLabel) return;
    if (!song) {
      timeLabel.textContent = '00:00 / 00:00';
      return;
    }
    timeLabel.textContent = `${formatTime(song.currentTime)} / ${formatTime(song.duration)}`;
  }

  function getCurrentSong() {
    return activeSong || selectedSong || defaultSong;
  }

  function syncPlayerUI() {
    const hasActiveSong = activeSong && !activeSong.paused;
    const currentSong = getCurrentSong();

    player.classList.toggle('is-playing', Boolean(hasActiveSong));
    playerBtn.textContent = hasActiveSong ? 'Pause Music' : 'Play Music';
    playerBtn.setAttribute('aria-pressed', String(Boolean(hasActiveSong)));

    if (currentSong) {
      trackLabel.textContent = currentSong.dataset.trackName || currentSong.id;
    } else {
      trackLabel.textContent = 'No song yet';
    }

    updateTimeLabel(currentSong);
  }

  songs.forEach(song => {
    song.addEventListener('play', () => {
      songs.forEach(otherSong => {
        if (otherSong !== song && !otherSong.paused) otherSong.pause();
      });
      activeSong = song;
      selectedSong = song;
      syncPlayerUI();
    });

    song.addEventListener('pause', () => {
      if (activeSong === song && song.paused) {
        const stillPlaying = songs.find(otherSong => !otherSong.paused);
        activeSong = stillPlaying || null;
      }
      syncPlayerUI();
    });

    song.addEventListener('ended', () => {
      if (activeSong === song) activeSong = null;
      syncPlayerUI();
    });

    ['loadedmetadata', 'timeupdate', 'durationchange', 'seeked'].forEach(eventName => {
      song.addEventListener(eventName, () => {
        if (song === activeSong || song === selectedSong) syncPlayerUI();
      });
    });
  });

  playerBtn.addEventListener('click', () => {
    if (activeSong && !activeSong.paused) {
      activeSong.pause();
      return;
    }

    const nextSong = selectedSong || defaultSong;
    if (nextSong) {
      nextSong.play().catch(() => { });
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
  const signature = qs('#letter .letter__signature');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paragraphs = Array.from(letterBody.querySelectorAll('p'));
  if (!paragraphs.length) return;

  const originalTexts = paragraphs.map(paragraph => paragraph.textContent || '');
  let hasTyped = false;
  let isTyping = false;

  function showSignature() {
    if (!signature) return;
    signature.classList.remove('letter__signature--pending');
    signature.classList.add('letter__signature--visible');
  }

  function hideSignature() {
    if (!signature) return;
    signature.classList.remove('letter__signature--visible');
    signature.classList.add('letter__signature--pending');
  }

  function showStaticText() {
    paragraphs.forEach((paragraph, index) => {
      paragraph.textContent = originalTexts[index];
    });
    letterBody.dataset.typed = 'true';
    showSignature();
  }

  function resetForTyping() {
    paragraphs.forEach(paragraph => {
      paragraph.textContent = '';
    });
  }

  function typeParagraph(index) {
    if (index >= paragraphs.length) {
      isTyping = false;
      letterBody.dataset.typed = 'true';
      showSignature();
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

  hideSignature();

  const section = qs('#letter') || letterBody;
  const triggerTarget = qs('#letter .letter-wrap') || section;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (hasTyped || isTyping || !entry.isIntersecting) return;
      hasTyped = true;
      isTyping = true;
      resetForTyping();
      typeParagraph(0);
      io.disconnect();
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -18% 0px'
  });

  io.observe(triggerTarget);
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

// ─── Photo Booth ─────────────────────────────────────────────
function initPhotoBooth() {
  const startBtn = qs('#pb-start-btn');
  const retakeBtn = qs('#pb-retake-btn');
  const downloadBtn = qs('#pb-download-btn');
  const video = qs('#pb-video');
  const countdown = qs('#pb-countdown');
  const stripCanvas = qs('#pb-canvas');
  const thumbsWrap = qs('#pb-thumbs');
  const stripWrap = qs('#pb-strip');
  const camWrap = qs('#pb-camera-wrap');
  const idleOverlay = qs('#pb-idle');
  const shotDots = qsa('#pb-shot-indicator .pb-shot-dot');
  const frameOpts = qsa('#pb-frame-picker .pb-frame-opt');

  const LOVE_EMOJIS = ['❤', '❤', '❤', '❤', '❤', '❤', '❤', '❤'];
  const LOVESTRUCK_CROWN = [
    { ox: -0.62, oy: -0.30, scale: 0.55, tilt: -10 },
    { ox: -0.38, oy: -0.52, scale: 0.92, tilt: -8 },
    { ox: -0.16, oy: -0.68, scale: 1.02, tilt: -6 },
    { ox: 0.06, oy: -0.74, scale: 1.06, tilt: 0 },
    { ox: 0.28, oy: -0.62, scale: 0.95, tilt: 7 },
    { ox: 0.54, oy: -0.42, scale: 0.9, tilt: 10 },
    { ox: 0.72, oy: -0.16, scale: 0.62, tilt: 9 },
  ];

  const loveOverlay = document.createElement('div');
  loveOverlay.className = 'pb-love-overlay';
  camWrap.appendChild(loveOverlay);

  const lovestruckIcons = [];
  const hasFaceDetector = typeof window !== 'undefined' && 'FaceDetector' in window;
  const faceDetector = hasFaceDetector
    ? new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
    : null;

  const lovestruckState = {
    rawAnchorX: 0.5,
    anchorY: 0.43,
    radius: 0.15,
    detectBusy: false,
    detectTimer: null,
    rafId: null,
  };

  function createLoveOverlaySprites() {
    loveOverlay.innerHTML = '';
    LOVESTRUCK_CROWN.forEach((item, index) => {
      const span = document.createElement('span');
      span.className = 'love-icon';
      span.textContent = LOVE_EMOJIS[index % LOVE_EMOJIS.length];
      span.dataset.ox = String(item.ox);
      span.dataset.oy = String(item.oy);
      span.dataset.scale = String(item.scale);
      span.dataset.tilt = String(item.tilt);
      span.dataset.heart = LOVE_EMOJIS[index % LOVE_EMOJIS.length];
      span.style.animationDelay = `${(index % 3) * 0.18}s`;
      span.style.animationDuration = `${1.45 + (index % 3) * 0.2}s`;
      loveOverlay.appendChild(span);
      lovestruckIcons.push(span);
    });
  }

  function getDisplayAnchorX() {
    return 1 - lovestruckState.rawAnchorX;
  }

  function getFallbackAnchor() {
    return {
      rawAnchorX: 0.5,
      anchorY: 0.45,
      radius: 0.15,
    };
  }

  async function detectFaceAnchor() {
    if (!faceDetector || lovestruckState.detectBusy || !video.videoWidth || !video.videoHeight) return;
    lovestruckState.detectBusy = true;

    try {
      const faces = await faceDetector.detect(video);
      const face = faces[0];
      if (!face || !face.boundingBox) {
        const fallback = getFallbackAnchor();
        lovestruckState.rawAnchorX = fallback.rawAnchorX;
        lovestruckState.anchorY = fallback.anchorY;
        lovestruckState.radius = fallback.radius;
        return;
      }

      const box = face.boundingBox;
      const centerX = (box.x + box.width * 0.5) / video.videoWidth;
      const centerY = (box.y + box.height * 0.52) / video.videoHeight;
      const radiusFromFace = (box.width / video.videoWidth) * 0.56;

      lovestruckState.rawAnchorX = Math.min(0.86, Math.max(0.14, centerX));
      lovestruckState.anchorY = Math.min(0.82, Math.max(0.24, centerY));
      lovestruckState.radius = Math.min(0.24, Math.max(0.1, radiusFromFace));
    } catch {
      const fallback = getFallbackAnchor();
      lovestruckState.rawAnchorX = fallback.rawAnchorX;
      lovestruckState.anchorY = fallback.anchorY;
      lovestruckState.radius = fallback.radius;
    } finally {
      lovestruckState.detectBusy = false;
    }
  }

  function renderLoveOverlayFrame() {
    const now = Date.now();
    const baseX = getDisplayAnchorX();
    const baseY = lovestruckState.anchorY;
    const baseRadius = lovestruckState.radius;

    lovestruckIcons.forEach((icon, index) => {
      const ox = Number(icon.dataset.ox || 0);
      const oy = Number(icon.dataset.oy || 0);
      const scale = Number(icon.dataset.scale || 1);
      const tilt = Number(icon.dataset.tilt || 0);
      const floatY = Math.sin(now * 0.0032 + index * 0.8) * baseRadius * 0.09;
      const x = (baseX + ox * baseRadius) * 100;
      const y = (baseY + oy * baseRadius + floatY) * 100;

      icon.style.left = `${x}%`;
      icon.style.top = `${y}%`;
      icon.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${tilt}deg)`;
    });

    lovestruckState.rafId = requestAnimationFrame(renderLoveOverlayFrame);
  }

  function startLovestruckTracking() {
    if (lovestruckState.detectTimer || lovestruckState.rafId) return;

    if (faceDetector) {
      detectFaceAnchor();
      lovestruckState.detectTimer = window.setInterval(detectFaceAnchor, 280);
    } else {
      const fallback = getFallbackAnchor();
      lovestruckState.rawAnchorX = fallback.rawAnchorX;
      lovestruckState.anchorY = fallback.anchorY;
      lovestruckState.radius = fallback.radius;
    }

    lovestruckState.rafId = requestAnimationFrame(renderLoveOverlayFrame);
  }

  function stopLovestruckTracking() {
    if (lovestruckState.detectTimer) {
      window.clearInterval(lovestruckState.detectTimer);
      lovestruckState.detectTimer = null;
    }
    if (lovestruckState.rafId) {
      cancelAnimationFrame(lovestruckState.rafId);
      lovestruckState.rafId = null;
    }
  }

  function syncLovestruckMode() {
    const isLoveMode = selectedFilter === 'love' && Boolean(stream);
    loveOverlay.classList.toggle('active', isLoveMode);
    if (isLoveMode) startLovestruckTracking();
    else stopLovestruckTracking();
  }

  function getCurrentLovestruckPoints(width, height) {
    const now = Date.now();
    const points = [];
    const baseX = lovestruckState.rawAnchorX;
    const baseY = lovestruckState.anchorY;
    const baseRadius = lovestruckState.radius;

    LOVESTRUCK_CROWN.forEach((item, index) => {
      const floatY = Math.sin(now * 0.0032 + index * 0.8) * baseRadius * 0.09;
      points.push({
        x: (baseX - item.ox * baseRadius) * width,
        y: (baseY + item.oy * baseRadius + floatY) * height,
        scale: item.scale,
        rotation: item.tilt,
        emoji: LOVE_EMOJIS[index % LOVE_EMOJIS.length],
      });
    });

    return points;
  }

  createLoveOverlaySprites();

  const filterOpts = qsa('#pb-filter-picker .pb-filter-opt');

  const FILTER_MAP = {
    none: 'none',
    warm: 'saturate(1.15) contrast(1.05) sepia(0.18)',
    bw: 'grayscale(1) contrast(1.08)',
    vintage: 'sepia(0.45) saturate(0.9) contrast(1.05)',
    dreamy: 'brightness(1.06) saturate(1.2) blur(0.4px)',
    love: 'saturate(1.15) contrast(1.05) brightness(1.03)'
  };

  if (!startBtn || !video || !stripCanvas || !camWrap) return;

  const SHOTS = 3;
  const COUNT_FROM = 3;
  let stream = null;
  let capturing = false;
  const frames = [];
  let selectedFrame = 'romance';
  let selectedFilter = 'none';

  const FRAMES = {

    // ── 1. Dark Romance ──────────────────────────────────────────
    romance: {
      drawBg(ctx, W, H) {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#100810'); bg.addColorStop(0.5, '#1a0e14'); bg.addColorStop(1, '#0d0810');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      },
      drawBorder(ctx, W, H) {
        ctx.strokeStyle = 'rgba(196,117,138,0.25)'; ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, W - 20, H - 20);
        // Corner L-brackets
        const c = 'rgba(196,117,138,0.55)', s = 16; ctx.strokeStyle = c; ctx.lineWidth = 1.2;
        [[10, 10, 1, 1], [W - 10, 10, -1, 1], [10, H - 10, 1, -1], [W - 10, H - 10, -1, -1]].forEach(([x, y, fx, fy]) => {
          ctx.save(); ctx.translate(x, y); ctx.scale(fx, fy);
          ctx.beginPath(); ctx.moveTo(0, s); ctx.lineTo(0, 0); ctx.lineTo(s, 0); ctx.stroke();
          ctx.restore();
        });
      },
      drawHeader(ctx, W, PAD) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(196,117,138,0.42)'; ctx.font = '11px serif'; ctx.fillText('· · ♥ · ·', W / 2, 34);
        ctx.fillStyle = 'rgba(245,234,232,0.9)'; ctx.font = 'italic 300 26px "Cormorant Garamond",Georgia,serif'; ctx.fillText('Ariva & Pamungkas', W / 2, 68);
        ctx.fillStyle = 'rgba(196,117,138,0.6)'; ctx.font = '400 8px "Lato",Arial,sans-serif'; ctx.fillText('H A P P Y   B I R T H D A Y', W / 2, 88);
        const dg = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
        dg.addColorStop(0, 'transparent'); dg.addColorStop(0.5, 'rgba(196,117,138,0.28)'); dg.addColorStop(1, 'transparent');
        ctx.strokeStyle = dg; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(PAD, 106); ctx.lineTo(W - PAD, 106); ctx.stroke();
      },
      drawPhoto(ctx, img, PAD, y, PW, PH, i) {
        ctx.save(); ctx.translate(PAD + PW, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, PW, PH); ctx.restore();
        ctx.strokeStyle = 'rgba(196,117,138,0.16)'; ctx.lineWidth = 0.75; ctx.strokeRect(PAD, y, PW, PH);
        ctx.fillStyle = 'rgba(245,234,232,0.4)'; ctx.font = '400 8px "Lato",Arial,sans-serif';
        ctx.textAlign = 'left'; ctx.fillText(`0${i + 1}`, PAD + 6, y + 14);
      },
      drawFooter(ctx, W, PAD, fY) {
        const fg = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
        fg.addColorStop(0, 'transparent'); fg.addColorStop(0.5, 'rgba(196,117,138,0.22)'); fg.addColorStop(1, 'transparent');
        ctx.strokeStyle = fg; ctx.lineWidth = 0.75; ctx.beginPath(); ctx.moveTo(PAD, fY + 14); ctx.lineTo(W - PAD, fY + 14); ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(245,234,232,0.42)'; ctx.font = '300 8px "Lato",Arial,sans-serif'; ctx.fillText('26 APRIL 2026', W / 2, fY + 36);
        ctx.fillStyle = 'rgba(196,117,138,0.48)'; ctx.font = '11px serif'; ctx.fillText('♥  ♥  ♥', W / 2, fY + 58);
      },
    },

    // ── 2. Film Strip ────────────────────────────────────────────
    film: {
      _rr(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
      },
      drawBg(ctx, W, H) {
        ctx.fillStyle = '#090909'; ctx.fillRect(0, 0, W, H);
        // Film grain
        for (let i = 0; i < 4000; i++) {
          ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
          ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
        }
        // Sprocket holes both sides
        ctx.fillStyle = '#1d1d1d';
        for (let hy = 12; hy < H - 10; hy += 20) {
          this._rr(ctx, 3, hy, 9, 6, 2); ctx.fill();
          this._rr(ctx, W - 12, hy, 9, 6, 2); ctx.fill();
        }
        // Sprocket track lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(15, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W - 15, 0); ctx.lineTo(W - 15, H); ctx.stroke();
      },
      drawBorder(ctx, W, H) {
        ctx.strokeStyle = 'rgba(255,215,80,0.14)'; ctx.lineWidth = 1;
        ctx.strokeRect(16, 16, W - 32, H - 32);
      },
      drawHeader(ctx, W, PAD) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,215,80,0.5)'; ctx.font = '400 7px "Lato",Arial,sans-serif'; ctx.fillText('· · · SHOT ON LOVE · · ·', W / 2, 34);
        ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.font = '300 22px "Lato",Arial,sans-serif'; ctx.fillText('ARIVA & PAMUNGKAS', W / 2, 64);
        ctx.fillStyle = 'rgba(255,215,80,0.5)'; ctx.font = '400 7px "Lato",Arial,sans-serif'; ctx.fillText('HAPPY BIRTHDAY — 26 APRIL 2026', W / 2, 84);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 0.75;
        ctx.beginPath(); ctx.moveTo(PAD, 100); ctx.lineTo(W - PAD, 100); ctx.stroke();
      },
      drawPhoto(ctx, img, PAD, y, PW, PH, i) {
        ctx.save(); ctx.translate(PAD + PW, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, PW, PH); ctx.restore();
        // Vignette
        const vg = ctx.createRadialGradient(PAD + PW / 2, y + PH / 2, PH * 0.28, PAD + PW / 2, y + PH / 2, PH * 0.72);
        vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
        ctx.fillStyle = vg; ctx.fillRect(PAD, y, PW, PH);
        ctx.strokeStyle = 'rgba(255,215,80,0.12)'; ctx.lineWidth = 0.75; ctx.strokeRect(PAD, y, PW, PH);
        ctx.fillStyle = 'rgba(255,215,80,0.45)'; ctx.font = '400 7px "Lato",Arial,monospace';
        ctx.textAlign = 'right'; ctx.fillText(`${i + 1}A`, PAD + PW - 6, y + 13);
      },
      drawFooter(ctx, W, PAD, fY) {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.75;
        ctx.beginPath(); ctx.moveTo(PAD, fY + 14); ctx.lineTo(W - PAD, fY + 14); ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,215,80,0.42)'; ctx.font = '300 7px "Lato",Arial,sans-serif'; ctx.fillText('DEVELOPED WITH LOVE  ♥  2026', W / 2, fY + 36);
        ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.font = '400 7px monospace'; ctx.fillText('© ARIVA × PAMUNGKAS STUDIOS', W / 2, fY + 56);
      },
    },

    // ── 3. Pastel Cute ───────────────────────────────────────────
    pastel: {
      _heart(ctx, x, y, s, a) {
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#e888a2';
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.2);
        ctx.bezierCurveTo(x + s * 0.5, y - s * 0.85, x + s, y - s * 0.2, x + s, y + s * 0.28);
        ctx.bezierCurveTo(x + s, y + s * 0.7, x, y + s, x, y + s);
        ctx.bezierCurveTo(x, y + s, x - s, y + s * 0.7, x - s, y + s * 0.28);
        ctx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.5, y - s * 0.85, x, y - s * 0.2);
        ctx.closePath(); ctx.fill(); ctx.restore();
      },
      _roundedPhoto(ctx, PAD, y, PW, PH, r, action) {
        ctx.beginPath();
        ctx.moveTo(PAD + r, y); ctx.lineTo(PAD + PW - r, y); ctx.quadraticCurveTo(PAD + PW, y, PAD + PW, y + r);
        ctx.lineTo(PAD + PW, y + PH - r); ctx.quadraticCurveTo(PAD + PW, y + PH, PAD + PW - r, y + PH);
        ctx.lineTo(PAD + r, y + PH); ctx.quadraticCurveTo(PAD, y + PH, PAD, y + PH - r);
        ctx.lineTo(PAD, y + r); ctx.quadraticCurveTo(PAD, y, PAD + r, y); ctx.closePath();
        action();
      },
      drawBg(ctx, W, H) {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#fce8ef'); bg.addColorStop(0.5, '#f0e6fc'); bg.addColorStop(1, '#fce8ef');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      },
      drawBorder(ctx, W, H) {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(210,100,130,0.32)'; ctx.lineWidth = 1;
        ctx.strokeRect(7, 7, W - 14, H - 14); ctx.setLineDash([]);
        // Cute corner dots
        [[14, 14], [W - 14, 14], [14, H - 14], [W - 14, H - 14]].forEach(([x, y]) => {
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(210,100,130,0.45)'; ctx.fill();
        });
      },
      drawHeader(ctx, W, PAD) {
        // Scattered hearts
        [[28, 28, 4.5, 0.18], [W - 32, 22, 4, 0.15], [42, 58, 3, 0.12],
        [W - 48, 62, 3.5, 0.14], [W / 2 - 72, 32, 3, 0.1], [W / 2 + 62, 44, 3, 0.11]
        ].forEach(([x, y, s, a]) => this._heart(ctx, x, y, s, a));
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(210,100,130,0.6)'; ctx.font = '14px serif'; ctx.fillText('♡', W / 2, 36);
        ctx.fillStyle = 'rgba(95,25,52,0.85)'; ctx.font = 'italic 300 24px "Cormorant Garamond",Georgia,serif'; ctx.fillText('Ariva & Pamungkas', W / 2, 66);
        ctx.fillStyle = 'rgba(175,78,108,0.72)'; ctx.font = '400 7.5px "Lato",Arial,sans-serif'; ctx.fillText('H A P P Y   B I R T H D A Y', W / 2, 86);
        // Wavy divider
        ctx.strokeStyle = 'rgba(210,100,130,0.26)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const x = PAD + (W - PAD * 2) * (i / 24), yy = 103 + Math.sin(i * Math.PI * 0.75) * 2.5;
          i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
      },
      drawPhoto(ctx, img, PAD, y, PW, PH, i) {
        const r = 9;
        // Rounded clip
        ctx.save();
        this._roundedPhoto(ctx, PAD, y, PW, PH, r, () => ctx.clip());
        ctx.translate(PAD + PW, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, PW, PH); ctx.restore();
        // Pink tint
        this._roundedPhoto(ctx, PAD, y, PW, PH, r, () => { ctx.fillStyle = 'rgba(255,200,215,0.07)'; ctx.fill(); });
        // Rounded border
        ctx.strokeStyle = 'rgba(210,100,130,0.28)'; ctx.lineWidth = 1.5;
        this._roundedPhoto(ctx, PAD, y, PW, PH, r, () => ctx.stroke());
        ctx.fillStyle = 'rgba(175,78,108,0.45)'; ctx.font = '400 7.5px "Lato",Arial,sans-serif';
        ctx.textAlign = 'left'; ctx.fillText(`0${i + 1}`, PAD + 8, y + 15);
      },
      drawFooter(ctx, W, PAD, fY) {
        [[32, fY + 28, 4, 0.13], [W - 38, fY + 24, 3.5, 0.12],
        [W / 2 - 52, fY + 50, 3, 0.1], [W / 2 + 46, fY + 48, 3.5, 0.11]
        ].forEach(([x, y, s, a]) => this._heart(ctx, x, y, s, a));
        ctx.strokeStyle = 'rgba(210,100,130,0.24)'; ctx.lineWidth = 0.75;
        ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(PAD, fY + 14); ctx.lineTo(W - PAD, fY + 14); ctx.stroke(); ctx.setLineDash([]);
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(125,38,68,0.55)'; ctx.font = '300 8px "Lato",Arial,sans-serif'; ctx.fillText('26 APRIL 2026', W / 2, fY + 36);
        ctx.fillStyle = 'rgba(210,100,130,0.6)'; ctx.font = '13px serif'; ctx.fillText('♡  ♡  ♡', W / 2, fY + 57);
      },
    },

    // ── 4. Vintage ───────────────────────────────────────────────
    vintage: {
      _corner(ctx, x, y, fx, fy) {
        ctx.save(); ctx.translate(x, y); ctx.scale(fx, fy);
        ctx.strokeStyle = 'rgba(90,58,28,0.45)'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 0); ctx.lineTo(22, 0); ctx.stroke();
        ctx.fillStyle = 'rgba(90,58,28,0.42)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(3.5, -5.5); ctx.lineTo(7, 0); ctx.lineTo(3.5, 5.5); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(14, 0, 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 14, 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      },
      drawBg(ctx, W, H) {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#f5eedd'); bg.addColorStop(0.5, '#eee5cc'); bg.addColorStop(1, '#e8ddc4');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        // Paper grain
        for (let i = 0; i < 5000; i++) {
          ctx.fillStyle = `rgba(90,58,28,${Math.random() * 0.028})`;
          ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
        }
      },
      drawBorder(ctx, W, H) {
        ctx.strokeStyle = 'rgba(90,58,28,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(8, 8, W - 16, H - 16);
        ctx.strokeStyle = 'rgba(90,58,28,0.14)'; ctx.lineWidth = 0.5; ctx.strokeRect(13, 13, W - 26, H - 26);
      },
      drawHeader(ctx, W, PAD) {
        this._corner(ctx, 18, 18, 1, 1); this._corner(ctx, W - 18, 18, -1, 1);
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(90,58,28,0.45)'; ctx.font = 'italic 9.5px Georgia,serif'; ctx.fillText('✦  est. 2026  ✦', W / 2, 38);
        ctx.fillStyle = 'rgba(45,22,8,0.86)'; ctx.font = 'italic 300 25px "Cormorant Garamond",Georgia,serif'; ctx.fillText('Ariva & Pamungkas', W / 2, 68);
        ctx.fillStyle = 'rgba(115,74,48,0.7)'; ctx.font = '400 7.5px "Lato",Arial,sans-serif'; ctx.fillText('H A P P Y   B I R T H D A Y', W / 2, 88);
        const dl = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
        dl.addColorStop(0, 'transparent'); dl.addColorStop(0.5, 'rgba(90,58,28,0.3)'); dl.addColorStop(1, 'transparent');
        ctx.strokeStyle = dl; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(PAD, 100); ctx.lineTo(W - PAD, 100); ctx.stroke();
        ctx.fillStyle = 'rgba(90,58,28,0.38)'; ctx.font = '10px serif'; ctx.fillText('— ✦ ✦ ✦ —', W / 2, 113);
      },
      drawPhoto(ctx, img, PAD, y, PW, PH, i) {
        // Cream polaroid mat
        ctx.fillStyle = 'rgba(252,248,235,0.92)'; ctx.fillRect(PAD - 5, y - 5, PW + 10, PH + 10);
        ctx.save(); ctx.translate(PAD + PW, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, PW, PH); ctx.restore();
        // Sepia overlay
        ctx.fillStyle = 'rgba(150,100,45,0.2)'; ctx.fillRect(PAD, y, PW, PH);
        ctx.strokeStyle = 'rgba(90,58,28,0.22)'; ctx.lineWidth = 1; ctx.strokeRect(PAD, y, PW, PH);
        ctx.fillStyle = 'rgba(90,58,28,0.45)'; ctx.font = 'italic 8px Georgia,serif';
        ctx.textAlign = 'right'; ctx.fillText(`No. ${i + 1}`, PAD + PW - 6, y + 14);
      },
      drawFooter(ctx, W, PAD, fY) {
        this._corner(ctx, 18, fY + 72, 1, -1); this._corner(ctx, W - 18, fY + 72, -1, -1);
        const fl = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
        fl.addColorStop(0, 'transparent'); fl.addColorStop(0.5, 'rgba(90,58,28,0.25)'); fl.addColorStop(1, 'transparent');
        ctx.strokeStyle = fl; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(PAD, fY + 14); ctx.lineTo(W - PAD, fY + 14); ctx.stroke();
        ctx.fillStyle = 'rgba(90,58,28,0.38)'; ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.fillText('— ✦ ✦ ✦ —', W / 2, fY + 28);
        ctx.fillStyle = 'rgba(90,58,28,0.55)'; ctx.font = 'italic 8.5px Georgia,serif'; ctx.fillText('26 April 2026', W / 2, fY + 46);
        ctx.fillStyle = 'rgba(115,74,48,0.42)'; ctx.font = '400 7px "Lato",Arial,sans-serif'; ctx.fillText('A MEMORY PRESERVED IN TIME', W / 2, fY + 62);
      },
    },
  };

  frameOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      frameOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedFrame = opt.dataset.frame;
      if (frames.length === SHOTS) generateStrip();
    });
  });

  filterOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      filterOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedFilter = opt.dataset.filter || 'none';
      video.style.filter = FILTER_MAP[selectedFilter] || 'none';
      syncLovestruckMode();

      if (frames.length === SHOTS) generateStrip();
    });
  });

  function drawLoveStickers(ctx, width, height) {
    const points = getCurrentLovestruckPoints(width, height);

    ctx.save();
    points.forEach(point => {
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(point.rotation * (Math.PI / 180));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(22 * point.scale)}px serif`;
      ctx.fillStyle = 'rgba(255, 168, 205, 0.95)';
      ctx.shadowColor = 'rgba(255, 90, 160, 0.38)';
      ctx.shadowBlur = 10;
      ctx.fillText(point.emoji, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  function resetShotDots() {
    shotDots.forEach(d => d.classList.remove('taken'));
  }

  function pbWait(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      startBtn.textContent = '⚠️ Browser tidak mendukung kamera';
      startBtn.disabled = true;
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 540 } },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      video.classList.add('pb-active');
      video.style.filter = FILTER_MAP[selectedFilter] || 'none';
      syncLovestruckMode();
      if (idleOverlay) idleOverlay.classList.add('pb-hidden');
      startBtn.textContent = '📸 Ambil Foto';
      startBtn.dataset.state = 'ready';
    } catch {
      startBtn.textContent = '⚠️ Kamera tidak bisa dibuka';
      startBtn.disabled = true;
    }
  }

  async function runCapture() {
    if (capturing) return;
    capturing = true;
    frames.length = 0;
    thumbsWrap.innerHTML = '';
    resetShotDots();
    stripWrap.classList.add('pb-strip--hidden');
    retakeBtn.classList.add('pb-btn--hidden');
    downloadBtn.classList.add('pb-btn--hidden');
    startBtn.classList.add('pb-btn--hidden');

    for (let i = 0; i < SHOTS; i++) {
      for (let n = COUNT_FROM; n >= 1; n--) {
        countdown.textContent = n;
        countdown.classList.add('pb-active');
        await pbWait(880);
        countdown.classList.remove('pb-active');
        countdown.textContent = '';
        await pbWait(120);
      }

      camWrap.classList.add('pb-flash');
      setTimeout(() => camWrap.classList.remove('pb-flash'), 400);

      const fc = document.createElement('canvas');
      fc.width = video.videoWidth || 640;
      fc.height = video.videoHeight || 480;

      const fctx = fc.getContext('2d');
      fctx.filter = FILTER_MAP[selectedFilter] || 'none';
      fctx.drawImage(video, 0, 0, fc.width, fc.height);
      if (selectedFilter === 'love') {
        drawLoveStickers(fctx, fc.width, fc.height);
      }
      fctx.filter = 'none';

      frames.push(fc);
      if (shotDots[i]) shotDots[i].classList.add('taken');

      const thumb = document.createElement('div');
      thumb.className = 'pb-thumb';
      thumb.style.backgroundImage = `url(${fc.toDataURL('image/jpeg', 0.7)})`;
      thumbsWrap.appendChild(thumb);

      if (i < SHOTS - 1) await pbWait(700);
    }

    capturing = false;
    await document.fonts.ready;
    generateStrip();
    stripWrap.classList.remove('pb-strip--hidden');
    startBtn.classList.remove('pb-btn--hidden');
    startBtn.textContent = '📸 Foto Lagi';
    startBtn.dataset.state = 'ready';
    retakeBtn.classList.remove('pb-btn--hidden');
    downloadBtn.classList.remove('pb-btn--hidden');
  }

  function generateStrip() {
    const f = FRAMES[selectedFrame] || FRAMES.romance;

    const W = 400;
    const PAD = 22;
    const PW = W - PAD * 2;
    const PH = Math.round(PW * 3 / 4);
    const HEADER = 130;
    const FOOTER = 90;
    const GAP = 14;
    const H = HEADER + PH * SHOTS + GAP * (SHOTS - 1) + FOOTER;

    stripCanvas.width = W;
    stripCanvas.height = H;
    const ctx = stripCanvas.getContext('2d');

    f.drawBg(ctx, W, H);
    f.drawBorder(ctx, W, H);
    f.drawHeader(ctx, W, PAD);

    frames.forEach((img, i) => {
      const y = HEADER + i * (PH + GAP);
      f.drawPhoto(ctx, img, PAD, y, PW, PH, i);
    });

    const fY = HEADER + PH * SHOTS + GAP * (SHOTS - 1);
    f.drawFooter(ctx, W, PAD, fY);
  }

  startBtn.addEventListener('click', async () => {
    if (!stream) {
      await startCamera();
    } else if (startBtn.dataset.state === 'ready') {
      await runCapture();
    }
  });

  retakeBtn.addEventListener('click', () => {
    frames.length = 0;
    thumbsWrap.innerHTML = '';
    resetShotDots();
    stripWrap.classList.add('pb-strip--hidden');
    retakeBtn.classList.add('pb-btn--hidden');
    downloadBtn.classList.add('pb-btn--hidden');
    startBtn.textContent = '📸 Ambil Foto';
    startBtn.dataset.state = 'ready';
  });

  downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'photobooth-ebeb.png';
    a.href = stripCanvas.toDataURL('image/png');
    a.click();
  });

  // Release camera when section scrolls off screen
  const section = qs('#photobooth');
  if (section) {
    const pbIO = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting && stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
        video.srcObject = null;
        video.classList.remove('pb-active');
        syncLovestruckMode();
        if (idleOverlay) idleOverlay.classList.remove('pb-hidden');
        startBtn.textContent = '📷 Buka Kamera';
        delete startBtn.dataset.state;
        frames.length = 0;
        thumbsWrap.innerHTML = '';
        resetShotDots();
        stripWrap.classList.add('pb-strip--hidden');
        retakeBtn.classList.add('pb-btn--hidden');
        downloadBtn.classList.add('pb-btn--hidden');
      }
    }, { threshold: 0 });
    pbIO.observe(section);
  }
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
  initPhotoBooth();
});
