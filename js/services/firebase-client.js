/** Firebase Identity Toolkit and Firestore HTTP adapter. */
const API_KEY = "AIzaSyAzB2_h5LbPKQcns7TXugxCzH0qD8ZNiqA";
const PROJECT_ID = "life-tracker-ee2f0";
const FIRESTORE_BASE =
  "https://firestore.googleapis.com/v1/projects/" +
  PROJECT_ID +
  "/databases/(default)/documents";
export function createFirebaseClient({
  readAuth,
  saveAuth,
  onAuthExpired,
  fetchImpl = (...args) => fetch(...args),
}) {
  let token = "";
  let tokenExpires = 0;
  function fetchJson(url, options) {
    return fetchImpl(url, options).then((response) =>
      response.text().then((text) => {
        let json = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch {}
        if (!response.ok) {
          const code =
            (json.error && (json.error.message || json.error.status)) ||
            "HTTP " + response.status;
          throw { code: String(code), http: response.status };
        }
        return json;
      }),
    );
  }
  function identity(path, body) {
    return fetchJson(
      "https://identitytoolkit.googleapis.com/v1/" + path + "?key=" + API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  }
  function setSession(response) {
    token = response.idToken;
    tokenExpires = Date.now() + (+response.expiresIn || 3600) * 1000;
  }
  function clearSession() {
    token = "";
    tokenExpires = 0;
  }
  function getToken() {
    if (token && Date.now() < tokenExpires - 60000)
      return Promise.resolve(token);
    const auth = readAuth();
    if (!auth) return Promise.reject({ code: "NO_AUTH" });
    return fetchJson(
      "https://securetoken.googleapis.com/v1/token?key=" + API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:
          "grant_type=refresh_token&refresh_token=" +
          encodeURIComponent(auth.rt),
      },
    ).then(
      (json) => {
        token = json.id_token;
        tokenExpires = Date.now() + (+json.expires_in || 3600) * 1000;
        if (json.refresh_token && json.refresh_token !== auth.rt) {
          auth.rt = json.refresh_token;
          saveAuth();
        }
        return token;
      },
      (error) => {
        if (
          /TOKEN_EXPIRED|INVALID_REFRESH_TOKEN|USER_NOT_FOUND|USER_DISABLED|INVALID_GRANT/.test(
            (error && error.code) || "",
          )
        )
          onAuthExpired();
        throw error;
      },
    );
  }
  function request(method, path, body) {
    return getToken().then((currentToken) =>
      fetchJson(FIRESTORE_BASE + path, {
        method,
        headers: {
          Authorization: "Bearer " + currentToken,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  }
  return { identity, setSession, clearSession, getToken, request };
}
