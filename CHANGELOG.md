# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of ResyncBase JavaScript client library
- A/B testing functionality with custom logic support
- Configuration management with real-time updates
- Function execution with controlled environment
- Caching system with TTL support
- Cross-platform compatibility (browser, Node.js, React Native)
- Enterprise-grade security features
- Admin-defined assertions and restrictions
- Whitelisted domain API access control

### Features
- `ResyncBase.init()` - Initialize the client
- `ResyncBase.getVariant()` - Get experiment variant
- `ResyncBase.recordConversion()` - Record conversions
- `ResyncBase.executeFunction()` - Execute custom functions
- `ResyncBase.getConfig()` - Get configuration values
- `ResyncBase.subscribe()` - Subscribe to config updates

### Security
- Pure function execution only
- Banned keywords detection
- Controlled API access (GET only, whitelisted domains)
- Admin-defined assertions
- Timeout protection
- Memory management
- Native JavaScript objects only

## [1.0.0] - 2025-07-XX

### Added
- Initial release 