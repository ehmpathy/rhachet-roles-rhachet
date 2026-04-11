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

## workflow

1. **create** route directory: `.route/v$isodate.$slug/`
2. **add** stones: `1.name.stone`, `2.name.stone`, etc.
3. **add** guards (optional): `1.name.guard`, etc.
4. **bind** route to branch: `rhx route.bind.set --route .route/v$isodate.$slug`

**critical**: step 4 is required. without a bind, the driver won't know the route exists.

```sh
rhx route.bind.set --route .route/v2026_04_11.my-feature
```

### skills that initialize routes

skills that create routes MUST also bind them. the skill must call:

```sh
rhx route.bind.set --route "$ROUTE_PATH"
```

if a skill creates a route but does not bind it, the driver will not drive it — the route will be orphaned.

### example skill stdouts

(tip: don't forget to snapshot them for vibechecks!)

skills that initialize routes should produce stdout that:
1. shows what was created
2. confirms the bind happened
3. hints at what's next

**init.behavior** (from rhachet-roles-bhuild):

```
🦫 oh, behave!
   ├─ + 0.wish.md
   ├─ + 1.vision.guard
   ├─ + 1.vision.stone
   ├─ + 2.1.criteria.blackbox.stone
   ...
   └─ + refs/template.[feedback].v1.[given].by_human.md

🌲 go on then,
   ├─ .behavior/v2026_04_11.my-feature/0.wish.md
   └─ tip: use --open to open the wish automatically

🍄 we'll remember,
   ├─ branch feature/my-feature <-> behavior v2026_04_11.my-feature
   ├─ branch bound to behavior, to boot via hooks
   └─ branch bound to route, to drive via hooks
```

**declapract.upgrade init** (from rhachet-roles-ehmpathy):

```
🐢 radical!

🐚 declapract.upgrade init
   ├─ route: .route/v2026_04_11.declapract.upgrade/ ✨
   └─ created
      ├─ 1.upgrade.invoke.stone
      ├─ 2.detect.hazards.stone
      ├─ 2.detect.hazards.guard
      ├─ 3.1.repair.test.defects.stone
      ├─ 3.1.repair.test.defects.guard
      ...
      └─ 3.4.reflect.cicd.defects.guard

🥥 hang ten! we'll ride this in
   └─ branch main <-> route .route/v2026_04_11.declapract.upgrade
```

both examples show:
- what was scaffolded (files created)
- confirmation of bind (branch <-> route)
- the driver will now pick up the route via hooks

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
