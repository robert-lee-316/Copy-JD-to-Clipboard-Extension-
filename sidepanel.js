const fields = ["platform", "companyName", "jobTitle", "method", "JD"];
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
  const payload = getPayload();

  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      platform: payload.platform,
      companyName: payload.companyName,
      jobTitle: payload.jobTitle,
      jobLink: payload.jobLink,
      method: payload.method,
      JD: payload.JD
    }
  });
}

function clearFieldsForNewJobLink() {
  $("companyName").value = "";
  $("jobTitle").value = "";
  $("method").value = "Apply";
  $("JD").value = "";
}

async function getCurrentPageUrl() {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  const activeTab = tabs?.[0];

  if (!activeTab?.id) {
    return "";
  }

  try {
    const result = await chrome.scripting.executeScript({
      target: {
        tabId: activeTab.id
      },
      func: () => window.location.href
    });

    return result?.[0]?.result || activeTab.url || "";
  } catch (error) {
    console.warn("Could not read page URL directly. Using tab URL instead.", error);
    return activeTab.url || "";
  }
}

async function refreshJobLink(showStatus = false, clearOnChange = true) {
  try {
    const oldUrl = $("jobLink").value.trim();
    const newUrl = await getCurrentPageUrl();

    if (clearOnChange && oldUrl && newUrl && oldUrl !== newUrl) {
      clearFieldsForNewJobLink();
      setStatus("Job link changed. Form cleared.");
    }

    $("jobLink").value = newUrl;

    renderPreview();
    await saveForm();

    if (showStatus) {
      if (newUrl) {
        setStatus("Current page link updated.");
      } else {
        setStatus("Could not catch current page link.", true);
      }
    }
  } catch (error) {
    console.error(error);
    $("jobLink").value = "";
    renderPreview();

    if (showStatus) {
      setStatus("Could not catch current page link.", true);
    }
  }
}

async function loadForm() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const saved = result[STORAGE_KEY];

  if (saved) {
    if (saved.platform !== undefined) $("platform").value = saved.platform;
    if (saved.companyName !== undefined) $("companyName").value = saved.companyName;
    if (saved.jobTitle !== undefined) $("jobTitle").value = saved.jobTitle;
    if (saved.jobLink !== undefined) $("jobLink").value = saved.jobLink;
    if (saved.method !== undefined) $("method").value = saved.method;
    if (saved.JD !== undefined) $("JD").value = saved.JD;
  }

  await refreshJobLink(false, true);
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
  await refreshJobLink(false, true);

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
  clearFieldsForNewJobLink();

  await chrome.storage.local.remove(STORAGE_KEY);
  await refreshJobLink(false, false);
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

$("refreshBtn").addEventListener("click", async () => {
  await refreshJobLink(true, true);
  renderPreview();
});

chrome.tabs.onActivated.addListener(() => {
  refreshJobLink(false, true);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    refreshJobLink(false, true);
  }
});

chrome.windows.onFocusChanged.addListener(() => {
  refreshJobLink(false, true);
});

loadForm().catch((error) => {
  console.error(error);
  renderPreview();
});