const fields = ["platform", "companyName", "jobTitle", "jobLink", "method", "JD"];
const STORAGE_KEY = "jdClipboardBuilderForm";

const $ = (id) => document.getElementById(id);

function getPayload() {
  return {
    platform: $("platform").value.trim(),
    companyName: $("companyName").value.trim(),
    jobTitle: $("jobTitle").value.trim(),
    jobLink: $("jobLink").value.trim(),
    method: $("method").value.trim(),
    JD: $("JD").value.trim()
  };
}

function setStatus(message, isError = false) {
  const status = $("status");
  status.textContent = message;
  status.classList.toggle("error", isError);

  if (message) {
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => {
      status.textContent = "";
      status.classList.remove("error");
    }, 2500);
  }
}

function renderPreview() {
  const jsonText = JSON.stringify(getPayload(), null, 2);
  $("preview").textContent = jsonText;
  return jsonText;
}

async function saveForm() {
  await chrome.storage.local.set({ [STORAGE_KEY]: getPayload() });
}

async function loadForm() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const saved = result[STORAGE_KEY];

  if (!saved) {
    renderPreview();
    return;
  }

  fields.forEach((field) => {
    if ($(field) && saved[field] !== undefined) {
      $(field).value = saved[field];
    }
  });

  renderPreview();
}

function validatePayload(payload) {
  const missing = [];

  if (!payload.platform) missing.push("Platform");
  if (!payload.companyName) missing.push("Company Name");
  if (!payload.jobTitle) missing.push("Job Title");
  if (!payload.jobLink) missing.push("Job Link");
  if (!payload.method) missing.push("Method");
  if (!payload.JD) missing.push("Job Description");

  return missing;
}

async function copyJson() {
  const payload = getPayload();
  const missing = validatePayload(payload);

  if (missing.length) {
    setStatus(`Missing: ${missing.join(", ")}`, true);
    return;
  }

  const jsonText = renderPreview();
  await navigator.clipboard.writeText(jsonText);
  await saveForm();
  setStatus("Copied JSON to clipboard.");
}

async function clearForm() {
  fields.forEach((field) => {
    if (field === "platform") $(field).value = "Linkedin";
    else if (field === "method") $(field).value = "Apply";
    else $(field).value = "";
  });

  await chrome.storage.local.remove(STORAGE_KEY);
  renderPreview();
  setStatus("Cleared.");
}

fields.forEach((field) => {
  $(field).addEventListener("input", async () => {
    renderPreview();
    await saveForm();
  });

  $(field).addEventListener("change", async () => {
    renderPreview();
    await saveForm();
  });
});

$("copyBtn").addEventListener("click", () => {
  copyJson().catch((error) => {
    console.error(error);
    setStatus("Could not copy. Please try again.", true);
  });
});

$("clearBtn").addEventListener("click", () => {
  clearForm().catch((error) => {
    console.error(error);
    setStatus("Could not clear form.", true);
  });
});

$("refreshBtn").addEventListener("click", renderPreview);

loadForm().catch((error) => {
  console.error(error);
  renderPreview();
});
