# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-07

### Added
- Complete refactor
- Support for `container` type (granite/ui/components/coral/foundation/container) for generic element grouping
- Support for `showhideClass` property on `fieldset` and `container` types to enable hiding entire groups of fields
- Dynamic show/hide functionality using AEM's cq-dialog-dropdown-showhide and cq-dialog-checkbox-showhide scripts
- Properties `cqShowHide`, `showhideTarget`, and `showhideClass` for controlling conditional field visibility
- Support for show/hide on dropdown (select) fields with per-option targets
- Support for show/hide on checkbox fields
- Validation for `maxItems` and `minItems` in multifields, with proper error messages
- **Advanced features:**
  - Field validation with regex patterns and custom error messages
  - `fixedcolumns` layout for multi-column field organization
  - Conditional tabs with `showIf` property for dynamic tab visibility
  - **Accordion layout** (`layout: 'accordion'`) for collapsible sections as an alternative to tabs
  - **Placeholder text** (`placeholder`) for showing example text in empty fields
  - **Min/Max validation** (`min`, `max`) for numeric range constraints on numberfields
  - **Disabled/ReadOnly fields** (`disabled`, `readOnly`) for controlling field interactivity
  - **Multiple selection** (`multiple`) for select fields to allow choosing multiple options
  - **Well container** (`type: 'well'`) for visually grouping related fields with subtle background
  - **Contextual help** (`contextualHelp`) for adding help icons with tooltips and optional documentation links
  - **Custom CSS classes** (`className`) for applying custom styling and JavaScript selector hooks to fields
  - **Field width control** (`width`) for precise field sizing with pixel, percentage, or CSS values
  - **Coral UI spacing** (`margin`) for controlling vertical spacing between fields (true/false)
  - **Default values** (`defaultValue`) for setting initial field values across all field types
  - **Field descriptions** (`description`) for adding helpful text below field labels
  - **Maximum length** (`maxLength`) for character limit validation on text fields
  - **Empty text** (`emptyText`) for Coral UI native placeholder text (alternative to `placeholder`)
  - **Granite ID** (`graniteId`) for custom field IDs enabling JavaScript hooks and specific styling
  - **Tracking feature** (`trackingFeature`) for Adobe Analytics integration and usage tracking
  - **Render hidden** (`renderHidden`) for conditional field visibility that can be toggled dynamically
  - **Collapsible sections** (`collapsible`) for fieldsets and containers to organize long dialogs
  - **Filter** (`filter`) for path-based pickers (pathfield, pagefield, assetpicker) to restrict selectable items
  - **Force ignore freshness** (`forceIgnoreFreshness`) for DAM assets to force revalidation and avoid cache issues
  - **Delete hint** (`deleteHint`) for multifields to add confirmation messages when deleting items
  - **Ordered/Sortable** (`ordered`) for multifields to enable drag & drop reordering of items
  - **Tracking element** (`trackingElement`) for granular analytics tagging alongside `trackingFeature`
  - **Auto focus** (`autoFocus`) to focus a field when the dialog opens
  - **Wrapper class** (`wrapperClass`) to add CSS classes to the field container
  - **Type hint** (`typeHint`) to persist values with the correct JCR/Sling type (e.g., `Long`, `Boolean`, `String[]`)
- **New field types:**
  - `hidden` - Hidden fields for storing values without displaying them
  - `button` - Action buttons for triggering commands or handlers
  - `heading` - Section headings for dialog organization
  - `text`/`alert` - Informational text and alerts with variants (info, warning, error, success)
  - `tags` - AEM tag selector with configurable root path
  - `image` - Image upload with DAM integration and drag-and-drop support
  - `autocomplete` - Autocomplete field with datasource integration and multiple selection
  - `radiogroup` - Radio button group for 2-4 visible options
  - `pagefield` - AEM page selector with content tree navigation
  - `contentfragmentpicker` - Content Fragment selector for structured content references
  - `experiencefragmentpicker` - Experience Fragment selector for reusable component compositions
  - `assetpicker` - Generic DAM asset selector with mime type filtering

## [1.0.0] - 2025-12-03

### Added
- Initial release
- Support for 15 field types (textfield, textarea, pathfield, checkbox, select, datepicker, numberfield, colorfield, fileupload, switch, hidden, multifield, fieldset, rte)
- Tabs and simple layout support
- Fieldset for logical grouping
- Rich Text Editor (RTE) with customizable features
- Multifield support (simple and composite)
- Folder structure options (_cq_dialog/.content.xml or _cq_dialog.xml)
- Verbose logging option
- Automatic XML generation on webpack build
- Complete XML escape handling
- Indentation system for readable XML output
- Comprehensive test suite with Jest (38 tests)
- Test coverage: 89.8% statements, 66.66% branches, 93.33% functions
- Test scripts in package.json (test, test:watch, test:coverage)
- Jest configuration with coverage reporting
