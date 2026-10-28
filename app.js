const STORAGE_KEY = "bookmarkHubData";
const DEFAULT_DATA = {
  Work: [],
  Learning: [],
  Shopping: [],
  Personal: []
};

const sectionsGrid = document.getElementById("sectionsGrid");
const bookmarksList = document.getElementById("bookmarksList");
const activeSectionTitle = document.getElementById("activeSectionTitle");
const sectionCardTemplate = document.getElementById("sectionCardTemplate");
const bookmarkItemTemplate = document.getElementById("bookmarkItemTemplate");
const bookmarkForm = document.getElementById("bookmarkForm");
const sectionInput = document.getElementById("sectionInput");
const titleInput = document.getElementById("titleInput");
const urlInput = document.getElementById("urlInput");
const importFile = document.getElementById("importFile");

let bookmarkData = loadData();
let activeSection = Object.keys(bookmarkData)[0] || "Work";

render();

bookmarkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const section = sanitizeSection(sectionInput.value);
  const title = titleInput.value.trim();
  const url = normalizeUrl(urlInput.value.trim());

  if (!section || !title || !url) {
    return;
  }

  if (!bookmarkData[section]) {
    bookmarkData[section] = [];
  }

  bookmarkData[section].push({ title, url });
  activeSection = section;
  persistData();
  render();
  bookmarkForm.reset();
});

importFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const html = await file.text();
  const parsed = parseSafariBookmarks(html);
  if (Object.keys(parsed).length === 0) {
    importFile.value = "";
    return;
  }

  for (const [section, bookmarks] of Object.entries(parsed)) {
    if (!bookmarkData[section]) {
      bookmarkData[section] = [];
    }
    bookmarkData[section].push(...bookmarks);
  }

  activeSection = Object.keys(parsed)[0];
  persistData();
  render();
  importFile.value = "";
});

function render() {
  renderSections();
  renderBookmarks();
}

function renderSections() {
  sectionsGrid.replaceChildren();
  for (const sectionName of Object.keys(bookmarkData)) {
    const card = sectionCardTemplate.content.firstElementChild.cloneNode(true);
    card.textContent = `${sectionName} (${bookmarkData[sectionName].length})`;
    card.classList.toggle("active", sectionName === activeSection);
    card.addEventListener("click", () => {
      activeSection = sectionName;
      render();
    });
    sectionsGrid.append(card);
  }
}

function renderBookmarks() {
  const sectionName = bookmarkData[activeSection] ? activeSection : Object.keys(bookmarkData)[0];
  activeSection = sectionName || "Work";
  activeSectionTitle.textContent = `Bookmarks: ${activeSection}`;
  bookmarksList.replaceChildren();
  const items = bookmarkData[activeSection] || [];

  for (const bookmark of items) {
    const listItem = bookmarkItemTemplate.content.firstElementChild.cloneNode(true);
    const link = listItem.querySelector("a");
    link.textContent = bookmark.title;
    link.href = bookmark.url;
    bookmarksList.append(listItem);
  }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_DATA);
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return structuredClone(DEFAULT_DATA);
    }

    return normalizeData(parsed);
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function normalizeData(input) {
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    const section = sanitizeSection(key);
    if (!section || !Array.isArray(value)) {
      continue;
    }
    output[section] = value
      .map((entry) => ({
        title: typeof entry?.title === "string" ? entry.title.trim() : "",
        url: typeof entry?.url === "string" ? entry.url.trim() : ""
      }))
      .filter((entry) => entry.title && isSafeUrl(entry.url))
      .map((entry) => ({ title: entry.title, url: normalizeUrl(entry.url) }));
  }

  if (Object.keys(output).length === 0) {
    return structuredClone(DEFAULT_DATA);
  }
  return output;
}

function persistData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkData));
}

function sanitizeSection(section) {
  return section.trim().replace(/\s+/g, " ").slice(0, 50);
}

function isSafeUrl(candidate) {
  try {
    const parsed = new URL(normalizeUrl(candidate));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(candidate) {
  if (!candidate) {
    return "";
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  return `https://${candidate}`;
}

function parseSafariBookmarks(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const sections = {};
  const folderHeaders = Array.from(doc.querySelectorAll("h3"));

  for (const header of folderHeaders) {
    const section = sanitizeSection(header.textContent || "");
    if (!section) {
      continue;
    }

    const bookmarks = [];
    let next = header.parentElement?.nextElementSibling;
    if (!next || next.tagName !== "DL") {
      next = header.nextElementSibling;
    }
    if (!next || next.tagName !== "DL") {
      continue;
    }

    const links = Array.from(next.querySelectorAll("a[href]"));
    for (const link of links) {
      const title = (link.textContent || "").trim();
      const href = (link.getAttribute("href") || "").trim();
      if (!title || !isSafeUrl(href)) {
        continue;
      }
      bookmarks.push({ title, url: normalizeUrl(href) });
    }

    if (bookmarks.length > 0) {
      sections[section] = bookmarks;
    }
  }

  if (Object.keys(sections).length > 0) {
    return sections;
  }

  const fallbackLinks = Array.from(doc.querySelectorAll("a[href]"));
  if (fallbackLinks.length === 0) {
    return sections;
  }

  sections.Imported = fallbackLinks
    .map((link) => ({
      title: (link.textContent || "").trim(),
      url: (link.getAttribute("href") || "").trim()
    }))
    .filter((bookmark) => bookmark.title && isSafeUrl(bookmark.url))
    .map((bookmark) => ({ title: bookmark.title, url: normalizeUrl(bookmark.url) }));
  return sections;
}
