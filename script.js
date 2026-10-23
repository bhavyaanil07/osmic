/* ============ OSMIC website behaviour ============
   All text comes from content.js. You don't need to edit this file. */

(function () {
  "use strict";

  const S = window.OSMIC;
  if (!S) {
    document.body.innerHTML =
      '<p style="padding:2rem;font-family:sans-serif;color:#fff">content.js has a mistake (a missing comma or quote). ' +
      "Open it and check the last thing you changed.</p>";
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel) => document.querySelector(sel);
  const esc = (t) =>
    String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : ""), S);
  const hue = (text) => [...String(text)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const initials = (name) => name.replace(/^(Dr\.?|Prof\.?|Br\.?|Swami)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const club = S.club;

  /* ---------- Simple text fills ---------- */
  document.querySelectorAll("[data-text]").forEach((el) => (el.textContent = get(el.dataset.text)));
  document.title = club.name + (club.fullName && !/write/i.test(club.fullName) ? " | " + club.fullName : "");
  $("#copy").textContent = "© " + new Date().getFullYear() + " " + club.name;

  /* ---------- Background photos ---------- */
  function setPhoto(el, url) {
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = 'url("' + img.src + '")';
    };
    img.src = url;
  }
  setPhoto($("#heroPhoto"), S.photos && S.photos.hero);
  setPhoto($("#joinPhoto"), S.photos && S.photos.join);

  /* ---------- Portal and email buttons ---------- */
  document.querySelectorAll(".portal-link").forEach((a) => {
    if (club.portalUrl) {
      a.href = club.portalUrl;
      a.target = "_blank";
      a.rel = "noopener";
    } else if (a.id === "joinPortal") {
      a.textContent = "Portal opens soon";
      a.classList.add("is-disabled");
      a.setAttribute("aria-disabled", "true");
    }
  });
  const mail = $("#joinEmail");
  if (club.email) mail.href = "mailto:" + club.email;
  else mail.remove();

  const socials = [["Instagram", club.instagram], ["LinkedIn", club.linkedin], ["GitHub", club.github]];
  $("#socials").innerHTML = socials
    .filter((s) => s[1])
    .map((s) => '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + s[0] + "</a>")
    .join("") + (club.email ? '<a href="mailto:' + esc(club.email) + '">Email</a>' : "");

  /* ---------- Hero name: letters spread out ---------- */
  const word = $("#heroWord");
  word.setAttribute("aria-label", club.name);
  word.innerHTML = [...club.name]
    .map((ch, i) => '<span class="ch" aria-hidden="true" style="--i:' + i + '">' + esc(ch) + "</span>")
    .join("");

  /* ---------- Typed tagline ---------- */
  function typeTagline() {
    const el = $("#typed");
    const text = club.tagline || "";
    if (reduceMotion) { el.textContent = text; return; }
    let i = 0;
    setTimeout(function tick() {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 42 + Math.random() * 40);
    }, 2100);
  }

  /* ---------- Moving strip ---------- */
  const words = (S.domains || []).map((d) => "<span>" + esc(d) + "</span>").join("");
  $("#marquee").innerHTML = words + words;

  /* ---------- About ---------- */
  const paras = (list) => (Array.isArray(list) ? list : [list]).map((p) => "<p>" + esc(p) + "</p>").join("");
  $("#aboutText").innerHTML = paras(S.story.about);
  $("#missionText").innerHTML = paras(S.story.mission);
  $("#beginningText").innerHTML = paras(S.story.beginning);
  $("#different").innerHTML = (S.story.different || [])
    .map((d, i) => '<div class="diff-item reveal" style="transition-delay:' + i * 0.1 + 's"><h4>' + esc(d.title) + "</h4><p>" + esc(d.text) + "</p></div>")
    .join("");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const events = (S.events || [])
    .map((e) => ({ ...e, d: new Date(e.date + "T00:00:00") }))
    .filter((e) => !isNaN(e.d));
  const upcoming = events.filter((e) => e.d >= today).sort((a, b) => a.d - b.d);
  const past = events.filter((e) => e.d < today).sort((a, b) => b.d - a.d);

  const stats = [
    [S.projects.length, "Projects"],
    [S.members.length, "Members"],
    [events.length, "Events"],
    [club.founded, "Founded"]
  ];
  $("#stats").innerHTML = stats
    .map((s) => '<div class="stat"><div class="stat-num" data-count="' + esc(s[0]) + '">0</div><div class="stat-label">' + s[1] + "</div></div>")
    .join("");

  /* ---------- Projects ---------- */
  const statusClass = { "Idea": "status-idea", "In Progress": "status-progress", "Completed": "status-done" };
  $("#projectList").innerHTML = S.projects
    .map((p) => {
      // The automatic design always sits underneath; photos are added on top once they load
      const media = '<div class="project-art" style="--h:' + hue(p.title) + '"><span>' + esc(initials(p.title.replace(/[^\w\s]/g, ""))) + "</span></div>";
      return (
        '<article class="project reveal" data-status="' + esc(p.status) + '">' +
        '<div class="project-media" data-slug="' + esc(p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) + '" data-image="' + esc([].concat(p.image || []).join("|")) + '">' + media + "</div>" +
        '<div class="project-body">' +
        '<div class="project-meta"><span class="status ' + (statusClass[p.status] || "status-idea") + '">' + esc(p.status) + "</span></div>" +
        "<h3>" + esc(p.title) + "</h3>" +
        ((p.focus || []).length ? '<ul class="chips focus">' + p.focus.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>" : "") +
        '<div class="project-desc">' + paras(p.description) + "</div>" +
        (p.coreIdea ? '<p class="core-idea"><span>Core idea</span>' + esc(p.coreIdea) + "</p>" : "") +
        (p.note ? '<p class="project-note">Note: ' + esc(p.note) + "</p>" : "") +
        (p.team && p.team.length ? '<p class="project-team">Team: ' + esc(p.team.join(", ")) + "</p>" : "") +
        (p.github ? '<a class="project-link" href="' + esc(p.github) + '" target="_blank" rel="noopener">View the code</a>' : "") +
        "</div></article>"
      );
    })
    .join("");

  /* Project photos: images/projects/<name>.jpg, <name>-1.jpg ... <name>-8.jpg
     (jpg, jpeg, png or webp). Several photos become a slideshow. */
  function tryLoad(candidates) {
    return new Promise((resolve) => {
      let i = 0;
      (function next() {
        if (i >= candidates.length) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(img.src);
        img.onerror = () => { i++; next(); };
        img.src = candidates[i];
      })();
    });
  }
  const exts = ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"];
  document.querySelectorAll(".project-media").forEach(async (box) => {
    const given = box.dataset.image ? box.dataset.image.split("|").filter(Boolean) : [];
    const names = given.length
      ? given.map((g) => [g])
      : ["", "-1", "-2", "-3", "-4", "-5", "-6", "-7", "-8"].map((n) => exts.map((x) => "images/projects/" + box.dataset.slug + n + "." + x));
    const found = (await Promise.all(names.map(tryLoad))).filter(Boolean);
    if (!found.length) return;
    found.forEach((src, i) => {
      const layer = document.createElement("div");
      layer.className = "project-img" + (i === 0 ? " is-on" : "");
      layer.style.backgroundImage = 'url("' + src + '")';
      box.appendChild(layer);
    });
    if (found.length < 2) return;
    const dots = document.createElement("div");
    dots.className = "slide-dots";
    dots.innerHTML = found.map((_, i) => '<button aria-label="Photo ' + (i + 1) + '"' + (i === 0 ? ' class="is-on"' : "") + "></button>").join("");
    box.appendChild(dots);
    const layers = box.querySelectorAll(".project-img");
    const buttons = dots.querySelectorAll("button");
    let current = 0, timer;
    function show(n) {
      layers[current].classList.remove("is-on"); buttons[current].classList.remove("is-on");
      current = (n + layers.length) % layers.length;
      layers[current].classList.add("is-on"); buttons[current].classList.add("is-on");
    }
    function start() { if (!reduceMotion) timer = setInterval(() => show(current + 1), 4000); }
    buttons.forEach((b, i) => b.addEventListener("click", () => { clearInterval(timer); show(i); start(); }));
    start();
  });

  const filterNames = ["All", "Idea", "In Progress", "Completed"].filter(
    (f) => f === "All" || S.projects.some((p) => p.status === f)
  );
  $("#filters").innerHTML = filterNames
    .map((f, i) => '<button class="filter' + (i === 0 ? " is-active" : "") + '" data-filter="' + f + '" aria-pressed="' + (i === 0) + '">' + f + "</button>")
    .join("");
  if (filterNames.length <= 2) $("#filters").style.display = "none";
  $("#filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    document.querySelectorAll(".filter").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-pressed", b === btn);
    });
    document.querySelectorAll(".project").forEach((card) => {
      const show = btn.dataset.filter === "All" || card.dataset.status === btn.dataset.filter;
      card.classList.toggle("is-hidden", !show);
      if (show) { card.classList.remove("in"); requestAnimationFrame(() => card.classList.add("in")); }
    });
  });

  /* ---------- Team ---------- */
  window.nextPhoto = function (img) {
    const rest = img.dataset.tries ? img.dataset.tries.split("|") : [];
    if (!rest.length || !rest[0]) { img.remove(); return; }
    img.dataset.tries = rest.slice(1).join("|");
    img.src = rest[0];
  };
  const groupsInOrder = [
    ["Founder", "Founder", "big"],
    ["Co-Founder", "Co-Founder", "big"],
    ["Core", "Core committee", "mid"],
    ["Member", "Members", ""]
  ];
  // Core team positions appear in this order; any other title goes after them
  const positionOrder = ["Project Coordinator", "Research Lead", "Tech Head", "Coding Head", "Hardware Head", "Treasurer", "Recruitment Head"];
  const posRank = (p) => { const i = positionOrder.indexOf(p); return i < 0 ? 99 : i; };

  function personCard(m, i) {
    // Photo: the file named in content.js, or images/team/first-last.(jpg|jpeg|png|webp)
    const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const EXT = ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"];
    // photo can be a full file name, a name without its ending, or empty (use the person's name)
    const base = m.photo ? m.photo.replace(/^images\/team\//, "") : slug;
    const tries = /\.[a-z]{3,4}$/i.test(base) ? ["images/team/" + base] : EXT.map((x) => "images/team/" + base + "." + x);
    const photo =
      '<div class="initials" style="--h:' + hue(m.name) + '">' + esc(initials(m.name)) + "</div>" +
      '<img src="' + esc(tries[0]) + '" data-tries="' + esc(tries.slice(1).join("|")) + '" alt="' + esc(m.name) + '" loading="lazy" onerror="nextPhoto(this)">';
    const links = [["LinkedIn", m.linkedin], ["GitHub", m.github]].filter((l) => l[1]);
    const showPos = m.position && m.position !== m.role;
    return (
      '<div class="person reveal" style="transition-delay:' + (i % 4) * 0.08 + 's">' +
      '<div class="portrait">' + photo + (showPos ? '<span class="position-tag">' + esc(m.position) + "</span>" : "") + "</div>" +
      "<h4>" + esc(m.name) + "</h4>" +
      "<p>" + esc([m.department, m.year].filter(Boolean).join(", ")) + "</p>" +
      (links.length ? '<div class="person-links">' + links.map((l) => '<a href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + l[0] + "</a>").join("") + "</div>" : "") +
      "</div>"
    );
  }

  const known = groupsInOrder.map((g) => g[0]);
  const others = S.members.filter((m) => !known.includes(m.role));
  const groupHtml = groupsInOrder
    .map(([role, title, size]) => {
      let people = S.members.filter((m) => m.role === role);
      if (role === "Member") people = people.concat(others);
      if (!people.length) return "";
      if (role === "Core") people = people.slice().sort((a, b) => posRank(a.position) - posRank(b.position));
      // "Founder" for one person, "Founders" for more (Core committee stays as is)
      const heading = people.length > 1 && /Founder$/.test(title) ? title + "s" : title;
      return '<div class="team-group"><h3 class="reveal">' + heading + '</h3><div class="people ' + size + '">' +
        people.map(personCard).join("") + "</div></div>";
    })
    .join("");
  $("#teamGroups").innerHTML = groupHtml;

  /* ---------- Special thanks ---------- */
  const th = S.thanks;
  if (th && th.people && th.people.length) {
    const box = $("#thanks");
    box.innerHTML =
      '<div class="thanks-head reveal"><h3>' + esc(th.title) + "</h3><p>" + esc(th.message) + "</p></div>" +
      '<div class="people big thanks-people">' +
      th.people.map((p, i) => personCard({ name: p.name, department: p.role, photo: p.photo }, i)).join("") +
      "</div>";
    box.hidden = false;
  }

  /* ---------- Our Chancellor (blessing) ---------- */
  const ch = S.chancellor;
  if (ch && ch.name) {
    const box = $("#chancellor");
    box.innerHTML =
      '<div class="ch-photo"><div class="ch-glow" aria-hidden="true"><span class="flame"></span></div></div>' +
      '<div class="ch-text">' +
      "<p class=\"ch-label\">" + esc(ch.title) + "</p>" +
      "<h3>" + esc(ch.name) + "</h3>" +
      '<blockquote>' + esc(ch.message) + "</blockquote>" +
      "</div>";
    box.hidden = false;
    const tries = ch.photo ? [ch.photo] : ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"].map((x) => "images/team/amma." + x);
    tryLoad(tries).then((src) => {
      if (!src) return;
      const img = document.createElement("img");
      img.src = src; img.alt = ch.name;
      box.querySelector(".ch-photo").appendChild(img);
    });
  }

  /* ---------- Events ---------- */
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function showEvents(which) {
    const list = which === "past" ? past : upcoming;
    $("#eventList").innerHTML = list.length
      ? list
          .map((e) =>
            '<li class="event reveal in' + (which === "past" ? " is-past" : "") + '">' +
            '<div class="event-date"><b>' + String(e.d.getDate()).padStart(2, "0") + "</b><span>" + months[e.d.getMonth()] + " " + e.d.getFullYear() + "</span></div>" +
            "<div><h4>" + esc(e.title) + "</h4><p>" + esc(e.description) + "</p></div>" +
            '<div class="event-place">' + esc(e.location) + "</div></li>")
          .join("")
      : '<li class="empty">' + (which === "past" ? "No past events yet." : "No events planned right now. Check back soon, or follow us to hear first.") + "</li>";
  }
  showEvents("upcoming");
  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", t === tab);
      });
      showEvents(tab.dataset.tab);
    })
  );

  /* ---------- Count-up numbers ---------- */
  function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) { el.textContent = el.dataset.count; return; }
    if (reduceMotion) { el.textContent = target; return; }
    const start = target > 100 ? target - 40 : 0;
    const t0 = performance.now();
    const dur = 1400;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(start + (target - start) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        if (en.target.id === "stats") en.target.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(en.target);
      }),
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal, .timeline").forEach((el) => io.observe(el));

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  const bar = $(".progress");
  const joinPhoto = $("#joinPhoto");
  const sections = ["about", "projects", "team", "events", "join"].map((id) => document.getElementById(id));
  const links = document.querySelectorAll(".nav-links a");
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    let current = "";
    sections.forEach((s) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id; });
    links.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + current));
    if (!reduceMotion) {
      const r = joinPhoto.parentElement.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) joinPhoto.style.transform = "translateY(" + (r.top - innerHeight / 2) * -0.12 + "px)";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = $("#menuToggle");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("menu-open", open);
  });
  links.forEach((a) =>
    a.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("menu-open");
    })
  );

  /* ---------- Water ripples and fireflies on the opening screen ---------- */
  function startRipples() {
    const canvas = $("#ripples");
    const ctx = canvas.getContext("2d");
    let w, h, dpr, running = true;
    const ripples = [];
    const flies = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < Math.round(Math.min(48, w / 30)); i++) {
      flies.push({ x: Math.random() * w, y: Math.random() * h, r: 0.8 + Math.random() * 1.8, s: 0.15 + Math.random() * 0.35, p: Math.random() * 6.28 });
    }

    function addRipple(x, y, size) {
      ripples.push({ x, y, r: 0, max: size || 90 + Math.random() * 170, speed: 0.55 + Math.random() * 0.4 });
      if (ripples.length > 40) ripples.shift();
    }

    let last = 0;
    canvas.parentElement.addEventListener("pointermove", (e) => {
      const now = performance.now();
      if (now - last < 120) return;
      last = now;
      const b = canvas.getBoundingClientRect();
      addRipple(e.clientX - b.left, e.clientY - b.top, 70 + Math.random() * 60);
    });
    canvas.parentElement.addEventListener("pointerdown", (e) => {
      const b = canvas.getBoundingClientRect();
      addRipple(e.clientX - b.left, e.clientY - b.top, 260);
    });

    let tick = 0;
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      tick++;
      if (tick % 55 === 0) addRipple(Math.random() * w, h * (0.55 + Math.random() * 0.42));

      ctx.lineWidth = 1.2;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += rp.speed;
        const life = 1 - rp.r / rp.max;
        if (life <= 0) { ripples.splice(i, 1); continue; }
        for (let k = 0; k < 3; k++) {
          const rr = rp.r - k * 14;
          if (rr <= 0) continue;
          ctx.beginPath();
          ctx.ellipse(rp.x, rp.y, rr, rr * 0.3, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(62,230,200," + (life * (0.42 - k * 0.12)).toFixed(3) + ")";
          ctx.stroke();
        }
      }

      for (const f of flies) {
        f.p += 0.02;
        f.y -= f.s * 0.35;
        f.x += Math.sin(f.p) * 0.35;
        if (f.y < -10) { f.y = h + 10; f.x = Math.random() * w; }
        const a = 0.35 + Math.sin(f.p * 2) * 0.3;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
        g.addColorStop(0, "rgba(242,181,68," + a.toFixed(3) + ")");
        g.addColorStop(1, "rgba(242,181,68,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    new IntersectionObserver((en) => {
      const visible = en[0].isIntersecting;
      if (visible && !running) { running = true; requestAnimationFrame(frame); }
      if (!visible) running = false;
    }).observe(canvas);
    requestAnimationFrame(frame);
  }

  /* ---------- Start ---------- */
  requestAnimationFrame(() => {
    document.body.classList.add("loaded");
    typeTagline();
    if (!reduceMotion) startRipples();
  });
})();
