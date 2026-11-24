# Changelog

All notable changes to OneJoy are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Engineering setup: CI on every pull request, Dependabot, issue and pull request templates, CODEOWNERS,
  contributing guide, security policy, architecture decision records, Prettier and EditorConfig.

## [0.1.0] - 2026-11-24

First working version (MVP).

### Added

- Shared chapter of the day, with a reading plan site admins can edit.
- "I read it" check-ins and weekly streaks against a personal goal (1–7 days a week).
- Public and private groups with denomination tags, invite links, owners and admins.
- Reading reflections with typed-in scripture, general group posts, replies and prayer reactions.
- Daily global thread for the shared chapter, with an archive of past days.
- "Who read today" row showing friends from your groups.
- Moderation: reports, a moderation queue, remove, warn, mute, ban, blocking, newcomer slow mode and an action log.
- Read-only demo account, settings, account deletion, light and dark mode.
- "Together" visual design with Lucide icons.

### Security

- Row-level security on every table; internal helpers aren't callable by clients.
- Removed content can't be read back through reports; muted and banned users can't edit old posts.
- The demo account's password and email can't be changed; sign-in redirects only go to same-site paths.

[Unreleased]: https://github.com/JacobLiu124/bible-reading-companion/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/JacobLiu124/bible-reading-companion/releases/tag/v0.1.0
