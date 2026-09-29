# Spec Delta

## ADDED Requirements

### Requirement: Stale capture dates are marked
The system SHALL mark a model row in the comparison table as stale when its capture date is more than 90 days before the current date, showing the mark next to the capture date in a way that does not rely on color alone.

#### Scenario: Row with an old capture date
- **WHEN** a class member views a model whose capture date is older than 90 days
- **THEN** the capture-date cell shows an explicit stale marker alongside the date
- **AND** a stale row remains visible, comparable, and in its sorted position

#### Scenario: Row with a recent capture date
- **WHEN** a class member views a model whose capture date is 90 days old or less
- **THEN** the capture-date cell shows only the date with no stale marker

#### Scenario: Viewer checks why a row is marked
- **WHEN** a class member inspects the stale marker
- **THEN** an explanation of the staleness threshold is available without relying on the marker's color
