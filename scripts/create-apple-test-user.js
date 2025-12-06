const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually since we can't rely on dotenv being installed/configured for this script
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const envinterp = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes
        envinterp[key] = value;
    }
});

const supabaseUrl = envinterp.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envinterp.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Could not find EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestUser() {
    const email = 'test@example.com';
    const password = 'TestPassword123!';

    console.log(`Creating user: ${email}...`);

    // Check if user already exists first
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log('⚠️ User already exists. Updating password...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password, email_confirm: true }
        );

        if (updateError) {
            console.error('❌ Error updating user:', updateError.message);
        } else {
            console.log('✅ User updated successfully!');
        }
    } else {
        // Create new user
        const { data, error } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true // Auto-confirm the email so they can login immediately
        });

        if (error) {
            console.error('❌ Error creating user:', error.message);
        } else {
            console.log('✅ User created successfully!');
            console.log('   ID:', data.user.id);
        }
    }
}

createTestUser();
