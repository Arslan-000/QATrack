/**
 * PulseWave Intelligent Release Risk Engine & Quality Gate Service
 * 
 * Deterministic, rule-based, and explainable quality assessment engine.
 * Computes release readiness from real database records (defects, test executions,
 * regression runs, blocked tests, verification coverage, overdue items, and history).
 */

const ReleaseQualityService = {
  CALCULATION_VERSION: "v1.0",

  /**
   * Default project quality configuration policy
   */
  getDefaultSettings(projectId) {
    return {
      id: `pqs-${projectId}`,
      projectId: projectId,
      project_id: projectId,
      critical_bug_blocks_release: true,
      high_bug_threshold: 0,
      minimum_test_pass_rate: 95.0,
      minimum_regression_pass_rate: 90.0,
      minimum_coverage: 80.0,
      maximum_blocked_tests: 0,
      maximum_open_critical_bugs: 0,
      allow_release_override: true,
      updated_by: null,
      updated_at: new Date().toISOString()
    };
  },

  /**
   * Deterministically evaluate release quality and generate an immutable assessment snapshot
   */
  evaluateReleaseQuality({
    release,
    project,
    issues = [],
    testCases = [],
    testExecutions = [],
    settings = null,
    previousAssessment = null,
    userId = null
  }) {
    if (!release) {
      throw new Error("Release object is required for quality assessment.");
    }

    const effectiveSettings = settings || this.getDefaultSettings(release.projectId || release.project_id);
    const releaseId = release.id;
    const projectId = release.projectId || release.project_id;

    // 1. Identify Release Scope Issues
    // Matches by linked issues, releaseVersion/buildVersion, or project issues
    const releaseVersion = release.version ? release.version.trim() : null;
    let scopedIssues = issues.filter(i => {
      if (i.releaseId && i.releaseId === releaseId) return true;
      if (i.release_id && i.release_id === releaseId) return true;
      if (releaseVersion && (i.releaseVersion === releaseVersion || i.release_version === releaseVersion || i.buildVersion === releaseVersion)) return true;
      if (Array.isArray(release.linkedIssueIds) && release.linkedIssueIds.includes(i.id)) return true;
      return false;
    });

    // If no explicit release-tagged issues exist, fallback to all project issues
    if (scopedIssues.length === 0) {
      scopedIssues = issues.filter(i => (i.projectId === projectId || i.project_id === projectId));
    }

    // 2. Identify Release Scope Test Cases & Executions
    const scopedTestCases = testCases.filter(tc => (tc.projectId === projectId || tc.project_id === projectId));
    const scopedExecutions = testExecutions.filter(te => (te.projectId === projectId || te.project_id === projectId));

    const riskFactors = [];
    let totalDeductions = 0;
    let blockingRiskCount = 0;
    let criticalRiskCount = 0;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    // -------------------------------------------------------------------------
    // SIGNAL 1: CRITICAL OPEN DEFECTS
    // -------------------------------------------------------------------------
    const openCriticalBugs = scopedIssues.filter(i => {
      const isBug = (i.type || "").toLowerCase() === "bug" || (i.type || "").toLowerCase() === "defect";
      const isCritical = (i.priority || "").toLowerCase() === "critical" || (i.severity || "").toLowerCase() === "critical";
      const isOpen = i.status !== "Done" && i.status !== "Closed";
      return isBug && isCritical && isOpen;
    });

    const maxAllowedCritical = Number(effectiveSettings.maximum_open_critical_bugs || 0);
    const criticalBlocks = Boolean(effectiveSettings.critical_bug_blocks_release);

    if (openCriticalBugs.length > maxAllowedCritical) {
      const isBlocking = criticalBlocks;
      const deduction = Math.min(60, openCriticalBugs.length * 20);
      totalDeductions += deduction;

      if (isBlocking) blockingRiskCount += openCriticalBugs.length;
      criticalRiskCount += openCriticalBugs.length;

      openCriticalBugs.forEach(bug => {
        riskFactors.push({
          id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          release_id: releaseId,
          project_id: projectId,
          category: "CRITICAL_DEFECTS",
          severity: isBlocking ? "BLOCKING" : "CRITICAL",
          title: `Critical Defect: ${bug.key || bug.id} remains unresolved`,
          description: bug.title || "Critical blocker defect",
          evidence: {
            entityType: "ISSUE",
            issueId: bug.id,
            issueKey: bug.key,
            priority: bug.priority || "Critical",
            status: bug.status,
            assignee: bug.assignee || bug.assigneeName || bug.developerName || "Unassigned",
            createdAt: bug.createdAt || bug.created_at
          },
          score_impact: 20,
          is_blocking: isBlocking
        });
      });
    }

    // -------------------------------------------------------------------------
    // SIGNAL 2: HIGH-SEVERITY OPEN DEFECTS
    // -------------------------------------------------------------------------
    const openHighBugs = scopedIssues.filter(i => {
      const isBug = (i.type || "").toLowerCase() === "bug" || (i.type || "").toLowerCase() === "defect";
      const isHigh = (i.priority || "").toLowerCase() === "high" || (i.severity || "").toLowerCase() === "high";
      const isOpen = i.status !== "Done" && i.status !== "Closed";
      return isBug && isHigh && isOpen;
    });

    const highBugThreshold = Number(effectiveSettings.high_bug_threshold || 0);
    if (openHighBugs.length > highBugThreshold) {
      const deduction = Math.min(40, (openHighBugs.length - highBugThreshold) * 8);
      totalDeductions += deduction;
      highRiskCount += openHighBugs.length;

      riskFactors.push({
        id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        release_id: releaseId,
        project_id: projectId,
        category: "OPEN_DEFECTS",
        severity: "HIGH",
        title: `${openHighBugs.length} High-Severity open defect(s) exceed threshold (${highBugThreshold})`,
        description: `Unresolved high-priority issues require engineering resolution before production readiness.`,
        evidence: {
          entityType: "ISSUE_LIST",
          count: openHighBugs.length,
          issues: openHighBugs.map(b => ({ id: b.id, key: b.key, title: b.title, status: b.status }))
        },
        score_impact: deduction,
        is_blocking: false
      });
    }

    // -------------------------------------------------------------------------
    // SIGNAL 3: OVERALL TEST EXECUTION & PASS RATE
    // -------------------------------------------------------------------------
    const totalExecuted = scopedExecutions.length;
    const passedExecutions = scopedExecutions.filter(e => e.status === "Passed" || e.result === "Passed" || e.result === "PASS" || e.status === "PASS");
    const failedExecutions = scopedExecutions.filter(e => e.status === "Failed" || e.result === "Failed" || e.result === "FAIL" || e.status === "FAIL");
    const blockedExecutions = scopedExecutions.filter(e => e.status === "Blocked" || e.result === "Blocked");

    let overallPassRate = null;
    const minPassRate = Number(effectiveSettings.minimum_test_pass_rate || 95.0);

    if (totalExecuted > 0) {
      overallPassRate = Math.round((passedExecutions.length / totalExecuted) * 100);

      if (overallPassRate < minPassRate) {
        const gap = minPassRate - overallPassRate;
        const deduction = Math.min(25, Math.max(10, Math.round(gap * 0.8)));
        totalDeductions += deduction;
        highRiskCount++;

        riskFactors.push({
          id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          release_id: releaseId,
          project_id: projectId,
          category: "FAILED_TESTS",
          severity: "HIGH",
          title: `Overall Test Pass Rate (${overallPassRate}%) is below target (${minPassRate}%)`,
          description: `${failedExecutions.length} test execution failure(s) recorded across active test cycles.`,
          evidence: {
            entityType: "TEST_METRICS",
            totalExecuted,
            passed: passedExecutions.length,
            failed: failedExecutions.length,
            blocked: blockedExecutions.length,
            passRate: overallPassRate,
            targetPassRate: minPassRate,
            failedExecutions: failedExecutions.slice(0, 5).map(f => ({
              id: f.id,
              testCaseId: f.testCaseId || f.test_case_id,
              cycleName: f.cycleName || f.cycle_name,
              actualResult: f.actualResult || f.actual_result
            }))
          },
          score_impact: deduction,
          is_blocking: false
        });
      }
    }

    // -------------------------------------------------------------------------
    // SIGNAL 4: REGRESSION TEST QUALITY
    // -------------------------------------------------------------------------
    const regressionExecutions = scopedExecutions.filter(e => {
      const type = (e.testType || e.test_type || "").toLowerCase();
      return type.includes("regression") || type.includes("smoke") || type.includes("sanity");
    });

    let regressionPassRate = null;
    const minRegressionPassRate = Number(effectiveSettings.minimum_regression_pass_rate || 90.0);

    if (regressionExecutions.length > 0) {
      const regPassed = regressionExecutions.filter(e => e.status === "Passed" || e.result === "Passed" || e.result === "PASS" || e.status === "PASS");
      const regFailed = regressionExecutions.filter(e => e.status === "Failed" || e.result === "Failed" || e.result === "FAIL" || e.status === "FAIL");
      regressionPassRate = Math.round((regPassed.length / regressionExecutions.length) * 100);

      if (regressionPassRate < minRegressionPassRate) {
        const deduction = 15;
        totalDeductions += deduction;
        criticalRiskCount++;

        riskFactors.push({
          id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          release_id: releaseId,
          project_id: projectId,
          category: "REGRESSION_COVERAGE",
          severity: "CRITICAL",
          title: `Regression Pass Rate (${regressionPassRate}%) failed quality gate (${minRegressionPassRate}%)`,
          description: `${regFailed.length} regression test case(s) broke existing functionality.`,
          evidence: {
            entityType: "REGRESSION_METRICS",
            regressionTotal: regressionExecutions.length,
            regressionPassed: regPassed.length,
            regressionFailed: regFailed.length,
            passRate: regressionPassRate,
            targetPassRate: minRegressionPassRate,
            failedRegressionCases: regFailed.map(r => ({
              id: r.id,
              testCaseId: r.testCaseId || r.test_case_id,
              cycleName: r.cycleName || r.cycle_name
            }))
          },
          score_impact: deduction,
          is_blocking: false
        });
      }
    }

    // -------------------------------------------------------------------------
    // SIGNAL 5: BLOCKED TEST EXECUTIONS
    // -------------------------------------------------------------------------
    const maxBlockedAllowed = Number(effectiveSettings.maximum_blocked_tests || 0);
    if (blockedExecutions.length > maxBlockedAllowed) {
      const isBlocking = maxBlockedAllowed === 0 && blockedExecutions.length >= 3;
      const deduction = Math.min(20, blockedExecutions.length * 5);
      totalDeductions += deduction;

      if (isBlocking) blockingRiskCount++;
      highRiskCount++;

      riskFactors.push({
        id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        release_id: releaseId,
        project_id: projectId,
        category: "BLOCKED_TESTS",
        severity: isBlocking ? "BLOCKING" : "HIGH",
        title: `${blockedExecutions.length} Test Execution(s) Blocked by Environment/Dependencies`,
        description: `Blocked tests prevent thorough verification of critical release workflows.`,
        evidence: {
          entityType: "BLOCKED_TESTS",
          count: blockedExecutions.length,
          blockedCases: blockedExecutions.map(b => ({
            id: b.id,
            testCaseId: b.testCaseId || b.test_case_id,
            notes: b.qaNotes || b.comments || "Dependency blocked"
          }))
        },
        score_impact: deduction,
        is_blocking: isBlocking
      });
    }

    // -------------------------------------------------------------------------
    // SIGNAL 6: VERIFICATION COVERAGE / SCOPE COMPLETENESS
    // -------------------------------------------------------------------------
    let coveragePct = null;
    const minCoverage = Number(effectiveSettings.minimum_coverage || 80.0);

    if (scopedTestCases.length > 0) {
      const executedCaseIds = new Set(scopedExecutions.map(e => e.testCaseId || e.test_case_id).filter(Boolean));
      coveragePct = Math.round((executedCaseIds.size / scopedTestCases.length) * 100);

      if (coveragePct < minCoverage) {
        const deduction = 10;
        totalDeductions += deduction;
        mediumRiskCount++;

        riskFactors.push({
          id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          release_id: releaseId,
          project_id: projectId,
          category: "TEST_COVERAGE",
          severity: "MEDIUM",
          title: `Verification Incomplete: Only ${coveragePct}% of test library executed (target: ${minCoverage}%)`,
          description: `${scopedTestCases.length - executedCaseIds.size} defined test case(s) have not been run for this release.`,
          evidence: {
            entityType: "COVERAGE_METRICS",
            totalTestCases: scopedTestCases.length,
            executedTestCases: executedCaseIds.size,
            unexecutedCount: scopedTestCases.length - executedCaseIds.size,
            coveragePct,
            targetCoverage: minCoverage
          },
          score_impact: deduction,
          is_blocking: false
        });
      }
    }

    // -------------------------------------------------------------------------
    // SIGNAL 7: REOPENED DEFECTS (Flaky fix / Regression indicator)
    // -------------------------------------------------------------------------
    const openReopenedBugs = scopedIssues.filter(i => {
      const isBug = (i.type || "").toLowerCase() === "bug" || (i.type || "").toLowerCase() === "defect";
      const isReopened = (Number(i.reopenCount || i.reopen_count || 0) > 0) || i.status === "Reopened";
      const isOpen = i.status !== "Done" && i.status !== "Closed";
      return isBug && isReopened && isOpen;
    });

    if (openReopenedBugs.length > 0) {
      const deduction = Math.min(15, openReopenedBugs.length * 5);
      totalDeductions += deduction;
      mediumRiskCount++;

      riskFactors.push({
        id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        release_id: releaseId,
        project_id: projectId,
        category: "REOPENED_DEFECTS",
        severity: "MEDIUM",
        title: `${openReopenedBugs.length} Reopened Defect(s) active in release scope`,
        description: `Defects that failed previous QA verification cycles and were reopened for rework.`,
        evidence: {
          entityType: "REOPENED_BUGS",
          count: openReopenedBugs.length,
          issues: openReopenedBugs.map(b => ({
            id: b.id,
            key: b.key,
            title: b.title,
            reopenCount: b.reopenCount || b.reopen_count || 1
          }))
        },
        score_impact: deduction,
        is_blocking: false
      });
    }

    // -------------------------------------------------------------------------
    // SIGNAL 8: OVERDUE QUALITY WORK
    // -------------------------------------------------------------------------
    const nowTimestamp = new Date().getTime();
    const overdueIssues = scopedIssues.filter(i => {
      if (!i.dueDate && !i.due_date) return false;
      const dueTime = new Date(i.dueDate || i.due_date).getTime();
      const isOpen = i.status !== "Done" && i.status !== "Closed";
      return isOpen && dueTime < nowTimestamp;
    });

    if (overdueIssues.length > 0) {
      const deduction = Math.min(12, overdueIssues.length * 4);
      totalDeductions += deduction;
      lowRiskCount++;

      riskFactors.push({
        id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        release_id: releaseId,
        project_id: projectId,
        category: "OVERDUE_ISSUES",
        severity: "LOW",
        title: `${overdueIssues.length} Release QA Task(s) Past Due Date`,
        description: `Overdue tickets indicate schedule compression and potential QA verification bottlenecks.`,
        evidence: {
          entityType: "OVERDUE_ITEMS",
          count: overdueIssues.length,
          issues: overdueIssues.map(i => ({ id: i.id, key: i.key, title: i.title, dueDate: i.dueDate || i.due_date }))
        },
        score_impact: deduction,
        is_blocking: false
      });
    }

    // -------------------------------------------------------------------------
    // SIGNAL 9: DATA COMPLETENESS CALCULATION
    // -------------------------------------------------------------------------
    let completenessSignals = 0;
    if (scopedTestCases.length > 0) completenessSignals++;
    if (scopedExecutions.length > 0) completenessSignals++;
    if (scopedIssues.length > 0) completenessSignals++;
    if (regressionExecutions.length > 0) completenessSignals++;

    const dataCompleteness = Math.round((completenessSignals / 4) * 100);

    // -------------------------------------------------------------------------
    // FINAL SCORE, GATE & STATUS DETERMINATION
    // -------------------------------------------------------------------------
    let finalScore = null;
    let finalStatus = "NO_DATA";
    let recommendation = "";

    // If completely empty project with no quality data:
    if (dataCompleteness === 0 || (scopedExecutions.length === 0 && scopedIssues.length === 0)) {
      finalScore = null;
      finalStatus = "NO_DATA";
      recommendation = "Insufficient quality telemetry. Execute test cycles and link release defects to calculate a reliable quality score.";
    } else {
      finalScore = Math.max(0, Math.min(100, 100 - totalDeductions));

      if (blockingRiskCount > 0) {
        finalStatus = "NOT_READY";
        recommendation = `Release is blocked by ${blockingRiskCount} critical condition(s). All blocking defects and environmental blockers must be resolved before release.`;
      } else if (finalScore >= 80 && highRiskCount === 0 && (overallPassRate === null || overallPassRate >= minPassRate)) {
        finalStatus = "READY";
        recommendation = "Release meets all configured quality policies and readiness gates. Safe to proceed with production deployment.";
      } else {
        finalStatus = "AT_RISK";
        recommendation = "Release exhibits meaningful quality risks. Review highlighted risk factors and verify unexecuted test cases before shipping.";
      }
    }

    // -------------------------------------------------------------------------
    // QUALITY GATE RULES EVALUATION
    // -------------------------------------------------------------------------
    const qualityGateRules = [
      {
        id: "rule_critical_bugs",
        name: "Critical Open Bugs",
        allowed: `${maxAllowedCritical} max`,
        current: `${openCriticalBugs.length} open`,
        status: openCriticalBugs.length <= maxAllowedCritical ? "PASSED" : "FAILED",
        linkType: "issues",
        filter: "critical_bugs"
      },
      {
        id: "rule_high_bugs",
        name: "High Priority Bugs",
        allowed: `${highBugThreshold} max`,
        current: `${openHighBugs.length} open`,
        status: openHighBugs.length <= highBugThreshold ? "PASSED" : "FAILED",
        linkType: "issues",
        filter: "high_bugs"
      },
      {
        id: "rule_test_pass_rate",
        name: "Test Pass Rate",
        allowed: `≥ ${minPassRate}%`,
        current: overallPassRate !== null ? `${overallPassRate}%` : "N/A",
        status: overallPassRate === null ? "NO_DATA" : (overallPassRate >= minPassRate ? "PASSED" : "FAILED"),
        linkType: "test_runs",
        filter: "all"
      },
      {
        id: "rule_regression_pass_rate",
        name: "Regression Pass Rate",
        allowed: `≥ ${minRegressionPassRate}%`,
        current: regressionPassRate !== null ? `${regressionPassRate}%` : "N/A",
        status: regressionPassRate === null ? "NO_DATA" : (regressionPassRate >= minRegressionPassRate ? "PASSED" : (regressionPassRate >= 80 ? "WARNING" : "FAILED")),
        linkType: "test_runs",
        filter: "regression"
      },
      {
        id: "rule_blocked_tests",
        name: "Blocked Tests",
        allowed: `${maxBlockedAllowed} max`,
        current: `${blockedExecutions.length} blocked`,
        status: blockedExecutions.length <= maxBlockedAllowed ? "PASSED" : "FAILED",
        linkType: "test_runs",
        filter: "blocked"
      },
      {
        id: "rule_verification_coverage",
        name: "Verification Coverage",
        allowed: `≥ ${minCoverage}%`,
        current: coveragePct !== null ? `${coveragePct}%` : "N/A",
        status: coveragePct === null ? "NO_DATA" : (coveragePct >= minCoverage ? "PASSED" : "WARNING"),
        linkType: "test_cases",
        filter: "coverage"
      }
    ];

    // -------------------------------------------------------------------------
    // SUMMARY METRICS PAYLOAD
    // -------------------------------------------------------------------------
    const summaryMetrics = {
      totalIssues: scopedIssues.length,
      openCriticalBugs: openCriticalBugs.length,
      openHighBugs: openHighBugs.length,
      openReopenedBugs: openReopenedBugs.length,
      totalTestCases: scopedTestCases.length,
      totalExecutions: scopedExecutions.length,
      passedExecutions: passedExecutions.length,
      failedExecutions: failedExecutions.length,
      blockedExecutions: blockedExecutions.length,
      overallPassRate,
      regressionTotal: regressionExecutions.length,
      regressionPassRate,
      coveragePct,
      overdueCount: overdueIssues.length,
      totalDeductions,
      qualityGateRules
    };

    // -------------------------------------------------------------------------
    // HISTORICAL TREND CALCULATION
    // -------------------------------------------------------------------------
    let scoreTrend = null;
    if (previousAssessment && previousAssessment.score !== null && finalScore !== null) {
      const prevScore = Number(previousAssessment.score);
      const scoreDiff = finalScore - prevScore;
      scoreTrend = {
        previousScore: prevScore,
        currentScore: finalScore,
        scoreDiff,
        direction: scoreDiff > 0 ? "improved" : (scoreDiff < 0 ? "decreased" : "unchanged"),
        label: scoreDiff > 0 ? `+${scoreDiff} pts` : (scoreDiff < 0 ? `${scoreDiff} pts` : "0 pts")
      };
    }

    const assessmentSnapshot = {
      id: `rqa-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      release_id: releaseId,
      releaseId: releaseId,
      project_id: projectId,
      projectId: projectId,
      score: finalScore,
      status: finalStatus,
      calculated_at: new Date().toISOString(),
      calculatedAt: new Date().toISOString(),
      calculation_version: this.CALCULATION_VERSION,
      blocking_risk_count: blockingRiskCount,
      blockingRiskCount,
      critical_risk_count: criticalRiskCount,
      criticalRiskCount,
      high_risk_count: highRiskCount,
      highRiskCount,
      medium_risk_count: mediumRiskCount,
      mediumRiskCount,
      low_risk_count: lowRiskCount,
      lowRiskCount,
      data_completeness: dataCompleteness,
      dataCompleteness,
      summary_metrics: summaryMetrics,
      summaryMetrics,
      recommendation,
      scoreTrend,
      created_at: new Date().toISOString(),
      created_by: userId
    };

    return {
      assessment: assessmentSnapshot,
      riskFactors
    };
  }
};

if (typeof window !== "undefined") {
  window.ReleaseQualityService = ReleaseQualityService;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ReleaseQualityService;
}
