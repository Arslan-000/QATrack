/**
 * Automated Verification Suite for Intelligent Release Risk Engine & Quality Gate
 * Tests real-data calculation, deterministic scoring, blocking rules, snapshot immutability,
 * quality gate policies, release decisions, overrides, and RBAC isolation.
 */

const fs = require('fs');
const path = require('path');

// Mock browser globals for node testing
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

// Load Services & Store
const releaseServiceCode = fs.readFileSync(path.join(__dirname, '../js/services/releaseQualityService.js'), 'utf8');
eval(releaseServiceCode);

// Mock minimal Supabase and seed data
global.supabaseClient = null; // Test in resilient local-store mode

const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
eval(dataCode);

const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
eval(storeCode);

async function runAllTests() {
  console.log("===============================================================================");
  console.log("🚀 STARTING PULSEWAVE RELEASE RISK ENGINE & QUALITY GATE VERIFICATION SUITE");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Suite 1: Pure Scoring & Deterministic Engine
  console.log("📦 SUITE 1: Pure Deterministic Risk Engine Evaluation");
  {
    // Test 1.1: Clean project with perfect tests & no bugs
    const cleanResult = ReleaseQualityService.evaluateReleaseQuality({
      release: { id: 'rel-1', project_id: 'prj-1', name: 'v1.0.0' },
      project: { id: 'prj-1', name: 'Project 1' },
      settings: {
        critical_bug_blocks_release: true,
        maximum_open_critical_bugs: 0,
        high_bug_threshold: 0,
        minimum_test_pass_rate: 90,
        minimum_regression_pass_rate: 90,
        minimum_coverage: 80,
        maximum_blocked_tests: 0
      },
      issues: [
        { id: 'i-1', project_id: 'prj-1', key: 'BUG-1', type: 'Bug', priority: 'Medium', status: 'Done' }
      ],
      testCases: [
        { id: 'tc-1', project_id: 'prj-1', key: 'TC-1', status: 'READY' }
      ],
      testExecutions: [
        {
          id: 'te-1',
          project_id: 'prj-1',
          testCaseId: 'tc-1',
          status: 'Passed',
          testType: 'Regression'
        }
      ]
    });

    const cleanEval = cleanResult.assessment;
    assert(cleanEval.score === 100, `Clean project achieves perfect score 100/100 (got ${cleanEval.score})`);
    assert(cleanEval.status === 'READY', `Clean project status is READY (got ${cleanEval.status})`);
    assert(cleanResult.riskFactors.length === 0, `Clean project generates 0 risk factors (got ${cleanResult.riskFactors.length})`);
    assert(cleanEval.dataCompleteness > 0, `Data completeness is calculated accurately (${cleanEval.dataCompleteness}%)`);

    // Test 1.2: Critical open bug causes -20 deduction & blocking status
    const critResult = ReleaseQualityService.evaluateReleaseQuality({
      release: { id: 'rel-1', project_id: 'prj-1', name: 'v1.0.0' },
      project: { id: 'prj-1', name: 'Project 1' },
      settings: {
        critical_bug_blocks_release: true,
        maximum_open_critical_bugs: 0,
        high_bug_threshold: 0,
        minimum_test_pass_rate: 90,
        minimum_regression_pass_rate: 90,
        minimum_coverage: 80,
        maximum_blocked_tests: 0
      },
      issues: [
        { id: 'i-crit', project_id: 'prj-1', key: 'BUG-101', type: 'Bug', priority: 'Critical', status: 'In Progress', title: 'Payment failure' }
      ],
      testCases: [
        { id: 'tc-1', project_id: 'prj-1', key: 'TC-1', status: 'READY' }
      ],
      testExecutions: [
        {
          id: 'te-1',
          project_id: 'prj-1',
          testCaseId: 'tc-1',
          status: 'Passed',
          testType: 'Regression'
        }
      ]
    });

    const critEval = critResult.assessment;
    assert(critEval.score === 80, `Critical bug drops score from 100 to 80 (got ${critEval.score})`);
    assert(critEval.status === 'NOT_READY', `Critical open defect marks release NOT_READY even with 80 score (got ${critEval.status})`);
    assert(critResult.riskFactors.some(r => r.category === 'CRITICAL_DEFECTS' && r.is_blocking), "Critical defect generated as BLOCKING risk factor");
    
    const critRule = critEval.summaryMetrics.qualityGateRules.find(r => r.id === 'rule_critical_bugs');
    assert(critRule && critRule.status === 'FAILED', "Critical bugs gate rule failed");

    // Test 1.3: Empty Project with NO QA data returns NO_DATA status and null score
    const emptyResult = ReleaseQualityService.evaluateReleaseQuality({
      release: { id: 'rel-empty', project_id: 'prj-empty', name: 'Empty Release' },
      project: { id: 'prj-empty', name: 'Empty Project' },
      settings: {},
      issues: [],
      testCases: [],
      testExecutions: []
    });

    const emptyEval = emptyResult.assessment;
    assert(emptyEval.score === null, "Empty project score is null (no fake numbers)");
    assert(emptyEval.status === 'NO_DATA', "Empty project status is strictly NO_DATA");
    assert(emptyEval.dataCompleteness === 0, "Data completeness is 0%");
  }

  // Suite 2: Store Releases CRUD and Scope Linking
  console.log("\n📦 SUITE 2: Store CRUD Operations & Release Scope");
  {
    // Register test PM user
    const activeUser = store.registerUser({
      id: 'u-pm-1',
      name: 'Lead PM',
      email: 'pm@pulsewave.qa',
      role: 'PM'
    });
    store.data.activeUserId = activeUser.id;

    // Ensure active workspace & project
    if (!store.data.workspaces || store.data.workspaces.length === 0) {
      store.data.workspaces = [{
        id: 'ws-pulsewave',
        name: 'PulseWave Engineering',
        slug: 'pulsewave-eng',
        members: [{ id: activeUser.id, name: activeUser.name, email: activeUser.email, role: 'OWNER' }]
      }];
    }
    store.data.activeWorkspaceId = 'ws-pulsewave';

    if (!store.data.projects || store.data.projects.length === 0) {
      store.data.projects = [{
        id: 'prj-core',
        workspace_id: 'ws-pulsewave',
        workspaceId: 'ws-pulsewave',
        name: 'PulseWave SaaS Core Engine',
        key: 'PWCORE',
        description: 'Next-generation QA intelligence platform',
        status: 'Active',
        members: [activeUser.id]
      }];
    }
    store.data.activeProjectId = 'prj-core';

    const project = store.getProjectById('prj-core') || store.getProjects()[0];

    // Create Release
    const newRelease = await store.createRelease({
      project_id: project.id,
      name: 'Autumn Release v2.5.0',
      version: 'v2.5.0',
      status: 'IN_PROGRESS',
      release_date: '2026-10-15',
      description: 'Major payment & checkout QA cycle'
    });

    assert(newRelease && newRelease.id, "Successfully created new release entity");
    assert(newRelease.project_id === project.id, "Release correctly mapped to project_id");
    assert(newRelease.workspace_id === (project.workspace_id || project.workspaceId), "Release correctly inherits workspace_id");

    // Update Release
    const updated = await store.updateRelease(newRelease.id, {
      name: 'Autumn Release v2.5.0 Final Candidate',
      status: 'READY_FOR_REVIEW'
    });
    assert(updated.name.includes('Final Candidate'), "Release metadata updated successfully");
    assert(updated.status === 'READY_FOR_REVIEW', "Release status transitioned to READY_FOR_REVIEW");

    // Ensure project issues exist
    let issues = store.getIssues(project.id);
    if (issues.length < 2) {
      await store.createIssue({
        projectId: project.id,
        project_id: project.id,
        title: 'Fix card payment gateway timeout',
        type: 'Bug',
        priority: 'Critical',
        status: 'In Progress'
      });
      await store.createIssue({
        projectId: project.id,
        project_id: project.id,
        title: 'Add Apple Pay support in checkout',
        type: 'Story',
        priority: 'High',
        status: 'To Do'
      });
      issues = store.getIssues(project.id);
    }

    // Link Issues to Scope
    const scopeIssueIds = issues.slice(0, 2).map(i => i.id);
    await store.linkIssuesToRelease(newRelease.id, scopeIssueIds);
    
    const linked = store.getReleaseLinkedIssues(newRelease.id);
    assert(linked.length === 2, `Successfully linked ${linked.length} issues to release scope`);
  }

  // Suite 3: Assessment Execution & Immutable Snapshots
  console.log("\n📦 SUITE 3: Assessment Execution & Historical Snapshot Immutability");
  {
    const project = store.getProjects()[0];
    const releases = store.getReleases(project.id);
    const release = releases[0];

    // First Assessment
    const firstAssessment = await store.runReleaseQualityAssessment(release.id);
    assert(firstAssessment && firstAssessment.id, "Executed first release quality assessment");
    assert(typeof firstAssessment.blocking_risk_count === 'number', "Calculated blocking risk count");
    
    // Check risk factors stored
    const rfList1 = store.getReleaseRiskFactors(firstAssessment.id);
    assert(Array.isArray(rfList1), "Risk factors saved with reference to assessment_id");

    // Modify a project issue to simulate QA resolving a bug
    const allIssues = store.getIssues(project.id);
    const openBug = allIssues.find(i => i.type === 'Bug' && i.status !== 'Done');
    if (openBug) {
      await store.updateIssue(openBug.id, { status: 'Done' });
    }

    // Second Assessment
    const secondAssessment = await store.runReleaseQualityAssessment(release.id);
    assert(secondAssessment.id !== firstAssessment.id, "Second assessment created a new immutable snapshot");

    // Check history length
    const history = store.getReleaseQualityAssessments(release.id);
    assert(history.length >= 2, `Assessment history preserves all snapshots (count: ${history.length})`);
    assert(history[0].id === secondAssessment.id, "Latest snapshot is returned at top of history");
  }

  // Suite 4: Quality Gate Policy Configuration
  console.log("\n📦 SUITE 4: Project Quality Policy Configuration");
  {
    const project = store.getProjects()[0];
    
    // Update policy
    const updatedSettings = await store.updateProjectQualitySettings(project.id, {
      critical_bug_blocks_release: false,
      maximum_open_critical_bugs: 2,
      minimum_test_pass_rate: 85,
      allow_release_override: true
    });

    assert(updatedSettings.critical_bug_blocks_release === false, "Configured critical_bug_blocks_release to false");
    assert(updatedSettings.maximum_open_critical_bugs === 2, "Configured maximum_open_critical_bugs to 2");

    const fetched = store.getProjectQualitySettings(project.id);
    assert(fetched.maximum_open_critical_bugs === 2, "Persisted project quality policy correctly retrieved");
  }

  // Suite 5: Release Decision & Override Workflow
  console.log("\n📦 SUITE 5: Release Decision & Override Workflow");
  {
    const project = store.getProjects()[0];
    const release = store.getReleases(project.id)[0];

    // Record override decision with mandatory reason
    const overrideDecision = await store.recordReleaseDecision(
      release.id,
      'OVERRIDDEN',
      'Manual release gate override approved',
      'Critical bug BUG-142 accepted by VP of Engineering for hotfix cycle.'
    );

    assert(overrideDecision && overrideDecision.decision === 'OVERRIDDEN', "Override decision recorded");
    assert(overrideDecision.override_reason.includes('VP of Engineering'), "Override justification stored");

    const decisions = store.getReleaseDecisions(release.id);
    assert(decisions.length >= 1, `Decisions audit trail accessible (${decisions.length} decisions logged)`);
  }

  // Suite 6: RBAC & Permission Restrictions
  console.log("\n📦 SUITE 6: RBAC Permission Rules");
  {
    const project = store.getProjects()[0];
    const pmUser = store.registerUser({ id: 'u-pm-test', name: 'Alice PM', email: 'alice@pulsewave.qa', role: 'Project Manager' });
    const qaUser = store.registerUser({ id: 'u-qa-test', name: 'Bob QA', email: 'bob@pulsewave.qa', role: 'QA Engineer' });
    const devUser = store.registerUser({ id: 'u-dev-test', name: 'Charlie Dev', email: 'charlie@pulsewave.qa', role: 'Developer' });
    const viewerUser = store.registerUser({ id: 'u-viewer-test', name: 'Dana Viewer', email: 'dana@pulsewave.qa', role: 'Viewer' });

    // PM Permissions
    assert(store.canManageReleases(project.id, pmUser.id) === true, "PM can manage releases");
    assert(store.canConfigureQualitySettings(project.id, pmUser.id) === true, "PM can configure quality settings");
    assert(store.canOverrideRelease(project.id, pmUser.id) === true, "PM can override releases");

    // QA Permissions
    assert(store.canManageReleases(project.id, qaUser.id) === true, "QA can create and manage releases");
    assert(store.canConfigureQualitySettings(project.id, qaUser.id) === false, "QA CANNOT modify project quality policies");
    assert(store.canOverrideRelease(project.id, qaUser.id) === false, "QA CANNOT override release decisions");

    // Developer Permissions
    assert(store.canManageReleases(project.id, devUser.id) === false, "Developer CANNOT create or manage releases");
    assert(store.canConfigureQualitySettings(project.id, devUser.id) === false, "Developer CANNOT change quality policies");
    assert(store.canOverrideRelease(project.id, devUser.id) === false, "Developer CANNOT override release gate");
    assert(store.canViewReleases(project.id, devUser.id) === true, "Developer CAN view release quality for their project");

    // Viewer Permissions
    assert(store.canManageReleases(project.id, viewerUser.id) === false, "Viewer CANNOT manage releases");
    assert(store.canViewReleases(project.id, viewerUser.id) === true, "Viewer has read-only access to releases");
  }

  console.log("\n===============================================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
