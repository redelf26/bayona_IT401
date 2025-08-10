// Learning Diary Management
let diaryEntries = [];

// Load diary data from localStorage on page load
document.addEventListener("DOMContentLoaded", function () {
  loadDiaryData();
  updateStats();
  populateWeekFilter();
  displayEntries();
  updateLearningOverview(); // Add this to update overview on load
});

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
  updateStats();
  populateWeekFilter();
  displayEntries();
  updateLearningOverview();
}

function deleteDiaryEntry(id) {
  if (confirm("Are you sure you want to delete this entry?")) {
    diaryEntries = diaryEntries.filter((entry) => entry.id !== id);
    saveDiaryData();
    updateStats();
    populateWeekFilter();
    displayEntries();
    updateLearningOverview(); // Add this to update overview when entry is deleted
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
  document.querySelector(".diary-form").scrollIntoView({
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
  const submitBtn = document.querySelector(".btn-primary .btn-text");
  const submitIcon = document.querySelector(".btn-primary .btn-icon");
  const formTitle = document.querySelector(".diary-form h3");

  if (submitBtn) submitBtn.textContent = "Update Learning Entry";
  if (submitIcon) submitIcon.textContent = "💾";
  if (formTitle) formTitle.innerHTML = "✏️ Edit Learning Entry";

  // Add cancel button if it doesn't exist
  let cancelBtn = document.getElementById("cancelEditBtn");
  if (!cancelBtn) {
    cancelBtn = document.createElement("button");
    cancelBtn.id = "cancelEditBtn";
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.style.marginTop = "10px";
    cancelBtn.innerHTML = "❌ Cancel Edit";
    cancelBtn.onclick = cancelEdit;

    const formActions = document.querySelector(".form-actions");
    formActions.appendChild(cancelBtn);
  }
  cancelBtn.style.display = "block";
}

function cancelEdit() {
  // Clear the editing state
  delete window.editingEntryId;

  // Reset form
  document.getElementById("diaryForm").reset();

  // Reset form appearance
  const submitBtn = document.querySelector(".btn-primary .btn-text");
  const submitIcon = document.querySelector(".btn-primary .btn-icon");
  const formTitle = document.querySelector(".diary-form h3");

  if (submitBtn) submitBtn.textContent = "Save Learning Entry";
  if (submitIcon) submitIcon.textContent = "💾";
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

function resetFormAppearance() {
  // Reset form appearance without clearing form data
  const submitBtn = document.querySelector(".btn-primary .btn-text");
  const submitIcon = document.querySelector(".btn-primary .btn-icon");
  const formTitle = document.querySelector(".diary-form h3");

  if (submitBtn) submitBtn.textContent = "Save Learning Entry";
  if (submitIcon) submitIcon.textContent = "💾";
  if (formTitle) formTitle.innerHTML = "✍️ Add New Learning Entry";

  // Hide cancel button
  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) cancelBtn.style.display = "none";
}

function displayEntries() {
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

  if (filteredEntries.length === 0) {
    container.innerHTML =
      '<div class="no-entries">📝 No entries found matching your criteria.</div>';
    return;
  }

  container.innerHTML = filteredEntries
    .map(
      (entry) => `
            <div class="diary-entry">
                <h4>
                    <span>${entry.title}</span>
                    <div class="entry-actions">
                        <button class="btn-edit" onclick="editDiaryEntry(${
                          entry.id
                        })" title="Edit Entry">✏️</button>
                        <button class="btn-danger" onclick="deleteDiaryEntry(${
                          entry.id
                        })" title="Delete Entry">🗑️</button>
                    </div>
                </h4>
                <div class="diary-meta">
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
                    <div class="diary-topics">
                        ${entry.topics
                          .map(
                            (topic) => `<span class="topic-tag">${topic}</span>`
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
                <div class="content-toggle-header" onclick="toggleContent('content-${
                  entry.id
                }')">
                    <span class="content-toggle-icon">▼</span>
                    <span class="content-toggle-text">Learning Details</span>
                </div>
                <div id="content-${
                  entry.id
                }" class="diary-content collapsible-content expanded">${formatContentAsBullets(
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

function saveDiaryData() {
  localStorage.setItem("it401_diary", JSON.stringify(diaryEntries));
}

function loadDiaryData() {
  const saved = localStorage.getItem("it401_diary");
  if (saved) {
    diaryEntries = JSON.parse(saved);
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
            updateStats();
            populateWeekFilter();
            displayEntries();
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
  });

  // Show selected section
  document.getElementById(sectionId).classList.add("active");

  // Update navigation buttons
  const buttons = document.querySelectorAll(".nav-btn");
  buttons.forEach((button) => {
    button.classList.remove("active");
  });

  // Highlight active button
  event.target.classList.add("active");

  // Update learning overview if showing overview section
  if (sectionId === "overview") {
    updateLearningOverview();
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

function updateLearningOverview() {
  const container = document.getElementById("learningOverview");

  if (diaryEntries.length === 0) {
    container.innerHTML = `
      <div class="no-entries">
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
      <div class="timeline-item">
        <div class="week-header collapsible" onclick="toggleWeek('week-${week}')">
          <h4>
            <span class="collapse-icon">▶</span>
            Week ${week}: Learning Summary
          </h4>
          <div class="week-summary">
            ${
              weekTopics.length > 0
                ? `<span class="summary-item">📚 ${weekTopics.length} topics</span>`
                : ""
            }
            ${
              totalWeekTime > 0
                ? `<span class="summary-item">⏱️ ${totalWeekTime}h total</span>`
                : ""
            }
            ${dayTimes
              .map((dt) =>
                dt.time > 0
                  ? `<span class="summary-item">📅 ${dt.day}: ${dt.time}h</span>`
                  : ""
              )
              .filter(Boolean)
              .join("")}
          </div>
          ${
            weekTopics.length > 0
              ? `
            <div class="week-topics-summary">
              ${weekTopics
                .map(
                  (topic) => `<span class="topic-summary-tag">${topic}</span>`
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
        
        <div id="week-${week}" class="week-content collapsed">
          ${
            weekTopics.length > 0
              ? `
            <p><strong>Topics Covered:</strong> ${weekTopics.join(", ")}</p>
          `
              : ""
          }
          ${
            totalWeekTime > 0
              ? `
            <p><strong>Total Time Spent:</strong> ${totalWeekTime} hours</p>
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
            <div class="day-summary">
              <div class="day-header collapsible" onclick="toggleDay('week-${week}-${dayKey.replace(
                /\s+/g,
                "-"
              )}')">
                <h5>
                  <span class="collapse-icon">▶</span>
                  📅 ${dayKey}
                  ${
                    dayTime > 0
                      ? `<span class="day-time">⏱️ ${dayTime}h</span>`
                      : ""
                  }
                </h5>
              </div>
              ${
                dayTopics.length > 0
                  ? `
                <div class="day-topics-summary">
                  ${dayTopics
                    .map(
                      (topic) => `<span class="day-topic-tag">${topic}</span>`
                    )
                    .join("")}
                </div>
              `
                  : ""
              }
              <div id="week-${week}-${dayKey.replace(
                /\s+/g,
                "-"
              )}" class="day-content collapsed">
                ${entriesByDay[dayKey]
                  .map(
                    (entry) => `
                  <div class="overview-entry">
                    <div class="overview-entry-header">
                      <span class="entry-type-badge ${
                        entry.type
                      }">${getTypeIcon(entry.type)} ${entry.title}</span>
                      ${
                        entry.lessonDate
                          ? `<span class="lesson-date">🗓️ ${formatLessonDate(
                              entry.lessonDate
                            )}</span>`
                          : ""
                      }
                      ${
                        entry.timeSpent
                          ? `<span class="entry-time">⏱️ ${entry.timeSpent}h</span>`
                          : ""
                      }
                    </div>
                    ${
                      entry.topics.length > 0
                        ? `
                      <div class="overview-topics">
                        ${entry.topics
                          .map(
                            (topic) =>
                              `<span class="mini-topic-tag">${topic}</span>`
                          )
                          .join("")}
                      </div>
                    `
                        : ""
                    }
                    <div class="overview-content">${formatContentAsBullets(
                      entry.content
                    )}</div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `;
            })
            .join("")}
        </div>
      </div>
    `;
    })
    .join("");
}

function toggleWeek(weekId) {
  const weekContent = document.getElementById(weekId);
  const icon =
    weekContent.previousElementSibling.querySelector(".collapse-icon");

  if (weekContent.classList.contains("collapsed")) {
    weekContent.classList.remove("collapsed");
    weekContent.classList.add("expanded");
    icon.textContent = "▼";
  } else {
    weekContent.classList.add("collapsed");
    weekContent.classList.remove("expanded");
    icon.textContent = "▶";
  }
}

function toggleDay(dayId) {
  const dayContent = document.getElementById(dayId);
  const icon =
    dayContent.previousElementSibling.querySelector(".collapse-icon");

  if (dayContent.classList.contains("collapsed")) {
    dayContent.classList.remove("collapsed");
    dayContent.classList.add("expanded");
    icon.textContent = "▼";
  } else {
    dayContent.classList.add("collapsed");
    dayContent.classList.remove("expanded");
    icon.textContent = "▶";
  }
}

function toggleContent(contentId) {
  const content = document.getElementById(contentId);
  const header = content.previousElementSibling;
  const icon = header.querySelector(".content-toggle-icon");

  if (content.classList.contains("expanded")) {
    content.classList.remove("expanded");
    content.classList.add("collapsed");
    icon.textContent = "▶";
  } else {
    content.classList.add("expanded");
    content.classList.remove("collapsed");
    icon.textContent = "▼";
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

// Initialize week number with current week
document.addEventListener("DOMContentLoaded", function () {
  // Don't auto-set week number - let user choose freely
  // const weekNumberInput = document.getElementById("weekNumber");
  // if (weekNumberInput) {
  //   weekNumberInput.value = getCurrentWeek();
  // }
});

// Add CSS for notification animations
const style = document.createElement("style");
style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .timeline {
            position: relative;
            padding-left: 30px;
        }
        .timeline:before {
            content: '';
            position: absolute;
            left: 10px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #3498db;
        }
        .timeline-item {
            position: relative;
            margin-bottom: 30px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        .timeline-item:before {
            content: '';
            position: absolute;
            left: -25px;
            top: 25px;
            width: 12px;
            height: 12px;
            background: #3498db;
            border-radius: 50%;
            border: 3px solid white;
        }
    `;
document.head.appendChild(style);

// Modern Form Enhancements
document.addEventListener("DOMContentLoaded", function () {
  initializeModernForm();
});

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
  const inputs = form.querySelectorAll(".form-input, .form-textarea");

  inputs.forEach((input) => {
    // Real-time validation
    input.addEventListener("blur", function () {
      validateField(this);
    });

    input.addEventListener("input", function () {
      if (this.classList.contains("error")) {
        validateField(this);
      }
    });
  });
}

function validateField(field) {
  const errorElement = document.getElementById(field.id + "-error");
  let isValid = true;
  let errorMessage = "";

  // Clear previous error state
  field.classList.remove("error");
  if (errorElement) {
    errorElement.textContent = "";
    errorElement.classList.remove("show");
  }

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
  if (!isValid && errorElement) {
    field.classList.add("error");
    errorElement.textContent = errorMessage;
    errorElement.classList.add("show");
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
  const submitBtn = form.querySelector(".btn-primary");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validate entire form
    const inputs = form.querySelectorAll(".form-input, .form-textarea");
    let isFormValid = true;

    inputs.forEach((input) => {
      if (!validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      // Scroll to first error
      const firstError = form.querySelector(".error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        firstError.focus();
      }
      return;
    }

    // Show loading state
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    // Simulate processing delay for UX
    setTimeout(() => {
      addDiaryEntry();

      // Reset loading state
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;

      // Reset form validation states
      inputs.forEach((input) => {
        input.classList.remove("error");
        const errorElement = document.getElementById(input.id + "-error");
        if (errorElement) {
          errorElement.classList.remove("show");
        }
      });
    }, 500);
  });
}
