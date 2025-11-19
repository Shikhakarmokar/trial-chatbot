// public/script.js
// Form chatbot flow (Option A: start automatically)

const QUESTIONS = [
  { key: "Name", q: "What is your Name?" },
  { key: "Email", q: "What is your Email?" },
  { key: "Department", q: "What is your Department?" },
  { key: "Phone", q: "What is your Phone Number?" },
  { key: "Age", q: "What is your Age?" },
  { key: "Location", q: "What is your Location?" },
  { key: "Feedback", q: "Please provide your Feedback." }
];

let answers = {};
let currentIndex = 0;
let userID = null;
let sessionID = null;
let isPWAInstalled = false;
let installTimestamp = "";

// Device / OS / Browser detection
function detectDeviceInfo() {
  const ua = navigator.userAgent;

  let deviceType = /Mobi|Android/i.test(ua) ? "Phone" : "Desktop";
  let os = "Unknown";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Win/i.test(ua)) os = "Windows";
  else if (/Mac/i.test(ua)) os = "MacOS";

  let browser = "Unknown";
  if (/Chrome/i.test(ua) && !/Edge\/|OPR\//i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edge\/|Edg\//i.test(ua)) browser = "Edge";

  return { deviceType, os, browser };
}

// User / Session ID
function getOrCreateUserID() {
  let id = localStorage.getItem("trial_user_id");
  if (!id) {
    id = "u_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("trial_user_id", id);
  }
  return id;
}
function createSessionID() {
  return "s_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
}

// Add message to chat box (WhatsApp style)
function addMessage(msg, type) {
  const box = document.getElementById("chat-box");
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.innerText = msg;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function askCurrentQuestion() {
  if (currentIndex < QUESTIONS.length) {
    addMessage(QUESTIONS[currentIndex].q, "bot");
  } else {
    finishAndSave();
  }
}

// Handle user reply
async function handleUserInput(text) {
  if (!text) return;

  addMessage(text, "user");

  if (currentIndex < QUESTIONS.length) {
    const key = QUESTIONS[currentIndex].key;
    answers[key] = text;
    currentIndex++;
    setTimeout(() => askCurrentQuestion(), 400);
  } else {
    addMessage("All done. Saving...", "bot");
    finishAndSave();
  }
}

// Finish + Save to server
async function finishAndSave() {
  addMessage("Thanks — saving your responses now.", "bot");

  const { deviceType, os, browser } = detectDeviceInfo();
  const timestamp = new Date().toISOString();

  const payload = {
    Name: answers.Name || "",
    Email: answers.Email || "",
    Department: answers.Department || "",
    Phone: answers.Phone || "",
    Age: answers.Age || "",
    Location: answers.Location || "",
    Feedback: answers.Feedback || "",
    DeviceType: deviceType,
    OS: os,
    Browser: browser,
    IsPWAInstalled: isPWAInstalled ? "TRUE" : "FALSE",
    InstallTimestamp: installTimestamp || "",
    ChatbotTimestamp: timestamp,
    UserID: userID,
    SessionID: sessionID
  };

  try {
    const res = await fetch("/save-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const j = await res.json();
    if (j.ok) {
      addMessage("Your details were saved successfully. Thank you!", "bot");
    } else {
      addMessage("Save failed: " + (j.error || "unknown"), "bot");
    }
  } catch (err) {
    addMessage("Network error while saving. Try again later.", "bot");
    console.error(err);
  }

  // Reset flow
  answers = {};
  currentIndex = 0;
  sessionID = createSessionID();

  addMessage("If you want to submit again, type anything to restart.", "bot");
}

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  userID = getOrCreateUserID();
  sessionID = createSessionID();

  if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
    isPWAInstalled = true;
    installTimestamp = localStorage.getItem("pwa_install_ts") || "";
  }

  window.addEventListener("appinstalled", () => {
    isPWAInstalled = true;
    installTimestamp = new Date().toISOString();
    localStorage.setItem("pwa_install_ts", installTimestamp);
  });

  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");

  sendBtn.addEventListener("click", () => {
    const text = input.value.trim();
    input.value = "";
    handleUserInput(text);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const text = input.value.trim();
      input.value = "";
      handleUserInput(text);
    }
  });

  // Start conversation immediately
  setTimeout(() => askCurrentQuestion(), 400);
});
