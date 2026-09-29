# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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

## RENAMED Requirements

### Requirement: Comparison table supports sorting by price
**TO:** Comparison table supports sorting by any column

### Requirement: Comparison table supports filtering by input modality
**TO:** Comparison table supports filtering by name and modalities
