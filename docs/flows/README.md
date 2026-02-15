# User Flows

Semantic user flow specs — the source of truth for how the app should behave.

## Purpose
1. **Document** every core interaction path
2. **Generate** Playwright tests from these specs
3. **Repair** broken tests by updating the flow spec first (if behavior changed intentionally), then regenerating tests

## Format
Each flow is a `.md` file with numbered steps (user actions) and assertions (expected outcomes). See any flow file for the structure.

## Flows → Tests
- Flow specs: `docs/flows/*.md`
- Playwright tests: `tests/flows/*.spec.js`
- Tests mirror flows 1:1 — each step becomes a test action, each assertion becomes an `expect()`

## Adding a Flow
1. Create `docs/flows/<flow-name>.md`
2. Define steps + assertions
3. Generate or update the corresponding test in `tests/flows/`
