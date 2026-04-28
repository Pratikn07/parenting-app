# Database Setup Guide - Resources & Tips Enhancement

## Overview
This guide provides multiple methods to execute the database schema for the Resources & Tips enhancement feature.

## 🗄️ Tables to be Created

The schema will create these 6 new tables:

1. **`user_saved_resources`** - Tracks bookmarked/saved resources by users
2. **`user_activity_log`** - Logs user interactions and engagement activities  
3. **`user_progress_stats`** - Weekly aggregated user engagement metrics
4. **`daily_tips`** - Personalized daily tips for users
5. **`milestone_templates`** - Standard milestone templates by age and category
6. **`user_milestone_progress`** - User-specific milestone tracking

## 🚀 Method 1: Automated Script (Recommended)

### Prerequisites
1. Add your Supabase service role key to `.env`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Execute the Script
```bash
# Install dependencies if needed
npm install @supabase/supabase-js dotenv

# Run the schema setup script
node execute-schema.js
```

## 🔧 Method 2: Manual Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project
   - Go to SQL Editor

2. **Execute the Schema**
   - Copy the entire contents of `create-resources-enhancement-tables.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify Tables Created**
   - Go to Table Editor
   - Confirm all 6 tables are present:
     - `user_saved_resources`
     - `user_activity_log` 
     - `user_progress_stats`
     - `daily_tips`
     - `milestone_templates`
     - `user_milestone_progress`

## 🔧 Method 3: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply the schema
supabase db push
```

## 🔧 Method 4: Direct PostgreSQL Connection

If you have direct PostgreSQL access:

```bash
# Using psql
psql "postgresql://postgres:[password]@[host]:[port]/postgres" -f create-resources-enhancement-tables.sql

# Or using any PostgreSQL client
# Import and execute the create-resources-enhancement-tables.sql file
```

## 📊 Sample Data Population (Optional)

After creating the tables, you can populate them with sample data:

### Sample Milestone Templates
```sql
INSERT INTO milestone_templates (title, description, milestone_type, min_age_months, max_age_months, parenting_stage) VALUES
('Holds head up briefly', 'Can lift and hold head up for short periods during tummy time', 'physical', 0, 3, 'newborn'),
('Follows objects with eyes', 'Tracks moving objects and faces with their gaze', 'cognitive', 0, 3, 'newborn'),
('Responds to familiar voices', 'Shows recognition and response to parent voices', 'social', 0, 3, 'newborn'),
('Makes cooing sounds', 'Begins to make soft vowel sounds and coos', 'social', 1, 4, 'newborn'),
('Rolls over', 'Can roll from tummy to back or back to tummy', 'physical', 3, 6, 'infant'),
('Sits without support', 'Can sit upright without assistance', 'physical', 4, 8, 'infant'),
('Says first words', 'Says "mama" or "dada" with meaning', 'social', 8, 12, 'infant'),
('Walks independently', 'Takes first independent steps', 'physical', 9, 15, 'toddler'),
('Uses two-word phrases', 'Combines two words meaningfully', 'social', 15, 24, 'toddler'),
('Potty training readiness', 'Shows signs of readiness for potty training', 'physical', 18, 36, 'toddler');
```

### Sample Resources
```sql
INSERT INTO resources (title, description, category, parenting_stages, tags, is_featured) VALUES
('Newborn Sleep Guide', 'Complete guide to newborn sleep patterns and establishing healthy sleep habits', 'Sleep', ARRAY['newborn']::parenting_stage[], ARRAY['sleep', 'newborn', 'guide'], true),
('Breastfeeding Basics', 'Essential breastfeeding tips for new mothers including latch and positioning', 'Feeding', ARRAY['newborn', 'infant']::parenting_stage[], ARRAY['breastfeeding', 'feeding', 'newborn'], true),
('Introducing Solid Foods', 'When and how to start your baby on solid foods safely', 'Feeding', ARRAY['infant']::parenting_stage[], ARRAY['feeding', 'solids', 'infant'], true),
('Toddler Discipline Strategies', 'Positive discipline techniques for toddlers', 'Behavior', ARRAY['toddler']::parenting_stage[], ARRAY['discipline', 'behavior', 'toddler'], true),
('Baby Development Milestones', 'Understanding your baby''s developmental milestones', 'Development', ARRAY['newborn', 'infant']::parenting_stage[], ARRAY['development', 'milestones'], false);
```

## ✅ Verification Steps

After executing the schema, verify the setup:

### 1. Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_saved_resources',
    'user_activity_log', 
    'user_progress_stats',
    'daily_tips',
    'milestone_templates',
    'user_milestone_progress'
);
```

### 2. Check Row Level Security
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
    'user_saved_resources',
    'user_activity_log', 
    'user_progress_stats',
    'daily_tips',
    'milestone_templates',
    'user_milestone_progress'
);
```

### 3. Check Indexes
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN (
    'user_saved_resources',
    'user_activity_log', 
    'user_progress_stats',
    'daily_tips',
    'milestone_templates',
    'user_milestone_progress'
);
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're using the service role key, not the anon key
   - Check that your user has schema modification permissions

2. **Table Already Exists**
   - The script uses `CREATE TABLE IF NOT EXISTS` so this should be safe
   - If you need to recreate tables, drop them first

3. **Foreign Key Constraints**
   - Ensure the base tables (`profiles`, `resources`, `children`, `milestones`) exist
   - Run the main schema first if they don't exist

4. **RLS Policies Conflict**
   - If policies already exist with the same name, you may need to drop them first

### Getting Help

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify your environment variables are correct
3. Ensure your database connection is working
4. Try executing the SQL manually in smaller chunks

## 🎯 Next Steps

After successful database setup:

1. ✅ Tables created and configured
2. 🔄 Update your application to use the new dynamic data
3. 🧪 Test the new functionality
4. 📊 Monitor the new tables for data population

The database foundation is now ready for the enhanced Resources & Tips feature!
