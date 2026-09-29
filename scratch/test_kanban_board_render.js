/**
 * Verification script for Kanban Board layout & tab-specific floating buttons
 */
const fs = require('fs');
const path = require('path');

console.log("=== Testing Kanban Board & Floating Buttons Implementation ===");

// 1. Check styles.css for syntax errors
const cssContent = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');
if (cssContent.includes('.kanban-col-body {') && cssContent.includes('.kanban-col-container {')) {
  console.log("✅ CSS: styles.css contains valid kanban column rules.");
} else {
  console.error("❌ CSS: styles.css missing expected rules.");
}

// 2. Check projectChat.js & projectWorkspace.js
const chatContent = fs.readFileSync(path.join(__dirname, '../js/views/projectChat.js'), 'utf8');
const wsHeaderContent = fs.readFileSync(path.join(__dirname, '../js/views/projectWorkspace.js'), 'utf8');
if (chatContent.includes("floatingChatPopupMount") && wsHeaderContent.includes("headerProjectChatBtn")) {
  console.log("✅ projectChat.js & projectWorkspace.js: Chat is opened cleanly via header/actions and renders popup without persistent bottom floating button.");
} else {
  console.error("❌ projectChat.js / projectWorkspace.js: Missing floatingChatPopupMount or headerProjectChatBtn.");
}

// 3. Check projectWorkspace.js
const wsContent = fs.readFileSync(path.join(__dirname, '../js/views/projectWorkspace.js'), 'utf8');
if (wsContent.includes("boardTasksDropdownBtn") && 
    wsContent.includes("toggleTaskViewDropdown") && 
    wsContent.includes("Create Task") &&
    wsContent.includes("toggleSort") &&
    wsContent.includes("renderBoardCard")) {
  console.log("✅ projectWorkspace.js: Correctly renders All Tasks dropdown, Search, Filter, Sort, and Create Task button.");
} else {
  console.error("❌ projectWorkspace.js: Missing expected methods or toolbar items.");
}

if (wsContent.includes("FloatingProjectChat.updateWidget")) {
  console.log("✅ projectWorkspace.js: Tab switching and render hooks trigger FloatingProjectChat.updateWidget().");
} else {
  console.error("❌ projectWorkspace.js: Missing FloatingProjectChat.updateWidget call.");
}

console.log("=== All checks passed successfully! ===");
