const http = require("http");
const { WebSocketServer } = require("ws");
const { randomUUID } = require("crypto");

const PORT = Number(process.env.PORT) || 8080;
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("multiplayer server alive");
});
const wss = new WebSocketServer({ server });

// roomId -> { clients: Map<id, ws>, states: Map<id, state> }
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { clients: new Map(), states: new Map() });
  }
  return rooms.get(roomId);
}

function broadcast(room, data, exceptId = null) {
  const payload = JSON.stringify(data);
  for (const [id, ws] of room.clients.entries()) {
    if (id === exceptId) continue;
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get("room") || "default";
  const room = getRoom(roomId);
  const id = randomUUID().slice(0, 8);

  room.clients.set(id, ws);
  ws.send(JSON.stringify({ type: "welcome", id }));
  ws.send(
    JSON.stringify({
      type: "snapshot",
      players: Array.from(room.states.entries()).map(([pid, state]) => ({
        id: pid,
        state,
      })),
    })
  );

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type !== "state" || typeof msg.state !== "object" || !msg.state) return;
    room.states.set(id, msg.state);
    broadcast(room, { type: "state", id, state: msg.state }, id);
  });

  ws.on("close", () => {
    room.clients.delete(id);
    room.states.delete(id);
    broadcast(room, { type: "remove", id }, id);
    if (room.clients.size === 0) rooms.delete(roomId);
  });
});

server.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});
