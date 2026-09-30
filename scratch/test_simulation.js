global.INITIAL_DATA = { workspaces: [], projects: [], users: [] };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const store = require('../js/store.js');

async function testSimulation() {
  console.log("--- STARTING TEST ---");
  
  // 1. Simulate Supabase data loading
  const spaces = [
    {
      id: "ws_1790720498081",
      name: "Logo Workspace",
      slug: "logo-workspace",
      company_name: "Logo Corp",
      workspace_type: "Software Company",
      owner_id: "d79e9e9e-8794-4677-a91c-7b99f31cbc0b",
      created_by: "arslandeveloper482@gmail.com"
    }
  ];
  
  const workspaceMembers = [
    {
      id: "wm_ws_1790720498081_d79e9e9e-8794-4677-a91c-7b99f31cbc0b",
      workspace_id: "ws_1790720498081",
      user_id: "d79e9e9e-8794-4677-a91c-7b99f31cbc0b",
      name: "Arslan Munir",
      email: "arslandeveloper482@gmail.com",
      role: "OWNER"
    },
    {
      id: "wm_ws_1790720498081_arslansqa",
      workspace_id: "ws_1790720498081",
      user_id: null,
      name: "Arslan QA",
      email: "arslansqa482@gmail.com",
      role: "QA_ENGINEER"
    }
  ];

  const projects = [
    {
      id: "prj_1790720548098",
      workspace_id: "ws_1790720498081",
      key: "LOGO",
      name: "Logo",
      pm_id: "Arslan Munir"
    }
  ];

  const projectMembers = [
    {
      id: "pm_prj_1790720548098_d79e9e9e-8794-4677-a91c-7b99f31cbc0b",
      project_id: "prj_1790720548098",
      user_id: "d79e9e9e-8794-4677-a91c-7b99f31cbc0b",
      email: "arslandeveloper482@gmail.com",
      role: "PROJECT_MANAGER"
    },
    {
      id: "pm_prj_arslansqa",
      project_id: "prj_1790720548098",
      user_id: null,
      email: "arslansqa482@gmail.com",
      role: "QA_ENGINEER"
    }
  ];

  store.data.workspaces = spaces;
  store.data.workspaceMembers = workspaceMembers;
  store.data.projects = projects;
  store.data.projectMembers = projectMembers;

  // 2. Set active user as arslansqa482@gmail.com
  const qaUser = {
    id: "usr_qa_12345",
    supabase_id: "usr_qa_12345",
    name: "Arslan QA",
    email: "arslansqa482@gmail.com",
    role: "QA_ENGINEER"
  };
  store.data.users = [qaUser];
  store.data.activeUserId = qaUser.id;

  console.log("Active User:", store.getActiveUser());
  const userSpaces = store.getWorkspaces(qaUser.id);
  console.log("User Spaces:", userSpaces.length, userSpaces.map(s => s.name));
  
  const spaceRole = store.getUserSpaceRole(userSpaces[0]?.id, qaUser.id);
  console.log("Space Role:", spaceRole);
  
  const projectRole = store.getUserProjectRole("prj_1790720548098", qaUser.id);
  console.log("Project Role:", projectRole);

  const canCreatePrj = store.canCreateProject("prj_1790720548098", qaUser.id);
  console.log("Can Create Project:", canCreatePrj);

  const canCreateWs = store.canCreateWorkspace(qaUser.id);
  console.log("Can Create Workspace:", canCreateWs);

  const canDeletePrj = store.canDeleteProject("prj_1790720548098", qaUser.id);
  console.log("Can Delete Project:", canDeletePrj);

  const canDeleteWs = store.canDeleteWorkspace(userSpaces[0]?.id, qaUser.id);
  console.log("Can Delete Workspace:", canDeleteWs);

  const canManageTeam = store.canManageWorkspaceTeam(userSpaces[0]?.id, qaUser.id);
  console.log("Can Manage Workspace Team (remove member):", canManageTeam);

  console.log("--- TEST FINISHED ---");
}

testSimulation();
