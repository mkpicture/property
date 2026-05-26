// scripts/reset_db.js
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

/** Ensure helper function exists to list user tables */
async function ensureGetTablesFunction() {
  const sql = `
    create or replace function public.get_user_tables()
    returns setof text
    language sql
    security definer
    as $$
      select tablename from pg_tables where schemaname = 'public';
    $$;
  `;
  const { error } = await supabase.rpc('execute_sql', { sql });
  if (error && !error.message.includes('already exists')) {
    console.error('⚠️ Could not create get_user_tables function:', error);
    process.exit(1);
  }
}

/** Truncate all user tables */
async function truncateAllTables() {
  // Get list of tables via the helper function
  const { data: tables, error: listErr } = await supabase.rpc('get_user_tables');
  if (listErr) {
    console.error('❌ Unable to fetch table list:', listErr);
    process.exit(1);
  }

  for (const tableName of tables) {
    // Skip internal Supabase tables (auth, storage, pg_*)
    if (tableName.startsWith('pg_') || tableName.startsWith('auth.') || tableName.startsWith('storage.')) continue;
    const { error: truncErr } = await supabase.rpc('execute_sql', { sql: `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;` });
    if (truncErr) {
      console.error(`⚠️  Could not truncate ${tableName}:`, truncErr);
    } else {
      console.log(`✅  Table ${tableName} truncated`);
    }
  }
}

(async () => {
  console.log('🛠️  Ensuring helper function exists…');
  await ensureGetTablesFunction();
  console.log('🚀  Starting full Supabase reset…');
  await truncateAllTables();
  console.log('🎉  Supabase database reset complete.');
})();
