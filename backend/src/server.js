
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const roomManager = require("./rooms/roomManager");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Home route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "YouTube Watch Party Backend is Running!"
    });
});

// Create room
app.post("/api/rooms", (req, res) => {
    try {
        const { username } = req.body;

        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        const room = roomManager.createRoom(username.trim());

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            room
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not create room"
        });
    }
});

// Get room
app.get("/api/rooms/:roomId", (req, res) => {
    const room = roomManager.getPublicRoom(req.params.roomId);

    if (!room) {
        return res.status(404).json({
            success: false,
            message: "Room not found"
        });
    }

    res.json({ success: true, room });
});

function removeParticipant(socket) {
    const result = roomManager.leaveRoom(socket.id);

    if (result) {
        socket.leave(result.roomId);

        io.to(result.roomId).emit("room-updated", {
            participants: result.participants
        });

        console.log(`${result.participant.username} left room ${result.roomId}`);
    }
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join room
    socket.on("join-room", (data) => {
        try {
            const { roomId, username, userId } = data || {};

            if (!roomId || !username || !username.trim()) {
                return socket.emit("room-error", {
                    message: "Room ID and username are required"
                });
            }

            const result = roomManager.joinRoom(
                roomId,
                username.trim(),
                socket.id,
                userId
            );

            if (!result) {
                return socket.emit("room-error", {
                    message: "Room not found"
                });
            }

            socket.join(result.room.roomId);

            const publicRoom = roomManager.getPublicRoom(result.room.roomId);

            socket.emit("room-joined", {
                success: true,
                room: publicRoom,
                participant: {
                    userId: result.participant.userId,
                    username: result.participant.username,
                    role: result.participant.role
                }
            });

            io.to(result.room.roomId).emit("room-updated", {
                participants: publicRoom.participants
            });

            console.log(`${username} joined ${roomId}`);

        } catch (error) {
            console.error(error);

            socket.emit("room-error", {
                message: "Could not join room"
            });
        }
    });

    // Change video
    socket.on("set-video", (data) => {
        const { roomId, videoId } = data || {};
        const membership = roomManager.getParticipantBySocket(socket.id);

        if (
            !membership ||
            membership.room.roomId !== roomId ||
            !["Host", "Moderator"].includes(membership.participant.role)
        ) {
            return socket.emit("room-error", {
                message: "You are not allowed to change the video"
            });
        }

        if (
            typeof videoId !== "string" ||
            !/^[a-zA-Z0-9_-]{11}$/.test(videoId)
        ) {
            return socket.emit("room-error", {
                message: "Invalid YouTube video ID"
            });
        }

        const state = roomManager.updateRoomState(roomId, {
            videoId,
            playState: "paused",
            currentTime: 0
        });

        io.to(roomId).emit("video-changed", state);
    });

    // Playback synchronization
    socket.on("playback-update", (data) => {
        const { roomId, action, currentTime } = data || {};
        const membership = roomManager.getParticipantBySocket(socket.id);

        if (
            !membership ||
            membership.room.roomId !== roomId ||
            !["Host", "Moderator"].includes(membership.participant.role)
        ) {
            return socket.emit("room-error", {
                message: "You are not allowed to control playback"
            });
        }

        if (!["play", "pause", "seek"].includes(action)) return;

        if (
            typeof currentTime !== "number" ||
            !Number.isFinite(currentTime) ||
            currentTime < 0
        ) return;

        const updates = {
            currentTime,
            ...(action === "play" ? { playState: "playing" } : {}),
            ...(action === "pause" ? { playState: "paused" } : {})
        };

        const state = roomManager.updateRoomState(roomId, updates);

        io.to(roomId).emit("playback-updated", {
            action,
            state
        });
    });

    // Change role
    socket.on("change-role", (data) => {
        const { roomId, targetUserId, newRole } = data || {};
        const membership = roomManager.getParticipantBySocket(socket.id);

        if (
            !membership ||
            membership.room.roomId !== roomId ||
            membership.participant.role !== "Host"
        ) {
            return socket.emit("room-error", {
                message: "Only the host can change roles"
            });
        }

        const updatedRoom = roomManager.setParticipantRole(
            roomId,
            targetUserId,
            newRole
        );

        if (!updatedRoom) {
            return socket.emit("room-error", {
                message: "Could not change role"
            });
        }

        io.to(roomId).emit("room-updated", {
            participants: updatedRoom.participants
        });
    });

    // Remove participant
    socket.on("remove-participant", (data) => {
        const { roomId, targetUserId } = data || {};
        const membership = roomManager.getParticipantBySocket(socket.id);

        if (
            !membership ||
            membership.room.roomId !== roomId ||
            membership.participant.role !== "Host"
        ) {
            return socket.emit("room-error", {
                message: "Only the host can remove participants"
            });
        }

        const result = roomManager.removeParticipant(
            roomId,
            targetUserId
        );

        if (!result) {
            return socket.emit("room-error", {
                message: "Could not remove participant"
            });
        }

        const targetSocket = result.participant.socketId;

        if (targetSocket) {
            io.to(targetSocket).emit("removed-from-room", {
                message: "You were removed by the host"
            });

            io.sockets.sockets.get(targetSocket)?.leave(roomId);
        }

        io.to(roomId).emit("room-updated", {
            participants: result.room.participants
        });
    });

    // LIVE CHAT
    socket.on("send-message", (data) => {
        const { roomId, message } = data || {};

        const membership = roomManager.getParticipantBySocket(socket.id);

        if (!membership || membership.room.roomId !== roomId) {
            console.log("Chat error: User is not in this room");
            return;
        }

        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.length > 500
        ) {
            return;
        }

        const chatMessage = {
            userId: membership.participant.userId,
            username: membership.participant.username,
            message: message.trim(),
            timestamp: new Date().toISOString()
        };

        console.log("Chat message received:", chatMessage);

        io.to(roomId).emit("new-message", chatMessage);
    });

    // Leave room
    socket.on("leave-room", () => {
        removeParticipant(socket);
    });

    // Disconnect
    socket.on("disconnect", () => {
        removeParticipant(socket);
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
