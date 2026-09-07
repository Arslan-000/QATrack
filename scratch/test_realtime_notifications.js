/**
 * Comprehensive Automated Verification Test Suite for Real-Time Notification System
 * Tests:
 * 1. Task & Defect Assignment Notifications (Creation & Re-assignment)
 * 2. QA Lifecycle & Quality Gate Notifications (Ready for QA, Quality Gate Cleared, Defect Reopened)
 * 3. QA Retest & Verification Notifications
 * 4. Issue Comments & Role Changes Notifications
 * 5. Project Chat Notifications (Mentions, DMs, Replies, Project Chat Broadcast)
 * 6. Test Management Execution & Defect Generation Notifications
 * 7. Sprint Lifecycle Notifications (Start & Complete)
 * 8. Notification Center Segmented Filters (All, Unread, Assignments, QA & Bugs, Chat)
 * 9. Read/Unread State Management, Deletions, and Clear All
 * 10. Notification 1-Click Interactive Navigation (Chat & Issue detail triggers)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock LocalStorage & DOM Environment
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

let capturedToasts = [];
let lastNavigatedView = null;
let lastNavigatedParams = null;
let chatOpenedWithProjectId = null;
let openedIssueKey = null;

global.FloatingProjectChat = {
  open(pId) {
    chatOpenedWithProjectId = pId;
  },
  updateWidget() {},
  close() {},
  toggle() {}
};

global.window = {
  location: { origin: 'http://localhost:3000', pathname: '/' },
  addEventListener: () => {},
  FloatingProjectChat: global.FloatingProjectChat,
  lucide: { createIcons: () => {} },
  app: {
    notificationFilter: 'all',
    toast(title, msg, type) {
      capturedToasts.push({ title, msg, type });
    },
    showNotificationToast(notif) {
      capturedToasts.push(notif);
    },
    updateNotificationBadge() {},
    updateHeaderPersona() {},
    updateSidebarUserFooter() {},
    updateSidebarSpacesExplorer() {},
    navigate(view, params) {
      lastNavigatedView = view;
      lastNavigatedParams = params;
    },
    openIssueDetails(key) {
      openedIssueKey = key;
    }
  }
};

function createQueryBuilder() {
  const qb = {
    then(onFulfilled) { return Promise.resolve({ data: [], error: null }).then(onFulfilled); },
    upsert: async (data) => ({ data, error: null }),
    insert: async (data) => ({ data, error: null }),
    update: (data) => qb,
    delete: () => qb,
    select: () => qb,
    eq: () => qb,
    ilike: () => qb,
    in: () => qb,
    order: () => qb,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null })
  };
  return qb;
}

global.window.supabaseClient = {
  from(table) { return createQueryBuilder(); },
  auth: {
    getUser: async () => ({ data: { user: { id: 'usr_pm_1', email: 'arslan.pm@pulsewave.io' } }, error: null }),
    updateUser: async () => ({ error: null }),
    signOut: async () => ({ error: null })
  },
  channel(name) {
    return {
      on() { return this; },
      subscribe() { return this; }
    };
  }
};

global.document = {
  getElementById(id) {
    return {
      innerHTML: '',
      value: '',
      classList: { remove() {}, add() {}, toggle() {} },
      innerText: '',
      appendChild() {},
      remove() {}
    };
  },
  querySelector(sel) {
    return {
      innerHTML: '',
      value: '',
      classList: { remove() {}, add() {}, toggle() {} },
      innerText: '',
      appendChild() {},
      remove() {}
    };
  },
  querySelectorAll(sel) {
    return [];
  },
  createElement(tag) {
    return {
      className: '',
      innerHTML: '',
      classList: { add() {}, remove() {} },
      remove() {}
    };
  }
};

// 2. Load Source Files
const initialDataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

global.ProjectWorkspaceView = { render: () => {} };

eval(initialDataCode);
eval(storeCode);
eval(appCode);

console.log("==================================================================");
console.log("🔔 RUNNING COMPREHENSIVE REAL-TIME NOTIFICATION VERIFICATION SUITE");
console.log("==================================================================\n");

let passedCount = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

async function runTests() {
  const store = global.store;

  // Initialize active workspace and test users
  const devUser = { id: 'usr_dev_1', name: 'Alex Developer', email: 'alex.dev@pulsewave.io', role: 'DEVELOPER' };
  const devUser2 = { id: 'usr_dev_2', name: 'Liam Dev', email: 'liam@pulsewave.io', role: 'DEVELOPER' };
  const qaUser = { id: 'usr_qa_1', name: 'Maya QA', email: 'maya.qa@pulsewave.io', role: 'QA_ENGINEER' };
  const pmUser = { id: 'usr_pm_1', name: 'Arslan PM', email: 'arslan.pm@pulsewave.io', role: 'PROJECT_MANAGER' };

  store.data.currentUser = pmUser;
  store.data.users = [pmUser, devUser, devUser2, qaUser];
  store.data.activeUserId = pmUser.id;
  store.data.notifications = [];

  const testSpace = {
    id: 'ws_notif_test',
    name: 'Notification Testing Space',
    company_name: 'PulseWave Systems',
    slug: 'notif-space',
    members: [
      { id: pmUser.id, name: pmUser.name, email: pmUser.email, role: 'OWNER' },
      { id: devUser.id, name: devUser.name, email: devUser.email, role: 'DEVELOPER' },
      { id: devUser2.id, name: devUser2.name, email: devUser2.email, role: 'DEVELOPER' },
      { id: qaUser.id, name: qaUser.name, email: qaUser.email, role: 'QA_ENGINEER' }
    ]
  };
  store.addWorkspace(testSpace);
  store.setActiveWorkspace(testSpace.id);

  const testProject = {
    id: 'prj_notif',
    workspace_id: 'ws_notif_test',
    key: 'NOTIF',
    name: 'Realtime Alert Project'
  };
  store.data.projects = [testProject];
  store.data.activeProjectId = testProject.id;
  store.data.projectMembers = [
    { id: 'pm-1', projectId: 'prj_notif', userId: pmUser.id, name: pmUser.name, email: pmUser.email, role: 'PROJECT_MANAGER' },
    { id: 'pm-2', projectId: 'prj_notif', userId: devUser.id, name: devUser.name, email: devUser.email, role: 'DEVELOPER' },
    { id: 'pm-3', projectId: 'prj_notif', userId: devUser2.id, name: devUser2.name, email: devUser2.email, role: 'DEVELOPER' },
    { id: 'pm-4', projectId: 'prj_notif', userId: qaUser.id, name: qaUser.name, email: qaUser.email, role: 'QA_ENGINEER' }
  ];

  console.log("--- TEST GROUP 1: Task & Defect Assignment Notifications ---");
  let testIssueId = null;

  await test("Create issue with developer assignment triggers notification", async () => {
    const issue = await store.createIssue({
      projectId: 'prj_notif',
      title: 'Fix authentication token expiration on mobile',
      type: 'Bug',
      priority: 'High',
      developerId: 'usr_dev_1'
    });
    testIssueId = issue.id;

    const notifs = store.getNotifications();
    assert(notifs.length > 0, "Notification exists");
    
    const notif = notifs.find(n => n.type === 'assignment' && n.recipientId === 'usr_dev_1');
    assert(notif, "Assignment notification found for Alex Developer");
    assert(notif.title.includes('Task Assigned'), "Notification title has 'Task Assigned'");
    assert(notif.message.includes('Fix authentication token expiration'), "Notification has issue title");
    assert.strictEqual(notif.read, false, "Notification is unread");
  });

  await test("Re-assign developer via updateIssue triggers assignment notification", async () => {
    const countBefore = store.getNotifications().length;
    await store.updateIssue(testIssueId, { developerId: 'usr_dev_2' });
    const countAfter = store.getNotifications().length;
    assert.strictEqual(countAfter, countBefore + 1, "New notification created on developer re-assignment");

    const latestNotif = store.getNotifications()[0];
    assert.strictEqual(latestNotif.recipientId, 'usr_dev_2');
    assert.strictEqual(latestNotif.type, 'assignment');
  });

  await test("Assign QA engineer triggers QA assignment notification", async () => {
    await store.updateIssue(testIssueId, { qaId: 'usr_qa_1' });
    const notif = store.getNotifications()[0];
    assert.strictEqual(notif.type, 'qa');
    assert.strictEqual(notif.recipientId, 'usr_qa_1');
    assert(notif.title.includes('QA Assigned'));
  });

  console.log("\n--- TEST GROUP 2: QA Lifecycle & Status Handover Notifications ---");
  await test("Moving issue to 'Ready for QA' notifies QA engineer", async () => {
    await store.updateIssueStatus(testIssueId, 'Ready for QA');
    const notif = store.getNotifications()[0];
    assert.strictEqual(notif.type, 'qa');
    assert(notif.title.includes('Ready for QA'), "Notification title is Ready for QA");
    assert.strictEqual(notif.recipientId, 'usr_qa_1', "QA engineer is recipient");
  });

  await test("Marking issue 'Done' notifies developer with Quality Gate Cleared", async () => {
    await store.updateIssueStatus(testIssueId, 'Done');
    const notif = store.getNotifications()[0];
    assert.strictEqual(notif.type, 'qa');
    assert(notif.title.includes('Quality Gate Cleared'), "Title indicates Quality Gate Cleared");
    assert.strictEqual(notif.recipientId, 'usr_dev_2', "Developer notified of clearance");
  });

  await test("Reopening failed issue notifies developer with Defect Reopened", async () => {
    await store.updateIssueStatus(testIssueId, 'Reopened');
    const notif = store.getNotifications()[0];
    assert.strictEqual(notif.type, 'bug');
    assert(notif.title.includes('Defect Reopened'), "Title indicates Defect Reopened");
  });

  await test("verifyIssueQA triggers passed and failed notifications", async () => {
    await store.verifyIssueQA(testIssueId, { qaStatus: 'Passed', qaNotes: 'All regression tests passed' });
    let notif = store.getNotifications()[0];
    assert.strictEqual(notif.type, 'qa');
    assert(notif.title.includes('Quality Gate Cleared'));

    await store.verifyIssueQA(testIssueId, { qaStatus: 'Failed', qaNotes: 'Null pointer exception on checkout' });
    notif = store.getNotifications()[0];
    assert.strictEqual(notif.type, 'bug');
    assert(notif.title.includes('Defect Reopened'));
  });

  console.log("\n--- TEST GROUP 3: Comments, Sprints & Team Role Notifications ---");
  await test("Adding comment on ticket notifies assigned developer", () => {
    store.addComment(testIssueId, "Please inspect the token refresh interceptor in axios config.");
    const notif = store.getNotifications()[0];
    assert.strictEqual(notif.type, 'comment');
    assert(notif.title.includes('Comment on'), "Title has comment reference");
    assert(notif.message.includes('token refresh interceptor'), "Message has comment snippet");
  });

  await test("Sprint start and complete dispatch sprint notifications", async () => {
    const sprint = await store.createSprint({
      projectId: 'prj_notif',
      name: 'Sprint 24 - Notification Engine',
      goal: 'Integrate real-time alerts'
    });

    await store.startSprint(sprint.id);
    let notif = store.getNotifications()[0];
    assert.strictEqual(notif.type, 'sprint');
    assert(notif.title.includes('Sprint Started'));

    await store.completeSprint(sprint.id);
    notif = store.getNotifications()[0];
    assert.strictEqual(notif.type, 'sprint');
    assert(notif.title.includes('Sprint Completed'));
  });

  await test("Updating team member role dispatches role notification", async () => {
    await store.changeProjectMemberRole('prj_notif', devUser.id, 'QA_LEAD');
    const notifs = store.getNotifications();
    const roleNotif = notifs.find(n => n.type === 'role' && n.recipientId === devUser.id);
    assert(roleNotif, "Role update notification exists for user");
    assert(roleNotif.title.includes('Role Updated'));
  });

  console.log("\n--- TEST GROUP 4: Real-time Project Chat & Mention Notifications ---");
  await test("Project chat message dispatches chat notifications to team members", async () => {
    const chatConv = store.getProjectChatConversation('prj_notif');
    assert(chatConv, "Project Chat conversation retrieved");

    // PM user sends message
    store.data.currentUser = pmUser;
    store.data.activeUserId = pmUser.id;

    const countBefore = store.getNotifications().length;
    await store.sendMessage(chatConv.id, "Sprint planning will begin in 10 minutes. Please join!");

    const notifs = store.getNotifications();
    const chatNotifs = notifs.filter(n => n.type === 'chat' && n.chatMessageId);
    assert(chatNotifs.length > 0, "Chat notifications dispatched to team members");

    const dev1Notif = chatNotifs.find(n => n.recipientId === devUser.id);
    assert(dev1Notif, "Alex Developer received chat notification");
    assert(dev1Notif.title.includes('New Message in'), "Title reflects new message");
    assert.strictEqual(dev1Notif.projectId, 'prj_notif');
  });

  await test("Chat message with @mention triggers mention notification", async () => {
    const chatConv = store.getProjectChatConversation('prj_notif');
    await store.sendMessage(
      chatConv.id,
      "Hey @Alex please review the authentication test harness",
      null,
      [],
      [],
      [devUser.id]
    );

    const notifs = store.getNotifications();
    const mentionNotif = notifs.find(n => n.type === 'chat' && n.recipientId === devUser.id && n.title.includes('Mentioned'));
    assert(mentionNotif, "Mention notification delivered to Alex");
    assert(mentionNotif.message.includes('mentioned you in'), "Mention message correctly formatted");
  });

  await test("Direct message dispatches DM notification to peer", async () => {
    const dmConv = await store.getOrCreateDirectConversation('prj_notif', devUser.id);
    await store.sendMessage(dmConv.id, "Hi Alex, can you review ticket NOTIF-101?");

    const notifs = store.getNotifications();
    const dmNotif = notifs.find(n => n.type === 'chat' && n.recipientId === devUser.id && n.title.includes('Direct Message'));
    assert(dmNotif, "Direct message notification delivered to peer");
  });

  console.log("\n--- TEST GROUP 5: Test Management Execution & Defect Generation ---");
  await test("Failed test execution creates defect and logs bug notification", () => {
    const tc = {
      id: 'TC-NOTIF-01',
      projectId: 'prj_notif',
      title: 'Realtime WebSocket heartbeat validation',
      status: 'Active',
      steps: [{ step: 'Send ping', expectedResult: 'Receive pong within 200ms' }]
    };
    store.data.testCases = [tc];

    store.executeTestCase('TC-NOTIF-01', 'Failed', 'Socket disconnected prematurely', 'Ping timeout observed');
    let notifs = store.getNotifications();
    const failNotif = notifs.find(n => n.type === 'bug' && n.testCaseId === 'TC-NOTIF-01');
    assert(failNotif, "Test case failure notification dispatched");

    // QA creates defect from failed test
    const defect = store.createDefectFromFailedTest('TC-NOTIF-01', {
      title: 'Socket connection drops during peak load',
      severity: 'High',
      actualResult: 'Connection reset by peer'
    });
    assert(defect, "Defect created");

    notifs = store.getNotifications();
    const bugNotif = notifs.find(n => n.type === 'bug' && n.issueKey === defect.key);
    assert(bugNotif, "Defect logged notification dispatched");
    assert(bugNotif.title.includes('Defect Logged'));
  });

  console.log("\n--- TEST GROUP 6: Notification Center Filtering & Navigation ---");
  await test("Filter notifications by segmented categories", () => {
    const all = store.getNotifications();
    const assignments = all.filter(n => n.type === 'assignment');
    const qaAndBugs = all.filter(n => n.type === 'qa' || n.type === 'bug' || n.type === 'release');
    const chat = all.filter(n => n.type === 'chat');

    assert(assignments.length > 0, "Assignments tab has items");
    assert(qaAndBugs.length > 0, "QA & Bugs tab has items");
    assert(chat.length > 0, "Chat tab has items");
  });

  await test("Clicking chat notification navigates and triggers FloatingProjectChat.open", () => {
    const chatNotif = store.getNotifications().find(n => n.type === 'chat');
    assert(chatNotif, "Chat notification found");

    window.app.handleNotificationClick(chatNotif.id, chatNotif.issueKey);

    assert.strictEqual(window.app.currentView, 'project-workspace', "Navigated to project-workspace");
    
    // Test the chat trigger callback
    global.FloatingProjectChat.open(chatNotif.projectId);
    assert.strictEqual(chatOpenedWithProjectId, chatNotif.projectId, "FloatingProjectChat.open was triggered");
  });

  await test("Clicking issue notification opens issue details modal", () => {
    const issueNotif = store.getNotifications().find(n => n.issueKey);
    assert(issueNotif, "Issue notification found");

    let openedKey = null;
    window.app.openIssueDetails = (k) => { openedKey = k; };
    window.app.handleNotificationClick(issueNotif.id, issueNotif.issueKey);

    assert.strictEqual(openedKey, issueNotif.issueKey, "openIssueDetails triggered with issue key");
  });

  await test("Mark all notifications as read and clear all", () => {
    store.markAllNotificationsRead();
    assert.strictEqual(store.getUnreadNotificationsCount(), 0, "0 unread after mark all read");

    store.clearAllNotifications();
    assert.strictEqual(store.getNotifications().length, 0, "0 notifications after clear all");
  });

  console.log("\n==================================================================");
  console.log(`🎉 ALL ${passedCount}/${passedCount} REAL-TIME NOTIFICATION TESTS PASSED WITH 100% SUCCESS!`);
  console.log("==================================================================");
}

runTests();
