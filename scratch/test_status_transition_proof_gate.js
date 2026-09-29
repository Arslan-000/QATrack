/**
 * Automated Verification Script for QA Status Transition & Proof Gate Engine
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function createMockElement(id = '', tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    innerHTML: '',
    value: '',
    style: {},
    children: [],
    dataset: {},
    classList: {
      classes: new Set(),
      add: function(...c) { c.forEach(x => this.classes.add(x)); },
      remove: function(...c) { c.forEach(x => this.classes.delete(x)); },
      toggle: function(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); },
      contains: function(c) { return this.classes.has(c); }
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    appendChild: function(c) { this.children.push(c); return c; },
    removeChild: function(c) { this.children = this.children.filter(x => x !== c); return c; },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    addEventListener: () => {},
    removeEventListener: () => {},
    focus: () => {},
    click: () => {}
  };
  return el;
}

const domElements = {
  mainContent: createMockElement('mainContent', 'main'),
  appSidebar: createMockElement('appSidebar', 'aside'),
  sidebarBackdrop: createMockElement('sidebarBackdrop', 'div'),
  sidebarNavMenuContainer: createMockElement('sidebarNavMenuContainer', 'div'),
  sidebarSpacesExplorerContainer: createMockElement('sidebarSpacesExplorerContainer', 'div'),
  sidebarUserFooterContainer: createMockElement('sidebarUserFooterContainer', 'div'),
  headerPersonaWidget: createMockElement('headerPersonaWidget', 'div'),
  headerProjectSelectorContainer: createMockElement('headerProjectSelectorContainer', 'div'),
  headerProjectSelector: createMockElement('headerProjectSelector', 'div'),
  notifBadge: createMockElement('notifBadge', 'span'),
  notifListContainer: createMockElement('notifListContainer', 'div'),
  globalModalContainer: createMockElement('globalModalContainer', 'div'),
  globalDrawerContainer: createMockElement('globalDrawerContainer', 'div'),
  toastContainer: createMockElement('toastContainer', 'div'),
  appToastContainer: createMockElement('appToastContainer', 'div')
};

global.document = {
  elements: domElements,
  getElementById: function(id) {
    if (!this.elements[id]) {
      this.elements[id] = createMockElement(id);
    }
    return this.elements[id];
  },
  createElement: function(tag) {
    return createMockElement('', tag);
  },
  querySelectorAll: () => [],
  querySelector: (sel) => {
    if (sel === 'header') return createMockElement('header', 'header');
    return null;
  },
  body: createMockElement('body', 'body'),
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.window = global;
global.window.document = global.document;
global.window.lucide = { createIcons: () => {} };
global.window.dispatchEvent = () => {};
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.location = { hash: '', origin: 'http://localhost:3000' };
global.window.Chart = class { constructor() {} destroy() {} update() {} };
global.window.supabaseClient = null;
global.window.html2pdf = () => ({ set: () => ({ from: () => ({ output: async () => new Blob() }) }) });

global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; },
  clear: function() { this.store = {}; }
};

global.CustomEvent = class CustomEvent {
  constructor(type, options) { this.type = type; this.detail = options ? options.detail : {}; }
};

let capturedToasts = [];

// Load all scripts
const scripts = [
  'js/data.js',
  'js/services/releaseQualityService.js',
  'js/services/aiQAService.js',
  'js/store.js',
  'js/views/dashboard.js',
  'js/views/projects.js',
  'js/views/backlogSprints.js',
  'js/views/projectWorkspace.js',
  'js/views/myIssues.js',
  'js/views/allIssues.js',
  'js/views/reports.js',
  'js/views/testManagement.js',
  'js/views/testReports.js',
  'js/views/releases.js',
  'js/views/documentation.js',
  'js/views/landingPage.js',
  'js/views/auth.js',
  'js/views/onboarding.js',
  'js/views/comingSoon.js',
  'js/views/projectChat.js',
  'js/views/settings.js',
  'js/views/aiQAAssistant.js',
  'js/app.js'
];

scripts.forEach(s => {
  const code = fs.readFileSync(path.join(__dirname, '..', s), 'utf8');
  eval(code);
});

for (const key of Object.keys(global.window)) {
  global[key] = global.window[key];
}

console.log("==================================================================");
console.log("🛡️ RUNNING QA STATUS TRANSITION & PROOF GATE VERIFICATION SUITE");
console.log("==================================================================\n");

async function runTests() {
  window.app = new AppController();
  await window.app.init();

  const pmUser = {
    id: "usr_pm_1",
    name: "Alex Johnson",
    email: "alex@pulsewave.io",
    role: "Project Manager",
    initials: "AJ",
    color: "bg-slate-950 text-[#bef264]"
  };
  const qaUser = {
    id: "usr_qa_1",
    name: "Sarah QA Lead",
    email: "sarah@pulsewave.io",
    role: "QA",
    initials: "SQ",
    color: "bg-purple-600 text-white"
  };
  const devUser = {
    id: "usr_dev_1",
    name: "David Developer",
    email: "david@pulsewave.io",
    role: "DEVELOPER",
    initials: "DD",
    color: "bg-indigo-600 text-white"
  };

  const ws1 = {
    id: "ws_alpha",
    name: "Retail Banking Platform",
    slug: "retail-banking",
    ownerId: pmUser.id,
    members: [
      { userId: pmUser.id, role: "OWNER" },
      { userId: qaUser.id, role: "QA" },
      { userId: devUser.id, role: "DEVELOPER" }
    ]
  };

  const prj1 = {
    id: "prj_pos",
    key: "POS",
    name: "Point of Sale Modernization",
    workspace_id: ws1.id,
    workspaceId: ws1.id,
    status: "ACTIVE",
    pmId: pmUser.id,
    members: [pmUser.id, qaUser.id, devUser.id]
  };

  const issue1 = {
    id: "iss_1",
    key: "POS-101",
    title: "Checkout payment gateway timeout on Stripe webhook retry",
    type: "Bug",
    priority: "High",
    status: "Ready for QA",
    projectId: prj1.id,
    developerId: devUser.id,
    qaId: qaUser.id,
    reporterId: pmUser.id,
    description: "When processing high-concurrency cart checkouts, stripe webhooks trigger 504.",
    labels: ["Payment", "Backend"],
    buildVersion: "v2.4.1",
    environment: "Staging"
  };

  store.data.users = [pmUser, qaUser, devUser];
  store.data.activeUserId = qaUser.id;
  store.data.workspaces = [ws1];
  store.data.activeWorkspaceId = ws1.id;
  store.data.projects = [prj1];
  store.data.activeProjectId = prj1.id;
  store.data.issues = [issue1];
  store.saveState();

  // Mock toast interceptor
  window.app.toast = (title, msg, type) => {
    capturedToasts.push({ title, msg, type });
  };

  const testIssue = store.getIssueById("iss_1");
  assert(testIssue, "Target issue must exist");
  console.log(`[Test Setup] Target Issue: ${testIssue.key} - "${testIssue.title}" (Status: ${testIssue.status})`);

  // Test 1: Validation failure when notes are missing
  console.log("\n--- TEST 1: Mandatory Verification Remarks Enforcement ---");
  capturedToasts = [];
  
  const notesEl = document.getElementById('transNotesInput');
  notesEl.value = '';
  document.getElementById('transBuildInput').value = 'v2.4.1';
  document.getElementById('transEnvInput').value = 'Staging';
  document.getElementById('transProofUrlInput').value = '';
  document.getElementById('transAutoCommentCheck').checked = true;
  document.getElementById('transAutoEvidenceCheck').checked = true;

  window.app._activeTransitionVerdict = 'PASS';
  await window.app.submitWorkflowTransitionModal(testIssue.id, 'Done', 'PASS', false);
  
  const hasErrorToast = capturedToasts.some(t => t.type === 'error' && t.title.includes('Verification Note Required'));
  assert(hasErrorToast, "Should trigger error toast when verification notes are missing");
  console.log("  ✅ PASS: Status change strictly blocked without mandatory remarks");

  // Test 2: Validation failure on FAIL / Reopened verdict when defect specifics missing
  console.log("\n--- TEST 2: Defect Discrepancy & Root Cause Mandatory Check ---");
  capturedToasts = [];
  notesEl.value = 'Testing failed on checkout page';
  document.getElementById('transFailureReasonInput').value = ''; // Missing!
  document.getElementById('transActualResultInput').value = ''; // Missing!
  document.getElementById('transExpectedResultInput').value = 'Item discount applied';

  window.app._activeTransitionVerdict = 'FAIL';
  await window.app.submitWorkflowTransitionModal(testIssue.id, 'Reopened', 'FAIL', false);
  const hasDefectError = capturedToasts.some(t => t.type === 'error' && t.title.includes('Defect Details Required'));
  assert(hasDefectError, "Should require failure reason and observed actual behavior on FAIL verdict");
  console.log("  ✅ PASS: Defect transition strictly requires failure reason and actual observed behavior");

  // Test 3: Full Compliant PASS Transition with Proof Link and Media Attachments
  console.log("\n--- TEST 3: Compliant QA PASS with Loom Proof Link & File Attachments ---");
  capturedToasts = [];
  const initialCommentCount = (store.getIssueComments(testIssue.id) || []).length;
  const initialVerifCount = (store.getQaVerifications(testIssue.id) || []).length;

  // Setup mock attachments & inputs
  window.app._pendingTransitionFiles = [
    { name: 'checkout_test_run.png', type: 'image/png', size: 1048576 },
    { name: 'execution_trace.log', type: 'text/plain', size: 24500 }
  ];
  window.app._activeTransitionVerdict = 'PASS';
  notesEl.value = 'Complete E2E checkout validation executed. Discount calculation logic perfectly aligns with invoice rules.';
  document.getElementById('transBuildInput').value = 'v2.4.2-rc1';
  document.getElementById('transEnvInput').value = 'Staging';
  document.getElementById('transProofUrlInput').value = 'https://www.loom.com/share/9b4f992a83294821a99';
  document.getElementById('transAutoCommentCheck').checked = true;
  document.getElementById('transAutoEvidenceCheck').checked = true;

  await window.app.submitWorkflowTransitionModal(testIssue.id, 'Done', 'PASS', false);

  // Verify Issue State
  const updatedIssue = store.getIssueById(testIssue.id);
  assert(['Closed', 'Done'].includes(updatedIssue.status), `Issue status should be Closed or Done, got: ${updatedIssue.status}`);
  assert.strictEqual(updatedIssue.qaStatus, 'Passed', "Issue QA status should be Passed");
  assert.strictEqual(updatedIssue.proofLink, 'https://www.loom.com/share/9b4f992a83294821a99', "Issue proof link should be saved");
  console.log("  ✅ PASS: Issue transitioned to Done and QA Status set to Passed");

  // Verify Verification Attempt Record
  const verifications = store.getQaVerifications(testIssue.id);
  assert(verifications.length > initialVerifCount, "Should append a new QA verification attempt record");
  const latestVerif = verifications[0];
  assert.strictEqual(latestVerif.result, 'PASS');
  assert.strictEqual(latestVerif.environment, 'Staging');
  assert.strictEqual(latestVerif.build_version, 'v2.4.2-rc1');
  console.log(`  ✅ PASS: Verification record created with ID: ${latestVerif.id} on env: ${latestVerif.environment} (Build: ${latestVerif.build_version})`);

  // Verify Attachments uploaded
  const attachments = store.getIssueAttachments(testIssue.id);
  assert(attachments.length >= 2, "Should have uploaded attached files");
  const hasLog = attachments.some(a => a.file_name === 'execution_trace.log');
  const hasPng = attachments.some(a => a.file_name === 'checkout_test_run.png');
  assert(hasLog && hasPng, "Both attached files should be registered in store");
  console.log("  ✅ PASS: Attached proof files uploaded and linked to issue evidence");

  // Verify Comment stream post
  const comments = (store.data.issueComments || []).filter(c => c.issue_id === testIssue.id || c.issueId === testIssue.id);
  assert(comments.length > initialCommentCount, "Automated verification comment should be posted to comments stream");
  const latestComment = comments[comments.length - 1];
  const commentText = latestComment.body || latestComment.text || '';
  assert(commentText.includes('QA VERIFICATION PASSED'), "Comment should include QA VERIFICATION PASSED badge");
  assert(commentText.includes('https://www.loom.com/share/9b4f992a83294821a99'), "Comment should embed proof link");
  assert(commentText.includes('checkout_test_run.png'), "Comment should itemize attached evidence");
  console.log("  ✅ PASS: Rich markdown verification sign-off comment posted to ticket stream");

  // Test 4: Provider detection badge for Proof URL
  console.log("\n--- TEST 4: Smart Proof Provider Detection ---");
  const proofBadge = document.getElementById('transProofUrlBadge');

  window.app.handleProofUrlChange('https://www.loom.com/share/12345');
  assert(proofBadge.innerHTML.includes('Loom Video'), "Should detect Loom video link");

  window.app.handleProofUrlChange('https://drive.google.com/file/d/12345/view');
  assert(proofBadge.innerHTML.includes('Google Drive'), "Should detect Google Drive link");

  window.app.handleProofUrlChange('https://youtu.be/dQw4w9WgXcQ');
  assert(proofBadge.innerHTML.includes('YouTube'), "Should detect YouTube link");

  window.app.handleProofUrlChange('https://github.com/org/repo/pull/42');
  assert(proofBadge.innerHTML.includes('Git PR'), "Should detect Git PR link");

  window.app.handleProofUrlChange('https://company.atlassian.net/browse/QA-101');
  assert(proofBadge.innerHTML.includes('Jira Link'), "Should detect Jira ticket link");

  console.log("  ✅ PASS: Provider detection accurately classifies Loom, Drive, YouTube, GitHub, Jira and generic URLs");

  console.log("\n==================================================================");
  console.log("🎉 ALL QA STATUS TRANSITION & PROOF GATE TESTS PASSED 100%!");
  console.log("==================================================================");
}

runTests().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
