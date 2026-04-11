# howto: create thought routes

## .what

guide for create new thought routes: directories, stones, guards, and bind commands.

## .why

enable self-serve route creation without reverse-engineer extant routes.

---

## concepts

### route

a sequence of milestones (stones) that guide a brain through a task.

directory: `.route/v$isodate.$slug/` or `.$variant/v$isodate.$slug/`

### stone

a single milestone on a route. file: `N.name.stone`

contains markdown instructions for work to be done.

### guard

optional validation gate for a stone. file: `N.name.guard` (matches stone name).

yaml with `artifacts:`, `protect:`, `judges:`, and/or `reviews:`.

---

## example stone

`3.3.1.blueprint.product.stone` from rhachet-roles-bhuild:

    ```markdown
    propose a blueprint for how we will implement the wish
    - in $BEHAVIOR_DIR_REL/0.wish.md
    - with $BEHAVIOR_DIR_REL/3.2.distill.domain.*.yield.md (if declared)
    - with $BEHAVIOR_DIR_REL/3.2.distill.repros.experience.*.yield.md (if declared)

    .why = blueprint the code changes needed to deliver the product.
    - the product is the deliverable (spec + impl)
    - explicit blueprint declares what the execution will adhere to

    follow the patterns already present in this repo.

    ---

    ## summary

    state what will be built.

    ---

    ## filediff tree

    include a treestruct of filediffs.

    **legend:**
    - `[+] create` — file to create
    - `[~] update` — file to update
    - `[-] delete` — file to delete

    ---

    ## codepath tree

    ...

    ---

    ## test coverage

    ...

    ---

    reference
    - $BEHAVIOR_DIR_REL/0.wish.md
    - $BEHAVIOR_DIR_REL/1.vision.md (if declared)
    - $BEHAVIOR_DIR_REL/2.1.criteria.blackbox.md (if declared)
    - ...

    ---

    emit into $BEHAVIOR_DIR_REL/3.3.1.blueprint.product.yield.md
    ```

ref: `rhx git.repo.get lines --in ehmpathy/rhachet-roles-bhuild --paths 'src/**/3.3.1.blueprint.product.stone'`

---

## example guard

`3.3.1.blueprint.product.guard` from rhachet-roles-bhuild:

    ```yaml
    artifacts:
      - $route/3.3.1.blueprint.product.yield.md

    protect:
      - src/**/*

    judges:
      - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route
      - rhx route.stone.judge --mechanism approved? --stone $stone --route $route

    reviews:
      peer:
        - npx rhachet run --repo bhrain --skill review --rules '.agent/**/pitofsuccess.errors/rule.*.md' --diffs since-main --paths-with '$route/3.3.blueprint.*.md' --output '$route/.reviews/$stone.peer-review.failhides.md'

      self:
        - slug: has-research-traceability
          say: |
            does the blueprint trace back to research? for each decision, can you
            point to research that supports it?

            if not, flag it as assumption and justify inline.

        # ... (12 more self reviews)
    ```

ref: `rhx git.repo.get lines --in ehmpathy/rhachet-roles-bhuild --paths 'src/**/3.3.1.blueprint.product.guard*'`

---

## commands

| command | purpose |
|---------|---------|
| `rhx route.bind.set --route $path` | bind route to current branch |
| `rhx route.bind.get` | show current bound route |
| `rhx route.bind.del` | unbind route |
| `rhx route.drive` | show next stone |
| `rhx route.stone.set --stone $name --as passed` | mark stone complete |

---

## guard syntax

| section | what it does |
|---------|--------------|
| `artifacts:` | globs for files the stone must produce |
| `protect:` | globs for files the stone must not modify until passed |
| `judges:` | commands that verify driver can pass gate |
| `reviews:` | peer (shell commands) and self (structured prompts) reviews |

```yaml
artifacts:
  - $route/3.1.a*.md
  - src/**/*

protect:
  - src/**/*

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route
  - rhx route.stone.judge --mechanism approved? --stone $stone --route $route

reviews:
  peer:
    - npx rhachet run --repo bhrain --skill review --rules '.agent/**/rule.*.md' --paths '$route/3.3.blueprint.*.md' --output '$route/.reviews/$stone.peer-review.md'

  self:
    - slug: has-questioned-requirements
      say: |
        are there any requirements that should be questioned?
        challenge each requirement and justify why it belongs.

    - slug: has-questioned-assumptions
      say: |
        are there any hidden assumptions?
        surface all hidden assumptions and question each one.
```

### peer vs self reviews

| type | format | who |
|------|--------|-----|
| `peer` | shell commands | external brains |
| `self` | structured prompts (`say: \|` enables multiline) | internal brains |

peer reviews are commands that:
- run automated checks (linters, reviewers, validators)
- output results to `$route/.reviews/` directory
- can invoke `rhx review` skill with rules and paths

### judges

judges verify gate conditions before route progress is allowed:

| mechanism | what it checks | required |
|-----------|----------------|----------|
| `reviewed?` | peer reviewers satisfied | when peer reviews exist |
| `approved?` | human approval received | when human sign-off needed |

### guard variables

| variable | expands to | example |
|----------|------------|---------|
| `$route` | route directory path | `.behavior/v2026_03_15.my-feature/` |
| `$stone` | stone name | `1.vision` |
| `$hash` | content hash | `abc123...` |

note: `$route` works unquoted in yaml — no `"$route/..."` needed.

---

## parallel stones

stones with same numeric prefix can be worked in parallel:
- `3.1.a.stone`, `3.1.b.stone` — both available simultaneously
- route advances when ALL parallel stones in prefix group are passed

---

## variants

- `.route/` — default variant for most routes
- `.behavior/` — behavior-driven routes
- `.$custom/` — custom variants as needed

---

## nested routes

when a stone's work requires its own route:
1. create sub-route in separate directory
2. rebind: `rhx route.bind.set --route .route/v$date.$subroute`
3. complete sub-route
4. rebind to parent: `rhx route.bind.set --route .route/v$date.$parent`

note: route.bind tracks one route at a time. switch via rebind.
