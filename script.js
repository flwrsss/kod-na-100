
/* КОД НА 100 — отправка заявок через Cloudflare Worker */
const WORKER_URL = "https://kod-na-100-leads.flower-t4klan.workers.dev";

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "✕" : "☰";
});

navLinks?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    if (menuToggle) menuToggle.textContent = "☰";
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const form = document.getElementById("lead-form");
const feedback = document.getElementById("form-feedback");
const examSelect = form?.querySelector('[name="exam"]');
const messageField = form?.querySelector('[name="message"]');

let selectedPackage = null;

/* Выбор направления в карточках ОГЭ и ЕГЭ */
document.querySelectorAll("[data-track]").forEach(link => {
  link.addEventListener("click", () => {
    const exam = link.dataset.track === "ОГЭ"
      ? "ОГЭ по информатике"
      : "ЕГЭ по информатике";

    if (examSelect) examSelect.value = exam;
  });
});

/* Добавляем кнопки выбора прямо в каждую строку тарифов */
const pricingStyle = document.createElement("style");
pricingStyle.textContent = `
  .price-table tbody tr { cursor: pointer; }
  .price-table tbody tr.package-selected {
    outline: 2px solid #c7f36b;
    outline-offset: -2px;
  }
  .package-pick {
    display: inline-block;
    margin-top: 6px;
    padding: 6px 10px;
    border: 1px solid #c7f36b;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .package-pick:hover {
    background: #c7f36b;
    color: #101112;
  }
`;
document.head.appendChild(pricingStyle);

function choosePackage(row, tableWrap) {
  const cells = row.querySelectorAll("td");
  if (cells.length < 4) return;

  const examTitle = tableWrap.querySelector("h3")?.textContent || "";
  const exam = examTitle.includes("ОГЭ")
    ? "ОГЭ по информатике"
    : "ЕГЭ по информатике";

  const course = cells[0].textContent.trim();
  const lessons = cells[1].textContent.trim();
  const price = cells[3].querySelector(".price-current")
    ?.textContent.trim() || cells[3].textContent.trim();

  selectedPackage = {
    exam,
    course,
    lessons,
    price
  };

  if (examSelect) examSelect.value = exam;

  document.querySelectorAll(".package-selected").forEach(el => {
    el.classList.remove("package-selected");
  });
  row.classList.add("package-selected");

  const button = form?.querySelector('button[type="submit"]');
  if (button) {
    button.innerHTML = "Отправить заявку · " + price + " ↗";
  }

  if (feedback) {
    feedback.textContent =
      `Выбран пакет: ${course}, ${lessons} занятий — ${price}. Заполни контакты для записи.`;
  }

  document.getElementById("signup")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

document.querySelectorAll(".price-table-wrap").forEach(tableWrap => {
  tableWrap.querySelectorAll(".price-table tbody tr").forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length < 4) return;

    const pickButton = document.createElement("button");
    pickButton.type = "button";
    pickButton.className = "package-pick";
    pickButton.textContent = "Выбрать пакет";

    cells[0].appendChild(document.createElement("br"));
    cells[0].appendChild(pickButton);

    pickButton.addEventListener("click", event => {
      event.stopPropagation();
      choosePackage(row, tableWrap);
    });

    row.addEventListener("click", () => {
      choosePackage(row, tableWrap);
    });
  });
});

/* Кнопки «Выбрать подготовку к ОГЭ/ЕГЭ» */
document.querySelectorAll(".price-table-button").forEach(link => {
  link.addEventListener("click", () => {
    const exam = link.dataset.exam;
    if (examSelect && exam) examSelect.value = exam;

    const tableWrap = link.closest(".price-table-wrap");
    const firstRow = tableWrap?.querySelector(".price-table tbody tr");

    if (firstRow && tableWrap) {
      choosePackage(firstRow, tableWrap);
    }
  });
});

/* Отправка заявки */
form?.addEventListener("submit", async event => {
  event.preventDefault();

  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);

  const name = String(data.get("name") || "").trim();
  const exam = String(data.get("exam") || "").trim();
  const contactType = String(data.get("contactType") || "").trim();
  const contact = String(data.get("contact") || "").trim();
  const originalMessage = String(data.get("message") || "").trim();
  const website = String(data.get("website") || "").trim();

  if (website) return;

  if (!name || !exam || !contactType || !contact) {
    feedback.textContent = "Заполни имя, экзамен и контакт для связи.";
    return;
  }

  const packageDetails = selectedPackage
    ? `Выбранный пакет: ${selectedPackage.course}. ` +
      `Количество занятий: ${selectedPackage.lessons}. ` +
      `Стоимость: ${selectedPackage.price}.`
    : "Пакет занятий пока не выбран.";

  const lead = {
    name,
    exam,
    contactType,
    contact,
    message: [packageDetails, originalMessage]
      .filter(Boolean)
      .join("\nКомментарий ученика: "),
    website
  };

  if (!WORKER_URL) {
    feedback.textContent = "Не настроен адрес обработчика заявок.";
    return;
  }

  button.disabled = true;
  const originalText = button.innerHTML;
  button.textContent = "Отправляем…";
  feedback.textContent = "";

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Не удалось отправить заявку");
    }

    feedback.textContent =
      "Заявка отправлена! Мы свяжемся с тобой выбранным способом.";

    form.reset();
    selectedPackage = null;

    document.querySelectorAll(".package-selected").forEach(el => {
      el.classList.remove("package-selected");
    });

    button.innerHTML = originalText;
  } catch (error) {
    feedback.textContent =
      "Не получилось отправить заявку. Попробуй ещё раз чуть позже.";
  } finally {
    button.disabled = false;
  }
});
