# Supabase Setup Guide for "Your Parenting Compass"

This guide will help you set up the complete Supabase backend for the parenting app according to the PRD specifications.

## 🚀 Quick Setup

### 1. Database Setup

1. **Go to your Supabase project**: https://ccrgvammglkvdlaojgzv.supabase.co
2. **Navigate to SQL Editor** in the dashboard
3. **Run the setup scripts in order**:

```sql
-- Copy and paste the contents of each file in this order:
-- 1. supabase/schema.sql (creates tables, indexes, extensions)
-- 2. supabase/rls_policies.sql (sets up security policies)
-- 3. supabase/rpc_functions.sql (creates search functions)
-- 4. supabase/seed_data.sql (adds sample data)
```

### 2. Authentication Configuration

1. **Go to Authentication > Settings** in Supabase dashboard
2. **Enable Email authentication** (already enabled by default)
3. **Configure OAuth providers**:
   - **Apple**: Add your Apple Service ID, Key ID, Team ID, and private key
   - **Google**: Add your Google OAuth client ID and secret
4. **Set Site URL**: `yourapp://callback` (for mobile app)
5. **Add Redirect URLs**: `yourapp://callback`

### 3. Realtime Configuration

1. **Go to Database > Replication** in Supabase dashboard
2. **Enable realtime for these tables**:
   - `chat_messages` (for live chat updates)
   - `reminders` (for notification updates)

### 4. API Configuration

Your API credentials are already configured in the app:
- **Project URL**: `https://ccrgvammglkvdlaojgzv.supabase.co`
- **Anon Key**: Already set in `src/services/supabase.ts`
- **Service Role Key**: Used for admin operations

## 📊 Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User profiles | 1:1 with auth.users, stores locale/timezone |
| `babies` | Baby profiles | User-scoped, stores birth date, allergies, etc. |
| `chat_sessions` | Chat conversations | Links to user and optionally baby |
| `chat_messages` | Individual messages | Real-time enabled, role-based |
| `articles` | Educational content | Age-targeted, tagged, publicly readable |
| `checklists` | Task lists | Age-appropriate, with required/optional items |
| `reminders` | User reminders | Scheduled notifications, recurring support |
| `growth_measurements` | Baby growth data | Weight, length, head circumference tracking |
| `devices` | Push notification tokens | Platform-specific device registration |
| `embeddings` | Vector search data | AI-powered content discovery |

### Security Features

- **Row-Level Security (RLS)** enabled on all tables
- **User isolation**: Users can only access their own data
- **Public content**: Articles and checklists readable by all authenticated users
- **Service role access**: Admin operations use service role key

## 🔧 API Usage Examples

### Authentication

```typescript
import { AuthService } from './src/services/auth/AuthService';

// Email/password sign up
const response = await AuthService.signUp('John Doe', 'john@example.com', 'password123');

// Email/password sign in
const response = await AuthService.signIn('john@example.com', 'password123');

// Get current user
const user = await AuthService.getCurrentUser();

// Sign out
await AuthService.signOut();
```

### Database Operations

```typescript
import { supabase } from './src/services/supabase';

// Create a baby profile
const { data, error } = await supabase
  .from('babies')
  .insert([{
    user_id: user.id,
    name: 'Emma',
    date_of_birth: '2024-01-15',
    sex: 'female'
  }])
  .select()
  .single();

// Get personalized articles
const { data: articles } = await supabase
  .rpc('get_personalized_articles', {
    baby_id: babyId,
    locale: 'en-US',
    limit_count: 10
  });

// Start a chat session
const { data: session } = await supabase
  .from('chat_sessions')
  .insert([{
    user_id: user.id,
    baby_id: babyId,
    topic: 'Sleep questions'
  }])
  .select()
  .single();

// Send a chat message
const { data: message } = await supabase
  .from('chat_messages')
  .insert([{
    session_id: session.id,
    role: 'user',
    content: 'How much should my baby sleep?'
  }])
  .select()
  .single();
```

### Real-time Subscriptions

```typescript
// Subscribe to chat messages
const subscription = supabase
  .channel('chat_messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

## 🔍 Search Functions

### Article Search

```typescript
// Search articles by age and tags
const { data: articles } = await supabase
  .rpc('search_articles', {
    age_days: 30, // 30 days old
    locale: 'en-US',
    tags: ['sleep', 'newborn']
  });
```

### Vector Search (Future AI Features)

```typescript
// Semantic search using embeddings
const { data: matches } = await supabase
  .rpc('search_embeddings', {
    query_embedding: [0.1, 0.2, ...], // 1536-dimensional vector
    match_count: 5,
    filter: {
      locale: 'en-US',
      tags: ['sleep'],
      age_days: 30
    }
  });
```

## 📱 Mobile App Integration

### Environment Configuration

Create `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ccrgvammglkvdlaojgzv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Auth State Management

```typescript
import { useEffect, useState } from 'react';
import { AuthService } from './src/services/auth/AuthService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    AuthService.getCurrentUser().then(setUser).finally(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

## 🧪 Testing

### Sample Data

The seed script creates:
- Demo user: `demo.parent@example.com` / `DemoPassw0rd!123`
- Sample baby: "Aarav" (20 days old)
- Chat conversation with 4 messages
- 3 educational articles
- 2 checklists with items
- Growth measurements
- Reminders and device registration

### Test Queries

```sql
-- Verify RLS is working (should return empty for different user)
SELECT * FROM babies WHERE user_id != auth.uid();

-- Test article search
SELECT * FROM search_articles(20, 'en-US', ARRAY['sleep']);

-- Check chat messages for a session
SELECT cm.* FROM chat_messages cm
JOIN chat_sessions cs ON cs.id = cm.session_id
WHERE cs.user_id = auth.uid();
```

## 🔒 Security Checklist

- ✅ RLS enabled on all user-scoped tables
- ✅ Service role policies for admin operations
- ✅ Public content (articles/checklists) readable by authenticated users only
- ✅ Cross-user data access prevented
- ✅ JWT token management handled by Supabase
- ✅ Secure password hashing with bcrypt
- ✅ OAuth provider configuration required for production

## 🚀 Deployment Checklist

### Development
- ✅ Database schema created
- ✅ RLS policies applied
- ✅ Sample data loaded
- ✅ Frontend services updated

### Production
- [ ] Configure OAuth providers (Apple, Google)
- [ ] Set up custom domain (optional)
- [ ] Configure email templates
- [ ] Set up monitoring and alerts
- [ ] Enable database backups
- [ ] Configure rate limiting
- [ ] Set up error tracking

## 📞 Support

For issues with this setup:
1. Check Supabase logs in the dashboard
2. Verify RLS policies are working with test queries
3. Ensure API keys are correctly configured
4. Test authentication flows in development

## 🔄 Next Steps

1. **Run the database setup scripts** in your Supabase SQL editor
2. **Configure OAuth providers** for Apple and Google sign-in
3. **Test the authentication flow** with the demo user
4. **Verify real-time subscriptions** are working for chat
5. **Test the search functions** with sample data
6. **Deploy to production** when ready

Your Supabase backend is now ready to power the "Your Parenting Compass" app with secure, scalable, and feature-rich functionality!
