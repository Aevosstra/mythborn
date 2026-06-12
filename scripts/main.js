import { register, login, loginWithGoogle, logout, onAuthChange } from "./auth.js";
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { showCharacterCreation } from "./characterCreation.js";

const authContainer = document.getElementById("auth-container");
const characterCreation = document.getElementById("character-creation");
const gameContainer = document.getElementById("game-container");

function showLogin() {
  authContainer.style.display = "block";
  characterCreation.style.display = "none";
  gameContainer.style.display = "none";
}

function showCreation(user) {
  authContainer.style.display = "none";
  characterCreation.style.display = "block";
  gameContainer.style.display = "none";
  showCharacterCreation(user, showGame);
}

function showGame() {
  authContainer.style.display = "none";
  characterCreation.style.display = "none";
  gameContainer.style.display = "block";
  gameContainer.innerHTML = `
    <div style="text-align:center; padding:3rem;">
      <h2 style="color:#c9a84c; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:1rem;">Mythborn</h2>
      <p style="color:#8a8098; margin-bottom:2rem;">Game coming soon.</p>
      <button id="btn-logout">Logout</button>
    </div>
  `;
  document.getElementById("btn-logout").addEventListener("click", () => logout());
}

onAuthChange(async (user) => {
  if (user) {
    const charSnap = await getDoc(doc(db, "characters", user.uid));
    charSnap.exists() ? showGame() : showCreation(user);
  } else {
    showLogin();
  }
});

document.getElementById("btn-login").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  login(email, password).catch((err) => alert(err.message));
});

document.getElementById("btn-register").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  register(email, password).catch((err) => alert(err.message));
});

document.getElementById("btn-google").addEventListener("click", () => {
  loginWithGoogle().catch((err) => alert(err.message));
});
