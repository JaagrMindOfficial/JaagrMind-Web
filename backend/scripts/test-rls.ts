
import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase';

async function test() {
  console.log('Testing supabaseAdmin RLS bypass...');
  
  // 1. Check if we have a service key (simple check)
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  console.log('Service Key length:', key.length);
  if (key.length < 10) {
      console.error('Service Key seems missing or too short');
  }

  // 2. Try to fetch users (usually restricted to service role)
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (userError) {
      console.error('Error fetching users (Auth Admin):', userError.message);
  } else {
      console.log('Successfully fetched users count:', users.users.length);
  }

  // 3. Try to insert a saved post (RLS check)
  // We need a valid user and post.
  // We'll just try to select from saved_posts without filtering user_id, which regular users can't do (usually).
  
  const { data: saved, error: savedError } = await supabaseAdmin.from('saved_posts').select('*').limit(1);
  if (savedError) {
      console.error('Error selecting saved_posts:', savedError.message);
      console.error('Full Error:', savedError);
  } else {
      console.log('Successfully selected saved_posts (Arbitrary):', saved?.length);
  }
}

test().catch(console.error);
