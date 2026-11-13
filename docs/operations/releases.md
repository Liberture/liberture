# Releases

Liberture uses semantic versions. Use a patch for compatible fixes, a minor version for compatible features, and a major version for breaking changes to supported interfaces or upgrade paths. During 0.x development, use a minor bump for breaking changes and document the migration explicitly.

## Publish

1. Set the version in `package.json`. Add a matching section to the [changelog](../../CHANGELOG.md), newest first. Describe user-visible changes, operational changes and any required migration or rollback precautions.
2. Merge the release commit to `master`. Fetch the remote and create an annotated tag on that commit. For version 0.2.0 the commands are `git tag -a v0.2.0 origin/master -m "Liberture 0.2.0"` and `git push origin refs/tags/v0.2.0`.
3. Publish a stable GitHub Release for the existing tag. Use that version’s changelog entry as its release notes. A branch push, tag push, draft or prerelease leaves production on its current release.
4. Follow the [deployment workflow](../../.github/workflows/deploy.yml) to completion and check a public database-backed page. If the run fails before deployment, fix the issue and publish a new version. A transient infrastructure failure can be retried for the same release and commit.

Keep published tags immutable. For a code regression, publish a new patch release containing the revert. For a database rollback, follow the [production recovery procedure](production.md).
