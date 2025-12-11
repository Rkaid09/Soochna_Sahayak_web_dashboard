import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://oxhiauhjqvrcwyzevktu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94aGlhdWhqcXZyY3d5emV2a3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODMwMzYsImV4cCI6MjA3MTI1OTAzNn0.Oci6TcmW0lEIjm3n6zcAvbecDJ3crmyW_-y8KbABSCc';


const supabase = createClient(supabaseUrl, supabaseAnonKey);

const form = document.getElementById('signupForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  messageDiv.textContent = '';
  messageDiv.style.color = 'red';

  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  if (!email || !password || !confirmPassword) {
    messageDiv.textContent = 'Please fill in all required fields.';
    return;
  }

  if (password.length < 6) {
    messageDiv.textContent = 'Password must be at least 6 characters.';
    return;
  }

  if (password !== confirmPassword) {
    messageDiv.textContent = 'Passwords do not match.';
    return;
  }

  // Call Supabase signUp method
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    messageDiv.textContent = error.message;
    return;
  }

  if (data) {
    // Show success message
    messageDiv.style.color = 'green';
    messageDiv.textContent =
      'Signup successful! Please check your email to confirm the account. Redirecting to login...';

    // Clear form inputs
    form.reset();

    // Redirect to login page after short delay
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 3000);
  }
});
