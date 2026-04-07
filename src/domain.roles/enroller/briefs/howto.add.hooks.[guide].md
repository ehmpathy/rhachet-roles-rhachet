# howto: add hooks

## .what

hooks are shell commands that run in response to Claude Code events (session start, tool use, stop).

## .why

hooks enable guardrails, automation, and custom behavior without changes to Claude Code itself.

---

## hook types

| event | filter.when | trigger |
|-------|-------------|---------|
| onBoot | - | session start |
| onTool | before | pre-tool execution (can block) |
| onTool | after | post-tool execution |
| onStop | - | session end |

---

## create a hook

### 1. create the executable

place in `src/domain.roles/{role}/inits/claude.hooks/`:

```bash
# src/domain.roles/mechanic/inits/claude.hooks/pretooluse.my-hook.sh
#!/usr/bin/env bash
set -euo pipefail

# read JSON from stdin (Claude Code format)
STDIN_INPUT=$(cat)

# extract command (for Bash hooks)
COMMAND=$(echo "$STDIN_INPUT" | jq -r '.tool_input.command // empty')

# your logic here...

# exit 0 = allow, exit 2 = block
exit 0
```

**critical: make it executable!**

```bash
chmod +x src/domain.roles/mechanic/inits/claude.hooks/pretooluse.my-hook.sh
git add src/domain.roles/mechanic/inits/claude.hooks/pretooluse.my-hook.sh
```

Claude Code silently ignores non-executable hooks.

### 2. register in the role definition

add to `src/domain.roles/{role}/get{Role}Role.ts`:

```typescript
export const ROLE_MECHANIC: Role = Role.build({
  // ...
  hooks: {
    onBrain: {
      onTool: [
        {
          command:
            './node_modules/.bin/rhachet run --repo ehmpathy --role mechanic --init claude.hooks/pretooluse.my-hook',
          timeout: 'PT5S',
          filter: { what: 'Bash', when: 'before' },
        },
      ],
    },
  },
});
```

### 3. rebuild and reinit

```bash
npm run build
npx rhachet init --hooks --roles mechanic
```

this writes hooks to `.claude/settings.json`.

---

## filter.what patterns

| pattern | matches |
|---------|---------|
| `Bash` | bash commands |
| `Write\|Edit` | file writes and edits |
| `WebFetch` | web fetches |
| `*` | all tools |

---

## exit codes

| code | effect |
|------|--------|
| 0 | allow (continue) |
| 2 | block (deny with error to stderr) |

---

## stdin format

Claude Code passes JSON to hooks:

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "ls -la"
  }
}
```

---

## file name conventions

| prefix | purpose |
|--------|---------|
| `pretooluse.*` | runs before tool, can block |
| `posttooluse.*` | runs after tool |
| `sessionstart.*` | runs on session start |

---

## hook does not run?

1. **check executable bit** (most common cause)
   ```bash
   git ls-files -s path/to/hook.sh
   # 100644 = NOT executable (broken)
   # 100755 = executable (correct)
   ```
   fix: `chmod +x path/to/hook.sh && git add path/to/hook.sh`

2. **rebuild and relink**
   ```bash
   npm run build && npx rhachet roles link --role mechanic
   ```

Claude Code silently ignores hooks that fail to execute.

---

## summary

1. create hook in `inits/claude.hooks/`
2. **chmod +x the hook file** (critical!)
3. register in `get{Role}Role.ts` under `hooks.onBrain.onTool`
4. `npm run build && npx rhachet init --hooks --roles mechanic`
