# Deployment Guide

This guide provides step-by-step instructions for creating releases and deploying new versions of the Vault Chromium Extension.

## Prerequisites

- Git configured with proper GPG signing.
- Access to GitHub web interface.
- Extension tested and ready for release.
- Updated changelog with new version information.

## Release Process

### 1. Version Management

The extension version is defined in [manifest.json](../src/manifest.json):

```json
{
  "version": "2.0.0"
}
```

### 2. Update Changelog

Before creating a release, update [changelog.md](changelog.md) with:
- New version number and date.
- List of new features, bug fixes, and breaking changes.
- Follow semantic versioning (MAJOR.MINOR.PATCH).

## Versioning Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, major architectural changes.
- **MINOR** (1.Y.0): New features, backward-compatible functionality.
- **PATCH** (1.0.Z): Bug fixes, minor improvements.

## Release Notes Template

Use this template for consistent release notes:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features and functionality.

### Changed
- Changes to existing functionality.

### Deprecated
- Features that will be removed in future versions.

### Removed
- Features that have been removed.

### Fixed
- Bug fixes.

### Security
- Security improvements and vulnerability fixes.
```

### 3. Create Git Tag

Create an annotated tag with the version number:

```bash
# Replace X.Y.Z with the actual version from manifest.json.
git tag -a vX.Y.Z -m "Release version X.Y.Z"

# Push the tag to remote.
git push origin vX.Y.Z
```

**Example for current version:**
```bash
git tag -a v2.0.0 -m "Release version 2.0.0"
git push origin v2.0.0
```

### 4. Create GitHub Release

#### Using GitHub Web Interface

1. Go to your repository on GitHub.
1. Click on "Releases" in the right sidebar.
1. Click "Create a new release".
1. Select the tag you just created (vX.Y.Z).
1. Fill in the release title: "Version X.Y.Z".
1. Copy relevant section from changelog.md into the description.
1. Check "Set as the latest release".
1. Click "Publish release".

### 5. Chrome Web Store Deployment

After creating the GitHub release:

1. **Package the Extension:**
   ```bash
   # Create a zip file of the src directory.
   cd src
   zip -r ../vault-chromium-extension-vX.Y.Z.zip .
   cd ..
   ```

2. **Upload to Chrome Web Store:**
   - Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/).
   - Select your extension.
   - Upload the new zip file.
   - Update store listing if needed.
   - Submit for review.

---

[Go Back.](../README.md)
