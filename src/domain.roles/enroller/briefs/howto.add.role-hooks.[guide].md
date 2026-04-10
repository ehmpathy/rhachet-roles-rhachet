# howto: add hooks to a role

## .what

`hooks` define commands that execute at specific lifecycle events when a role is enrolled with a brain.

## .why

hooks enable roles to react to brain lifecycle events:
- **onBoot** — load briefs, set up context at session start
- **onTool** — validate or guard tool calls before/after execution
- **onStop** — run cleanup or finalization when session ends

---

## critical: onBoot for briefs

**if you want your role's briefs to load into the brain's context, you must add an onBoot hook.**

without this hook, your briefs will not be booted:

```ts
hooks: {
  onBrain: {
    onBoot: [
      {
        command: './node_modules/.bin/rhachet roles boot --repo <repo-slug> --role <role-slug>',
        timeout: 'PT60S',
      },
    ],
  },
},
```

this is the essential hook for every role.

---

## hook types

### onBoot

fires at session start and compaction events. use for:
- boot briefs into context
- notify permissions
- init role state

```ts
onBoot: [
  {
    command: './node_modules/.bin/rhachet roles boot --repo acme --role reviewer',
    timeout: 'PT60S',
  },
],
```

#### onBoot filter.what values

| value | fires on | use case |
|-------|----------|----------|
| (none) | SessionStart | default, backwards compat |
| `SessionStart` | new session + compaction | same as no filter |
| `PostCompact` | compaction only | verify compaction assumptions |
| `PreCompact` | before compaction | checkpoint state |

```ts
onBoot: [
  {
    command: './node_modules/.bin/rhachet run --repo acme --role reviewer --init claude.hooks/postcompact.trust-but-verify',
    timeout: 'PT30S',
    filter: { what: 'PostCompact' },
  },
],
```

### onTool

fires before or after tool calls. use for:
- validate inputs
- guard dangerous operations
- log or audit actions

```ts
onTool: [
  {
    command: './node_modules/.bin/rhachet run --repo acme --role reviewer --init claude.hooks/pretooluse.check-permissions',
    timeout: 'PT5S',
    filter: { what: 'Bash', when: 'before' },
  },
  {
    command: './node_modules/.bin/rhachet run --repo acme --role reviewer --init claude.hooks/posttooluse.log-action',
    timeout: 'PT5S',
    filter: { what: 'Write|Edit', when: 'after' },
  },
],
```

### onStop

fires when session ends. use for:
- run linters/formatters
- cleanup operations
- finalization

```ts
onStop: [
  {
    command: 'npm run fix:lint',
    timeout: 'PT60S',
  },
],
```

---

## hook structure

```ts
interface BrainHook {
  command: string;           // shell command to execute
  timeout: IsoDuration;      // e.g., 'PT5S', 'PT30S', 'PT60S'
  filter?: {
    what?: string;           // filter which events trigger hook
    when?: 'before' | 'after'; // for onTool only
  };
}
```

| field | type | description |
|-------|------|-------------|
| `command` | string | shell command to execute |
| `timeout` | string | ISO 8601 duration (e.g., `PT5S`, `PT60S`) |
| `filter.what` | string | tool name(s) to match, pipe-separated (e.g., `Bash`, `Write\|Edit`) |
| `filter.when` | string | `before` or `after` tool execution (onTool only) |

---

## claude code translation

rhachet hooks translate to claude code `.claude/settings.json`:

| rhachet | claude code |
|---------|-------------|
| `onBoot` (no filter) | `SessionStart` |
| `onBoot` + `filter.what=SessionStart` | `SessionStart` |
| `onBoot` + `filter.what=PostCompact` | `PostCompact` |
| `onBoot` + `filter.what=PreCompact` | `PreCompact` |
| `onTool` | `PreToolUse` |
| `onStop` | `Stop` |

---

## complete example

```ts
import { Role } from 'rhachet';

export const ROLE_MECHANIC: Role = Role.build({
  slug: 'mechanic',
  name: 'Mechanic',
  purpose: 'write code',
  readme: { uri: __dirname + '/readme.md' },
  briefs: { dirs: { uri: __dirname + '/briefs' } },
  skills: { dirs: { uri: __dirname + '/skills' } },
  inits: { dirs: { uri: __dirname + '/inits' } },
  hooks: {
    onBrain: {
      onBoot: [
        {
          command: './node_modules/.bin/rhachet roles boot --repo .this --role any --if-present',
          timeout: 'PT60S',
        },
        {
          command: './node_modules/.bin/rhachet roles boot --repo ehmpathy --role mechanic',
          timeout: 'PT60S',
        },
        {
          command: './node_modules/.bin/rhachet run --repo ehmpathy --role mechanic --init claude.hooks/sessionstart.notify-permissions',
          timeout: 'PT5S',
        },
      ],
      onTool: [
        {
          command: './node_modules/.bin/rhachet run --repo ehmpathy --role mechanic --init claude.hooks/pretooluse.check-permissions',
          timeout: 'PT5S',
          filter: { what: 'Bash', when: 'before' },
        },
        {
          command: './node_modules/.bin/rhachet run --repo ehmpathy --role mechanic --init claude.hooks/pretooluse.forbid-terms.gerunds',
          timeout: 'PT5S',
          filter: { what: 'Write|Edit', when: 'before' },
        },
      ],
      onStop: [
        {
          command: 'npm run fix:lint',
          timeout: 'PT60S',
        },
      ],
    },
  },
});
```

---

## inits vs hooks

| aspect | inits | hooks |
|--------|-------|-------|
| where | `inits/` directory | `hooks` in Role.build() |
| invocation | explicit via `--init` flag | automatic at lifecycle events |
| use case | reusable scripts | lifecycle automation |

hooks reference inits via the `--init` flag:

```ts
command: './node_modules/.bin/rhachet run --repo acme --role reviewer --init claude.hooks/pretooluse.check-permissions'
```

this runs `inits/claude.hooks/pretooluse.check-permissions.sh` (or `.ts`).
