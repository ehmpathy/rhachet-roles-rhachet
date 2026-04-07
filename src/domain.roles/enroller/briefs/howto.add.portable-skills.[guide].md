# howto: portable skills

## .what

skills can be **shell-only** or **typescript dispatch**.

| type | when to use |
|------|-------------|
| shell-only | simple operations, cli wrappers, glue code |
| typescript dispatch | complex logic, type safety, testability needed |

this guide covers the **typescript dispatch pattern** — shell wrappers that dispatch to typescript, portable across:
- development (run from src/)
- test (run via rhachet in test consumer repos)
- production (installed as npm dependency)

## .why

use typescript dispatch when you need:
- type safety for complex inputs
- testability via jest
- composition with other operations
- access to node ecosystem

shell-only is fine for:
- simple cli wrappers (`gh`, `git`, `jq` pipelines)
- glue code between tools
- operations with no complex logic

---

## the pattern

shell skill dispatches to typescript via native node `import()`:

```bash
#!/usr/bin/env bash
set -euo pipefail
exec node -e "import('my-roles-package').then(m => m.cli.mySkill())" -- "$@"
```

this pattern is package-manager agnostic (npm, pnpm, yarn, bun).

---

## how it works

| context | resolution |
|---------|------------|
| local development | `devDependencies` self-reference + `exports` field |
| published/consumed | standard node_modules resolution |

---

## setup

### 1. package.json exports

```json
{
  "exports": {
    ".": "./dist/index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "devDependencies": {
    "my-roles-package": "file:."
  }
}
```

the self-reference in `devDependencies` enables local development. at runtime (when consumed), standard node_modules resolution works.

### 2. cli entry point

create `src/contract/cli/my-skill.ts`:

```typescript
import { z } from 'zod';
import { myOperation } from '../../domain.operations/my-operation';

const schemaOfArgs = z.object({
  name: z.string(),
  verbose: z.boolean().default(false),
});

export const mySkill = async (): Promise<void> => {
  const args = parseArgs(process.argv, schemaOfArgs);
  await myOperation(args);
};
```

### 3. export from index.ts

```typescript
import { mySkill } from './contract/cli/my-skill';

export const cli = {
  mySkill,
};
```

### 4. shell wrapper

create `src/domain.roles/my-role/skills/my-skill.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
exec node -e "import('my-roles-package').then(m => m.cli.mySkill())" -- "$@"
```

---

## directory structure

```
src/
├── contract/
│   └── cli/
│       └── my-skill.ts       # cli entry point
├── domain.operations/
│   └── my-operation/
│       ├── index.ts          # public interface
│       └── steps/            # decomposed operations
├── domain.roles/
│   └── my-role/
│       └── skills/
│           └── my-skill.sh   # thin dispatcher
└── index.ts                  # exports cli.*
```

---

## why this works

shell executables are location-independent because they import from the package name.

when rhachet symlinks skills to `.agent/repo=.../skills/`, the shell location changes but `import('my-roles-package')` still resolves via node_modules.

---

## benefits over npx tsx

| aspect | `node -e import()` | `npx tsx` |
|--------|-------------------|-----------|
| pnpm compatible | yes | no (strict isolation) |
| startup overhead | ~200ms | ~1500ms |
| runtime compilation | none (uses dist/) | yes |
| package resolution | none | yes |

---

## constraints

- cli entry points must export from `src/index.ts` under `cli.*`
- cli entry points must handle rhachet args (`--repo`, `--role`, `--skill`)
- package.json must have `exports` field
- package.json must have `engines.node >= 18`
- package.json must have self-reference in devDependencies
- shell skills must use `node -e` (not `npx tsx`)
