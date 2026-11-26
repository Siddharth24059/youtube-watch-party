# YouTube Watch Party System

A real-time YouTube Watch Party application that lets multiple participants watch YouTube videos together in synchronized rooms.

## Live Demo

- **Frontend:** https://youtube-watch-party-beta.vercel.app/
- **Backend API:** https://youtube-watch-party-bf1j.onrender.com
- **GitHub Repository:** https://github.com/Siddharth24059/youtube-watch-party

> The backend is hosted on Render's free instance. It may take around 50 seconds or more to wake after inactivity. Watch rooms are stored in server memory and are cleared when the backend restarts.

## Features

- Create a watch room and share its room code/link.
- Join an existing room.
- Synchronize YouTube video playback between participants.
- Synchronize play, pause, and seek actions.
- Support Host, Moderator, and Participant roles.
- Allow the Host to manage participant roles and remove participants.
- Real-time room chat.

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Socket.IO Client
- React YouTube / YouTube IFrame Player

### Backend
- Node.js
- Express.js
- Socket.IO

## Project Structure

```text
youtube-watch-party/
├── backend/
│   ├── src/
│   │   ├── rooms/
│   │   │   └── roomManager.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── socket/
│   │   ├── Home.tsx
│   │   ├── Room.tsx
│   │   └── App.tsx
│   ├── vercel.json
│   └── package.json
└── README.md
```

## Run Locally

### Prerequisites
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Siddharth24059/youtube-watch-party.git
cd youtube-watch-party
```

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

The backend runs at `http://localhost:5000` (unless a different `PORT` is configured).

For local development, configure the backend's `FRONTEND_URL` environment variable to the Vite frontend origin, usually:

```text
FRONTEND_URL=http://localhost:5173
```

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

For local development, the frontend falls back to `http://localhost:5000` when `VITE_SERVER_URL` is not set. To point it at another backend, set:

```text
VITE_SERVER_URL=http://localhost:5000
```

## How to Use

1. Open the frontend.
2. Enter a username and create a room.
3. Share the room code or room link with another participant.
4. Open the shared link in another browser or an incognito window.
5. Join using a different username.
6. Select/play a YouTube video and test synchronized playback.
7. Try chat and the available participant/role controls.

## Deployment

- Frontend is deployed on Vercel.
- Backend is deployed on Render.
- The Vercel environment variable `VITE_SERVER_URL` must point to the deployed backend URL.
- The Render environment variable `FRONTEND_URL` must match the deployed frontend origin.

## Screenshots

Add your own screenshots to a folder named `screenshots/` and update the image paths below.

| Screenshot | Suggested file |
|---|---|
| Home page / create room | `screenshots/01-home.png` |
| Room with YouTube player | `screenshots/02-room-player.png` |
| Two participants in one room | `screenshots/03-two-participants.png` |
| Chat and participant roles | `screenshots/04-chat-roles.png` |

<!-- Uncomment these after adding the screenshot files:
![Home page](screenshots/01-home.png)
![Room player](screenshots/02-room-player.png)
![Two participants](screenshots/03-two-participants.png)
![Chat and roles](screenshots/04-chat-roles.png)
-->

## Current Limitations

- Room and participant state is stored in backend memory; a backend restart clears active rooms.
- There is no persistent database for room history.
- The application does not implement full account authentication.
- The free Render service may sleep during inactivity, causing a cold-start delay.

## Author

**Siddharth Jaiswal**
