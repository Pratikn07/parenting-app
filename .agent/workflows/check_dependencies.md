---
description: Check dependencies before installing packages
---

# Check Dependencies

Before installing ANY new npm package, you MUST verify if it is truly needed.

1.  **Read `package.json`**:
    -   Check `dependencies` and `devDependencies`.

2.  **Search for Existing Solutions**:
    -   If you need date formatting, check for `date-fns`, `moment`, or `dayjs`. **DO NOT** install a second date library.
    -   If you need icons, check for `lucide-react-native`, `expo/vector-icons`, etc.
    -   If you need state management, check for `zustand`, `redux`, `context`.

3.  **Reuse Before Adding**:
    -   If a similar library exists, use it.
    -   Only install a new package if the capability is completely missing and cannot be reasonably built with existing tools.
