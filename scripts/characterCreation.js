import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import leoProfanity from "./vendor/leo-profanity.js";

const RESERVED = ["admin", "moderator", "gm", "system", "mythborn"];

const CLASS_DATA = {
  warrior: {
    blurb: "A master of brute force and endurance. Slow to fall, devastating up close.",
    stats: { strength: 33, agility: 16, intelligence: 12, wisdom: 12, constitution: 32 }
  },
  rogue: {
    blurb: "Fast, precise, and deadly. Strikes hard and vanishes before you can hit back.",
    stats: { strength: 22, agility: 33, intelligence: 16, wisdom: 14, constitution: 20 }
  },
  mage: {
    blurb: "Arcane power at a cost. Fragile but capable of immense magical destruction.",
    stats: { strength: 12, agility: 18, intelligence: 33, wisdom: 22, constitution: 20 }
  },
  cleric: {
    blurb: "Faith made manifest. Commands divine magic and bends fate in their favour.",
    stats: { strength: 16, agility: 16, intelligence: 22, wisdom: 33, constitution: 18 }
  }
};

const state = {
  user: null,
  onSuccess: null,
  container: null,
  username: "",
  usernameStatus: "idle",
  selectedClass: null,
  selectedAvatar: null
};

let debounceTimer = null;
let redirectTimer = null;

export function showCharacterCreation(user, onSuccess) {
  Object.assign(state, {
    user,
    onSuccess,
    username: "",
    usernameStatus: "idle",
    selectedClass: null,
    selectedAvatar: null,
    container: document.getElementById("character-creation")
  });
  renderScreen1();
}

// ── Screen 1 ──────────────────────────────────────────────────────────────────

function renderScreen1() {
  clearTimeout(redirectTimer);

  state.container.innerHTML = `
    <div class="cc-screen">
      <h2>Create Your Character</h2>

      <div class="cc-section">
        <label for="cc-username">Username</label>
        <div class="cc-username-row">
          <input type="text" id="cc-username" maxlength="20" placeholder="3–20 characters" autocomplete="off" />
          <span id="cc-username-status" class="cc-status cc-status--${state.usernameStatus}">
            ${statusText(state.usernameStatus)}
          </span>
        </div>
      </div>

      <div class="cc-section">
        <label>Choose a Class</label>
        <div class="cc-class-grid">
          ${Object.entries(CLASS_DATA).map(([cls, d]) => `
            <div class="cc-class-card${state.selectedClass === cls ? " cc-selected" : ""}" data-class="${cls}">
              <div class="cc-class-art cc-art--${cls}"></div>
              <h3>${cap(cls)}</h3>
              <p>${d.blurb}</p>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="cc-nav cc-nav--right">
        <button id="cc-next-1" class="cc-btn" disabled>Next</button>
      </div>
    </div>
  `;

  const input = document.getElementById("cc-username");
  input.value = state.username;
  input.addEventListener("input", onUsernameInput);

  document.querySelectorAll(".cc-class-card").forEach(card => {
    card.addEventListener("click", () => onClassSelect(card.dataset.class));
  });

  document.getElementById("cc-next-1").addEventListener("click", renderScreen2);
  updateNext1();
}

function onUsernameInput(e) {
  const val = e.target.value.trim();
  state.username = val;
  clearTimeout(debounceTimer);

  if (!val) { return setStatus("idle"); }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) { return setStatus("invalid"); }
  if (RESERVED.includes(val.toLowerCase())) { return setStatus("invalid"); }
  if (leoProfanity.check(val)) { return setStatus("invalid"); }

  setStatus("checking");
  debounceTimer = setTimeout(() => checkUsername(val), 500);
}

async function checkUsername(username) {
  try {
    const snap = await getDoc(doc(db, "usernames", username.toLowerCase()));
    if (state.username !== username) return;
    setStatus(snap.exists() ? "taken" : "available");
  } catch {
    setStatus("idle");
  }
}

function setStatus(status) {
  state.usernameStatus = status;
  const el = document.getElementById("cc-username-status");
  if (el) {
    el.textContent = statusText(status);
    el.className = `cc-status cc-status--${status}`;
  }
  updateNext1();
}

function statusText(s) {
  return {
    idle: "",
    checking: "Checking…",
    available: "Available",
    taken: "Already taken",
    invalid: "Invalid"
  }[s] ?? "";
}

function onClassSelect(cls) {
  state.selectedClass = cls;
  document.querySelectorAll(".cc-class-card").forEach(c => {
    c.classList.toggle("cc-selected", c.dataset.class === cls);
  });
  updateNext1();
}

function updateNext1() {
  const btn = document.getElementById("cc-next-1");
  if (btn) btn.disabled = !(state.usernameStatus === "available" && state.selectedClass);
}

// ── Screen 2 ──────────────────────────────────────────────────────────────────

function renderScreen2() {
  clearTimeout(redirectTimer);
  const cls = state.selectedClass;
  const avatars = Array.from({ length: 10 }, (_, i) => `${cls}_${String(i + 1).padStart(2, "0")}`);

  state.container.innerHTML = `
    <div class="cc-screen">
      <h2>Choose Your Avatar</h2>
      <div class="cc-avatar-grid">
        ${avatars.map(id => `
          <div class="cc-avatar-tile${state.selectedAvatar === id ? " cc-selected" : ""}" data-avatar="${id}">
            <div class="cc-avatar-art cc-art--${cls}"></div>
            <span>${cap(cls)} ${id.slice(-2)}</span>
          </div>
        `).join("")}
      </div>
      <div class="cc-nav">
        <button id="cc-back-2" class="cc-btn cc-btn--ghost">Back</button>
        <button id="cc-next-2" class="cc-btn" ${state.selectedAvatar ? "" : "disabled"}>Next</button>
      </div>
    </div>
  `;

  document.querySelectorAll(".cc-avatar-tile").forEach(tile => {
    tile.addEventListener("click", () => {
      state.selectedAvatar = tile.dataset.avatar;
      document.querySelectorAll(".cc-avatar-tile").forEach(t => t.classList.toggle("cc-selected", t === tile));
      document.getElementById("cc-next-2").disabled = false;
    });
  });

  document.getElementById("cc-back-2").addEventListener("click", renderScreen1);
  document.getElementById("cc-next-2").addEventListener("click", renderScreen3);
}

// ── Screen 3 ──────────────────────────────────────────────────────────────────

function renderScreen3() {
  clearTimeout(redirectTimer);

  state.container.innerHTML = `
    <div class="cc-screen">
      <h2>Confirm Your Character</h2>
      <div class="cc-summary">
        <div class="cc-summary-avatar cc-art--${state.selectedClass}"></div>
        <dl class="cc-summary-details">
          <dt>Username</dt><dd>${state.username}</dd>
          <dt>Class</dt><dd>${cap(state.selectedClass)}</dd>
          <dt>Avatar</dt><dd>${state.selectedAvatar}</dd>
        </dl>
      </div>
      <div id="cc-error" class="cc-error" style="display:none;"></div>
      <div class="cc-nav">
        <button id="cc-back-3" class="cc-btn cc-btn--ghost">Back</button>
        <button id="cc-confirm" class="cc-btn">Confirm</button>
      </div>
    </div>
  `;

  document.getElementById("cc-back-3").addEventListener("click", renderScreen2);
  document.getElementById("cc-confirm").addEventListener("click", handleConfirm);
}

async function handleConfirm() {
  const confirmBtn = document.getElementById("cc-confirm");
  const backBtn = document.getElementById("cc-back-3");
  const errorEl = document.getElementById("cc-error");

  confirmBtn.disabled = true;
  backBtn.disabled = true;
  confirmBtn.textContent = "Creating…";
  errorEl.style.display = "none";

  try {
    const usernameSnap = await getDoc(doc(db, "usernames", state.username.toLowerCase()));
    if (usernameSnap.exists()) {
      errorEl.textContent = "That username was just taken. Returning to name selection…";
      errorEl.style.display = "block";
      confirmBtn.disabled = false;
      backBtn.disabled = false;
      confirmBtn.textContent = "Confirm";
      state.usernameStatus = "taken";
      redirectTimer = setTimeout(renderScreen1, 2500);
      return;
    }

    const uid = state.user.uid;
    const now = serverTimestamp();
    const batch = writeBatch(db);

    batch.set(doc(db, "usernames", state.username.toLowerCase()), { uid });
    batch.set(doc(db, "users", uid), {
      username: state.username,
      createdAt: now,
      lastLoginAt: now
    });
    batch.set(doc(db, "characters", uid), {
      uid,
      username: state.username,
      class: state.selectedClass,
      avatar: state.selectedAvatar,
      xp: 0,
      level: 1,
      statPoints: 0,
      stats: { ...CLASS_DATA[state.selectedClass].stats },
      pvpRating: 1000,
      pvpRank: "unranked",
      pvpWins: 0,
      pvpLosses: 0,
      lastArenaFight: null,
      gear: {},
      skills: [],
      createdAt: now
    });

    await batch.commit();
    state.onSuccess();

  } catch {
    errorEl.textContent = "Something went wrong. Please try again.";
    errorEl.style.display = "block";
    confirmBtn.disabled = false;
    backBtn.disabled = false;
    confirmBtn.textContent = "Confirm";
  }
}

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
