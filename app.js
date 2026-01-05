const state = {
  section: "portal",
  data: null,
  categoryIndex: 0,
  itemIndex: 0,
  filteredItems: null, // array of items currently shown in Item dropdown (after search), or null
};

const categorySelect = document.getElementById("categorySelect");
const itemSelect = document.getElementById("itemSelect");
const itemSearch = document.getElementById("itemSearch"); // NEW
const workerNotes = document.getElementById("workerNotes");
const textOutput = document.getElementById("textOutput");
const copyBtn = document.getElementById("copyBtn");
const copyStatus = document.getElementById("copyStatus");

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    state.section = btn.dataset.section;
    state.categoryIndex = 0;
    state.itemIndex = 0;

    if (itemSearch) itemSearch.value = ""; // NEW
    state.filteredItems = null; // NEW

    loadSection(state.section);
  });
});

categorySelect.addEventListener("change", () => {
  state.categoryIndex = categorySelect.selectedIndex;
  state.itemIndex = 0;

  if (itemSearch) itemSearch.value = ""; // NEW
  state.filteredItems = null; // NEW

  renderItems();
  renderOutput();
});

itemSelect.addEventListener("change", () => {
  state.itemIndex = itemSelect.selectedIndex;
  renderOutput();
});

if (itemSearch) {
  itemSearch.addEventListener("input", () => {
    state.itemIndex = 0;
    renderItems(); // will apply filter
    renderOutput();
  });
}

copyBtn.addEventListener("click", async () => {
  const text = textOutput.value || "";
  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "Copied.";
    setTimeout(() => (copyStatus.textContent = ""), 1200);
  } catch {
    textOutput.focus();
    textOutput.select();
    copyStatus.textContent = "Select text and press Ctrl+C.";
    setTimeout(() => (copyStatus.textContent = ""), 2200);
  }
});

async function loadSection(section) {
  const url = `data/${section}.json`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    state.data = null;
    categorySelect.innerHTML = "";
    itemSelect.innerHTML = "";
    workerNotes.textContent = `Could not load ${url}`;
    textOutput.value = "";
    return;
  }

  state.data = await res.json();

  // reset filter when loading a section
  state.filteredItems = null;
  if (itemSearch) itemSearch.value = "";

  renderCategories();
  renderItems();
  renderOutput();
}

function renderCategories() {
  const categories = state.data?.categories || [];
  categorySelect.innerHTML = "";
  categories.forEach(c => {
    const opt = document.createElement("option");
    opt.textContent = c.name;
    categorySelect.appendChild(opt);
  });
  categorySelect.selectedIndex = Math.min(state.categoryIndex, Math.max(0, categories.length - 1));
}

function renderItems() {
  const category = getCurrentCategory();
  const allItems = category?.items || [];

  const q = (itemSearch?.value || "").trim().toLowerCase();
  const items = q
    ? allItems.filter(i => (i.title || "").toLowerCase().includes(q))
    : allItems;

  state.filteredItems = items;

  itemSelect.innerHTML = "";
  items.forEach(i => {
    const opt = document.createElement("option");
    opt.textContent = i.title;
    itemSelect.appendChild(opt);
  });

  itemSelect.selectedIndex = Math.min(state.itemIndex, Math.max(0, items.length - 1));
}

function renderOutput() {
  const item = getCurrentItem();
  workerNotes.textContent = item?.worker_notes || "Select an item…";
  textOutput.value = item?.text || "";
}

function getCurrentCategory() {
  const categories = state.data?.categories || [];
  return categories[state.categoryIndex] || null;
}

function getCurrentItem() {
  const category = getCurrentCategory();
  const allItems = category?.items || [];
  const items = state.filteredItems || allItems;
  return items[state.itemIndex] || null;
}

// Initial load
loadSection(state.section);
