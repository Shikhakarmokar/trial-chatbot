// ===========================
//  FORM CHATBOT FLOW
// ===========================

// Questions asked in sequence
const QUESTIONS = [
  { key: "Name", q: "What is your Name?" },
  { key: "Email", q: "What is your Email?" },
  { key: "Department", q: "What is your Department?" },
  { key: "Phone", q: "What is your Phone Number?" },
  { key: "Age", q: "What is your Age?" },
  { key: "Location", q: "What is your Location?" },
  { key: "Feedback", q: "Please provide your Feedback." },
];

let answers = {};
let currentIndex = 0;
let userID = null;
let sessionID = null;
let isPWAInstalled = false;
let installTimestamp = "";


// ===========================
//  DEVICE + BROWSER DETECTION
// ===========================
function detectDeviceInfo() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  let deviceType = /Mobi|Android/i.test(ua) ? "Phone" : "Desktop";

  let os = "Unknown";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Win/i.test(ua)) os = "Windows";
  else if (/Mac/i.test(ua)) os = "MacOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Unknown";
  if (/Chrome/i.test(ua) && !/Edge\/|OPR\//i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edge\/|Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";

  return { deviceType, os, browser };
}


// ===========================
//  USER + SESSION IDS
// ===========================
function getOrCreateUserID() {
  let id = localStorage.getItem("trial_user_id");
  if (!id) {
    id = "u_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("trial_user_id", id);
  }
  return id;
}

function createSessionID() {
  return "s_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now();
}


// ===========================
//  MESSAGE UI
// ===========================
function addMessage(msg, type) {
  const box = document.getElementById("chat-box");
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.innerText = msg;
  box.appendChild(div);

  // Auto-scroll fix
  box.scrollTop = box.scrollHeight;
}


// Ask next question
function askCurrentQuestion() {
  if (currentIndex < QUESTIONS.length) {
    addMessage(QUESTIONS[currentIndex].q, "bot");
  } else {
    finishAndSave();
  }
}


// ===========================
//  PROCESS USER MESSAGE
// ===========================
async function handleUserInput(text) {
  if (!text) return;

  addMessage(text, "user");

  if (currentIndex < QUESTIONS.length) {
    answers[QUESTIONS[currentIndex].key] = text;
    currentIndex++;

    // Ask next after slight pause
    setTimeout(() => askCurrentQuestion(), 400);
  } else {
    finishAndSave();
  }
}


// ===========================
//  SAVE FINAL FORM
// ===========================
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
    InstallTimestamp: installTimestamp,
    ChatbotTimestamp: timestamp,
    UserID: userID,
    SessionID: sessionID,
  };

  try {
    const r = await fetch("/save-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await r.json();

    if (j.ok) {
      addMessage("Your details were saved successfully. Thank you!", "bot");
    } else {
      addMessage("Save failed: " + (j.error || "Unknown error"), "bot");
    }
  } catch (err) {
    addMessage("Network error. Try again later.", "bot");
  }

  // Reset for next time
  answers = {};
  currentIndex = 0;
  sessionID = createSessionID();

  addMessage("If you want to submit again, type anything to restart.", "bot");
}


// ===========================
//  MAIN CHATBOT STARTUP
// ===========================
document.addEventListener("DOMContentLoaded", () => {

  userID = getOrCreateUserID();
  sessionID = createSessionID();

  // Detect if running as PWA
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    isPWAInstalled = true;
    installTimestamp = localStorage.getItem("pwa_install_ts") || "";
  }

  // Save timestamp when installed
  window.addEventListener("appinstalled", () => {
    isPWAInstalled = true;
    installTimestamp = new Date().toISOString();
    localStorage.setItem("pwa_install_ts", installTimestamp);
  });

  // Wire input box
  const input = document.getElementById("userInput");
  const sendBtn = document.querySelector(".send-btn");

  sendBtn.addEventListener("click", () => {
    const text = input.value.trim();
    input.value = "";
    handleUserInput(text);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const text = input.value.trim();
      input.value = "";
      handleUserInput(text);
    }
  });

  // ⭐ IMPORTANT FIX ⭐
  // Start chatbot after layout fully loads
  setTimeout(() => {
    console.log("Chatbot started smoothly.");
    askCurrentQuestion();
  }, 700);
});
