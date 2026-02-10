import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Recreate the function with strict security settings and search_path
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles 
    SET following_count = COALESCE(following_count, 0) + 1 
    WHERE user_id = NEW.follower_id;

    UPDATE profiles 
    SET followers_count = COALESCE(followers_count, 0) + 1 
    WHERE user_id = NEW.following_id;
    
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles 
    SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) 
    WHERE user_id = OLD.follower_id;

    UPDATE profiles 
    SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) 
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_follow_change ON follows;
CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();
`;

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Applying fix...');
    await client.query(sql);
    
    console.log('✅ Fix applied successfully!');
  } catch (err) {
    console.error('❌ Error applying fix:', err);
  } finally {
    await client.end();
  }
}

run();
