/**
 * Automated Verification Suite for Issue Status Update & Defect Lifecycle Fix
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock localStorage
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

let lastSupabaseUpsert = null;
let lastSupabaseUpdate = null;

// Mock Supabase Query Builder
function createQueryBuilder() {
  const qb = {
    then(onFulfilled) { return Promise.resolve({ data: [], error: null }).then(onFulfilled); },
    upsert: async (data) => {
      lastSupabaseUpsert = data;
      return { data, error: null };
    },
    update: (data) => {
      lastSupabaseUpdate = data;
      return {
        eq: () => ({
          then: (resolve) => resolve({ data, error: null })
        })
      };
    },
    delete: () => qb,
    select: () => qb,
    eq: () => qb,
    in: () => qb,
    order: () => qb,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null })
  };
  return qb;
}

global.window = {
  location: { origin: 'http://localhost:3000', pathname: '/' },
  addEventListener: () => {},
  app: {
    currentView: "project-workspace",
    toast(title, msg, type) {
      console.log(`  [Toast ${type.toUpperCase()}] ${title}: ${msg}`);
    },
    showNotificationToast() {},
    openIssueDetails(id) {},
    navigate(route) { this.currentView = route; }
  },
  lucide: { createIcons() {} },
  supabaseClient: {
    from(table) { return createQueryBuilder(); }
  }
};

const domElements = {};
global.document = {
  body: { appendChild(el) { domElements[el.id] = el; } },
  getElementById(id) {
    if (!domElements[id]) {
      domElements[id] = { 
        id, 
        innerHTML: '', 
        value: '', 
        classList: { remove() {}, add() {}, toggle() {} },
        appendChild() {},
        remove() {}
      };
    }
    return domElements[id];
  },
  createElement(tag) { 
    return { 
      className: '', 
      innerHTML: '', 
      setAttribute() {}, 
      appendChild() {},
      remove() {}
    }; 
  },
  addEventListener() {}
};

// Load code files
const initialDataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

eval(initialDataCode);
eval(storeCode);
eval(appCode);

async function runIssueStatusTests() {
  console.log('========================================================');
  console.log('🧪 TESTING ISSUE STATUS UPDATES & DEFECT WORKFLOWS');
  console.log('========================================================\n');

  const store = global.store;

  // 1. Setup isolated user and project
  console.log('Step 1: Setting up test workspace & issue...');
  const testDev = { id: 'usr_dev_1', name: 'Arslan Dev', email: 'arslan@pulsewave.io', role: 'DEVELOPER' };
  const testQA = { id: 'usr_qa_1', name: 'Sarah QA', email: 'sarah@pulsewave.io', role: 'QA' };
  store.data.users = [testDev, testQA];
  store.data.currentUser = testDev;
  store.data.activeUserId = testDev.id;

  const testProject = { id: 'prj_rpi', name: 'Retail POS Integration', key: 'RPI', workspaceId: 'ws_1', status: 'Active' };
  store.data.projects = [testProject];
  store.data.issues = [];
  store.setActiveProject('prj_rpi');

  const issue = await store.createIssue({
    id: 'iss_tsk_103',
    projectId: testProject.id,
    key: 'TSK-103',
    title: 'Order sync failed',
    type: 'Task',
    priority: 'Critical',
    status: 'In Progress',
    developerId: testDev.id,
    qaId: testQA.id
  });

  assert.strictEqual(issue.status, 'In Progress');
  console.log('✅ Step 1 Passed: Issue initialized with status "In Progress".\n');

  // 2. Test updating status to "Ready for QA" (and "Fixed" alias)
  console.log('Step 2: Testing update status to "Fixed" (alias for Ready for QA)...');
  await store.updateIssueStatus(issue.id, 'Fixed');
  
  const issueAfterFixed = store.getIssueById(issue.id);
  assert.strictEqual(issueAfterFixed.status, 'Ready for QA', 'Status "Fixed" should normalize to "Ready for QA"');
  assert.strictEqual(issueAfterFixed.qaStatus, 'Ready for QA', 'QA status should be set to "Ready for QA"');
  assert.strictEqual(lastSupabaseUpsert.status, 'Ready for QA', 'Supabase payload status should be "Ready for QA"');
  console.log('✅ Step 2 Passed: "Fixed" normalized and synced as "Ready for QA".\n');

  // 3. Test QA Verification Transition to "Done"
  console.log('Step 3: Testing update status to "Done"...');
  await store.updateIssueStatus(issue.id, 'Done');
  
  const issueAfterDone = store.getIssueById(issue.id);
  assert.strictEqual(issueAfterDone.status, 'Done', 'Status should be "Done"');
  assert.strictEqual(issueAfterDone.qaStatus, 'Passed', 'QA status should automatically clear to "Passed"');
  assert.strictEqual(lastSupabaseUpsert.status, 'Done');
  assert.strictEqual(lastSupabaseUpsert.qa_status, 'Passed');
  console.log('✅ Step 3 Passed: "Done" transition clears Quality Gate to "Passed".\n');

  // 4. Test Defect Reopened Workflow
  console.log('Step 4: Testing Defect Reopened Workflow...');
  const initialReopenCount = issueAfterDone.reopenCount || 0;
  await store.updateIssueStatus(issue.id, 'Reopened');
  
  const issueAfterReopened = store.getIssueById(issue.id);
  assert.strictEqual(issueAfterReopened.status, 'Reopened', 'Status should be "Reopened"');
  assert.strictEqual(issueAfterReopened.qaStatus, 'Failed', 'QA status should be set to "Failed"');
  assert.strictEqual(issueAfterReopened.reopenCount, initialReopenCount + 1, 'Reopen counter must increment');
  assert.strictEqual(lastSupabaseUpsert.reopen_count, 1);
  console.log('✅ Step 4 Passed: Defect Reopened sets QA Status to "Failed" and increments reopen_count.\n');

  // 5. Test app.js changeIssueStatus integration
  console.log('Step 5: Testing window.app.changeIssueStatus integration...');
  await window.app.changeIssueStatus(issue.id, 'To Do');
  assert.strictEqual(store.getIssueById(issue.id).status, 'To Do', 'Status should be updated to "To Do"');
  console.log('✅ Step 5 Passed: window.app.changeIssueStatus integrated cleanly.\n');

  // 6. Test Non-Fatal Supabase Error Resilience (Ensures Local State is NOT Reverted)
  console.log('Step 6: Testing Non-Fatal Supabase Error Resilience...');
  global.window.supabaseClient = {
    from() {
      return {
        upsert: async () => ({ data: null, error: { message: 'Network connection timeout' } }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Network timeout' } }) })
      };
    }
  };

  await store.updateIssueStatus(issue.id, 'In Progress');
  assert.strictEqual(store.getIssueById(issue.id).status, 'In Progress', 'Local status must persist cleanly and not be reverted');
  console.log('✅ Step 6 Passed: Local status persisted reliably even when network warning occurs.\n');

  console.log('========================================================');
  console.log('🎉 ALL 6 ISSUE STATUS UPDATE TESTS PASSED WITH 100% SUCCESS!');
  console.log('========================================================');
  process.exit(0);
}

runIssueStatusTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
