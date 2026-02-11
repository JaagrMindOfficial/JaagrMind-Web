
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl);
  console.log('Key length:', supabaseServiceKey.length);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCounts() {
  console.log('Checking saved_posts counts...');

  // Get all users who have saved posts
  const { data: users, error: userError } = await supabase
    .from('saved_posts')
    .select('user_id')
    .limit(10);

  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No saved posts found in the database for ANY user.');
    return;
  }

  // Check unique users
  const uniqueUsers = [...new Set(users.map(u => u.user_id))];
  console.log(`Found ${uniqueUsers.length} users with saved posts.`);

  for (const userId of uniqueUsers) {
      console.log(`Checking stats for user: ${userId}`);

      const { count, error } = await supabase
        .from('saved_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error counting saved_posts:', error);
      } else {
        console.log(`Supabase count for user ${userId}: ${count}`);
      }
      
      // Also check if we can actually see the rows
       const { data: rows } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', userId);
        
       console.log(`Actual rows visible: ${rows?.length}`);
  }
}

checkCounts();
