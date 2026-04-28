#!/bin/bash

# Get the project connection string
PROJECT_REF="ccrgvammglkvdlaojgzv"
DB_PASSWORD=$(security find-generic-password -w -s "supabase-db-password-${PROJECT_REF}" 2>/dev/null || echo "")

# Read the SQL file
SQL_CONTENT=$(cat supabase/migrations/20251129_add_child_context_enhancements.sql)

# Execute via supabase API (using the CLI's authenticated session)
echo "Applying migration to remote database..."
echo "$SQL_CONTENT"
