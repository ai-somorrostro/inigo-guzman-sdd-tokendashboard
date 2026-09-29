# model-comparison Specification

## Purpose

Lets class members compare available AI models on price, TTFT, and media modalities in one shared, sortable and filterable view whose numbers are sourced and dated rather than asserted.

## Requirements

### Requirement: Model catalog entries carry comparison data
The system SHALL hold a versioned catalog of model entries, where each entry identifies the model and its provider and includes: input price and output price per million tokens, time-to-first-token data, context window size, a list of supported input modalities, a list of supported output modalities, and a capture date for the catalog data.

#### Scenario: A model entry is complete
- **WHEN** a class member opens the comparison view
- **THEN** every model row shows name, provider, input price, output price, TTFT, context window, input modalities, output modalities, and the capture date

#### Scenario: Modalities are limited to media types
- **WHEN** a model's modalities are read
- **THEN** input and output modalities are separate lists whose values come only from text, image, audio, and video
- **AND** capability attributes such as tool use, reasoning, and structured output are not treated as modalities

### Requirement: Unknown values are shown as unknown
The system SHALL represent any absent price, TTFT, or modality value as unknown, and SHALL never render an unknown value as zero or as an empty cell.

#### Scenario: Price not published by the provider
- **WHEN** a model has no published cached-input price
- **THEN** the cell displays an explicit unknown marker rather than 0

#### Scenario: TTFT never sourced
- **WHEN** a model has no sourced TTFT value
- **THEN** the TTFT cell displays an explicit unknown marker and the row remains comparable on other columns

### Requirement: TTFT values carry provenance
The system SHALL store each TTFT value together with its source, its percentile, and the date it was captured, and SHALL make that provenance available to the viewer for each model.

#### Scenario: Viewer checks where a TTFT number came from
- **WHEN** a class member inspects a TTFT value
- **THEN** the source, percentile, and capture date of that value are visible

#### Scenario: Two sources disagree
- **WHEN** two models' TTFT values come from different sources or percentiles
- **THEN** each value still displays its own provenance so the difference is detectable

### Requirement: Comparison table supports sorting by price
The system SHALL display all catalog models in a single table and SHALL allow the table to be sorted by any displayed column: activating a column header sorts ascending, activating it again reverses to descending, and activating a different column starts that column at ascending. The default order on first load is input price ascending. Unknown values SHALL be placed last in both directions on every sortable column, and rows whose compared values are equal SHALL keep their relative order from the catalog file.

#### Scenario: Default sort by input price
- **WHEN** a class member opens the comparison view
- **THEN** rows are ordered by input price ascending and models with unknown input price are placed last
- **AND** the input-price header reports an ascending sort

#### Scenario: Sort by input price
- **WHEN** the user sorts by input price
- **THEN** rows reorder so the lowest input price is first and models with unknown input price are placed last

#### Scenario: Sort by a non-price column
- **WHEN** the user activates the header of a column other than the price columns
- **THEN** rows reorder by that column ascending
- **AND** activating the same header again reorders the rows by that column descending

#### Scenario: Unknown values stay last when reversing
- **WHEN** the user sorts a column containing unknown values (such as TTFT or price) in either direction
- **THEN** rows with an unknown value in that column remain after every row with a known value

#### Scenario: Equal values keep catalog order
- **WHEN** two or more models have the same value in the active sort column
- **THEN** those rows appear in the same relative order they have in the catalog file

### Requirement: Comparison table supports filtering by input modality
The system SHALL allow the user to filter the table by model name (case-insensitive substring match), by a selected input modality, and by a selected output modality, where the active filters combine with AND semantics so a row is shown only when it satisfies every active filter. Each filter has an "all" option that disables it, and the input-modality filter keeps its existing control label and options.

#### Scenario: Filter to models accepting image input
- **WHEN** the user selects image as the input modality filter
- **THEN** only models whose input modality list includes image remain visible

#### Scenario: Filter matches no models
- **WHEN** the selected input modality matches no model
- **THEN** the table shows an explicit empty result rather than all models

#### Scenario: Filter by model name
- **WHEN** the user types text into the name filter
- **THEN** only models whose name contains that text, ignoring case, remain visible

#### Scenario: Filters combine with AND
- **WHEN** a name filter and a modality filter are both active
- **THEN** only models that match the name and satisfy both modality selections remain visible

#### Scenario: Name filter matches no model
- **WHEN** the name filter matches no model
- **THEN** the table shows an explicit empty result rather than all models

### Requirement: Capture date reveals data freshness
The system SHALL display the capture date of each model's price and TTFT data so a viewer can tell how current the comparison is.

#### Scenario: Viewer judges staleness
- **WHEN** a class member compares two models captured on different dates
- **THEN** both capture dates are visible in the table

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

### Requirement: Catalog is maintained through the repository
The system SHALL store the catalog as a versioned file in the repository so class members can update model data through the normal git workflow, without authentication or third-party API keys.

#### Scenario: Classmate adds a model
- **WHEN** a class member adds a model entry to the catalog file and commits it
- **THEN** the comparison view reflects the new model on next load
- **AND** no API key or sign-in is required to view or update the catalog

### Requirement: Comparison view loads the catalog over HTTP
The system SHALL load the versioned catalog file at runtime with an HTTP fetch of a file served from the repository, SHALL show an explicit text-based loading state while the request is in flight, and SHALL show an explicit error state with a retry option when the request fails or the payload does not validate against the catalog schema. The view SHALL NOT render an empty or partial table as if it were the complete catalog.

#### Scenario: Catalog is fetched on view start
- **WHEN** the comparison view starts
- **THEN** the catalog file is requested over HTTP rather than being read from a bundled value

#### Scenario: Loading state is visible
- **WHEN** the request has been issued and no response has been validated yet
- **THEN** a text-based loading state is visible and no catalog rows are shown

#### Scenario: Catalog loads successfully
- **WHEN** the response arrives and validates against the catalog schema
- **THEN** the table renders with the default sort and the filter controls become usable

#### Scenario: Request fails
- **WHEN** the request cannot be completed (for example, the file is unreachable)
- **THEN** an error state with a retry option is shown instead of an empty table

#### Scenario: Payload does not validate
- **WHEN** the response is received but does not satisfy the catalog schema
- **THEN** the same error state with a retry option is shown instead of rendering invalid data
