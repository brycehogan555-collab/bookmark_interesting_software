# bookmark_interesting_software

A lightweight personal bookmark app that you can download and run locally on your computer.

## What this project does

- Provides a **home page** with section cards (Work, Learning, Shopping, Personal).
- Lets you open a section to see and use webpage bookmarks.
- Lets you add your own bookmarks and save them in your browser.
- Lets you import bookmarks from a **Safari-exported bookmarks HTML file**.

## Run locally

This is a static app (no install required). You can:

1. Clone or download this repository.
2. Open `/home/runner/work/bookmark_interesting_software/bookmark_interesting_software/index.html` in your browser.

Optional local server:

```bash
cd /home/runner/work/bookmark_interesting_software/bookmark_interesting_software
python -m http.server 8000
```

Then open: `http://localhost:8000`

## Safari bookmarks import

1. In Safari, export your bookmarks as an HTML file.
2. In this app, use **Import Safari Bookmarks (HTML)**.
3. Choose the exported file.
4. Imported bookmarks are grouped by folder/section when possible.

## Notes

- Bookmark data is stored locally using browser `localStorage`.
- No external services are required.
