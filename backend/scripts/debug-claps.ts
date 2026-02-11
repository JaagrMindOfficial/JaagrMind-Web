
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('--- checking clap consistency ---');

  // get posts with their stored claps_count
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, title, slug, claps_count')
    .limit(20);

  if (postsError) {
    console.error('error fetching posts:', postsError);
    return;
  }

  console.log(`found ${posts.length} posts. checking consistency...`);

  for (const post of posts) {
    // calculate actual sum from claps table
    const { data: claps, error: clapsError } = await supabase
      .from('claps')
      .select('count, user_id, session_id')
      .eq('post_id', post.id);

    if (clapsError) {
      console.error(`error fetching claps for post ${post.title}:`, clapsError);
      continue;
    }

    const actualSum = claps.reduce((sum, c) => sum + (c.count || 0), 0);
    const storedCount = post.claps_count || 0;

    const discrepancy = actualSum - storedCount;
    const status = discrepancy === 0 ? 'OK' : `MISMATCH (${discrepancy > 0 ? '+' : ''}${discrepancy})`;

    console.log(`[${status}] "${post.title.substring(0, 30)}...": stored=${storedCount}, actual=${actualSum}`);

    if (discrepancy !== 0) {
      console.log(`   > details: ${claps.length} clap rows found.`);
      claps.forEach(c => console.log(`     - user:${c.user_id} session:${c.session_id} count:${c.count}`));
    }
  }

  console.log('--- check complete ---');
}

main().catch(console.error);
