/** Isolates localStorage parsing and serialization from app workflows. */
export function createLocalPersistence({
  storage,
  key,
  timerKey,
  authKey,
  ownerKey,
  normalize,
}) {
  function readJson(storageKey, fallback) {
    try {
      const value = storage.getItem(storageKey);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function writeJson(storageKey, value) {
    try {
      storage.setItem(storageKey, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function readText(storageKey, fallback) {
    try {
      const value = storage.getItem(storageKey);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }
  function writeText(storageKey, value) {
    try {
      storage.setItem(storageKey, value);
      return true;
    } catch {
      return false;
    }
  }

  return {
    readText,
    writeText,
    readJson,
    writeJson,
    loadState() {
      return normalize(readJson(key, null));
    },
    saveState(state) {
      return writeJson(key, state);
    },
    loadTimer() {
      let timer = readJson(timerKey, null);
      if (!timer || typeof timer.acc !== "number")
        timer = { on: 0, t0: 0, acc: 0, x: "" };
      if (timer.on && Date.now() - timer.t0 > 12 * 36e5)
        timer = { on: 0, t0: 0, acc: 0, x: timer.x || "" };
      return timer;
    },
    saveTimer(timer) {
      return writeJson(timerKey, timer);
    },
    loadAuth() {
      const auth = readJson(authKey, null);
      return auth && auth.uid && auth.rt && auth.em ? auth : null;
    },
    saveAuth(auth) {
      try {
        if (auth) storage.setItem(authKey, JSON.stringify(auth));
        else storage.removeItem(authKey);
      } catch {
        return false;
      }
      return true;
    },
    getOwnerId() {
      try {
        return storage.getItem(ownerKey);
      } catch {
        return null;
      }
    },
    setOwnerId(ownerId) {
      try {
        storage.setItem(ownerKey, ownerId);
        return true;
      } catch {
        return false;
      }
    },
  };
}
