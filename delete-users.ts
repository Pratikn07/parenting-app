import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllUsers() {
    try {
        console.log('🗑️  Deleting all users from Supabase...\n');

        // Get all users
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('Error listing users:', listError);
            return;
        }

        if (!users || users.users.length === 0) {
            console.log('✅ No users found in the database.');
            return;
        }

        console.log(`Found ${users.users.length} user(s):\n`);

        // Display users
        users.users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email || 'No email'} (ID: ${user.id})`);
        });

        console.log('\n🔥 Deleting users...\n');

        // Delete each user
        for (const user of users.users) {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

            if (deleteError) {
                console.error(`❌ Failed to delete user ${user.email}:`, deleteError);
            } else {
                console.log(`✅ Deleted user: ${user.email || user.id}`);
            }
        }

        console.log('\n✨ All users deleted successfully!');

    } catch (error) {
        console.error('Error:', error);
    }
}

deleteAllUsers();
