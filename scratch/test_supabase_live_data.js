const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wbtvsishoufterznmfot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidHZzaXNob3VmdGVyem5tZm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MDE2ODYsImV4cCI6MjEwMzQ3NzY4Nn0.oSQHzLgiaZqI3FzsbDpo02r3ukjvHfVc9s1x_SkQBHM';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
  console.log("Checking Supabase tables...");
  
  const tables = ['spaces', 'workspace_members', 'workspace_invitations', 'projects', 'project_members', 'project_invitations', 'profiles'];
  
  for (const t of tables) {
    try {
      const { data, error } = await sb.from(t).select('*');
      if (error) {
        console.log(`Table [${t}] Error:`, error.message);
      } else {
        console.log(`Table [${t}] Count:`, data.length);
        if (data.length > 0) {
          console.log(`  Sample [${t}]:`, JSON.stringify(data.slice(0, 3), null, 2));
        }
      }
    } catch (e) {
      console.log(`Table [${t}] Exception:`, e.message);
    }
  }
}

checkData();
