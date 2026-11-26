# Submission Checklist

## Application verification
- [ ] Open the production frontend.
- [ ] Create a room.
- [ ] Join the room from a second browser/incognito window.
- [ ] Confirm both participants see the same room.
- [ ] Test play synchronization.
- [ ] Test pause synchronization.
- [ ] Test seek synchronization.
- [ ] Test changing the YouTube video, if supported in the current build.
- [ ] Test chat.
- [ ] Test Host/Moderator/Participant controls.
- [ ] Test removing a participant, if available in the current build.

## Evidence
- [ ] Capture the home/create-room screen.
- [ ] Capture the room with the YouTube player.
- [ ] Capture two participants in the same room.
- [ ] Capture chat and role/participant controls.
- [ ] Record a 2–3 minute demo video.
- [ ] Check that the video plays and audio is audible.

## Submission links
- Live frontend: https://youtube-watch-party-beta.vercel.app/
- Backend: https://youtube-watch-party-bf1j.onrender.com
- GitHub: https://github.com/Siddharth24059/youtube-watch-party

## Important notes
- Do not claim persistent storage or full authentication.
- Active rooms are held in backend memory and are lost when the backend restarts.
- Render's free service can sleep during inactivity, so the first request may be delayed.
