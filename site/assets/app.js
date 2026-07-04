/* Luiz Takahashi · research site interactions (dependency-free) */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme toggle ---------- */
  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---------- sticky nav shadow ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-stuck", window.scrollY > 6);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- scrollspy (drives top nav + the TOC rail) ---------- */
  // ids in document order; the last one whose top has passed the offset line is "current"
  var spyIds = ["through-line", "research", "nullstate", "multiview", "behavior", "program", "methods"];
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a[data-spy]"));

  function navIdFor(cur) {
    return (cur === "nullstate" || cur === "multiview" || cur === "behavior") ? "research" : cur;
  }
  function setActive(cur) {
    tocLinks.forEach(function (a) {
      var on = a.getAttribute("data-spy") === cur;
      a.classList.toggle("active", on);
      if (on) { a.setAttribute("aria-current", "true"); } else { a.removeAttribute("aria-current"); }
    });
    var navCur = "#" + navIdFor(cur);
    navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === navCur); });
  }

  var spyTicking = false;
  function computeSpy() {
    spyTicking = false;
    var cur = spyIds[0];
    for (var i = 0; i < spyIds.length; i++) {
      var el = document.getElementById(spyIds[i]);
      if (el && el.getBoundingClientRect().top <= 140) cur = spyIds[i];
    }
    setActive(cur);
  }
  function onSpyScroll() {
    if (!spyTicking) { spyTicking = true; requestAnimationFrame(computeSpy); }
  }
  window.addEventListener("scroll", onSpyScroll, { passive: true });
  window.addEventListener("resize", onSpyScroll, { passive: true });
  computeSpy();

  /* ---------- reveal on scroll (with fail-safe) ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  function revealAll() { reveals.forEach(function (el) { el.classList.add("in"); }); }
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
    // safety: if anything is still hidden a moment after load, show it
    window.addEventListener("load", function () { setTimeout(revealAll, 1400); });
  }

  /* ---------- hero: per-cell score space ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    var u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  function buildScoreSpace() {
    var svg = document.getElementById("scoreSpace");
    if (!svg) return;
    var NS = "http://www.w3.org/2000/svg";
    var W = 440, H = 300;
    var padL = 52, padR = 22, padT = 30, padB = 44;
    var x0 = padL, x1 = W - padR, y0 = H - padB, y1 = padT;
    var Hmax = 3.15, Rmin = 0.5, Rmax = 6.0;
    var tH = 1.0, tR = 1.93;
    function X(h) { return x0 + (h / Hmax) * (x1 - x0); }
    function Y(r) { return y0 + ((r - Rmin) / (Rmax - Rmin)) * (y1 - y0); }

    function el(name, attrs) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }

    // frame
    svg.appendChild(el("rect", { x: x0, y: y1, width: x1 - x0, height: y0 - y1,
      fill: "none", stroke: "var(--line)", "stroke-width": 1 }));

    // threshold lines
    svg.appendChild(el("line", { x1: X(tH), y1: y1, x2: X(tH), y2: y0,
      stroke: "var(--muted)", "stroke-width": 1.1, "stroke-dasharray": "2 3" }));
    svg.appendChild(el("line", { x1: x0, y1: Y(tR), x2: x1, y2: Y(tR),
      stroke: "var(--muted)", "stroke-width": 1.1, "stroke-dasharray": "6 4" }));

    // groups: [count, meanH, sdH, meanR, sdR, color, rMinClip, rMaxClip, hMinClip, hMaxClip]
    var groups = [
      [340, 0.45, 0.28, 1.25, 0.34, "var(--signal)",   0.55, tR - 0.04, 0.02, 1.55],
      [300, 0.58, 0.42, 3.15, 0.95, "var(--confound)", tR + 0.04, 6.0, 0.02, 2.6],
      [90,  1.95, 0.42, 1.15, 0.30, "var(--violet)",   0.55, tR - 0.06, 1.05, 3.05]
    ];
    var rng = mulberry32(20260704);
    var circles = [];
    groups.forEach(function (g) {
      for (var i = 0; i < g[0]; i++) {
        var h = clamp(g[1] + gauss(rng) * g[2], g[8], g[9]);
        var r = clamp(g[3] + gauss(rng) * g[4], g[6], g[7]);
        var c = el("circle", { cx: X(h).toFixed(1), cy: Y(r).toFixed(1), r: 2.3,
          fill: g[5], opacity: 0.62 });
        svg.appendChild(c);
        circles.push(c);
      }
    });

    // axis + threshold labels
    function txt(x, y, s, opts) {
      var t = el("text", { x: x, y: y, fill: (opts && opts.fill) || "var(--muted)",
        "font-family": "var(--font-mono)", "font-size": (opts && opts.size) || 11,
        "text-anchor": (opts && opts.anchor) || "start" });
      t.textContent = s; svg.appendChild(t);
    }
    txt((x0 + x1) / 2, H - 10, "mapping entropy  H", { anchor: "middle" });
    var yl = el("text", { x: 14, y: (y0 + y1) / 2, fill: "var(--muted)",
      "font-family": "var(--font-mono)", "font-size": 11, "text-anchor": "middle",
      transform: "rotate(-90 14 " + ((y0 + y1) / 2) + ")" });
    yl.textContent = "off-manifold  ρ"; svg.appendChild(yl);
    txt(X(tH) + 4, y1 + 12, "τH", { fill: "var(--muted)", size: 10 });
    txt(x1 - 4, Y(tR) - 5, "τρ", { anchor: "end", fill: "var(--muted)", size: 10 });

    // fade-in as pure enhancement: points already rest at opacity .62, so if the
    // animation never runs they are simply visible immediately.
    if (!reduceMotion) {
      circles.forEach(function (c, i) {
        c.style.animation = "dotIn .5s ease both";
        c.style.animationDelay = Math.min(i * 1.1, 850) + "ms";
      });
    }
  }
  buildScoreSpace();
})();
