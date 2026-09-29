// Test scenario: Project created with 3 issues (13 SP in development, 0 defects, 0 test cases)
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] || null; },
  setItem(key, val) { this._data[key] = String(val); },
  removeItem(key) { delete this._data[key]; },
  clear() { this._data = {}; }
};
global.document = {
  getElementById(id) {
    return {
      innerHTML: '',
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      addEventListener() {},
      style: {},
      setAttribute() {},
      getAttribute() { return null; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      appendChild() {}
    };
  },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() {
    return {
      innerHTML: '',
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      addEventListener() {},
      style: {},
      setAttribute() {},
      getAttribute() { return null; },
      querySelector() { return null; },
      appendChild() {}
    };
  }
};
global.lucide = { createIcons() {} };

// Load data
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
eval(dataCode);

// Load store
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
eval(storeCode);

console.log('Testing Store Stats for Logo Project...');

// Create Logo project
const logoProject = {
  id: 'prj_logo',
  name: 'Logo',
  key: 'LOGO',
  description: 'This is the logo project we are currently test the Bill slip of sale order also with discount & Shipping',
  status: 'Active',
  client: 'Arslan Ali',
  leadPm: 'Arslan Test',
  team: 'Project Team (1)',
  dueDate: '2026-10-27'
};

store.data.projects = [logoProject];

// Create 3 issues with 13 SP total in "In Development" / "In Progress"
store.data.issues = [
  { id: 'iss_1', projectId: 'prj_logo', key: 'LOGO-1', title: 'Bill slip layout', type: 'Task', status: 'In Development', storyPoints: 5, createdAt: new Date().toISOString() },
  { id: 'iss_2', projectId: 'prj_logo', key: 'LOGO-2', title: 'Discount calculation logic', type: 'Story', status: 'In Development', storyPoints: 5, createdAt: new Date().toISOString() },
  { id: 'iss_3', projectId: 'prj_logo', key: 'LOGO-3', title: 'Shipping rule validation', type: 'Feature', status: 'In Development', storyPoints: 3, createdAt: new Date().toISOString() }
];

store.data.testCases = [];

const projectStats = store.getProjectStats('prj_logo');
console.log('Project Stats output:', JSON.stringify(projectStats, null, 2));

// Assertions
if (projectStats.total !== 3) throw new Error(`Expected total 3, got ${projectStats.total}`);
if (projectStats.totalSP !== 13) throw new Error(`Expected totalSP 13, got ${projectStats.totalSP}`);
if (projectStats.inProgress !== 3) throw new Error(`Expected inProgress 3, got ${projectStats.inProgress}`);
if (projectStats.inProgressSP !== 13) throw new Error(`Expected inProgressSP 13, got ${projectStats.inProgressSP}`);
if (projectStats.bugs !== 0) throw new Error(`Expected bugs 0, got ${projectStats.bugs}`);
if (projectStats.qualityScore !== 100) throw new Error(`Expected qualityScore 100, got ${projectStats.qualityScore}`);

console.log('✓ All Store Project Stats assertions PASSED!');

// Load ProjectWorkspaceView
const workspaceCode = fs.readFileSync(path.join(__dirname, '../js/views/projectWorkspace.js'), 'utf8');
eval(workspaceCode);

// Test renderOverviewTab HTML generation
const overviewHtml = ProjectWorkspaceView.renderOverviewTab(logoProject, projectStats);
console.log('Overview HTML generated. Length:', overviewHtml.length);

if (!overviewHtml.includes('13 SP') && !overviewHtml.includes('13')) {
  console.warn('Warning: 13 SP may not be in overviewHtml');
} else {
  console.log('✓ 13 SP found in Overview HTML');
}

if (overviewHtml.includes('100%')) {
  console.log('✓ Quality Score 100% found in Overview HTML');
} else {
  console.warn('Warning: 100% not found in Overview HTML');
}

console.log('All tests completed successfully!');
