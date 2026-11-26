
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import { socket } from "./socket/socket";

interface Participant {
  userId: string;
  username: string;
  role: string;
}

interface RoomState {
  videoId: string | null;
  playState: string;
  currentTime: number;
}

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: string;
}

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v");
    }

    const parts = parsed.pathname.split("/");
    const marker = parts.findIndex(
      (part) => part === "embed" || part === "shorts"
    );

    return marker !== -1 ? parts[marker + 1] || null : null;
  } catch {
    return null;
  }
}

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const username = location.state?.username || "Guest";
  const userId = location.state?.userId;

  const playerRef = useRef<any>(null);
  const syncingRef = useRef(false);
  const previousTime = useRef(0);
  const myUserIdRef = useRef<string | undefined>(userId);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState("Participant");
  const [message, setMessage] = useState("Connecting...");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [, setRoomState] = useState<RoomState>({
  videoId: null,
  playState: "paused",
  currentTime: 0,
});

  const isHost = myRole === "Host";
  const canControl = isHost || myRole === "Moderator";

  useEffect(() => {
    if (!roomId) return;

    const onRoomJoined = (data: any) => {
      setParticipants(data.room.participants || []);
      myUserIdRef.current = data.participant?.userId;
      setMyRole(data.participant?.role || "Participant");
      setRoomState(data.room.state);

      if (data.room.state?.videoId) {
        setVideoId(data.room.state.videoId);
      }

      setMessage("Connected successfully!");
    };

    const onRoomUpdated = (data: any) => {
      setParticipants(data.participants || []);

      const me = data.participants?.find(
        (p: Participant) => p.userId === myUserIdRef.current
      );

      if (me) setMyRole(me.role);
    };

    const onRoomError = (data: any) => {
      setMessage(data.message || "Something went wrong");
    };

    const onRemoved = (data: any) => {
      alert(data.message || "You were removed from the room");
      navigate("/");
    };

    const onVideoChanged = (state: RoomState) => {
      setRoomState(state);
      setVideoId(state.videoId);
    };

    const onPlaybackUpdated = (data: any) => {
      setRoomState(data.state);

      if (!playerRef.current || canControl) return;

      const player = playerRef.current;
      syncingRef.current = true;
      player.seekTo(data.state.currentTime || 0, true);

      if (data.state.playState === "playing") {
        player.playVideo();
      } else {
        player.pauseVideo();
      }

      window.setTimeout(() => {
        syncingRef.current = false;
      }, 700);
    };

    const onNewMessage = (newMessage: ChatMessage) => {
      setChatMessages((previous) => [...previous, newMessage]);
    };

    socket.on("room-joined", onRoomJoined);
    socket.on("room-updated", onRoomUpdated);
    socket.on("room-error", onRoomError);
    socket.on("removed-from-room", onRemoved);
    socket.on("video-changed", onVideoChanged);
    socket.on("playback-updated", onPlaybackUpdated);
    socket.on("new-message", onNewMessage);

    if (!socket.connected) socket.connect();

    socket.emit("join-room", { roomId, username, userId });

    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("room-updated", onRoomUpdated);
      socket.off("room-error", onRoomError);
      socket.off("removed-from-room", onRemoved);
      socket.off("video-changed", onVideoChanged);
      socket.off("playback-updated", onPlaybackUpdated);
      socket.off("new-message", onNewMessage);
    };
  }, [roomId, username, userId, navigate, canControl]);

  const loadVideo = () => {
    const id = extractVideoId(videoUrl.trim());

    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      setMessage("Please enter a valid YouTube URL.");
      return;
    }

    if (!canControl) {
      setMessage("You do not have permission to change the video.");
      return;
    }

    socket.emit("set-video", { roomId, videoId: id });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = chatInput.trim();

    if (!trimmedMessage || !roomId) return;

    socket.emit("send-message", {
      roomId,
      message: trimmedMessage,
    });

    setChatInput("");
  };

  const changeRole = (targetUserId: string, newRole: string) => {
    socket.emit("change-role", {
      roomId,
      targetUserId,
      newRole,
    });
  };

  const removeParticipant = (targetUserId: string) => {
    if (!window.confirm("Remove this participant from the room?")) return;

    socket.emit("remove-participant", {
      roomId,
      targetUserId,
    });
  };

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event: any) => {
    if (!canControl || !playerRef.current || syncingRef.current) return;

    const currentTime = playerRef.current.getCurrentTime();

    if (event.data === 1 || event.data === 2) {
      socket.emit("playback-update", {
        roomId,
        action: event.data === 1 ? "play" : "pause",
        currentTime,
      });
    }
  };

  useEffect(() => {
    if (!canControl || !videoId) return;

    const interval = window.setInterval(() => {
      if (!playerRef.current) return;

      const player = playerRef.current;
      const state = player.getPlayerState();

      if (state !== 1) return;

      const currentTime = player.getCurrentTime();

      if (Math.abs(currentTime - previousTime.current) > 2) {
        socket.emit("playback-update", {
          roomId,
          action: "seek",
          currentTime,
        });
      }

      previousTime.current = currentTime;
    }, 500);

    return () => window.clearInterval(interval);
  }, [canControl, videoId, roomId]);

  const youtubeOptions = {
    width: "100%",
    playerVars: {
      autoplay: 0,
      controls: canControl ? 1 : 0,
      rel: 0,
    },
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>YouTube Watch Party</h1>
          <p style={styles.subheading}>Room Code: {roomId}</p>
        </div>

        <button style={styles.backButton} onClick={() => navigate("/")}>
          Leave Room
        </button>
      </header>

      <p style={styles.message}>{message}</p>

      <div style={styles.layout}>
        <main style={styles.main}>
          {canControl && (
            <div style={styles.videoInput}>
              <input
                style={styles.input}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste YouTube video URL"
              />

              <button style={styles.button} onClick={loadVideo}>
                Load Video
              </button>
            </div>
          )}

          <div style={styles.player}>
            {videoId ? (
              <YouTube
                videoId={videoId}
                opts={youtubeOptions}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
              />
            ) : (
              <div style={styles.emptyPlayer}>
                <h2>No video selected</h2>
                <p>Waiting for the host to load a video.</p>
              </div>
            )}
          </div>

          <p style={styles.note}>
            Your role: <strong>{myRole}</strong>
          </p>

          <section style={styles.chat}>
            <h2 style={styles.chatHeading}>Live Chat</h2>

            <div style={styles.chatMessages}>
              {chatMessages.length === 0 ? (
                <p style={styles.emptyChat}>
                  No messages yet. Start the conversation!
                </p>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={`${msg.timestamp}-${index}`} style={styles.chatItem}>
                    <div style={styles.chatMeta}>
                      <strong>{msg.username}</strong>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p style={styles.chatText}>{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendMessage} style={styles.chatForm}>
              <input
                style={styles.chatInput}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
              />

              <button
                style={styles.sendButton}
                type="submit"
                disabled={!chatInput.trim()}
              >
                Send
              </button>
            </form>
          </section>
        </main>

        <aside style={styles.sidebar}>
          <h2>Participants ({participants.length})</h2>

          {participants.map((person) => (
            <div key={person.userId} style={styles.person}>
              <div>
                <strong>{person.username}</strong>
                <p style={styles.role}>{person.role}</p>
              </div>

              {isHost && person.role !== "Host" && (
                <div style={styles.actions}>
                  <select
                    style={styles.select}
                    value={person.role}
                    onChange={(e) =>
                      changeRole(person.userId, e.target.value)
                    }
                  >
                    <option value="Participant">Participant</option>
                    <option value="Moderator">Moderator</option>
                  </select>

                  <button
                    style={styles.removeButton}
                    onClick={() => removeParticipant(person.userId)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    padding: "25px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    borderBottom: "1px solid #334155",
    paddingBottom: "15px",
  },
  heading: { margin: 0, fontSize: "28px" },
  subheading: { color: "#94a3b8" },
  backButton: {
    background: "#334155",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  message: { color: "#38bdf8", marginTop: "20px" },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 300px",
    gap: "25px",
    marginTop: "20px",
  },
  main: { minWidth: 0 },
  videoInput: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: "200px",
    padding: "13px",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "#1e293b",
    color: "white",
  },
  button: {
    padding: "13px 22px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  player: {
    width: "100%",
    aspectRatio: "16 / 9",
    background: "#020617",
    borderRadius: "12px",
    overflow: "hidden",
  },
  emptyPlayer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    textAlign: "center",
  },
  note: { color: "#94a3b8", marginTop: "15px" },
  sidebar: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    height: "fit-content",
  },
  person: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px 0",
    borderBottom: "1px solid #334155",
  },
  role: {
    margin: "5px 0",
    color: "#94a3b8",
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  select: {
    padding: "7px",
    borderRadius: "6px",
  },
  removeButton: {
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "7px 10px",
    cursor: "pointer",
  },
  chat: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "25px",
  },
  chatHeading: {
    marginTop: 0,
    borderBottom: "1px solid #334155",
    paddingBottom: "12px",
  },
  chatMessages: {
    height: "250px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emptyChat: {
    color: "#94a3b8",
    textAlign: "center",
    margin: "auto",
  },
  chatItem: {
    background: "#0f172a",
    padding: "10px 12px",
    borderRadius: "8px",
    overflowWrap: "anywhere",
  },
  chatMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    color: "#38bdf8",
    fontSize: "13px",
  },
  chatText: {
    margin: "8px 0 0",
    color: "#e2e8f0",
    whiteSpace: "pre-wrap",
  },
  chatForm: {
    display: "flex",
    gap: "8px",
    marginTop: "15px",
  },
  chatInput: {
    flex: 1,
    minWidth: 0,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "white",
  },
  sendButton: {
    padding: "10px 18px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Room;
