// All API calls use a RELATIVE path (/api/...). The host's NGINX reverse proxy
// routes /api/ to the backend container, so the frontend never needs to know
// the backend's IP or port. This is what makes the same build work locally
// and on EC2 unchanged.
const API = "/api";

const form = document.getElementById("user-form");
const statusEl = document.getElementById("status");
const tbody = document.getElementById("users-body");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadUsers() {
  try {
    const res = await fetch(`${API}/users`);
    const users = await res.json();
    if (!Array.isArray(users) || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">No users yet.</td></tr>';
      return;
    }
    tbody.innerHTML = users
      .map(
        (u) => `<tr>
          <td>${u.id}</td>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${new Date(u.created_at).toLocaleString()}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Could not reach the API.</td></tr>';
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  statusEl.textContent = "Saving…";
  try {
    const res = await fetch(`${API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Save failed");
    }
    statusEl.textContent = "Saved!";
    form.reset();
    loadUsers();
    setTimeout(() => (statusEl.textContent = ""), 2000);
  } catch (err) {
    statusEl.textContent = err.message;
  }
});

loadUsers();
