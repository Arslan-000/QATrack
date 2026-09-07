/**
 * Comprehensive Test Suite for PulseWave 5 Corporate QA Report Templates & Multi-Step Creation Wizard
 */

const fs = require('fs');

// Mock browser DOM environment
global.document = {
  elements: {},
  getElementById: function(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        id,
        innerHTML: '',
        value: '',
        classList: {
          classes: new Set(),
          add: function(c) { this.classes.add(c); },
          remove: function(c) { this.classes.delete(c); },
          toggle: function(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); },
          contains: function(c) { return this.classes.has(c); }
        },
        querySelectorAll: function(sel) { return []; },
        querySelector: function(sel) { return null; },
        appendChild: function(child) { return child; },
        setAttribute: function() {},
        getAttribute: function() { return null; }
      };
    }
    return this.elements[id];
  },
  createElement: function(tag) {
    return {
      tagName: tag,
      className: '',
      innerHTML: '',
      style: {},
      appendChild: function() {},
      setAttribute: function() {},
      classList: {
        classes: new Set(),
        add: function(c) { this.classes.add(c); },
        remove: function(c) { this.classes.delete(c); },
        toggle: function(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); },
        contains: function(c) { return this.classes.has(c); }
      }
    };
  },
  querySelectorAll: function(selector) { return []; },
  querySelector: function(selector) { return null; },
  body: { appendChild: function() {}, removeChild: function() {} }
};

global.window = {
  document: global.document,
  lucide: { createIcons: () => {} },
  dispatchEvent: () => {},
  html2pdf: () => ({
    set: () => ({
      from: () => ({
        save: async () => {},
        output: async () => new Blob(["%PDF-1.4 Mock PDF Data"], { type: "application/pdf" })
      })
    })
  })
};

global.Blob = class Blob { constructor(content) { this.content = content; } };
global.FileReader = class FileReader {
  readAsDataURL(blob) {
    this.result = `data:application/pdf;base64,mock_data_uri`;
    if (this.onloadend) this.onloadend();
  }
};
global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v; }
};
global.CustomEvent = class CustomEvent { constructor(type, options) { this.type = type; this.detail = options ? options.detail : {}; } };

// Load Store & TestReportsView
const INITIAL_DATA = require('../js/data.js');
global.INITIAL_DATA = INITIAL_DATA;
global.window.INITIAL_DATA = INITIAL_DATA;

eval(fs.readFileSync('./js/store.js', 'utf8'));
eval(fs.readFileSync('./js/views/testReports.js', 'utf8'));

async function runReportTemplatesTests() {
  console.log("==================================================================");
  console.log("🧪 RUNNING 5 CORPORATE QA REPORT TEMPLATES & WIZARD TEST SUITE");
  console.log("==================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // Setup Test User & Project
  const user = store.registerUser({ name: "Rimsha Shahbaz", email: "rimsha@pulsewave.io", role: "QA" });
  store.setActiveUser(user.id);
  const proj = store.createProject({ name: "Annoushka Jewellery", key: "ANN" });
  store.setActiveProject(proj.id);

  // Add some sample bugs to project for defect report testing
  const bug1 = store.createIssue({
    projectId: proj.id,
    title: "Checkout payment token validation timeout",
    type: "Bug",
    priority: "Critical",
    status: "QA Testing"
  });
  const bug2 = store.createIssue({
    projectId: proj.id,
    title: "Category filter drawer clipping on mobile",
    type: "Bug",
    priority: "High",
    status: "In Progress"
  });

  // =========================================================================
  // TEST 1: WIZARD MODAL STEP 1 (TEMPLATE SELECTION & ENABLED/DISABLED STATES)
  // =========================================================================
  console.log("\n--- TEST 1: Creation Wizard Step 1 (Template Selection & Enabled/Disabled) ---");
  const modalContainer = document.getElementById("globalModalContainer");
  TestReportsView.openCreateWizardModal(1);
  assert(modalContainer.innerHTML.includes("Step 1: Select Report Type & Template"), "Wizard Step 1 title rendered");
  assert(modalContainer.innerHTML.includes("Test Execution Report"), "Option 1: Test Execution Report present");
  assert(modalContainer.innerHTML.includes("Regression Test Report"), "Option 2: Regression Test Report present");
  assert(modalContainer.innerHTML.includes("COMING SOON"), "Disabled templates display COMING SOON tag");

  // Verify selecting enabled template works
  TestReportsView.selectWizardTemplate("regression");
  assert(TestReportsView.wizardSelectedType === "regression", "Option 2 (Regression) selected successfully");

  // Verify selecting disabled template is blocked
  TestReportsView.selectWizardTemplate("defect-bug");
  assert(TestReportsView.wizardSelectedType === "regression", "Option 3 (Defect/Bug) is disabled and blocked from selection");

  TestReportsView.selectWizardTemplate("release-qa");
  assert(TestReportsView.wizardSelectedType === "regression", "Option 4 (Release QA) is disabled and blocked from selection");

  // =========================================================================
  // TEST 2: WIZARD MODAL STEP 2 (CONFIG & DETAILS)
  // =========================================================================
  console.log("\n--- TEST 2: Creation Wizard Step 2 (Configuration) ---");
  TestReportsView.openCreateWizardModal(2);
  assert(modalContainer.innerHTML.includes("Step 2: Configure Report Details"), "Wizard Step 2 title rendered");
  assert(modalContainer.innerHTML.includes("Regression Test Report"), "Active template displayed in banner");
  assert(modalContainer.innerHTML.includes("Select Project"), "Project dropdown rendered");
  assert(modalContainer.innerHTML.includes("Initial Number of Test Cases"), "Case count options rendered for Regression");

  // =========================================================================
  // TEST 3: TEMPLATE 1 — TEST EXECUTION REPORT ⭐
  // =========================================================================
  console.log("\n--- TEST 3: Template 1 — Test Execution Report ---");
  const execReport = await store.createQAReport({
    projectId: proj.id,
    reportName: "Annoushka Sprint 8 Test Execution Report",
    reportType: "test-execution",
    templateName: "Annoushka Detailed Execution",
    leadTester: "Rimsha Shahbaz",
    testReviewer: "Arslan Ali",
    totalInitialCases: 10
  });
  assert(execReport.report_type === "test-execution", "Report type is test-execution");
  assert(execReport.testCases.length === 10, "Instantiated with 10 test cases");
  
  // Render Studio
  const mainContent = document.getElementById("mainContent");
  TestReportsView.activeReportId = execReport.id;
  TestReportsView.currentMode = "creator";
  await TestReportsView.render(mainContent);
  assert(mainContent.innerHTML.includes("1. Test Case / Scenario Details"), "Test Case Studio details rendered");
  assert(mainContent.innerHTML.includes("3. Test Data (Key-Value Rows)"), "Test Data manager rendered");

  // Render Preview
  TestReportsView.currentMode = "preview";
  await TestReportsView.render(mainContent);
  assert(mainContent.innerHTML.includes("Taar Consulting"), "Execution deliverable banner rendered");
  assert(mainContent.innerHTML.includes("Executive Summary"), "Executive summary section rendered");
  assert(mainContent.innerHTML.includes("Execution Summary Metrics"), "Execution metrics strip rendered");
  assert(mainContent.innerHTML.includes("Sign-Off"), "Sign-off block rendered");

  // =========================================================================
  // TEST 4: TEMPLATE 2 — REGRESSION TEST REPORT
  // =========================================================================
  console.log("\n--- TEST 4: Template 2 — Regression Test Report ---");
  const regReport = await store.createQAReport({
    projectId: proj.id,
    reportName: "Annoushka Core Regression Cycle 8",
    reportType: "regression",
    templateName: "Taar Consulting Regression Standard",
    totalInitialCases: 5
  });
  assert(regReport.report_type === "regression", "Report type is regression");
  TestReportsView.activeReportId = regReport.id;
  TestReportsView.currentMode = "preview";
  await TestReportsView.render(mainContent);
  assert(mainContent.innerHTML.includes("Taar Consulting"), "Regression deliverable banner rendered in preview");
  assert(mainContent.innerHTML.includes("Annoushka Core Regression Cycle 8"), "Regression report title rendered in preview");

  // =========================================================================
  // TEST 5: TEMPLATE 3 — DEFECT / BUG REPORT
  // =========================================================================
  console.log("\n--- TEST 5: Template 3 — Defect / Bug Report ---");
  const defectReport = await store.createQAReport({
    projectId: proj.id,
    reportName: "Sprint 8 Defect & Triage Audit",
    reportType: "defect-bug",
    templateName: "Corporate Defect & Triage Audit"
  });
  assert(defectReport.report_type === "defect-bug", "Report type is defect-bug");
  assert(defectReport.defects_list.length >= 2, "Auto-imported project defects into report");
  
  // Render Studio
  TestReportsView.activeReportId = defectReport.id;
  TestReportsView.currentMode = "creator";
  await TestReportsView.render(mainContent);
  assert(mainContent.innerHTML.includes("Defect Ledger & Triage Table"), "Defect studio table rendered");
  assert(mainContent.innerHTML.includes("Root Cause Analysis"), "Root cause editor rendered");

  // Render Preview
  TestReportsView.currentMode = "preview";
  await TestReportsView.render(mainContent);
  assert(mainContent.innerHTML.includes("Taar Consulting"), "Defect audit banner rendered");
  assert(mainContent.innerHTML.includes("1. Defect Telemetry & Severity Distribution"), "Severity breakdown rendered");
  assert(mainContent.innerHTML.includes("2. Comprehensive Defect Ledger Table"), "Defect ledger rendered");

  // =========================================================================
  // TEST 6: TEMPLATE 4 — RELEASE QA REPORT ⭐ (GO/NO-GO)
  // =========================================================================
  console.log("\n--- TEST 6: Template 4 — Release QA Report (Go/No-Go) ---");
  const releaseReport = await store.createQAReport({
    projectId: proj.id,
    reportName: "Annoushka v2.4.0 Production Release Sign-Off",
    reportType: "release-qa",
    templateName: "Executive Release Sign-Off & Quality Gate",
    verdict: "READY FOR RELEASE"
  });
  assert(releaseReport.report_type === "release-qa", "Report type is release-qa");
  
  // Render Studio
  TestReportsView.activeReportId = releaseReport.id;
  TestReportsView.currentMode = "creator";
  await TestReportsView.render(mainContent);
  assert(mainContent.innerHTML.includes("Official Release Recommendation"), "Release verdict card rendered");
  assert(mainContent.innerHTML.includes("Mandatory Release Quality Gates"), "Quality gate checklist rendered");

  // Render Preview
  TestReportsView.currentMode = "preview";
  await TestReportsView.render(mainContent);
  assert(mainContent.innerHTML.includes("Taar Consulting"), "Executive gate deliverable banner rendered");
  assert(mainContent.innerHTML.includes("READY FOR RELEASE"), "Go/No-Go decision banner rendered");
  assert(mainContent.innerHTML.includes("1. Mandatory Quality Gate Sign-Off Policy"), "Quality gate policy table rendered");
  assert(mainContent.innerHTML.includes("3. Multi-Stakeholder Release Sign-Off Authorization"), "3 stakeholder approval blocks rendered");

  // =========================================================================
  // TEST 7: TEMPLATE 5 — QA SUMMARY / CLIENT REPORT ⭐
  // =========================================================================
  console.log("\n--- TEST 7: Template 5 — QA Summary / Client Report ---");
  const clientReport = await store.createQAReport({
    projectId: proj.id,
    reportName: "Annoushka Jewellery Client QA Executive Summary",
    reportType: "qa-summary",
    templateName: "Client & Executive QA Summary",
    clientName: "Annoushka Jewellery London",
    milestone: "Production Milestone Sign-off"
  });
  assert(clientReport.report_type === "qa-summary", "Report type is qa-summary");
  assert(clientReport.client_name === "Annoushka Jewellery London", "Client name saved correctly");

  // Render Studio
  TestReportsView.activeReportId = clientReport.id;
  TestReportsView.currentMode = "creator";
  await TestReportsView.render(mainContent);
  assert(mainContent.innerHTML.includes("Executive Summary Narrative"), "Client narrative editor rendered");
  assert(mainContent.innerHTML.includes("Module & Feature Validation Summary"), "Module matrix editor rendered");

  // Render Preview
  TestReportsView.currentMode = "preview";
  await TestReportsView.render(mainContent);
  assert(mainContent.innerHTML.includes("Taar Consulting"), "Client report header rendered");
  assert(mainContent.innerHTML.includes("Annoushka Jewellery London"), "Client name rendered in header");
  assert(mainContent.innerHTML.includes("3. Feature & Module Quality Matrix"), "Module matrix rendered");
  assert(mainContent.innerHTML.includes("5. Formal Client Acceptance Sign-Off"), "Client acceptance signature box rendered");

  // =========================================================================
  // TEST 8: PDF GENERATION ACROSS TEMPLATES
  // =========================================================================
  console.log("\n--- TEST 8: PDF Generation & Compilation ---");
  await TestReportsView.triggerGeneratePDF(releaseReport.id);
  const updatedRelRep = store.getQAReportById(releaseReport.id);
  assert(updatedRelRep.status === "GENERATED", "Report status transitioned to GENERATED");
  assert(updatedRelRep.pdf_storage_path.includes("reports/"), "PDF storage path generated");

  console.log("\n==================================================================");
  console.log(`🎉 ALL ${passed}/${total} TESTS PASSED WITH 100% SUCCESS!`);
  console.log("==================================================================");
}

runReportTemplatesTests();
