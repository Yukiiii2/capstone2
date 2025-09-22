import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztlkzuslrokawaplrmnd.supabase.co';  // Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bGt6dXNscm9rYXdhcGxybW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDgxNDcsImV4cCI6MjA2OTk4NDE0N30.232TtQIl00U-XdqMv3sJi8AUy3tjwMx5sgsWMlpHVoU';  // Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);