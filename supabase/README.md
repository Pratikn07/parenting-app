# Supabase Database Management for "Your Parenting Compass"

This directory contains all the tools and scripts needed to programmatically manage your Supabase PostgreSQL database.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd supabase
pip install -r requirements.txt
```

### 2. Set Up Environment Variables (Optional)

Create a `.env` file or set environment variables:

```bash
export SUPABASE_URL="https://ccrgvammglkvdlaojgzv.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
export SUPABASE_ANON_KEY="your_anon_key_here"
```

### 3. Run Complete Database Setup

```bash
python setup_database.py setup
```

This will:
- ✅ Enable required PostgreSQL extensions
- ✅ Create all database tables with proper relationships
- ✅ Set up performance indexes
- ✅ Configure Row-Level Security (RLS) policies
- ✅ Create RPC functions for search and utilities
- ✅ Insert sample data for testing

## 📁 File Structure

```
supabase/
├── setup_database.py          # Main automation script
├── requirements.txt            # Python dependencies
├── README.md                  # This file
├── schema.sql                 # Database schema (for reference)
├── rls_policies.sql          # RLS policies (for reference)
├── rpc_functions.sql         # RPC functions (for reference)
├── seed_data.sql             # Sample data (for reference)
└── examples/
    └── new_table_example.sql  # Example of adding new tables
```

## 🔧 Available Commands

### Complete Setup
```bash
python setup_database.py setup
```
Runs the complete database setup process.

### Individual Components
```bash
# Create extensions only
python setup_database.py extensions

# Create tables only
python setup_database.py tables

# Create indexes only
python setup_database.py indexes

# Set up RLS policies only
python setup_database.py rls

# Create RPC functions only
python setup_database.py functions

# Insert sample data only
python setup_database.py seed
```

### Adding New Tables
```bash
python setup_database.py add-table appointments examples/new_table_example.sql
```

## 🆕 Adding New Tables

### Step 1: Create SQL File

Create a new SQL file with your table definition:

```sql
-- my_new_table.sql
CREATE TABLE IF NOT EXISTS public.my_new_table (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_my_new_table_user ON public.my_new_table (user_id);

-- Enable RLS
ALTER TABLE public.my_new_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "own rows - my_new_table" ON public.my_new_table 
FOR ALL USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "service role all - my_new_table" ON public.my_new_table 
FOR ALL USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');
```

### Step 2: Run the Script

```bash
python setup_database.py add-table my_new_table my_new_table.sql
```

## 🏗️ Database Schema Overview

### Core Tables

| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `users` | User profiles (1:1 with auth.users) | Own row only |
| `babies` | Baby profiles | User-scoped |
| `chat_sessions` | Chat conversations | User-scoped |
| `chat_messages` | Individual messages | Via session → user |
| `articles` | Educational content | Public read, service write |
| `checklists` | Task lists | Public read, service write |
| `reminders` | User reminders | User-scoped |
| `growth_measurements` | Baby growth data | Via baby → user |
| `devices` | Push notification tokens | User-scoped |
| `embeddings` | Vector search data | Public read, service write |

### RPC Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `search_articles` | Find articles by age/tags | `age_days`, `locale`, `tags` |
| `search_embeddings` | Vector similarity search | `query_embedding`, `match_count`, `filter` |
| `get_personalized_articles` | Age-appropriate articles | `baby_id`, `locale`, `limit_count` |
| `get_upcoming_reminders` | Scheduled reminders | `user_id`, `days_ahead` |
| `get_baby_age_days` | Calculate baby's age | `baby_id` |

## 🔒 Security Features

### Row-Level Security (RLS)

All tables have RLS enabled with these patterns:

1. **User-scoped tables**: Users can only access their own data
   ```sql
   CREATE POLICY "own rows" ON table_name 
   FOR ALL USING (user_id = auth.uid()) 
   WITH CHECK (user_id = auth.uid());
   ```

2. **Baby-scoped tables**: Access via baby ownership
   ```sql
   CREATE POLICY "own rows" ON table_name 
   FOR ALL USING (
       EXISTS (SELECT 1 FROM babies b WHERE b.id = table_name.baby_id AND b.user_id = auth.uid())
   );
   ```

3. **Public content**: Read-only for authenticated users
   ```sql
   CREATE POLICY "public read" ON table_name 
   FOR SELECT USING (auth.role() = 'authenticated');
   ```

4. **Service role**: Full access for admin operations
   ```sql
   CREATE POLICY "service role all" ON table_name 
   FOR ALL USING (auth.role() = 'service_role');
   ```

## 🧪 Testing

### Sample Data

The setup script creates:
- Demo user: `demo.parent@example.com` / `DemoPassw0rd!123`
- Sample baby: "Aarav" (20 days old)
- Chat conversation with realistic Q&A
- Educational articles about sleep, feeding, soothing
- Checklists for safety and feeding
- Growth measurements and reminders

### Verification Queries

```sql
-- Test RLS isolation (should return empty for different users)
SELECT * FROM babies WHERE user_id != auth.uid();

-- Test article search
SELECT * FROM search_articles(20, 'en-US', ARRAY['sleep']);

-- Test personalized content
SELECT * FROM get_personalized_articles('baby-uuid-here');
```

## 🔧 Customization

### Environment Configuration

The script automatically uses your project credentials but you can override them:

```python
# In setup_database.py, modify load_config() function
def load_config() -> SupabaseConfig:
    return SupabaseConfig(
        project_url="https://your-project.supabase.co",
        service_role_key="your-service-role-key",
        anon_key="your-anon-key"
    )
```

### Adding Custom Functions

Add new RPC functions to the `create_rpc_functions()` method:

```python
def create_rpc_functions(self) -> bool:
    functions_sql = """
    -- Your existing functions...
    
    -- New custom function
    CREATE OR REPLACE FUNCTION public.my_custom_function(param1 text)
    RETURNS text
    LANGUAGE sql
    STABLE
    AS $$
    SELECT 'Hello ' || param1;
    $$;
    """
    return self.execute_sql(functions_sql, "Creating RPC functions")
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure you're using the service role key, not the anon key
   - Check that your Supabase project allows API access

2. **Extension Errors**
   - The `vector` extension requires Supabase Pro plan or higher
   - Contact Supabase support if extensions fail to install

3. **RLS Policy Conflicts**
   - Policies are dropped and recreated to avoid conflicts
   - Check Supabase logs for detailed error messages

### Debug Mode

Add debug logging to the script:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

## 🤝 Contributing

When adding new tables or features:

1. Follow the existing naming conventions
2. Always include RLS policies
3. Add appropriate indexes for performance
4. Include example usage in comments
5. Test with the demo user data

## 📄 License

This database setup is part of the "Your Parenting Compass" application.
