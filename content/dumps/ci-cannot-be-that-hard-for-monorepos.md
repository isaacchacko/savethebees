---
title: ci cannot be that hard for monorepos
date: 2026-09-30
description: all my homies hate gha
---

# ci cannot be that hard for monorepos

apparently there's no simple solution for github actions that defines a system where you can have the cross of:

- multiple "lanes" of ci (infra, be, fe, etc)
- no unnecessary ci runs/work

i couldn't find a good pre-built solution for what we were struggling with, so i made my own handrolled solution :(

skip the vocab lesson if you'd like.

# enrichment: vocab lesson for github actions

```graph title="the vocab, as a graph"
workflow {gold 3} -> run 1 {tomato 2}, run 2 {tomato 2}
run 1 -> job A {dodgerblue 1.5}, job B {dodgerblue 1.5}
job B -(needs)-> job A
job A -> step 1 {mediumseagreen}, step 2 {mediumseagreen}
step 1 -(uses)-> action {orchid}
step 2 -(run)-> shell command {silver}
```

- workflows: the list of items you see on the Actions tab in github. a workflow is just a static definition of CI, while the rest of the vocab below is related to the process of actually running CI
- run: one execution of a workflow
- job: a workflow defines a list of jobs, each with an optional pre-requisite `needs` parameter pointing to another job in the workflow. with `needs`, gha calculates the DAG and then is able to run independent jobs concurrently while those with `needs` block
- step: work done sequentially within a job. cheaper than jobs because while each job uses its own VM, steps of a job run within the same VM
- actions: pre-defined steps defined by other people on github. you can source pre-defined actions by `owner/repo/path@ref` (what i do for supersonic-ci!)

# what makes a run unnecessary

say there's commit A (touching fe/be) and commit B (be only).

- if A in progress, B arrives: wasteful to cancel A's fe run
- if A finished (all green), B arrives: wasteful to start a fresh fe run

in reality, default gha behavior is not built for this, wasting lots of runner minutes (you're billed by jobs' elapsed time in minutes).

# staquo sucks

there's of course many solutions out there to mitigate the loss. 

- gha native `paths-ignore`: if a pr doesn't touch a certain filepath, you can skip the workflow.
  - problem: "touching" a filepath is calculated as pr HEAD - base. once a pr touches be, every push counts as touching be
  - you can't skip the workflow if your CI is all in one workflow
  - a skipped workflow never reports its required checks, so the pr sits on "pending" forever
- `dorny/paths-filter`: same idea, but per job instead of per workflow. one early job checks which paths changed, and every other job reads its output to decide whether to run.
  - problem: same "touching" math: pr HEAD - base. a push that only touches fe still reruns be if the pr touched be earlier
- gha native `concurrency` with `cancel-in-progress`: a new push cancels the old run.
  - problem: it cancels the whole run. if A's fe job was 90% done and still valid, it dies anyway
  - this is literally case 1. the "fix" makes it worse
- `fkirc/skip-duplicate-actions`: skips a run if an identical tree already ran green.
  - problem: it reuses whole runs, not jobs. if A got cancelled, or one unrelated job went red, none of A's passing jobs count
- build tools with remote caching (bazel, turborepo, nx): hash every task's inputs, skip the task if that hash already passed. this is the right idea.
  - problem: you have to adopt the build tool. bazel means rewriting your build, and turbo/nx are js-first
  - our backend is pytest called from make, so it was never going to be a bazel target

every one of these answers "did this pr touch X?". what i actually want to know is "did X already pass?"

# my solution

[supersonic-ci](https://github.com/Dryft-AI/supersonic-ci): skip a lane when the exact files it depends on already passed, no matter which commit, branch, or pr they passed on.

- each lane is a list of paths it depends on, e.g. `backend: [backend, common, .github/workflows/ci.yml]`
- each lane gets a hash: `git ls-files --stage` over its paths, so the blob hash of every file the lane reads. same files = same hash, regardless of where they came from
- `check`: one step, early in CI, hashes every lane and looks each hash up. found = skip the lane
- `record`: goes at the top of every lane's job. when the job finishes, and only if every step in it passed, it saves a record under the lane's hash. a failed or cancelled job saves nothing, so a skip always rests on a real pass

```yaml
- id: check
  uses: Dryft-AI/supersonic-ci/check@main
  with:
    shared: true
    lanes: |
      backend: [backend, common, .github/workflows/ci.yml]
      frontend: [frontend, .github/workflows/ci.yml]
```

replaying case 1 from above:

```
push A   touches fe + be
         fe passes, records its hash
         be still running
push B   touches be only, cancels A
         fe: same hash as A's, record found, skipped
         be: new hash, runs
```

and case 2 is free: B touches be only, so fe hashes the same as A's green fe, and fe skips.

# my first try was too expensive

my first version gave every lane its own gate job, and the gates could do more: wait for an identical job already running instead of starting a new one, and kill a job once a newer push made it stale. it benchmarked well. then it shipped and the bill went up.

- gates are jobs, and jobs are billed by the minute, rounded up. 7 gates × ~20s of work = ~7 billed minutes on every push, before any real work starts
- billed minutes per pr run went from 13.2 to 20.6
- i replayed every CI run from jul 1 to oct 1 (16,875 of them) to see what was even on the table. only 5.7% of lane minutes were reruns of inputs that had already passed. path filters were already catching most of the obvious waste
- so 7 gate jobs would have cost ~118,000 minutes over those 3 months to save 9,000 to 16,000. the gates cost about 7x what they could save

the fix was the vocab lesson: steps are cheap, jobs aren't. the gates collapsed into one `check` step inside a job every run already starts (~1s), and waiting got cut.

# caching and artifacting was needed

a pass record is tiny, it just has to live somewhere the next run can find it.

- attempt 1: the gha cache, keyed `supersonic-ci-<lane>-<hash>`. lookup only, nothing gets downloaded
  - problem 1: the cache is branch-scoped. a pr can read its own branch's cache and main's, but main can never read a pr's. so the push to main after a merge reruns everything the pr just passed, on the exact same files
  - problem 2: our runners are blacksmith, which quietly redirects the actions cache on its machines to its own cache. records were written on blacksmith, but the gates ran on github-hosted runners and looked in github's cache. in the first ~day, 1,897 of 1,900 gate decisions were "run", and 736 of those had a matching pass sitting in the other cache. github's cache held 2,373 supersonic keys and 0 passes
- attempt 2: artifacts. with `shared: true`, `record` also uploads a one-line artifact named after the hash, and `check` falls back to asking the artifacts api for an unexpired artifact with that name. artifacts are repo-wide instead of branch-scoped, and blacksmith doesn't reroute them

# pr + main = lots of dedupe

we run CI on every pr push, then again when the pr merges to main. if the pr was up to date with main, the merge produces the same files lane for lane, so main's run is mostly a rerun of work the pr just did.

with shared artifacts, main skips it:

- 56% of runs on main skipped at least one lane
- ~4 runner minutes saved per merge, on average
- median time to green on main went from 3.9 to 1.0 min

# preliminary savings

oct 1 to oct 13, 2,932 CI runs. "saved" means a lane the path filter would have run, but supersonic skipped, valued at that lane's median runtime.

| | runner minutes |
|---|---|
| saved on pr runs | 3,554 |
| saved on merges to main | 1,472 |
| **saved, total** | **5,026** |
| supersonic's own cost (the 7 gates, check + record steps) | 1,943 |
| **net saved** | **~3,080** |

| median time to green | before | after |
|---|---|---|
| merge to main | 3.9 min | 1.0 min |
| pr push | 4.3 min | 3.6 min |

the pr number is mostly teammates making lanes faster, not supersonic. a pr run only finishes sooner if every lane on its critical path skips, which is rare since the pr is usually the thing that changed those lanes.

# caveats & closing

in hindsight, our solution had to be handrolled because we partially made the problem harder on ourselves. 

- arbitrary restriction to preserve only one workflow for all of our CI (i.e. we have a diff definition of workflows than gh)
- i chose to tackle this problem agnostic of the work done within our CI, and instead targetted high-level CI problems
  - our build steps were not created with remote caching in mind

and some caveats with supersonic itself:

- the lane paths are the whole contract. if a test reads a file outside its lane's paths, changing that file won't rerun the test. the runner image, tool versions, and secrets aren't hashed either, so anything that changes a job's outcome has to go into its paths or a salt
- case 1 is only half solved. if A's fe job finishes before B cancels it, B skips fe. if it's still running, the cancel kills it and B starts fe from zero. the first try's waiting would have fixed that, but waiting holds a runner, and the replay said it would only recover another ~4.5% of lane minutes
- a flaky test that passes once records a pass, and identical inputs never run it again. supersonic will happily hide a flake until something in its lane changes
- shared passes are only as trustworthy as every workflow in the repo, since any workflow can upload an artifact with any name. don't turn on `shared` if forks can run your CI
- records expire. cache entries unused for 7 days get evicted, and artifacts are kept for 7 days
- the numbers above are preliminary. under two weeks of data, a skip is valued at a median (a model, not a measurement), these are runner minutes not billed minutes, and a teammate's big CI refactor landed mid-window
- the biggest waste was never reruns. cancelled runs were ~17% of all CI minutes in the replay, and most of them were testing code a newer push had already changed, so there was nothing to dedupe

ci cannot be that hard for monorepos, and it isn't really. the hard part is that gha bills you a minute just to ask the question.

ps: the vocab diagram up top was made with [graph](https://graph.isaacchacko.com), a thing i built to render nice-looking graphs for CS work :)
