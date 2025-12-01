---
description: Check design system before implementing UI
---

# Check Design System

Before implementing any UI component or screen, you MUST check the existing design system to ensure consistency.

1.  **Identify Theme Constants**:
    -   Read `src/lib/constants.ts` (or similar) to understand the color palette, spacing, and typography.
    -   **DO NOT** hardcode hex values (e.g., `#FF0000`). Use the defined constants (e.g., `COLORS.primary`).

2.  **Check for Reusable Components**:
    -   List files in `components/` or `src/components/`.
    -   Look for "atoms" like `Button`, `Card`, `Typography`, `Input`.
    -   **DO NOT** create a new button or input if a standard one exists.

3.  **Verify Tailwind/Style Usage**:
    -   Check `tailwind.config.js` (if applicable) for custom theme extensions.
    -   Ensure you are using the project's established styling method (e.g., Tailwind classes vs. StyleSheet objects).
