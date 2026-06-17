const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwZfgMkiMSk3Z3PWijQxDrwW1dWJ5BZ0INZZ_fPD2Q_5826J8XDtwK8VLwv2u__dRjFrA/exec";

const routeCopy = {
  car: {
    title: "Маршрут для машины",
    text: "Просто тыкайте на кнопку ниже, включайте русский рэп и катитесь по построенному маршруту.",
    link: "https://yandex.ru/maps/-/CTAEbO8a",
    linkText: "Открыть в Яндекс Картах",
  },
  walk: {
    title: "Без машины",
    text: `От Дыбенко до озера идут маршрутки и автобусы <a href="https://wikiroutes.info/spb?routes=742" target="_blank" rel="noopener noreferrer">№ 469</a>, <a href="https://wikiroutes.info/spb?routes=5671" target="_blank" rel="noopener noreferrer">511</a>, <a href="https://wikiroutes.info/spb?routes=785" target="_blank" rel="noopener noreferrer">565</a> и <a href="https://wikiroutes.info/spb?routes=787" target="_blank" rel="noopener noreferrer">579</a>. Выйти нужно будет остановке «26 км Мурманского шоссе», около лукойловской заправки. А дальше пешком или на такси (если повезет его вызвать там).`,
  },
};

const form = document.querySelector("#survey-form");
const statusNode = document.querySelector("#form-status");
const routeText = document.querySelector("#route-text");
const routeButtons = document.querySelectorAll("[data-route]");
const snapSections = Array.from(document.querySelectorAll("main > section"));
const snapLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigationEntry = performance.getEntriesByType("navigation")[0];
const isPageReload = navigationEntry && navigationEntry.type === "reload";
const sectionScrollQuery = window.matchMedia("(min-width: 981px)");

let isSectionScrolling = false;
let scrollUnlockTimer = 0;
let wheelDelta = 0;
let wheelResetTimer = 0;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function instantScrollTo(top) {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  window.scrollTo(0, top);
  root.style.scrollBehavior = previousBehavior;
}

function nearestSectionIndex() {
  let closestIndex = 0;
  let closestDistance = Infinity;

  snapSections.forEach((section, index) => {
    const distance = Math.abs(section.offsetTop - window.scrollY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function unlockSectionScroll() {
  isSectionScrolling = false;
}

function isSectionScrollEnabled() {
  return sectionScrollQuery.matches;
}

function scrollToSection(index, behavior = "smooth") {
  const section = snapSections[Math.max(0, Math.min(index, snapSections.length - 1))];

  if (!section) {
    return;
  }

  if (behavior === "auto") {
    instantScrollTo(section.offsetTop);
    unlockSectionScroll();
    return;
  }

  isSectionScrolling = true;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  window.clearTimeout(scrollUnlockTimer);
  scrollUnlockTimer = window.setTimeout(unlockSectionScroll, 700);
}

function closeMenu() {
  siteHeader?.classList.remove("is-menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Открыть меню");
}

menuToggle?.addEventListener("click", () => {
  if (!siteHeader) {
    return;
  }

  const isOpen = siteHeader.classList.toggle("is-menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
});

document.addEventListener("click", (event) => {
  if (!siteHeader?.classList.contains("is-menu-open") || siteHeader.contains(event.target)) {
    return;
  }

  closeMenu();
});

snapLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();
    closeMenu();

    if (isSectionScrollEnabled()) {
      scrollToSection(snapSections.indexOf(target));
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

window.addEventListener(
  "wheel",
  (event) => {
    const isInsideInput = event.target.closest("input, textarea, select");

    if (!isSectionScrollEnabled() || isInsideInput || event.ctrlKey || Math.abs(event.deltaY) < 12) {
      return;
    }

    event.preventDefault();

    if (isSectionScrolling) {
      return;
    }

    wheelDelta += event.deltaY;
    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => {
      wheelDelta = 0;
    }, 120);

    if (Math.abs(wheelDelta) < 18) {
      return;
    }

    const direction = wheelDelta > 0 ? 1 : -1;
    wheelDelta = 0;
    scrollToSection(nearestSectionIndex() + direction);
  },
  { passive: false }
);

document.addEventListener("scrollend", unlockSectionScroll);

window.addEventListener("load", () => {
  if (!isSectionScrollEnabled()) {
    return;
  }

  const shouldStartFromTop = !location.hash || isPageReload;

  if (shouldStartFromTop) {
    if (location.hash && isPageReload) {
      history.replaceState(null, "", location.pathname + location.search);
    }

    window.setTimeout(() => scrollToSection(0, "auto"), 0);
    return;
  }

  const target = document.querySelector(location.hash);
  const index = snapSections.indexOf(target);

  if (index >= 0) {
    window.setTimeout(() => scrollToSection(index, "auto"), 0);
  }
});

window.addEventListener("pageshow", () => {
  if (!isSectionScrollEnabled()) {
    return;
  }

  if (!location.hash || isPageReload) {
    window.setTimeout(() => scrollToSection(0, "auto"), 0);
  }
});

routeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    routeButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });

    const copy = routeCopy[button.dataset.route];
    routeText.innerHTML = `
      <h3>${copy.title}</h3>
      <p>${copy.text}</p>
      ${
        copy.link
          ? `<a class="route-map-link" href="${copy.link}" target="_blank" rel="noopener noreferrer">${copy.linkText}</a>`
          : ""
      }
    `;
  });
});

function checkedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(
    (input) => input.value
  );
}

function saveLocal(payload) {
  const saved = JSON.parse(localStorage.getItem("birthdaySurveyDrafts") || "[]");
  saved.push(payload);
  localStorage.setItem("birthdaySurveyDrafts", JSON.stringify(saved));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  const payload = {
    createdAt: new Date().toISOString(),
    meat: checkedValues("meat"),
    drinks: checkedValues("drink"),
    comment: String(formData.get("comment") || "").trim(),
    page: location.href,
  };

  if (!payload.meat.length || !payload.drinks.length) {
    statusNode.textContent = "Выбери хотя бы один вариант еды и напитков.";
    return;
  }

  submitButton.disabled = true;
  statusNode.textContent = "Отправляю...";

  try {
    if (GOOGLE_SCRIPT_URL) {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });
      statusNode.textContent = "Готово, ответ улетел в таблицу.";
    } else {
      saveLocal(payload);
      statusNode.textContent = "Пока сохранила локально. Вставим URL Apps Script, и ответы полетят в Google Sheets.";
    }

    form.reset();
  } catch (error) {
    saveLocal(payload);
    statusNode.textContent = "Не получилось отправить, но ответ сохранен в браузере.";
  } finally {
    submitButton.disabled = false;
  }
});
