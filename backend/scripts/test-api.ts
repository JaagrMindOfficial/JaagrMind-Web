
import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase';

async function testApi() {
  console.log('Testing API /library/saved...');
  const API_URL = process.env.FRONTEND_URL ? 'http://localhost:4000/api' : 'http://localhost:4000/api';

  // 1. Create/Get User
  const email = 'test_api_123@jaagrmind.com';
  const password = 'Password123!';
  
  // Try sign in
  let { data: auth, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
      console.log('Sign in failed, trying sign up...');
      const { data: signUp, error: signUpError } = await supabaseAdmin.auth.signUp({
          email,
          password,
      });
      if (signUpError) {
          console.error('Sign up failed:', signUpError.message);
          return;
      }
      // @ts-ignore
      auth = signUp;
      if (!auth.session) {
          console.log('Sign up successful but need to confirm email or auto-confirm is off.');
          // Try to sign in immediately after signup (if auto confirm is on)
           const { data: signInRetry, error: retryError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
          });
          if (retryError || !signInRetry.session) {
             console.error('Could not get session even after signup. Auto-confirm might be off.');
             return;
          }
          auth = signInRetry;
      }
  }

  if (!auth.session) {
      console.error('No session obtained. Cannot test API.');
      return;
  }

  const token = auth.session.access_token;
  console.log('Got access token (length):', token.length);

  // 2. Find a post to save
  const { data: posts } = await supabaseAdmin.from('posts').select('id').limit(1);
  if (!posts || posts.length === 0) {
      console.error('No posts found to save.');
      return;
  }
  const postId = posts[0].id;
  console.log('Target Post ID:', postId);

  // 3. Call API
  console.log('Sending POST /library/saved...');
  try {
      // Need fetch relative? No, absolute.
      const res = await fetch(`${API_URL}/library/saved`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ postId })
      });

      console.log('Response Status:', res.status);
      const text = await res.text();
      console.log('Response Body:', text);
  } catch (err) {
      console.error('Fetch error:', err);
  }
}

testApi();
