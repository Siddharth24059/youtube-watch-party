
const crypto = require("crypto");

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    generateRoomCode() {
        let roomId;

        do {
            roomId = crypto.randomBytes(3).toString("hex").toUpperCase();
        } while (this.rooms.has(roomId));

        return roomId;
    }

    createRoom(username) {
        const roomId = this.generateRoomCode();
        const hostId = crypto.randomUUID();

        const room = {
            roomId,
            hostId,
            hostUsername: username,
            participants: [
                {
                    userId: hostId,
                    username,
                    role: "Host",
                    socketId: null
                }
            ],
            state: {
                videoId: null,
                playState: "paused",
                currentTime: 0
            }
        };

        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId.toUpperCase());
    }

    joinRoom(roomId, username, socketId, userId = null) {
        const room = this.getRoom(roomId);

        if (!room) return null;

        let participant;

        if (userId && userId === room.hostId) {
            participant = room.participants.find(
                p => p.userId === room.hostId
            );

            if (participant) {
                participant.socketId = socketId;
            } else {
                participant = {
                    userId: room.hostId,
                    username: room.hostUsername,
                    role: "Host",
                    socketId
                };

                room.participants.push(participant);
            }
        } else {
            participant = room.participants.find(
                p => p.socketId === socketId
            );

            if (!participant) {
                participant = {
                    userId: crypto.randomUUID(),
                    username,
                    role: "Participant",
                    socketId
                };

                room.participants.push(participant);
            }
        }

        return { room, participant };
    }

    getParticipantBySocket(socketId) {
        for (const room of this.rooms.values()) {
            const participant = room.participants.find(
                p => p.socketId === socketId
            );

            if (participant) return { room, participant };
        }

        return null;
    }

    setParticipantRole(roomId, targetUserId, newRole) {
        const room = this.getRoom(roomId);
        if (!room) return null;

        if (!["Moderator", "Participant"].includes(newRole)) {
            return null;
        }

        const participant = room.participants.find(
            p => p.userId === targetUserId
        );

        if (!participant || participant.role === "Host") {
            return null;
        }

        participant.role = newRole;
        return this.getPublicRoom(roomId);
    }

    removeParticipant(roomId, targetUserId) {
        const room = this.getRoom(roomId);
        if (!room) return null;

        const index = room.participants.findIndex(
            p => p.userId === targetUserId
        );

        if (index === -1) return null;

        const participant = room.participants[index];

        if (participant.role === "Host") return null;

        room.participants.splice(index, 1);

        return {
            participant,
            room: this.getPublicRoom(roomId)
        };
    }

    updateRoomState(roomId, updates) {
        const room = this.getRoom(roomId);
        if (!room) return null;

        if (updates.videoId !== undefined) {
            room.state.videoId = updates.videoId;
        }

        if (updates.playState !== undefined) {
            room.state.playState = updates.playState;
        }

        if (updates.currentTime !== undefined) {
            room.state.currentTime = updates.currentTime;
        }

        return room.state;
    }

    leaveRoom(socketId) {
        for (const [roomId, room] of this.rooms) {
            const index = room.participants.findIndex(
                p => p.socketId === socketId
            );

            if (index !== -1) {
                const [participant] = room.participants.splice(index, 1);

                return {
                    roomId,
                    participant,
                    participants: this.getPublicRoom(roomId).participants
                };
            }
        }

        return null;
    }

    getPublicRoom(roomId) {
        const room = this.getRoom(roomId);
        if (!room) return null;

        return {
            roomId: room.roomId,
            hostUsername: room.hostUsername,
            participants: room.participants.map(p => ({
                userId: p.userId,
                username: p.username,
                role: p.role
            })),
            state: room.state
        };
    }
}

module.exports = new RoomManager();
