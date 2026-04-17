require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function format() {
  const email = 'phamthanhloc92vn@gmail.com';
  console.log(`Deleting tasks for assignee: ${email}`);

  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('assignee', email);

  if (error) {
    console.error('Error deleting tasks:', error.message);
  } else {
    console.log('Success deleting tasks.');
  }
}

format();
