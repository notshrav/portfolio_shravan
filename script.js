const githubUser = "notshrav";
const projectGrid = document.getElementById("github-projects");
const projectCarousel = document.getElementById("repo-carousel");
const repoPosition = document.getElementById("repo-position");
let projectCards = Array.from(projectGrid.querySelectorAll("[data-project-slide]"));

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return "UPDATED " + new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date).toUpperCase();
}

function renderRepo(repo, index) {
  const language = repo.language || "OPEN SOURCE";
  const description = repo.description || "Open the repository to see what it's about.";
  const stars = repo.stargazers_count ? "★ " + repo.stargazers_count : "";
  return '<a class="repo-card github-repo-card" data-project-slide href="' + escapeHtml(repo.html_url) + '" target="_blank" rel="noreferrer" aria-label="' + escapeHtml(repo.name) + ' repository on GitHub">' +
    '<div class="repo-card-top"><span>PROJECT / ' + String(index).padStart(2, "0") + '</span><span>' + escapeHtml(language).toUpperCase() + '</span></div>' +
    '<div class="repo-card-content"><span class="repo-kicker">' + escapeHtml(repo.owner.login) + ' / GITHUB</span><h3>' + escapeHtml(repo.name.replace(/[-_]/g, " ")) + '<em>.</em></h3><p>' + escapeHtml(description) + '</p></div>' +
    '<div class="repo-card-bottom"><span>' + formatDate(repo.updated_at) + (stars ? ' · ' + stars : '') + '</span><span>VIEW REPOSITORY ↗</span></div>' +
    '<span class="repo-card-number" aria-hidden="true">' + String(index).padStart(2, "0") + '</span></a>';
}

function cardScrollLeft(card) {
  return projectCarousel.scrollLeft + card.getBoundingClientRect().left - projectCarousel.getBoundingClientRect().left;
}

function closestProjectIndex(cards) {
  if (cards.length < 2) return 0;
  const firstCard = cardScrollLeft(cards[0]);
  const cardStep = cardScrollLeft(cards[1]) - firstCard;
  if (cardStep <= 0) return 0;
  return Math.max(0, Math.min(cards.length - 1, Math.round((projectCarousel.scrollLeft - firstCard) / cardStep)));
}

function updateRepoPosition() {
  if (!projectCards.length) {
    repoPosition.textContent = "00 / 00";
    return;
  }
  const closestIndex = closestProjectIndex(projectCards);
  const position = String(closestIndex + 1).padStart(2, "0") + " / " + String(projectCards.length).padStart(2, "0");
  if (repoPosition.textContent !== position) repoPosition.textContent = position;
}

async function loadGitHubProjects() {
  try {
    const repos = [];
    let page = 1;

    while (true) {
      const response = await fetch("https://api.github.com/users/" + githubUser + "/repos?type=owner&sort=updated&per_page=100&page=" + page, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error("GitHub returned " + response.status);
      const batch = await response.json();
      repos.push(...batch);
      if (batch.length < 100) break;
      page += 1;
    }

    const visible = repos.filter(repo => {
      const name = repo.name.toLowerCase();
      const normalizedName = name.replace(/[^a-z0-9]/g, "");
      const isVitLostAndFound = normalizedName.includes("vit") && normalizedName.includes("lost") && normalizedName.includes("found");
      return name !== "justonething" && !name.includes("codeforces") && !name.includes("portfolio") && !isVitLostAndFound;
    });
    const loadingCard = projectGrid.querySelector(".repo-loading");
    if (loadingCard) loadingCard.remove();

    if (visible.length) {
      projectGrid.insertAdjacentHTML("beforeend", visible.map((repo, index) => renderRepo(repo, index + 2)).join(""));
      projectCards = Array.from(projectGrid.querySelectorAll("[data-project-slide]"));
    }
    updateRepoPosition();
  } catch (error) {
    const loadingCard = projectGrid.querySelector(".repo-loading");
    if (loadingCard) loadingCard.remove();
    updateRepoPosition();
  }
}

document.querySelectorAll(".portrait-decor").forEach(decor => {
  decor.setAttribute("draggable", "false");
  decor.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    event.preventDefault();

    const parent = decor.parentElement;
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = decor instanceof HTMLElement ? decor.offsetLeft : parseFloat(getComputedStyle(decor).left);
    const startTop = decor instanceof HTMLElement ? decor.offsetTop : parseFloat(getComputedStyle(decor).top);
    const frozenTranslate = getComputedStyle(decor).translate;

    decor.style.left = `${startLeft}px`;
    decor.style.top = `${startTop}px`;
    decor.style.right = "auto";
    decor.style.bottom = "auto";
    if (frozenTranslate !== "none") decor.style.translate = frozenTranslate;
    decor.classList.remove("is-placed");
    decor.classList.add("is-dragging");
    decor.setPointerCapture(event.pointerId);

    const parentTransform = getComputedStyle(parent).transform;
    const inverseTransform = new DOMMatrixReadOnly(parentTransform === "none" ? undefined : parentTransform).inverse();
    const move = moveEvent => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const localX = inverseTransform.a * dx + inverseTransform.c * dy;
      const localY = inverseTransform.b * dx + inverseTransform.d * dy;
      decor.style.left = `${startLeft + localX}px`;
      decor.style.top = `${startTop + localY}px`;
    };
    const finish = finishEvent => {
      decor.classList.remove("is-dragging");
      decor.classList.add("is-placed");
      if (decor.hasPointerCapture(finishEvent.pointerId)) decor.releasePointerCapture(finishEvent.pointerId);
      decor.removeEventListener("pointermove", move);
      decor.removeEventListener("pointerup", finish);
      decor.removeEventListener("pointercancel", finish);
    };

    decor.addEventListener("pointermove", move);
    decor.addEventListener("pointerup", finish);
    decor.addEventListener("pointercancel", finish);
  });
});
loadGitHubProjects();
let repoPositionFrame = null;
projectCarousel.addEventListener("scroll", () => {
  if (repoPositionFrame !== null) return;
  repoPositionFrame = window.requestAnimationFrame(() => {
    repoPositionFrame = null;
    updateRepoPosition();
  });
}, { passive: true });

let wheelLocked = false;
let wheelLockTimer;
projectCarousel.addEventListener("wheel", event => {
  if (!projectCards.length) return;

  const wheelDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (!wheelDelta) return;

  const maxScroll = projectCarousel.scrollWidth - projectCarousel.clientWidth;
  const movingRight = wheelDelta > 0;
  const currentIndex = closestProjectIndex(projectCards);
  const lastIndex = projectCards.length - 1;
  const lastCardSnap = Math.min(maxScroll, cardScrollLeft(projectCards[lastIndex]));
  const atFirstRepository = currentIndex === 0 && projectCarousel.scrollLeft <= 2;
  const atLastRepository = currentIndex === lastIndex && projectCarousel.scrollLeft >= lastCardSnap - 3;

  if ((movingRight && atLastRepository) || (!movingRight && atFirstRepository)) {
    event.preventDefault();
    const pageDelta = event.deltaMode === 1 ? wheelDelta * 16 : event.deltaMode === 2 ? wheelDelta * window.innerHeight : wheelDelta;
    window.scrollBy({ top: pageDelta, left: 0, behavior: "instant" });
    return;
  }

  event.preventDefault();
  if (wheelLocked) return;

  const targetIndex = Math.max(0, Math.min(projectCards.length - 1, currentIndex + (movingRight ? 1 : -1)));
  if (targetIndex === currentIndex) {
    const boundaryTarget = movingRight ? lastCardSnap : 0;
    if (Math.abs(projectCarousel.scrollLeft - boundaryTarget) > 3) {
      wheelLocked = true;
      projectCarousel.scrollTo({ left: boundaryTarget, behavior: "smooth" });
      window.clearTimeout(wheelLockTimer);
      wheelLockTimer = window.setTimeout(() => { wheelLocked = false; }, 650);
    } else {
      const pageDelta = event.deltaMode === 1 ? wheelDelta * 16 : event.deltaMode === 2 ? wheelDelta * window.innerHeight : wheelDelta;
      window.scrollBy({ top: pageDelta, left: 0, behavior: "instant" });
    }
    return;
  }

  wheelLocked = true;
  projectCarousel.scrollTo({ left: cardScrollLeft(projectCards[targetIndex]), behavior: "smooth" });
  window.clearTimeout(wheelLockTimer);
  wheelLockTimer = window.setTimeout(() => { wheelLocked = false; }, 650);
}, { passive: false });

const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".nav");
menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  nav.classList.toggle("is-open", !isOpen);
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
}));

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => revealObserver.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("is-visible"));
}
