const core = require('@actions/core')
const github = require('@actions/github')
const helpers = require('./helpers')

async function run() {
  try {
    const version = core.getInput('version', { required: true })
    helpers.checkVersionFormat(version)
    const token = core.getInput('token', { required: true })
    const strippedVersion = helpers.stripVersion(version)
    const octokit = github.getOctokit(token)
    const payload = github.context.payload

    if (!payload.pull_request) {
      throw new Error('This event is not a pull request event.')
    }

    const destinationBranch = payload.pull_request.base.ref

    const releases = await octokit.repos.listReleases({
      owner: payload.repository.owner.login,
      repo: payload.repository.name
    })

    const latestReleases = helpers.getLatestReleases(releases.data)

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
