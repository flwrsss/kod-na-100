/* КОД НА 100 — отправка заявок через бесплатный Cloudflare Worker.
   После публикации Worker вставь его URL в WORKER_URL ниже.
   Не размещай токен Telegram-бота в этом файле: он хранится только в Cloudflare. */
const WORKER_URL = "https://kod-na-100-leads.flower-t4klan.workers.dev";

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
    if (select) select.value = link.dataset.track === "ОГЭ" ? "ОГЭ по информатике" : "ЕГЭ по информатике";
  });
});

const form = document.getElementById("lead-form");
form?.addEventListener("submit", async event => {
  event.preventDefault();
  const feedback = document.getElementById("form-feedback");
  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const lead = {
    name: String(data.get("name") || "").trim(),
    exam: String(data.get("exam") || "").trim(),
    contactType: String(data.get("contactType") || "").trim(),
    contact: String(data.get("contact") || "").trim(),
    message: String(data.get("message") || "").trim(),
    website: String(data.get("website") || "").trim()
  };

  if (!WORKER_URL || WORKER_URL === "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE") {
    feedback.textContent = "Форма почти готова. Нужно завершить настройку бесплатного обработчика заявок — смотри инструкцию в папке cloudflare-worker.";
    return;
  }

  button.disabled = true;
  button.dataset.originalText = button.innerHTML;
  button.textContent = "Отправляем…";
  feedback.textContent = "";
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "Не удалось отправить заявку");
    feedback.textContent = "Заявка отправлена! Мы свяжемся с тобой выбранным способом.";
    form.reset();
  } catch (error) {
    feedback.textContent = "Не получилось отправить заявку. Попробуй ещё раз чуть позже или напиши нам через контакты школы.";
  } finally {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || 'Отправить заявку <span>↗</span>';
  }
});
