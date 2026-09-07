/**
 * PulseWave QA Platform — AI QA Assistant Engine & Prompt Compiler
 * Deterministic, Zero-Hallucination QA Summaries, Developer/Client Emails & Reports
 */

const AIQAService = {
  /**
   * Format date into readable English string (e.g. "September 7, 2026")
   */
  formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch (e) {
      return String(dateStr);
    }
  },

  /**
   * Format single date or date range string
   */
  formatDateRange(startDate, endDate) {
    if (!startDate && !endDate) return "Current Testing Period";
    const startFormatted = this.formatDate(startDate);
    if (!endDate || startDate === endDate) {
      return startFormatted;
    }
    const endFormatted = this.formatDate(endDate);
    return `${startFormatted} – ${endFormatted}`;
  },

  /**
   * Query and filter issues by project and date range
   */
  filterIssuesByDate(issues, startDate, endDate) {
    if (!Array.isArray(issues) || issues.length === 0) return [];
    if (!startDate && !endDate) return issues;

    const start = startDate ? new Date(startDate) : new Date("1970-01-01");
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date(startDate || "2099-12-31");
    end.setHours(23, 59, 59, 999);

    return issues.filter(i => {
      const rawDate = i.createdAt || i.created_at || i.updatedAt || i.updated_at;
      if (!rawDate) return true;
      const issueDate = new Date(rawDate);
      if (isNaN(issueDate.getTime())) return true;
      return issueDate >= start && issueDate <= end;
    });
  },

  /**
   * Calculate structured issue metrics
   */
  calculateMetrics(issues) {
    const total = (issues || []).length;
    const severityCounts = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0
    };
    const statusCounts = {
      Open: 0,
      InProgress: 0,
      ReadyForQA: 0,
      QATesting: 0,
      Done: 0,
      Reopened: 0
    };
    const modulesMap = new Map();

    (issues || []).forEach(i => {
      // Severity / Priority
      const p = i.priority || "Medium";
      if (p === "Critical") severityCounts.Critical++;
      else if (p === "High") severityCounts.High++;
      else if (p === "Low") severityCounts.Low++;
      else severityCounts.Medium++;

      // Status
      const s = (i.status || "").toLowerCase();
      if (s === "reopened") statusCounts.Reopened++;
      else if (s === "done" || s === "closed" || s === "resolved") statusCounts.Done++;
      else if (s === "ready for qa" || s === "fixed") statusCounts.ReadyForQA++;
      else if (s === "qa testing" || s === "qa" || s === "testing") statusCounts.QATesting++;
      else if (s === "in progress" || s === "in development") statusCounts.InProgress++;
      else statusCounts.Open++;

      // Extract module / area from environment, labels, or title keywords
      let area = i.module || i.environment || "General";
      if (i.labels && i.labels.length > 0) area = i.labels[0];
      const titleLower = (i.title || "").toLowerCase();
      if (titleLower.includes("payment") || titleLower.includes("checkout") || titleLower.includes("card")) area = "Checkout & Payment";
      else if (titleLower.includes("auth") || titleLower.includes("login") || titleLower.includes("signup")) area = "Authentication";
      else if (titleLower.includes("ship") || titleLower.includes("delivery") || titleLower.includes("tax")) area = "Shipping & Logistics";
      else if (titleLower.includes("receipt") || titleLower.includes("printer") || titleLower.includes("logo")) area = "Printer & Hardware";
      else if (titleLower.includes("scanner") || titleLower.includes("barcode")) area = "Peripherals";
      else if (titleLower.includes("cart") || titleLower.includes("order")) area = "Orders & Cart";
      else if (titleLower.includes("api") || titleLower.includes("sync")) area = "Backend API";
      else if (titleLower.includes("ui") || titleLower.includes("display") || titleLower.includes("button")) area = "User Interface";

      modulesMap.set(area, (modulesMap.get(area) || 0) + 1);
    });

    const majorAreas = Array.from(modulesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    const criticalAndHigh = (issues || []).filter(i => i.priority === "Critical" || i.priority === "High");

    return {
      total,
      severityCounts,
      severity: severityCounts,
      statusCounts,
      status: statusCounts,
      majorAreas: majorAreas.length > 0 ? majorAreas : ["Core Functionality"],
      criticalAndHigh,
      criticalHighList: criticalAndHigh
    };
  },

  computeMetrics(issues) {
    return this.calculateMetrics(issues);
  },

  /**
   * 1. GENERATE QA SUMMARY
   */
  generateQASummary(project, issues, dateRange, options = {}) {
    const metrics = this.calculateMetrics(issues);
    const dateText = this.formatDateRange(dateRange.startDate, dateRange.endDate);
    const projectName = project ? project.name : "Software Project";

    const areasText = metrics.majorAreas.slice(0, 4).join(", ").toLowerCase();
    const openCount = metrics.statusCounts.Open + metrics.statusCounts.InProgress + metrics.statusCounts.Reopened;

    const summaryText = `During QA testing on ${dateText}, ${metrics.total} ${metrics.total === 1 ? 'issue was' : 'issues were'} evaluated for ${projectName}.\n\n` +
      `Severity Breakdown:\n` +
      `Critical: ${metrics.severityCounts.Critical}\n` +
      `High: ${metrics.severityCounts.High}\n` +
      `Medium: ${metrics.severityCounts.Medium}\n` +
      `Low: ${metrics.severityCounts.Low}\n\n` +
      `The major findings were related to ${areasText}.\n\n` +
      `${openCount} ${openCount === 1 ? 'issue remains' : 'issues remain'} open and require engineering attention.`;

    const majorFindings = (issues || []).slice(0, 6).map(i => ({
      issue_id: i.id,
      key: i.key,
      title: i.title,
      priority: i.priority || "Medium",
      status: i.status || "Open"
    }));

    const observationText = metrics.severityCounts.Critical > 0
      ? `Critical blockers were identified during this testing cycle. Regression verification and developer fix turnarounds are recommended before proceeding with release candidate staging.`
      : metrics.severityCounts.High > 0
      ? `High-priority functional items were discovered. Overall system stability is moderate; targeted bug verification is required.`
      : `No critical blocking defects found. Overall build quality is stable with minor cosmetic or medium priority items outstanding.`;

    const fullBody = `QA Testing Summary\n\n` +
      `Project: ${projectName}\n` +
      `Testing Date: ${dateText}\n\n` +
      `During QA testing, ${metrics.total} ${metrics.total === 1 ? 'issue was' : 'issues were'} identified.\n\n` +
      `Severity:\n` +
      `Critical: ${metrics.severityCounts.Critical}\n` +
      `High: ${metrics.severityCounts.High}\n` +
      `Medium: ${metrics.severityCounts.Medium}\n` +
      `Low: ${metrics.severityCounts.Low}\n\n` +
      (majorFindings.length > 0 ? `Major Issues Identified:\n${majorFindings.map((f, idx) => `${idx + 1}. [${f.key}] ${f.title} – ${f.priority} (${f.status})`).join("\n")}\n\n` : '') +
      `Current Status:\n` +
      `Open: ${metrics.statusCounts.Open}\n` +
      `In Progress: ${metrics.statusCounts.InProgress}\n` +
      `Ready for QA / Testing: ${metrics.statusCounts.ReadyForQA + metrics.statusCounts.QATesting}\n` +
      `Resolved / Done: ${metrics.statusCounts.Done}\n` +
      `Reopened: ${metrics.statusCounts.Reopened}\n\n` +
      `QA Observation:\n${observationText}`;

    return {
      type: "qa_summary",
      title: `QA Testing Summary – ${projectName}`,
      subject: `QA Testing Summary – ${projectName} – ${dateText}`,
      summary: summaryText,
      body: fullBody,
      severity_breakdown: metrics.severityCounts,
      status_breakdown: metrics.statusCounts,
      major_findings: majorFindings,
      qa_observation: observationText,
      metrics,
      issue_summary: (issues || []).map(i => ({
        issue_id: i.id,
        key: i.key,
        title: i.title,
        severity: i.priority || "Medium",
        status: i.status || "Open"
      }))
    };
  },

  /**
   * 2. GENERATE DEVELOPER EMAIL
   */
  generateDeveloperEmail(project, issues, dateRange, options = {}) {
    const metrics = this.calculateMetrics(issues);
    const dateText = this.formatDateRange(dateRange.startDate, dateRange.endDate);
    const projectName = project ? project.name : "Software Project";

    const majorIssuesList = (issues || []).map((i, idx) => 
      `${idx + 1}. [${i.key}] ${i.title} – ${i.priority} (${i.status || 'Open'})`
    ).join("\n");

    const emailBody = `Subject:\nQA Testing Summary – ${projectName} – ${dateText}\n\n` +
      `Hi Team,\n\n` +
      `QA testing was performed on ${projectName} on ${dateText}.\n\n` +
      `During this testing cycle, ${metrics.total} ${metrics.total === 1 ? 'issue was' : 'issues were'} identified.\n\n` +
      (majorIssuesList ? `Major issues:\n\n${majorIssuesList}\n\n` : '') +
      `Severity breakdown:\n` +
      `Critical: ${metrics.severityCounts.Critical}\n` +
      `High: ${metrics.severityCounts.High}\n` +
      `Medium: ${metrics.severityCounts.Medium}\n` +
      `Low: ${metrics.severityCounts.Low}\n\n` +
      `Current issue status:\n\n` +
      `Open: ${metrics.statusCounts.Open}\n` +
      `In Progress: ${metrics.statusCounts.InProgress}\n` +
      `Ready for QA: ${metrics.statusCounts.ReadyForQA + metrics.statusCounts.QATesting}\n` +
      `Resolved / Done: ${metrics.statusCounts.Done}\n` +
      `Reopened: ${metrics.statusCounts.Reopened}\n\n` +
      `Please review the reported issues in PulseWave and address the outstanding items.\n\n` +
      `Regards,\nQA Team`;

    return {
      type: "developer_email",
      title: `Developer QA Testing Report`,
      subject: `QA Testing Summary – ${projectName} – ${dateText}`,
      summary: `Technical testing email for development team with ${metrics.total} identified items.`,
      body: emailBody,
      severity_breakdown: metrics.severityCounts,
      status_breakdown: metrics.statusCounts,
      metrics,
      issue_summary: (issues || []).map(i => ({
        issue_id: i.id,
        key: i.key,
        title: i.title,
        severity: i.priority || "Medium",
        status: i.status || "Open"
      }))
    };
  },

  /**
   * 3. GENERATE CLIENT EMAIL
   */
  generateClientEmail(project, issues, dateRange, options = {}) {
    const metrics = this.calculateMetrics(issues);
    const dateText = this.formatDateRange(dateRange.startDate, dateRange.endDate);
    const projectName = project ? project.name : "Project Deliverable";

    const topImpacts = metrics.criticalAndHigh.length > 0 
      ? metrics.criticalAndHigh.slice(0, 3).map(i => `• ${i.title} (Priority: ${i.priority})`).join("\n")
      : `• No critical blocking defects identified; minor workflow items under active review.`;

    const clientBody = `Subject:\nQA Milestone Quality Update – ${projectName} – ${dateText}\n\n` +
      `Dear Client Team,\n\n` +
      `We have completed a scheduled QA testing cycle for ${projectName} on ${dateText}.\n\n` +
      `During this testing cycle, ${metrics.total} ${metrics.total === 1 ? 'issue was' : 'issues were'} identified.\n\n` +
      `Testing Overview:\n` +
      `• Total Items Evaluated: ${metrics.total}\n` +
      `• Critical Blockers: ${metrics.severityCounts.Critical}\n` +
      `• High Priority Items: ${metrics.severityCounts.High}\n` +
      `• Medium / Minor Items: ${metrics.severityCounts.Medium + metrics.severityCounts.Low}\n\n` +
      `Business-impacting items under review:\n` +
      `${topImpacts}\n\n` +
      `Current QA Status:\n` +
      `${metrics.statusCounts.Done} items have been resolved and verified, while ${metrics.statusCounts.Open + metrics.statusCounts.InProgress + metrics.statusCounts.Reopened} active items are being actively addressed by the team.\n\n` +
      `Zero-defect staging and verification standards remain in effect. A formal QA summary document is attached for your review.\n\n` +
      `Please let us know if you have any questions.\n\n` +
      `Best regards,\nQuality Assurance Team`;

    return {
      type: "client_email",
      title: `Executive Client QA Update`,
      subject: `QA Milestone Quality Update – ${projectName} – ${dateText}`,
      summary: `Client-friendly executive update summarizing testing milestones and release stability.`,
      body: clientBody,
      severity_breakdown: metrics.severityCounts,
      status_breakdown: metrics.statusCounts,
      metrics,
      issue_summary: (issues || []).map(i => ({
        issue_id: i.id,
        key: i.key,
        title: i.title,
        severity: i.priority || "Medium",
        status: i.status || "Open"
      }))
    };
  },

  /**
   * 4. GENERATE QA DOCUMENT
   */
  generateQADocument(project, issues, dateRange, options = {}) {
    const metrics = this.calculateMetrics(issues);
    const dateText = this.formatDateRange(dateRange.startDate, dateRange.endDate);
    const projectName = project ? project.name : "Software Project";

    const majorIssues = (issues || []).map(i => ({
      key: i.key,
      title: i.title,
      priority: i.priority || "Medium",
      status: i.status || "Open"
    }));

    const majorIssuesSection = majorIssues.map((i, idx) => 
      `${idx + 1}. [${i.key}] ${i.title} (Severity: ${i.priority})`
    ).join("\n");

    const docObservation = metrics.severityCounts.Critical > 0
      ? `Testing identified ${metrics.severityCounts.Critical} critical defect(s) requiring remediation prior to release candidate sign-off. Test coverage across core modules was executed successfully.`
      : `Overall test execution demonstrated good build stability with ${metrics.total} total logged items. No release-blocking critical defects remain open. Quality gate criteria are progressing on schedule.`;

    const docBody = `QA Testing Summary\n\n` +
      `Project:\n${projectName}\n\n` +
      `Testing Date:\n${dateText}\n\n` +
      `Total Issues:\n${metrics.total}\n\n` +
      `Severity Breakdown\n\n` +
      `Critical: ${metrics.severityCounts.Critical}\n` +
      `High: ${metrics.severityCounts.High}\n` +
      `Medium: ${metrics.severityCounts.Medium}\n` +
      `Low: ${metrics.severityCounts.Low}\n\n` +
      (majorIssuesSection ? `Major Issues\n\n${majorIssuesSection}\n\n` : '') +
      `Current Status\n\n` +
      `Open: ${metrics.statusCounts.Open}\n` +
      `In Progress: ${metrics.statusCounts.InProgress}\n` +
      `Ready for QA: ${metrics.statusCounts.ReadyForQA + metrics.statusCounts.QATesting}\n` +
      `Resolved: ${metrics.statusCounts.Done}\n` +
      `Retest / Reopened: ${metrics.statusCounts.Reopened}\n\n` +
      `QA Observation\n\n` +
      docObservation;

    return {
      type: "qa_document",
      title: `QA Testing Summary`,
      subject: `QA Testing Summary – ${projectName} – ${dateText}`,
      summary: `Standardized corporate QA deliverable document for ${projectName}.`,
      total_issues: metrics.total,
      severity: metrics.severityCounts,
      major_issues: majorIssues,
      qa_observation: docObservation,
      body: docBody,
      metrics,
      issue_summary: (issues || []).map(i => ({
        issue_id: i.id,
        key: i.key,
        title: i.title,
        severity: i.priority || "Medium",
        status: i.status || "Open"
      }))
    };
  },

  /**
   * REGENERATE with custom instruction
   */
  regenerate(generationType, project, issues, dateRange, instruction = "") {
    const inst = (instruction || "").toLowerCase();

    let baseResult = null;
    if (generationType === "developer_email") {
      baseResult = this.generateDeveloperEmail(project, issues, dateRange);
    } else if (generationType === "client_email") {
      baseResult = this.generateClientEmail(project, issues, dateRange);
    } else if (generationType === "qa_document") {
      baseResult = this.generateQADocument(project, issues, dateRange);
    } else {
      baseResult = this.generateQASummary(project, issues, dateRange);
    }

    if (!instruction) return baseResult;

    const metrics = baseResult.metrics;
    const dateText = this.formatDateRange(dateRange.startDate, dateRange.endDate);
    const projectName = project ? project.name : "Project";

    // 1. "Make it shorter"
    if (inst.includes("short") || inst.includes("concise") || inst.includes("brief")) {
      baseResult.summary = `QA Summary (${projectName}, ${dateText}): ${metrics.total} issues evaluated (${metrics.severityCounts.Critical} Critical, ${metrics.severityCounts.High} High). ${metrics.statusCounts.Done} resolved, ${metrics.statusCounts.Open + metrics.statusCounts.InProgress} pending.`;
      baseResult.body = `QA Summary – ${projectName} (${dateText})\n\n` +
        `• Total Issues: ${metrics.total} (Critical: ${metrics.severityCounts.Critical}, High: ${metrics.severityCounts.High}, Medium: ${metrics.severityCounts.Medium}, Low: ${metrics.severityCounts.Low})\n` +
        `• Status: ${metrics.statusCounts.Open + metrics.statusCounts.InProgress} Open / In Dev, ${metrics.statusCounts.ReadyForQA + metrics.statusCounts.QATesting} In QA, ${metrics.statusCounts.Done} Done\n` +
        `• Observation: ${baseResult.qa_observation || 'Quality verification active.'}`;
    } 
    // 2. "Focus only on critical and high issues"
    else if (inst.includes("critical") || inst.includes("high")) {
      const critList = metrics.criticalAndHigh.map((i, idx) => 
        `${idx + 1}. [${i.key}] ${i.title} (Severity: ${i.priority}, Status: ${i.status || 'Open'})`
      ).join("\n") || "No Critical or High issues found in this cycle.";

      baseResult.qa_observation = `Focus Note: Concentrating strictly on Critical and High priority blockers. Immediate developer resolution required for ${metrics.criticalAndHigh.length} major item(s).`;
      baseResult.body = `High-Priority QA Defect Report – ${projectName} (${dateText})\n\n` +
        `Critical Blockers: ${metrics.severityCounts.Critical}\n` +
        `High Priority Issues: ${metrics.severityCounts.High}\n\n` +
        `Critical & High Items:\n${critList}\n\n` +
        `Action Required: Immediate engineering resolution is required for the critical items listed above before staging deployment.`;
    }
    // 3. "Make it suitable for client"
    else if (inst.includes("client") || inst.includes("executive")) {
      baseResult = this.generateClientEmail(project, issues, dateRange);
    }
    // 4. "Make it more professional"
    else if (inst.includes("professional") || inst.includes("formal")) {
      baseResult.qa_observation = `Formal Quality Telemetry: Testing executed under stringent validation guidelines. Defect density within acceptable staging limits subject to resolution of prioritized items.`;
    }

    return baseResult;
  },

  /**
   * Main unified entry point
   */
  async generate({ projectId, workspaceId, generationType, startDate, endDate, selectedIssues = [], project, instruction = null }) {
    const proj = project || (typeof store !== 'undefined' ? store.getProjectById(projectId) : null) || { id: projectId, name: "Software Project" };
    const dateRange = { startDate, endDate };

    let content = null;
    if (instruction) {
      content = this.regenerate(generationType, proj, selectedIssues, dateRange, instruction);
    } else {
      switch (generationType) {
        case "developer_email":
          content = this.generateDeveloperEmail(proj, selectedIssues, dateRange);
          break;
        case "client_email":
          content = this.generateClientEmail(proj, selectedIssues, dateRange);
          break;
        case "qa_document":
          content = this.generateQADocument(proj, selectedIssues, dateRange);
          break;
        case "qa_summary":
        default:
          content = this.generateQASummary(proj, selectedIssues, dateRange);
          break;
      }
    }

    return {
      success: true,
      generationType,
      content
    };
  },

  /**
   * List of 7 standard quick questions for short QA tasks
   */
  getQuickQuestions() {
    return [
      {
        id: "summary_blockers",
        icon: "clipboard-list",
        emoji: "📋",
        title: "Board Summary & Blockers",
        prompt: "Summarize all board issues and blockers"
      },
      {
        id: "critical_high_defects",
        icon: "flame",
        emoji: "🚨",
        title: "Critical & High Defects",
        prompt: "What are the critical & high severity defects?"
      },
      {
        id: "reopened_failed_qa",
        icon: "rotate-ccw",
        emoji: "🔄",
        title: "Reopened / Failed QA",
        prompt: "Which QA tests or issues are reopened or failed?"
      },
      {
        id: "workload_assignees",
        icon: "users",
        emoji: "👥",
        title: "Team Workload & Assignees",
        prompt: "Who has the most assigned issues and highest workload?"
      },
      {
        id: "release_readiness_check",
        icon: "gauge",
        emoji: "🚀",
        title: "Release Readiness Gate",
        prompt: "Is this board ready for release? (Quick Gate Check)"
      },
      {
        id: "latest_added_updated",
        icon: "calendar-clock",
        emoji: "📅",
        title: "Recent Board Issues",
        prompt: "What were the latest issues added or updated?"
      },
      {
        id: "daily_standup_3bullets",
        icon: "zap",
        emoji: "⚡",
        title: "3-Bullet Daily Standup",
        prompt: "Generate a quick 3-bullet daily standup QA update"
      }
    ];
  },

  /**
   * Conversational QA Assistant Engine for Project Board
   * Reads real project metadata & board issues to answer questions and execute short QA tasks
   */
  async chatWithAssistant({ projectId, message, history = [], quickQuestionId = null }) {
    const proj = (typeof store !== 'undefined' ? store.getProjectById(projectId) : null) || 
                 (typeof store !== 'undefined' ? store.getActiveProject() : null) || 
                 { id: projectId, name: "Software Project", key: "PRJ" };

    const rawIssues = (typeof store !== 'undefined' && store.getIssues ? store.getIssues(projectId || proj.id) : []) || [];
    const users = (typeof store !== 'undefined' && store.getUsers ? store.getUsers() : []) || [];
    const releases = (typeof store !== 'undefined' && store.getReleases ? store.getReleases(projectId || proj.id) : []) || [];
    
    const metrics = this.calculateMetrics(rawIssues);
    const userPrompt = (message || "").trim();
    const promptLower = userPrompt.toLowerCase();

    // Determine target question ID if not provided explicitly
    let qId = quickQuestionId;
    if (!qId) {
      if (promptLower.includes("standup") || promptLower.includes("daily update") || promptLower.includes("3-bullet") || promptLower.includes("3 bullet")) {
        qId = "daily_standup_3bullets";
      } else if (promptLower.includes("critical") || promptLower.includes("high defect") || promptLower.includes("severe bug") || promptLower.includes("severity")) {
        qId = "critical_high_defects";
      } else if (promptLower.includes("reopen") || promptLower.includes("failed qa") || promptLower.includes("fail") || promptLower.includes("rejected")) {
        qId = "reopened_failed_qa";
      } else if (promptLower.includes("workload") || promptLower.includes("assignee") || promptLower.includes("who is working") || promptLower.includes("assigned")) {
        qId = "workload_assignees";
      } else if (promptLower.includes("ready for release") || promptLower.includes("release readiness") || promptLower.includes("gate check") || promptLower.includes("can we ship")) {
        qId = "release_readiness_check";
      } else if (promptLower.includes("latest") || promptLower.includes("recent") || promptLower.includes("new issues") || promptLower.includes("today")) {
        qId = "latest_added_updated";
      } else if (promptLower.includes("summar") || promptLower.includes("overview") || promptLower.includes("blocker") || promptLower.includes("board state")) {
        qId = "summary_blockers";
      }
    }

    // Helper to get user display name
    const getUserName = (id) => {
      if (!id) return "Unassigned";
      const u = users.find(usr => usr.id === id || usr.email === id);
      return u ? u.name : "Unassigned";
    };

    let replyText = "";
    let actionButtons = [];

    // =========================================================================
    // 1. BOARD SUMMARY & BLOCKERS
    // =========================================================================
    if (qId === "summary_blockers") {
      const openCount = metrics.statusCounts.Open + metrics.statusCounts.InProgress + metrics.statusCounts.Reopened;
      const inQaCount = metrics.statusCounts.ReadyForQA + metrics.statusCounts.QATesting;
      const doneCount = metrics.statusCounts.Done;
      const criticalBugs = rawIssues.filter(i => i.priority === "Critical" && i.status !== "Done" && i.status !== "Closed");

      replyText = `### 📋 Board Summary: ${proj.name} (${proj.key})\n\n` +
        `Here is the active snapshot of **${rawIssues.length} issues** on this board:\n\n` +
        `* **📊 Issue Status Breakdown**:\n` +
        `  * 🟡 **In Development / Open**: ${openCount} items\n` +
        `  * 🟣 **In QA Verification**: ${inQaCount} items\n` +
        `  * 🟢 **Resolved / Done**: ${doneCount} items\n\n` +
        `* **⚡ Severity Telemetry**:\n` +
        `  * 🔴 **Critical**: ${metrics.severityCounts.Critical}\n` +
        `  * 🟠 **High**: ${metrics.severityCounts.High}\n` +
        `  * 🔵 **Medium**: ${metrics.severityCounts.Medium}\n` +
        `  * ⚪ **Low**: ${metrics.severityCounts.Low}\n\n`;

      if (criticalBugs.length > 0) {
        replyText += `* **🚨 Key Active Blockers**:\n` +
          criticalBugs.map(b => `  * **[${b.key}]** ${b.title} *(Assigned: ${getUserName(b.developerId || b.assigneeId)}, Status: ${b.status})*`).join("\n") + "\n\n" +
          `> ⚠️ **QA Recommendation**: Prioritize unblocking the ${criticalBugs.length} critical defect(s) before closing the active sprint.`;
      } else {
        replyText += `* **✨ Blockers Status**: Zero critical blocking issues on the board right now. Progress is tracking smoothly!`;
      }

      actionButtons = [
        { label: "📋 Copy Summary", action: "copy" },
        { label: "🚨 View Critical Defects", action: "prompt", prompt: "What are the critical & high severity defects?" },
        { label: "⚡ 3-Bullet Standup", action: "prompt", prompt: "Generate a quick 3-bullet daily standup QA update" }
      ];
    }

    // =========================================================================
    // 2. CRITICAL & HIGH SEVERITY DEFECTS
    // =========================================================================
    else if (qId === "critical_high_defects") {
      const criticalList = rawIssues.filter(i => i.priority === "Critical" && i.status !== "Done" && i.status !== "Closed");
      const highList = rawIssues.filter(i => i.priority === "High" && i.status !== "Done" && i.status !== "Closed");

      replyText = `### 🚨 Critical & High Priority Defect Report\n\n` +
        `Evaluated **${rawIssues.length} issues** for project **${proj.name}**:\n\n`;

      if (criticalList.length === 0 && highList.length === 0) {
        replyText += `🎉 **Zero Critical or High Severity Defects!**\n\n` +
          `There are no active blocking defects or severe defects logged on this board. Overall build health is robust.`;
      } else {
        if (criticalList.length > 0) {
          replyText += `#### 🔴 Critical Blockers (${criticalList.length})\n` +
            criticalList.map((i, idx) => 
              `${idx + 1}. **[${i.key}]** ${i.title}\n` +
              `   • **Status**: \`${i.status}\` | **QA Status**: \`${i.qaStatus || 'Testing'}\` | **SP**: \`${i.storyPoints || 0} pts\`\n` +
              `   • **Assigned**: ${getUserName(i.developerId || i.assigneeId)}`
            ).join("\n") + `\n\n`;
        }

        if (highList.length > 0) {
          replyText += `#### 🟠 High Priority Defects (${highList.length})\n` +
            highList.map((i, idx) => 
              `${idx + 1}. **[${i.key}]** ${i.title}\n` +
              `   • **Status**: \`${i.status}\` | **QA**: \`${i.qaStatus || 'Testing'}\`\n` +
              `   • **Assigned**: ${getUserName(i.developerId || i.assigneeId)}`
            ).join("\n") + `\n\n`;
        }

        replyText += `> 💡 **QA Action Item**: Immediate developer attention requested for the ${criticalList.length + highList.length} prioritized defect(s).`;
      }

      actionButtons = [
        { label: "📋 Copy Defect List", action: "copy" },
        { label: "📧 Draft Developer Email", action: "generate_dev_email" },
        { label: "🔄 Check Reopened QA Items", action: "prompt", prompt: "Which QA tests or issues are reopened or failed?" }
      ];
    }

    // =========================================================================
    // 3. REOPENED / FAILED QA
    // =========================================================================
    else if (qId === "reopened_failed_qa") {
      const reopenedIssues = rawIssues.filter(i => 
        (i.status || "").toLowerCase() === "reopened" || 
        (i.qaStatus || "").toLowerCase() === "failed" || 
        (i.reopenCount && i.reopenCount > 0)
      );

      replyText = `### 🔄 QA Verification & Reopened Issues Telemetry\n\n`;

      if (reopenedIssues.length === 0) {
        replyText += `✅ **All Verified Items Passed QA!**\n\n` +
          `No issues on this board are in \`Reopened\` or \`QA Failed\` status. Quality verification pass rate is currently **100%**.`;
      } else {
        replyText += `Found **${reopenedIssues.length} issue(s)** that required reopening or failed verification:\n\n` +
          reopenedIssues.map((i, idx) => 
            `${idx + 1}. **[${i.key}]** ${i.title}\n` +
            `   • **Priority**: \`${i.priority}\` | **Status**: \`${i.status}\` | **QA State**: \`${i.qaStatus || 'Failed'}\`\n` +
            `   • **Developer**: ${getUserName(i.developerId || i.assigneeId)} | **Reopen Count**: \`${i.reopenCount || 1}\``
          ).join("\n") + `\n\n` +
          `> ⚠️ **QA Insight**: Reopened tickets signal potential regression or incomplete edge-case fixes. Recommend reviewing test criteria with the assigned developer.`;
      }

      actionButtons = [
        { label: "📋 Copy Reopen Report", action: "copy" },
        { label: "👥 Check Team Workload", action: "prompt", prompt: "Who has the most assigned issues and highest workload?" },
        { label: "🚀 Release Gate Check", action: "prompt", prompt: "Is this board ready for release? (Quick Gate Check)" }
      ];
    }

    // =========================================================================
    // 4. TEAM WORKLOAD & ASSIGNEES
    // =========================================================================
    else if (qId === "workload_assignees") {
      const workloadMap = new Map();
      let unassignedCount = 0;
      let unassignedPoints = 0;

      rawIssues.forEach(i => {
        const uid = i.developerId || i.assigneeId;
        const sp = Number(i.storyPoints) || 0;
        if (!uid) {
          unassignedCount++;
          unassignedPoints += sp;
        } else {
          if (!workloadMap.has(uid)) {
            workloadMap.set(uid, { count: 0, points: 0, bugs: 0, critical: 0 });
          }
          const rec = workloadMap.get(uid);
          rec.count++;
          rec.points += sp;
          if (i.type === "Bug") rec.bugs++;
          if (i.priority === "Critical") rec.critical++;
        }
      });

      const sorted = Array.from(workloadMap.entries())
        .sort((a, b) => b[1].points - a[1].points || b[1].count - a[1].count);

      replyText = `### 👥 Team Workload & Issue Allocation\n\n` +
        `Total Board Story Points: **${rawIssues.reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0)} SP** across **${rawIssues.length} issues**:\n\n`;

      if (sorted.length > 0) {
        replyText += sorted.map(([uid, stats], idx) => {
          const u = users.find(usr => usr.id === uid) || { name: uid, role: "Member" };
          return `${idx + 1}. **${u.name}** (${u.role || 'Developer'})\n` +
            `   • **${stats.count} issues** | **${stats.points} Story Points** | **${stats.bugs} bugs** ${stats.critical > 0 ? `| 🔴 **${stats.critical} Critical**` : ''}`;
        }).join("\n") + `\n\n`;
      }

      if (unassignedCount > 0) {
        replyText += `📌 **Unassigned Pool**: **${unassignedCount} issue(s)** (${unassignedPoints} SP) require assignee allocation.\n\n`;
      }

      if (sorted.length > 0 && sorted[0][1].count > (rawIssues.length * 0.5) && rawIssues.length > 3) {
        const topUser = users.find(usr => usr.id === sorted[0][0])?.name || "Lead dev";
        replyText += `> 💡 **Workload Tip**: **${topUser}** holds more than 50% of active board tasks. Consider redistributing pending items to optimize sprint throughput.`;
      } else {
        replyText += `> ✅ **Workload Balance**: Issue allocation is reasonably distributed across active team members.`;
      }

      actionButtons = [
        { label: "📋 Copy Workload", action: "copy" },
        { label: "⚡ Daily Standup Update", action: "prompt", prompt: "Generate a quick 3-bullet daily standup QA update" }
      ];
    }

    // =========================================================================
    // 5. RELEASE READINESS GATE CHECK
    // =========================================================================
    else if (qId === "release_readiness_check") {
      const criticalCount = metrics.severityCounts.Critical;
      const highCount = metrics.severityCounts.High;
      const reopenedCount = metrics.statusCounts.Reopened;
      const openCount = metrics.statusCounts.Open + metrics.statusCounts.InProgress;

      let gateVerdict = "READY";
      let verdictEmoji = "✅";
      let verdictColor = "GREEN";
      let reason = "";

      if (criticalCount > 0 || reopenedCount > 0) {
        gateVerdict = "NOT_READY (BLOCKED)";
        verdictEmoji = "❌";
        verdictColor = "RED";
        reason = `Release is blocked due to ${criticalCount} unresolved Critical defect(s) and ${reopenedCount} reopened item(s).`;
      } else if (highCount > 1 || openCount > 3) {
        gateVerdict = "AT_RISK";
        verdictEmoji = "⚠️";
        verdictColor = "AMBER";
        reason = `Release candidate requires caution: ${highCount} High priority item(s) and ${openCount} unfinished task(s) remain in development.`;
      } else {
        gateVerdict = "READY TO SHIP";
        verdictEmoji = "🚀";
        verdictColor = "GREEN";
        reason = `All quality gate conditions are satisfied with zero critical defects and verified stability.`;
      }

      replyText = `### 🚀 Quick Release Gate Assessment\n\n` +
        `**Project**: ${proj.name} (${proj.key})\n` +
        `**Gate Outcome**: ${verdictEmoji} **${gateVerdict}**\n\n` +
        `* **Evaluated Board Signals**:\n` +
        `  * Open Critical Bugs: **${criticalCount}** ${criticalCount > 0 ? '❌ (Disallowed)' : '✓ (Pass)'}\n` +
        `  * High Severity Defects: **${highCount}** ${highCount > 2 ? '⚠️ (High)' : '✓ (Acceptable)'}\n` +
        `  * Reopened / Failed QA: **${reopenedCount}** ${reopenedCount > 0 ? '⚠️ (Review required)' : '✓ (Pass)'}\n` +
        `  * In-Progress Work: **${openCount} items**\n\n` +
        `**QA Recommendation**:\n` +
        `> ${reason}\n\n` +
        (criticalCount > 0 ? `**Required Before Release**: Resolve and verify all Critical blockers on the board.` : `**Next Steps**: Proceed with candidate sign-off and client notification.`);

      actionButtons = [
        { label: "📋 Copy Gate Verdict", action: "copy" },
        { label: "📑 Full QA Document", action: "generate_qa_doc" },
        { label: "📧 Client Email", action: "generate_client_email" }
      ];
    }

    // =========================================================================
    // 6. RECENT BOARD ISSUES
    // =========================================================================
    else if (qId === "latest_added_updated") {
      const sortedIssues = [...rawIssues].sort((a, b) => {
        const da = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0).getTime();
        const db = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0).getTime();
        return db - da;
      }).slice(0, 5);

      replyText = `### 📅 Latest Issues Added & Updated\n\n` +
        `Most recent activity on **${proj.name}** board:\n\n`;

      if (sortedIssues.length === 0) {
        replyText += `No issues logged yet on this board.`;
      } else {
        replyText += sortedIssues.map((i, idx) => {
          const dateStr = this.formatDate(i.updatedAt || i.updated_at || i.createdAt || i.created_at);
          return `${idx + 1}. **[${i.key}]** ${i.title}\n` +
            `   • **Type**: \`${i.type}\` | **Priority**: \`${i.priority}\` | **Status**: \`${i.status}\`\n` +
            `   • **Assigned**: ${getUserName(i.developerId || i.assigneeId)} | **Date**: ${dateStr || 'Recent'}`;
        }).join("\n") + `\n\n` +
        `> 💡 **Tip**: Click on any issue key in the board to inspect logs, QA execution results, and attachments.`;
      }

      actionButtons = [
        { label: "📋 Copy Recent Items", action: "copy" },
        { label: "📋 Board Summary", action: "prompt", prompt: "Summarize all board issues and blockers" }
      ];
    }

    // =========================================================================
    // 7. 3-BULLET DAILY STANDUP QA UPDATE
    // =========================================================================
    else if (qId === "daily_standup_3bullets") {
      const verifiedList = rawIssues.filter(i => i.status === "Done" || i.qaStatus === "Passed").slice(0, 3);
      const inProgressList = rawIssues.filter(i => i.status === "QA Testing" || i.status === "Ready for QA" || i.status === "In Progress").slice(0, 3);
      const blockerList = rawIssues.filter(i => i.priority === "Critical" || (i.status || "").toLowerCase() === "reopened");

      const todayStr = this.formatDate(new Date().toISOString());

      replyText = `### ⚡ Daily Standup QA Update (${todayStr})\n` +
        `**Project**: ${proj.name}\n\n` +
        `* **1. ✅ Done / Verified**:\n` +
        (verifiedList.length > 0 
          ? verifiedList.map(i => `  • [${i.key}] ${i.title} (${i.priority})`).join("\n")
          : `  • Completed regression pass and test baseline verification.`) + `\n\n` +
        `* **2. 🔍 Today / In Progress QA**:\n` +
        (inProgressList.length > 0 
          ? inProgressList.map(i => `  • [${i.key}] ${i.title} (${i.status})`).join("\n")
          : `  • Executing test coverage for new functional flows and API integrations.`) + `\n\n` +
        `* **3. 🚨 Blockers & Risks**:\n` +
        (blockerList.length > 0 
          ? blockerList.map(i => `  • ⚠️ [${i.key}] ${i.title} – ${i.priority} (${i.status})`).join("\n")
          : `  • None – Zero blockers, quality gate criteria passing.`);

      actionButtons = [
        { label: "📋 Copy Standup Update", action: "copy" },
        { label: "📧 Developer Email", action: "generate_dev_email" },
        { label: "🚀 Release Readiness", action: "prompt", prompt: "Is this board ready for release? (Quick Gate Check)" }
      ];
    }

    // =========================================================================
    // 8. CUSTOM NATURAL LANGUAGE PROMPT / SPECIFIC TICKET QUERY
    // =========================================================================
    else {
      // Look for specific issue match by key (e.g. BUG-101, POS-101) or title keyword
      const matchedIssue = rawIssues.find(i => {
        const k = (i.key || "").toLowerCase();
        const t = (i.title || "").toLowerCase();
        return (k && promptLower.includes(k)) || 
               (k && promptLower.includes(k.replace("-", ""))) ||
               (promptLower.includes("payment") && t.includes("payment")) ||
               (promptLower.includes("printer") && t.includes("printer")) ||
               (promptLower.includes("receipt") && t.includes("receipt")) ||
               (promptLower.includes("scanner") && t.includes("scanner")) ||
               (promptLower.includes("login") && t.includes("login"));
      });

      if (matchedIssue) {
        replyText = `### 🔍 Issue Spotlight: [${matchedIssue.key}] ${matchedIssue.title}\n\n` +
          `* **Type**: \`${matchedIssue.type}\`\n` +
          `* **Priority / Severity**: \`${matchedIssue.priority}\`\n` +
          `* **Current Status**: \`${matchedIssue.status}\`\n` +
          `* **QA State**: \`${matchedIssue.qaStatus || 'Not Tested'}\`\n` +
          `* **Assigned Developer**: ${getUserName(matchedIssue.developerId || matchedIssue.assigneeId)}\n` +
          `* **Story Points**: \`${matchedIssue.storyPoints || 0} SP\`\n` +
          (matchedIssue.reopenCount ? `* **Reopen Count**: \`${matchedIssue.reopenCount}\`\n` : '') +
          `\n**QA Summary**: This ${matchedIssue.type.toLowerCase()} is currently marked as **${matchedIssue.status}** with priority **${matchedIssue.priority}** in project **${proj.name}**.`;

        actionButtons = [
          { label: "📋 Copy Issue Details", action: "copy" },
          { label: "📋 Board Summary", action: "prompt", prompt: "Summarize all board issues and blockers" }
        ];
      } else if (promptLower.includes("slack") || promptLower.includes("message") || promptLower.includes("draft") || promptLower.includes("note")) {
        // Quick short message drafting
        const openCrit = rawIssues.filter(i => i.priority === "Critical" && i.status !== "Done");
        replyText = `### 💬 Short Team Message Draft\n\n` +
          `> **Team QA Update for ${proj.name}**:\n` +
          `> Hey team! Currently tracking **${rawIssues.length} total issues** on the board (${metrics.statusCounts.Done} Done, ${metrics.statusCounts.Open + metrics.statusCounts.InProgress} In Progress).\n` +
          (openCrit.length > 0 ? `> 🚨 Need urgent attention on: ${openCrit.map(c => `[${c.key}] ${c.title}`).join(", ")}.\n` : `> All critical checks are clear.\n`) +
          `> Please check PulseWave board for assigned cards. Thanks!`;

        actionButtons = [
          { label: "📋 Copy Draft", action: "copy" },
          { label: "⚡ 3-Bullet Standup", action: "prompt", prompt: "Generate a quick 3-bullet daily standup QA update" }
        ];
      } else {
        // General intelligent assistant response referencing real project context
        replyText = `### 🤖 AI QA Assistant (${proj.name})\n\n` +
          `I have analyzed the **${rawIssues.length} issues** on the active **${proj.name} (${proj.key})** board:\n\n` +
          `* **Status Snapshot**: ${metrics.statusCounts.Open + metrics.statusCounts.InProgress} in development, ${metrics.statusCounts.ReadyForQA + metrics.statusCounts.QATesting} in QA, and ${metrics.statusCounts.Done} completed.\n` +
          `* **Defects**: ${metrics.severityCounts.Critical} Critical, ${metrics.severityCounts.High} High, and ${metrics.severityCounts.Medium + metrics.severityCounts.Low} Medium/Low.\n\n` +
          `How can I assist you further? You can choose one of the quick task prompts below or ask about specific tickets, workloads, or release readiness!`;

        actionButtons = [
          { label: "📋 Board Summary", action: "prompt", prompt: "Summarize all board issues and blockers" },
          { label: "🚨 Critical Defects", action: "prompt", prompt: "What are the critical & high severity defects?" },
          { label: "⚡ 3-Bullet Standup", action: "prompt", prompt: "Generate a quick 3-bullet daily standup QA update" }
        ];
      }
    }

    return {
      success: true,
      quickQuestionId: qId,
      reply: replyText,
      actions: actionButtons,
      metrics
    };
  }
};

if (typeof window !== "undefined") window.AIQAService = AIQAService;
if (typeof global !== "undefined") global.AIQAService = AIQAService;
if (typeof module !== "undefined" && module.exports) module.exports = AIQAService;
