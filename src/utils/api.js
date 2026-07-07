function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent("auth:expired"));
}

export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    const d = await res.json().catch(() => null);
    const detail = d?.detail;
    const err = new Error(typeof detail === "string" ? detail : detail?.reason || `Request failed (${res.status})`);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return res.json().catch(() => null);
}

export async function apiBlob(path) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api${path}`, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    throw new Error(`Request failed (${res.status})`);
  }
  return res.blob();
}
