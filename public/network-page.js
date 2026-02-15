const searchInput = document.getElementById("network-search-input");
const resultsCount = document.getElementById("results-count");
const cardsGrid = document.getElementById("cards-grid");
const hobbyFilterList = document.getElementById("hobby-filter-list");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toDisplayName(username) {
  return String(username)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function avatarUrl(username) {
  const initial = String(username || "?").charAt(0).toUpperCase() || "?";
  return `https://via.placeholder.com/80x80.png?text=${encodeURIComponent(initial)}`;
}

function debounce(fn, waitMs) {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), waitMs);
  };
}

function ensureCheckboxValues() {
  if (!hobbyFilterList) { return; }
  const inputs = hobbyFilterList.querySelectorAll('input[type="checkbox"]');
  inputs.forEach((input) => {
    if (input.value && input.value.trim().length > 0) { return; }
    const label = input.closest("label");
    const textNode = label ? label.querySelector("span") : null;
    input.value = textNode ? textNode.textContent.trim() : "";
  });
}

function renderHobbyFilterList(hobbies) {
  if (!hobbyFilterList || !Array.isArray(hobbies)) { return; }
  const selected = new Set(getSelectedHobbies());
  hobbyFilterList.innerHTML = hobbies.map((hobby) => `
    <li>
      <label>
        <input type="checkbox" value="${escapeHtml(hobby)}" ${selected.has(hobby) ? "checked" : ""} />
        <span>${escapeHtml(hobby)}</span>
      </label>
    </li>
  `).join("");
}

function getSelectedHobbies() {
  if (!hobbyFilterList) { return []; }
  return [...hobbyFilterList.querySelectorAll('input[type="checkbox"]:checked')]
    .map((input) => input.value.trim())
    .filter((value) => value.length > 0);
}

function updateResultsCount(count) {
  if (!resultsCount) { return; }
  const numericCount = Number.isFinite(count) ? count : 0;
  const noun = numericCount === 1 ? "person" : "people";
  resultsCount.textContent = `${numericCount} ${noun} found`;
}

function renderEmptyState(message) {
  if (!cardsGrid) { return; }
  cardsGrid.innerHTML = `
    <article class="profile-card">
      <p class="bio">${escapeHtml(message)}</p>
    </article>
  `;
}

function renderAccounts(accounts) {
  if (!cardsGrid) { return; }
  if (!Array.isArray(accounts) || accounts.length === 0) {
    renderEmptyState("No matching accounts found.");
    updateResultsCount(0);
    return;
  }

  cardsGrid.innerHTML = accounts.map((account) => {
    const username = account.username || "unknown";
    const description = account.description || "";
    const hobbies = Array.isArray(account.hobbies) ? account.hobbies : [];
    const tags = hobbies.length > 0
      ? hobbies.map((hobby) => `<span class="tag">${escapeHtml(hobby)}</span>`).join("")
      : `<span class="tag">No hobbies listed</span>`;

    return `
      <article class="profile-card">
        <header class="profile-header">
          <div class="avatar">
            <img src="${avatarUrl(username)}" alt="${escapeHtml(toDisplayName(username))}" />
          </div>
          <div class="profile-main">
            <div class="profile-topline">
              <h3>${escapeHtml(toDisplayName(username))}</h3>
              <span class="location">@${escapeHtml(username)}</span>
            </div>
          </div>
        </header>
        <p class="bio">${escapeHtml(description)}</p>
        <div class="tags">${tags}</div>
        <button class="connect-btn" data-name="${escapeHtml(username)}">
          <span class="connect-icon">&#128101;</span>
          Connect
        </button>
      </article>
    `;
  }).join("");

  updateResultsCount(accounts.length);
}

function getAccountsUrl() {
  const params = new URLSearchParams();
  const searchTerm = searchInput ? searchInput.value.trim() : "";
  if (searchTerm.length > 0) {
    params.set("search", searchTerm);
  }

  getSelectedHobbies().forEach((hobby) => {
    params.append("hobbies", hobby);
  });

  const query = params.toString();
  return query.length > 0 ? `/api/network/accounts?${query}` : "/api/network/accounts";
}

async function fetchAccounts() {
  const response = await fetch(getAccountsUrl());
  if (!response.ok) {
    throw new Error(`Account query failed (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload.accounts) ? payload.accounts : [];
}

async function loadAccounts() {
  try {
    const accounts = await fetchAccounts();
    renderAccounts(accounts);
  } catch (err) {
    console.error(err);
    renderEmptyState("Could not load accounts. Please refresh and try again.");
    updateResultsCount(0);
  }
}

async function hydrateHobbiesFromApi() {
  try {
    const response = await fetch("/api/network/hobbies");
    if (!response.ok) { return; }
    const payload = await response.json();
    if (!Array.isArray(payload.hobbies)) { return; }
    renderHobbyFilterList(payload.hobbies);
  } catch (_) {
    // Keep static sidebar entries as fallback.
  }
}

function attachEventHandlers() {
  if (searchInput) {
    searchInput.addEventListener("input", debounce(loadAccounts, 250));
  }

  if (hobbyFilterList) {
    hobbyFilterList.addEventListener("change", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.type === "checkbox") {
        loadAccounts();
      }
    });
  }

  if (cardsGrid) {
    cardsGrid.addEventListener("click", (event) => {
      const target = event.target;
      const button = target instanceof Element ? target.closest(".connect-btn") : null;
      if (!button) { return; }

      const name = button.getAttribute("data-name") || "Unknown";
      window.location.href = `chat.html?name=${encodeURIComponent(name)}`;
    });
  }
}

(async function initNetworkPage() {
  ensureCheckboxValues();
  attachEventHandlers();
  await hydrateHobbiesFromApi();
  ensureCheckboxValues();
  await loadAccounts();
})();
