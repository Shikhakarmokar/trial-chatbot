// public/script.js
// Form chatbot flow (Option A: start automatically)

const QUESTIONS = [
  { key: "Name", q: "What is your Name?" },
  { key: "Email", q: "What is your Email?" },
  { key: "Department", q: "What is your Department?" },
  { key: "Phone", q: "What is your Phone Number?" },
  { key: "Age", q: "What is your Age?" },
  { key: "Location", q: "What is your Location?" },
  { key: "Feedback", q: "Please provide your Feedback." },
];

let answers = {};          // collected answers
let currentIndex = 0;      // which question we're asking
let userID = null;
let sessionID = null;
let isPWAInstalled = false;
let installTimestamp = ""; // if PWA installed we can set this later

// Utilities: detect device/browser/os
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

// user/session ids persistence
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

// UI helpers
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

// On user input (enter)
async function handleUserInput(text) {
  if (!text) return;
  addMessage(text, "user");

  // save answer for current question
  if (currentIndex < QUESTIONS.length) {
    const key = QUESTIONS[currentIndex].key;
    answers[key] = text;
    currentIndex++;
    // small delay then ask next
    setTimeout(() => askCurrentQuestion(), 400);
  } else {
    // if somehow answers ended, ignore or restart
    addMessage("All done. Saving...", "bot");
    finishAndSave();
  }
}

// On finishing the form: gather device info and send to server
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
      addMessage("Save failed: " + (j.error || "unknown"), "bot");
    }
  } catch (err) {
    addMessage("Network error while saving. Try again later.", "bot");
    console.error("Save error:", err);
  }

  // Reset flow for next session (keep userID)
  answers = {};
  currentIndex = 0;
  sessionID = createSessionID();
  // Optionally: ask again or stop
  addMessage("If you want to submit again, please type anything to restart.", "bot");
}

// wire UI input
document.addEventListener("DOMContentLoaded", () => {
  // init ids
  userID = getOrCreateUserID();
  sessionID = createSessionID();

  // Check PWA install state using navigator.getInstalledRelatedApps or matchMedia
  // We set isPWAInstalled true if launched display-mode standalone
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    isPWAInstalled = true;
    installTimestamp = localStorage.getItem("pwa_install_ts") || "";
  } else {
    isPWAInstalled = false;
  }

  // register service worker install timestamp when possible
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      // nothing needed here; install timestamp we set on 'appinstalled' event
    }).catch(() => {});
  }

  window.addEventListener("appinstalled", (evt) => {
    isPWAInstalled = true;
    installTimestamp = new Date().toISOString();
    localStorage.setItem("pwa_install_ts", installTimestamp);
  });

  // prepare UI
  const input = document.getElementById("userInput");
  const sendBtn = document.querySelector("button");

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

  // Start conversation immediately (Option A)
  setTimeout(() => askCurrentQuestion(), 400);
});
