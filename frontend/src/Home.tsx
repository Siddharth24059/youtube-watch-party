
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

function Home() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createRoom = async () => {
    if (!username.trim()) {
      alert("Please enter your username");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create room");
      }

      const hostId =
        data.room.hostId || data.room.participants?.[0]?.userId;

      if (!hostId) {
        throw new Error("Host ID was not returned by the server");
      }

      navigate(`/room/${data.room.roomId}`, {
        state: {
          username: username.trim(),
          userId: hostId,
        },
      });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) {
      alert("Please enter username and room code");
      return;
    }

    navigate(`/room/${roomId.trim().toUpperCase()}`, {
      state: {
        username: username.trim(),
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px 16px",
        background:
          "radial-gradient(circle at top, #263449 0%, #111827 55%, #080d18 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          boxSizing: "border-box",
          padding: "40px 32px",
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "20px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "38px", marginBottom: "16px" }}>
            ▶️
          </div>

          <h1
            style={{
              fontSize: "30px",
              lineHeight: 1.3,
              margin: "0 0 14px",
              fontWeight: 700,
              letterSpacing: "-0.8px",
            }}
          >
            YouTube Watch Party
          </h1>

          <p
            style={{
              color: "#9ca3af",
              fontSize: "14px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Watch YouTube videos together in real time.
          </p>
        </div>

        <label
          style={{
            display: "block",
            marginBottom: "9px",
            fontSize: "14px",
            color: "#e5e7eb",
          }}
        >
          Your Username
        </label>

        <input
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px",
            marginBottom: "18px",
            borderRadius: "9px",
            border: "1px solid #4b5563",
            background: "#111827",
            color: "white",
            fontSize: "14px",
            outline: "none",
          }}
        />

        <button
          onClick={createRoom}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "9px",
            background: loading ? "#4b5563" : "#dc2626",
            color: "white",
            fontSize: "15px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating..." : "Create Watch Party"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "26px 0",
            color: "#9ca3af",
            fontSize: "12px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#4b5563" }} />
          OR JOIN EXISTING ROOM
          <div style={{ flex: 1, height: "1px", background: "#4b5563" }} />
        </div>

        <input
          placeholder="Enter Room Code"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px",
            marginBottom: "14px",
            borderRadius: "9px",
            border: "1px solid #4b5563",
            background: "#111827",
            color: "white",
            fontSize: "14px",
            outline: "none",
          }}
        />

        <button
          onClick={joinRoom}
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid #4b5563",
            borderRadius: "9px",
            background: "#374151",
            color: "white",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Join Watch Party
        </button>
      </div>
    </div>
  );
}

export default Home;
