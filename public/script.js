// ---------- mobile nav ----------
function initMobileMenu() {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;

  function close() {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  function open() {
    links.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", () => {
    if (links.classList.contains("open")) close(); else open();
  });
  links.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
  document.addEventListener("click", (e) => {
    if (!links.classList.contains("open")) return;
    if (links.contains(e.target) || toggle.contains(e.target)) return;
    close();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) close();
  });
}

// ---------- scroll reveal ----------
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach(el => io.observe(el));
}

// ---------- hero typewriter ----------
const TYPE_SNIPPETS = [
  `pip install multimind-sdk`,
  `from multimind import OpenAIModel

model = OpenAIModel(model_name="gpt-4o-mini")
response = await model.generate("Explain quantum computing simply")`,
  `from multimind.compliance import guard

model = guard(OpenAIModel(model_name="gpt-4o-mini"),
              strategy="mask", block_on=("ssn", "credit_card"))`,
];

function initTypewriter() {
  const el = document.getElementById("typewriter");
  if (!el) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    el.textContent = TYPE_SNIPPETS[0];
    return;
  }

  let snippetIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const full = TYPE_SNIPPETS[snippetIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = full.slice(0, charIndex);
      if (charIndex >= full.length) {
        deleting = false;
        setTimeout(() => { deleting = true; tick(); }, 1800);
        return;
      }
      setTimeout(tick, 22);
    } else {
      charIndex--;
      el.textContent = full.slice(0, charIndex);
      if (charIndex <= 0) {
        deleting = false;
        snippetIndex = (snippetIndex + 1) % TYPE_SNIPPETS.length;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, 10);
    }
  }
  tick();
}

// ---------- copy install command ----------
function initCopyInstall() {
  const btn = document.getElementById("copy-install");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const text = "pip install multimind-sdk";
    const hint = btn.querySelector(".copy-hint");
    try {
      await navigator.clipboard.writeText(text);
      if (hint) { hint.textContent = "copied!"; setTimeout(() => hint.textContent = "copy", 1500); }
    } catch (e) {
      if (hint) { hint.textContent = "select & copy"; setTimeout(() => hint.textContent = "copy", 1500); }
    }
  });
}

// ---------- features show more / less ----------
function initFeaturesToggle() {
  const btn = document.getElementById("features-toggle");
  const grid = document.getElementById("features-grid");
  if (!btn || !grid) return;
  btn.addEventListener("click", () => {
    const collapsed = grid.classList.toggle("features-collapsed");
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.textContent = collapsed ? btn.dataset.showMore : btn.dataset.showLess;
    if (collapsed) grid.scrollIntoView({ block: "start" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initReveal();
  initTypewriter();
  initCopyInstall();
  initFeaturesToggle();
});
