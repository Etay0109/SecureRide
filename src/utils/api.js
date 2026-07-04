export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    const detail = d?.detail;
    const err = new Error(typeof detail === "string" ? detail : detail?.reason || `Request failed (${res.status})`);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return res.json().catch(() => null);
}
