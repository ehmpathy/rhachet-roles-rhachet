# howto: test skills

## .what

skills are shell executables invoked via `rhx <skill-name>`. test them via jest, not bash.

## .why

- jest provides consistent test runner
- snapshots enable visual review in PRs
- `test-fns` given/when/then pattern improves readability
- ci runs jest tests via `npm run test:integration`

---

## the write/test cycle

```sh
# 1. edit source
vim src/domain.roles/mechanic/skills/my-skill.sh

# 2. build src → dist
npm run build

# 3. run the skill
rhx my-skill --arg value
```

for rapid iteration:

```sh
npm run build && rhx my-skill --arg value
```

---

## skill location

```
src/domain.roles/{role}/skills/
  └── {skill-name}.sh    ← source (edit here)
        ↓
     npm run build
        ↓
dist/domain.roles/{role}/skills/
  └── {skill-name}.sh    ← built (read-only)
        ↓
     rhachet roles link
        ↓
.agent/repo={repo}/role={role}/skills/
  └── {skill-name}.sh    ← symlinked (runtime)
```

---

## write a skill

### 1. create the file

```sh
touch src/domain.roles/mechanic/skills/my-skill.sh
chmod +x src/domain.roles/mechanic/skills/my-skill.sh
```

### 2. add the header

```bash
#!/usr/bin/env bash
######################################################################
# .what = one line description
#
# .why  = why this skill exists
#         - benefit 1
#         - benefit 2
#
# usage:
#   my-skill.sh --arg "value"
#   my-skill.sh --flag
#
# guarantee:
#   - what this skill guarantees
#   - safety properties
######################################################################
set -euo pipefail
```

### 3. parse arguments

rhachet passes `--skill`, `--repo`, `--role` to all skills. ignore them:

```bash
while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role)
      shift 2
      ;;
    --my-arg)
      MY_ARG="$2"
      shift 2
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done
```

---

## test a skill

### jest test pattern

create `.integration.test.ts` next to the skill:

```typescript
import { spawnSync } from 'child_process';
import * as path from 'path';
import { given, then, when } from 'test-fns';

describe('my-skill.sh', () => {
  const skillPath = path.join(__dirname, 'my-skill.sh');

  const runSkill = (args: string[]) => {
    const result = spawnSync('bash', [skillPath, ...args], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      exitCode: result.status ?? 1,
    };
  };

  given('[case1] valid input', () => {
    when('[t0] skill is invoked', () => {
      then('exits 0 and produces output', () => {
        const result = runSkill(['--my-arg', 'value']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] invalid input', () => {
    when('[t0] skill is invoked with bad arg', () => {
      then('exits 2 with error', () => {
        const result = runSkill(['--bad-arg']);
        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('unknown argument');
      });
    });
  });
});
```

### run tests

```sh
npm run test:integration -- my-skill
```

---

## exit codes

| code | meaning |
|------|---------|
| 0 | success |
| 1 | malfunction (external error) |
| 2 | constraint (user must fix) |

---

## patterns

### delegate to other skills

```bash
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SKILL_DIR/other-skill.sh" --arg "$ARG"
```

### safe file operations

use safe* skills instead of raw commands:

```bash
rhx cpsafe --from src.txt --into dest.txt
rhx mvsafe --from old.txt --into new.txt
rhx rmsafe --path temp.txt
rhx sedreplace --old "foo" --new "bar" --glob 'src/**/*.ts'
```

---

## enforcement

- `.test.sh` files = blocker (use jest instead)
- skills without `.integration.test.ts` = nitpick
