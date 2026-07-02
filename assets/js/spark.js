'use strict';

/* ═══ helpers ═══ */
const qs  = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
const hasGSAP = typeof gsap !== 'undefined';

/* split text into per-char spans (space-safe) */
function splitChars(el) {
  const txt = el.textContent;
  el.textContent = '';
  const chars = [];
  for (const ch of txt) {
    const s = document.createElement('span');
    s.className = 'char';
    s.textContent = ch === ' ' ? '\u00A0' : ch;
    el.appendChild(s);
    chars.push(s);
  }
  return chars;
}

/* ═══ LOADER (vanilla, always runs) ═══ */
(function loader() {
  const word = qs('#loaderWord'), count = qs('#loaderCount'), bar = qs('#loaderBarFill');
  const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  document.documentElement.style.overflow = 'hidden';

  // scramble the word
  let it = 0;
  const scr = setInterval(() => {
    word.textContent = 'SPARK'.split('').map((c, i) => i < it ? 'SPARK'[i] : CH[(Math.random() * CH.length) | 0]).join('');
    if (it >= 5) { clearInterval(scr); word.textContent = 'SPARK'; }
    it += 0.5;
  }, 50);

  // count + bar
  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(100, p + rnd(3, 9));
    count.textContent = Math.floor(p);
    bar.style.width = p + '%';
    if (p >= 100) { clearInterval(iv); setTimeout(revealSite, 340); }
  }, 60);
})();

function revealSite() {
  const loader = qs('#loader'), curtain = qs('#curtain');
  document.documentElement.style.overflow = '';
  if (hasGSAP && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  if (reduced || !hasGSAP) {
    loader.style.display = 'none';
    curtain.style.display = 'none';
    qs('#navbar').classList.add('ready');
    document.body.classList.add('loaded');
    boot();
    return;
  }

  const tl = gsap.timeline({ onComplete: () => { curtain.style.display = 'none'; boot(); } });
  tl.to('#loader', { opacity: 0, duration: .5, ease: 'power2.inOut', onComplete: () => qs('#loader').style.display = 'none' })
    .set(curtain, { display: 'flex' }, 0)
    .to('#curtain span', { yPercent: -101, duration: .9, ease: 'power4.inOut', stagger: .08 }, .2)
    .add(() => qs('#navbar').classList.add('ready'), '-=.5')
    .add(heroIntro, '-=.7');
}

/* ═══ hero intro sequence ═══ */
function heroIntro() {
  const heroChars = qsa('#hero [data-split]').flatMap(splitChars);
  gsap.set(heroChars, { yPercent: 120, rotate: 8 });
  gsap.set(['#hero [data-anim="kicker"]', '#hero [data-anim="sub"]', '#hero [data-anim="btns"]', '#hero [data-anim="cue"]'],
    { opacity: 0, y: 24 });

  gsap.timeline()
    .to('#hero [data-anim="kicker"]', { opacity: 1, y: 0, duration: .7, ease: 'power3.out' })
    .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.05, ease: 'power4.out', stagger: .035 }, '-=.4')
    .to('#hero [data-anim="sub"]', { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, '-=.6')
    .to('#hero [data-anim="btns"]', { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, '-=.5')
    .to('#hero [data-anim="cue"]', { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, '-=.5');

  // hero parallax out on scroll
  gsap.to('#hero .hero-inner', {
    yPercent: 9, opacity: .35, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ═══ BOOT ═══ */
function boot() {
  const hasST = typeof ScrollTrigger !== 'undefined';
  initLava();
  initEmbers();
  initNav();
  initSmoothScroll();
  if (hasGSAP && hasST && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    initReveals();
    initMarquees();
    initWork();
    ScrollTrigger.refresh();
    window.addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    document.getElementById('work').classList.add('work-static');
  }
  initLightbox();
  initContactForm();
  if (fine && !reduced) { initCursor(); initMagnetic(); }
}

/* ═══ smooth scroll (Lenis) + anchors ═══ */
let lenis = null;
function initSmoothScroll() {
  if (window.Lenis && hasGSAP && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add('lenis');
  }
  qsa('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = qs(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.2 });
    else t.scrollIntoView({ behavior: 'smooth' });
  }));
}

/* ═══ nav ═══ */
function initNav() {
  const nav = qs('#navbar'), links = qsa('.nav-links a');
  const secs = links.map(a => qs(a.getAttribute('href'))).filter(Boolean);
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 40);
    let cur = '';
    for (const s of secs) if (scrollY >= s.offsetTop - 200) cur = '#' + s.id;
    links.forEach(a => a.style.color = a.getAttribute('href') === cur ? 'var(--bone)' : '');
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

/* ═══ scroll reveals (titles, eyebrows, cards) ═══ */
function initReveals() {
  // section-title & work-lead char reveals
  qsa('#services [data-split], #contact [data-split]').forEach(el => {
    const chars = splitChars(el);
    gsap.set(chars, { yPercent: 120 });
    gsap.to(chars, {
      yPercent: 0, duration: 1, ease: 'power4.out', stagger: .03,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
  // eyebrows
  qsa('[data-anim="reveal"]').forEach(el => {
    gsap.from(el, { opacity: 0, y: 26, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  qsa('.eyebrow-rule').forEach(r => {
    gsap.from(r, { scaleX: 0, duration: .7, ease: 'power3.out',
      scrollTrigger: { trigger: r, start: 'top 92%' } });
  });
  // service cards stagger
  gsap.from('.service-card', {
    opacity: 0, y: 60, duration: .9, ease: 'power3.out', stagger: .12,
    scrollTrigger: { trigger: '.services-grid', start: 'top 80%' }
  });
  // service icons: stroke draw
  qsa('.service-icon path,.service-icon rect,.service-icon circle,.service-icon line').forEach(p => {
    const len = 120;
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(p, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out',
      scrollTrigger: { trigger: p.closest('.service-card'), start: 'top 78%' } });
  });
}

/* ═══ marquees (loop + velocity skew) ═══ */
function initMarquees() {
  qsa('.marquee-track').forEach(track => {
    gsap.to(track, { xPercent: -50, duration: track.id === 'marqueeB' ? 24 : 30, ease: 'none', repeat: -1 });
  });
  // skew on scroll velocity
  const setSkew = gsap.quickTo('.marquee-track', 'skewX', { duration: .4, ease: 'power3' });
  ScrollTrigger.create({
    onUpdate: self => {
      const v = gsap.utils.clamp(-16, 16, self.getVelocity() / -180);
      setSkew(v);
    }
  });
}

/* ═══ WORK — pinned horizontal scroll ═══ */
function initWork() {
  const track = qs('#workTrack'), pin = qs('#workPin'), section = qs('#work'), prog = qs('#workProgress');
  const mm = gsap.matchMedia();

  mm.add('(min-width:821px)', () => {
    section.classList.remove('work-static');
    const amount = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, { x: () => -amount(), ease: 'none' });
    const st = ScrollTrigger.create({
      trigger: section, start: 'top top', end: () => '+=' + amount(),
      pin, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      animation: tween,
      onUpdate: self => { if (prog) prog.style.width = (self.progress * 100).toFixed(1) + '%'; }
    });
    // horizontal parallax on panel media
    qsa('.work-card-media img').forEach(img => {
      gsap.fromTo(img, { xPercent: -7 }, {
        xPercent: 7, ease: 'none',
        scrollTrigger: { trigger: img.closest('.work-card'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
      });
    });
    // panel foot fade-in as it enters
    qsa('.work-card-foot, .panel-outro > *, .panel-intro .work-lead .split, .panel-intro .work-lead-sub').forEach(el => {
      gsap.from(el, { opacity: 0, y: 30, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left 82%' } });
    });
    return () => st.kill();
  });

  mm.add('(max-width:820px)', () => {
    section.classList.add('work-static');
    qsa('.work-card-foot').forEach(el => {
      gsap.from(el, { opacity: 0, y: 30, duration: .7, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
  });
}

/* ═══ interactive lava / fire field ═══ */
function initLava() {
  const canvas = qs('#lavaCanvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;
  const SCALE = 0.5;
  const resize = () => { canvas.width = canvas.offsetWidth * SCALE; canvas.height = canvas.offsetHeight * SCALE; gl.viewport(0, 0, canvas.width, canvas.height); };
  resize();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); }, { passive: true });

  const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs = `
    precision mediump float; uniform float t; uniform vec2 r; uniform vec2 m;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float sn(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<7;i++){v+=a*sn(p);p=p*2.06+vec2(1.7,9.2);a*=.52;}return v;}
    vec2 swirl(vec2 p,float a,float pw){float d=length(p);float s=sin(a+pw/(d+.22)),c=cos(a+pw/(d+.22));return mat2(c,-s,s,c)*p;}
    void main(){
      vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y); p.x*=.82;
      vec2 mp=(m-.5); mp.x*=.82;
      p+=mp*0.16*smoothstep(.9,.0,length(p-mp));
      float tm=t*.02;
      vec2 a=swirl(p+vec2(.18*sin(tm*.8),.10*cos(tm*.7)),tm*.28,1.05);
      vec2 b=swirl(p*1.22+vec2(.45,-.18),-tm*.22,.78);
      vec2 q=vec2(fbm(a*1.35+vec2(tm,-tm*.4)),fbm(b*1.12+vec2(-tm*.65,tm*.5)));
      vec2 flow=p+.74*sin(vec2(q.y,q.x)*6.283+vec2(tm*1.8,-tm*1.35));
      flow=swirl(flow+q*.32,tm*.18,.9);
      float river=flow.x*3.2+flow.y*2.35+fbm(flow*2.6+q*2.2)*3.4;
      float bands=sin(river*5.7);
      float contour=1.0-smoothstep(.035,.18,abs(bands));
      float redMass=smoothstep(-.56,.72,bands+fbm(flow*3.1+tm)*.82);
      float blackPool=smoothstep(.18,.88,fbm(flow*1.55-q*1.4)-.08+abs(bands)*.22);
      vec3 c=mix(vec3(.02,0.,0.),vec3(.2,0.,0.),redMass);
      c=mix(c,vec3(.95,.04,0.),pow(redMass,4.0)*.55);
      c=mix(c,vec3(0.),blackPool*.84);
      c=mix(c,vec3(.02,0.,0.),contour*.92);
      float vig=smoothstep(1.02,.18,length(p)); c*=mix(.46,1.05,vig);
      gl_FragColor=vec4(c,1.);
    }`;
  const sh = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(prog, 't'), uR = gl.getUniformLocation(prog, 'r'), uM = gl.getUniformLocation(prog, 'm');

  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
  addEventListener('mousemove', e => { tx = e.clientX / innerWidth; ty = 1 - e.clientY / innerHeight; }, { passive: true });
  const start = performance.now();
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) draw(); });
  function draw() {
    if (!running) return;
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    gl.uniform1f(uT, (performance.now() - start) / 1000);
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform2f(uM, mx, my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(draw);
  }
  draw();
}

/* ═══ ember particles ═══ */
function initEmbers() {
  if (reduced) return;
  const canvas = qs('#emberCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, parts = [];
  const N = innerWidth < 760 ? 34 : 70;
  const spawn = y => ({ x: rnd(0, W), y: y ?? rnd(0, H), r: rnd(.6, 2.4), vy: rnd(.2, .9), vx: rnd(-.25, .25), a: rnd(.15, .7), tw: rnd(0, 6.28) });
  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; parts = Array.from({ length: N }, () => spawn()); };
  resize(); addEventListener('resize', resize, { passive: true });
  let run = true;
  document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) loop(); });
  function loop() {
    if (!run) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.y -= p.vy; p.x += p.vx + Math.sin((p.tw += .02)) * .2;
      if (p.y < -6) Object.assign(p, spawn(H + 6));
      const fl = p.a * (.6 + .4 * Math.sin(p.tw * 2));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = `rgba(255,${(60 + p.r * 40) | 0},20,${fl})`;
      ctx.shadowColor = 'rgba(255,60,20,.9)'; ctx.shadowBlur = 8; ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

/* ═══ custom cursor ═══ */
function initCursor() {
  const ring = qs('#cursorRing'), dot = qs('#cursorDot'), label = qs('#cursorLabel');
  let mxx = -100, myy = -100, rx = mxx, ry = myy;
  addEventListener('mousemove', e => {
    mxx = e.clientX; myy = e.clientY;
    dot.style.transform = `translate(${mxx}px,${myy}px)`;
  });
  (function loop() { rx += (mxx - rx) * .18; ry += (myy - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
  qsa('a,button,.magnetic,input,select,textarea').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cur-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cur-hover'));
  });
  qsa('[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; document.body.classList.add('cur-active'); });
    el.addEventListener('mouseleave', () => { document.body.classList.remove('cur-active'); });
  });
}

/* ═══ magnetic ═══ */
function initMagnetic() {
  qsa('.magnetic').forEach(el => {
    const strength = el.classList.contains('work-card') ? .12 : .28;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      if (hasGSAP) gsap.to(el, { x, y, duration: .5, ease: 'power3.out' });
      else el.style.transform = `translate(${x}px,${y}px)`;
    });
    el.addEventListener('mouseleave', () => {
      if (hasGSAP) gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' });
      else el.style.transform = '';
    });
  });
}

/* ═══ lightbox album wheel ═══ */
function initLightbox() {
  const lightbox = qs('#lightbox'), stage = qs('#albumStage');
  const titleEl = qs('#albumTitle'), countEl = qs('#albumCount');
  const slots = ['wheel-far-prev', 'wheel-prev', 'wheel-current', 'wheel-next', 'wheel-far-next'].map(c => qs('.' + c, stage));
  const tf = [
    'translate(-50%,-50%) translateZ(-260px) translateY(-200px) rotateX(24deg) scale(.6)',
    'translate(-50%,-50%) translateZ(-120px) translateY(-100px) rotateX(14deg) scale(.78)',
    'translate(-50%,-50%) translateZ(0) translateY(0) rotateX(0) scale(1)',
    'translate(-50%,-50%) translateZ(-120px) translateY(100px) rotateX(-14deg) scale(.78)',
    'translate(-50%,-50%) translateZ(-260px) translateY(200px) rotateX(-24deg) scale(.6)',
  ];
  const op = [.25, .55, 1, .55, .25], fl = ['blur(4px)', 'blur(2px)', 'blur(0)', 'blur(2px)', 'blur(4px)'];
  const DUR = 340;
  let imgs = [], idx = 0, locked = false, delta = 0, savedY = 0;
  const style = (el, i, anim = true) => {
    el.style.transform = tf[i]; el.style.opacity = op[i]; el.style.filter = fl[i];
    el.style.zIndex = i === 2 ? 10 : 5 - Math.abs(i - 2);
    el.style.transition = anim ? `transform ${DUR}ms cubic-bezier(.18,.86,.16,1),opacity ${DUR}ms ease,filter ${DUR}ms ease` : 'none';
  };
  const render = () => {
    slots.forEach((el, i) => { const j = (idx + i - 2 + imgs.length * 10) % imgs.length; el.querySelector('img').src = imgs[j]; style(el, i, false); });
    countEl.textContent = `${idx + 1} / ${imgs.length}`;
  };
  const spin = dir => {
    if (!imgs.length || locked) return; locked = true;
    slots.forEach((el, i) => {
      const target = i - dir;
      el.style.transition = `transform ${DUR}ms cubic-bezier(.18,.86,.16,1),opacity ${DUR}ms ease,filter ${DUR}ms ease`;
      if (target >= 0 && target < tf.length) { el.style.transform = tf[target]; el.style.opacity = op[target]; el.style.filter = fl[target]; el.style.zIndex = target === 2 ? 10 : 5 - Math.abs(target - 2); }
      else { const y = dir > 0 ? -310 : 310; el.style.transform = `translate(-50%,-50%) translateZ(-360px) translateY(${y}px) rotateX(${dir > 0 ? 34 : -34}deg) scale(.48)`; el.style.opacity = '0'; el.style.filter = 'blur(6px)'; el.style.zIndex = '1'; }
    });
    setTimeout(() => { idx = (idx + dir + imgs.length) % imgs.length; render(); requestAnimationFrame(() => locked = false); }, Math.round(DUR * .6));
  };
  const open = card => {
    imgs = card.dataset.images.split('|'); titleEl.textContent = card.dataset.title; idx = 0; render();
    savedY = scrollY; if (lenis) lenis.stop();
    lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open');
  };
  const close = () => {
    lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open');
    if (lenis) lenis.start();
  };
  qsa('.work-card').forEach(c => c.addEventListener('click', () => open(c)));
  qs('#lightboxClose').addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') spin(1);
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') spin(-1);
  });
  stage.addEventListener('wheel', e => {
    if (!lightbox.classList.contains('open')) return; e.preventDefault();
    delta += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(delta) < 3 || locked) return; spin(delta > 0 ? 1 : -1); delta = 0;
  }, { passive: false });
  let dy = null;
  stage.addEventListener('mousedown', e => dy = e.clientY);
  stage.addEventListener('mousemove', e => { if (dy !== null && Math.abs(e.clientY - dy) > 22) { spin(e.clientY < dy ? 1 : -1); dy = e.clientY; } });
  stage.addEventListener('mouseup', () => dy = null); stage.addEventListener('mouseleave', () => dy = null);
  let ty = null;
  stage.addEventListener('touchstart', e => ty = e.touches[0].clientY, { passive: true });
  stage.addEventListener('touchmove', e => { if (ty !== null) { const d = ty - e.touches[0].clientY; if (Math.abs(d) > 18 && !locked) { spin(d > 0 ? 1 : -1); ty = e.touches[0].clientY; } } }, { passive: true });
  stage.addEventListener('touchend', () => ty = null);
}

/* ═══ contact form ═══ */
function initContactForm() {
  const form = qs('#contactForm'), success = qs('#formSuccess'); if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]'); const html = btn.innerHTML;
    btn.textContent = 'SENDING…'; btn.disabled = true;
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      if (res.ok) { form.style.display = 'none'; success.style.display = 'block'; }
      else { btn.innerHTML = html; btn.disabled = false; }
    } catch { btn.innerHTML = html; btn.disabled = false; }
  });
}
