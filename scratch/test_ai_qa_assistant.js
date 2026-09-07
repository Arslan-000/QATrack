/**
 * Automated Verification Suite for ✨ AI QA Assistant
 */

const assert = require('assert');

// Mock localStorage and window
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { hash: "" },
  lucide: { createIcons: () => {} }
};
global.document = {
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }),
  body: { appendChild: () => {} }
};

// Mock INITIAL_DATA
global.INITIAL_DATA = {
  workspaces: [{ id: "ws_1", name: "Alpha Space", slug: "alpha-space" }],
  projects: [{ id: "prj_pos", workspace_id: "ws_1", key: "POS", name: "Retail POS Integration" }],
  users: [{ id: "usr_qa", name: "QA Lead", email: "qa@pulsewave.io", role: "QA Engineer" }],
  issues: []
};

// Load Services & Store
const AIQAService = require('../js/services/aiQAService.js');
const store = require('../js/store.js');

async function runTestSuite() {
  console.log("=================================================");
  console.log("🚀 STARTING AI QA ASSISTANT COMPREHENSIVE TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // Setup test environment
  const testProjectId = "prj_pos";
  const testWorkspaceId = "ws_1";

  store.data.projects = [{
    id: testProjectId,
    workspace_id: testWorkspaceId,
    name: "Retail POS Integration",
    key: "POS"
  }];
  store.data.activeProjectId = testProjectId;
  store.data.activeWorkspaceId = testWorkspaceId;
  store.data.activeUserId = "usr_qa";

  // Create real test issues with specific timestamps
  const dateStr = "2026-09-07";
  const otherDateStr = "2026-09-01";

  const issue1 = {
    id: "iss_101",
    key: "POS-101",
    projectId: testProjectId,
    title: "Checkout payment failure on card terminal",
    description: "Card terminal times out during NFC tap processing in register flow.",
    type: "Bug",
    priority: "Critical",
    status: "Open",
    qaStatus: "Failed",
    createdAt: `${dateStr}T09:30:00.000Z`
  };

  const issue2 = {
    id: "iss_102",
    key: "POS-102",
    projectId: testProjectId,
    title: "Shipping tax miscalculation for Canadian provinces",
    description: "GST/HST tax rates not applied to order totals in shipping preview.",
    type: "Bug",
    priority: "High",
    status: "Open",
    qaStatus: "Testing",
    createdAt: `${dateStr}T11:15:00.000Z`
  };

  const issue3 = {
    id: "iss_103",
    key: "POS-103",
    projectId: testProjectId,
    title: "Receipt logo image not rendering on thermal printer",
    description: "Image buffer truncated on 80mm ESC/POS printer hardware.",
    type: "Bug",
    priority: "Medium",
    status: "Done",
    qaStatus: "Passed",
    createdAt: `${dateStr}T14:45:00.000Z`
  };

  const issue4 = {
    id: "iss_104",
    key: "POS-104",
    projectId: testProjectId,
    title: "Barcode scanner beep sound feedback muted",
    description: "Audio element fails to play sound when barcode scanned rapidly.",
    type: "Task",
    priority: "Low",
    status: "Done",
    qaStatus: "Passed",
    createdAt: `${dateStr}T16:00:00.000Z`
  };

  const oldIssue = {
    id: "iss_099",
    key: "POS-099",
    projectId: testProjectId,
    title: "Old legacy bug from last week",
    description: "Should not appear in today's date range query.",
    type: "Bug",
    priority: "High",
    status: "Closed",
    qaStatus: "Passed",
    createdAt: `${otherDateStr}T10:00:00.000Z`
  };

  store.data.issues = [issue1, issue2, issue3, issue4, oldIssue];

  // 1. Test Date Query Filtering
  test("1. Store getIssuesByDateRange filters accurately by date", () => {
    const issuesToday = store.getIssuesByDateRange(testProjectId, dateStr, dateStr);
    assert.strictEqual(issuesToday.length, 4, "Must retrieve exactly 4 issues from 2026-09-07");
    assert.ok(issuesToday.some(i => i.key === "POS-101"), "Must include POS-101");
    assert.ok(issuesToday.some(i => i.key === "POS-102"), "Must include POS-102");
    assert.ok(issuesToday.some(i => i.key === "POS-103"), "Must include POS-103");
    assert.ok(issuesToday.some(i => i.key === "POS-104"), "Must include POS-104");
    assert.ok(!issuesToday.some(i => i.key === "POS-099"), "Must exclude old issue from 2026-09-01");
  });

  test("2. Store getIssuesByDateRange supports multi-day range", () => {
    const issuesRange = store.getIssuesByDateRange(testProjectId, "2026-09-01", "2026-09-07");
    assert.strictEqual(issuesRange.length, 5, "Must retrieve all 5 issues across the range");
  });

  // 2. Test Metrics Calculation
  test("3. AIQAService calculates accurate severity and status metrics", () => {
    const issuesToday = store.getIssuesByDateRange(testProjectId, dateStr, dateStr);
    const metrics = AIQAService.calculateMetrics(issuesToday);

    assert.strictEqual(metrics.total, 4);
    assert.strictEqual(metrics.severityCounts.Critical, 1);
    assert.strictEqual(metrics.severityCounts.High, 1);
    assert.strictEqual(metrics.severityCounts.Medium, 1);
    assert.strictEqual(metrics.severityCounts.Low, 1);
    assert.strictEqual(metrics.statusCounts.Open, 2);
    assert.strictEqual(metrics.statusCounts.Done, 2);
    assert.strictEqual(metrics.criticalHighList.length, 2);
    assert.strictEqual(metrics.criticalHighList[0].key, "POS-101");
  });

  // 3. Test QA Summary Generation
  await asyncTest("4. AI QA Summary generation produces structured data from real issues", async () => {
    const issuesToday = store.getIssuesByDateRange(testProjectId, dateStr, dateStr);
    const result = await AIQAService.generate({
      projectId: testProjectId,
      workspaceId: testWorkspaceId,
      generationType: "qa_summary",
      startDate: dateStr,
      endDate: dateStr,
      selectedIssues: issuesToday,
      project: store.getProjectById(testProjectId)
    });

    assert.ok(result.content, "Result must contain structured content");
    assert.ok(result.content.title.includes("QA Testing Summary"));
    assert.ok(result.content.summary.includes("4 issues were evaluated") || result.content.summary.includes("4 issues were identified"));
    assert.strictEqual(result.content.severity_breakdown.Critical, 1);
    assert.strictEqual(result.content.severity_breakdown.High, 1);
    assert.ok(result.content.major_findings.some(f => f.key === "POS-101"));
    assert.ok(result.content.qa_observation.length > 0);
  });

  // 4. Test Developer Email Generation
  await asyncTest("5. Developer Email generation produces technical email structure", async () => {
    const issuesToday = store.getIssuesByDateRange(testProjectId, dateStr, dateStr);
    const result = await AIQAService.generate({
      projectId: testProjectId,
      workspaceId: testWorkspaceId,
      generationType: "developer_email",
      startDate: dateStr,
      endDate: dateStr,
      selectedIssues: issuesToday,
      project: store.getProjectById(testProjectId)
    });

    assert.ok(result.content.subject.includes("QA Testing Summary – Retail POS Integration"));
    assert.ok(result.content.body.includes("Hi Team,"));
    assert.ok(result.content.body.includes("Checkout payment failure on card terminal"));
    assert.ok(result.content.body.includes("Critical: 1"));
    assert.ok(result.content.body.includes("Open: 2"));
    assert.ok(result.content.body.includes("Regards,"));
  });

  // 5. Test Client Email Generation
  await asyncTest("6. Client Email generation produces executive business-focused content", async () => {
    const issuesToday = store.getIssuesByDateRange(testProjectId, dateStr, dateStr);
    const result = await AIQAService.generate({
      projectId: testProjectId,
      workspaceId: testWorkspaceId,
      generationType: "client_email",
      startDate: dateStr,
      endDate: dateStr,
      selectedIssues: issuesToday,
      project: store.getProjectById(testProjectId)
    });

    assert.ok(result.content.subject.includes("QA Milestone Quality Update"));
    assert.ok(result.content.body.includes("4 issues were identified"));
    assert.ok(result.content.body.includes("Business-impacting items under review"));
    assert.ok(result.content.body.includes("Zero-defect staging"));
  });

  // 6. Test QA Document Generation
  await asyncTest("7. QA Document generation produces structured executive document format", async () => {
    const issuesToday = store.getIssuesByDateRange(testProjectId, dateStr, dateStr);
    const result = await AIQAService.generate({
      projectId: testProjectId,
      workspaceId: testWorkspaceId,
      generationType: "qa_document",
      startDate: dateStr,
      endDate: dateStr,
      selectedIssues: issuesToday,
      project: store.getProjectById(testProjectId)
    });

    assert.ok(result.content.title.includes("QA Testing Summary"));
    assert.strictEqual(result.content.total_issues, 4);
    assert.strictEqual(result.content.severity.Critical, 1);
    assert.ok(result.content.major_issues.length > 0);
    assert.ok(result.content.qa_observation.length > 0);
  });

  // 7. Test Refinement & Instructions
  await asyncTest("8. Regeneration with 'Focus only on critical and high issues' refines content", async () => {
    const issuesToday = store.getIssuesByDateRange(testProjectId, dateStr, dateStr);
    const result = await AIQAService.generate({
      projectId: testProjectId,
      workspaceId: testWorkspaceId,
      generationType: "qa_summary",
      startDate: dateStr,
      endDate: dateStr,
      selectedIssues: issuesToday,
      project: store.getProjectById(testProjectId),
      instruction: "Focus only on critical and high issues"
    });

    assert.ok(result.content.qa_observation.includes("Focus Note: Concentrating strictly on Critical and High priority blockers."));
  });

  // 8. Test State Persistence
  await asyncTest("9. Store saveAIGeneration and getAIGenerations persist correctly", async () => {
    const issuesToday = store.getIssuesByDateRange(testProjectId, dateStr, dateStr);
    const saved = await store.saveAIGeneration({
      projectId: testProjectId,
      workspaceId: testWorkspaceId,
      startDate: dateStr,
      endDate: dateStr,
      generationType: "qa_summary",
      selectedIssueIds: issuesToday.map(i => i.id),
      generatedContent: { title: "Test Persistence Summary", summary: "Saved successfully" }
    });

    assert.ok(saved.id, "Saved generation must have an ID");
    const history = store.getAIGenerations(testProjectId);
    assert.ok(history.length >= 1, "Must find saved generation in history");
    assert.strictEqual(history[0].id, saved.id);
  });

  // 9. Test Email Logging & Sending
  await asyncTest("10. Store sendAIEmail dispatches securely and records audit log", async () => {
    const sendResult = await store.sendAIEmail({
      projectId: testProjectId,
      workspaceId: testWorkspaceId,
      recipient: "lead-dev@company.com",
      subject: "QA Testing Summary – Retail POS Integration",
      body: "Hi Team, 4 issues found today.",
      attachmentPath: `${testWorkspaceId}/${testProjectId}/ai-qa-reports/QA_Summary_2026-09-07.pdf`
    });

    assert.ok(sendResult.success, "Send email must return success");
    assert.ok(sendResult.log, "Send email must return audit log record");
    assert.strictEqual(sendResult.log.recipient, "lead-dev@company.com");
    assert.strictEqual(sendResult.log.status, "sent");

    const emailLogs = store.getAIEmailLogs(testProjectId);
    assert.ok(emailLogs.length >= 1, "Email log must be present in project audit history");
    assert.strictEqual(emailLogs[0].recipient, "lead-dev@company.com");
  });

  console.log("\n=================================================");
  console.log(`🎉 TEST EXECUTION COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(e => {
  console.error(e);
  process.exit(1);
});
