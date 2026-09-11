/**
 * Madala Pranav Sai — Portfolio · app.js
 *
 * Upgrades over original:
 *  - Dark / light theme toggle, persisted to localStorage
 *  - Debounced + passive scroll listener (no layout thrashing)
 *  - IntersectionObserver for scroll-reveal (single orchestrated entrance)
 *  - Project filter uses CSS class toggling, not JS opacity + setTimeout
 *  - Terminal: ↑/↓ history, Tab completion, typewriter output, XSS-safe
 *  - Modals: focus trap, Escape key, backdrop click
 *  - Contact form: per-field live validation with ARIA error messages
 *  - Copy button: async clipboard API with execCommand fallback
 *  - Toasts: ARIA live region, CSS-driven slide + fade
 *  - Footer year auto-updated
 */

// ─── Constants ──────────────────────────────────────────────────────────────
const EMAIL        = 'madalapranavsai@gmail.com';
const GITHUB_URL   = 'https://github.com/madalapranavsai';
const LINKEDIN_URL = 'https://linkedin.com/in/pranav-sai-madala';
const CF_URL       = 'https://codeforces.com/profile/madalapranavsai';
const SCROLL_PX    = 40;
const TOAST_MS     = 3200;
const TYPEWRITER_MS = 10;

// ─── Boot ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initScrollReveal();
  initProjectFilters();
  initTerminal();
  initModals();
  initContactForm();
  initCopyButtons();
  initFooterYear();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const debounce = (fn, ms = 50) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── 1. Theme ────────────────────────────────────────────────────────────────
function initTheme() {
  const saved  = localStorage.getItem('theme');
  const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(saved || system);

  qs('#theme-toggle')?.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('theme', t);
  const btn = qs('#theme-toggle');
  if (btn) {
    btn.textContent = t === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} mode`);
  }
}

// ─── 2. Navbar ───────────────────────────────────────────────────────────────
function initNavbar() {
  const navbar    = qs('#navbar');
  const hamburger = qs('#hamburger');
  const navMenu   = qs('#nav-menu');
  const navLinks  = qsa('.nav-link');
  const sections  = qsa('section[id]');
  if (!navbar) return;

  window.addEventListener('scroll', debounce(() => {
    navbar.classList.toggle('scrolled', scrollY > SCROLL_PX);
  }, 30), { passive: true });

  hamburger?.addEventListener('click', () => {
    const open = navMenu?.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', String(!!open));
  });

  navLinks.forEach(l => l.addEventListener('click', () => {
    navMenu?.classList.remove('active');
    hamburger?.setAttribute('aria-expanded', 'false');
  }));

  if (sections.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`));
      });
    }, { threshold: 0.25, rootMargin: '-80px 0px 0px 0px' });
    sections.forEach(s => io.observe(s));
  }
}

// ─── 3. Scroll-reveal ────────────────────────────────────────────────────────
// Adds .revealed to elements as they enter the viewport.
// CSS drives the actual animation (opacity, translateY), so reduced-motion
// is respected purely in CSS via @media (prefers-reduced-motion: reduce).
function initScrollReveal() {
  const targets = qsa('[data-reveal]');
  if (!targets.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  targets.forEach(el => io.observe(el));
}

// ─── 4. Project filter ───────────────────────────────────────────────────────
function initProjectFilters() {
  const btns  = qsa('.filter-btn');
  const cards = qsa('.project-card');
  if (!btns.length) return;

  btns.forEach(btn => btn.addEventListener('click', () => {
    btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const f = btn.dataset.filter ?? 'all';
    cards.forEach(card => {
      const cats    = (card.dataset.category ?? '').split(' ');
      const visible = f === 'all' || cats.includes(f);
      card.classList.toggle('card-hidden', !visible);
      card.setAttribute('aria-hidden', String(!visible));
    });
  }));
}

// ─── 5. Terminal ─────────────────────────────────────────────────────────────
function initTerminal() {
  const form   = qs('#terminal-form');
  const input  = qs('#terminal-input');
  const output = qs('#terminal-output');
  if (!form || !input || !output) return;

  const history = [];
  let histIdx   = -1;

  // ── Command map ──
  const CMD = {
    help: { run: () => `<span class="cmd-kw">about</span>        Who is Pranav
<span class="cmd-kw">experience</span>   Internship at AxiomIO
<span class="cmd-kw">projects</span>     Featured builds
<span class="cmd-kw">skills</span>       Languages, tools, frameworks
<span class="cmd-kw">education</span>    MANIT Bhopal & academic scores
<span class="cmd-kw">achievements</span> Hackathon & competitive ratings
<span class="cmd-kw">contact</span>      Email, phone, social links
<span class="cmd-kw">github</span>       Open GitHub
<span class="cmd-kw">linkedin</span>     Open LinkedIn
<span class="cmd-kw">codeforces</span>   Open Codeforces
<span class="cmd-kw">whoami</span>       Who's reading this?
<span class="cmd-kw">uptime</span>       Page open duration
<span class="cmd-kw">date</span>         Current timestamp
<span class="cmd-kw">clear</span>        Clear terminal

↑ / ↓ navigate history · Tab to autocomplete` },

    about: { run: () =>
`Madala Pranav Sai
  Role  : Software Engineer Intern @ AxiomIO | B.Tech ECE '27, MANIT Bhopal
  Focus : AI Autonomous Agents · FastAPI Backends · Docker Microservices
  Email : ${EMAIL}` },

    experience: { run: () =>
`AxiomIO IT Global Pvt. Ltd. — Software Engineer Intern
  May 2026 – July 2026

  · A2UI frontend for xOps platform       → -40% data retrieval time
  · SecOps agent (DeepAgents mgr-worker)  → -60% manual triage
  · LangGraph + A2A stateful workflows    → distributed multi-agent arch
  · Docker containerization               → 50+ concurrent agents` },

    projects: { run: () =>
`1. NetSentinel AI
   Google ADK · Gemini API · FastAPI · FastMCP · Docker
   Autonomous SRE agent — MTTD -30%, prompt-injection firewall, HITL queue

2. Autonomous Security Agent
   LangChain DeepAgents · QuickJS · MCP · Docker
   20+ tasks parallelized — exec time -40% (10 min → 6 min)

3. URL Shortener & Rate Limiter
   FastAPI · PostgreSQL · Redis Lua · k6
   Snowflake ID 10k+/sec · atomic token-bucket · 52.67 req/s @ 99.91% ✓` },

    skills: { run: () =>
`Languages   : Python  C++  JavaScript  C
AI / Agents : Google ADK · Gemini API · LangChain DeepAgents
              LangGraph · MCP · A2A · A2UI
Backend     : FastAPI · Flask · REST APIs
Data        : PostgreSQL · Redis · SQLite
DevOps      : Docker · Google Cloud Run · GitHub Actions · Linux` },

    education: { run: () =>
`B.Tech ECE (2023–2027)
  MANIT Bhopal | CGPA 7.52 / 10

Class XII — BIEAP (2023)
  Narayana Junior College | 90.6%

Class X — BSEAP (2021)
  Kennedy EM High School | 99.8%` },

    achievements: { run: () =>
`🏆 Swafinix AI Agents Hackathon 2025
   Top-10 Finalist (Team Leader) — 200+ competing teams

⚡ Competitive Programming
   Codeforces Pupil · max 1234   |   CodeChef 3★ · max 1600+
   200+ problems: Codeforces · LeetCode · CodeChef` },

    contact: { run: () =>
`Email     : ${EMAIL}
Phone     : +91 7386781195
GitHub    : ${GITHUB_URL}
LinkedIn  : ${LINKEDIN_URL}
Codeforces: ${CF_URL}` },

    github: { run: () => { window.open(GITHUB_URL, '_blank', 'noopener'); return `→ ${GITHUB_URL}`; } },
    linkedin: { run: () => { window.open(LINKEDIN_URL, '_blank', 'noopener'); return `→ ${LINKEDIN_URL}`; } },
    codeforces: { run: () => { window.open(CF_URL, '_blank', 'noopener'); return `→ ${CF_URL}`; } },

    date: { run: () => new Date().toLocaleString('en-IN', { timeZoneName: 'short' }) },

    whoami: { run: () =>
`visitor@pranav-portfolio:~
  You're exploring a terminal built into a developer's portfolio.
  Type <span class="cmd-kw">help</span> to find your way around.` },

    uptime: { run: () => {
      const s = Math.floor(performance.now() / 1000);
      return `Page open for ${Math.floor(s/60)}m ${s%60}s`;
    }},

    sudo: { run: () =>
`[sudo] password for visitor: ········
sudo: access denied — but the portfolio is fully public 😄` },

    clear: { run: () => { output.innerHTML = ''; return null; } },
  };

  const names = Object.keys(CMD);

  // ── keyboard: history + tab ──
  input.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      const m = names.filter(n => n.startsWith(v));
      if (m.length === 1) { input.value = m[0]; }
      else if (m.length > 1) { appendLine(m.join('   '), 'sys'); }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < history.length - 1) input.value = history[history.length - 1 - ++histIdx] ?? '';
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIdx > 0 ? (input.value = history[history.length - 1 - --histIdx] ?? '') : (histIdx = -1, input.value = '');
    }
  });

  // ── submit ──
  form.addEventListener('submit', e => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    history.push(raw);
    histIdx = -1;

    appendLine(`<span class="cmd-prompt">pranav@manit:~$</span> ${escHtml(raw)}`, 'user');

    const def = CMD[raw.toLowerCase()];
    if (def) {
      const res = def.run();
      if (res) typeOut(res, 'sys');
    } else {
      appendLine(`command not found: <span class="cmd-err">${escHtml(raw)}</span>  — try <span class="cmd-kw">help</span>`, 'err');
    }
    input.value = '';
    output.scrollTop = output.scrollHeight;
  });

  function appendLine(html, type) {
    const d = document.createElement('div');
    d.className = `terminal-line line-${type}`;
    d.innerHTML = html.replace(/\n/g, '<br>');
    output.appendChild(d);
    output.scrollTop = output.scrollHeight;
  }

  function typeOut(richHtml, type) {
    if (reducedMotion()) { appendLine(richHtml, type); return; }
    const plain = richHtml.replace(/<[^>]+>/g, '');
    const d = document.createElement('div');
    d.className = `terminal-line line-${type}`;
    output.appendChild(d);
    let i = 0;
    const tick = () => {
      i = Math.min(i + 3, plain.length);
      d.textContent = plain.slice(0, i);
      if (i < plain.length) { setTimeout(tick, TYPEWRITER_MS); }
      else { d.innerHTML = richHtml.replace(/\n/g, '<br>'); }
      output.scrollTop = output.scrollHeight;
    };
    setTimeout(tick, TYPEWRITER_MS);
  }
}

// ─── 6. Modals ───────────────────────────────────────────────────────────────
function initModals() {
  const FOCUS = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

  function open(modal) {
    if (!modal) return;
    modal.showModal();
    // focus trap
    const els = qsa(FOCUS, modal);
    const first = els[0], last = els.at(-1);
    const trap = e => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first?.focus(); } }
    };
    modal.addEventListener('keydown', trap);
    modal.addEventListener('close', () => modal.removeEventListener('keydown', trap), { once: true });
    first?.focus();
  }

  function close(modal) { modal?.close(); }

  qsa('[data-modal]').forEach(btn =>
    btn.addEventListener('click', () => open(qs(`#${btn.dataset.modal}`)))
  );
  qsa('[data-close-modal]').forEach(btn =>
    btn.addEventListener('click', () => close(btn.closest('dialog')))
  );
  qsa('dialog').forEach(modal => {
    modal.addEventListener('cancel', e => { e.preventDefault(); close(modal); });
    modal.addEventListener('click', e => {
      const r = modal.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) close(modal);
    });
  });
}

// ─── 7. Contact form ─────────────────────────────────────────────────────────
function initContactForm() {
  const form = qs('#contact-form');
  if (!form) return;

  const rules = {
    name:    v => v.trim().length >= 2    || 'Name must be at least 2 characters',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address',
    message: v => v.trim().length >= 10   || 'Message must be at least 10 characters',
  };

  Object.keys(rules).forEach(name => {
    const f = form.elements[name];
    if (!f) return;
    f.addEventListener('blur',  () => { f.dataset.touched = '1'; validate(f, rules[name]); });
    f.addEventListener('input', () => { if (f.dataset.touched) validate(f, rules[name]); });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    Object.keys(rules).forEach(name => {
      const f = form.elements[name];
      f && !validate(f, rules[name]) && (ok = false);
    });
    if (!ok) return;
    const name = form.elements.name?.value.trim() ?? 'there';
    showToast(`Thanks ${name}! Message sent ✓`, 'success');
    form.reset();
    Object.keys(rules).forEach(n => clearErr(form.elements[n]));
  });
}

function validate(field, rule) {
  const r = rule(field.value);
  r === true ? clearErr(field) : setErr(field, r);
  return r === true;
}

function setErr(field, msg) {
  field.setAttribute('aria-invalid', 'true');
  let el = qs(`#err-${field.name}`);
  if (!el) {
    el = document.createElement('span');
    el.id = `err-${field.name}`;
    el.className = 'field-error';
    el.setAttribute('role', 'alert');
    field.after(el);
  }
  el.textContent = msg;
}

function clearErr(field) {
  if (!field) return;
  field.removeAttribute('aria-invalid');
  qs(`#err-${field.name}`)?.remove();
}

// ─── 8. Copy button ──────────────────────────────────────────────────────────
function initCopyButtons() {
  qs('#btn-copy-email')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      const ta = Object.assign(document.createElement('textarea'), {
        value: EMAIL, style: 'position:fixed;opacity:0;pointer-events:none'
      });
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    showToast(`Copied ${EMAIL}`, 'success');
  });
}

// ─── 9. Toasts ───────────────────────────────────────────────────────────────
function showToast(msg, variant = 'default') {
  let box = qs('#toast-container');
  if (!box) {
    box = Object.assign(document.createElement('div'), { id: 'toast-container' });
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-atomic', 'false');
    document.body.append(box);
  }
  const t = document.createElement('div');
  t.className = `toast toast--${variant}`;
  t.setAttribute('role', 'status');
  t.textContent = msg;
  box.append(t);
  requestAnimationFrame(() => t.classList.add('toast--in'));
  setTimeout(() => {
    t.classList.replace('toast--in', 'toast--out');
    setTimeout(() => t.remove(), 320);
  }, TOAST_MS);
}

// ─── 10. Footer year ─────────────────────────────────────────────────────────
function initFooterYear() {
  const el = qs('#current-year');
  if (el) el.textContent = new Date().getFullYear();
}
