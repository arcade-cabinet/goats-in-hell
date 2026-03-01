---
allowed-tools: Bash, Read
description: Compile and validate a level in the SQLite database
---

Validate level `$ARGUMENTS` in the level database.

## Process

Run the validation script:

```bash
cd /Users/jbogaty/src/arcade-cabinet/goats-in-hell/.worktrees/level-db
npx ts-node -e "
import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { LevelEditor } from './src/db/LevelEditor';
import * as schema from './src/db/schema';

const db = drizzle(new BetterSqlite3('assets/levels.db'), { schema });
const editor = new LevelEditor(db);
const result = editor.validate('$ARGUMENTS');
console.log(JSON.stringify(result, null, 2));
"
```

Report the validation result with actionable fixes for any errors.
