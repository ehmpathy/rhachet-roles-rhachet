# howto: use keyrack

## .what

keyrack manages credentials for roles and skills. secrets unlock via cli or sdk.

## .why

- centralized credential management
- secure: keys never in source
- environment-aware: test, prep, prod
- owner-scoped: personal vs shared credentials

---

## cli usage

### unlock credentials

```sh
# unlock for an owner and environment
rhx keyrack unlock --owner ehmpath --env prep
rhx keyrack unlock --owner ehmpath --env prod
```

credentials expire after ~9 hours. re-unlock if expired.

### check status

```sh
rhx keyrack status --owner ehmpath
```

### get a specific key

```sh
# vibes output (default, human-readable)
rhx keyrack get --owner ehmpath --key XAI_API_KEY --env prep

# json output (programmatic use)
rhx keyrack get --owner ehmpath --key XAI_API_KEY --env prep --json
rhx keyrack get --owner ehmpath --key XAI_API_KEY --env prep --output json

# raw value output (pipe-friendly, no final newline)
rhx keyrack get --owner ehmpath --key XAI_API_KEY --env prep --value
rhx keyrack get --owner ehmpath --key XAI_API_KEY --env prep --output value
```

| mode | stdout | stderr | use case |
|------|--------|--------|----------|
| `vibes` | turtle treestruct | — | human inspection |
| `json` | JSON structure | errors | programmatic parse |
| `value` | raw secret | vibes on failure | pipe to commands |

### source credentials into shell

```sh
# source all repo keys into shell
eval "$(rhx keyrack source --env prep --owner ehmpath)"

# source single key
eval "$(rhx keyrack source --key XAI_API_KEY --env prep --owner ehmpath)"

# strict mode (default): fail if any key absent
eval "$(rhx keyrack source --env prep --owner ehmpath --strict)"

# lenient mode: source what's available, skip absent
eval "$(rhx keyrack source --env prep --owner ehmpath --lenient)"
```

### exit codes

| code | means |
|------|-------|
| 0 | granted (or lenient mode success) |
| 2 | not granted (absent/locked/blocked) |

### common errors

| error | fix |
|-------|-----|
| `credential is locked` | run unlock command |
| `credential not found` | check key name, check env |
| `credential not filled` | ask human to run `rhx keyrack fill --owner ehmpath` |
| `host manifest not found` | ask human to run `rhx keyrack init --owner ehmpath` |

---

## typescript patterns

### source credentials

```ts
import { keyrack } from 'rhachet/keyrack';

/**
 * .what = source credentials into process.env with fail-fast semantics
 * .why = credentials should come from keyrack; strict mode fails if absent
 */
export const sourceKeyrackCreds = async (): Promise<void> => {
  // source all repo keys into process.env (strict: fail if any absent)
  await keyrack.source({
    owner: 'ehmpath',
    env: 'prep',
    mode: 'strict',
  });

  // now process.env.XAI_API_KEY is available
};
```

### sdk modes

| mode | behavior |
|------|----------|
| `strict` | fail if any key absent (default) |
| `lenient` | source available keys, skip absent |

### sdk vs cli

| sdk | cli |
|-----|-----|
| `keyrack.source({ mode: 'strict' })` | `keyrack source --strict` |
| `keyrack.source({ mode: 'lenient' })` | `keyrack source --lenient` |
| `keyrack.source({ key: 'API_KEY' })` | `keyrack source --key API_KEY` |

---

## shell patterns

### source credentials

```bash
#!/usr/bin/env bash
set -euo pipefail

# source credentials into environment (strict: fail if absent)
eval "$(rhx keyrack source --env prep --owner ehmpath)"

# now use them directly
gh api --header "Authorization: token $GITHUB_TOKEN" ...
```

### get single key

```bash
#!/usr/bin/env bash
set -euo pipefail

# fetch raw value (no jq needed)
TOKEN=$(rhx keyrack get --owner ehmpath --key GITHUB_TOKEN --env prep --value)

# use it
gh api --header "Authorization: token $TOKEN" ...
```

### reusable operations file

```bash
#!/usr/bin/env bash
######################################################################
# .what = shared keyrack operations for git skills
# .why = single source of truth for token fetch logic
######################################################################

require_github_token() {
  # fetch raw value (exit 2 if not granted)
  local token
  token=$(rhx keyrack get --owner ehmpath --key GITHUB_TOKEN --env prep --value) || {
    echo "" >&2
    echo "🐢 bummer dude..." >&2
    echo "" >&2
    echo "🔐 github token not found" >&2
    echo "   ├─ run: rhx keyrack unlock --owner ehmpath --env prep" >&2
    echo "   └─ then retry this command" >&2
    exit 2
  }
  echo "$token"
}
```

usage in a skill:

```bash
source "$SKILL_DIR/../git.commit/keyrack.operations.sh"
TOKEN=$(require_github_token)
```

---

## grant statuses

| status | what it means | action |
|--------|---------------|--------|
| `granted` | key available | use `attempt.grant.key.secret` |
| `locked` | keyrack locked | run unlock command |
| `absent` | key not found | check key name |
| `blocked` | access denied | check permissions |

---

## environment priority

keyrack checks in order:

1. **environment variable** — `process.env.KEY` (for CI)
2. **keyrack store** — unlocked credentials

this allows:
- CI to set secrets via env vars
- local dev to use keyrack
- no code changes between environments

**note:** do not check env vars manually before `keyrack.get()` — keyrack handles this automatically.

---

## owner: ehmpath vs personal

| owner | what | protected by |
|-------|------|--------------|
| `ehmpath` | shared credentials for clones | session key |
| personal | human's credentials | yubikey |

**always use `--owner ehmpath`** for robot credentials.

personal keyrack requires yubikey — robots cannot unlock it.

---

## integration pattern summary

### typescript skill

```ts
// src/contract/cli/review.ts
export const review = async (): Promise<void> => {
  // 1. source credential into process.env
  await keyrack.source({ owner: 'ehmpath', env: 'prep', key: 'XAI_API_KEY', mode: 'strict' });

  // 2. create brain context (now has env var)
  const brain = await genContextBrain({ choice: 'xai/grok/code-fast-1' });

  // 3. invoke operation
  await stepReview({ ... }, { brain });
};
```

### shell skill

```bash
#!/usr/bin/env bash
set -euo pipefail

# option 1: source all keys (preferred)
eval "$(rhx keyrack source --env prep --owner ehmpath)"
gh api --header "Authorization: token $GITHUB_TOKEN" ...

# option 2: fetch single key with --value
TOKEN=$(rhx keyrack get --owner ehmpath --key GITHUB_TOKEN --env prep --value)
gh api --header "Authorization: token $TOKEN" ...
```

---

## shell escape safety

secrets are escaped for safe shell eval:

| secret | escaped output |
|--------|----------------|
| `secret` | `'secret'` |
| `sec'ret` | `'sec'\''ret'` |
| `line1\nline2` | `$'line1\nline2'` |

this prevents injection attacks with `eval "$(keyrack source ...)"`.

---

## ci/cd pattern

```bash
# strict (default): fail build if any credential absent
eval "$(rhx keyrack source --env prod --owner cicd --strict)"

# lenient: continue with available credentials
eval "$(rhx keyrack source --env test --owner dev --lenient)"
```
