export class PujaSession {
  constructor(state) {
    this.sessions = new Set();
    this.lastState = null;
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.sessions.add(server);

    if (this.lastState) {
      server.send(JSON.stringify(this.lastState));
    }

    server.addEventListener('message', (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type !== 'state') return;
      this.lastState = data;
      for (const ws of this.sessions) {
        if (ws !== server) {
          try {
            ws.send(event.data);
          } catch {
            this.sessions.delete(ws);
          }
        }
      }
    });

    const cleanup = () => this.sessions.delete(server);
    server.addEventListener('close', cleanup);
    server.addEventListener('error', cleanup);

    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/room\/([A-Za-z0-9]{4,12})$/);
    if (!match) {
      return new Response('Not found. Use /room/<code>', { status: 404 });
    }
    const roomCode = match[1].toUpperCase();
    const id = env.PUJA_SESSION.idFromName(roomCode);
    const stub = env.PUJA_SESSION.get(id);
    return stub.fetch(request);
  },
};
