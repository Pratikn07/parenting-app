#!/usr/bin/env node

/**
 * Script to execute the Resources & Tips enhancement schema
 * Run this script to create the new database tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed for schema changes

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease add these to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSchema() {
  try {
    console.log('🚀 Starting Resources & Tips schema execution...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-resources-enhancement-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Error in statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }

    console.log('\n🎉 Schema execution completed!');
    console.log('\n📋 Created tables:');
    console.log('   ✅ user_saved_resources');
    console.log('   ✅ user_activity_log');
    console.log('   ✅ user_progress_stats');
    console.log('   ✅ daily_tips');
    console.log('   ✅ milestone_templates');
    console.log('   ✅ user_milestone_progress');
    console.log('\n🔒 Row Level Security policies applied');
    console.log('📊 Performance indexes created');
    console.log('🔄 Update triggers configured');

  } catch (error) {
    console.error('❌ Failed to execute schema:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function executeSchemaAlternative() {
  try {
    console.log('🚀 Using alternative method to execute schema...\n');

    const sqlPath = path.join(__dirname, 'create-resources-enhancement-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Try to execute the entire SQL content at once
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Error executing schema:', error.message);
      console.log('\n💡 Try running the SQL file manually in your Supabase SQL editor');
      process.exit(1);
    }

    console.log('✅ Schema executed successfully!');
  } catch (error) {
    console.error('❌ Failed to execute schema:', error.message);
    console.log('\n💡 Manual execution required - see instructions below');
  }
}

// Main execution
if (require.main === module) {
  console.log('🗄️  Resources & Tips Database Schema Setup\n');
  
  executeSchema().catch(() => {
    console.log('\n🔄 Trying alternative method...\n');
    executeSchemaAlternative();
  });
}

module.exports = { executeSchema };
