export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/create' && request.method === 'POST') {
      const code = await generateUniqueCode(env.MINDI_SYNC);
      const initial = {
        version: 0,
        updatedAt: Date.now(),
        tasks: null,
        completedTasks: {},
        weeklyTasks: null,
        taskMeta: {},
        roomMeta: {},
        highFives: [],
      };
      await env.MINDI_SYNC.put(`state:${code}`, JSON.stringify(initial));
      return json({ code }, corsHeaders);
    }

    const stateMatch = url.pathname.match(/^\/state\/([A-Z0-9]{6})$/i);
    if (stateMatch) {
      const code = stateMatch[1].toUpperCase();

      if (request.method === 'GET') {
        const stored = await env.MINDI_SYNC.get(`state:${code}`);
        if (!stored) {
          return json({ error: 'Household not found' }, corsHeaders, 404);
        }
        return json(JSON.parse(stored), corsHeaders);
      }

      if (request.method === 'PUT') {
        const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
        if (contentLength > 262144) {
          return json({ error: 'Payload too large' }, corsHeaders, 413);
        }

        let incoming;
        try {
          incoming = await request.json();
        } catch {
          return json({ error: 'Invalid JSON' }, corsHeaders, 400);
        }

        const storedRaw = await env.MINDI_SYNC.get(`state:${code}`);
        if (!storedRaw) {
          return json({ error: 'Household not found' }, corsHeaders, 404);
        }

        const stored = JSON.parse(storedRaw);
        const merged = mergeState(stored, incoming);
        await env.MINDI_SYNC.put(`state:${code}`, JSON.stringify(merged));
        return json(merged, corsHeaders);
      }
    }

    return json({ error: 'Not found' }, corsHeaders, 404);
  },
};

function json(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateUniqueCode(kv) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = '';
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    const existing = await kv.get(`state:${code}`);
    if (!existing) return code;
  }
  throw new Error('Could not generate unique code');
}

function mergeState(local, incoming) {
  const mergedTaskMeta = mergeMetaMaps(local.taskMeta || {}, incoming.taskMeta || {});
  const mergedRoomMeta = mergeMetaMaps(local.roomMeta || {}, incoming.roomMeta || {});
  const mergedHighFives = mergeHighFives(local.highFives || [], incoming.highFives || []);

  const tasks = mergeTasks(
    local.tasks,
    incoming.tasks,
    mergedTaskMeta,
    mergedRoomMeta
  );

  const completedTasks = mergeCompletions(
    local.completedTasks || {},
    incoming.completedTasks || {}
  );

  const weeklyTasks = mergeWeekly(
    local.weeklyTasks,
    incoming.weeklyTasks
  );

  return {
    version: Math.max(local.version || 0, incoming.version || 0) + 1,
    updatedAt: Date.now(),
    tasks,
    completedTasks,
    weeklyTasks,
    taskMeta: mergedTaskMeta,
    roomMeta: mergedRoomMeta,
    highFives: mergedHighFives,
  };
}

function mergeHighFives(a, b) {
  const ids = new Set([...a.map(h => h.id), ...b.map(h => h.id)]);
  const map = new Map();
  [...a, ...b].forEach(h => map.set(h.id, h));
  return Array.from(ids).map(id => map.get(id)).sort((x, y) => x.at - y.at).slice(-50);
}

function mergeMetaMaps(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = {};
  for (const key of keys) {
    const va = a[key];
    const vb = b[key];
    if (!va) {
      out[key] = vb;
      continue;
    }
    if (!vb) {
      out[key] = va;
      continue;
    }
    const aTime = va.updatedAt || va.deletedAt || 0;
    const bTime = vb.updatedAt || vb.deletedAt || 0;
    if (aTime === bTime) {
      out[key] = va.deletedAt && vb.deletedAt ? va : va.deletedAt ? vb : va;
    } else {
      out[key] = aTime > bTime ? va : vb;
    }
  }
  return out;
}

function mergeTasks(localTasks, remoteTasks, taskMeta, roomMeta) {
  if (!localTasks) return remoteTasks;
  if (!remoteTasks) return localTasks;

  const roomNames = new Set([...Object.keys(localTasks), ...Object.keys(remoteTasks)]);
  const merged = {};

  for (const room of roomNames) {
    const rm = roomMeta[room];
    if (rm && rm.deletedAt) continue;

    const localRoom = localTasks[room];
    const remoteRoom = remoteTasks[room];
    if (!localRoom) {
      merged[room] = remoteRoom;
      continue;
    }
    if (!remoteRoom) {
      merged[room] = localRoom;
      continue;
    }

    const localUpdated = localRoom.updatedAt || 0;
    const remoteUpdated = remoteRoom.updatedAt || 0;
    const baits =
      localUpdated >= remoteUpdated ? localRoom.baits : remoteRoom.baits;

    const taskSet = new Map();
    const addTasks = (list, sourceUpdatedAt) => {
      for (const text of list || []) {
        const id = `${room}-${text}`;
        const meta = taskMeta[id];
        if (meta && meta.deletedAt) continue;
        const existing = taskSet.get(text);
        if (!existing || sourceUpdatedAt >= existing.updatedAt) {
          taskSet.set(text, { text, updatedAt: sourceUpdatedAt });
        }
      }
    };

    addTasks(localRoom.tasks, localUpdated);
    addTasks(remoteRoom.tasks, remoteUpdated);

    merged[room] = {
      tasks: Array.from(taskSet.values()).map((t) => t.text),
      baits: baits ?? 0,
      updatedAt: Math.max(localUpdated, remoteUpdated, Date.now()),
    };
  }

  return merged;
}

function mergeCompletions(local, remote) {
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const out = {};
  for (const key of keys) {
    const lv = local[key];
    const rv = remote[key];
    if (!lv) {
      if (rv) out[key] = rv;
      continue;
    }
    if (!rv) {
      out[key] = lv;
      continue;
    }
    const lt = typeof lv === 'string' ? Date.parse(lv) : lv.updatedAt || 0;
    const rt = typeof rv === 'string' ? Date.parse(rv) : rv.updatedAt || 0;
    if (lt >= rt) {
      out[key] = typeof lv === 'string' ? lv : lv;
    } else {
      out[key] = typeof rv === 'string' ? rv : rv;
    }
  }
  return out;
}

function mergeWeekly(local, remote) {
  if (!local) return remote;
  if (!remote) return local;

  const localUpdated = local.updatedAt || 0;
  const remoteUpdated = remote.updatedAt || 0;
  return localUpdated >= remoteUpdated ? local : remote;
}
