async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();
  addMessage(data.reply, "bot");
}

function addMessage(msg, type) {
  const box = document.getElementById("chat-box");
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.innerText = msg;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
