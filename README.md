# NexusQA — All-in-One Software Project & Quality Management Platform (V1 UI)

> **"One Project. One Workspace. One Source of Truth."**

This is the complete interactive user interface implementation for **V1 (Core Project & QA Management)** of the All-in-One Software Project & Quality Management Platform.

---

## 🚀 How to Run the Application

This is a modern, zero-dependency web application designed to run immediately in any modern browser.

1. **Option 1**: Double-click or open [`index.html`](file:///d:/QA%20new%20project/index.html) directly in Google Chrome, Microsoft Edge, Firefox, or Safari.
2. **Option 2**: If using a local development server (like VS Code Live Server or python http server):
   ```bash
   # Optional:
   npx serve .
   # or
   python -m http.server 8080
   ```

---

## 🧭 V1 Feature & Scope Checklist

| Specification | Module Name | Features Implemented & Accessible |
| :--- | :--- | :--- |
| **V1.1** | **Auth & Organization** | • User Persona Switcher in the header (Elena Rostova - Admin, Alex Rivera - PM, David Chen - Dev, Sarah Jenkins - QA, Mark Sterling - Customer).<br>• Organization management view with domain and roles.<br>• Simulated role permissions. |
| **V1.2** | **Project Management** | • Multi-project workspace switcher (OmniPay, HealthCloud, NextGen E-Commerce).<br>• Create project modal with PM assignment, dates, priority, and health metrics.<br>• Independent workspace isolation. |
| **V1.3** | **Ticket / Work Management** | • Epics, Stories, Tasks, and Sub-tasks.<br>• Interactive **Kanban Board** with HTML5 drag-and-drop status moves.<br>• Table/List view with type, priority, and assignee filters.<br>• Ticket details modal with interactive Acceptance Criteria checklist, comments, and activity audit log. |
| **V1.4** | **Developer Workflow** | • Developer Hub ("My Assigned Work") filtering items assigned to active developer.<br>• 1-Click **"Mark Ready for QA"** handover workflow (capturing build version, branch, environment, and handover instructions).<br>• Assigned defect queue with 1-click fix deployment. |
| **V1.5** | **QA Workspace & Queue** | • Dedicated **QA Queue** displaying all tickets in "Ready for QA".<br>• Review developer handover package and acceptance criteria.<br>• 1-Click "Start Testing Ticket" and "+ Add Test Case".<br>• Reject to Dev action for failing builds. |
| **V1.6** | **Test Case Management** | • Test suites organized by feature/module.<br>• Step-by-step test procedure builder (Step #, Action, Expected Result).<br>• 10 QA categories (Positive, Negative, Functional, Regression, Smoke, Sanity, Integration, API, UI, UAT).<br>• Reusable Test Case Templates (API REST, UI Form, Smoke Checklist) with 1-click apply.<br>• Duplicate test case action. |
| **V1.7** | **Test Execution & Runs** | • Launch test runs by Sprint, Feature, Release, or Ticket.<br>• Full-featured interactive **Test Execution Runner** modal.<br>• Mark individual test cases as **Pass**, **Fail**, **Blocked**, or **Not Run**.<br>• Live pass rate % and completion rate calculation.<br>• Actual result and evidence capture. |
| **V1.8** | **Bug / Defect Management** | • Direct **1-Click "Log Bug from Failure"** inside the Test Runner (auto-prefills steps, expected vs actual, test case, and test run).<br>• Full Bug Tracker with defect workflow (`Open` → `In Progress` → `Fixed` → `QA Testing` → `Closed` / `Reopened`).<br>• Developer fix notes & QA Retest verification sign-off. |
| **V1.9** | **Notifications** | • Real-time in-app notification center bell with unread badge counter.<br>• Toast alert notifications on ticket handovers, test runs, and defect creation. |
| **V1.10** | **Dashboard & Reporting** | • Real-time KPI metrics cards.<br>• Interactive **Chart.js** charts: Ticket Workflow Donut, Test Execution Donut, Defect Severity Bar Chart.<br>• QA Health Index score (calculated from pass rates and blocker bugs).<br>• Live Project Activity stream. |
| **V1.11** | **V1 Completion Criteria** | • Built-in **V1 Lifecycle Tour** (accessible from header and sidebar) that walks through the 6-stage lifecycle step-by-step. |

---

## 🧩 Project File Structure

```
d:/QA new project/
├── index.html                  # Main application shell with Tailwind, Lucide, Chart.js
├── README.md                   # Documentation and usage guide
├── css/
│   └── styles.css              # Custom styling, status badges, Kanban drag styles, animations
└── js/
    ├── data.js                 # Seed dataset (Projects, Tickets, Suites, Cases, Runs, Bugs, Users)
    ├── store.js                # Centralized reactive state store with LocalStorage persistence
    ├── app.js                  # Main controller, router, toasts, notifications, persona switcher
    └── views/
        ├── dashboard.js        # Executive & QA health dashboard with Chart.js charts
        ├── projects.js         # Project workspace manager & creation modal
        ├── tickets.js          # Kanban board & list view with drag-and-drop
        ├── devWorkspace.js     # Developer Hub with "Mark Ready for QA" flow
        ├── qaWorkspace.js      # QA Testing Queue & handover reviewer
        ├── testCases.js        # Test case repository, suite manager & step builder
        ├── testRuns.js         # Test execution runner with live pass-rate scoring
        ├── bugs.js             # Defect tracker & retest workflow
        └── workflowTour.js     # Guided interactive 6-step demo tour
```

---

## 🎯 Testing the 6 Core V1 Lifecycle Criteria

Click **"V1 Lifecycle Tour"** in the top bar or sidebar to step through the guided demo, or perform the following manual test steps:

1. **PM Assigns Work**: Open [Kanban & Tickets](file:///d:/QA%20new%20project/index.html#tickets) and create a new Story ticket assigned to David Chen (Dev) and Sarah Jenkins (QA).
2. **Developer Completes Work**: Switch persona to **David Chen** (or navigate to [Developer Hub](file:///d:/QA%20new%20project/index.html#dev-workspace)) and click **"Mark Ready for QA"**. Enter build version `#v1.4.2` and submit.
3. **QA Receives & Tests**: Switch persona to **Sarah Jenkins** (or open [QA Testing Queue](file:///d:/QA%20new%20project/index.html#qa-workspace)). Review developer handover and click **"Start Testing Ticket"**.
4. **Execute Test Run**: Open [Test Execution & Runs](file:///d:/QA%20new%20project/index.html#test-runs), launch a test run, and mark a case as **"Fail"**.
5. **1-Click Bug Logging**: In the Test Runner, click **"1-Click: Log Bug from Failure"**. Notice how steps to reproduce, expected vs actual results, and ticket links are auto-populated.
6. **Fix & Retest**: In [Developer Hub](file:///d:/QA%20new%20project/index.html#dev-workspace), find the assigned bug and click **"Deploy Fix & Retest"**. In [Bug Tracker](file:///d:/QA%20new%20project/index.html#bugs), QA verifies the retest and marks the defect **"Closed"**.
7. **View Dashboard**: Open [Executive Dashboard](file:///d:/QA%20new%20project/index.html#dashboard) to see updated QA Health Index, test pass rates, and ticket completion charts!
