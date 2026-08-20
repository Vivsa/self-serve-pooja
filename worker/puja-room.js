// worker/puja-room.js
// PujaRoom Durable Object — एका पूजा-कोडसाठी नियंत्रक व सर्व दर्शक यांच्यातील
// प्रत्यक्ष (real-time) स्थिती-सिंक. WebSocket द्वारे — त्यामुळे:
//   - नियंत्रकाने पायरी बदलली की सर्व दर्शकांना तात्काळ कळते (server push, polling नाही)
//   - दर्शक-उपस्थिती प्रत्यक्ष उघड्या WebSocket जोडणीवरून कळते (५ सेकंदाचे heartbeat-लेखन गरजेचे नाही)
//   - Cloudflare KV वरचा रोजचा लेखन-कोटा (मोफत योजनेत १,०००/दिवस) या सिंकसाठी अजिबात लागत नाही
//
// Hibernatable WebSocket API वापरली आहे — कोणीही जोडलेले नसताना DO "झोपते" (compute खर्च नाही),
// आणि संदेश आल्यावर लगेच जागी होते. स्वतःचे SQLite storage राखते जेणेकरून एखादा दर्शक हा DO
// हायबरनेट झाल्यानंतर परत जोडला तरी शेवटची स्थिती लगेच मिळते.

import { DurableObject } from 'cloudflare:workers';

const EMPTY_STATE = {
  found: false,
  sectionIdx: 0,
  stepIdx: 0,
  panchangData: null,
  hostData: null,
  updatedAt: 0,
  status: 'performing',
  mediaTarget: 'controller',
  volume: 1,
};

export class PujaRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.sql = ctx.storage.sql;
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK (id = 0), json TEXT NOT NULL)`
    );
  }

  getState() {
    const rows = this.sql.exec('SELECT json FROM state WHERE id = 0').toArray();
    if (rows.length === 0) return { ...EMPTY_STATE };
    return JSON.parse(rows[0].json);
  }

  saveState(state) {
    this.sql.exec(
      'INSERT INTO state (id, json) VALUES (0, ?) ON CONFLICT (id) DO UPDATE SET json = excluded.json',
      JSON.stringify(state)
    );
  }

  // कोड (पूजा-कोड) च्या मालकीच्या DO ला थेट भेट देणे शक्य नसते हे बरोबर आहे का, हे तपासण्याची गरज नाही —
  // प्रत्येक पूजा-कोडसाठी एक स्वतंत्र PujaRoom instance असतो (idFromName(code) द्वारे), म्हणजे राज्य आपोआप वेगळे राहते.

  async fetch(request) {
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') !== 'websocket') {
      if (request.method === 'POST') {
        // WebSocket उघडे नसतानाही एकदाच स्थिती-बदल पाठवण्यासाठी (उदा. dashboard वरून थेट "समाप्त करा")
        let msg;
        try {
          msg = await request.json();
        } catch (err) {
          return new Response(JSON.stringify({ error: 'अवैध विनंती' }), { status: 400 });
        }
        const next = await this.applyStepChange(msg);
        return new Response(JSON.stringify(next), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // साधा GET — डीबग/health-check साठी सध्याची स्थिती परत करतो (WebSocket नसलेल्या क्लायंटसाठी fallback)
      return new Response(JSON.stringify(this.getState()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const role = url.searchParams.get('role') === 'controller' ? 'controller' : 'audience';
    const viewerId = url.searchParams.get('viewerId') || '';
    const name = url.searchParams.get('name') || '';

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ role, viewerId, name });

    // नवीन जोडणीला लगेच सध्याची स्थिती पाठवा (पूर्ण state — reconnect/नवीन दर्शकासाठी हाच "sync now" चा क्षण)
    const state = this.getState();
    server.send(JSON.stringify({ type: 'state', ...state }));

    if (role === 'audience') {
      this.broadcastViewers();
    } else {
      // नियंत्रक जोडला गेल्यावर त्यालाही सध्याची दर्शक-यादी लगेच कळू द्या
      server.send(JSON.stringify({ type: 'viewers', viewers: this.listViewers() }));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  // भूमिकेनुसार (controller/audience) सध्या उघड्या WebSocket जोडण्या गाळून काढणे —
  // Hibernation API मध्ये tag-आधारित lookup ऐवजी प्रत्येक सॉकेटच्या attachment वरून भूमिका वाचतो
  socketsByRole(role) {
    return this.ctx.getWebSockets().filter((ws) => ws.deserializeAttachment()?.role === role);
  }

  listViewers() {
    return this.socketsByRole('audience')
      .map((ws) => ws.deserializeAttachment())
      .filter((a) => a && a.viewerId)
      .map((a) => ({ viewerId: a.viewerId, name: a.name }));
  }

  broadcastViewers() {
    const payload = JSON.stringify({ type: 'viewers', viewers: this.listViewers() });
    for (const ws of this.socketsByRole('controller')) {
      try {
        ws.send(payload);
      } catch (err) {
        // बंद झालेली जोडणी — दुर्लक्ष करा, webSocketClose हाताळेल
      }
    }
  }

  // नवीन पायरी-स्थिती लागू करणे — WebSocket संदेश आणि plain HTTP POST दोन्ही मार्गांनी इथेच येतात
  async applyStepChange(msg) {
    const prev = this.getState();
    // Out-of-order संदेश टाळण्यासाठी — जुना (stale) संदेश नवीन स्थिती overwrite करणार नाही
    if (prev.updatedAt && msg.updatedAt && msg.updatedAt < prev.updatedAt) return prev;

    const next = {
      found: true,
      sectionIdx: msg.sectionIdx,
      stepIdx: msg.stepIdx,
      panchangData: msg.panchangData ?? prev.panchangData,
      hostData: msg.hostData ?? prev.hostData,
      updatedAt: msg.updatedAt || Date.now(),
      status: msg.status || prev.status || 'performing',
      mediaTarget: msg.mediaTarget !== undefined ? msg.mediaTarget : prev.mediaTarget,
      volume: msg.volume !== undefined ? msg.volume : prev.volume,
    };
    this.saveState(next);

    // सर्व दर्शकांना तात्काळ कळवा — हाच "server push"
    const payload = JSON.stringify({ type: 'state', ...next });
    for (const audienceWs of this.socketsByRole('audience')) {
      try {
        audienceWs.send(payload);
      } catch (err) {
        // बंद झालेली जोडणी — दुर्लक्ष करा
      }
    }

    // कायमस्वरूपी पूजा-यादीत (D1) प्रगती प्रतिबिंबित करणे — best-effort
    if (this.env.POOJAS_DB && msg.code) {
      try {
        await this.env.POOJAS_DB.prepare(
          `UPDATE poojas SET status=?, section_idx=?, step_idx=?, media_target=?, volume=?, updated_at=? WHERE code=?`
        )
          .bind(next.status, next.sectionIdx, next.stepIdx, next.mediaTarget, next.volume, next.updatedAt, msg.code)
          .run();
      } catch (err) {
        // D1 अद्ययावत करता आले नाही तरी live-सिंक थांबू नये
      }
    }

    return next;
  }

  async webSocketMessage(ws, message) {
    let msg;
    try {
      msg = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    } catch (err) {
      return;
    }

    if (msg.type === 'stepChange') {
      await this.applyStepChange(msg);
    } else if (msg.type === 'syncRequest') {
      // दर्शकाने मॅन्युअली "आत्ता जुळवा" दाबले — त्यालाच पुन्हा सध्याची स्थिती पाठवा
      ws.send(JSON.stringify({ type: 'state', ...this.getState() }));
    }
  }

  webSocketClose(ws, code, reason, wasClean) {
    const attachment = ws.deserializeAttachment();
    if (attachment?.role === 'audience') {
      this.broadcastViewers();
    }
  }

  webSocketError(ws, error) {
    this.webSocketClose(ws);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (!code) {
      return new Response('कोड आवश्यक आहे (?code=1234)', { status: 400 });
    }
    const id = env.PUJA_ROOM.idFromName(code);
    const stub = env.PUJA_ROOM.get(id);
    return stub.fetch(request);
  },
};
