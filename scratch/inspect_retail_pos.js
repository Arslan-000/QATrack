const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wbtvsishoufterznmfot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidHZzaXNob3VmdGVyem5tZm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MDE2ODYsImV4cCI6MjEwMzQ3NzY4Nn0.oSQHzLgiaZqI3FzsbDpo02r3ukjvHfVc9s1x_SkQBHM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
  console.log('--- Querying Supabase ---');
  
  // Projects
  const { data: projects, error: pErr } = await supabase.from('projects').select('*');
  if (pErr) console.error('Projects err:', pErr);
  else {
    console.log(`Found ${projects.length} projects:`);
    projects.forEach(p => console.log(`  Project: id=${p.id}, key=${p.key}, name="${p.name}", space_id=${p.space_id || p.workspace_id}`));
  }

  // Issues
  const { data: issues, error: iErr } = await supabase.from('issues').select('*');
  if (iErr) console.error('Issues err:', iErr);
  else {
    console.log(`\nFound ${issues.length} issues in Supabase:`);
    issues.forEach(i => {
      console.log(`  Issue: id=${i.id}, key=${i.key}, title="${i.title}", priority=${i.priority}, status="${i.status}", type="${i.type}", project_id=${i.project_id}, sprint_id=${i.sprint_id}`);
    });
  }

  // Sprints
  const { data: sprints, error: sErr } = await supabase.from('sprints').select('*');
  if (sErr) console.error('Sprints err:', sErr);
  else {
    console.log(`\nFound ${sprints.length} sprints in Supabase:`);
    sprints.forEach(s => {
      console.log(`  Sprint: id=${s.id}, name="${s.name || s.title}", project_id=${s.project_id}, status=${s.status}`);
    });
  }
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
