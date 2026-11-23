/** Firestore shard sync and merge workflow. */
export function createFirebaseSync({
  client,
  getAuth,
  getState,
  setState,
  normalize,
  saveLocal,
  setStatus,
  afterLoad,
  render,
  isEditing,
  setPending,
}) {
  let sent = {};
  let versions = {};
  let timer = null;
  let poll = null;
  let firstSnapshot = false;
  let subscribed = false;
  let pulling = false;
  let lastUpdate = 0;
  let lastPull = 0;
  let syncListenersBound = false;

  function shardsOf(state) {
    const shards = {};
    const core = Object.assign({}, state);
    delete core.days;
    delete core.reports;
    core.money = Object.assign({}, state.money);
    delete core.money.log;
    shards.core = core;
    Object.keys(state.days).forEach((key) => {
      shards["d-" + key] = state.days[key];
    });
    state.money.log.forEach((entry) => {
      const id = "m-" + entry.d.slice(0, 7);
      (shards[id] = shards[id] || []).push(entry);
    });
    Object.keys(state.reports).forEach((week) => {
      const id = "r-" + week.slice(0, 4);
      (shards[id] = shards[id] || {})[week] = state.reports[week];
    });
    return shards;
  }

  function applyRemote(id, serialized) {
    let incoming;
    try {
      incoming = JSON.parse(serialized);
    } catch {
      return false;
    }
    let state = getState();
    if (id === "core") {
      const merged = Object.assign({}, incoming);
      const moneyLog = state.money.log;
      merged.days = state.days;
      merged.reports = state.reports;
      merged.money = Object.assign({}, incoming.money || {});
      merged.money.log = moneyLog;
      if (
        incoming.money &&
        Array.isArray(incoming.money.log) &&
        incoming.money.log.length
      ) {
        incoming.money.log.forEach((entry) => {
          if (
            !moneyLog.some(
              (item) =>
                item.d === entry.d &&
                item.a === entry.a &&
                item.n === entry.n &&
                item.k === entry.k,
            )
          )
            moneyLog.push(entry);
        });
      }
      setState(normalize(merged));
    } else if (id.slice(0, 2) === "r-") Object.assign(state.reports, incoming);
    else if (id.slice(0, 2) === "d-") state.days[id.slice(2)] = incoming;
    else if (id.slice(0, 2) === "m-") {
      const month = id.slice(2);
      state.money.log = state.money.log
        .filter((entry) => entry.d.slice(0, 7) !== month)
        .concat(incoming);
    } else return false;
    return true;
  }

  function onSnapshot(snapshot) {
    const isFirst = !firstSnapshot;
    let dirty = false;
    firstSnapshot = true;
    const changes = snapshot.docChanges
      ? snapshot.docChanges()
      : snapshot.docs.map((doc) => ({ type: "added", doc }));
    changes.forEach((change) => {
      let state = getState();
      const doc = change.doc;
      const id = doc.id;
      const value = doc.data() || {};
      if (change.type === "removed") {
        if (
          id.slice(0, 2) === "d-" &&
          state.days[id.slice(2)] &&
          (!versions[id] || versions[id] < (value.t || 0))
        ) {
          delete state.days[id.slice(2)];
          delete sent[id];
          versions[id] = value.t || 0;
          dirty = true;
        }
        return;
      }
      if (value.j === undefined || sent[id] === value.j) return;
      if (versions[id] && value.t && value.t < versions[id]) return;
      if (applyRemote(id, value.j)) {
        sent[id] = value.j;
        versions[id] = value.t || 0;
        dirty = true;
      }
    });
    if (isFirst || sent.__force) {
      delete sent.__force;
      push();
    }
    setStatus("Synced across your devices");
    afterLoad();
    if (dirty) {
      saveLocal();
      if (isEditing()) setPending();
      else render();
    }
  }

  function setDocument(id, serialized, timestamp) {
    const auth = getAuth();
    return client.request("PATCH", "/users/" + auth.uid + "/docs/" + id, {
      fields: {
        p: { stringValue: serialized },
        u: { integerValue: String(timestamp) },
      },
    });
  }

  function errorStatus(error) {
    return error && error.http === 403
      ? "Sync was refused by the server."
      : "Sync paused. Saved on this device.";
  }

  function push() {
    if (!getAuth() || !subscribed) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!getAuth() || !subscribed) return;
      const shards = shardsOf(getState());
      const jobs = [];
      Object.keys(shards).forEach((id) => {
        const serialized = JSON.stringify(shards[id]);
        if (sent[id] === serialized) return;
        sent[id] = serialized;
        const timestamp = Date.now();
        versions[id] = timestamp;
        jobs.push(
          setDocument(id, serialized, timestamp).then(
            () => {
              if (timestamp > lastUpdate) lastUpdate = timestamp;
            },
            (error) => {
              delete sent[id];
              throw error;
            },
          ),
        );
      });
      Object.keys(sent).forEach((id) => {
        if (id !== "core" && id !== "__force" && !(id in shards)) {
          delete sent[id];
          const timestamp = Date.now();
          versions[id] = timestamp;
          jobs.push(setDocument(id, "", timestamp).catch(() => {}));
        }
      });
      if (!jobs.length) return;
      Promise.all(jobs).then(
        () => setStatus("Synced across your devices"),
        (error) => setStatus(errorStatus(error)),
      );
    }, 4000);
  }

  function pull() {
    const auth = getAuth();
    if (!auth || pulling) return Promise.resolve();
    pulling = true;
    const since = Math.max(0, lastUpdate - 300000);
    return client
      .request("POST", "/users/" + auth.uid + ":runQuery", {
        structuredQuery: {
          from: [{ collectionId: "docs" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "u" },
              op: "GREATER_THAN",
              value: { integerValue: String(since) },
            },
          },
          orderBy: [{ field: { fieldPath: "u" }, direction: "ASCENDING" }],
        },
      })
      .then((rows) => {
        const list = [];
        (rows || []).forEach((row) => {
          const document = row.document;
          if (!document) return;
          const fields = document.fields || {};
          const id = document.name.split("/").pop();
          const serialized = fields.p && fields.p.stringValue;
          const timestamp = fields.u && +fields.u.integerValue;
          if (serialized === undefined || !(timestamp >= 0)) return;
          if (timestamp > lastUpdate) lastUpdate = timestamp;
          list.push({
            type: serialized === "" ? "removed" : "added",
            doc: { id, data: () => ({ j: serialized, t: timestamp }) },
          });
        });
        subscribed = true;
        lastPull = Date.now();
        onSnapshot({ docChanges: () => list });
      })
      .catch((error) => setStatus(errorStatus(error)))
      .then(() => {
        pulling = false;
      });
  }

  function startSync() {
    clearInterval(poll);
    poll = setInterval(() => {
      if (!document.hidden) pull();
    }, 180000);
    if (!syncListenersBound) {
      syncListenersBound = true;
      const refresh = () => {
        if (getAuth() && !document.hidden && Date.now() - lastPull > 30000)
          pull();
      };
      document.addEventListener("visibilitychange", refresh);
      window.addEventListener("focus", refresh);
    }
    return pull();
  }

  function syncNow() {
    setStatus("Syncing...");
    return pull().then(() => push());
  }

  function initialize() {
    afterLoad();
    if (!getAuth()) {
      setStatus("Saved on this device only");
      return Promise.resolve();
    }
    setStatus("Connecting...");
    startSync();
    return Promise.resolve();
  }

  function reset() {
    clearInterval(poll);
    clearTimeout(timer);
    subscribed = false;
    firstSnapshot = false;
    pulling = false;
    sent = {};
    versions = {};
    lastUpdate = 0;
    lastPull = 0;
  }

  return { initialize, push, pull, startSync, syncNow, reset };
}
