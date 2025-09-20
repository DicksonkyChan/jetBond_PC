# JetBond Development - Lessons Learned

## WSL Development Environment

### ❌ Common Mistake
- **DON'T** use `wsl` commands when already inside WSL environment
- **DON'T** use `wsl bash -c "command"` - this is redundant

### ✅ Correct Approach
- We're already in WSL (Ubuntu) when working in `~/jetBond`
- Use commands directly: `aws cli`, `npm install`
- No need for `wsl` prefix or wrapper commands

### Example
```bash
# ❌ Wrong (when already in WSL)
wsl bash -c "cd /home/dichan/jetBond && npm install"

# ✅ Correct (when already in WSL)
npm install
```

## AWS Lambda vs App Runner

### Lambda Issues Encountered
- **Package Size Limit**: 250MB unzipped causes constant deployment failures
- **SDK Version Conflicts**: Node.js 18 runtime doesn't include AWS SDK v2
- **Dependency Hell**: Back and forth between SDK v2 and v3
- **Cold Starts**: Additional latency for infrequent requests

### App Runner Benefits
- **No Package Limits**: Up to 10GB container images
- **Consistent Environment**: Use any Node.js version and dependencies
- **Simpler Deployment**: Single container vs multiple Lambda functions
- **Better for APIs**: Express.js is more natural than Lambda handlers

### Decision
Switched from AWS Lambda to App Runner for JetBond backend API.

## Development Workflow
1. Work directly in WSL environment (`~/jetBond`)
2. Use native commands without WSL wrappers
3. Test locally before deploying to cloud
4. Use containerization for consistent deployments

---
*Updated: January 2025*