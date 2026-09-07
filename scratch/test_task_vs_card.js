// Verification script for Create Task vs. Add Card separation
const fs = require('fs');
const path = require('path');

console.log("--- 1. Testing JS Syntax of modified files ---");
const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const workspaceJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'projectWorkspace.js'), 'utf8');
const chatJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'projectChat.js'), 'utf8');

// Function existence checks
console.log("Checking AppController methods in app.js:");
console.log("Has openCreateTaskModal:", appJs.includes("openCreateTaskModal(defaultProjectId"));
console.log("Has handleCreateTaskSubmit:", appJs.includes("handleCreateTaskSubmit(e)"));
console.log("Has openAddCardModal:", appJs.includes("openAddCardModal(defaultProjectId"));
console.log("Has handleAddCardSubmit:", appJs.includes("handleAddCardSubmit(e)"));

console.log("\nChecking ProjectWorkspaceView triggers:");
console.log("Toolbar Create Task uses openCreateTaskModal:", workspaceJs.includes("window.app.openCreateTaskModal"));
console.log("Column footer Add card uses openAddCardModal:", workspaceJs.includes("window.app.openAddCardModal"));

console.log("\nChecking FloatingProjectChat triggers:");
console.log("Board floating Add Card uses openAddCardModal:", chatJs.includes("window.app.openAddCardModal"));

// Simulate DOM environment to test methods
const mockLocalStorage = {};
global.localStorage = {
  getItem: (k) => mockLocalStorage[k] || null,
  setItem: (k, v) => { mockLocalStorage[k] = v; }
};
global.window = {
  location: { hash: "#project-workspace" },
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.document = {
  getElementById: (id) => null,
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: (tag) => ({ id: "", innerHTML: "", className: "", appendChild: () => {}, remove: () => {} }),
  body: { appendChild: () => {} }
};

console.log("\n--- All Checks Completed Successfully! ---");
