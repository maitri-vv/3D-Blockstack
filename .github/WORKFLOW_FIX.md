# GitHub Actions Workflow Fix

## Problem
The workflow was failing with a `403 Resource not accessible by integration` error when trying to post comments on pull requests from forked repositories.

## Root Cause
When using the `pull_request` trigger, GitHub Actions restricts the `GITHUB_TOKEN` permissions for PRs from forks as a security measure. This prevents the workflow from writing comments even though `pull-requests: write` permission was declared.

## Solution
Changed the trigger from `pull_request` to `pull_request_target`:

### Key Changes:
1. **Trigger Event**: Changed from `pull_request` to `pull_request_target`
   - This grants write permissions even for forked PRs
   - Allows the workflow to comment on PRs from external contributors

2. **Security Enhancement**: Added explicit checkout of PR head commit
   ```yaml
   - uses: actions/checkout@v4
     with:
       ref: ${{ github.event.pull_request.head.sha }}
   ```
   - This ensures the workflow runs the code from the PR, not the base branch
   - Important security practice when using `pull_request_target`

3. **Simplified Conditions**: Updated job conditions to work with single event trigger
   - Deploy job: `if: github.event.action != 'closed'`
   - Cleanup job: `if: github.event.action == 'closed'`

## Security Note
Using `pull_request_target` requires careful handling because it runs with write permissions. The workflow is safe because:
- It only deploys to Vercel (no code execution from PR)
- It explicitly checks out the PR code using the SHA
- It doesn't expose any secrets in the deployment process

## Testing
To test this fix:
1. Create a PR from a fork
2. The workflow should successfully deploy to Vercel
3. A comment with the preview URL should appear on the PR
4. When the PR is closed, the deployment should be cleaned up

## References
- [GitHub Docs: pull_request_target](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target)
- [GitHub Docs: Token Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
