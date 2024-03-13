const core = require('@actions/core')

const stripVersion = version => {
  // major.minor.patch
  // major.minor.patch-preview.1
  const parts = version.split('-')

  const numbers = parts[0].split('.')
  const major = numbers[0]
  const minor = numbers[1]
  const patch = numbers[2]

  if (parts.length === 2 && parts[1].startsWith('preview')) {
    const isPreview = true
    const previewVersion = parts[1].split('.')[1]
    return { major, minor, patch, isPreview, previewVersion }
  }

  return {
    major,
    minor,
    patch,
    isPreview: false,
    previewVersion: null
  }
}

const checkVersionFormat = version => {
  const parts = version.split('-')

  if (parts.length > 2) {
    core.setFailed('Invalid version format')
  }

  const numbers = parts[0].split('.')
  if (numbers.length !== 3) {
    core.setFailed('Invalid version format')
  }

  for (const number of numbers) {
    if (isNaN(number)) {
      core.setFailed('Invalid version format')
    }
  }

  if (parts.length === 2) {
    const previewParts = parts[1].split('.')
    if (previewParts.length !== 2) {
      core.setFailed('Invalid version format')
    }
    if (previewParts[0] !== 'preview') {
      core.setFailed('Invalid version format')
    }
    if (isNaN(previewParts[1])) {
      core.setFailed('Invalid version format')
    }
  }
}

const getLatestReleases = releases => {
  // Stable release: <major>.<minor>.<patch>
  // Preview release: <major>.<minor>.<patch>-preview.<number>
  let latestStableRelease = null
  let latestPreviewRelease = null

  for (const release of releases) {
    if (/^\d+\.\d+\.\d+$/.test(release.tag_name)) {
      if (
        !latestStableRelease ||
        compareVersions(release.tag_name, latestStableRelease) > 0
      ) {
        latestStableRelease = release.tag_name
      }
    } else if (/^\d+\.\d+\.\d+-preview\.\d+$/.test(release.tag_name)) {
      if (
        !latestPreviewRelease ||
        compareVersions(release.tag_name, latestPreviewRelease) > 0
      ) {
        latestPreviewRelease = release.tag_name
      }
    }
  }

  return { latestStableRelease, latestPreviewRelease }
}

const compareVersions = (versionA, versionB) => {
  const partsA = versionA.split('.').map(part => parseInt(part))
  const partsB = versionB.split('.').map(part => parseInt(part))

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0
    const partB = partsB[i] || 0

    if (partA < partB) {
      return -1
    } else if (partA > partB) {
      return 1
    }
  }

  return 0
}

module.exports = { stripVersion, checkVersionFormat }
