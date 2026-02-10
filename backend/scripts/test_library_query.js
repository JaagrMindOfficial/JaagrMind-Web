import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testLibraryQuery() {
  console.log('Testing Library Query (Self-Contained)...');
  
  // 1. Get a user ID (any user)
  const { data: user } = await supabaseAdmin.from('users').select('id').limit(1).single();
  if (!user) {
    console.error('No users found to test with.');
    return;
  }
  const userId = user.id;
  console.log(`Testing with User ID: ${userId}`);

  // 4. Try current implementation (no excerpt, cover_url)
  console.log('\n--- Attempt 4: Current Implementation (no excerpt, cover_url) ---');
  const { data: data4, error: error4 } = await supabaseAdmin
    .from('saved_posts')
    .select(`
        created_at,
        post:posts (
          id,
          title,
          slug,
          cover_url,
          reading_time,
          published_at,
          author:users!author_id (
            id,
            profiles (
              display_name,
              username,
              avatar_url
            )
          )
        )
      `, { count: 'exact' })
    .eq('user_id', userId)
    .limit(1);

  if (error4) {
    console.error('FAILED:', error4.message);
    if (error4.details) console.error('Details:', error4.details);
    if (error4.hint) console.error('Hint:', error4.hint);
  } else {
    console.log('SUCCESS');
    // console.log(JSON.stringify(data4, null, 2));
  }

  // 5. Test getHistory Query
  console.log('\n--- Attempt 5: getHistory Query ---');
  const { data: data5, error: error5 } = await supabaseAdmin
    .from('reading_history')
    .select(`
        last_read_at,
        post:posts (
          id,
          title,
          slug,
          cover_url,
          created_at,
          reading_time,
          published_at,
          author:users!author_id (
            id,
            profiles (
              display_name,
              username,
              avatar_url
            )
          )
        )
      `, { count: 'exact' })
    .eq('user_id', userId)
    .limit(1);

  if (error5) {
    console.error('FAILED:', error5.message);
  } else {
    console.log('SUCCESS');
  }
}

testLibraryQuery();
