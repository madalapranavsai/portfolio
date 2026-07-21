/**
 * Madala Pranav Sai Portfolio Application JavaScript
 * Modular vanilla JS for sticky navigation, project filtering, terminal CLI, and modals.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initProjectFilters();
  initInteractiveTerminal();
  initModals();
  initContactForm();
  initCopyButtons();
});

/* ==========================================================================
   1. Navbar & Scroll Logic
   ========================================================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky blur on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  hamburger?.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // Close mobile menu on click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });

  // Intersection Observer for Active Navigation
  const sections = document.querySelectorAll('section[id]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(section => observer.observe(section));
}

/* ==========================================================================
   2. Category Project Filtering
   ========================================================================== */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active filter tab
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const categories = card.getAttribute('data-category').split(' ');
        if (filterValue === 'all' || categories.includes(filterValue)) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.opacity = '0';
          setTimeout(() => { card.style.display = 'none'; }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   3. Interactive Developer Terminal CLI
   ========================================================================== */
function initInteractiveTerminal() {
  const form = document.getElementById('terminal-form');
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');

  if (!form || !input || !output) return;

  const commands = {
    help: `Available Commands:
  • <span class="cmd-highlight">about</span>        - Brief intro about Pranav
  • <span class="cmd-highlight">experience</span>   - View internship work at AxiomIO
  • <span class="cmd-highlight">projects</span>     - View NetSentinel AI, Security Agent, URL Shortener
  • <span class="cmd-highlight">skills</span>       - List AI Frameworks, FastAPI, Docker, C++, Python
  • <span class="cmd-highlight">education</span>    - MANIT Bhopal (ECE '27) & Academic scores
  • <span class="cmd-highlight">achievements</span> - Hackathon Top-10 & Codeforces/CodeChef ratings
  • <span class="cmd-highlight">contact</span>      - Display email (+91 7386781195) & social profiles
  • <span class="cmd-highlight">github</span>       - Open GitHub profile in new tab
  • <span class="cmd-highlight">linkedin</span>     - Open LinkedIn profile
  • <span class="cmd-highlight">codeforces</span>   - Open Codeforces profile
  • <span class="cmd-highlight">clear</span>        - Clear terminal output
  • <span class="cmd-highlight">date</span>         - Display current date and timestamp`,

    about: `Madala Pranav Sai
Role: Software Engineer Intern @ AxiomIO | Student @ MANIT Bhopal (ECE '27)
Specialization: AI Autonomous Agents (Google ADK, LangChain, LangGraph), High-Performance FastAPI Backends, Docker Containerization.
Email: madalapranavsai@gmail.com`,

    experience: `Work Experience:
Software Engineer Intern — AxiomIO IT Global Pvt. Ltd. (May 2026 – July 2026)
• Engineered A2UI frontend for xOps platform (accelerated data retrieval by 40%).
• Architected SecOps agent with DeepAgents manager-worker model (reduced manual triage by ~60%).
• Designed stateful AI workflows on LangGraph & A2A protocol.
• Containerized multi-agent architecture in Docker supporting 50+ concurrent agents.`,

    projects: `Featured Systems & Projects:
1. NetSentinel AI [Google ADK, Gemini API, FastAPI, FastMCP, Docker]
   - Autonomous SRE incident resolution agent (MTTD reduced by 30%).
2. Autonomous Security Agent [LangChain DeepAgents, QuickJS, MCP, Docker]
   - Runtime JS workflow generator parallelizing 20+ security tasks.
3. URL Shortener & Rate Limiter [FastAPI, PostgreSQL, Redis Lua, k6]
   - Custom Snowflake ID generator (10,000+ IDs/sec) & atomic Redis rate limiter.`,

    skills: `Technical Skills Matrix:
• Languages   : Python, C++, JavaScript, C
• AI & Agents : Google ADK, Gemini API, LangChain DeepAgents, LangGraph, MCP, A2A, A2UI
• Backend/Data: FastAPI, Flask, REST APIs, PostgreSQL, Redis, SQLite
• Cloud/DevOps: Docker, Google Cloud Run, GitHub Actions CI/CD, Linux`,

    education: `Education Summary:
• B.Tech ECE (2023–2027) — Maulana Azad National Institute of Technology (MANIT), Bhopal | CGPA: 7.52/10
• Class 12th BIEAP (2023) — Narayana Junior College | 90.6%
• Class 10th BSEAP (2021) — Kennedy EM High School | 99.8%`,

    achievements: `Achievements & Competitive Programming:
🏆 Swafinix AI Agents Hackathon 2025: Top-10 Finalist (Team Leader) out of 200+ teams.
⚡ Codeforces Pupil (Max Rating: 1234) | CodeChef 3★ (Max Rating: 1600+).
💡 Solved 200+ algorithmic problems across Codeforces, LeetCode, CodeChef.`,

    contact: `Connect with Pranav:
• Email    : madalapranavsai@gmail.com
• Phone    : +91 7386781195
• GitHub   : https://github.com/madalapranavsai
• LinkedIn : https://linkedin.com/in/pranav-sai-madala
• Codeforces: https://codeforces.com/profile/madalapranavsai`,

    github: () => {
      window.open('https://github.com/madalapranavsai', '_blank');
      return "Opening GitHub profile in new tab...";
    },

    linkedin: () => {
      window.open('https://linkedin.com/in/pranav-sai-madala', '_blank');
      return "Opening LinkedIn profile in new tab...";
    },

    codeforces: () => {
      window.open('https://codeforces.com/profile/madalapranavsai', '_blank');
      return "Opening Codeforces profile in new tab...";
    },

    date: () => new Date().toLocaleString(),

    sudo: "Access Granted! You have full root access to explore Pranav's portfolio 😉",

    clear: () => {
      output.innerHTML = '';
      return null;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cmdText = input.value.trim().toLowerCase();
    if (!cmdText) return;

    // Append user input line
    appendLine(`pranav@manit:~$ ${input.value}`, 'user');

    if (commands[cmdText]) {
      const response = typeof commands[cmdText] === 'function' ? commands[cmdText]() : commands[cmdText];
      if (response) {
        appendLine(response, 'sys');
      }
    } else {
      appendLine(`command not found: ${cmdText}. Type <span class="cmd-highlight">help</span> for assistance.`, 'err');
    }

    input.value = '';
    output.scrollTop = output.scrollHeight;
  });

  function appendLine(text, type) {
    const line = document.createElement('div');
    line.className = `terminal-line line-${type}`;
    line.innerHTML = text.replace(/\n/g, '<br>');
    output.appendChild(line);
  }
}

/* ==========================================================================
   4. Modal Dialog Handlers
   ========================================================================== */
function initModals() {
  const openButtons = document.querySelectorAll('[data-modal]');
  const closeButtons = document.querySelectorAll('[data-close-modal]');

  openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      const modal = document.getElementById(modalId);
      if (modal) modal.showModal();
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('dialog');
      if (modal) modal.close();
    });
  });

  // Close when clicking backdrop
  document.querySelectorAll('dialog').forEach(modal => {
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) modal.close();
    });
  });
}

/* ==========================================================================
   5. Contact Form Handler
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    showToast(`Thank you, ${name}! Your message has been sent.`);
    form.reset();
  });
}

/* ==========================================================================
   6. Copy to Clipboard Utility & Toast Notifications
   ========================================================================== */
function initCopyButtons() {
  const btnCopyEmail = document.getElementById('btn-copy-email');
  btnCopyEmail?.addEventListener('click', () => {
    navigator.clipboard.writeText('madalapranavsai@gmail.com');
    showToast('Copied email (madalapranavsai@gmail.com) to clipboard!');
  });
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
