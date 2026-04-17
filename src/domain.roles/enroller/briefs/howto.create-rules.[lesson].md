# howto create rules

## when to create a rule

create a rule when:
- a pattern causes repeated bugs or confusion
- review feedback repeats the same correction
- institutional knowledge needs to persist
- automated enforcement would help

## steps

### 1. choose the directive

| if you want to... | use |
|-------------------|-----|
| ban a practice | `rule.forbid.{topic}` |
| discourage a practice | `rule.avoid.{topic}` |
| encourage a practice | `rule.prefer.{topic}` |
| mandate a practice | `rule.require.{topic}` |

### 2. name the topic

use kebab-case that describes the constraint:
- `unbounded-recursive-globs`
- `hardcoded-secrets`
- `wet-over-dry`
- `get-set-gen-verbs`

### 3. write the sections

required sections:

```markdown
# rule.{directive}.{topic}

## .what
one sentence: what the rule declares

## .why
why this matters; what problems it prevents

## .enforcement
{violation} = {level}
```

optional sections (add as needed):

```markdown
## .scope
where rule applies:
- code: variable names, function names
- docs: markdown, prompts
- logs: error messages

## .pattern
code example that shows compliance

## .examples
### good
// compliant code

### bad
// violation

## .alternatives
| instead of | use |
|------------|-----|
| bad | good |

## .see also
- related rule
- related brief

## .note
edge cases, exceptions, clarifications
```

### 4. set enforcement level

| level | when to use |
|-------|-------------|
| blocker | violations break correctness or security |
| warn | violations harm quality but can defer |
| nitpick | style preference, low stakes |

### 5. place the file

place in the appropriate briefs directory:
- repo-wide rules: `.agent/repo=.this/role=any/briefs/`
- role-specific rules: `.agent/repo={repo}/role={role}/briefs/`

## complete example

```markdown
# rule.forbid.console-log-in-prod

## .what
console.log must not appear in production code

## .why
- pollutes logs with debug noise
- exposes internal state
- not structured for observability

## .scope
- code: src/**/*.ts
- excludes: src/**/*.test.ts, scripts/

## .pattern
```ts
// use structured logger
context.log.info('event', { data });
```

## .examples
### good
```ts
context.log.info('user created', { userId: user.id });
```

### bad
```ts
console.log('user:', user);
```

## .alternatives
| instead of | use |
|------------|-----|
| console.log | context.log.info |
| console.error | context.log.error |
| console.warn | context.log.warn |

## .enforcement
console.log in src/**/*.ts = blocker

## .see also
- rule.require.structured-logs
```

## tips

- keep `.what` to one sentence
- lead `.why` with the problem, not the solution
- include code in `.pattern` and `.examples`
- link related rules in `.see also`
- be specific in `.enforcement` about what triggers what level
