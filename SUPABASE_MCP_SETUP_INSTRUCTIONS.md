# Supabase MCP Server Setup Instructions

## 🎯 Goal
Connect the Supabase MCP server so I can list existing tables and create the new Resources & Tips enhancement tables.

## 📋 Step-by-Step Instructions

### Step 1: Locate Your MCP Configuration
The MCP server configuration is typically found in one of these locations:

**For VSCode with Cline:**
- Open VSCode Settings (Cmd/Ctrl + ,)
- Search for "MCP" or "Claude Dev"
- Look for "MCP Servers" or "Connected Servers" section

**For Claude Desktop:**
- Look for `claude_desktop_config.json` file
- Usually located at:
  - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Step 2: Add Supabase MCP Server Configuration

Add this configuration to your MCP servers list:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "description": "Supabase database operations and management for parenting app",
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_04c7b064062d54e2b05dc0818ac576d091ab2925",
        "SUPABASE_PROJECT_REF": "ccrgvammglkvdlaojgzv"
      }
    }
  }
}
```

### Step 3: Restart/Reload MCP Connection

**For VSCode:**
- Restart VSCode or reload the window (Cmd/Ctrl + Shift + P → "Developer: Reload Window")

**For Claude Desktop:**
- Restart the Claude Desktop application

### Step 4: Verify Connection

Once you've completed the setup, let me know and I'll test the connection by running:
```
use_mcp_tool with server_name: supabase
```

## 🔧 Alternative Configuration Formats

If the above format doesn't work, try this alternative:

```json
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase@latest"],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "sbp_04c7b064062d54e2b05dc0818ac576d091ab2925",
      "SUPABASE_PROJECT_REF": "ccrgvammglkvdlaojgzv"
    }
  }
}
```

## 🚨 Troubleshooting

If you encounter issues:

1. **Check the package exists**: Run `npx @supabase/mcp-server-supabase@latest --help`
2. **Verify credentials**: Make sure the access token and project ref are correct
3. **Check logs**: Look for any error messages in your MCP client logs
4. **Try manual installation**: Run `npm install -g @supabase/mcp-server-supabase`

## ✅ What Happens Next

Once the Supabase MCP server is connected, I will:

1. **List existing tables** in your database
2. **Create the 6 new tables** for Resources & Tips enhancement:
   - `user_saved_resources`
   - `user_activity_log`
   - `user_progress_stats`
   - `daily_tips`
   - `milestone_templates`
   - `user_milestone_progress`
3. **Verify tables were created** successfully
4. **Complete the Resources & Tips transformation**

## 📞 Let Me Know When Ready

Once you've added the configuration and restarted, just say "Supabase MCP server is connected" and I'll proceed with the database setup!
