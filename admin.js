const form = document.querySelector("#post-form");
const statusEl = document.querySelector("#status");
const publishButton = document.querySelector("#publish");
const passwordInput = document.querySelector("#password");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = passwordInput.value;
  const title = document.querySelector("#title").value.trim();
  const body = document.querySelector("#body").value.trim();

  if (!password || !title || !body) {
    statusEl.textContent = "Kérlek, töltsd ki mindhárom mezőt.";
    return;
  }

  publishButton.disabled = true;
  statusEl.textContent = "Közzététel folyamatban…";

  try {
    const response = await fetch("/.netlify/functions/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${password}`
      },
      body: JSON.stringify({ title, body })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      statusEl.textContent = response.status === 401
        ? "A szerkesztői jelszó nem megfelelő."
        : (result.error || "Nem sikerült közzétenni. Próbáld újra később.");
      return;
    }

    form.reset();
    statusEl.textContent = "Sikerült! A bejegyzés elküldve. Rövidesen megjelenik a főoldalon.";
  } catch {
    statusEl.textContent = "Nem sikerült kapcsolódni. Ellenőrizd az internetkapcsolatot.";
  } finally {
    publishButton.disabled = false;
  }
});