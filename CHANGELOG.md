
## v4.1.0 (2026-06-09)
### Added
- 4-Layer Intent Gateway: L0 PreFilter, L1 Keyword, L2 TF-IDF FuzzyMatcher, L3 Clarification
- FSM Recovery Protocol: auto-recovery from stuck states (30s idle, 5min TTL, 3x block)
- 607 comprehensive unit/integration tests

### Fixed
- Version query deadlock: "forcoding版本是什么" no longer blocks FSM
- GateSystem constructor parameter handling
- 	his.gates.dir → 	his.gates.gatesDir property name
- StateStore .tmp file cleanup on successful write

### Changed
- Intent classification: hard binary isNonCodingQuery → multi-factor PreFilter
- Plugin integration: IntentGateway replaces raw isNonCodingQuery in chat.message hook
- Orchestrator prompt: added Intent Clarification and FSM Recovery sections

