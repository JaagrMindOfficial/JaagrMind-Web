
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('--- Syncing Stats ---');

  // 1. Sync Claps
  console.log('Syncing claps_count...');
  const { error: clapsError } = await supabase.rpc('sync_claps_count');
  
  if (clapsError) {
      // Fallback to raw SQL if RPC doesn't exist (can't run raw SQL via JS client easily without RLS bypass or RPC)
      // Actually we can't run raw SQL update across table via client unless we use a function.
      // But we can iterate and update.
      console.log('RPC failed, trying iterative update...');
      await iterativeSync();
  } else {
      console.log('Claps synced via RPC.');
  }

  console.log('--- Sync Compelte ---');
}

async function iterativeSync() {
    // Get all posts
    const { data: posts } = await supabase.from('posts').select('id');
    if (!posts) return;

    for (const p of posts) {
        // Claps
        const { data: claps } = await supabase.from('claps').select('count').eq('post_id', p.id);
        const clapCount = claps?.reduce((sum, c) => sum + (c.count || 0), 0) || 0;

        // Comments
        const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', p.id).is('deleted_at', null);

        // Views
        const { count: viewCount } = await supabase.from('post_views').select('*', { count: 'exact', head: true }).eq('post_id', p.id);

        // Update
        await supabase.from('posts').update({
            claps_count: clapCount,
            comments_count: commentCount || 0,
            view_count: viewCount || 0
        }).eq('id', p.id);
        
        process.stdout.write('.');
    }
    console.log('\nDone.');
}

main().catch(console.error);
