const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("🧪 VERIFYING TAAR CONSULTING REPORT TEMPLATE DESIGN");
console.log("==================================================================");

// Mock DOM and Store
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
        output: async () => ({})
      })
    })
  })
};

global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v; }
};

const INITIAL_DATA = require('../js/data.js');
global.INITIAL_DATA = INITIAL_DATA;
global.window.INITIAL_DATA = INITIAL_DATA;

eval(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/testReports.js'), 'utf8'));

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    totalFailed++;
  }
}

// Create sample test execution report
const sampleExecutionReport = {
  id: 'rep-test-001',
  type: 'test-execution',
  title: 'Quarterly Core Regression & Smoke Report',
  projectName: 'Annoushka Retail POS',
  lead_tester: 'Rimsha Shahbaz',
  test_reviewer: 'Arslan Ali',
  templateName: 'Taar Consulting Execution Standard',
  createdAt: '2026-08-12',
  testCases: [
    {
      id: 'tc-1',
      title: 'Verify User Login with Valid Credentials',
      software_application: 'Annoushka',
      tester_name: 'Rimsha Shahbaz',
      test_reviewer: 'Arslan Ali',
      test_date: 'Aug 12, 2026',
      description: 'Validate seamless authentication flow for active store associates.',
      pre_requisites: 'User account exists\nActive session state cleared',
      location_area: 'Authentication Module',
      dependencies: 'Auth API Gateway v2.4\nIdentity Directory',
      required_configuration: 'Standard Chrome browser 124+\nStore terminal IP whitelist',
      testData: [
        { data_key: 'username', data_value: 'associate_01@annoushka.com' },
        { data_key: 'role', data_value: 'Store Manager' }
      ],
      results_summary: 'All login checkpoints passed without latency or token expiration issues.',
      executions: [
        {
          user_input: 'Enter valid credentials\nClick Sign In',
          expected_result: 'Redirect to POS Dashboard\nShow active session token',
          actual_result: 'Redirected to Dashboard in 120ms\nValid JWT received',
          status: 'PASS'
        }
      ]
    }
  ]
};

console.log("\n--- TEST 1: Execution & Regression Template Generator ---");
const html = TestReportsView.renderExecutionRegressionTemplateHtml(sampleExecutionReport, false);

// 1. Top Left and Bottom Right Taar Consulting Check
assert(html.includes('Taar Consulting'), 'Contains "Taar Consulting" branding');
assert(html.includes('Quality Assurance & Testing Services'), 'Contains QA subtitle for Taar Consulting header');

// 2. Top Metadata Grid
assert(html.includes('Software Application') && html.includes('Tester Name') && html.includes('Test Reviewer') && html.includes('Test Date'), 'Top 4-column metadata grid rendered');
assert(html.includes('Rimsha Shahbaz') && html.includes('Arslan Ali') && html.includes('Aug 12, 2026'), 'Metadata values properly populated');

// 3. Centered Title
assert(html.includes('Verify User Login with Valid Credentials'), 'Centered test case title present');

// 4. Section 1: TEST INFORMATION
assert(html.includes('TEST INFORMATION'), 'Section 1 TEST INFORMATION banner present');
assert(html.includes('#D6E8FD'), 'Section 1 uses light pastel blue banner (#D6E8FD)');
assert(html.includes('Description') && html.includes('Pre-requisites') && html.includes('Location/Area') && html.includes('Dependencies') && html.includes('Required Configuration'), 'All TEST INFORMATION fields present');

// 5. Section 2: Test Data
assert(html.includes('Test Data'), 'Section 2 Test Data banner present');
assert(html.includes('username') && html.includes('associate_01@annoushka.com'), 'Test Data rows rendered');

// 6. Section 3: RESULT DETAILS
assert(html.includes('RESULT DETAILS'), 'Section 3 RESULT DETAILS banner present');
assert(html.includes('User Input') && html.includes('Expected Result') && html.includes('Actual Result') && html.includes('Pass/Fail?'), 'Result Details table headers present');
assert(html.includes('#5551FF') || html.includes('✓'), 'Pass radio indicator rendered with checkmark badge');
assert(html.includes('Pass') && html.includes('Fail'), 'Pass and Fail labels rendered');

// 7. Section 4: Results Summary
assert(html.includes('Results Summary'), 'Section 4 Results Summary banner present');
assert(html.includes('#FED7D7'), 'Section 4 uses soft pink / light red banner (#FED7D7)');
assert(html.includes('All login checkpoints passed without latency or token expiration issues.'), 'Results summary content rendered');

// 8. Bottom Right Footer
assert(html.includes('Case Ref:') && html.includes('Taar Consulting'), 'Bottom footer has page ref on left and Taar Consulting on right');

console.log(`\n==================================================================`);
console.log(`RESULTS: ${totalPassed} Passed, ${totalFailed} Failed`);
console.log(`==================================================================`);

if (totalFailed > 0) {
  process.exit(1);
}
