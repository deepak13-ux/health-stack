const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
const TOKEN_KEY = "careflow.api.token";

export async function request(path, { method = "GET", body } = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Check that the backend is running.",
    );
  }
  const contentType = response.headers?.get("content-type");
  const data = response.status === 204 ? null
    : contentType && !contentType.includes("application/json") ? null
    : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !path.endsWith("/login")) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("careflow:unauthorized"));
    }
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((error) => error.msg).join(" ")
      : data?.detail;
    throw new Error((detail && !["Not Found", "Method Not Allowed", "Not Implemented"].includes(detail) ? detail : null) || ([404, 405, 501].includes(response.status)
      ? "This workflow is not supported by the server yet. Contact the project administrator."
      : `Request failed (${response.status}).`));
  }
  if (response.status !== 204 && data === null) {
    throw new Error("The server returned an invalid response. Check the API URL and retry.");
  }
  return data;
}

export async function getSession() {
  if (!sessionStorage.getItem(TOKEN_KEY)) return null;
  return request("/auth/me");
}
async function authenticate(path, body) {
  const session = await request(path, { method: "POST", body });
  sessionStorage.setItem(TOKEN_KEY, session.token);
  return session.user;
}
export const login = (email, password, role = "patient") => authenticate("/auth/login", { email, password, role });
export const registerPatient = (data) => authenticate("/patients/register", data);
export async function logout() {
  try { await request("/auth/session", { method: "DELETE", body: { token: sessionStorage.getItem(TOKEN_KEY) } }); }
  finally { sessionStorage.removeItem(TOKEN_KEY); }
}
export const listDoctors = () => request("/doctors");
export const listDepartments = () => request("/departments");
export const getSlots = (id, date) => request(`/doctors/${encodeURIComponent(id)}/slots?${new URLSearchParams({ date })}`);
export const bookAppointment = (data) => request("/appointments", { method: "POST", body: data });
export const listAppointments = () => request("/appointments");
export const startAppointment = (id) => request(`/appointments/${encodeURIComponent(id)}/start`, { method: "POST" });
export const listMedicines = () => request("/medicines");
export const completeAppointment = (id, data) => request(`/appointments/${encodeURIComponent(id)}/complete`, { method: "POST", body: data });
export const listPrescriptions = () => request("/prescriptions");
export const listBills = () => request("/bills");
export const getPharmacy = () => request("/pharmacy");
export const payBill = (id, method) => request(`/bills/${encodeURIComponent(id)}/payments`, { method: "POST", body: { method } });
