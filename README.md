# Job Description Clipboard Builder

Chrome Manifest V3 extension that opens as a right-side panel.

## What it does

- Lets you manually enter job information.
- Lets you select the platform from a dropdown.
- Builds this JSON format:

```json
{
  "platform": "Linkedin",
  "companyName": "EITACIES Inc.",
  "jobTitle": "ReactJS Frontend Developer",
  "jobLink": "https://www.linkedin.com/jobs/...",
  "method": "Apply",
  "JD": "Full job description here"
}
```

- Copies the formatted JSON to your clipboard.
- Saves the last input locally inside Chrome extension storage.

## Install locally

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select this extension folder.
6. Click the extension icon to open the right side panel.
