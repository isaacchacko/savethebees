---
title: ci cannot be that hard for monorepos
date: 2026-09-30
description: all my homies hate gha
---

(wip)

# ci cannot be that hard for monorepos

apparently there's no simple solution for github actions that defines a system where you can have the cross of:

- multiple "lanes" of ci (infra, be, fe, etc)
- no unnecessary ci runs

## what makes a run unnecessary

say there's commit A (touching fe/be) and commit B (be only).

- if A in progress, B arrives: wasteful to cancel A's fe run
- if A finished (all green), B arrives: wasteful to start a fresh fe run

## how gha hurts
