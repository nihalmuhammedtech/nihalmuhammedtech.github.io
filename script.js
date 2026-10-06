/* Nihal's Portfolio: follow the cable */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Footer year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Stars in the dawn sky ---------- */
  var stars = $("#stars");
  if (stars) {
    for (var s = 0; s < 46; s++) {
      var star = document.createElement("i");
      var size = Math.random() < .2 ? 3 : 2;
      star.style.cssText =
        "--x:" + (Math.random() * 100).toFixed(1) + "%;" +
        "--y:" + (Math.random() * 100).toFixed(1) + "%;" +
        "--z:" + size + "px;" +
        "--s:" + (3 + Math.random() * 4).toFixed(1) + "s;" +
        "--dl:-" + (Math.random() * 6).toFixed(1) + "s";
      stars.appendChild(star);
    }
  }

  /* SVG packet animation ignores the CSS setting, so pause it here */
  if (reduce) {
    $$("svg").forEach(function (svg) { if (svg.pauseAnimations) svg.pauseAnimations(); });
  }

  /* ==========================================================
     The cable: position, depth, current section
     ========================================================== */
  var rail = $(".rail");
  var depthEl = $("#depth");
  var railLinks = $$(".rail a");
  var sections = railLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  var pill = $(".hello-pill");
  var STOPS = [0, 60, 400, 1500, 3000, 4500];
  var tops = [];
  var currentIndex = -1;
  var state = { pos: 0, depth: 0, index: 0 };

  function measure() {
    var y = window.pageYOffset;
    tops = sections.map(function (sec) { return sec.getBoundingClientRect().top + y; });
  }

  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  function readCable() {
    var lead = window.innerHeight * 0.4;
    var sy = window.pageYOffset;
    /* the reading line eases in from the very top, so the surface reads 0 m */
    var y = sy + lead * clamp(sy / lead, 0, 1);
    var i = 0;
    for (var k = 0; k < tops.length; k++) { if (y >= tops[k]) i = k; }
    var f = 0;
    if (i < tops.length - 1) f = clamp((y - tops[i]) / (tops[i + 1] - tops[i]), 0, 1);
    var pos = i === tops.length - 1 ? 1 : (i + f) / (tops.length - 1);
    var depth;
    if (i < 5) depth = STOPS[i] + (STOPS[i + 1] - STOPS[i]) * smooth(f);
    else if (i === 5) depth = 4500 * (1 - smooth((f - 0.55) / 0.45));
    else depth = 0;
    state.pos = pos; state.depth = depth; state.index = i;
  }

  function paintCable() {
    readCable();
    if (rail) rail.style.setProperty("--pos", state.pos.toFixed(4));
    if (depthEl) {
      var d = Math.round(state.depth / 10) * 10;
      depthEl.textContent = d.toLocaleString("en-US") + " m";
    }
    if (state.index !== currentIndex) {
      currentIndex = state.index;
      railLinks.forEach(function (a, n) {
        if (n === currentIndex) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      if (pill) pill.classList.toggle("gone", currentIndex === sections.length - 1);
      pingSay(currentIndex);
    }
  }

  /* ==========================================================
     Ping the jellyfish
     ========================================================== */
  var ping = $(".ping");
  var pingText = $("#ping-say");
  var LINES = [
    "Psst. The cable goes deep. Scroll down.",
    "That's Nihal, waving from the control room.",
    "Big toolkit. Pick an OSI layer and poke it.",
    "Five steps. No guessing allowed.",
    "Sonar's on. Watch the packets travel.",
    "CCNA, valid until 2029. Tidy.",
    "Made it. Now say hello!"
  ];
  var typeTimer, quietTimer;

  function pingSay(i) {
    if (!ping || !pingText) return;
    var line = LINES[i] || "";
    clearTimeout(typeTimer); clearTimeout(quietTimer);
    ping.classList.remove("quiet");
    if (reduce) { pingText.textContent = line; }
    else {
      var n = 0;
      pingText.textContent = "";
      (function step() {
        n++;
        pingText.textContent = line.slice(0, n);
        if (n < line.length) typeTimer = setTimeout(step, 24);
      })();
    }
    quietTimer = setTimeout(function () { ping.classList.add("quiet"); }, 5000);
  }

  var pt = { x: -1, y: -1, seen: false };
  var jelly = { x: 0, y: 0 };

  function jellyHome() {
    return { x: window.innerWidth - 88 - 16, y: window.innerHeight - 118 - 12 };
  }

  if (ping) {
    var home0 = jellyHome();
    jelly.x = home0.x; jelly.y = home0.y;
    ping.style.transform = "translate3d(" + jelly.x + "px," + jelly.y + "px,0)";

    if (finePointer) {
      window.addEventListener("pointermove", function (e) { pt.x = e.clientX; pt.y = e.clientY; pt.seen = true; }, { passive: true });
      document.addEventListener("pointerleave", function () { pt.seen = false; });
    }

    var flipped = false;
    (function follow() {
      var target = jellyHome();
      if (finePointer && pt.seen && !reduce) {
        target = {
          x: clamp(pt.x + 36, 8, window.innerWidth - 100),
          y: clamp(pt.y + 30, 8, window.innerHeight - 130)
        };
      }
      var k = reduce ? 1 : 0.05;
      jelly.x += (target.x - jelly.x) * k;
      jelly.y += (target.y - jelly.y) * k;
      ping.style.transform = "translate3d(" + jelly.x.toFixed(1) + "px," + jelly.y.toFixed(1) + "px,0)";
      var shouldFlip = jelly.x < 250;
      if (shouldFlip !== flipped) { flipped = shouldFlip; ping.classList.toggle("flip", flipped); }
      if (!reduce) requestAnimationFrame(follow);
    })();
  }

  /* ==========================================================
     Marine snow and bioluminescent glints
     ========================================================== */
  var canvas = $("#marine");
  var scrollDelta = 0, lastY = window.pageYOffset;
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, snow = [], glints = [];

    var sizeCanvas = function () {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = clamp(Math.round(W * H / 17000), 36, 100);
      snow = [];
      for (var i = 0; i < n; i++) {
        snow.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.5 + .5, z: Math.random() * .45 + .08,
          vx: (Math.random() - .5) * .12, vy: Math.random() * .22 + .06
        });
      }
      glints = [];
      for (var g = 0; g < 16; g++) {
        glints.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 4 + 3, z: Math.random() * .5 + .15,
          vx: (Math.random() - .5) * .18, vy: -(Math.random() * .16 + .03),
          ph: Math.random() * Math.PI * 2, hue: Math.random() < .6 ? "98,231,255" : "255,107,157"
        });
      }
    };

    var paintMarine = function (t) {
      ctx.clearRect(0, 0, W, H);
      var vis = clamp(state.pos * 6, 0, 1);
      if (vis <= 0.01) return;
      var df = clamp(state.depth / 4500, 0, 1);
      var i, p;
      for (i = 0; i < snow.length; i++) {
        p = snow[i];
        if (!reduce) {
          p.x += p.vx; p.y += p.vy - scrollDelta * p.z;
          if (p.y > H + 4) p.y = -4; if (p.y < -4) p.y = H + 4;
          if (p.x > W + 4) p.x = -4; if (p.x < -4) p.x = W + 4;
        }
        ctx.fillStyle = "rgba(210,244,255," + (0.5 * vis * (0.5 + p.z)).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      var ga = (0.3 + 0.7 * df) * vis;
      for (i = 0; i < glints.length; i++) {
        p = glints[i];
        if (!reduce) {
          p.x += p.vx; p.y += p.vy - scrollDelta * p.z;
          if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
          if (p.x > W + 10) p.x = -10; if (p.x < -10) p.x = W + 10;
        }
        var pulse = reduce ? 0.7 : 0.55 + 0.45 * Math.sin(t / 900 + p.ph);
        var a = ga * pulse;
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, "rgba(" + p.hue + "," + (0.6 * a).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(" + p.hue + ",0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.2832); ctx.fill();
      }
    };

    sizeCanvas();
    var marineLoop = function (t) {
      paintMarine(t);
      scrollDelta *= 0.8;
      requestAnimationFrame(marineLoop);
    };
    if (reduce) { paintMarine(0); }
    else { requestAnimationFrame(marineLoop); }

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { sizeCanvas(); if (reduce) paintMarine(0); }, 150);
    });
  }

  /* ---------- Scroll bookkeeping ---------- */
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset;
    scrollDelta += clamp(y - lastY, -80, 80) * 0.5;
    lastY = y;
    paintCable();
    if (reduce && canvas) { /* static redraw handled on scroll below */ }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", function () { measure(); paintCable(); });
  window.addEventListener("load", function () { measure(); paintCable(); });
  measure();
  paintCable();
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () { measure(); paintCable(); });
    ro.observe(document.body);
  }

  /* ---------- In-view triggers (terminal, capture, sonar) ---------- */
  function whenVisible(el, threshold, fn, once) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(true); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        fn(en.isIntersecting);
        if (en.isIntersecting && once) obs.disconnect();
      });
    }, { threshold: threshold });
    obs.observe(el);
  }

  var term = $(".terminal");
  if (reduce) { if (term) term.classList.add("run"); }
  else whenVisible(term, 0.4, function (on) { if (on) term.classList.add("run"); }, true);

  var capture = $("#capture");
  var replay = capture && $(".cap-replay", capture);
  if (capture) {
    if (reduce) {
      $$("tbody tr", capture).forEach(function (r) { r.style.opacity = 1; });
    } else {
      whenVisible(capture, 0.35, function (on) { if (on) capture.classList.add("run"); }, true);
    }
    if (replay) {
      replay.addEventListener("click", function () {
        if (reduce) return;
        capture.classList.remove("run");
        void capture.offsetWidth;
        capture.classList.add("run");
      });
    }
  }

  $$(".sonar").forEach(function (son) {
    whenVisible(son, 0.15, function (on) { son.classList.toggle("live", on && !reduce); }, false);
  });

  /* ---------- OSI layers: tabs and the 3D stack stay in sync ---------- */
  var tabs = $$(".osi-layers [role='tab']");
  var slabs = $$(".slab");
  function selectLayer(tab, focus) {
    var layer = tab.getAttribute("data-layer");
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute("aria-controls"));
      if (p) p.hidden = !on;
    });
    slabs.forEach(function (sl) { sl.classList.toggle("on", sl.getAttribute("data-layer") === layer); });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectLayer(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectLayer(next, true); }
    });
  });
  slabs.forEach(function (sl) {
    sl.addEventListener("click", function () {
      var tab = tabs.filter(function (t) { return t.getAttribute("data-layer") === sl.getAttribute("data-layer"); })[0];
      if (tab) selectLayer(tab, false);
    });
  });
  var startTab = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0];
  if (startTab) selectLayer(startTab, false);

  /* ---------- Certification validity: mark today on the 3-year cable ---------- */
  var track = $(".validity .track");
  if (track) {
    var start = new Date(2026, 8, 17).getTime();
    var end = new Date(2029, 8, 17).getTime();
    var pct = clamp((Date.now() - start) / (end - start), 0, 1) * 100;
    track.style.setProperty("--p", Math.max(pct, 3).toFixed(1) + "%");
  }

  /* ---------- Copy buttons ---------- */
  var copyStatus = $("#copy-status");
  var copyTimer;
  $$(".copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var label = btn.getAttribute("aria-label").replace("Copy ", "");

      function done(ok) {
        if (!copyStatus) return;
        copyStatus.textContent = ok ? "Copied " + label + "." : "Could not copy. Please select and copy it manually.";
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () { copyStatus.textContent = ""; }, 2500);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
        document.body.removeChild(ta);
        done(ok);
      }
    });
  });

  /* ---------- Contact form (opens the visitor's email app) ---------- */
  var form = $("#contact-form");
  var status = $("#form-status");
  var TO = "nihalsalih77@gmail.com";

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name, email = form.elements.email, msg = form.elements.message;
      var ok = true;

      [name, email, msg].forEach(function (f) {
        var bad = !f.value.trim() || (f === email && !/^\S+@\S+\.\S+$/.test(f.value.trim()));
        f.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) ok = false;
      });

      if (!ok) {
        status.textContent = "Please fill in your name, a valid email and a message.";
        return;
      }

      var subject = "Portfolio message from " + name.value.trim();
      var body = msg.value.trim() + "\n\n" + name.value.trim() + "\n" + email.value.trim();
      window.location.href = "mailto:" + TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      status.textContent = "Opening your email app with the message ready to send.";
      form.reset();
    });
  }
})();
