---
description: Check project structure before creating files
---

# Check Project Structure

Before creating ANY new file, you MUST understand where it belongs in the existing hierarchy.

1.  **Analyze Directory Structure**:
    -   Run `ls -F` or `tree -L 2` in the root directory.
    -   Identify the pattern:
        -   Are screens in `app/` (Expo Router) or `src/screens`?
        -   Are utilities in `lib/`, `utils/`, or `helpers/`?
        -   Are types in `types/` or co-located?

2.  **Locate Similar Files**:
    -   If creating a new Service, find where other Services are (e.g., `src/services/`).
    -   If creating a new Hook, find `src/hooks/`.

3.  **Conform to Naming Conventions**:
    -   Check if files are `camelCase.ts`, `PascalCase.tsx`, or `kebab-case.js`.
    -   Match the existing pattern exactly.
