/**
 * Automated Verification Test Suite for Comprehensive Notification & Email Notification System
 * Covers:
 * 1. Project & Workspace Assignment Notifications & Emails
 * 2. Issue Lifecycle & Task Assignment Notifications & Emails
 * 3. QA Handover (Ready for QA) & Quality Gate Sign-off (Done, Reopened)
 * 4. Critical Defect Broadcast Escalations
 * 5. Real-time Chat Mentions & Direct Message Emails
 * 6. Sprint Milestone (Start / Complete) Notifications & Emails
 * 7. User Notification Preferences (Enabling / Disabling channels)
 * 8. HTML Template Generator & Email Dispatch Audit Logging
 * 9. Settings View & Notification Center Integration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Setup Node / Browser Mock Environment
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

global.window = {
  app: {
    toast(title, msg, type) {},
    updateNotificationBadge() {},
    showNotificationToast(notif) {},
    showEmailToast(log) {}
  },
  location: { origin: 'https://pulsewave.io' }
};

global.document = {
  getElementById(id) {
    return {
      innerHTML: '',
      classList: { add() {}, remove() {} },
      appendChild() {},
      value: ''
    };
  },
  body: { appendChild() {} }
};

// Load data.js, store.js, settings.js
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const settingsCode = fs.readFileSync(path.join(__dirname, '../js/views/settings.js'), 'utf8');

eval(dataCode);
eval(storeCode);
eval(settingsCode);
global.SettingsView = global.window.SettingsView;

let passedCount = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function runTests() {
  console.log("🔔 RUNNING COMPREHENSIVE NOTIFICATION & EMAIL NOTIFICATION VERIFICATION SUITE\n");

  // Reset store data
  store.data.notifications = [];
  store.data.emailLogs = [];
  store.data.userPreferences = {};
  
  // Seed space, projects, users
  const ws = { id: 'ws-test-1', name: 'Notification Alpha Space', slug: 'notif-alpha' };
  store.data.workspaces = [ws];
  store.data.activeWorkspaceId = ws.id;

  const userLead = { id: 'u-lead', name: 'Sarah Jenkins', email: 'sarah@pulsewave.io', role: 'PROJECT_MANAGER' };
  const userDev = { id: 'u-dev', name: 'David Chen', email: 'david.dev@pulsewave.io', role: 'DEVELOPER' };
  const userQA = { id: 'u-qa', name: 'Elena Rostova', email: 'elena.qa@pulsewave.io', role: 'QA_ENGINEER' };
  
  store.data.users = [userLead, userDev, userQA];
  store.data.activeUserId = userLead.id;

  const project = {
    id: 'prj-notif-1',
    key: 'NOTIF',
    name: 'Notification Core Engine',
    workspaceId: ws.id,
    members: [userLead.id, userDev.id, userQA.id],
    qaLeadId: userQA.id
  };
  store.data.projects = [project];
  store.data.activeProjectId = project.id;
  store.data.projectMembers = [
    { id: 'pm-1', projectId: project.id, userId: userLead.id, email: userLead.email, role: 'LEAD', name: userLead.name },
    { id: 'pm-2', projectId: project.id, userId: userDev.id, email: userDev.email, role: 'DEVELOPER', name: userDev.name },
    { id: 'pm-3', projectId: project.id, userId: userQA.id, email: userQA.email, role: 'QA', name: userQA.name }
  ];

  console.log("--- TEST GROUP 1: Project & Workspace Assignment Notifications & Emails ---");

  await test("addProjectMember dispatches in-app notification and email log", async () => {
    const newUser = { id: 'u-new-designer', name: 'Marcus Miller', email: 'marcus@pulsewave.io', role: 'DESIGNER' };
    store.data.users.push(newUser);

    const mem = await store.addProjectMember(project.id, {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: 'DESIGNER'
    });

    assert(mem, "Project member added");
    
    // Check in-app notification
    const notifs = store.getNotifications(newUser.id);
    const assignNotif = notifs.find(n => n.recipientEmail === newUser.email || n.recipientId === newUser.id);
    assert(assignNotif, "Assignment in-app notification found for Marcus");
    assert(assignNotif.title.includes("Project Assignment"), "Notification title is Project Assignment");

    // Check email log
    const emailLogs = store.getEmailLogs();
    const email = emailLogs.find(e => e.recipient === newUser.email && e.type === 'project_assignment');
    assert(email, "Project assignment email logged");
    assert(email.html.includes("PulseWave"), "Email template contains PulseWave branding");
    assert(email.html.includes("Core Engine"), "Email template mentions project name");
    assert.strictEqual(email.status, "delivered");
  });

  await test("inviteMember dispatches in-app invitation notification and email", async () => {
    const inviteEmail = 'contractor@externalqa.io';
    const inv = await store.inviteMember({
      workspaceId: ws.id,
      projectId: project.id,
      email: inviteEmail,
      role: 'QA',
      scope: 'PROJECT'
    });

    assert(inv, "Invitation generated");
    const emailLogs = store.getEmailLogs();
    const invEmail = emailLogs.find(e => e.recipient === inviteEmail);
    assert(invEmail, "Invitation email logged for contractor");
    assert(invEmail.subject.includes("Invitation"), "Email subject mentions Invitation");
    assert(invEmail.html.includes("Accept Invitation"), "Email template includes CTA button");
  });

  console.log("\n--- TEST GROUP 2: Task & Issue Assignment Notifications & Emails ---");

  let createdIssue = null;
  await test("createIssue with developer assignment triggers assignment notification & email", async () => {
    store.setActiveUser(userLead.id);
    createdIssue = await store.createIssue({
      projectId: project.id,
      title: "Implement Real-time WebSocket Mailer",
      type: "Task",
      priority: "High",
      developerId: userDev.id,
      qaId: userQA.id
    });

    assert(createdIssue, "Issue created");

    // Developer in-app notification
    const devNotifs = store.getNotifications(userDev.id);
    const notif = devNotifs.find(n => n.issueId === createdIssue.id);
    assert(notif, "Developer received assignment notification");
    assert(notif.title.includes("Task Assigned"), "Notification title includes Task Assigned");

    // Developer email log
    const emailLogs = store.getEmailLogs();
    const devEmail = emailLogs.find(e => e.recipient === userDev.email && e.issueKey === createdIssue.key);
    assert(devEmail, "Developer received assignment email log");
    assert(devEmail.html.includes(createdIssue.title), "Email HTML includes issue title");
    assert(devEmail.html.includes("TASK ASSIGNED"), "Email HTML has TASK ASSIGNED badge");
  });

  await test("updateIssue re-assignment dispatches notification and email to new developer", async () => {
    const newUser = store.data.users.find(u => u.id === 'u-new-designer');
    await store.updateIssue(createdIssue.id, {
      developerId: newUser.id
    });

    const emailLogs = store.getEmailLogs();
    const reassignEmail = emailLogs.find(e => e.recipient === newUser.email && e.issueKey === createdIssue.key);
    assert(reassignEmail, "Reassigned user received task assignment email");
  });

  console.log("\n--- TEST GROUP 3: QA Verification Handover & Quality Gate Sign-offs ---");

  await test("Moving issue to 'Ready for QA' notifies and emails QA Lead", async () => {
    store.setActiveUser(userDev.id);
    await store.updateIssueStatus(createdIssue.id, "Ready for QA");

    assert.strictEqual(createdIssue.status, "Ready for QA");
    assert.strictEqual(createdIssue.qaStatus, "Ready for QA");

    // QA in-app notification
    const qaNotifs = store.getNotifications(userQA.id);
    const qaNotif = qaNotifs.find(n => n.issueId === createdIssue.id && n.title.includes("Ready for QA"));
    assert(qaNotif, "QA received Ready for QA notification");

    // QA email log
    const emailLogs = store.getEmailLogs();
    const qaEmail = emailLogs.find(e => e.recipient === userQA.email && e.type === 'qa_handoff' && e.issueKey === createdIssue.key);
    assert(qaEmail, "QA received Ready for QA handover email");
    assert(qaEmail.html.includes("QA VERIFICATION"), "Email template includes QA VERIFICATION badge");
  });

  await test("QA verifying issue as 'Done' notifies developer of Quality Gate clearance", async () => {
    store.setActiveUser(userQA.id);
    await store.updateIssueStatus(createdIssue.id, "Done");

    assert.strictEqual(createdIssue.status, "Done");
    assert.strictEqual(createdIssue.qaStatus, "Passed");

    const emailLogs = store.getEmailLogs();
    const clearedEmail = emailLogs.find(e => e.issueKey === createdIssue.key && e.subject.includes("Quality Gate Cleared"));
    assert(clearedEmail, "Quality Gate Cleared email was dispatched");
    assert(clearedEmail.html.includes("Quality Gate Cleared"), "Email template includes Quality Gate Cleared title");
  });

  await test("QA reopening failed defect notifies developer with Defect Reopened alert", async () => {
    store.setActiveUser(userQA.id);
    await store.updateIssueStatus(createdIssue.id, "Reopened");

    assert.strictEqual(createdIssue.status, "Reopened");
    assert.strictEqual(createdIssue.qaStatus, "Failed");
    assert(createdIssue.reopenCount >= 1, "Reopen count incremented");

    const emailLogs = store.getEmailLogs();
    const reopenEmail = emailLogs.find(e => e.issueKey === createdIssue.key && e.subject.includes("Defect Reopened"));
    assert(reopenEmail, "Defect Reopened email was dispatched to developer");
  });

  console.log("\n--- TEST GROUP 4: Critical Blocker Defect Escalations ---");

  await test("Logging a Critical Bug broadcasts emergency alert emails to project team", async () => {
    store.setActiveUser(userQA.id);
    const countBefore = store.getEmailLogs().length;

    const criticalBug = await store.createIssue({
      projectId: project.id,
      title: "Data corruption during concurrent checkout payment",
      type: "Bug",
      priority: "Critical",
      developerId: userDev.id
    });

    assert.strictEqual(criticalBug.priority, "Critical");
    const countAfter = store.getEmailLogs().length;
    assert(countAfter > countBefore, "Emergency emails dispatched for critical bug");

    const emailLogs = store.getEmailLogs();
    const blockerEmail = emailLogs.find(e => e.issueKey === criticalBug.key && e.type === 'critical_defect');
    assert(blockerEmail, "Blocker defect email log exists");
    assert(blockerEmail.html.includes("CRITICAL DEFECT"), "Email HTML has CRITICAL DEFECT badge");
    assert(blockerEmail.html.includes("Data corruption"), "Email HTML includes defect title");
  });

  console.log("\n--- TEST GROUP 5: Chat Mentions & Direct Message Notifications & Emails ---");

  await test("Sending chat message with @mention dispatches mention notification and email", async () => {
    store.setActiveUser(userLead.id);
    
    // Create a project chat conversation
    const conv = {
      id: 'conv-notif-1',
      name: 'general',
      projectId: project.id,
      type: 'PROJECT'
    };
    if (!store.data.chatConversations) store.data.chatConversations = [];
    store.data.chatConversations.push(conv);

    await store.sendMessage({
      conversationId: conv.id,
      message: `Hey @${userDev.name} please check the auth token bug.`,
      mentions: [userDev.id]
    });

    const notifs = store.getNotifications(userDev.id);
    const mentionNotif = notifs.find(n => n.type === 'chat' && n.title.includes("Mentioned"));
    assert(mentionNotif, "Mention in-app notification exists for developer");

    const emailLogs = store.getEmailLogs();
    const mentionEmail = emailLogs.find(e => e.recipient === userDev.email && e.type === 'chat_mention');
    assert(mentionEmail, "Chat mention email dispatched to developer");
    assert(mentionEmail.html.includes("CHAT MENTION"), "Email contains CHAT MENTION badge");
  });

  await test("Direct message dispatches direct message email to peer", async () => {
    store.setActiveUser(userDev.id);

    const dmConv = {
      id: 'conv-dm-1',
      type: 'DIRECT',
      projectId: project.id
    };
    store.data.chatConversations.push(dmConv);
    if (!store.data.chatConversationMembers) store.data.chatConversationMembers = [];
    store.data.chatConversationMembers.push(
      { conversationId: dmConv.id, userId: userDev.id },
      { conversationId: dmConv.id, userId: userQA.id }
    );

    await store.sendMessage({
      conversationId: dmConv.id,
      message: "Hey Elena, could you test the payment fix on Staging?"
    });

    const emailLogs = store.getEmailLogs();
    const dmEmail = emailLogs.find(e => e.recipient === userQA.email && e.type === 'direct_message');
    assert(dmEmail, "Direct message email dispatched to QA engineer");
    assert(dmEmail.html.includes("DIRECT MESSAGE"), "Email contains DIRECT MESSAGE badge");
  });

  console.log("\n--- TEST GROUP 6: Sprint Milestones Notifications & Emails ---");

  await test("startSprint and completeSprint notify project members with milestone emails", async () => {
    const sprint = {
      id: 'sp-notif-1',
      projectId: project.id,
      name: 'Sprint 25 - QA Notification System',
      status: 'Planned'
    };
    if (!store.data.sprints) store.data.sprints = [];
    store.data.sprints.push(sprint);

    store.setActiveUser(userLead.id);
    await store.startSprint(sprint.id);

    let emailLogs = store.getEmailLogs();
    const startEmail = emailLogs.find(e => e.type === 'sprint_milestone' && e.title.includes("Sprint Started"));
    assert(startEmail, "Sprint Started email dispatched to team members");

    await store.completeSprint(sprint.id);
    emailLogs = store.getEmailLogs();
    const completeEmail = emailLogs.find(e => e.type === 'sprint_milestone' && e.title.includes("Sprint Completed"));
    assert(completeEmail, "Sprint Completed email dispatched to team members");
  });

  console.log("\n--- TEST GROUP 7: User Notification Preferences ---");

  await test("Disabling specific email preferences stops email dispatch while keeping in-app alerts", async () => {
    store.setActiveUser(userDev.id);
    
    // Disable chat mention emails for userDev
    store.updateNotificationPreferences(userDev.id, {
      emailOnChatMention: false
    });

    const prefs = store.getNotificationPreferences(userDev.id);
    assert.strictEqual(prefs.emailOnChatMention, false, "Chat mention preference is disabled");
    assert.strictEqual(prefs.emailOnIssueAssignment, true, "Other preferences remain default true");

    // Count before
    const emailCountBefore = store.getEmailLogs().filter(e => e.recipient === userDev.email).length;

    // Trigger another mention from lead
    store.setActiveUser(userLead.id);
    await store.sendMessage({
      conversationId: 'conv-notif-1',
      message: `Testing muted email preference for @${userDev.name}`,
      mentions: [userDev.id]
    });

    const emailCountAfter = store.getEmailLogs().filter(e => e.recipient === userDev.email).length;
    assert.strictEqual(emailCountAfter, emailCountBefore, "Email was skipped because preference is disabled");

    // Verify in-app notification was still created!
    const notifs = store.getNotifications(userDev.id);
    assert(notifs.some(n => n.message.includes("Testing muted email")), "In-app notification still received");
  });

  console.log("\n--- TEST GROUP 8: Settings View & Notification Center Tester ---");

  await test("SettingsView renders notifications tab, triggers test email, and clears logs", async () => {
    SettingsView.activeTab = 'notifications';
    const mockContainer = { innerHTML: '' };
    SettingsView.render(mockContainer);

    assert(mockContainer.innerHTML.includes("Automated Email Notification Preferences"), "Rendered preferences card");
    assert(mockContainer.innerHTML.includes("Interactive Email Notification Tester"), "Rendered test email card");
    assert(mockContainer.innerHTML.includes("Outbound Email Audit Trail"), "Rendered outbound audit table");

    // Test sending test email
    const testRes = await store.dispatchEmailNotification({
      recipient: 'test-qa-recipient@pulsewave.io',
      recipientName: 'Test QA',
      subject: '[PulseWave] Test Verification Email',
      type: 'qa_handoff',
      title: 'Ready for QA: [TEST-01] Automated Check',
      message: 'This is a test notification email verification.'
    });

    assert(testRes.success, "Test email dispatched successfully");
    assert(store.getEmailLogs().some(e => e.recipient === 'test-qa-recipient@pulsewave.io'), "Logged test email in audit");

    // Test clearing logs
    store.clearEmailLogs();
    assert.strictEqual(store.getEmailLogs().length, 0, "Email logs cleared");
  });

  console.log(`\n🎉 ALL ${passedCount}/${passedCount} NOTIFICATION & EMAIL SYSTEM TESTS PASSED WITH 100% SUCCESS!`);
}

runTests();
