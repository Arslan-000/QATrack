const fs = require('fs');
const vm = require('vm');

let appJs = fs.readFileSync('js/app.js', 'utf8');

// Find the start line around 3400
const startPattern = `    if (window.lucide) window.lucide.createIcons();issueId, targetStatus, verdictType, fromBoard) {`;
const endPattern = `    } else if (this.currentView === "all-issues" && typeof AllIssuesView !== 'undefined') {
      AllIssuesView.render(document.getElementById("mainContent"));
    }) {
    let container = document.getElementById("globalModalContainer");`;

if (!appJs.includes(startPattern)) {
  console.error("Could not find start pattern!");
  process.exit(1);
}
if (!appJs.includes(endPattern)) {
  console.error("Could not find end pattern!");
  process.exit(1);
}

const cleanReplacement = `    if (window.lucide) window.lucide.createIcons();
  }

  async submitWorkflowTransitionModal(issueId, targetStatus, verdictType, fromBoard) {
    const buildVersion = document.getElementById("transBuildInput")?.value || "v2.4.1";
    const developerNotes = document.getElementById("transNotesInput")?.value || "";
    const qaNotes = document.getElementById("transNotesInput")?.value || "";
    const failureReason = document.getElementById("transFailureReasonInput")?.value || "";
    const actualResult = document.getElementById("transActualResultInput")?.value || "";
    const expectedResult = document.getElementById("transExpectedResultInput")?.value || "";
    const environment = document.getElementById("transEnvInput")?.value || "Staging";
    const fileInput = document.getElementById("transFileInput");
    const evidenceFile = fileInput?.files?.[0] || null;

    // Validate Required Fields
    if (targetStatus === "Ready for QA" && !developerNotes.trim()) {
      alert("Please provide developer notes describing the fix.");
      return;
    }
    if ((verdictType === "FAIL" || targetStatus === "Reopened") && (!failureReason.trim() || !actualResult.trim())) {
      alert("Please provide both Failure Reason and Actual Result observed.");
      return;
    }

    // Execute transition in store
    if (verdictType === "PASS") {
      await store.recordQaVerificationAttempt(issueId, {
        result: "PASS",
        notes: qaNotes,
        environment,
        buildVersion
      });
    } else if (verdictType === "FAIL" || targetStatus === "Reopened") {
      await store.recordQaVerificationAttempt(issueId, {
        result: "FAIL",
        failureReason,
        expectedResult,
        actualResult,
        notes: qaNotes,
        environment,
        buildVersion
      });
    } else if (verdictType === "BLOCKED") {
      await store.recordQaVerificationAttempt(issueId, {
        result: "BLOCKED",
        failureReason,
        notes: qaNotes,
        environment,
        buildVersion
      });
    } else if (verdictType === "RETEST") {
      await store.recordQaVerificationAttempt(issueId, {
        result: "RETEST",
        notes: qaNotes,
        environment,
        buildVersion
      });
    } else {
      await store.executeWorkflowTransition(issueId, targetStatus, {
        developerNotes,
        buildVersion,
        evidenceFile
      });
    }

    // Upload attachment if any
    if (evidenceFile) {
      await store.uploadIssueAttachment(issueId, {
        fileName: evidenceFile.name,
        fileData: evidenceFile,
        mimeType: evidenceFile.type,
        fileSize: evidenceFile.size,
        isQaEvidence: !!verdictType,
        qaMeta: { environment, buildVersion, result: verdictType || "PASS" }
      });
    }

    // Close Modal
    const modalContainer = document.getElementById("globalModalContainer");
    if (modalContainer) modalContainer.innerHTML = "";

    // Refresh UI
    this.openIssueDetails(issueId);
    if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "all-issues" && typeof AllIssuesView !== 'undefined') {
      AllIssuesView.render(document.getElementById("mainContent"));
    }
  }

  openFilePreviewModal(attachmentId) {
    const attach = (store.data.issueAttachments || []).find(a => a.id === attachmentId);
    if (!attach) return;

    let container = document.getElementById("globalModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalModalContainer";
      document.body.appendChild(container);
    }

    const mime = attach.mime_type || attach.mimeType || "";
    const isImage = mime.includes("image");
    const isVideo = mime.includes("video");

    container.innerHTML = \`
      <div class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick="if(event.target===this) document.getElementById('globalModalContainer').innerHTML=''">
        <div class="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3 flex flex-col max-h-[90vh]">
          
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <span class="font-bold text-slate-900 text-sm truncate">\${attach.file_name || attach.fileName}</span>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-4 min-h-[280px]">
            \${isImage ? \`
              <img src="\${attach.storage_path || ''}" alt="Attachment" class="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f1f5f9%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2212%22 fill=%22%2394a3b8%22>Preview Image</text></svg>';" />
            \` : isVideo ? \`
              <video controls class="max-h-[60vh] max-w-full rounded-lg shadow-md">
                <source src="\${attach.storage_path || ''}" type="\${mime}">
                Your browser does not support video preview.
              </video>
            \` : \`
              <div class="text-center p-8 space-y-2">
                <i data-lucide="file-text" class="w-12 h-12 text-slate-400 mx-auto"></i>
                <span class="font-bold text-slate-800 block">\${attach.file_name || attach.fileName}</span>
                <span class="text-slate-400 text-xs">\${Math.round((attach.file_size || attach.fileSize || 1024) / 1024)} KB</span>
              </div>
            \`}
          </div>

          <div class="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span class="text-slate-400 text-[11px]">Storage: \${attach.storage_path || 'local'}</span>
            <button onclick="window.app.showToast('Download Started', 'Downloading \${attach.file_name || attach.fileName}', 'info')" class="px-4 py-2 bg-slate-950 text-[#bef264] font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Download
            </button>
          </div>

        </div>
      </div>
    \`;

    if (window.lucide) window.lucide.createIcons();
  }

  openLinkWorkItemModal(issueId) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;
    const project = store.getProjectById(issue.projectId || issue.project_id);
    const issues = (store.getIssues(project?.id) || []).filter(i => i.id !== issue.id);

    let container = document.getElementById("globalModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "globalModalContainer";
      document.body.appendChild(container);
    }

    container.innerHTML = \`
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3.5">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 class="text-sm font-bold text-slate-900">Link Work Item to \${issue.key}</h3>
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-700 cursor-pointer"><i data-lucide="x" class="w-4 h-4"></i></button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block font-bold text-slate-700 text-xs mb-1">Relationship Type</label>
              <select id="linkRelType" class="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold">
                <option value="Relates To">Relates To</option>
                <option value="Blocks">Blocks (This blocks target)</option>
                <option value="Blocked By">Blocked By (Target blocks this)</option>
                <option value="Parent">Parent Story</option>
                <option value="Child">Child Subtask</option>
                <option value="Duplicate">Duplicate Of</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 text-xs mb-1">Target Work Item</label>
              <select id="linkTargetIssueId" class="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs">
                \${issues.map(i => \`<option value="\${i.id}">\${i.key} — \${i.title}</option>\`).join("")}
              </select>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button onclick="document.getElementById('globalModalContainer').innerHTML=''" class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
            <button onclick="window.app.submitLinkWorkItem('\${issue.id}')" class="px-4 py-1.5 bg-[#bef264] text-slate-950 font-bold rounded-xl shadow-2xs cursor-pointer">Link Item</button>
          </div>
        </div>
      </div>
    \`;

    if (window.lucide) window.lucide.createIcons();
  }

  async submitLinkWorkItem(issueId) {
    const relType = document.getElementById("linkRelType")?.value || "Relates To";
    const targetId = document.getElementById("linkTargetIssueId")?.value;
    if (targetId) {
      await store.addIssueRelationship(issueId, targetId, relType);
      document.getElementById("globalModalContainer").innerHTML = "";
      this.openIssueDetails(issueId);
    }
  }

  handleWorkflowTransition(issueId, targetStatus) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;

    // Check if this transition requires additional details
    if (targetStatus === 'Ready for QA' || targetStatus === 'Done' || targetStatus === 'Reopened') {
      this.openWorkflowTransitionModal(issueId, targetStatus);
    } else {
      store.updateIssueStatus(issueId, targetStatus);
      this.openIssueDetails(issueId);
      if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
        ProjectWorkspaceView.render(document.getElementById("mainContent"));
      }
    }
  }

  handleUpdateTitle(issueId, newTitle) {
    if (!newTitle.trim()) return;
    store.updateIssue(issueId, { title: newTitle.trim() });
    this.showInlineSaved();
  }

  handleUpdateDescription(issueId, newDesc) {
    store.updateIssue(issueId, { description: newDesc.trim() });
    this.showInlineSaved();
  }

  handleInlineFieldUpdate(issueId, field, val) {
    const update = {};
    update[field] = val;
    store.updateIssue(issueId, update);
    this.showInlineSaved();
  }

  showInlineSaved() {
    const ind = document.getElementById("inlineSaveIndicator");
    if (ind) {
      ind.classList.remove("hidden");
      ind.classList.add("flex");
      setTimeout(() => {
        ind.classList.add("hidden");
        ind.classList.remove("flex");
      }, 1500);
    }
  }

  handleAssignDeveloper(issueId, devId) {
    store.updateIssue(issueId, { developerId: devId, assigneeId: devId });
    this.openIssueDetails(issueId);
  }

  handleAssignQA(issueId, qaId) {
    store.updateIssue(issueId, { qaId });
    this.openIssueDetails(issueId);
  }

  handleUpdateEnvironment(issueId, env) {
    store.updateIssue(issueId, { environment: env });
    this.openIssueDetails(issueId);
  }

  handleUpdatePriority(issueId, priority) {
    store.updateIssue(issueId, { priority });
    this.openIssueDetails(issueId);
  }

  handleUpdateSprint(issueId, sprintId) {
    store.moveIssueToSprint(issueId, sprintId || null);
    this.openIssueDetails(issueId);
  }

  handleToggleAcceptanceCriteria(issueId, index) {
    const issue = store.getIssueById(issueId);
    if (issue && issue.acceptanceCriteria && issue.acceptanceCriteria[index]) {
      issue.acceptanceCriteria[index].done = !issue.acceptanceCriteria[index].done;
      store.saveState();
      this.openIssueDetails(issueId);
    }
  }

  handleAddLabel(issueId) {
    const input = document.getElementById("newLabelInput");
    if (!input || !input.value.trim()) return;
    const issue = store.getIssueById(issueId);
    if (!issue) return;
    if (!issue.labels) issue.labels = [];
    if (!issue.labels.includes(input.value.trim())) {
      issue.labels.push(input.value.trim());
      store.saveState();
      this.openIssueDetails(issueId);
    }
  }

  handleRemoveLabel(issueId, label) {
    const issue = store.getIssueById(issueId);
    if (issue && issue.labels) {
      issue.labels = issue.labels.filter(l => l !== label);
      store.saveState();
      this.openIssueDetails(issueId);
    }
  }

  handleToggleWatcher(issueId) {
    store.toggleIssueWatcher(issueId);
    this.openIssueDetails(issueId);
  }

  handleCopyIssueLink(issueKey) {
    navigator.clipboard?.writeText(window.location.origin + "#" + issueKey);
    this.showToast("Link Copied", \`Copied link for \${issueKey}\`, "success");
  }

  toggleIssueMoreMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById("issueMoreMenuDropdown");
    if (menu) menu.classList.toggle("hidden");
  }

  handleDeleteIssue(issueId) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;
    if (confirm(\`Are you sure you want to delete \${issue.key}? This action is auditable and will archive associated records.\`)) {
      store.data.issues = store.data.issues.filter(i => i.id !== issueId);
      store.saveState();
      this.closeIssueDetails();
      this.showToast("Issue Deleted", \`\${issue.key} was deleted.\`, "info");
      if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
        ProjectWorkspaceView.render(document.getElementById("mainContent"));
      }
    }
  }

  handleCloneIssue(issueId) {
    const issue = store.getIssueById(issueId);
    if (!issue) return;
    store.createIssue({
      ...issue,
      id: null,
      key: null,
      title: \`[Clone] \${issue.title}\`,
      status: "Backlog"
    });
    this.showToast("Issue Cloned", \`Cloned copy of \${issue.key} created in Backlog.\`, "success");
    this.closeIssueDetails();
    if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    }
  }

  handleAddComment(issueId, parentCommentId = null) {
    let text = "";
    if (parentCommentId) {
      const input = document.getElementById(\`replyInput_\${parentCommentId}\`);
      text = input ? input.value : "";
    } else {
      const input = document.getElementById("issueMainCommentInput");
      text = input ? input.value : "";
    }

    if (!text.trim()) return;

    // Detect @mentions in text
    const mentions = [];
    const mentionMatches = text.match(/@([a-zA-Z0-9_-]+)/g);
    if (mentionMatches) {
      const users = store.getUsers();
      mentionMatches.forEach(m => {
        const username = m.substring(1).toLowerCase();
        const found = users.find(u => u.name.toLowerCase().includes(username) || u.email.toLowerCase().includes(username));
        if (found) mentions.push(found.id);
      });
    }

    store.addIssueComment(issueId, { text, parentCommentId, mentions });
    this.openIssueDetails(issueId, "comments");
  }

  handleEditComment(commentId, encodedOldBody) {
    const oldBody = unescape(encodedOldBody);
    const newBody = prompt("Edit your comment:", oldBody);
    if (newBody !== null && newBody.trim() && newBody !== oldBody) {
      store.editIssueComment(commentId, newBody);
      const container = document.getElementById("issueActivityTabsContent");
      if (container) this.renderIssueActivityTabsContent(store.data.issues[0]?.id);
    }
  }

  handleDeleteComment(commentId, issueId) {
    if (confirm("Delete this comment?")) {
      store.deleteIssueComment(commentId);
      this.openIssueDetails(issueId, "comments");
    }
  }

  toggleReplyBox(commentId) {
    const box = document.getElementById(\`replyBox_\${commentId}\`);
    if (box) box.classList.toggle("hidden");
  }

  toggleReactionPicker(commentId) {
    const picker = document.getElementById(\`reactionPicker_\${commentId}\`);
    if (picker) picker.classList.toggle("hidden");
  }

  handleReaction(commentId, reaction, issueId) {
    store.toggleCommentReaction(commentId, reaction);
    this.openIssueDetails(issueId, "comments");
  }

  insertMention(issueId) {
    const input = document.getElementById("issueMainCommentInput");
    if (!input) return;
    const project = store.getProjectById(store.getIssueById(issueId)?.projectId);
    const members = project ? (store.getProjectMembers ? store.getProjectMembers(project.id) : store.getUsers()) : store.getUsers();
    if (members.length > 0) {
      const first = members[0].name.split(" ")[0];
      input.value += \` @\${first} \`;
      input.focus();
    }
  }

  handleCommentFileUpload(issueId, fileInput) {
    const file = fileInput?.files?.[0];
    if (file) {
      store.uploadIssueAttachment(issueId, {
        fileName: file.name,
        fileData: file,
        mimeType: file.type,
        fileSize: file.size,
        isQaEvidence: false
      });
      this.showToast("Attachment Uploaded", \`\${file.name} uploaded\`, "success");
      this.openIssueDetails(issueId, "comments");
    }
  }

  handleEvidenceFileUpload(issueId, fileInput) {
    const file = fileInput?.files?.[0];
    if (file) {
      store.uploadIssueAttachment(issueId, {
        fileName: file.name,
        fileData: file,
        mimeType: file.type,
        fileSize: file.size,
        isQaEvidence: false
      });
      this.showToast("File Uploaded", \`\${file.name} attached to issue.\`, "success");
      this.openIssueDetails(issueId, "evidence");
    }
  }

  handleQaEvidenceUpload(issueId, fileInput) {
    const file = fileInput?.files?.[0];
    if (file) {
      const issue = store.getIssueById(issueId);
      store.uploadIssueAttachment(issueId, {
        fileName: file.name,
        fileData: file,
        mimeType: file.type,
        fileSize: file.size,
        isQaEvidence: true,
        qaMeta: {
          environment: issue?.environment || "Staging",
          buildVersion: issue?.buildVersion || "v2.4.1",
          result: issue?.qaStatus || "PASS"
        }
      });
      this.showToast("Evidence Uploaded", \`\${file.name} recorded as QA evidence.\`, "success");
      this.openIssueDetails(issueId, "evidence");
    }
  }

  handleDeleteAttachment(attachmentId, issueId) {
    if (confirm("Delete this attachment?")) {
      store.deleteIssueAttachment(attachmentId);
      this.openIssueDetails(issueId, "evidence");
    }
  }

  handleAddChecklist(issueId) {
    const title = prompt("Enter Checklist Title:", "QA Verification Steps");
    if (title && title.trim()) {
      store.addIssueChecklist(issueId, title.trim());
      this.openIssueDetails(issueId);
    }
  }

  handleAddChecklistItem(checklistId, issueId) {
    const input = document.getElementById(\`newChecklistItemInput_\${checklistId}\`);
    if (input && input.value.trim()) {
      store.addChecklistItem(checklistId, input.value.trim());
      this.openIssueDetails(issueId);
    }
  }

  handleToggleChecklistItem(itemId, issueId) {
    store.toggleChecklistItem(itemId);
    this.openIssueDetails(issueId);
  }

  handleDeleteChecklistItem(itemId, issueId) {
    store.deleteChecklistItem(itemId);
    this.openIssueDetails(issueId);
  }

  handleRemoveRelationship(relId, issueId) {
    store.removeIssueRelationship(relId);
    this.openIssueDetails(issueId);
  }

  closeIssueDetails() {
    const container = document.getElementById("globalDrawerContainer");
    if (container) container.innerHTML = "";
  }

  async handleQuickStatusChange(issueId, newStatus) {
    await store.updateIssueStatus(issueId, newStatus);
    this.openIssueDetails(issueId);
    if (this.currentView === "project-workspace" && typeof ProjectWorkspaceView !== 'undefined') {
      ProjectWorkspaceView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "backlog-sprints" && typeof BacklogSprintsView !== 'undefined') {
      BacklogSprintsView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "my-issues" && typeof MyIssuesView !== 'undefined') {
      MyIssuesView.render(document.getElementById("mainContent"));
    } else if (this.currentView === "all-issues" && typeof AllIssuesView !== 'undefined') {
      AllIssuesView.render(document.getElementById("mainContent"));
    }
  }

  openWorkflowGuideModal() {
    let container = document.getElementById("globalModalContainer");`;

const startIdx = appJs.indexOf(startPattern);
const endIdx = appJs.indexOf(endPattern) + endPattern.length;

const before = appJs.substring(0, startIdx);
const after = appJs.substring(endIdx);

const updated = before + cleanReplacement + after;

try {
  new vm.Script(updated, { filename: 'js/app.js' });
  console.log("✓ SUCCESS: New js/app.js parsed cleanly without syntax errors!");
  fs.writeFileSync('js/app.js', updated, 'utf8');
  console.log("✓ js/app.js saved successfully!");
} catch (e) {
  console.error("✗ Syntax Error in updated code:", e);
}
