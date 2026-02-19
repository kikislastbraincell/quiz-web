const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

let clients = [];
let questions = [
  { text: "What is 2+2?", options: ["A) 3","B) 4","C) 5","D) 6"], correct: "B" },
  { text: "Capital of France?", options: ["A) Paris","B) Rome","C) Berlin","D) London"], correct: "A" },
  { text: "Which planet is known as the Red Planet?", options: ["A) Venus","B) Mars","C) Jupiter","D) Saturn"], correct: "B" },
  { text: "What is the largest ocean?", options: ["A) Atlantic","B) Pacific","C) Indian","D) Arctic"], correct: "B" },
  { text: "Which gas do plants absorb?", options: ["A) Oxygen","B) Nitrogen","C) Carbon Dioxide","D) Hydrogen"], correct: "C" },
  { text: "Who wrote 'Hamlet'?", options: ["A) Dickens","B) Shakespeare","C) Tolkien","D) Hemingway"], correct: "B" }
];

let currentQuestion = 0;

// Broadcast to all clients
function broadcast(msg) {
  clients.forEach(c => c.socket.send(JSON.stringify(msg)));
}

// Send next question manually
function sendQuestion() {
  if (currentQuestion >= questions.length) {
    broadcast({ type: "GAMEOVER", leaderboard: getLeaderboard() });
    return;
  }

  const q = questions[currentQuestion];
  broadcast({ type: "QUESTION", text: q.text, options: q.options });
  currentQuestion++;
}

// Get sorted leaderboard
function getLeaderboard() {
  return clients
    .map(c => ({ name: c.name || "Anonymous", score: c.score }))
    .sort((a,b) => b.score - a.score);
}

// Handle new connections
wss.on("connection", (ws) => {
  const player = { socket: ws, score: 0, name: null };
  clients.push(player);

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "NAME") {
      player.name = data.name;
      if (currentQuestion < questions.length) sendQuestion();
    }

    if (data.type === "ANSWER") {
      const q = questions[currentQuestion - 1];
      if (data.answer === q.correct) player.score += 10;
      sendQuestion();
    }
  });

  ws.on("close", () => {
    clients = clients.filter(c => c.socket !== ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
