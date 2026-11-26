# YouTube Watch Party System

A real-time YouTube Watch Party application that allows multiple users to watch videos together in synchronized rooms.

## Features

- Create and join watch rooms using unique room codes.
- Real-time YouTube video synchronization.
- Synchronized play, pause, and seek controls.
- Host, Moderator, and Participant roles.
- Host can manage participant roles and remove participants.
- Real-time chat between room participants.
- Share room codes with friends.

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Socket.IO Client
- React YouTube

**Backend**
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
│   └── package.json
└── .gitignore
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/youtube-watch-party.git
cd youtube-watch-party
```

### 2. Start the Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at:

`http://localhost:5000`

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

`http://localhost:5173`

## How to Use

1. Open the application.
2. Create a watch room.
3. Share the room code with another participant.
4. Join the same room from another browser.
5. Add a YouTube video.
6. Enjoy synchronized playback and real-time chat.

## Current Limitations

- Room information is stored in server memory.
- Rooms are lost when the backend restarts.
- Authentication and persistent database storage are not implemented.

## Author

Siddharth Jaiswal
