---
title: CI cannot be that hard for monorepos
date: 2026-09-30
description: All my homies hate GHA
---

# CI cannot be that hard for monorepos

Apparently there's no simple solution for GitHub Actions that defines a system where you can have the cross of:

- Multiple "lanes" of CI (infra, BE, FE, etc)
- No unnecessary CI runs/work

I couldn't find a good pre-built solution for what we were struggling with, so I made my own handrolled solution :(

Skip the vocab lesson if you'd like.

# Enrichment: vocab lesson for GitHub Actions

```graph title="the vocab, as a graph"
workflow {gold 3} -> run 1 {tomato 2}, run 2 {tomato 2}
run 1 -> job A {dodgerblue 1.5}, job B {dodgerblue 1.5}
job B -(needs)-> job A
job A -> step 1 {mediumseagreen}, step 2 {mediumseagreen}
step 1 -(uses)-> action {orchid}
step 2 -(run)-> shell command {silver}
```

- Workflows: the list of items you see on the Actions tab in GitHub. A workflow is just a static definition of CI, while the rest of the vocab below is related to the process of actually running CI
- Run: one execution of a workflow
- Job: a workflow defines a list of jobs, each with an optional pre-requisite `needs` parameter pointing to another job in the workflow. With `needs`, GHA calculates the DAG and then is able to run independent jobs concurrently while those with `needs` block
- Step: work done sequentially within a job. Cheaper than jobs because while each job uses its own VM, steps of a job run within the same VM
- Actions: pre-defined steps defined by other people on GitHub. You can source pre-defined actions by `owner/repo/path@ref` (what I do for supersonic-ci!)

# What makes a run unnecessary

Say there's commit A (touching FE/BE) and commit B (BE only).

- If A in progress, B arrives: wasteful to cancel A's FE run
- If A finished (all green), B arrives: wasteful to start a fresh FE run

In reality, default GHA behavior is not built for this, wasting lots of runner minutes (you're billed by jobs' elapsed time in minutes).

# Staquo sucks

There's of course many solutions out there to mitigate the loss. 

- GHA native `paths-ignore`: if a PR doesn't touch a certain filepath, you can skip the workflow.
  - Problem: "touching" a filepath is calculated as PR HEAD - base. Once a PR touches BE, every push counts as touching BE
  - You can't skip the workflow if your CI is all in one workflow
  - A skipped workflow never reports its required checks, so the PR sits on "pending" forever
- `dorny/paths-filter`: same idea, but per job instead of per workflow. One early job checks which paths changed, and every other job reads its output to decide whether to run.
  - Problem: same "touching" math: PR HEAD - base. A push that only touches FE still reruns BE if the PR touched BE earlier
- GHA native `concurrency` with `cancel-in-progress`: a new push cancels the old run.
  - Problem: it cancels the whole run. If A's FE job was 90% done and still valid, it dies anyway
  - This is literally case 1. The "fix" makes it worse
- `fkirc/skip-duplicate-actions`: skips a run if an identical tree already ran green.
  - Problem: it reuses whole runs, not jobs. If A got cancelled, or one unrelated job went red, none of A's passing jobs count
- Build tools with remote caching (Bazel, Turborepo, Nx): hash every task's inputs, skip the task if that hash already passed. This is the right idea.
  - Problem: you have to adopt the build tool. Bazel means rewriting your build, and Turbo/Nx are JS-first
  - Our backend is pytest called from make, so it was never going to be a Bazel target

Every one of these answers "did this PR touch X?". What I actually want to know is "did X already pass?"

# My solution

[supersonic-ci](https://github.com/Dryft-AI/supersonic-ci): skip a lane when the exact files it depends on already passed, no matter which commit, branch, or PR they passed on.

- Each lane is a list of paths it depends on, e.g. `backend: [backend, common, .github/workflows/ci.yml]`
- Each lane gets a hash: `git ls-files --stage` over its paths, so the blob hash of every file the lane reads. Same files = same hash, regardless of where they came from
- `check`: one step, early in CI, hashes every lane and looks each hash up. Found = skip the lane
- `record`: goes at the top of every lane's job. When the job finishes, and only if every step in it passed, it saves a record under the lane's hash. A failed or cancelled job saves nothing, so a skip always rests on a real pass

```yaml
- id: check
  uses: Dryft-AI/supersonic-ci/check@main
  with:
    shared: true
    lanes: |
      backend: [backend, common, .github/workflows/ci.yml]
      frontend: [frontend, .github/workflows/ci.yml]
```

Replaying case 1 from above:

```
push A   touches fe + be
         fe passes, records its hash
         be still running
push B   touches be only, cancels A
         fe: same hash as A's, record found, skipped
         be: new hash, runs
```

And case 2 is free: B touches BE only, so FE hashes the same as A's green FE, and FE skips.

# My first try was too expensive

My first version gave every lane its own gate job, and the gates could do more: wait for an identical job already running instead of starting a new one, and kill a job once a newer push made it stale. It benchmarked well. Then it shipped and the bill went up.

- Gates are jobs, and jobs are billed by the minute, rounded up. 7 gates × ~20s of work = ~7 billed minutes on every push, before any real work starts
- Billed minutes per PR run went from 13.2 to 20.6
- I replayed every CI run from Jul 1 to Oct 1 (16,875 of them) to see what was even on the table. Only 5.7% of lane minutes were reruns of inputs that had already passed. Path filters were already catching most of the obvious waste
- So 7 gate jobs would have cost ~118,000 minutes over those 3 months to save 9,000 to 16,000. The gates cost about 7x what they could save

The fix was the vocab lesson: steps are cheap, jobs aren't. The gates collapsed into one `check` step inside a job every run already starts (~1s), and waiting got cut.

# Caching and artifacting was needed

A pass record is tiny, it just has to live somewhere the next run can find it.

- Attempt 1: the GHA cache, keyed `supersonic-ci-<lane>-<hash>`. Lookup only, nothing gets downloaded
  - Problem 1: the cache is branch-scoped. A PR can read its own branch's cache and main's, but main can never read a PR's. So the push to main after a merge reruns everything the PR just passed, on the exact same files
  - Problem 2: our runners are Blacksmith, which quietly redirects the actions cache on its machines to its own cache. Records were written on Blacksmith, but the gates ran on GitHub-hosted runners and looked in GitHub's cache. In the first ~day, 1,897 of 1,900 gate decisions were "run", and 736 of those had a matching pass sitting in the other cache. GitHub's cache held 2,373 supersonic keys and 0 passes
- Attempt 2: artifacts. With `shared: true`, `record` also uploads a one-line artifact named after the hash, and `check` falls back to asking the artifacts API for an unexpired artifact with that name. Artifacts are repo-wide instead of branch-scoped, and Blacksmith doesn't reroute them

# PR + main = lots of dedupe

We run CI on every PR push, then again when the PR merges to main. If the PR was up to date with main, the merge produces the same files lane for lane, so main's run is mostly a rerun of work the PR just did.

With shared artifacts, main skips it:

- 56% of runs on main skipped at least one lane
- ~4 runner minutes saved per merge, on average
- Median time to green on main went from 3.9 to 1.0 min

# Preliminary savings

Oct 1 to Oct 13, 2,932 CI runs. "Saved" means a lane the path filter would have run, but supersonic skipped, valued at that lane's median runtime.

| | Runner minutes |
|---|---|
| Saved on PR runs | 3,554 |
| Saved on merges to main | 1,472 |
| **Saved, total** | **5,026** |
| Supersonic's own cost (the 7 gates, check + record steps) | 1,943 |
| **Net saved** | **~3,080** |

| Median time to green | Before | After |
|---|---|---|
| Merge to main | 3.9 min | 1.0 min |
| PR push | 4.3 min | 3.6 min |

The PR number is mostly teammates making lanes faster, not supersonic. A PR run only finishes sooner if every lane on its critical path skips, which is rare since the PR is usually the thing that changed those lanes.

# Caveats & closing

In hindsight, our solution had to be handrolled because we partially made the problem harder on ourselves. 

- Arbitrary restriction to preserve only one workflow for all of our CI (i.e. we have a diff definition of workflows than GH)
- I chose to tackle this problem agnostic of the work done within our CI, and instead targetted high-level CI problems
  - Our build steps were not created with remote caching in mind

And some caveats with supersonic itself:

- The lane paths are the whole contract. If a test reads a file outside its lane's paths, changing that file won't rerun the test. The runner image, tool versions, and secrets aren't hashed either, so anything that changes a job's outcome has to go into its paths or a salt
- Case 1 is only half solved. If A's FE job finishes before B cancels it, B skips FE. If it's still running, the cancel kills it and B starts FE from zero. The first try's waiting would have fixed that, but waiting holds a runner, and the replay said it would only recover another ~4.5% of lane minutes
- A flaky test that passes once records a pass, and identical inputs never run it again. Supersonic will happily hide a flake until something in its lane changes
- Shared passes are only as trustworthy as every workflow in the repo, since any workflow can upload an artifact with any name. Don't turn on `shared` if forks can run your CI
- Records expire. Cache entries unused for 7 days get evicted, and artifacts are kept for 7 days
- The numbers above are preliminary. Under two weeks of data, a skip is valued at a median (a model, not a measurement), these are runner minutes not billed minutes, and a teammate's big CI refactor landed mid-window
- The biggest waste was never reruns. Cancelled runs were ~17% of all CI minutes in the replay, and most of them were testing code a newer push had already changed, so there was nothing to dedupe

CI cannot be that hard for monorepos, and it isn't really. The hard part is that GHA bills you a minute just to ask the question.

PS: the vocab diagram up top was made with [graph](https://graph.isaacchacko.com), a thing I built to render nice-looking graphs for CS work :)
