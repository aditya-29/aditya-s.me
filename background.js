(() => {
  'use strict';
  const canvas = document.getElementById('graph-background');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionPreference.matches;
  let frame = 0;
  let lastTime = 0;
  let phase = 0;
  let width = 0;
  let height = 0;
  let contentLeft = 0;
  let contentRight = 0;
  let pointerX = null;
  let pointerY = null;
  let mobileScrolling = false;
  let scrollTimer = 0;

  // A 4-dimensional cube: 16 vertices, 32 edges. Layouts change; adjacency never does.
  const cube = Array.from({ length: 16 }, (_, i) =>
    Array.from({ length: 4 }, (_, bit) => ((i >> bit) & 1) ? 1 : -1));
  const cubeEdges = [];
  for (let i = 0; i < 16; i++) {
    for (let bit = 0; bit < 4; bit++) {
      const j = i ^ (1 << bit);
      if (i < j) cubeEdges.push([i, j]);
    }
  }

  // An icosahedron graph: 12 vertices and 30 fixed edges.
  const phi = (1 + Math.sqrt(5)) / 2;
  const ico = [];
  for (const a of [-1, 1]) for (const b of [-phi, phi]) {
    ico.push([0, a, b], [a, b, 0], [b, 0, a]);
  }
  const icoEdges = [];
  for (let i = 0; i < ico.length; i++) for (let j = i + 1; j < ico.length; j++) {
    const distance = ico[i].reduce((sum, value, axis) => sum + (value - ico[j][axis]) ** 2, 0);
    if (Math.abs(distance - 4) < 0.001) icoEdges.push([i, j]);
  }

  function rotate([x, y, z], a, b) {
    const xx = x * Math.cos(a) + z * Math.sin(a);
    const zz = -x * Math.sin(a) + z * Math.cos(a);
    return [xx, y * Math.cos(b) - zz * Math.sin(b), y * Math.sin(b) + zz * Math.cos(b)];
  }

  function drawGraph(vertices, edges, cx, cy, radius, time, isCube, forceVisible = false) {
    // Smoothly change between spatial and circular drawings of the same graph.
    const morph = (1 - Math.cos(time * 0.28)) * 0.30;
    const driftX = Math.cos(time * .42 + (isCube ? 0 : .8)) * 6;
    const driftY = Math.sin(time * .35 + (isCube ? .4 : 0)) * 5;
    const points = vertices.map((vertex, i) => {
      let v;
      if (isCube) {
        const [x, y, z, w] = vertex;
        const angle = time * 0.11;
        const x4 = x * Math.cos(angle) - w * Math.sin(angle);
        const w4 = x * Math.sin(angle) + w * Math.cos(angle);
        const perspective = 2.6 / (3.6 - w4);
        v = [x4 * perspective, y * perspective, z * perspective];
      } else v = vertex.map(value => value * 0.73);
      const tiltX = pointerX === null ? 0 : (pointerX / width - .5) * .72;
      const tiltY = pointerY === null ? 0 : (pointerY / height - .5) * .48;
      const [x, y, z] = rotate(v, time * 0.23 + 0.55 + tiltX, time * 0.15 + 0.4 + tiltY);
      const angle = i / vertices.length * Math.PI * 2 - Math.PI / 2;
      const px = x * (1 - morph) + Math.cos(angle) * 1.4 * morph;
      const py = y * (1 - morph) + Math.sin(angle) * 1.4 * morph;
      return [cx + driftX + px * radius, cy + driftY + py * radius, z];
    });
    const inReadingColumn = x => x > contentLeft - 20 && x < contentRight + 20;
    for (const [i, j] of edges) {
      const a = points[i], b = points[j];
      const subdued = !forceVisible && inReadingColumn((a[0] + b[0]) / 2);
      context.strokeStyle = `rgba(41, 151, 255, ${subdued ? 0.035 : forceVisible ? 0.29 : 0.15})`;
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(a[0], a[1]);
      context.lineTo(b[0], b[1]);
      context.stroke();
    }
    for (const [index, [x, y, z]] of points.entries()) {
      const pulse = .04 * (1 + Math.sin(time * 2 + index * .8));
      const opacity = !forceVisible && inReadingColumn(x) ? .07 : forceVisible ? .42 + pulse : .28 + pulse;
      context.fillStyle = `rgba(41, 151, 255, ${opacity})`;
      context.beginPath();
      context.arc(x, y, 1.5 + (z + 2) * 0.15, 0, Math.PI * 2);
      context.fill();
    }
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const compact = width <= 760;
    const radius = Math.min(width * 0.095, 150);
    if (compact) {
      drawGraph(ico, icoEdges, width - 15, height * .22, 95, phase + 8, false, true);
      drawGraph(cube, cubeEdges, 42, height * .76, 67, phase, true);
    } else {
      drawGraph(ico, icoEdges, width - 62, height * .25, radius, phase + 8, false);
      drawGraph(cube, cubeEdges, Math.max(65, contentLeft * .34), height * .76, radius * .83, phase, true);
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = '';
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bounds = document.querySelector('main').getBoundingClientRect();
    contentLeft = bounds.left;
    contentRight = bounds.right;
    draw();
  }

  function tick(time) {
    if (paused || document.hidden) { frame = 0; return; }
    if (mobileScrolling) {
      frame = window.requestAnimationFrame(tick);
      return;
    }
    if (!lastTime) lastTime = time;
    const elapsed = time - lastTime;
    if (elapsed >= 1000 / 30) {
      phase += Math.min(elapsed, 100) / 1000;
      lastTime = time;
      draw();
    }
    frame = window.requestAnimationFrame(tick);
  }

  function sync() {
    window.cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (!paused && !document.hidden) frame = window.requestAnimationFrame(tick);
  }

  function updatePointer(event) {
    // Touch movement is usually a page scroll. Keep the mobile visual ambient rather than
    // treating every swipe as a request to rotate it.
    if (event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (paused) draw();
  }

  function clearPointer(event) {
    if (event.pointerType === 'mouse') {
      pointerX = null;
      pointerY = null;
      if (paused) draw();
    }
  }

  function handleScroll() {
    if (width > 760) return;
    mobileScrolling = true;
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      mobileScrolling = false;
      lastTime = 0;
    }, 140);
  }

  function setContentMotion() {
    const root = document.documentElement;
    const targets = [...document.querySelectorAll('main > section, .paper, .experience-row')];
    if (motionPreference.matches || !('IntersectionObserver' in window)) {
      root.classList.remove('motion-ready');
      targets.forEach(target => target.classList.remove('animate-target', 'is-visible'));
      return;
    }
    root.classList.add('motion-ready');
    targets.forEach(target => target.classList.add('animate-target'));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: .08 });
    targets.forEach(target => observer.observe(target));
  }

  motionPreference.addEventListener('change', event => { paused = event.matches; sync(); setContentMotion(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('pointermove', updatePointer, { passive: true });
  window.addEventListener('pointerleave', clearPointer, { passive: true });
  window.addEventListener('pagehide', () => { window.cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('pageshow', sync);
  resize();
  setContentMotion();
  sync();
})();
