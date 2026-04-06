const formEl = document.getElementById("quizForm");
const quizTitleEl = document.getElementById("quizTitle");
const quizDescriptionEl = document.getElementById("quizDescription");
const quizQuestionsEl = document.getElementById("quizQuestions");
const quizErrorEl = document.getElementById("quizError");

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

async function getHobbyRecommendation(answers, userID) {
  alert(answers)
  const response = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "answers": answers,
      "userID": userID, 
    }),
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
    // TODO - get user ID
    const userID = 1;
    const hobby = await getHobbyRecommendation(answers, userID);

    localStorage.setItem("userHobby", hobby);
    document.cookie = `userHobby=${encodeURIComponent(hobby)}; path=/; max-age=86400`;
    window.location.href = `recommendation.html?hobby=${encodeURIComponent(hobby)}`;
  } catch (err) {
    console.error(err);
    alert(err?.message || "Something went wrong.");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const quiz = await fetchQuiz();
    renderQuiz(quiz);
  } catch (err) {
    console.error("Quiz load error:", err);
    quizErrorEl.textContent = err?.message || "Failed to load quiz";
    quizErrorEl.style.display = "block";
  }
});
