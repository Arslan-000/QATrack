/**
 * PulseWave — Node.js Supabase Tables Cleaner
 * Cleans public database tables and clears local storage / mock state.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wbtvsishoufterznmfot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidHZzaXNob3VmdGVyem5tZm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MDE2ODYsImV4cCI6MjEwMzQ3NzY4Nn0.oSQHzLgiaZqI3FzsbDpo02r3ukjvHfVc9s1x_SkQBHM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanPublicTables() {
  console.log('🧹 Starting public database tables cleanup...');
  
  const tables = [
    'chat_message_links',
    'chat_message_attachments',
    'chat_message_mentions',
    'chat_message_reactions',
    'chat_messages',
    'chat_conversation_members',
    'chat_conversations',
    'documents',
    'ai_email_logs',
    'ai_generations',
    'release_issue_links',
    'release_decisions',
    'project_quality_settings',
    'release_risk_factors',
    'release_quality_assessments',
    'releases',
    'test_reports',
    'test_results',
    'test_runs',
    'test_suites',
    'test_issue_links',
    'test_executions',
    'test_cases',
    'sprints',
    'issues',
    'project_invitations',
    'project_members',
    'projects',
    'workspace_invitations',
    'workspace_members',
    'spaces',
    'profiles'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().neq('id', '___non_existent_key___');
      if (error) {
        console.log(`⚠️  Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: Cleaned`);
      }
    } catch (e) {
      console.log(`Notice for ${table}:`, e.message);
    }
  }

  console.log('✨ Cleanup execution finished.');
  console.log('👉 To wipe all Supabase Authentication Accounts (auth.users), run the SQL in supabase_reset_all_data.sql in Supabase SQL Editor.');
}

cleanPublicTables();
