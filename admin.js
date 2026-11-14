const form = document.querySelector("#post-form");
const statusEl = document.querySelector("#status");
const publishButton = document.querySelector("#publish");
const passwordInput = document.querySelector("#password");
const photoInput = document.querySelector("#photo");
const photoPreview = document.querySelector("#photo-preview");

photoInput?.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) {
    photoPreview.removeAttribute("src");
    photoPreview.style.display = "none";
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024) {
    photoInput.value = "";
    photoPreview.removeAttribute("src");
    photoPreview.style.display = "none";
    statusEl.textContent = "JPG, PNG vagy WebP képet válassz, legfeljebb 5 MB méretben.";
    return;
  }
  photoPreview.src = URL.createObjectURL(file);
  photoPreview.style.display = "block";
  statusEl.textContent = "";
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = passwordInput.value;
  const title = document.querySelector("#title").value.trim();
  const body = document.querySelector("#body").value.trim();
  const photo = photoInput.files?.[0];

  if (!password || !title || !body) {
    statusEl.textContent = "Kérlek, töltsd ki a jelszó, cím és szöveg mezőt.";
    return;
  }
  if (photo && (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size > 4 * 1024 * 1024)) {
    statusEl.textContent = "A fénykép nem megfelelő. JPG, PNG vagy WebP legyen, legfeljebb 5 MB.";
    return;
  }

  publishButton.disabled = true;
  statusEl.textContent = "Közzététel folyamatban…";
  try {
    let image;
    if (photo) {
      const bytes = new Uint8Array(await photo.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      image = { name: photo.name, type: photo.type, base64: btoa(binary) };
    }
    const response = await fetch("/.netlify/functions/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${password}` },
      body: JSON.stringify({ title, body, image })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      statusEl.textContent = response.status === 401 ? "A szerkesztői jelszó nem megfelelő." : (result.error || "Nem sikerült közzétenni. Próbáld újra később.");
      return;
    }
    form.reset();
    photoPreview.removeAttribute("src");
    photoPreview.style.display = "none";
    statusEl.textContent = "Sikerült! A bejegyzés elküldve, és rövidesen megjelenik a főoldalon.";
  } catch {
    statusEl.textContent = "Nem sikerült kapcsolódni. Ellenőrizd az internetkapcsolatot.";
  } finally {
    publishButton.disabled = false;
  }
});