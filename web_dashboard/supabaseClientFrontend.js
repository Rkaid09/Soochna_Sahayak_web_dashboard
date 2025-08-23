// supabaseClientFrontend.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oxhiauhjqvrcwyzevktu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94aGlhdWhqcXZyY3d5emV2a3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODMwMzYsImV4cCI6MjA3MTI1OTAzNn0.Oci6TcmW0lEIjm3n6zcAvbecDJ3crmyW_-y8KbABSCc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
