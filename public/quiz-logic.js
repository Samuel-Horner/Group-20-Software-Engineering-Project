const formEl = document.getElementById("quizForm");
const quizTitleEl = document.getElementById("quizTitle");
const quizDescriptionEl = document.getElementById("quizDescription");
const quizQuestionsEl = document.getElementById("quizQuestions");
const quizErrorEl = document.getElementById("quizError");

// Hobby chip selector state
let selectedHobbies = [];
let availableHobbies = [];


function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchQuiz() {
  const endpoints = ["/getQuiz", "/getquiz"];
  let lastErr = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        lastErr = new Error(`Failed to load quiz (${res.status})`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("Failed to load quiz");
}

function renderScaleQuestion({ idx, question, scale }) {
  const qId = `q${idx}`;
  const min = Number(scale?.min ?? 1);
  const max = Number(scale?.max ?? 5);
  const minLabel = scale?.minLabel ?? "Not at all";
  const maxLabel = scale?.maxLabel ?? "Very much";

  let optionsHtml = "";
  for (let v = min; v <= max; v += 1) {
    const inputId = `${qId}_${v}`;
    optionsHtml += `
      <label class="option-label" for="${inputId}">
        <input type="radio" id="${inputId}" name="${qId}" value="${v}" required>
        <span>${v}</span>
      </label>
    `;
  }

  return `
    <div class="question-box">
      <h2>${escapeHtml(question.text ?? "")}</h2>
      <div class="scale-row">
        <span class="scale-label">${escapeHtml(minLabel)}</span>
        <div class="options-container">${optionsHtml}</div>
        <span class="scale-label">${escapeHtml(maxLabel)}</span>
      </div>
    </div>
  `;
}

function renderChoicesQuestion({ idx, question }) {
  const qId = `q${idx}`;
  const options = Array.isArray(question?.options) ? question.options : [];

  if (!options.length) {
    throw new Error("Question is missing options.");
  }

  const optionsHtml = options
    .map((optionText, optionIdx) => {
      const value = optionIdx + 1;
      const inputId = `${qId}_${value}`;
      return `
        <label class="option-label" for="${inputId}">
          <input type="radio" id="${inputId}" name="${qId}" value="${value}" required>
          <span>${escapeHtml(optionText)}</span>
        </label>
      `;
    })
    .join("");

  return `
    <div class="question-box">
      <h2>${escapeHtml(question.text ?? "")}</h2>
      <div class="options-container">${optionsHtml}</div>
    </div>
  `;
}

function renderQuestion({ idx, question, scale }) {
  const isChoiceQuestion = Array.isArray(question?.options) && question.options.length > 0;
  if (isChoiceQuestion) {
    return renderChoicesQuestion({ idx, question });
  }
  return renderScaleQuestion({ idx, question, scale });
}

function renderQuiz(quiz) {
  quizTitleEl.textContent = quiz?.title || "Quiz";
  quizDescriptionEl.textContent = quiz?.description || "";

  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  if (!questions.length) {
    throw new Error("Quiz has no questions");
  }

  const scale = quiz?.scale || { min: 1, max: 5, minLabel: "Not at all", maxLabel: "Very much" };

  quizQuestionsEl.innerHTML = questions
    .map((q, idx) => renderQuestion({ idx, question: q, scale }))
    .join("");
}

function getAnswersFromForm(form) {
  const formData = new FormData(form);
  const answers = [];

  for (const value of formData.values()) {
    const parsed = Number.parseInt(String(value).trim(), 10);
    if (Number.isNaN(parsed)) {
      throw new Error("Please select an answer for every question.");
    }
    answers.push(parsed);
  }

  return answers;
}

function serializeRecommendation(recommendation) {
  if (typeof recommendation === "string") {
    return recommendation;
  }
  return JSON.stringify(recommendation);
}

async function getHobbyRecommendation(answers, maskedHobbies) {
  const response = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers, maskedHobbies }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Quiz API failed (${response.status})`);
  }

  const payload = await response.json();
  return payload.hobby;
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const answers = getAnswersFromForm(formEl);
    const maskedHobbies = [...selectedHobbies];
    const hobby = await getHobbyRecommendation(answers, maskedHobbies);
    const serializedHobby = serializeRecommendation(hobby);
    const encodedHobby = encodeURIComponent(serializedHobby);

    localStorage.setItem("userHobby", serializedHobby);
    document.cookie = `userHobby=${encodedHobby}; path=/; max-age=86400`;
    window.location.href = `recommendation.html?hobby=${encodedHobby}`;
  } catch (err) {
    console.error(err);
    alert("Invalid input for recommendation page.");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const quiz = await fetchQuiz();
    renderQuiz(quiz);
    await setupHobbySelector();
  } catch (err) {
    console.error("Quiz load error:", err);
    quizErrorEl.textContent = err?.message || "Failed to load quiz";
    quizErrorEl.style.display = "block";
  }
});

async function fetchHobbies() {
  try {
    const res = await fetch("/gethobbies", { method: "POST" });
    return await res.json();
  } catch (err) {
    console.error("Hobby load error:", err);
    return [];
  }
}

function capitalizeHobby(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderChips() {
  const chipsContainer = document.getElementById("hobbyChips");
  chipsContainer.innerHTML = selectedHobbies.map(h => `
    <span class="hobby-chip">
      ${escapeHtml(capitalizeHobby(h))}
      <button type="button" class="hobby-chip-remove" data-hobby="${escapeHtml(h)}">×</button>
    </span>
  `).join("");
}

function renderDropdownOptions() {
  const dropdownList = document.getElementById("hobbyDropdownList");
  const remaining = availableHobbies.filter(h => !selectedHobbies.includes(h));
  if (!remaining.length) {
    dropdownList.innerHTML = `<li class="hobby-option-empty">No more hobbies to add</li>`;
  } else {
    dropdownList.innerHTML = remaining.map(h =>
      `<li class="hobby-option" data-hobby="${escapeHtml(h)}">${escapeHtml(capitalizeHobby(h))}</li>`
    ).join("");
  }
}

function initHobbySelector() {
  const button = document.getElementById("hobbyDropdownButton");
  const dropdownList = document.getElementById("hobbyDropdownList");
  const chipsContainer = document.getElementById("hobbyChips");

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = dropdownList.classList.contains("hidden");
    if (isHidden) {
      renderDropdownOptions();
      dropdownList.classList.remove("hidden");
      button.classList.add("active");
    } else {
      dropdownList.classList.add("hidden");
      button.classList.remove("active");
    }
  });

  dropdownList.addEventListener("click", (e) => {
    const option = e.target.closest(".hobby-option");
    if (!option || !option.dataset.hobby) return;
    selectedHobbies.push(option.dataset.hobby);
    renderChips();
    renderDropdownOptions();
    dropdownList.classList.add("hidden");
    button.classList.remove("active");
  });

  chipsContainer.addEventListener("click", (e) => {
    const removeButton = e.target.closest(".hobby-chip-remove");
    if (!removeButton || !removeButton.dataset.hobby) return;
    selectedHobbies = selectedHobbies.filter(h => h !== removeButton.dataset.hobby);
    renderChips();
  });

  document.addEventListener("click", (e) => {
    if (!button.contains(e.target) && !dropdownList.contains(e.target)) {
      dropdownList.classList.add("hidden");
      button.classList.remove("active");
    }
  });
}

async function setupHobbySelector() {
  availableHobbies = await fetchHobbies();
  initHobbySelector();
}
