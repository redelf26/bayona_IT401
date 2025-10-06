# IT401 System Administration & Learning Diary

This is a simple web application designed to help students of the IT401 System Administration course keep a detailed learning diary. It allows for the creation, editing, and deletion of diary entries, and provides a structured way to document the learning process throughout the semester.

## Purpose

The main goal of this application is to provide a user-friendly interface for students to:
- Document their daily learnings, lab exercises, assignments, and research.
- Track progress on a weekly basis.
- Keep a centralized, digital record of their educational journey in the course.
- Export and import their diary data for backup or transfer.

## Setup

This is a client-side only application with no build process. To run it, you just need to open the `index.html` file in a modern web browser.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/it401-learning-diary.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd it401-learning-diary
    ```
3.  **Open `index.html` in your browser:**
    You can do this by double-clicking the file in your file explorer or by running a command in your terminal (like `open index.html` on macOS or `start index.html` on Windows).

## Usage

The application is divided into two main sections: **Learning Diary** and **Lesson Overview**.

### Learning Diary

-   **Add New Entry:** Fill out the form to add a new diary entry. You can specify the entry type, week number, title, topics covered, and detailed notes.
-   **Edit Entry:** Click the pencil icon (✏️) on an existing entry to load it into the form for editing.
-   **Delete Entry:** Click the trash can icon (🗑️) to delete an entry.
-   **Search and Filter:** Use the search bar and dropdowns to filter entries by keyword, week, or type.
-   **Data Management:** You can export your diary to a JSON file for backup or import a previously exported file.

### Lesson Overview

This section provides a summary of your learning progress, organized by week and day. It gives a high-level view of the topics you've covered and the time you've spent.

## Firebase Integration (Optional)

The application is configured to use Firebase for cloud storage, allowing you to keep your diary synchronized across devices. To use this feature, you will need to set up your own Firebase project and replace the configuration in `index.html`:

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  In your project, create a new Web App.
3.  Copy the `firebaseConfig` object provided.
4.  Paste your `firebaseConfig` into the `<script type="module">` section at the bottom of `index.html`.
5.  In the Firebase console, go to **Firestore Database** and create a new database. Start in **test mode** for easy setup (for production, you should configure security rules).

Without this, the application will default to using the browser's `localStorage`.