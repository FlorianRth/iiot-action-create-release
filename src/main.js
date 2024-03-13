const core = require('@actions/core')
const github = require('@actions/github')
const helpers = require('./helpers')

async function run() {
  try {
    const version = core.getInput('version', { required: true })
    helpers.checkVersionFormat(version)
    const token = core.getInput('token', { required: true })
    const releaseToken = core.getInput('release-token', { required: true })
    const strippedVersion = helpers.stripVersion(version)
    const octokit = github.getOctokit(token)
    const releaseOctokit = github.getOctokit(releaseToken)
    const payload = github.context.payload

    if (!payload.pull_request.merged) {
      core.setFailed('No merge detected - No release will be created.')
      process.exit()
    }

    if (!payload.pull_request) {
      throw new Error('This event is not a pull request event.')
    }

    const destinationBranch = payload.pull_request.base.ref
    helpers.validateVersion(strippedVersion, destinationBranch)

    const releases = await octokit.rest.repos.listReleases({
      owner: payload.repository.owner.login,
      repo: payload.repository.name
    })

    const latestReleases = helpers.getLatestReleases(releases.data)

    if (destinationBranch === 'develop') {
      if (
        helpers.isVersionAGreaterThanVersionB(
          version,
          latestReleases.latestPreviewRelease
        )
      ) {
        console.log(
          'Higher preview version detected - Release will be created ...'
        )
        const response = await helpers.createRelease(
          releaseOctokit,
          version,
          destinationBranch,
          version,
          `TEST Automated release for version ${version} \\(°-°)/`
        )

        console.log(`Release created: ${response.html_url}`)
        return
      }
      console.log(
        'Preview version is not higher than the latest preview release - No release will be created.'
      )
    }
    if (destinationBranch === 'master' || destinationBranch === 'main') {
      if (
        helpers.isVersionAGreaterThanVersionB(
          version,
          latestReleases.latestStableRelease
        )
      ) {
        console.log(
          'Higher stable version detected - Release will be created ...'
        )
        const response = await helpers.createRelease(
          releaseOctokit,
          version,
          destinationBranch,
          version,
          `TEST Automated release for version ${version} \\(°-°)/`
        )

        console.log(`Release created: ${response.html_url}`)
        return
      }
      console.log(
        'Stable version is not higher than the latest stable release - No release will be created.'
      )
    }

    console.log('Latest stable release: ', latestReleases.latestStableRelease)
    console.log('Latest preview release: ', latestReleases.latestPreviewRelease)
    console.log('Destination branch: ', destinationBranch)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
