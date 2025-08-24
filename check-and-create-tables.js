#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Supabase configuration...');
console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Anon Key:', supabaseKey ? '✅ Found' : '❌ Missing');
console.log('Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl) {
  console.error('\n❌ Missing EXPO_PUBLIC_SUPABASE_URL in environment variables');
  console.log('Please add it to your .env file');
  process.exit(1);
}

if (!supabaseKey && !supabaseServiceKey) {
  console.error('\n❌ Missing both EXPO_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');
  console.log('Please add at least one to your .env file');
  process.exit(1);
}

// Use service key if available, otherwise anon key
const keyToUse = supabaseServiceKey || supabaseKey;
const supabase = createClient(supabaseUrl, keyToUse);

async function checkExistingTables() {
  console.log('\n🔍 Checking existing tables...');
  
  try {
    // Try to get tables using a direct SQL query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });

    if (error) {
      console.log('❌ Error getting tables via RPC:', error.message);
      
      // Try alternative method
      console.log('🔄 Trying alternative method...');
      const { data: altData, error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (altError) {
        console.log('❌ Alternative method also failed:', altError.message);
        return null;
      } else {
        console.log('✅ Found tables via alternative method:', altData.map(t => t.table_name));
        return altData.map(t => t.table_name);
      }
    } else {
      const tableNames = data.map(row => row.table_name);
      console.log('✅ Existing tables:', tableNames);
      return tableNames;
    }
  } catch (err) {
    console.log('❌ Error checking tables:', err.message);
    return null;
  }
}

async function createNewTables() {
  console.log('\n🚀 Creating new tables...');
  
  const newTables = [
    'user_saved_resources',
    'user_activity_log', 
    'user_progress_stats',
    'daily_tips',
    'milestone_templates',
    'user_milestone_progress'
  ];

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-resources-enhancement-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executing schema...');
    
    // Try to execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.log('❌ Error executing schema:', error.message);
      console.log('\n💡 You may need to:');
      console.log('1. Use the service role key instead of anon key');
      console.log('2. Execute the SQL manually in Supabase dashboard');
      console.log('3. Check your database permissions');
      return false;
    } else {
      console.log('✅ Schema executed successfully!');
      console.log('\n📋 New tables should be created:');
      newTables.forEach(table => console.log(`   ✅ ${table}`));
      return true;
    }
  } catch (err) {
    console.log('❌ Error creating tables:', err.message);
    return false;
  }
}

async function verifyNewTables() {
  console.log('\n🔍 Verifying new tables were created...');
  
  const newTables = [
    'user_saved_resources',
    'user_activity_log', 
    'user_progress_stats',
    'daily_tips',
    'milestone_templates',
    'user_milestone_progress'
  ];

  const existingTables = await checkExistingTables();
  
  if (!existingTables) {
    console.log('❌ Could not verify tables');
    return;
  }

  console.log('\n📊 Verification Results:');
  newTables.forEach(table => {
    const exists = existingTables.includes(table);
    console.log(`   ${exists ? '✅' : '❌'} ${table}`);
  });
}

async function main() {
  console.log('🗄️  Resources & Tips Database Setup\n');
  
  // Step 1: Check existing tables
  const existingTables = await checkExistingTables();
  
  // Step 2: Create new tables
  const success = await createNewTables();
  
  if (success) {
    // Step 3: Verify new tables
    await verifyNewTables();
    console.log('\n🎉 Database setup completed successfully!');
  } else {
    console.log('\n❌ Database setup failed. Please check the errors above.');
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of create-resources-enhancement-tables.sql');
    console.log('4. Click "Run" to execute the schema');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkExistingTables, createNewTables, verifyNewTables };
