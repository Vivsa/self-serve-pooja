const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export function createRoomSync({ roomCode, onState }) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const syncHost = import.meta.env.VITE_SYNC_HOST || `${window.location.hostname}:8787`;
  const ws = new WebSocket(`${protocol}://${syncHost}/room/${roomCode}`);

  ws.addEventListener('message', (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    if (data.type === 'state' && onState) onState(data);
  });

  return {
    sendState(sectionIdx, stepIdx) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'state', sectionIdx, stepIdx }));
      }
    },
    close() {
      ws.close();
    },
  };
}
