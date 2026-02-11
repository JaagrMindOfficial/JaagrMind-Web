
import { libraryRepository } from '../src/repositories/library';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function debugHistory() {
  console.log('--- Debugging Library History 500 Error ---');
  
  // Replace with a valid user ID and post ID from your database
  const userId = 'd0c946e3-549c-4613-9092-28df95c4644a'; 
  const postId = '14ad6621-0818-4903-9993-41d3e8e16200'; // Example post ID

  try {
    console.log(`Attempting to add to history: User ${userId}, Post ${postId}`);
    await libraryRepository.addToHistory(userId, postId);
    console.log('Success: Added to history');
  } catch (error) {
    console.error('Error adding to history:', error);
  }
}

debugHistory().catch(console.error);
