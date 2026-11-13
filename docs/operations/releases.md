# Releases

Liberture uses semantic versions. Use a patch for compatible fixes, a minor version for compatible features, and a major version for breaking changes to supported interfaces or upgrade paths. During 0.x development, use a minor bump for breaking changes and document the migration explicitly.

## Publish

1. Set the version in `package.json`. Add a matching section to the [changelog](../../CHANGELOG.md), newest first. Describe user-visible changes, operational changes and any required migration or rollback precautions.
2. Merge and push the release commit to `master`. Fetch the remote and confirm the release commit matches `origin/master`. From the release commit, run the commands below to publish its annotated tag and use its changelog entry for the GitHub Release.

```sh
set -eu
git fetch origin master --tags
version=$(node -p "require('./package.json').version")
tag="v$version"
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/master)"
notes=$(mktemp)
awk -v heading="## $version" '$0 == heading { found=1; next } found && /^## / { exit } found { print }' CHANGELOG.md > "$notes"
test -s "$notes"
git tag -a "$tag" HEAD -m "Liberture $version"
git push origin "refs/tags/$tag"
gh release create "$tag" --verify-tag --title "Liberture $tag" --notes-file "$notes"
rm "$notes"
```

3. Follow the [deployment workflow](../../.github/workflows/deploy.yml). Publishing a stable release starts the workflow. CI verifies the tag, package version, changelog and commit ancestry, runs the tests and builds with Node 24 and pnpm 10. It sends the artifact over SSH to the production host, which prepares the database, switches the active release and probes the books API.
4. Locate the release run with `gh run list --workflow deploy.yml --event release --branch "$tag"`, then use `gh run watch RUN_ID --exit-status`. After success, confirm that the public health endpoint reports the intended version and that a database-backed endpoint returns successfully.

```sh
curl -fsS https://liberture.com/api/health | jq -e --arg version "$version" '.status == "ok" and .version == $version'
curl -fsS https://liberture.com/api/books > /dev/null
```

If the workflow fails, inspect its failed step with `gh run view RUN_ID --log-failed`. A failure before the host switches releases leaves the previous version active. If the host probe fails after the switch, the deployment script attempts to reactivate the previous release. Check the public endpoints after recovery. Retry a transient infrastructure failure with `gh run rerun RUN_ID --failed`. Keep published tags immutable and publish a new patch version for a code correction. Switching application versions leaves database changes in place. For database recovery, follow the [production operations guide](production.md).
