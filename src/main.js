const core = require('@actions/core')
const github = require('@actions/github')
const helpers = require('./helpers')

async function run() {
  try {
    const version = core.getInput('version', { required: true })
    helpers.checkVersionFormat(version)
    const token = core.getInput('token', { required: true })
    const generateReleaseNotes = core.getInput('generate-release-notes', {
      required: false
    })
    const strippedVersion = helpers.stripVersion(version)
    const octokit = github.getOctokit(token)
    const payload = github.context.payload

    const destinationBranch = github.context.ref.replace('refs/heads/', '')
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
          octokit,
          version,
          destinationBranch,
          version,
          `Automated release for version ${version}`,
          generateReleaseNotes
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
          octokit,
          version,
          destinationBranch,
          version,
          `Automated release for version ${version}`,
          generateReleaseNotes
        )

        console.log(`Release created: ${response.html_url}`)
        return
      }
      console.log(
        'Stable version is not higher than the latest stable release - No release will be created.'
      )
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
