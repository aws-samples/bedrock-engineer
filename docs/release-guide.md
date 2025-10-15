# Release Guide

This document describes how to release Bedrock Engineer. This release flow uses a release branch and an approval process via Pull Request.

## Release Procedure

### 1. **Version Update**:

- Update the version number in the `package.json` file

  ```json
  {
    "name": "bedrock-engineer",
    "version": "vX.Y.Z", // Update this
    ...
  }
  ```

- Run the `npm i` command to update package-lock.json as well.

```bash
npm i
```

- Update the version references in README.md and README-ja.md.

### 2. **Create Release Branch**:

```bash
# Start from the latest main branch
git checkout main
git pull

# Create release branch
git checkout -b release/vX.Y.Z

# Commit version update
git add .
git commit -m "chore: update version to X.Y.Z"

# Push release branch
git push origin release/vX.Y.Z
```

### 3. **Monitor Build and Draft Release Creation**:

- Pushing the release branch will automatically trigger the `Build Draft Release` workflow in GitHub Actions
- Check the progress in the [Actions tab](https://github.com/aws-samples/bedrock-engineer/actions)
- When the workflow completes successfully, the following will happen automatically:
  1. Mac and Windows builds are executed
  2. A draft release is created with the build artifacts attached

### 4. **Verify Release and Create PR**:

- Access the draft release and verify the build artifacts (.dmg, .pkg, .exe) and contents
- Review the release notes
- If everything looks good, manually create a PR:

  ```bash
  # Create from release branch
  gh pr create \
    --title "Release vX.Y.Z" \
    --body "## Release vX.Y.Z is ready

    This PR will publish release vX.Y.Z when merged.

    ### Draft Release
    [View on release page](paste URL here)

    Build artifacts verified:
    - [ ] Mac version
    - [ ] Windows version
    " \
    --base main \
    --head release/X.Y.Z
  ```

### 5. **Publish Release**:

- When the PR is merged, the `Publish Release` workflow will automatically execute and publish the draft release
- You can verify the published release on the [Releases page](https://github.com/aws-samples/bedrock-engineer/releases)

## Troubleshooting

### If Build Fails:

1. Check the GitHub Actions logs to identify the issue
2. Fix the release branch and push again
3. If the problem persists, you can delete the release branch and start over

### If There's an Issue with the Draft Release and You Don't Want to Merge the PR:

1. Close the PR (without merging)
2. Delete the draft release if necessary:

```bash
gh release delete vX.Y.Z
```

3. Fix the issue, update the release branch, and push

### If Release Publication Fails After Merge:

1. Check the GitHub Actions logs to identify the issue
2. Manually publish the release if necessary:

```bash
gh release edit vX.Y.Z --draft=false
```

## Versioning Rules

Follow [Semantic Versioning](https://semver.org/):

- **Major version (X)**: Incompatible changes
- **Minor version (Y)**: Backward compatible feature additions
- **Patch version (Z)**: Backward compatible bug fixes
