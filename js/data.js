/**
 * PulseWave QA Platform — Real Data Store Baseline
 * Clean initial baseline with zero dummy projects, zero dummy spaces, and real database readiness.
 */

const INITIAL_DATA = {
  activeUserId: null,
  activeProjectId: null,
  activeWorkspaceId: null,

  organization: {
    id: "org-1",
    name: "PulseWave Workspace",
    domain: "pulsewave.io",
    plan: "Enterprise Cloud"
  },

  users: [],
  workspaces: [],
  projects: [],
  issues: [],
  sprints: [],
  testPlans: [],
  testSuites: [],
  testCases: [],
  testExecutions: [],
  testReports: [],
  qaReports: [],
  qaTestCases: [],
  qaTestData: [],
  qaTestExecutions: [],
  notifications: [],
  activity: [],
  chatConversations: [],
  chatConversationMembers: [],
  chatMessages: [],
  chatMessageReactions: [],
  chatMessageMentions: [],
  chatMessageAttachments: [],
  chatMessageLinks: [],

  // Reusable Industry-Standard QA Engineering & Quality Document Templates
  documentTemplates: [
    {
      id: "tmpl-test-strategy",
      name: "Master QA Test Strategy",
      category: "Test Strategy",
      icon: "shield-check",
      description: "Master QA strategy covering testing levels, test environments, entry/exit criteria, and quality gates.",
      defaultVisibility: "INTERNAL",
      prerequisites: "1. Functional specifications finalized\n2. Staging environment provisioned",
      environment: "Staging / Pre-Production",
      dependencies: "Core Services, Auth, Database",
      testData: "Seed test fixtures and baseline accounts",
      testMatrix: [
        { id: "TC-01", title: "Verify authentication & token refresh", module: "Auth", prerequisites: "Staging live", environment: "Staging", dependencies: "Auth0 / Supabase", testData: "QA Test User", steps: "1. Login with valid credentials\n2. Verify JWT session token issued", expectedResult: "Session active and token valid", actualResult: "200 OK — Authenticated", status: "Pass", bugKey: "None", devNotes: "", qaNotes: "Verified by QA" },
        { id: "TC-02", title: "Verify core business transaction flow", module: "Core", prerequisites: "User logged in", environment: "Staging", dependencies: "API & DB", testData: "Valid payload", steps: "1. Initiate transaction\n2. Verify confirmation response", expectedResult: "Transaction committed with 200 OK", actualResult: "Success confirmed", status: "Pass", bugKey: "None", devNotes: "", qaNotes: "Verified by QA" }
      ],
      content: "# Master QA Test Strategy\n\n## 1. Scope of Testing\n- Unit & Component Testing\n- Integration & API Testing\n- End-to-End UI Automation\n- Regression & Smoke Verification\n\n## 2. Test Environments\n- **Staging:** Primary verification\n- **Pre-Prod:** Final quality gate sign-off\n\n## 3. Entry & Exit Criteria\n- **Entry:** Zero build errors, unit tests passing > 80% coverage.\n- **Exit:** 100% critical test cases passed, zero P0/P1 blocker defects."
    },
    {
      id: "tmpl-sprint-signoff",
      name: "Sprint QA Release Sign-Off",
      category: "Release Sign-Off",
      icon: "file-check",
      description: "Formal QA sign-off and test execution summary document for production deployment approval.",
      defaultVisibility: "CUSTOMER READY",
      prerequisites: "1. Sprint test cycle executed\n2. All blocking defects resolved",
      environment: "Staging / QA Build",
      dependencies: "Payment Gateway, Cloud APIs, Database",
      testData: "Sprint test data suite",
      testMatrix: [
        { id: "TC-01", title: "Sprint User Stories Regression", module: "Sprint", prerequisites: "Sprint build deployed", environment: "Staging", dependencies: "Core", testData: "User profile", steps: "Execute sprint acceptance test cases", expectedResult: "100% acceptance criteria satisfied", actualResult: "Passed without regressions", status: "Pass", bugKey: "None", devNotes: "", qaNotes: "Signed off" }
      ],
      content: "# Sprint QA Release Sign-Off Report\n\n## 1. Release Overview\n- **Release Version:**\n- **QA Lead Sign-Off:**\n- **Execution Period:**\n\n## 2. Test Execution Summary\n- Total Test Cases Executed:\n- Passed Rate:\n- Defect Count by Severity:\n\n## 3. Quality Gate Decision\n**[ APPROVED FOR DEPLOYMENT / BLOCKED ]**"
    },
    {
      id: "tmpl-prd-acceptance",
      name: "Product Requirements & Acceptance Criteria (PRD)",
      category: "Requirements",
      icon: "file-text",
      description: "Standard template for feature specifications, user stories, and QA acceptance criteria.",
      defaultVisibility: "INTERNAL",
      prerequisites: "Stakeholder approval and design wireframes ready",
      environment: "Design / Staging",
      dependencies: "Frontend UI, Backend Services",
      testData: "User story test matrix",
      testMatrix: [
        { id: "AC-01", title: "User positive happy path scenario", module: "Feature", prerequisites: "Feature flag enabled", environment: "Staging", dependencies: "UI", testData: "Standard inputs", steps: "1. Complete flow\n2. Verify success screen", expectedResult: "Feature responds as specified in AC", actualResult: "Verified", status: "Pass", bugKey: "None", devNotes: "", qaNotes: "AC Satisfied" }
      ],
      content: "# Product Requirements Document (PRD)\n\n## 1. Executive Summary\nProvide a high-level overview of the feature.\n\n## 2. Problem Statement\nWhat user problem are we solving?\n\n## 3. Goals & Success Metrics\n- Metric 1:\n- Metric 2:\n\n## 4. User Personas & Use Cases\nDescribe target users and interaction flows.\n\n## 5. Functional Requirements\n- **FR-1:** System must allow...\n- **FR-2:** Real-time validation for...\n\n## 6. Non-Functional Requirements\n- Performance (< 200ms API response)\n- Security & RBAC compliance\n\n## 7. QA Acceptance Criteria\n- [ ] Scenario 1 passes positive flow\n- [ ] Edge cases handled gracefully"
    },
    {
      id: "tmpl-regression-plan",
      name: "Regression & Smoke Test Plan",
      category: "Test Plan",
      icon: "clipboard-check",
      description: "Critical path checklist and smoke verification plan for fast pre-deployment health checks.",
      defaultVisibility: "INTERNAL",
      prerequisites: "1. Fresh build deployment complete\n2. Health checks 200 OK",
      environment: "Staging / Production",
      dependencies: "All Microservices & Gateways",
      testData: "Automated smoke test suite",
      testMatrix: [
        { id: "SMK-01", title: "Platform health check & landing page load", module: "Smoke", prerequisites: "Server online", environment: "Staging", dependencies: "Web App", testData: "N/A", steps: "1. Navigate to application URL\n2. Verify initial assets load", expectedResult: "App loads under 1s without console errors", actualResult: "200 OK", status: "Pass", bugKey: "None", devNotes: "", qaNotes: "Smoke passed" },
        { id: "SMK-02", title: "User Authentication & Session persistence", module: "Smoke", prerequisites: "User account exists", environment: "Staging", dependencies: "Auth Service", testData: "QA credentials", steps: "1. Login\n2. Refresh page", expectedResult: "Session restored seamlessly", actualResult: "Passed", status: "Pass", bugKey: "None", devNotes: "", qaNotes: "Smoke passed" }
      ],
      content: "# Regression & Smoke Test Plan\n\n## 1. Objectives\nRapidly verify core business flows before promoting builds to production.\n\n## 2. Test Execution Scope\n- Authentication & Authorization\n- Core User Workflows\n- Database Persistence\n- Third-party Integrations"
    },
    {
      id: "tmpl-api-strategy",
      name: "API & Integration Test Specification",
      category: "API Testing",
      icon: "code-2",
      description: "Technical specification covering REST endpoints, request/response validation, and HTTP status codes.",
      defaultVisibility: "INTERNAL",
      prerequisites: "API Gateway active with staging credentials",
      environment: "Staging API Cluster",
      dependencies: "API Gateway, Auth, Postgres",
      testData: "JSON payloads & mock parameters",
      testMatrix: [
        { id: "API-01", title: "POST /api/v1/resource — Create record", module: "REST API", prerequisites: "Bearer token valid", environment: "Staging API", dependencies: "DB", testData: "Valid JSON schema", steps: "1. Send POST request\n2. Assert 201 Created and schema", expectedResult: "201 Created with resource payload", actualResult: "201 Created", status: "Pass", bugKey: "None", devNotes: "", qaNotes: "Schema validated" }
      ],
      content: "# API & Integration Test Specification\n\n## 1. Overview\nDocument and verify API endpoint contracts, schemas, headers, and error codes."
    },
    {
      id: "tmpl-defect-triage",
      name: "Defect Triage & Root Cause Log",
      category: "Defect Management",
      icon: "bug",
      description: "Structured triage log documenting critical defects, root causes, developer patches, and QA retest sign-off.",
      defaultVisibility: "INTERNAL",
      prerequisites: "Bugs logged in issue tracker",
      environment: "Staging",
      dependencies: "Issue Tracker",
      testData: "Defect verification steps",
      testMatrix: [
        { id: "BUG-01", title: "Critical path defect re-test", module: "Defects", prerequisites: "Developer fix committed", environment: "Staging", dependencies: "Bug Fix PR", testData: "Repro steps", steps: "1. Execute exact steps to reproduce\n2. Verify fix", expectedResult: "Issue resolved without side-effects", actualResult: "Verified & Closed", status: "Pass", bugKey: "BUG-01", devNotes: "Fixed in latest commit", qaNotes: "Verified & Closed" }
      ],
      content: "# Defect Triage & Root Cause Log\n\n## 1. Triage Summary\nDocument critical P0/P1 issues, root causes, and verification sign-offs."
    }
  ],

  documents: [],
  projectDocs: {}
};

if (typeof window !== 'undefined') window.INITIAL_DATA = INITIAL_DATA;
if (typeof global !== 'undefined') global.INITIAL_DATA = INITIAL_DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = INITIAL_DATA;
