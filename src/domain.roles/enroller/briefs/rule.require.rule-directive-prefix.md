# rule.require.rule-directive-prefix

## .what

rule briefs must use the pattern `rule.{directive}.{topic}.md` where directive is one of: `require`, `prefer`, `avoid`, `forbid`.

## .why

consistent prefixes:
- enable glob patterns to find all rules (`rule.*.md`)
- signal severity at a glance from filename
- sort rules by type in directory listings
- prevent ambiguous or custom directive names

## .scope

applies to all rule brief filenames in:
- `.agent/**/briefs/rule.*.md`

## .valid directives

| directive | semantics | enforcement on violation |
|-----------|-----------|--------------------------|
| `forbid` | must not do this | blocker |
| `avoid` | should not do this | warn |
| `prefer` | should do this | nitpick |
| `require` | must do this | blocker |

## .pattern

```
rule.{directive}.{topic}.md

where:
  directive ∈ { require, prefer, avoid, forbid }
  topic = kebab-case descriptor
```

## .examples

### good

```
rule.forbid.hardcoded-secrets.md
rule.require.pinned-versions.md
rule.prefer.wet-over-dry.md
rule.avoid.deep-nests.md
```

### bad

```
rule.ban.hardcoded-secrets.md      # 'ban' not valid directive
rule.must.pinned-versions.md       # 'must' not valid directive
rule.hardcoded-secrets.md          # no directive
forbid.hardcoded-secrets.md        # no 'rule.' prefix
rule.should-not.deep-nests.md      # compound directive
```

## .enforcement

rule filename without valid directive prefix = blocker

## .see also

- define.rules.[article]
- howto.create-rules.[lesson]
