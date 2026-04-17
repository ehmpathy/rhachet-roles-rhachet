# define.rules

## .what

rules are briefs that declare mandatory or recommended practices. they define constraints, patterns, and conventions that actors follow when they work in a codebase.

## .structure

rules follow a consistent structure with dot-prefixed sections:

| section | purpose | required |
|---------|---------|----------|
| `.what` | what the rule declares | yes |
| `.why` | rationale and benefits | yes |
| `.scope` | where rule applies | no |
| `.pattern` | code examples that show compliance | no |
| `.examples` | good/bad comparisons | no |
| `.alternatives` | preferred replacements | no |
| `.enforcement` | severity level | yes |
| `.see also` | related rules/briefs | no |
| `.note` | edge cases, clarifications | no |

## .name pattern

rules use the pattern: `rule.{directive}.{topic}.md`

| directive | intent | on detection |
|-----------|--------|--------------|
| `forbid` | must not do | blocker |
| `avoid` | should not do | warn |
| `prefer` | should do | nitpick |
| `require` | must do | blocker |

topic is kebab-case and describes the constraint (e.g., `unbounded-recursive-globs`, `gerunds`, `wet-over-dry`).

## .enforcement levels

| level | intent | action |
|-------|--------|--------|
| blocker | stops progress | must fix before merge |
| warn | notable concern | should fix, can defer |
| nitpick | style preference | optional improvement |

## .examples

### minimal rule

```markdown
# rule.forbid.hardcoded-secrets

## .what
secrets must not be hardcoded in source files

## .why
hardcoded secrets leak via version control and logs

## .enforcement
hardcoded secrets = blocker
```

### complete rule

```markdown
# rule.prefer.wet-over-dry

## .what
prefer duplication over premature abstraction

## .why
wrong abstractions expensive; patterns discovered, not predicted

## .scope
- domain operations
- utility functions
- type definitions

## .pattern
wait for 3+ usages before abstract

## .examples
### good
// two similar functions - ok, wait for third

### bad
// generic abstraction with type switches

## .alternatives
| instead of | use |
|------------|-----|
| generic<T> with switch | specific functions |

## .enforcement
premature abstraction = nitpick

## .see also
- rule.require.single-responsibility
```

## .why rules matter

rules:
- encode institutional knowledge
- prevent repeated mistakes
- enable automated review
- align team practices
- reduce cognitive load in review
