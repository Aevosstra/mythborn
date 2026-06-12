import { register, login, loginWithGoogle, logout, onAuthChange } from "./auth.js";

const loginForm = document.getElementById("login-form");
const gameContainer = document.getElementById("game-container");
const welcomeMsg = document.getElementById("welcome-msg");

onAuthChange((user) => {
  if (user) {
    loginForm.style.display = "none";
    gameContainer.style.display = "block";
    welcomeMsg.textContent = `Welcome, ${user.email}`;
  } else {
    loginForm.style.display = "block";
    gameContainer.style.display = "none";
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

document.getElementById("btn-logout").addEventListener("click", () => {
  logout();
});