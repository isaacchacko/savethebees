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

- workflows: the list of items you see on the Actions tab in github. a workflow is just a static definition of CI, while the rest of the vocab below is related to the process of actually running CI
- run: one execution of a workflow
- job: a workflow defines a list of jobs, each with an optional pre-requisite `needs` parameter pointing to another job in the workflow. with `needs`, gha calculates the DAG and then is able to run independent jobs concurrently while those with `needs` block
- step: not used in this post, but is work done sequentially within a job. cheaper than jobs because while each job uses its own VM, steps of a job run within the same VM
- actions: pre-defined steps defined by other people on github. you can source pre-defined actions by `owner/repo/path@ref` (what i do for supersonic-ci!)

**what makes a run unnecessary**

say there's commit A (touching fe/be) and commit B (be only).

- if A in progress, B arrives: wasteful to cancel A's fe run
- if A finished (all green), B arrives AND B doesn't touch fe: wasteful to start a fresh fe run

in reality, default gha behavior is not built for this. actions refire on every commit, wasting lots of runner minutes.

there's of course many solutions out there to mitigate the loss. 

- gha native `paths-ignore`: if a pr doesn't touch a certain filepath, you can skip the workflow. problem: "touching" a filepath is calculated as pr HEAD - base, and you can't skip the workflow if your CI is all in one workflow
- `dorny/paths-filter`: 
- 

**gha makes things hard**
