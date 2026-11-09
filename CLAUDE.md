# Working on Probest

## Every change is a pull request that Akira approves

`main` is protected. Never commit to `main`, push to `main`, or merge anything yourself.

1. Start from the latest `main`: `git fetch origin` and branch from `origin/main`.
2. Use one branch per change, named `claude/<short-topic>`.
3. Commit there. Rebuild first (`node build.js`) so `dist/probest.html` matches `src/`.
4. Push the branch and open a pull request against `main` that says what changed and how it was checked.
5. Stop there. Akira reviews the pull request and merges it on GitHub; that merge is the approval.
   Do not merge, approve, enable auto-merge or close the pull request unless Akira asks.
6. If Akira asks for changes, push more commits to the same branch.

Commits use Akira's name as author (`L. Akira Rosa`).

## Before opening a pull request

- Open the built `dist/probest.html` and check the pages you changed, in English and Portuguese.
- Keep every `src/js/locales/*.js` file with the same keys.
- Keep `README.md` and `TODO.md` in step with what the app does.
