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
  // backend uses POST handlers
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
  const minLabel = scale?.minLabel ?? "1";
  const maxLabel = scale?.maxLabel ?? String(max);

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
      <div class="scale-labels">
        <span>${escapeHtml(minLabel)}</span>
        <span>${escapeHtml(maxLabel)}</span>
      </div>
      <div class="options-container">${optionsHtml}</div>
    </div>
  `;
}

function renderQuiz(quiz) {
  quizTitleEl.textContent = quiz?.title || "Quiz";
  quizDescriptionEl.textContent = quiz?.description || "";

  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  if (!questions.length) throw new Error("Quiz has no questions");

  const scale = quiz?.scale || { min: 1, max: 5 };

  quizQuestionsEl.innerHTML = questions
    .map((q, idx) => renderScaleQuestion({ idx, question: q, scale }))
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

async function getHobbyReccomendation(answers) {
  const res = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Quiz API failed (${res.status})`);
  }

  const payload = await res.json(); // backend returns {"hobby": "[[x, \"hobby_name\"], [y, \"hobby_name\"]]"}. First hobby is the most likely
  alert(JSON.stringify(payload));
  return payload.hobby[0][1]; 
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const answers = getAnswersFromForm(formEl);
    const hobby = await getHobbyReccomendation(answers);

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
