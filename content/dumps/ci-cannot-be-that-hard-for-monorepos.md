---
title: ci cannot be that hard for monorepos
date: 2026-09-30
description: all my homies hate gha
---

(wip)

# ci cannot be that hard for monorepos

apparently there's no simple solution for github actions that defines a system where you can have the cross of:

- multiple "lanes" of ci (infra, be, fe, etc)
- no unnecessary ci runs/work

i couldn't find a good pre-built solution for what we were struggling with, so i made my own handrolled solution :(

skip the vocab lesson if you'd like.

**enrichment: vocab lesson for github actions**
![example diagram of vocab hierarchy](/images/ci-cannot-be-that-hard-for-monorepos-mv6ziu0k.webp)
- workflows: the list of items you see on the Actions tab in github. a workflow is just a static definition of CI, while the rest of the vocab below is related to the process of actually running CI
- run: one execution of a workflow
- job: a workflow defines a list of jobs, each with an optional pre-requisite `needs` parameter pointing to another job in the workflow. with `needs`, gha calculates the DAG and then is able to run independent jobs concurrently while those with `needs` block
- step: not used in this post, but is work done sequentially within a job. cheaper than jobs because while each job uses its own VM, steps of a job run within the same VM
- actions: pre-defined steps defined by other people on github. you can source pre-defined actions by `owner/repo/path@ref` (what i do for supersonic-ci!)

**what makes a run unnecessary**

say there's commit A (touching fe/be) and commit B (be only).

- if A in progress, B arrives: wasteful to cancel A's fe run
- if A finished (all green), B arrives: wasteful to start a fresh fe run

in reality, default gha behavior is not built for this, wasting lots of runner minutes (you're billed by jobs' elapsed time in minutes).

**staquo sucks**

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

**my solution**

**caveats & closing**

in hindsight, our solution had to be handrolled because we partially made the problem harder on ourselves. 

- arbitrary restriction to preserve only one workflow for all of our CI (i.e. we have a diff definition of workflows than gh)
- i chose to tackle this problem agnostic of the work done within our CI, and instead targetted high-level CI problems
  - our build steps were not created with remote caching in mind
