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
rhx keyrack get --owner ehmpath --key XAI_API_KEY --env prep --json
```

### common errors

| error | fix |
|-------|-----|
| `credential is locked` | run unlock command |
| `credential not found` | check key name, check env |
| `credential not filled` | ask human to run `rhx keyrack fill --owner ehmpath` |
| `host manifest not found` | ask human to run `rhx keyrack init --owner ehmpath` |

---

## typescript sdk pattern

```ts
import { keyrack } from 'rhachet/keyrack';
import type { BrainSuppliesXai } from 'rhachet-brains-xai';

/**
 * .what = fetch xai credentials from keyrack with fail-fast semantics
 * .why = xai is the default brain; credentials should come from keyrack
 */
export const getXaiCredsFromKeyrack = async (): Promise<{
  supplier: { 'brain.supplier.xai': BrainSuppliesXai };
}> => {
  // keyrack.get checks env vars first, then keyrack
  const { attempt, emit } = await keyrack.get({
    owner: 'ehmpath',
    env: 'prep',
    key: 'XAI_API_KEY',
  });

  // fail-fast if not granted
  if (attempt.status !== 'granted') {
    console.error(emit.stderr);
    process.exit(2);
  }

  // return supplier with credentials
  const apiKey = attempt.grant.key.secret;
  return {
    supplier: {
      'brain.supplier.xai': {
        creds: async () => ({ XAI_API_KEY: apiKey }),
      },
    },
  };
};
```

---

## shell skill pattern

from `src/domain.roles/mechanic/skills/git.commit/keyrack.operations.sh`:

```bash
#!/usr/bin/env bash
######################################################################
# .what = shared keyrack operations for git skills
# .why = single source of truth for token fetch logic
######################################################################

fetch_github_token() {
  local repo_root
  repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || repo_root="."

  # unlock the key first
  "$repo_root/node_modules/.bin/rhachet" keyrack unlock \
    --owner ehmpath \
    --key EHMPATHY_SEATURTLE_GITHUB_TOKEN \
    --env prep >/dev/null 2>&1 || true

  # get the token
  local keyrack_output
  keyrack_output=$("$repo_root/node_modules/.bin/rhachet" keyrack get \
    --owner ehmpath \
    --key EHMPATHY_SEATURTLE_GITHUB_TOKEN \
    --env prep \
    --json 2>&1) || return 1

  echo "$keyrack_output" | jq -r '.grant.key.secret // empty'
}

require_github_token() {
  local token
  token=$(fetch_github_token)

  if [[ -z "$token" ]]; then
    echo "" >&2
    echo "🐢 bummer dude..." >&2
    echo "" >&2
    echo "🔐 github token not found" >&2
    echo "   ├─ run: rhx keyrack unlock --owner ehmpath --env prep" >&2
    echo "   └─ then retry this command" >&2
    exit 1
  fi

  echo "$token"
}
```

usage in a skill:

```bash
source "$SKILL_DIR/../git.commit/keyrack.operations.bash"
TOKEN=$(require_github_token)
```

---

## grant statuses

| status | what it means | action |
|--------|---------------|--------|
| `granted` | key available | use `grant.grant.key.secret` |
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
  // 1. fetch credentials before brain init
  await getXaiCredsFromKeyrack();

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

# source keyrack operations
source "$SKILL_DIR/../git.commit/keyrack.operations.bash"

# fetch token (fail-fast if not available)
TOKEN=$(require_github_token)

# use token
gh api --header "Authorization: token $TOKEN" ...
```
