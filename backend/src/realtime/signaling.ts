import { WebSocketServer, WebSocket } from "ws";
import { verifyToken } from "../utils/jwt";

interface RoomSocket extends WebSocket {
  roomId?: string;
  participantName?: string;
}

const rooms = new Map<string, Set<RoomSocket>>();

export function attachSignalingServer(server: import("node:http").Server): void {
  const webSocketServer = new WebSocketServer({ server, path: "/signaling" });

  webSocketServer.on("connection", (socket: RoomSocket, request) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const roomId = requestUrl.searchParams.get("roomId");
    const token = requestUrl.searchParams.get("token");

    if (!roomId || !token) {
      socket.close(1008, "Room and authentication are required");
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.roomId = roomId;
      socket.participantName = payload.name;
    } catch {
      socket.close(1008, "Invalid authentication");
      return;
    }

    const room = rooms.get(roomId) ?? new Set<RoomSocket>();
    const existingParticipants = room.size;
    room.add(socket);
    rooms.set(roomId, room);

    send(socket, { type: existingParticipants > 0 ? "peer-present" : "waiting" });
    broadcast(room, socket, { type: "peer-joined", participantName: socket.participantName });

    socket.on("message", (rawMessage: Buffer) => {
      try {
        const message = JSON.parse(rawMessage.toString()) as { type?: string };
        if (["offer", "answer", "ice-candidate", "chat"].includes(message.type ?? "")) {
          broadcast(room, socket, { ...message, participantName: socket.participantName });
        }
      } catch {
        send(socket, { type: "error", message: "Invalid signaling message" });
      }
    });

    socket.on("close", () => {
      room.delete(socket);
      broadcast(room, socket, { type: "peer-left" });
      if (room.size === 0) rooms.delete(roomId);
    });
  });
}

function send(socket: RoomSocket, message: object): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(room: Set<RoomSocket>, sender: RoomSocket, message: object): void {
  room.forEach((peer) => {
    if (peer !== sender) send(peer, message);
  });
}
