# howto: add skills

## .what

💪 skills are executable capabilities that actors can invoke via `.run()` or `.act()`.

## .why

skills offload work from imagine-cost to compute-cost:
- **imagine-cost** = time + tokens to figure out how to do a task
- **compute-cost** = deterministic executable, instant and free

skills maximize consistency. brains are probabilistic — skills are deterministic.

---

## skill types

| type | extension | when to use |
|------|-----------|-------------|
| shell-only | `.sh` | git ops, file ops, simple cli tools |
| shell + typescript | `.sh` + `.ts` | complex logic, brain invocation, type safety |

---

## when to use shell-only vs typescript

### shell-only

use shell-only when:
- task is git operations (commit, push, rebase)
- task is file operations (copy, move, symlink)
- task is cli tool orchestration (gh, jq, curl)
- no brain invocation needed
- no complex type validation needed

### shell + typescript

use typescript dispatch when:
- task invokes a brain for inference
- task has complex input/output schemas
- task requires type safety and validation
- task composes multiple domain operations

---

## directory structure

skills live in `src/domain.roles/<role>/skills/`:

```
src/domain.roles/
  mechanic/
    skills/
      git.commit.set.sh         # shell-only skill
      git.release.sh            # shell-only skill
      claude.tools/
        sedreplace.sh           # shell-only skill
        symlink.sh              # shell-only skill
  reviewer/
    skills/
      review.sh                 # typescript dispatch
      reflect.sh                # typescript dispatch
```

---

## shell-only skills

### anatomy

from `git.commit.set.sh` (759 lines of pure bash):

```bash
#!/usr/bin/env bash
######################################################################
# .what = create git commit as seaturtle[bot] with human co-author
#
# .why  = mechanics commit under their own identity while credit
#         goes to the human who delegated the work
#
# usage:
#   echo "fix(scope): summary
#
#   - detail 1
#   - detail 2" | rhx git.commit.set -m @stdin
#   echo "..." | rhx git.commit.set -m @stdin --mode apply
#   echo "..." | rhx git.commit.set -m @stdin --mode apply --push
#
# guarantee:
#   - author is seaturtle[bot] <seaturtle@ehmpath.com>
#   - Co-authored-by trailer with human's git identity
#   - requires quota from git.commit.uses
#   - push only if allowed and requested
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# source shared operations
source "$SKILL_DIR/git.commit.operations.sh"
source "$SKILL_DIR/keyrack.operations.sh"

######################################################################
# parse arguments
######################################################################
parse_args() {
  local message=""
  local mode="plan"
  local push="false"
  local unstaged="error"

  while [[ $# -gt 0 ]]; do
    case $1 in
      -m)
        shift
        if [[ "$1" == "@stdin" ]]; then
          message=$(cat)
        else
          message="$1"
        fi
        shift
        ;;
      --mode)
        shift
        mode="$1"
        shift
        ;;
      --push)
        push="true"
        shift
        ;;
      --unstaged)
        shift
        unstaged="$1"
        shift
        ;;
      *)
        echo "unknown option: $1" >&2
        exit 2
        ;;
    esac
  done

  # export for use in main
  export ARG_MESSAGE="$message"
  export ARG_MODE="$mode"
  export ARG_PUSH="$push"
  export ARG_UNSTAGED="$unstaged"
}

######################################################################
# main
######################################################################
main() {
  parse_args "$@"

  # validate message
  if [[ -z "$ARG_MESSAGE" ]]; then
    echo "error: -m <message> is required" >&2
    exit 2
  fi

  # check quota
  local uses
  uses=$(get_commit_uses)
  if [[ "$uses" -le 0 ]]; then
    echo "" >&2
    echo "🐢 bummer dude..." >&2
    echo "" >&2
    echo "✋ no commit quota" >&2
    echo "   └─ ask human: git.commit.uses set --quant N --push allow" >&2
    exit 2
  fi

  # execute based on mode
  if [[ "$ARG_MODE" == "plan" ]]; then
    echo "📝 plan mode - would commit:"
    echo "$ARG_MESSAGE"
  else
    # apply: create commit
    git commit -m "$ARG_MESSAGE" \
      --author "seaturtle[bot] <seaturtle@ehmpath.com>"

    # decrement uses
    decrement_commit_uses

    # push if requested
    if [[ "$ARG_PUSH" == "true" ]]; then
      push_with_token
    fi
  fi
}

main "$@"
```

### key elements

1. **shebang** — `#!/usr/bin/env bash`
2. **header block** — `.what`, `.why`, usage, guarantee
3. **strict mode** — `set -euo pipefail`
4. **SKILL_DIR** — get script location for sourced files
5. **named arguments** — parse `--option value` pairs
6. **fail-fast** — exit with code 2 on validation errors
7. **mode pattern** — `plan` (preview) vs `apply` (execute)

### sourced operations

split shared logic into operation files:

```
skills/git.commit/
  git.commit.set.sh              # main entrypoint
  git.commit.operations.sh       # shared git operations
  keyrack.operations.sh          # shared keyrack operations
  output.sh                      # shared output utils
```

---

## shell + typescript skills

### anatomy

shell wrapper dispatches to typescript:

```bash
#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for code review skill
#
# .why = enables direct invocation from CLI, CI/CD, git hooks
#        via location-independent package import
#
# usage:
#   ./review.sh --rules "rules/*.md" --paths "src/*.ts"
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-acme/cli/review').then(m => m.review())" -- "$@"
```

typescript cli module:

```ts
// src/contract/cli/review.ts

/**
 * .what = cli entrypoint for review skill
 * .why = enables shell invocation via package-level import
 */
export const review = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  // fetch credentials
  if (options.brain.startsWith('xai/')) {
    await getXaiCredsFromKeyrack();
  }

  // create brain context
  const brain = await genContextBrain({ choice: options.brain });

  // invoke domain operation
  await stepReview({
    rules: options.rules,
    paths: options.paths,
    output: options.output,
    focus: options.focus,
    goal: options.goal,
  }, { brain });
};
```

### the exec pattern

```bash
exec node -e "import('package-name/cli/subpath').then(m => m.functionName())" -- "$@"
```

- `exec` — replaces shell process with node
- `node -e` — executes inline javascript
- `import('package-name/cli/subpath')` — loads from package exports
- `-- "$@"` — passes all args to the function

### package exports

expose cli modules via `package.json`:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./cli/review": "./dist/contract/cli/review.js",
    "./cli/reflect": "./dist/contract/cli/reflect.js"
  }
}
```

---

## add a skill

### shell-only skill

1. create file in `skills/` directory:
   ```
   src/domain.roles/mechanic/skills/git.commit.set.sh
   ```

2. add header with `.what`, `.why`, usage, guarantee

3. add `set -euo pipefail`

4. implement argument parser with named args

5. implement mode pattern (plan/apply)

6. make executable:
   ```sh
   chmod +x src/domain.roles/mechanic/skills/git.commit.set.sh
   ```

### shell + typescript skill

1. create cli module:
   ```
   src/contract/cli/review.ts
   ```

2. add package export in `package.json`

3. create shell wrapper in `skills/`

4. rebuild:
   ```sh
   npm run build
   ```

---

## skill patterns

### mode pattern (plan/apply)

```bash
if [[ "$ARG_MODE" == "plan" ]]; then
  echo "would do: $action"
  exit 0
fi

# apply mode
execute_action
```

### stdin pattern

```bash
if [[ "$1" == "@stdin" ]]; then
  message=$(cat)
else
  message="$1"
fi
```

### exit codes

| code | means |
|------|-------|
| 0 | success |
| 1 | malfunction (external error) |
| 2 | constraint (user must fix) |

---

## invoke skills

`rhx` is the primary interface for skills:

```sh
rhx review --rules "rules/*.md" --paths "src/*.ts"
rhx git.commit.set -m @stdin --mode apply
rhx sedreplace --old "foo" --new "bar" --glob 'src/**/*.ts'
```

`rhx` is shorthand for `npx rhachet run --skill`.

### skill resolution

rhx resolves skills via `.agent/` symlinks:

1. scans `.agent/repo=*/role=*/skills/` for `<skill-name>.sh`
2. executes the matched skill with provided args
3. skills from multiple roles are available if linked

---

## skill discovery

skills are discovered via:

1. `skills.dirs` in `Role.build()`
2. files with `.sh` extension
3. name convention: `skill-name.sh`

skill name = filename without extension:
- `review.sh` → skill name: `review`
- `git.commit.set.sh` → skill name: `git.commit.set`
