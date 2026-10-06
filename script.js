/* Nihal's Portfolio — interactions */
(function () {
  "use strict";

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");

  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
  }

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") closeNav(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  /* ---------- Highlight the current section in the nav ---------- */
  var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && map[entry.target.id]) {
          links.forEach(function (a) { a.classList.remove("active"); });
          map[entry.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  /* ---------- Hero: network topology canvas ---------- */
  var canvas = document.getElementById("net");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var nodes = [];
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pointer = { x: -9999, y: -9999 };
    var running = true;
    var LINK = 150;

    function size() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(22, Math.min(64, Math.round((w * h) / 21000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
          r: Math.random() * 1.4 + 1.1
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, d, alpha;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduce) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            alpha = (1 - d / LINK) * .32;
            ctx.strokeStyle = "rgba(167,139,250," + alpha + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        /* nodes near the pointer light up and connect to it */
        dx = a.x - pointer.x; dy = a.y - pointer.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 170) {
          alpha = (1 - d / 170) * .6;
          ctx.strokeStyle = "rgba(196,181,253," + alpha + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
        }
        ctx.fillStyle = d < 170 ? "rgba(221,214,254,.95)" : "rgba(167,139,250,.75)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    function loop() {
      if (running) draw();
      if (!reduce) requestAnimationFrame(loop);
    }

    var hero = canvas.parentElement;
    hero.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      if (reduce) draw();
    });
    hero.addEventListener("pointerleave", function () { pointer.x = pointer.y = -9999; if (reduce) draw(); });

    /* pause when the hero is off-screen */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { running = en[0].isIntersecting; }).observe(hero);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { size(); if (reduce) draw(); }, 150);
    });

    size();
    draw();
    if (!reduce) requestAnimationFrame(loop);
  }

  /* ---------- Animated graphics ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* SVG packet animation ignores the CSS setting, so pause it here */
  if (reduceMotion) {
    Array.prototype.forEach.call(document.querySelectorAll("svg.anim"), function (svg) {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }

  /* Terminal types itself once, when it scrolls into view */
  var term = document.querySelector(".terminal");
  if (term) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      term.classList.add("run");
    } else {
      var termObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          term.classList.add("run");
          termObs.disconnect();
        }
      }, { threshold: 0.4 });
      termObs.observe(term);
    }
  }

  /* ---------- Scroll progress, header state, back-to-top ---------- */
  var bar = document.querySelector(".progress i");
  var header = document.querySelector(".site-header");
  var toTop = document.querySelector(".to-top");
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    if (header) header.classList.toggle("scrolled", y > 8);
    if (toTop) toTop.classList.toggle("show", y > 700);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Scroll reveal ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var groups = [
      ".section h2", ".section-intro", ".about-text p", ".facts", ".visual",
      ".competencies li", ".toolkit", ".osi", ".steps li", ".capture",
      ".project", ".cert", ".contact-grid > *"
    ];
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    groups.forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el, i) {
        el.classList.add("reveal");
        el.style.setProperty("--i", Math.min(i, 5));
        revealObs.observe(el);
      });
    });
  }

  /* ---------- OSI layer explorer ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".osi-layers [role='tab']"));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute("aria-controls"));
      if (p) p.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------- Packet capture: plays once in view, replay on demand ---------- */
  var capture = document.getElementById("capture");
  var replay = capture && capture.querySelector(".cap-replay");
  if (capture) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      capture.querySelectorAll("tbody tr").forEach(function (r) { r.style.opacity = 1; });
    } else {
      var capObs = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { capture.classList.add("run"); capObs.disconnect(); }
      }, { threshold: 0.35 });
      capObs.observe(capture);
    }
    if (replay) {
      replay.addEventListener("click", function () {
        if (reduceMotion) return;
        capture.classList.remove("run");
        void capture.offsetWidth;
        capture.classList.add("run");
      });
    }
  }

  /* ---------- Certification validity: mark today on the 3-year bar ---------- */
  var track = document.querySelector(".validity .track");
  if (track) {
    var start = new Date(2026, 8, 17).getTime();
    var end = new Date(2029, 8, 17).getTime();
    var pct = Math.max(0, Math.min(1, (Date.now() - start) / (end - start))) * 100;
    track.style.setProperty("--p", Math.max(pct, 3).toFixed(1) + "%");
  }

  /* ---------- Copy buttons ---------- */
  var copyStatus = document.getElementById("copy-status");
  var copyTimer;
  Array.prototype.forEach.call(document.querySelectorAll(".copy"), function (btn) {
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
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
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
