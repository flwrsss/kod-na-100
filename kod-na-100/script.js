/*
  КОД НА 100 — настройка сайта.
  1) Впиши свой Telegram username без символа @ в TELEGRAM_USERNAME.
  2) Если пока нет Telegram, замени обработчик формы на свой способ связи.
*/
const TELEGRAM_USERNAME = "im_flowerz";

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "✕" : "☰";
});
navLinks?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
  if (menuToggle) menuToggle.textContent = "☰";
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

document.querySelectorAll("[data-track]").forEach(link => {
  link.addEventListener("click", () => {
    const select = document.querySelector('select[name="exam"]');
    if (select) {
      select.value = link.dataset.track === "ОГЭ" ? "ОГЭ по информатике" : "ЕГЭ по информатике";
    }
  });
});

document.getElementById("lead-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const exam = String(data.get("exam") || "").trim();
  const message = String(data.get("message") || "").trim();
  const text = `Здравствуйте! Хочу узнать о занятиях в школе «Код на 100».%0AИмя: ${encodeURIComponent(name)}%0AЭкзамен: ${encodeURIComponent(exam)}%0AТрудности: ${encodeURIComponent(message || "Пока не указаны")}`;
  const feedback = document.getElementById("form-feedback");
  if (!TELEGRAM_USERNAME || TELEGRAM_USERNAME === "YOUR_TELEGRAM_USERNAME") {
    feedback.textContent = "Сайт почти готов! В файле script.js укажи свой Telegram username вместо YOUR_TELEGRAM_USERNAME, чтобы заявки отправлялись тебе.";
    return;
  }
  window.open(`https://t.me/${TELEGRAM_USERNAME}?text=${text}`, "_blank", "noopener,noreferrer");
});