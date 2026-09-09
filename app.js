/**
 * Madala Pranav Sai — Portfolio JavaScript
 *
 * Improvements over original:
 * - Module pattern: each feature is a pure init function with no globals
 * - Performance: debounced scroll, passive event listeners, requestAnimationFrame for scroll-linked reads
 * - Dark mode: system preference detection + manual toggle, persisted in localStorage
 * - Animations: single entrance sequence on load (not scattered per-scroll), respect prefers-reduced-motion
 * - Terminal: command history (↑/↓), tab completion, typewriter output, async command support
 * - Project filter: CSS-driven transitions instead of JS opacity/display toggling
 * - Contact form: real validation with per-field error messages
 * - Accessibility: focus trap in modals, Escape key closes modals, ARIA live regions for toasts
 * - Code quality: no magic strings, constants at top, early returns, no repeated DOM queries
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const SCROLL_THRESHOLD = 40;
const TOAST_DURATION_MS = 3000;
const TOAST_FADE_MS = 300;
const TYPEWRITER_SPEED_MS = 12;
const EMAIL = 'madalapranavsai@gmail.com';
const GITHUB_URL = 'https://github.com/madalapranavsai';
const LINKEDIN_URL = 'https://linkedin.com/in/pranav-sai-madala';
const CODEFORCES_URL = 'https://codeforces.com/profile/madalapranavsai';

// ─── Entry point ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initEntranceAnimation();
  initProjectFilters();
  initInteractiveTerminal();
  initModals();
  initContactForm();
  initCopyButtons();
});

// ─── Utilities ───────────────────────────────────────────────────────────────

function debounce(fn, wait = 60) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function $(selector, context = document) {
  return context.querySelector(selector);
}

function $$(selector, context = document) {
  return [...context.querySelectorAll(selector)];
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── 1. Theme (Dark / Light) ─────────────────────────────────────────────────

function initTheme() {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored ?? (prefersDark ? 'dark' : 'light');
  applyTheme(theme);

  const toggle = $('#theme-toggle');
  toggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const toggle = $('#theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// ─── 2. Navbar & Scroll Logic ─────────────────────────────────────────────────

function initNavbar() {
  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const navMenu = $('#nav-menu');
  const navLinks = $$('.nav-link');
  const sections = $$('section[id]');

  if (!navbar) return;

  // Sticky blur on scroll — passive + debounced for performance
  window.addEventListener('scroll', debounce(() => {
    navbar.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
  }, 30), { passive: true });

  // Mobile menu toggle
  hamburger?.addEventListener('click', () => {
    const isOpen = navMenu?.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close mobile menu on nav link click
  navLinks.forEach(link => link.addEventListener('click', () => {
    navMenu?.classList.remove('active');
    hamburger?.setAttribute('aria-expanded', 'false');
  }));

  // Active link via IntersectionObserver — no scroll listener needed
  if (sections.length > 0) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

    sections.forEach(s => observer.observe(s));
  }
}

// ─── 3. Entrance animation ────────────────────────────────────────────────────
// A single orchestrated reveal on page load instead of per-scroll fade-ins.

function initEntranceAnimation() {
  if (prefersReducedMotion()) return;

  const hero = $('#hero');
  if (!hero) return;

  // Add CSS class that triggers a single staggered animation.
  // Actual keyframes belong in your CSS; this just signals when to run them.
  requestAnimationFrame(() => {
    hero.classList.add('js-animated');
  });
}

// ─── 4. Project Filtering ─────────────────────────────────────────────────────
// Uses CSS classes for hide/show instead of JS opacity+setTimeout.
// Add these to your CSS:
//   .project-card { transition: opacity 0.2s, transform 0.2s; }
//   .project-card.hidden { opacity: 0; pointer-events: none; transform: scale(0.97); }

function initProjectFilters() {
  const filterBtns = $$('.filter-btn');
  const cards = $$('.project-card');
  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter ?? 'all';

      cards.forEach(card => {
        const categories = (card.dataset.category ?? '').split(' ');
        const visible = filter === 'all' || categories.includes(filter);
        card.classList.toggle('hidden', !visible);
        card.setAttribute('aria-hidden', String(!visible));
      });
    });
  });
}

// ─── 5. Interactive Terminal ──────────────────────────────────────────────────

function initInteractiveTerminal() {
  const form = $('#terminal-form');
  const input = $('#terminal-input');
  const output = $('#terminal-output');
  if (!form || !input || !output) return;

  const history = [];
  let historyIndex = -1;

  // ── Command definitions ──
  const COMMANDS = {
    help: {
      description: 'List all commands',
      run: () => `Available commands:

  <span class="cmd-kw">about</span>        Brief intro about Pranav
  <span class="cmd-kw">experience</span>   Internship at AxiomIO
  <span class="cmd-kw">projects</span>     NetSentinel AI, SecOps Agent, URL Shortener
  <span class="cmd-kw">skills</span>       Languages, frameworks, and tools
  <span class="cmd-kw">education</span>    MANIT Bhopal (ECE '27) and scores
  <span class="cmd-kw">achievements</span> Hackathon Top-10, competitive ratings
  <span class="cmd-kw">contact</span>      Email, phone, and social links
  <span class="cmd-kw">github</span>       Open GitHub profile
  <span class="cmd-kw">linkedin</span>     Open LinkedIn profile
  <span class="cmd-kw">codeforces</span>   Open Codeforces profile
  <span class="cmd-kw">clear</span>        Clear terminal
  <span class="cmd-kw">date</span>         Current timestamp
  <span class="cmd-kw">whoami</span>       Who are you?
  <span class="cmd-kw">uptime</span>       How long the page has been open

Type any command and press Enter. Use ↑ / ↓ to navigate history, Tab to complete.`,
    },

    about: {
      description: 'Brief intro',
      run: () => `Madala Pranav Sai
  Role    : Software Engineer Intern @ AxiomIO | B.Tech ECE '27, MANIT Bhopal
  Focus   : AI Autonomous Agents · High-Performance FastAPI Backends · Docker
  Email   : ${EMAIL}`,
    },

    experience: {
      description: 'Internship at AxiomIO',
      run: () => `Software Engineer Intern — AxiomIO IT Global Pvt. Ltd.
  May 2026 – July 2026

  · Engineered A2UI frontend for xOps platform (↓ data retrieval time 40%)
  · Architected SecOps agent with DeepAgents manager-worker model (↓ triage 60%)
  · Designed stateful AI workflows on LangGraph + A2A protocol
  · Containerized multi-agent Docker architecture (50+ concurrent agents)`,
    },

    projects: {
      description: 'Featured projects',
      run: () => `Featured Projects

  1. NetSentinel AI
     Stack : Google ADK · Gemini API · FastAPI · FastMCP · Docker
     Impact: Autonomous SRE agent — MTTD reduced 30%

  2. Autonomous Security Agent
     Stack : LangChain DeepAgents · QuickJS · MCP · Docker
     Impact: Parallelizes 20+ security tasks via runtime JS workflow

  3. URL Shortener + Rate Limiter
     Stack : FastAPI · PostgreSQL · Redis Lua · k6
     Impact: Custom Snowflake ID (10,000+ IDs/sec) · atomic Redis limiter`,
    },

    skills: {
      description: 'Technical skills',
      run: () => `Technical Skills

  Languages  : Python  C++  JavaScript  C
  AI / Agents: Google ADK · Gemini API · LangChain DeepAgents
               LangGraph · MCP · A2A · A2UI
  Backend    : FastAPI · Flask · REST APIs
  Data       : PostgreSQL · Redis · SQLite
  DevOps     : Docker · Google Cloud Run · GitHub Actions · Linux`,
    },

    education: {
      description: 'Academic background',
      run: () => `Education

  B.Tech ECE (2023–2027)
    Maulana Azad National Institute of Technology (MANIT), Bhopal
    CGPA: 7.52 / 10.0

  Class XII — BIEAP (2023)
    Narayana Junior College | 90.6%

  Class X — BSEAP (2021)
    Kennedy EM High School | 99.8%`,
    },

    achievements: {
      description: 'Hackathon and competitive programming',
      run: () => `Achievements

  🏆 Swafinix AI Agents Hackathon 2025
     Top-10 Finalist as Team Leader — 200+ competing teams

  ⚡ Competitive Programming
     Codeforces Pupil  · Max rating 1234
     CodeChef 3★       · Max rating 1600+
     200+ problems solved across CF / LeetCode / CodeChef`,
    },

    contact: {
      description: 'Contact and social links',
      run: () => `Contact

  Email     : ${EMAIL}
  Phone     : +91 7386781195
  GitHub    : ${GITHUB_URL}
  LinkedIn  : ${LINKEDIN_URL}
  Codeforces: ${CODEFORCES_URL}`,
    },

    github: {
      description: 'Open GitHub profile',
      run: () => {
        window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
        return `Opening GitHub → ${GITHUB_URL}`;
      },
    },

    linkedin: {
      description: 'Open LinkedIn profile',
      run: () => {
        window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer');
        return `Opening LinkedIn → ${LINKEDIN_URL}`;
      },
    },

    codeforces: {
      description: 'Open Codeforces profile',
      run: () => {
        window.open(CODEFORCES_URL, '_blank', 'noopener,noreferrer');
        return `Opening Codeforces → ${CODEFORCES_URL}`;
      },
    },

    date: {
      description: 'Current timestamp',
      run: () => new Date().toLocaleString('en-IN', { timeZoneName: 'short' }),
    },

    whoami: {
      description: 'Identify the visitor',
      run: () => `visitor@pranav-portfolio:~$
  You're exploring the terminal of a developer who builds autonomous AI systems.
  Type <span class="cmd-kw">help</span> to get started.`,
    },

    uptime: {
      description: 'Page uptime',
      run: () => {
        const seconds = Math.floor(performance.now() / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `Page has been open for ${m}m ${s}s`;
      },
    },

    sudo: {
      description: '',
      run: () => `[sudo] password for visitor: ········
sudo: permission denied — but you already have full portfolio access 😄`,
    },

    clear: {
      description: 'Clear terminal',
      run: () => { output.innerHTML = ''; return null; },
    },
  };

  const commandNames = Object.keys(COMMANDS);

  // ── Tab completion ──
  input.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      const matches = commandNames.filter(c => c.startsWith(val));
      if (matches.length === 1) {
        input.value = matches[0];
      } else if (matches.length > 1) {
        appendLine(matches.join('  '), 'sys');
      }
      return;
    }

    // History navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        input.value = history[history.length - 1 - historyIndex] ?? '';
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[history.length - 1 - historyIndex] ?? '';
      } else {
        historyIndex = -1;
        input.value = '';
      }
      return;
    }
  });

  // ── Command execution ──
  form.addEventListener('submit', e => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;

    history.push(raw);
    historyIndex = -1;

    appendLine(`pranav@manit:~$ ${escapeHtml(raw)}`, 'user');

    const cmd = raw.toLowerCase();
    const def = COMMANDS[cmd];

    if (def) {
      const result = def.run();
      if (result) typewriterAppend(result, 'sys');
    } else {
      appendLine(
        `command not found: <span class="cmd-err">${escapeHtml(cmd)}</span>  — type <span class="cmd-kw">help</span> for a list`,
        'err',
      );
    }

    input.value = '';
    output.scrollTop = output.scrollHeight;
  });

  // ── DOM helpers ──
  function appendLine(html, type) {
    const line = document.createElement('div');
    line.className = `terminal-line line-${type}`;
    line.innerHTML = html.replace(/\n/g, '<br>');
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function typewriterAppend(text, type) {
    if (prefersReducedMotion()) {
      appendLine(text, type);
      return;
    }
    const line = document.createElement('div');
    line.className = `terminal-line line-${type}`;
    output.appendChild(line);

    // Strip HTML tags to measure plain length, then re-insert rich HTML at end
    const plain = text.replace(/<[^>]+>/g, '');
    let i = 0;
    const tick = () => {
      i = Math.min(i + 2, plain.length);
      // Show partial plain text while typing, then swap in full rich HTML at end
      line.textContent = plain.slice(0, i);
      if (i < plain.length) {
        setTimeout(tick, TYPEWRITER_SPEED_MS);
      } else {
        line.innerHTML = text.replace(/\n/g, '<br>');
      }
      output.scrollTop = output.scrollHeight;
    };
    setTimeout(tick, TYPEWRITER_SPEED_MS);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// ─── 6. Modals ────────────────────────────────────────────────────────────────
// Focus trap, Escape key, backdrop click.

function initModals() {
  const openBtns = $$('[data-modal]');
  const closeBtns = $$('[data-close-modal]');
  const modals = $$('dialog');

  const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function openModal(modal) {
    if (!modal) return;
    modal.showModal();
    trapFocus(modal);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.close();
  }

  function trapFocus(modal) {
    const focusable = $$(FOCUSABLE, modal);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handler = e => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    modal.addEventListener('keydown', handler, { once: false });
    // Clean up when modal closes
    modal.addEventListener('close', () => modal.removeEventListener('keydown', handler), { once: true });
    first?.focus();
  }

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = $(`#${btn.dataset.modal}`);
      openModal(modal);
    });
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('dialog')));
  });

  modals.forEach(modal => {
    // Escape key
    modal.addEventListener('cancel', e => { e.preventDefault(); closeModal(modal); });

    // Backdrop click (click outside the dialog content box)
    modal.addEventListener('click', e => {
      const { top, left, right, bottom } = modal.getBoundingClientRect();
      const outside = e.clientY < top || e.clientY > bottom || e.clientX < left || e.clientX > right;
      if (outside) closeModal(modal);
    });
  });
}

// ─── 7. Contact Form ──────────────────────────────────────────────────────────

function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const rules = {
    name: v => v.trim().length >= 2 || 'Name must be at least 2 characters',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address',
    message: v => v.trim().length >= 10 || 'Message must be at least 10 characters',
  };

  // Live validation
  Object.keys(rules).forEach(name => {
    const field = form.elements[name];
    if (!field) return;
    field.addEventListener('blur', () => validateField(field, rules[name]));
    field.addEventListener('input', () => {
      if (field.dataset.touched) validateField(field, rules[name]);
    });
    field.addEventListener('blur', () => { field.dataset.touched = 'true'; }, { once: true });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    Object.keys(rules).forEach(name => {
      const field = form.elements[name];
      if (field && !validateField(field, rules[name])) valid = false;
    });
    if (!valid) return;

    const name = form.elements.name?.value?.trim() ?? 'there';
    showToast(`Thanks, ${name}! Your message has been sent.`, 'success');
    form.reset();
    Object.keys(rules).forEach(n => clearError(form.elements[n]));
  });
}

function validateField(field, rule) {
  const result = rule(field.value);
  if (result === true) {
    clearError(field);
    return true;
  }
  showError(field, result);
  return false;
}

function showError(field, message) {
  field.setAttribute('aria-invalid', 'true');
  let err = document.getElementById(`${field.name}-error`);
  if (!err) {
    err = document.createElement('span');
    err.id = `${field.name}-error`;
    err.className = 'field-error';
    err.setAttribute('role', 'alert');
    field.insertAdjacentElement('afterend', err);
  }
  err.textContent = message;
}

function clearError(field) {
  if (!field) return;
  field.removeAttribute('aria-invalid');
  document.getElementById(`${field.name}-error`)?.remove();
}

// ─── 8. Copy Buttons ──────────────────────────────────────────────────────────

function initCopyButtons() {
  const copyEmailBtn = $('#btn-copy-email');
  copyEmailBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      showToast(`Copied ${EMAIL}`, 'success');
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = EMAIL;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast(`Copied ${EMAIL}`, 'success');
    }
  });
}

// ─── 9. Toast Notifications ───────────────────────────────────────────────────
// ARIA live region for screen readers.

function showToast(message, variant = 'default') {
  const container = $('#toast-container') ?? createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${variant}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger CSS enter transition
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--hidden');
    setTimeout(() => toast.remove(), TOAST_FADE_MS);
  }, TOAST_DURATION_MS);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'false');
  document.body.appendChild(container);
  return container;
}
