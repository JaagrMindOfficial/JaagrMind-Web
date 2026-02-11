
import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase';

async function verifyTopics() {
  console.log('Verifying topics hierarchy...');
  
  const { data: topics, error } = await supabaseAdmin
    .from('topics')
    .select('*');

  if (error) {
      console.error('Error fetching topics:', error);
      return;
  }

  console.log(`Fetched ${topics.length} topics.`);
  
  const roots = topics.filter(t => !t.parent_id);
  const children = topics.filter(t => t.parent_id);
  
  console.log(`Root topics: ${roots.length}`);
  roots.forEach(r => console.log(`- ${r.name} (Level ${r.level})`));
  
  console.log(`Child topics: ${children.length}`);
  children.forEach(c => {
      const parent = topics.find(t => t.id === c.parent_id);
      console.log(`- ${c.name} (Level ${c.level}) -> Parent: ${parent?.name}`);
  });
}

verifyTopics();
