-- =============================================================================
-- Complete Supabase Setup Script for "Your Parenting Compass"
-- Execute this script in Supabase SQL Editor with service role privileges
-- =============================================================================

-- Step 1: Enable Extensions
\echo 'Step 1: Enabling extensions...'
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists vector; -- pgvector for embeddings
create extension if not exists pg_trgm; -- useful for future partial search (optional)

-- Step 2: Create Tables and Indexes
\echo 'Step 2: Creating tables and indexes...'
\i schema.sql

-- Step 3: Set up Row-Level Security
\echo 'Step 3: Setting up Row-Level Security policies...'
\i rls_policies.sql

-- Step 4: Create RPC Functions
\echo 'Step 4: Creating RPC functions...'
\i rpc_functions.sql

-- Step 5: Insert Seed Data
\echo 'Step 5: Inserting seed data...'
\i seed_data.sql

\echo 'Setup complete! Your Supabase database is ready for "Your Parenting Compass".'
