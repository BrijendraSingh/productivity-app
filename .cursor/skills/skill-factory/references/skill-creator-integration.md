# /skill-creator Integration Guide

How the skill-factory integrates with the /skill-creator methodology for testing and iterating on skills.

## Overview

The /skill-creator (installed at `~/.agents/skills/skill-creator/`) provides a complete toolkit for:

- Drafting skills with proper YAML frontmatter
- Running test prompts against skills via subagents
- Grading outputs with quantitative assertions
- Aggregating benchmarks across iterations
- Reviewing results in a browser-based viewer
- Iterating until quality is acceptable
- Optimizing skill descriptions for trigger accuracy

## Test-Iterate Loop

The skill-factory follows this loop for each new specialist:

### 1. Draft the Skill

Create the SKILL.md with all required sections. The initial draft comes from the domain proposal (project-scanner output) combined with the skill-factory's knowledge of good skill patterns.

### 2. Write Test Prompts

Create 2-3 realistic test prompts — what a real user would actually type when working in this domain. Good test prompts are:

- Specific with context (file paths, variable names, project-specific details)
- Varied in complexity (simple, moderate, complex)
- Representative of actual usage patterns

Bad test prompts: vague, abstract, or obviously simple requests.

### 3. Run Test Cases

For each test prompt, spawn a subagent via the Task tool that:

1. Reads the SKILL.md
2. Follows its instructions to accomplish the test prompt
3. Saves outputs to a workspace directory

Optionally run baseline (without-skill) cases for comparison.

### 4. Evaluate Results

Check each run's output:

- Did the specialist follow the skill's workflow?
- Was the output format correct?
- Were learnings read and written properly?
- Did the specialist handle edge cases in the prompt?

For quantitative evaluation, the skill-creator provides:

- `agents/grader.md` — assertion evaluation protocol
- `scripts/aggregate_benchmark.py` — benchmark aggregation
- `eval-viewer/generate_review.py` — browser-based review UI

### 5. Iterate

Based on evaluation results:

- Remove instructions that didn't help or caused confusion
- Add clarification where the specialist went off-track
- Improve "why" explanations so the model generalizes better
- Tighten halt conditions that were too loose
- Add examples where output quality was inconsistent

### 6. Description Optimization (Optional)

After the skill body is stable, optimize the YAML `description` for trigger accuracy using:

- `scripts/run_loop.py` — automated description optimization
- `assets/eval_review.html` — trigger eval review UI

## When to Use Full /skill-creator vs Lightweight Testing

**Full /skill-creator flow** (grading, benchmarks, viewer):

- The skill is complex with many steps
- Output quality is critical and needs quantitative measurement
- The skill will be used frequently and needs high reliability
- You're comparing multiple approaches

**Lightweight testing** (just run a few test prompts):

- The skill is simple with a clear workflow
- The domain is well-understood
- Quick iteration is more valuable than rigorous measurement
- This is an early draft and you'll do rigorous testing later

The skill-factory defaults to lightweight testing for initial drafts and escalates to full /skill-creator when the user requests it or when initial lightweight tests reveal issues.
