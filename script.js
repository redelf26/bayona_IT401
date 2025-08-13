// Learning Diary Management
let diaryEntries = [];

// Load diary data from Firebase/localStorage on page load and initialize app
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Initialize theme first so UI renders correctly
    initTheme();
    // Initialize modern form features first
    initializeModernForm();

    // Load data from Firebase/localStorage
    await loadDiaryData();

    // Update UI components after data is loaded
    updateStats();
    populateWeekFilter();
    displayEntries();
    updateLearningOverview();
  } catch (error) {
    console.error("Error initializing application:", error);
    showNotification("❌ Error loading application data", "error");
  }
});

// Theme setup (light/dark)
function initTheme() {
  try {
    const saved = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");

    // Apply theme using Tailwind's dark mode class
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Set up theme toggle button
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const isDark = document.documentElement.classList.contains("dark");
        if (isDark) {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("theme", "light");
        } else {
          document.documentElement.classList.add("dark");
          localStorage.setItem("theme", "dark");
        }
      });
    }
  } catch (err) {
    console.warn("Theme init failed", err);
  }
}

// Search and filter handlers
document
  .getElementById("searchEntries")
  .addEventListener("input", filterEntries);
document.getElementById("filterWeek").addEventListener("change", filterEntries);
document.getElementById("filterType").addEventListener("change", filterEntries);

function addDiaryEntry() {
  const isEditing = window.editingEntryId !== undefined;

  if (isEditing) {
    // Update existing entry
    const entryIndex = diaryEntries.findIndex(
      (entry) => entry.id === window.editingEntryId
    );
    if (entryIndex === -1) {
      showNotification("❌ Entry not found for update!", "error");
      return;
    }

    // Keep original date and ID, update other fields
    const originalEntry = diaryEntries[entryIndex];
    diaryEntries[entryIndex] = {
      id: originalEntry.id,
      type: document.getElementById("entryType").value,
      week: parseInt(document.getElementById("weekNumber").value),
      day: document.getElementById("dayNumber").value
        ? parseInt(document.getElementById("dayNumber").value)
        : null,
      lessonDate: document.getElementById("lessonDate").value || null,
      title: document.getElementById("entryTitle").value.trim(),
      topics: document
        .getElementById("topics")
        .value.split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      content: document.getElementById("entryContent").value.trim(),
      timeSpent: document.getElementById("timeSpent").value
        ? parseFloat(document.getElementById("timeSpent").value)
        : null,
      date: originalEntry.date, // Keep original date
      timestamp: originalEntry.timestamp, // Keep original timestamp for sorting
    };

    // Clear editing state
    delete window.editingEntryId;

    // Reset form appearance and clear form data
    resetFormAppearance();
    document.getElementById("diaryForm").reset();

    // Reset character counters
    updateCharacterCounter("entryTitle", 0, 100);
    updateCharacterCounter("topics", 0, 250);
    updateCharacterCounter("entryContent", 0, 2000);

    // Reset textarea heights
    const contentTextarea = document.getElementById("entryContent");
    const topicsTextarea = document.getElementById("topics");
    if (contentTextarea) contentTextarea.style.height = "auto";
    if (topicsTextarea) topicsTextarea.style.height = "auto";

    showNotification("✅ Entry updated successfully!", "success");
  } else {
    // Add new entry
    const entry = {
      id: Date.now(),
      type: document.getElementById("entryType").value,
      week: parseInt(document.getElementById("weekNumber").value),
      day: document.getElementById("dayNumber").value
        ? parseInt(document.getElementById("dayNumber").value)
        : null,
      lessonDate: document.getElementById("lessonDate").value || null,
      title: document.getElementById("entryTitle").value.trim(),
      topics: document
        .getElementById("topics")
        .value.split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      content: document.getElementById("entryContent").value.trim(),
      timeSpent: document.getElementById("timeSpent").value
        ? parseFloat(document.getElementById("timeSpent").value)
        : null,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    };

    diaryEntries.push(entry);

    // Reset form
    document.getElementById("diaryForm").reset();

    showNotification("✅ Entry saved successfully!", "success");
  }

  saveDiaryData();
  refreshUI();
}

function deleteDiaryEntry(id) {
  if (confirm("Are you sure you want to delete this entry?")) {
    diaryEntries = diaryEntries.filter((entry) => entry.id !== id);
    saveDiaryData();
    refreshUI();
    showNotification("🗑️ Entry deleted successfully!", "info");
  }
}

function editDiaryEntry(id) {
  const entry = diaryEntries.find((entry) => entry.id === id);
  if (!entry) {
    showNotification("❌ Entry not found!", "error");
    return;
  }

  // Switch to diary section if not already active
  showSection("diary");

  // Populate the form with entry data
  document.getElementById("entryType").value = entry.type;
  document.getElementById("weekNumber").value = entry.week;
  document.getElementById("dayNumber").value = entry.day || "";
  document.getElementById("lessonDate").value = entry.lessonDate || "";
  document.getElementById("entryTitle").value = entry.title;
  document.getElementById("topics").value = entry.topics.join(", ");
  document.getElementById("entryContent").value = entry.content;
  document.getElementById("timeSpent").value = entry.timeSpent || "";

  // Update character counters
  updateCharacterCounter("entryTitle", entry.title.length, 100);
  updateCharacterCounter("topics", entry.topics.join(", ").length, 250);
  updateCharacterCounter("entryContent", entry.content.length, 2000);

  // Auto-resize textareas
  autoResizeTextarea("entryContent");
  autoResizeTextarea("topics");

  // Store the ID being edited and change form behavior
  window.editingEntryId = id;
  updateFormForEdit();

  // Scroll to form
  document.getElementById("diaryForm").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  showNotification("✏️ Entry loaded for editing", "info");
}

function updateCharacterCounter(fieldId, length, max) {
  const counter = document.getElementById(fieldId + "-counter");
  if (counter) {
    counter.textContent = `${length}/${max}`;
    counter.classList.remove("warning", "danger");
    if (length > max * 0.9) {
      counter.classList.add("danger");
    } else if (length > max * 0.75) {
      counter.classList.add("warning");
    }
  }
}

function autoResizeTextarea(fieldId) {
  const textarea = document.getElementById(fieldId);
  if (textarea) {
    textarea.style.height = "auto";
    textarea.style.height =
      Math.max(
        textarea.tagName === "TEXTAREA" ? (fieldId === "topics" ? 60 : 120) : 0,
        textarea.scrollHeight
      ) + "px";
  }
}

function updateFormForEdit() {
  const submitBtn = document.querySelector('button[type="submit"]');
  const formTitle = document.querySelector("h3");

  if (submitBtn) submitBtn.textContent = "💾 Update Learning Entry";
  if (formTitle) formTitle.innerHTML = "✏️ Edit Learning Entry";

  // Add cancel button if it doesn't exist
  let cancelBtn = document.getElementById("cancelEditBtn");
  if (!cancelBtn) {
    cancelBtn = document.createElement("button");
    cancelBtn.id = "cancelEditBtn";
    cancelBtn.type = "button";
    cancelBtn.className =
      "w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors mt-2";
    cancelBtn.innerHTML = "❌ Cancel Edit";
    cancelBtn.onclick = cancelEdit;

    const form = document.getElementById("diaryForm");
    form.appendChild(cancelBtn);
  }
  cancelBtn.style.display = "block";
}

function resetFormAppearance() {
  // Reset form appearance without clearing form data
  const submitBtn = document.querySelector('button[type="submit"]');
  const formTitle = document.querySelector("h3");

  if (submitBtn) submitBtn.textContent = "💾 Save Learning Entry";
  if (formTitle) formTitle.innerHTML = "✍️ Add New Learning Entry";

  // Hide cancel button
  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) cancelBtn.style.display = "none";
}

function cancelEdit() {
  // Clear the editing state
  delete window.editingEntryId;

  // Reset form
  document.getElementById("diaryForm").reset();

  // Reset form appearance
  const submitBtn = document.querySelector('button[type="submit"]');
  const formTitle = document.querySelector("h3");

  if (submitBtn) submitBtn.textContent = "💾 Save Learning Entry";
  if (formTitle) formTitle.innerHTML = "✍️ Add New Learning Entry";

  // Hide cancel button
  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) cancelBtn.style.display = "none";

  // Reset character counters
  updateCharacterCounter("entryTitle", 0, 100);
  updateCharacterCounter("topics", 0, 250);
  updateCharacterCounter("entryContent", 0, 2000);

  // Reset textarea heights
  const contentTextarea = document.getElementById("entryContent");
  const topicsTextarea = document.getElementById("topics");
  if (contentTextarea) contentTextarea.style.height = "auto";
  if (topicsTextarea) topicsTextarea.style.height = "auto";

  showNotification("❌ Edit cancelled", "info");
}

function displayEntries() {
  console.log(
    "displayEntries called with",
    diaryEntries.length,
    "total entries"
  );
  const container = document.getElementById("entriesContainer");
  const searchTerm = document
    .getElementById("searchEntries")
    .value.toLowerCase();
  const filterWeek = document.getElementById("filterWeek").value;
  const filterType = document.getElementById("filterType").value;

  let filteredEntries = diaryEntries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm) ||
      entry.content.toLowerCase().includes(searchTerm) ||
      entry.topics.some((topic) => topic.toLowerCase().includes(searchTerm));
    const matchesWeek = !filterWeek || entry.week.toString() === filterWeek;
    const matchesType = !filterType || entry.type === filterType;

    return matchesSearch && matchesWeek && matchesType;
  });

  // Sort by date (newest first)
  filteredEntries.sort((a, b) => b.timestamp - a.timestamp);

  console.log(
    "displayEntries: showing",
    filteredEntries.length,
    "filtered entries"
  );

  if (filteredEntries.length === 0) {
    container.innerHTML =
      '<div class="text-center text-gray-500 dark:text-gray-400 py-8">📝 No entries found matching your criteria.</div>';
    console.log("displayEntries: no entries to display");
    return;
  }

  container.innerHTML = filteredEntries
    .map(
      (entry) => `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 mb-4">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${
                      entry.title
                    }</h4>
                    <div class="flex space-x-2">
                        <button class="text-blue-500 hover:text-blue-700 p-1" onclick="editDiaryEntry(${
                          entry.id
                        })" title="Edit Entry">✏️</button>
                        <button class="text-red-500 hover:text-red-700 p-1" onclick="deleteDiaryEntry(${
                          entry.id
                        })" title="Delete Entry">🗑️</button>
                    </div>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    📅 ${formatDate(entry.date)}${
        entry.lessonDate
          ? ` | 🗓️ Lesson: ${formatLessonDate(entry.lessonDate)}`
          : ""
      } | 
                    📊 Week ${entry.week}${
        entry.day ? `, Day ${entry.day}` : ""
      } | 
                    📝 ${entry.type}${
        entry.timeSpent ? ` | ⏱️ ${entry.timeSpent}h` : ""
      }
                </div>
                ${
                  entry.topics.length > 0
                    ? `
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${entry.topics
                          .map(
                            (topic) =>
                              `<span class="px-2 py-1 bg-tech-100 dark:bg-tech-800 text-tech-800 dark:text-tech-200 rounded-md text-xs">${topic}</span>`
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
                <div class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" onclick="toggleContent('content-${
                  entry.id
                }')">
                    <span class="inline-block transform transition-transform" id="icon-${
                      entry.id
                    }">▼</span>
                    <span class="ml-2">Learning Details</span>
                </div>
                <div id="content-${
                  entry.id
                }" class="text-gray-700 dark:text-gray-300 text-sm bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-600">${formatContentAsBullets(
        entry.content
      )}</div>
            </div>
        `
    )
    .join("");
}

function updateStats() {
  const totalEntries = diaryEntries.length;
  const currentWeek = getCurrentWeek();
  const uniqueTopics = new Set();
  const uniqueDays = new Set();

  diaryEntries.forEach((entry) => {
    entry.topics.forEach((topic) => uniqueTopics.add(topic.toLowerCase()));
    uniqueDays.add(new Date(entry.date).toDateString());
  });

  document.getElementById("totalEntries").textContent = totalEntries;
  document.getElementById("currentWeek").textContent = currentWeek;
  document.getElementById("topicsLearned").textContent = uniqueTopics.size;
  document.getElementById("daysActive").textContent = uniqueDays.size;
}

function populateWeekFilter() {
  const filterWeek = document.getElementById("filterWeek");
  const weeks = [...new Set(diaryEntries.map((entry) => entry.week))].sort(
    (a, b) => a - b
  );

  // Keep the "All Weeks" option and add weeks
  filterWeek.innerHTML =
    '<option value="">All Weeks</option>' +
    weeks
      .map((week) => `<option value="${week}">Week ${week}</option>`)
      .join("");
}

function getCurrentWeek() {
  const startDate = new Date("2025-08-04"); // Adjust semester start date
  const today = new Date();
  const diffTime = Math.abs(today - startDate);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.min(diffWeeks, 16); // Cap at 16 weeks
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLessonDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatContentAsBullets(content) {
  if (!content) return "";

  // Split content into lines
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  // Check if lines have bullet markers (- or *)
  const hasBulletMarkers = lines.some((line) => /^[-*]\s/.test(line));

  if (hasBulletMarkers) {
    // Convert existing markers to HTML bullets
    return (
      "<ul>" +
      lines
        .map((line) => {
          if (/^[-*]\s/.test(line)) {
            return `<li>${line.replace(/^[-*]\s/, "")}</li>`;
          } else {
            // For lines without bullet markers, treat as regular text
            return line;
          }
        })
        .join("<br>") +
      "</ul>"
    );
  } else {
    // No bullet markers found, return as regular text with line breaks
    return lines.join("<br>");
  }
}

function filterEntries() {
  displayEntries();
}

async function saveDiaryData() {
  try {
    // Always save to localStorage first as backup
    localStorage.setItem("diaryEntries", JSON.stringify(diaryEntries));

    // Then try to save to Firebase
    if (window.firebaseDb) {
      const userId = "defaultUser"; // could replace with login later
      const docRef = window.firebaseDoc(window.firebaseDb, "diaries", userId);
      await window.firebaseSetDoc(docRef, {
        entries: diaryEntries,
      });
      showNotification("✅ Saved to cloud!", "success");
    } else {
      console.log("Firebase not available, data saved to localStorage only");
      showNotification("💾 Saved locally!", "info");
    }
  } catch (error) {
    console.error("Error saving to Firebase: ", error);
    showNotification("❌ Error saving to cloud!", "error");
    // Data is already in localStorage from the first line
    showNotification("💾 Saved locally as backup", "info");
  }
}

async function loadDiaryData() {
  try {
    // Wait for Firebase to be initialized
    if (!window.firebaseDb) {
      // If Firebase is not ready, wait a bit and try again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (window.firebaseDb) {
      const userId = "defaultUser";
      const docRef = window.firebaseDoc(window.firebaseDb, "diaries", userId);
      const docSnap = await window.firebaseGetDoc(docRef);

      if (docSnap.exists()) {
        diaryEntries = docSnap.data().entries || [];
        console.log("Firebase data loaded:", diaryEntries.length, "entries");
        showNotification("☁️ Loaded from cloud!", "info");
      } else {
        // Try loading from localStorage as fallback
        const localData = localStorage.getItem("diaryEntries");
        if (localData) {
          diaryEntries = JSON.parse(localData);
          console.log("Local data loaded:", diaryEntries.length, "entries");
          showNotification("💾 Loaded from local storage", "info");
        } else {
          diaryEntries = [];
          console.log("No data found, starting with empty array");
        }
      }
    } else {
      throw new Error("Firebase not initialized");
    }
  } catch (error) {
    console.error("Error loading from Firebase: ", error);
    showNotification("❌ Error loading from cloud!", "error");

    // Fallback to localStorage
    try {
      const localData = localStorage.getItem("diaryEntries");
      if (localData) {
        diaryEntries = JSON.parse(localData);
        console.log(
          "Fallback: Local data loaded:",
          diaryEntries.length,
          "entries"
        );
        showNotification("💾 Loaded from local storage", "info");
      } else {
        diaryEntries = [];
        console.log("Fallback: No local data found, starting with empty array");
      }
    } catch (localError) {
      console.error("Error loading from localStorage: ", localError);
      diaryEntries = [];
    }
  }

  // After loading data, refresh the UI components if they exist
  refreshUI();
}

// Refresh all UI components
function refreshUI() {
  if (document.getElementById("entriesContainer")) {
    updateStats();
    populateWeekFilter();
    displayEntries();
    updateLearningOverview();
  }
}

function exportDiary() {
  const dataStr = JSON.stringify(diaryEntries, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `IT401_Learning_Diary_${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();
  URL.revokeObjectURL(url);
  showNotification("📤 Diary exported successfully!", "success");
}

function importDiary() {
  document.getElementById("importFile").click();
}

document.getElementById("importFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          if (confirm("This will replace your current diary data. Continue?")) {
            diaryEntries = importedData;
            saveDiaryData();
            refreshUI();
            showNotification("📥 Diary imported successfully!", "success");
          }
        } else {
          showNotification("❌ Invalid file format!", "error");
        }
      } catch (error) {
        showNotification("❌ Error reading file!", "error");
      }
    };
    reader.readAsText(file);
  }
});

function showNotification(message, type) {
  // Create notification element
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${
              type === "success"
                ? "#27ae60"
                : type === "error"
                ? "#e74c3c"
                : "#3498db"
            };
        `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Navigation functionality
function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => {
    section.classList.remove("active");
    section.classList.add("hidden");
  });

  // Show selected section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");
    targetSection.classList.remove("hidden");
  }

  // Update navigation buttons
  const buttons = document.querySelectorAll(".nav-tab");
  buttons.forEach((button) => {
    button.classList.remove(
      "active-tab",
      "border-tech-500",
      "text-tech-600",
      "dark:text-tech-400"
    );
    button.classList.add(
      "border-transparent",
      "text-gray-500",
      "hover:text-gray-700",
      "hover:border-gray-300",
      "dark:text-gray-400",
      "dark:hover:text-gray-300"
    );
  });

  // Highlight active button
  const activeButton = document.querySelector(`[data-section="${sectionId}"]`);
  if (activeButton) {
    activeButton.classList.add(
      "active-tab",
      "border-tech-500",
      "text-tech-600",
      "dark:text-tech-400"
    );
    activeButton.classList.remove(
      "border-transparent",
      "text-gray-500",
      "hover:text-gray-700",
      "hover:border-gray-300",
      "dark:text-gray-400",
      "dark:hover:text-gray-300"
    );
  }

  // Update sections when shown
  if (sectionId === "overview") {
    updateLearningOverview();
  } else if (sectionId === "diary") {
    // Refresh diary section
    refreshUI();
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

function updateLearningOverview() {
  const container = document.getElementById("learningOverview");

  if (diaryEntries.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-500 dark:text-gray-400 py-8">
        📝 No learning entries yet. Start documenting your journey in the Learning Diary tab!
      </div>
    `;
    return;
  }

  // Group entries by week
  const entriesByWeek = {};
  diaryEntries.forEach((entry) => {
    if (!entriesByWeek[entry.week]) {
      entriesByWeek[entry.week] = [];
    }
    entriesByWeek[entry.week].push(entry);
  });

  // Sort weeks
  const sortedWeeks = Object.keys(entriesByWeek).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  container.innerHTML = sortedWeeks
    .map((week) => {
      const weekEntries = entriesByWeek[week];
      // Sort entries by day and timestamp
      weekEntries.sort((a, b) => {
        if (a.day !== b.day) {
          return (a.day || 0) - (b.day || 0);
        }
        return a.timestamp - b.timestamp;
      });

      // Group by day within the week
      const entriesByDay = {};
      weekEntries.forEach((entry) => {
        const dayKey = entry.day ? `Day ${entry.day}` : "General";
        if (!entriesByDay[dayKey]) {
          entriesByDay[dayKey] = [];
        }
        entriesByDay[dayKey].push(entry);
      });

      // Get all unique topics for the week
      const weekTopics = [
        ...new Set(weekEntries.flatMap((entry) => entry.topics)),
      ];

      // Calculate total time spent for the week
      const totalWeekTime = weekEntries.reduce(
        (sum, entry) => sum + (entry.timeSpent || 0),
        0
      );

      // Calculate time spent per day
      const dayTimes = Object.keys(entriesByDay).map((dayKey) => {
        const dayTime = entriesByDay[dayKey].reduce(
          (sum, entry) => sum + (entry.timeSpent || 0),
          0
        );
        return { day: dayKey, time: dayTime };
      });

      return `
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
        <div class="p-4 cursor-pointer" onclick="toggleWeek('week-${week}')">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
              <span class="inline-block transform transition-transform mr-2" id="week-icon-${week}">▶</span>
              Week ${week}: Learning Summary
            </h4>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              ${weekTopics.length > 0 ? `📚 ${weekTopics.length} topics` : ""}
              ${totalWeekTime > 0 ? ` • ⏱️ ${totalWeekTime}h total` : ""}
            </div>
          </div>
          ${
            weekTopics.length > 0
              ? `
            <div class="mt-2 flex flex-wrap gap-2">
              ${weekTopics
                .map(
                  (topic) =>
                    `<span class="px-2 py-1 bg-tech-100 dark:bg-tech-800 text-tech-800 dark:text-tech-200 rounded-md text-xs">${topic}</span>`
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
        
        <div id="week-${week}" class="hidden border-t border-gray-200 dark:border-gray-600">
          <div class="p-4">
            ${
              totalWeekTime > 0
                ? `
              <p class="text-gray-700 dark:text-gray-300 mb-3"><strong>Total Time Spent:</strong> ${totalWeekTime} hours</p>
            `
                : ""
            }
            
            ${Object.keys(entriesByDay)
              .map((dayKey) => {
                const dayTime = entriesByDay[dayKey].reduce(
                  (sum, entry) => sum + (entry.timeSpent || 0),
                  0
                );
                // Get unique topics for this day
                const dayTopics = [
                  ...new Set(
                    entriesByDay[dayKey].flatMap((entry) => entry.topics)
                  ),
                ];
                return `
              <div class="mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div class="p-3 cursor-pointer" onclick="toggleDay('week-${week}-${dayKey.replace(
                  /\s+/g,
                  "-"
                )}')">
                  <div class="flex items-center justify-between">
                    <h5 class="font-medium text-gray-900 dark:text-white">
                      <span class="inline-block transform transition-transform mr-2" id="day-icon-${week}-${dayKey.replace(
                  /\s+/g,
                  "-"
                )}">▶</span>
                      📅 ${dayKey}
                    </h5>
                    ${
                      dayTime > 0
                        ? `<span class="text-sm text-gray-600 dark:text-gray-400">⏱️ ${dayTime}h</span>`
                        : ""
                    }
                  </div>
                  ${
                    dayTopics.length > 0
                      ? `
                    <div class="mt-2 flex flex-wrap gap-1">
                      ${dayTopics
                        .map(
                          (topic) =>
                            `<span class="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs">${topic}</span>`
                        )
                        .join("")}
                    </div>
                  `
                      : ""
                  }
                </div>
                <div id="week-${week}-${dayKey.replace(
                  /\s+/g,
                  "-"
                )}" class="hidden border-t border-gray-200 dark:border-gray-600">
                  <div class="p-3 space-y-3">
                    ${entriesByDay[dayKey]
                      .map(
                        (entry) => `
                      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div class="flex items-start justify-between mb-2">
                          <span class="font-medium text-gray-900 dark:text-white">${getTypeIcon(
                            entry.type
                          )} ${entry.title}</span>
                          <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            ${
                              entry.lessonDate
                                ? `<span>🗓️ ${formatLessonDate(
                                    entry.lessonDate
                                  )}</span>`
                                : ""
                            }
                            ${
                              entry.timeSpent
                                ? `<span>⏱️ ${entry.timeSpent}h</span>`
                                : ""
                            }
                          </div>
                        </div>
                        ${
                          entry.topics.length > 0
                            ? `
                          <div class="flex flex-wrap gap-1 mb-2">
                            ${entry.topics
                              .map(
                                (topic) =>
                                  `<span class="px-2 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">${topic}</span>`
                              )
                              .join("")}
                          </div>
                        `
                            : ""
                        }
                        <div class="text-gray-700 dark:text-gray-300 text-sm">${formatContentAsBullets(
                          entry.content
                        )}</div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              </div>
            `;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

function toggleWeek(weekId) {
  const weekContent = document.getElementById(weekId);
  const icon = document.getElementById(
    "week-icon-" + weekId.replace("week-", "")
  );

  if (weekContent && icon) {
    if (weekContent.classList.contains("hidden")) {
      weekContent.classList.remove("hidden");
      icon.style.transform = "rotate(90deg)";
    } else {
      weekContent.classList.add("hidden");
      icon.style.transform = "rotate(0deg)";
    }
  }
}

function toggleDay(dayId) {
  const dayContent = document.getElementById(dayId);
  const iconId = "day-icon-" + dayId.replace("week-", "");
  const icon = document.getElementById(iconId);

  if (dayContent && icon) {
    if (dayContent.classList.contains("hidden")) {
      dayContent.classList.remove("hidden");
      icon.style.transform = "rotate(90deg)";
    } else {
      dayContent.classList.add("hidden");
      icon.style.transform = "rotate(0deg)";
    }
  }
}

function toggleContent(contentId) {
  const content = document.getElementById(contentId);
  const icon = document.getElementById(
    "icon-" + contentId.replace("content-", "")
  );

  if (content && icon) {
    if (content.style.display === "none") {
      content.style.display = "block";
      icon.style.transform = "rotate(0deg)";
    } else {
      content.style.display = "none";
      icon.style.transform = "rotate(-90deg)";
    }
  }
}

function getTypeIcon(type) {
  const icons = {
    orientation: "🎯",
    day: "📖",
    lab: "🔬",
    assignment: "📄",
    exam: "📝",
    project: "🚀",
    research: "🔍",
  };
  return icons[type] || "📚";
}

// Week number initialization (commented out to let user choose freely)
// Initialize week number with current week
// document.addEventListener("DOMContentLoaded", function () {
//   const weekNumberInput = document.getElementById("weekNumber");
//   if (weekNumberInput) {
//     weekNumberInput.value = getCurrentWeek();
//   }
// });

// Modern Form Enhancements (initialized in main DOMContentLoaded)

function initializeModernForm() {
  // Character counters
  setupCharacterCounters();

  // Form validation
  setupFormValidation();

  // Input enhancements
  setupInputEnhancements();

  // Form submission loading state
  setupFormSubmission();
}

function setupCharacterCounters() {
  const inputs = [
    { id: "entryTitle", max: 100, counterId: "entryTitle-counter" },
    { id: "topics", max: 250, counterId: "topics-counter" },
    { id: "entryContent", max: 2000, counterId: "entryContent-counter" },
  ];

  inputs.forEach(({ id, max, counterId }) => {
    const input = document.getElementById(id);
    const counter = document.getElementById(counterId);

    if (input && counter) {
      input.addEventListener("input", function () {
        const length = this.value.length;
        counter.textContent = `${length}/${max}`;

        // Update counter styling based on usage
        counter.classList.remove("warning", "danger");
        if (length > max * 0.9) {
          counter.classList.add("danger");
        } else if (length > max * 0.75) {
          counter.classList.add("warning");
        }
      });

      // Initialize counter
      const length = input.value.length;
      counter.textContent = `${length}/${max}`;
    }
  });
}

function setupFormValidation() {
  const form = document.getElementById("diaryForm");
  const inputs = form.querySelectorAll("input, textarea, select");

  inputs.forEach((input) => {
    // Real-time validation
    input.addEventListener("blur", function () {
      validateField(this);
    });

    input.addEventListener("input", function () {
      if (this.classList.contains("border-red-500")) {
        validateField(this);
      }
    });
  });
}

function validateField(field) {
  let isValid = true;
  let errorMessage = "";

  // Clear previous error state
  field.classList.remove("border-red-500");

  // Required field validation
  if (field.hasAttribute("required") && !field.value.trim()) {
    isValid = false;
    errorMessage = "This field is required";
  }

  // Type-specific validation
  if (field.type === "number" && field.value) {
    const value = parseFloat(field.value);
    const min = parseFloat(field.min);
    const max = parseFloat(field.max);

    if (min && value < min) {
      isValid = false;
      errorMessage = `Value must be at least ${min}`;
    } else if (max && value > max) {
      isValid = false;
      errorMessage = `Value must be no more than ${max}`;
    }
  }

  // Text length validation (only for fields with valid maxLength)
  if (
    field.maxLength &&
    field.maxLength > 0 &&
    field.value.length > field.maxLength
  ) {
    isValid = false;
    errorMessage = `Maximum ${field.maxLength} characters allowed`;
  }

  // Title validation (more specific)
  if (field.id === "entryTitle" && field.value.trim()) {
    if (field.value.trim().length < 3) {
      isValid = false;
      errorMessage = "Title must be at least 3 characters";
    }
  }

  // Content validation (more specific)
  if (field.id === "entryContent" && field.value.trim()) {
    if (field.value.trim().length < 10) {
      isValid = false;
      errorMessage =
        "Please provide more detailed learning information (at least 10 characters)";
    }
  }

  // Display error if invalid
  if (!isValid) {
    field.classList.add("border-red-500");
    // You could show error message in a tooltip or notification
    showNotification(errorMessage, "error");
  }

  return isValid;
}

function setupInputEnhancements() {
  // Topics input enhancement (tag-like behavior)
  const topicsInput = document.getElementById("topics");
  if (topicsInput) {
    topicsInput.addEventListener("blur", function () {
      // Only auto-format when user finishes typing (on blur)
      let value = this.value;
      // Remove extra spaces around commas
      value = value.replace(/\s*,\s*/g, ", ");
      // Remove duplicate commas
      value = value.replace(/,+/g, ",");
      // Remove leading/trailing commas and spaces
      value = value.replace(/^[,\s]+|[,\s]+$/g, "");

      this.value = value;
    });
  }

  // Auto-resize textareas
  const contentTextarea = document.getElementById("entryContent");
  const topicsTextarea = document.getElementById("topics");

  if (contentTextarea) {
    contentTextarea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = Math.max(120, this.scrollHeight) + "px";
    });
  }

  if (topicsTextarea) {
    topicsTextarea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = Math.max(60, this.scrollHeight) + "px";
    });
  }
}

function setupFormSubmission() {
  const form = document.getElementById("diaryForm");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validate entire form
    const inputs = form.querySelectorAll("input, textarea, select");
    let isFormValid = true;

    inputs.forEach((input) => {
      if (!validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      // Scroll to first error
      const firstError = form.querySelector(".border-red-500");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        firstError.focus();
      }
      return;
    }

    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "💾 Saving...";
    submitBtn.disabled = true;

    // Simulate processing delay for UX
    setTimeout(() => {
      addDiaryEntry();

      // Reset loading state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;

      // Reset form validation states
      inputs.forEach((input) => {
        input.classList.remove("border-red-500");
      });
    }, 500);
  });
}
