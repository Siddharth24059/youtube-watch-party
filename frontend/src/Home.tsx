
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111827",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          width: "350px",
          padding: "30px",
          background: "#1f2937",
          borderRadius: "12px",
        }}
      >
        <h1>YouTube Watch Party</h1>

        <p>Watch YouTube videos together in real time.</p>

        <input
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={createRoom}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            cursor: "pointer",
          }}
        >
          {loading ? "Creating..." : "Create Watch Party"}
        </button>

        <hr />

        <input
          placeholder="Enter Room Code"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
            marginBottom: "15px",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={joinRoom}
          style={{
            width: "100%",
            padding: "12px",
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
