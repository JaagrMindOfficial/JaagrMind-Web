
import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase';

async function checkFollows() {
  const userId = '7690a8af-8f8e-4c7a-8c20-26efe968f927'; // nitish_bhambu
  
  console.log('Checking follows for user:', userId);
  
  // 1. Check Follows Table (Select All)
  const { data: follows, error } = await supabaseAdmin
    .from('follows')
    .select('*')
    .eq('following_id', userId);
    
  if (error) {
    console.error('Error fetching follows:', error);
  } else {
    console.log('Follows found (length):', follows?.length);
    console.log('Follow records:', follows);
  }

  // 3. Test Repository Logic (Corrected Count)
  const { count: countCorrected, error: countCombError } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);
    
  if (countCombError) {
    console.error('Error fetching count (corrected):', countCombError);
  } else {
    console.log('Count (corrected):', countCorrected);
  }
}

checkFollows();
