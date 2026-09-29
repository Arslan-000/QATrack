/**
 * DOM Simulation & View Integration Test for Releases UI
 * Verifies ReleasesView, ProjectWorkspaceView (Releases Tab & Overview card),
 * DashboardView (Executive Release Risk card), Modals & Filters.
 */

const fs = require('fs');
const path = require('path');

// Mock browser window, document, localStorage
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

// Minimal DOM Element Mock
class MockElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this._innerHTML = '';
    this.children = [];
    this.classList = {
      _classes: new Set(),
      add(...c) { c.forEach(x => this._classes.add(x)); },
      remove(...c) { c.forEach(x => this._classes.delete(x)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    };
    this.style = {};
    this.attributes = {};
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) { this._innerHTML = String(val); }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  querySelector(sel) { return new MockElement(); }
  querySelectorAll(sel) { return [new MockElement()]; }
  getContext() { return { clearRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {}, createLinearGradient() { return { addColorStop() {} }; } }; }
}

global.document = {
  getElementById(id) {
    if (!this._elements) this._elements = {};
    if (!this._elements[id]) {
      this._elements[id] = new MockElement(id);
    }
    return this._elements[id];
  },
  querySelector(sel) { return new MockElement(); },
  querySelectorAll(sel) { return [new MockElement()]; }
};

global.lucide = {
  createIcons() {}
};

global.app = {
  navigate(route) {},
  openProjectWorkspace(id) {},
  openIssueDetails(id) {},
  showToast(msg, type) {}
};

// Load Services, Data, Store, Views
const releaseServiceCode = fs.readFileSync(path.join(__dirname, '../js/services/releaseQualityService.js'), 'utf8');
eval(releaseServiceCode);

const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
eval(dataCode);

const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
eval(storeCode);

const releasesViewCode = fs.readFileSync(path.join(__dirname, '../js/views/releases.js'), 'utf8');
global.ReleasesView = eval(releasesViewCode + '; ReleasesView;');

const projectWorkspaceViewCode = fs.readFileSync(path.join(__dirname, '../js/views/projectWorkspace.js'), 'utf8');
global.ProjectWorkspaceView = eval(projectWorkspaceViewCode + '; ProjectWorkspaceView;');

const dashboardViewCode = fs.readFileSync(path.join(__dirname, '../js/views/dashboard.js'), 'utf8');
global.DashboardView = eval(dashboardViewCode + '; DashboardView;');

async function runDomTests() {
  console.log("===============================================================================");
  console.log("🖥️  STARTING RELEASES VIEW & DOM SIMULATION SUITE");
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

  // Setup sample workspace, project, user
  const activeUser = store.registerUser({
    id: 'u-pm-1',
    name: 'Sarah Lead PM',
    email: 'sarah@pulsewave.qa',
    role: 'PM'
  });
  store.data.activeUserId = activeUser.id;

  store.data.workspaces = [{
    id: 'ws-main',
    name: 'PulseWave Core Space',
    slug: 'pulsewave-core',
    members: [{ id: activeUser.id, name: activeUser.name, email: activeUser.email, role: 'OWNER' }]
  }];
  store.data.activeWorkspaceId = 'ws-main';

  store.data.projects = [{
    id: 'prj-pulse',
    workspace_id: 'ws-main',
    name: 'PulseWave SaaS v2',
    key: 'PW2',
    description: 'Enterprise Release Engine',
    status: 'Active',
    members: [activeUser.id]
  }];
  store.data.activeProjectId = 'prj-pulse';

  const container = document.getElementById('mainContent');

  // Test 1: Render ReleasesView in list mode
  console.log("📋 TEST 1: ReleasesView List Rendering");
  {
    ReleasesView.activeViewMode = 'list';
    ReleasesView.render(container, 'prj-pulse');

    assert(container.innerHTML.includes('Releases & Quality Gate'), "Renders Releases & Quality Gate header");
    assert(container.innerHTML.includes('New Release'), "Displays New Release button for authorized PM");
    assert(container.innerHTML.includes('Quality Policy'), "Displays Quality Policy button");
  }

  // Test 2: Create a release and re-render list with assessment gauge
  console.log("\n📋 TEST 2: Release Creation & Row Rendering");
  {
    const release = await store.createRelease({
      project_id: 'prj-pulse',
      name: 'Release 2.4.0 Production',
      version: 'v2.4.0',
      status: 'IN_PROGRESS',
      description: 'Major Release Candidate'
    });

    await store.runReleaseQualityAssessment(release.id);
    ReleasesView.render(container, 'prj-pulse');

    assert(container.innerHTML.includes('Release 2.4.0 Production'), "Renders created release in table");
    assert(container.innerHTML.includes('v2.4.0'), "Renders version pill");
    assert(container.innerHTML.includes('Readiness'), "Renders Readiness action button");
  }

  // Test 3: Render Release Readiness Detail View
  console.log("\n📋 TEST 3: Release Readiness Detail Dashboard");
  {
    const releases = store.getReleases('prj-pulse');
    ReleasesView.activeViewMode = 'detail';
    ReleasesView.activeReleaseId = releases[0].id;
    ReleasesView.render(container, 'prj-pulse');

    const detailHtml = container.innerHTML;
    assert(detailHtml.includes('QUALITY SCORE'), "Displays Quality Score Card");
    assert(detailHtml.includes('GATE STATUS:'), "Displays Formal Gate Status Pill");
    assert(detailHtml.includes('Formal Quality Gate'), "Displays 6-Rule Formal Quality Gate Table");
    assert(detailHtml.includes('How is this score calculated?'), "Displays Transparent Scoring Breakdown");
    assert(detailHtml.includes('Investigate Risks'), "Displays Investigate Risks action");
    assert(detailHtml.includes('Run Assessment'), "Displays Run Assessment action");
  }

  // Test 4: Project Workspace Tab Integration
  console.log("\n📋 TEST 4: Project Workspace Tab Integration");
  {
    ProjectWorkspaceView.activeTab = 'overview';
    ProjectWorkspaceView.render(container);

    const overviewHtml = container.innerHTML;
    assert(overviewHtml.includes('Releases &amp; Quality Gate') || overviewHtml.includes('Releases & Quality Gate'), "Project Tab Bar contains Releases & Quality Gate tab");
    assert(overviewHtml.includes('Project Quality &amp; Progress') || overviewHtml.includes('Project Quality & Progress'), "Displays Project Quality & Progress KPI on Project Workspace");
  }

  // Test 5: Executive Dashboard Integration
  console.log("\n📋 TEST 5: Executive Dashboard Release Risk Overview");
  {
    DashboardView.render(container);
    const dashHtml = container.innerHTML;
    assert(dashHtml.includes('Executive Release Risk Overview'), "Renders Executive Release Risk Overview on Main Dashboard");
    assert(dashHtml.includes('PulseWave SaaS v2'), "Displays project name in dashboard table");
  }

  // Test 6: Modals Generation
  console.log("\n📋 TEST 6: Modals Generation (Create Release, Settings, Override, Risk Investigation)");
  {
    const modalContainer = document.getElementById('globalModalContainer');
    const release = store.getReleases('prj-pulse')[0];

    // Create Release Modal
    ReleasesView.openCreateReleaseModal('prj-pulse');
    assert(modalContainer.innerHTML.includes('Create New Release'), "Opens Create Release modal with scope selection");

    // Quality Policy Modal
    ReleasesView.openQualitySettingsModal('prj-pulse');
    assert(modalContainer.innerHTML.includes('Configure Quality Gate Policy'), "Opens Quality Gate Policy configuration modal");

    // Override Modal
    ReleasesView.openOverrideModal(release.id, 'prj-pulse');
    assert(modalContainer.innerHTML.includes('Authorize Release Override'), "Opens Release Override modal with mandatory justification");

    // Risk Investigation Modal
    ReleasesView.openRiskInvestigationModal(release.id);
    assert(modalContainer.innerHTML.includes('Risk Investigation & Evidence Explorer'), "Opens Risk Investigation & Evidence Explorer modal");

    // Close modal
    ReleasesView.closeModal();
    assert(modalContainer.innerHTML === '', "Closes and clears modal container");
  }

  console.log("\n===============================================================================");
  console.log(`📊 DOM SIMULATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("===============================================================================\n");

  if (failed > 0) process.exit(1);
}

runDomTests().catch(err => {
  console.error("DOM test failed with error:", err);
  process.exit(1);
});
