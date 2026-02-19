const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

let clients = [];
let questions = [
  {
    text: "What is 2+2?",
    options: ["A) 3", "B) 4", "C) 5", "D) 6"],
    correct: "B"
  },
  {
    text: "Capital of France?",
    options: ["A) Paris", "B) Rome", "C) Berlin", "D) London"],
    correct: "A"
  }
];

let currentQuestion = 0;

wss.on("connection", (ws) => {
  const player = { socket: ws, score: 0 };
  clients.push(player);

  ws.on("message", (message) => {
    const answer = message.toString();
    if (answer === questions[currentQuestion - 1].correct) {
      player.score += 10;
    }
  });

  if (clients.length >= 1) {
    sendQuestion();
  }
});

function sendQuestion() {
  if (currentQuestion >= questions.length) {
    broadcast(JSON.stringify({ type: "GAMEOVER" }));
    return;
  }

  const q = questions[currentQuestion];
  broadcast(JSON.stringify({
    type: "QUESTION",
    text: q.text,
    options: q.options
  }));

  currentQuestion++;
}

function broadcast(msg) {
  clients.forEach(c => c.socket.send(msg));
}

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
