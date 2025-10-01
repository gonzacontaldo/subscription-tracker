# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Harden authentication, introduce automated testing, and polish accessibility (planned).

## [1.0.0] - 2025-09-30

### Added

- User accounts with local credential storage and avatar management.
- Subscription CRUD with categories, notes, billing cadence, and automatic date rollovers.
- Expo notification reminders with configurable lead times.
- Analytics dashboard with donut chart, category breakdowns, and highlights.
- Responsive theming helpers, primary button, subscription card, and donut chart components.

### Changed

- Restyled the home experience with summaries, grouping, and quick actions.
- Integrated authentication-aware navigation (auth + drawer stacks).

### Fixed

- Applied linting, formatting, and pre-commit enforcement via Husky and lint-staged.
