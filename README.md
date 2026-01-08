# AEM Dialog Generator Plugin

A Webpack plugin that automatically generates AEM component `_cq_dialog.xml` files from simple JSON configurations.

[![npm version](https://img.shields.io/npm/v/aem-dialog-generator-plugin.svg)](https://www.npmjs.com/package/aem-dialog-generator-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-89.8%25-brightgreen.svg)](https://github.com/yourusername/aem-dialog-generator-plugin)

## Features

✨ **27 Field Types Supported** - textfield, textarea, select, pathfield, pagefield, checkbox, multifield, RTE, fieldset, container, heading, text/alert, tags, image, autocomplete, radiogroup, contentfragmentpicker, experiencefragmentpicker, assetpicker, hidden, button, well, and more  
🎨 **Flexible Layouts** - Tabs, simple layouts, accordion, or fieldsets for organization  
🔄 **Auto-generation** - XML files generated on every webpack build  
📝 **Simple JSON** - Easy-to-read configuration instead of verbose XML  
🎯 **Multifield Support** - Both simple and composite multifields  
📋 **Rich Text Editor** - Full RTE configuration with customizable features  
🗂️ **Folder Structure** - Supports both `_cq_dialog/.content.xml` and `_cq_dialog.xml` formats
🎭 **Show/Hide** - Dynamic field visibility based on dropdown or checkbox values
📷 **Image Upload** - Built-in support for DAM integration and file uploads
📝 **Page Selection** - Native AEM page picker with content tree navigation
🧩 **Content Fragments** - Full support for Content Fragment and Experience Fragment pickers
✅ **Validation** - Regex patterns, min/max values, required fields, maxLength
💡 **Contextual Help** - Inline help tooltips and documentation links
🎨 **Custom Styling** - CSS classes, field width control, and Coral UI spacing
📝 **Field Enhancements** - Default values, descriptions, placeholder/emptyText
🎯 **Enterprise Features** - Custom IDs (granite:id), analytics tracking, render hidden, collapsible sections
🔍 **Advanced Pickers** - Filter support, freshness control for DAM assets
🔄 **Multifield Pro** - Delete confirmation, drag & drop reordering
🎯 **Tracking** - trackingElement para analytics granular (además de trackingFeature)
🧭 **UX** - autoFocus para enfocar campos al abrir el diálogo
🧱 **Estilos** - wrapperClass para clases del contenedor
🧪 **Tipos** - typeHint para guardar con el tipo correcto en JCR

## Installation

```bash
npm install aem-dialog-generator-plugin --save-dev
```

## Quick Start

### 1. Configure webpack

```javascript
const AemDialogGeneratorPlugin = require('aem-dialog-generator-plugin');
const path = require('path');

module.exports = {
  plugins: [
    new AemDialogGeneratorPlugin({
      sourceDir: path.resolve(__dirname, 'src/main/webpack/components'),
      targetDir: path.resolve(__dirname, '../ui.apps/src/main/content/jcr_root/apps/mysite/components'),
      appName: 'mysite',
      verbose: true
    })
  ]
};
```

### 2. Create a dialog.json file

Create `src/main/webpack/components/button/dialog.json`:

```json
{
  "title": "Button Component",
  "tabs": [
    {
      "title": "Properties",
      "fields": [
        {
          "type": "textfield",
          "name": "./text",
          "label": "Button Text",
          "required": true
        },
        {
          "type": "pathfield",
          "name": "./link",
          "label": "Link",
          "rootPath": "/content"
        },
        {
          "type": "select",
          "name": "./style",
          "label": "Button Style",
          "options": [
            { "value": "primary", "text": "Primary" },
            { "value": "secondary", "text": "Secondary" }
          ]
        }
      ]
    }
  ]
}
```

### 3. Build

```bash
npm run dev
```

The plugin automatically generates:
```
ui.apps/src/main/content/jcr_root/apps/mysite/components/button/_cq_dialog/.content.xml
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sourceDir` | String | Required | Folder containing component dialog.json files |
| `targetDir` | String | Required | Target folder for generated XML files |
| `dialogFileName` | String | `dialog.json` | Name of the JSON configuration file |
| `appName` | String | `mysite` | AEM application name |
| `useFolderStructure` | Boolean | `true` | Use `_cq_dialog/.content.xml` (true) or `_cq_dialog.xml` (false) |
| `verbose` | Boolean | `false` | Enable detailed logging |

## Supported Field Types

### Basic Fields

#### textfield
```json
{
  "type": "textfield",
  "name": "./title",
  "label": "Title",
  "description": "Enter title",
  "required": true,
  "defaultValue": "Default text"
}
```

## New Properties Quick Guide

### typeHint (Sling/JCR)
Force the JCR data type saved by Sling. Useful for numbers, booleans, or arrays.

Examples:

```json
{ "type": "textfield", "name": "./views", "label": "Views", "typeHint": "Long" }
{ "type": "select", "name": "./tags", "label": "Tags", "multiple": true, "typeHint": "String[]", "options": [{"value":"a","text":"A"}] }
```

### wrapperClass (field container)
Add CSS classes to the field container; merged with other Granite classes.

```json
{ "type": "textfield", "name": "./title", "label": "Title", "className": "input-sm", "wrapperClass": "wrap-a wrap-b" }
```

### autoFocus (better UX)
Focus the field when the dialog opens.

```json
{ "type": "textfield", "name": "./search", "label": "Search", "autoFocus": true }
```

### trackingElement (granular analytics)
Complement `trackingFeature` to identify a specific element interaction.

```json
{ "type": "textfield", "name": "./ctaText", "label": "CTA Text", "trackingFeature": "hero", "trackingElement": "cta" }
```

#### textarea
```json
{
  "type": "textarea",
  "name": "./description",
  "label": "Description",
  "rows": 5
}
```

#### pathfield
```json
{
  "type": "pathfield",
  "name": "./link",
  "label": "Link",
  "rootPath": "/content"
}
```

#### select
```json
{
  "type": "select",
  "name": "./type",
  "label": "Type",
  "options": [
    { "value": "type1", "text": "Type 1" },
    { "value": "type2", "text": "Type 2" }
  ]
}
```

## Advanced Properties

- Show/Hide by expression: use `showIf` or `hideIf` to emit `granite:hide` and control field visibility.
- Select datasource: add `datasource` (child node), `emptyOption`, `forceSelection`.
- Validation messages: override built-ins with `requiredMessage`, `minMessage`, `maxMessage`, `patternMessage`.
- Order fields: place with `orderBefore` (emits `sling:orderBefore`).
- Granite data: set `data: { key: value }` → `granite:data-key="value"` on the field.
- Render conditions: `renderCondition` supports `simple`, `privilege`, `and`, `or` with nested conditions.
- Multifield UX: `addItemLabel`, `maxItemsMessage`, `minItemsMessage`, `reorderableHandle`.
- QoL inputs: `clearButton` (textfield), `autocomplete`, `ariaLabel`, `ariaDescribedBy`, `tooltipIcon`.

Examples:

```json
{
  "type": "textfield",
  "name": "./videoUrl",
  "label": "Video URL",
  "showIf": { "field": "./contentType", "value": "video" },
  "required": true,
  "requiredMessage": "Required for Video",
  "ariaLabel": "Video URL"
}
```

```json
{
  "type": "select",
  "name": "./category",
  "label": "Category",
  "emptyOption": true,
  "forceSelection": true,
  "datasource": "/apps/mysite/datasources/categories"
}
```

```json
{
  "type": "textfield",
  "name": "./adminOnly",
  "label": "Admin Only",
  "renderCondition": {
    "type": "and",
    "conditions": [
      { "type": "simple", "expression": "${currentUser == 'admin'}" },
      { "type": "privilege", "privilege": "jcr:read" }
    ]
  }
}
```

```json
{
  "type": "multifield",
  "name": "./items",
  "label": "Items",
  "addItemLabel": "Add Item",
  "maxItemsMessage": "Too many",
  "minItemsMessage": "Too few",
  "reorderableHandle": "drag",
  "fields": [{ "type": "textfield", "name": "./item", "label": "Item" }]
}
```

#### checkbox
```json
{
  "type": "checkbox",
  "name": "./enabled",
  "label": "Enabled",
  "text": "Enable feature",
  "value": "true"
}
```

#### numberfield
```json
{
  "type": "numberfield",
  "name": "./count",
  "label": "Count",
  "min": 0,
  "max": 100,
  "step": 1
}
```

#### datepicker
```json
{
  "type": "datepicker",
  "name": "./date",
  "label": "Date"
}
```

#### colorfield
```json
{
  "type": "colorfield",
  "name": "./color",
  "label": "Color"
}
```

#### switch
```json
{
  "type": "switch",
  "name": "./active",
  "label": "Active",
  "checked": true
}
```

#### hidden
```json
{
  "type": "hidden",
  "name": "./hiddenValue",
  "value": "hidden-value"
}
```

#### fileupload
```json
{
  "type": "fileupload",
  "name": "./fileReference",
  "label": "File"
}
```

#### hidden
```json
{
  "type": "hidden",
  "name": "./componentId",
  "defaultValue": "auto-generated-id"
}
```

Stores values in JCR without displaying them in the dialog. Perfect for:
- Auto-generated IDs or timestamps
- Technical flags or metadata
- Calculated values set by JavaScript
- Values that authors shouldn't modify

**Note:** Hidden fields have no label or visual representation.

#### button
```json
{
  "type": "button",
  "text": "Generate Content",
  "variant": "primary",
  "icon": "magic",
  "command": "generateContent"
}
```

Adds clickable buttons to trigger actions:

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `text` | String | Button label | "Button" |
| `variant` | String | Style: `primary`, `secondary`, `action`, `warning` | `primary` |
| `icon` | String | Coral UI icon name | - |
| `command` | String | Command to execute | - |
| `handler` | String | JavaScript handler file | - |

**Use Cases:**
- Trigger content generation
- Clear form fields
- Preview content
- Execute custom actions
- Integration with client libraries

### Advanced Fields

#### fieldset - Group Related Fields
```json
{
  "type": "fieldset",
  "label": "SEO Settings",
  "fields": [
    {
      "type": "textfield",
      "name": "./metaTitle",
      "label": "Meta Title"
    },
    {
      "type": "textarea",
      "name": "./metaDescription",
      "label": "Meta Description"
    }
  ]
}
```

#### container - Generic Container for Grouping
```json
{
  "type": "container",
  "fields": [
    {
      "type": "textfield",
      "name": "./option1",
      "label": "Option 1"
    },
    {
      "type": "textfield",
      "name": "./option2",
      "label": "Option 2"
    }
  ]
}
```

**Differences:**
- **fieldset**: Form-specific grouping with a visible label (`jcr:title`). Requires `label` property.
- **container**: Generic grouping element without visual label. The `name` property is optional (used only for node naming).

**Note:** Both support `showhideClass` for hiding entire groups of fields together.

#### fixedcolumns - Multi-Column Layout
```json
{
  "type": "fixedcolumns",
  "columns": [
    {
      "fields": [
        { "type": "textfield", "name": "./firstName", "label": "First Name" },
        { "type": "textfield", "name": "./email", "label": "Email" }
      ]
    },
    {
      "fields": [
        { "type": "textfield", "name": "./lastName", "label": "Last Name" },
        { "type": "textfield", "name": "./phone", "label": "Phone" }
      ]
    }
  ]
}
```

Organizes fields into side-by-side columns for better space utilization. Perfect for forms with related fields.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `columns` | Array | Array of column objects, each containing a `fields` array |
| `name` | String | Optional custom node name |

**Column Properties:**
- `name` (String): Optional custom column name (default: column1, column2, etc.)
- `fields` (Array): Array of field definitions for this column

**Common Use Cases:**
- Name and contact info side by side
- Address fields in multiple columns
- Date ranges (From/To)
- Compact form layouts

#### well - Visual Grouping Container
```json
{
  "type": "well",
  "name": "advancedSettings",
  "fields": [
    { "type": "textfield", "name": "./cssClass", "label": "CSS Class" },
    { "type": "numberfield", "name": "./zIndex", "label": "Z-Index" },
    { "type": "checkbox", "name": "./customBehavior", "label": "Enable Custom Behavior" }
  ]
}
```

A well is a container with a subtle gray background that visually groups related fields.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `fields` | Array | Array of field definitions to display in the well |
| `name` | String | Optional custom node name |

**When to Use:**
- Highlighting optional or advanced settings
- Visually separating field groups without tabs
- Drawing attention to important configuration sections
- Creating visual hierarchy within a tab

**Visual Effect:** Fields appear with a light gray background, creating a subtle "inset" appearance that groups them together.

#### heading - Section Heading
```json
{
  "type": "heading",
  "text": "Advanced Settings",
  "level": 3
}
```

Creates a visual heading element to organize dialog sections. Does not store any data.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `text` | String | The heading text to display (required) | - |
| `level` | Number | Heading level (1-6) | 3 |

#### text - Informational Text / Alert
```json
{
  "type": "text",
  "text": "This setting will affect all child pages.",
  "variant": "warning"
}
```

Displays static informational text or alerts. Does not store any data. Also accepts `"type": "alert"` as an alias.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `text` | String | The message to display (required) | - |
| `variant` | String | Visual style: `info`, `warning`, `error`, `success` | `info` |

**Common Use Cases:**
- Help text and instructions
- Warnings about field impacts
- Error messages or important notes
- Success confirmation messages

#### tags - AEM Tag Selector
```json
{
  "type": "tags",
  "name": "./cq:tags",
  "label": "Tags",
  "required": true,
  "rootPath": "/content/cq:tags/mysite"
}
```

Provides an AEM tag picker that allows users to select from the AEM tagging system.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `name` | String | Property name where selected tags are stored (required) | - |
| `label` | String | Field label (required) | - |
| `rootPath` | String | Root path in tag hierarchy | `/content/cq:tags` |
| `required` | Boolean | Make field mandatory | `false` |

**Common Use Cases:**
- Content categorization
- SEO keywords
- Content filtering and search
- Taxonomy management

#### image - Image Upload and Selection
```json
{
  "type": "image",
  "name": "./image",
  "label": "Image",
  "required": true,
  "uploadUrl": "/content/dam/mysite",
  "allowUpload": true
}
```

Provides an image upload field with DAM integration. Supports drag-and-drop, file browsing, and DAM asset selection.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `uploadUrl` | String | Upload destination path in DAM | - |
| `allowUpload` | Boolean | Enable file upload | `true` |
| `mimeTypes` | Array | Allowed mime types | `['image/gif', 'image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/svg+xml']` |
| `fileNameParameter` | String | Property for filename | `./fileName` |
| `fileReferenceParameter` | String | Property for file reference | `./fileReference` |
| `required` | Boolean | Make field mandatory | `false` |

**Common Use Cases:**
- Hero images and banners
- Product images
- Author avatars
- Background images

#### autocomplete - Autocomplete Field
```json
{
  "type": "autocomplete",
  "name": "./product",
  "label": "Select Product",
  "multiple": true,
  "datasource": "/apps/mysite/datasources/products"
}
```

Provides an autocomplete field with optional datasource integration for dynamic suggestions.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `datasource` | String | Path to datasource for suggestions | - |
| `multiple` | Boolean | Allow multiple selections | `false` |
| `forceSelection` | Boolean | Only allow values from suggestions | `true` |
| `required` | Boolean | Make field mandatory | `false` |

**Common Use Cases:**
- Product selection
- User search
- Category selection
- Dynamic value lists

#### radiogroup - Radio Button Group
```json
{
  "type": "radiogroup",
  "name": "./layout",
  "label": "Layout",
  "vertical": false,
  "options": [
    { "value": "grid", "text": "Grid" },
    { "value": "list", "text": "List", "checked": true }
  ]
}
```

Displays a group of radio buttons. Better than select when you have 2-4 options that should be immediately visible.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `options` | Array | Radio button options (required) | - |
| `vertical` | Boolean | Stack radio buttons vertically | `false` |
| `required` | Boolean | Make field mandatory | `false` |

**Option Properties:**
- `value` (String): The value to store
- `text` (String): Display text
- `checked` (Boolean): Default selected option

**Common Use Cases:**
- Layout selection (2-3 options)
- Yes/No questions
- Content type selection
- Alignment options (left/center/right)

#### pagefield - AEM Page Selector
```json
{
  "type": "pagefield",
  "name": "./targetPage",
  "label": "Link to Page",
  "required": true,
  "rootPath": "/content/mysite/en"
}
```

Provides an AEM-specific page selector with content tree navigation. Essential for any component that links to other pages.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `rootPath` | String | Root path in content tree | `/content` |
| `required` | Boolean | Make field mandatory | `false` |

**Common Use Cases:**
- Navigation links
- Call-to-action buttons
- Related content links
- Breadcrumb configuration
- Footer links

#### contentfragmentpicker - Content Fragment Selector
```json
{
  "type": "contentfragmentpicker",
  "name": "./fragmentPath",
  "label": "Select Content Fragment",
  "required": true,
  "rootPath": "/content/dam/fragments",
  "fragmentModel": "/conf/mysite/settings/dam/cfm/models/article"
}
```

Provides a Content Fragment picker for selecting structured content. Essential for AEM headless and content-driven sites.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `rootPath` | String | Root path in DAM | `/content/dam` |
| `fragmentModel` | String | Path to specific Content Fragment Model | - |
| `required` | Boolean | Make field mandatory | `false` |

**Common Use Cases:**
- Article content references
- Product data integration
- Headless content delivery
- Structured data references
- Multi-channel content

#### experiencefragmentpicker - Experience Fragment Selector
```json
{
  "type": "experiencefragmentpicker",
  "name": "./xfPath",
  "label": "Select Experience Fragment",
  "required": true,
  "rootPath": "/content/experience-fragments/mysite"
}
```

Provides an Experience Fragment picker for reusable component compositions. Perfect for headers, footers, and repeated content blocks.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `rootPath` | String | Root path for XF | `/content/experience-fragments` |
| `required` | Boolean | Make field mandatory | `false` |

**Common Use Cases:**
- Global headers and footers
- Reusable content blocks
- Multi-variant content
- Promotional banners
- Email templates

#### assetpicker - Generic Asset Selector
```json
{
  "type": "assetpicker",
  "name": "./assetPath",
  "label": "Select Asset",
  "required": true,
  "rootPath": "/content/dam/videos",
  "mimeTypes": ["video/mp4", "video/webm", "application/pdf"]
}
```

Provides a generic DAM asset picker with mime type filtering. More flexible than `image` for videos, documents, and other file types.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `rootPath` | String | Root path in DAM | `/content/dam` |
| `mimeTypes` | Array | Allowed mime types | - |
| `required` | Boolean | Make field mandatory | `false` |

**Common Use Cases:**
- Video assets
- PDF documents
- Downloadable files
- Audio files
- Mixed media selection

#### rte - Rich Text Editor
```json
{
  "type": "rte",
  "name": "./text",
  "label": "Content",
  "required": true,
  "features": ["bold", "italic", "underline", "links", "lists"]
}
```

Use `"features": ["*"]` for all features, or specify individual ones:
- `"bold"`, `"italic"`, `"underline"` - Text formatting
- `"links"` - Hyperlinks
- `"lists"` - Ordered and unordered lists
- `"justify"` - Text alignment

## Dynamic Show/Hide

The plugin supports AEM's built-in `cq-dialog-dropdown-showhide` and `cq-dialog-checkbox-showhide` scripts for conditional field visibility.

### Dropdown Show/Hide

Show different fields based on dropdown selection:

```json
{
  "type": "select",
  "name": "./contentType",
  "label": "Content Type",
  "cqShowHide": true,
  "options": [
    {
      "text": "Image",
      "value": "image",
      "showhideTarget": ".image-fields"
    },
    {
      "text": "Video",
      "value": "video",
      "showhideTarget": ".video-fields"
    },
    {
      "text": "Text",
      "value": "text",
      "showhideTarget": ".text-fields"
    }
  ]
}
```

Then define fields that will be shown/hidden:

```json
{
  "type": "pathfield",
  "name": "./imagePath",
  "label": "Image Path",
  "showhideClass": "image-fields",
  "rootPath": "/content/dam"
},
{
  "type": "pathfield",
  "name": "./videoUrl",
  "label": "Video URL",
  "showhideClass": "video-fields"
},
{
  "type": "textarea",
  "name": "./textContent",
  "label": "Text Content",
  "showhideClass": "text-fields"
}
```

### Checkbox Show/Hide

Show fields when checkbox is checked:

```json
{
  "type": "checkbox",
  "name": "./enableCustomSettings",
  "label": "Enable Custom Settings",
  "cqShowHide": true,
  "showhideTarget": ".custom-settings"
},
{
  "type": "textfield",
  "name": "./customValue",
  "label": "Custom Value",
  "showhideClass": "custom-settings"
},
{
  "type": "numberfield",
  "name": "./customNumber",
  "label": "Custom Number",
  "showhideClass": "custom-settings"
}
```

### Show/Hide Properties

| Property | Type | Used On | Description |
|----------|------|---------|-------------|
| `cqShowHide` | Boolean | select, checkbox | Enable show/hide functionality |
| `showhideTarget` | String | checkbox, option items | CSS selector of elements to show/hide (e.g., ".my-fields") |
| `showhideClass` | String | Any field, fieldset, container | CSS class added to fields/containers that should be hidden (e.g., "my-fields") |

**Note:** You can use `showhideClass` on `fieldset` or `container` types to hide entire groups of fields together.

**Generated XML for dropdown:**
```xml
<contentType
    granite:class="cq-dialog-dropdown-showhide"
    ...>
    <items>
        <image
            granite:data-cq-dialog-dropdown-showhide-target=".image-fields"
            .../>
    </items>
</contentType>

<imagePath
    granite:class="hide image-fields"
    .../>
```

**Generated XML for checkbox:**
```xml
<enableCustomSettings
    granite:class="cq-dialog-checkbox-showhide"
    granite:data-cq-dialog-checkbox-showhide-target=".custom-settings"
    .../>

<customValue
    granite:class="hide custom-settings"
    .../>
```

### Complete Show/Hide Example

```json
{
  "title": "Media Component",
  "tabs": [
    {
      "title": "Content",
      "fields": [
        {
          "type": "select",
          "name": "./mediaType",
          "label": "Media Type",
          "cqShowHide": true,
          "defaultValue": "image",
          "options": [
            {
              "text": "Image",
              "value": "image",
              "showhideTarget": ".media-image"
            },
            {
              "text": "Video",
              "value": "video",
              "showhideTarget": ".media-video"
            }
          ]
        },
        {
          "type": "pathfield",
          "name": "./imageAsset",
          "label": "Image Asset",
          "showhideClass": "media-image",
          "rootPath": "/content/dam"
        },
        {
          "type": "textfield",
          "name": "./imageAlt",
          "label": "Alt Text",
          "showhideClass": "media-image"
        },
        {
          "type": "pathfield",
          "name": "./videoAsset",
          "label": "Video Asset",
          "showhideClass": "media-video",
          "rootPath": "/content/dam"
        },
        {
          "type": "checkbox",
          "name": "./videoAutoplay",
          "label": "Autoplay Video",
          "showhideClass": "media-video"
        },
        {
          "type": "checkbox",
          "name": "./addCaption",
          "label": "Add Caption",
          "cqShowHide": true,
          "showhideTarget": ".caption-fields"
        },
        {
          "type": "textarea",
          "name": "./caption",
          "label": "Caption Text",
          "showhideClass": "caption-fields"
        }
      ]
    }
  ]
}
```

### Hiding Groups of Fields with Container

You can use `container` or `fieldset` with `showhideClass` to hide multiple fields as a group:

```json
{
  "type": "select",
  "name": "./mode",
  "label": "Display Mode",
  "cqShowHide": true,
  "options": [
    { "text": "Simple", "value": "simple" },
    { "text": "Advanced", "value": "advanced", "showhideTarget": ".advanced-settings" }
  ]
},
{
  "type": "container",
  "name": "advancedSettings",
  "showhideClass": "advanced-settings",
  "fields": [
    {
      "type": "textfield",
      "name": "./customClass",
      "label": "Custom CSS Class"
    },
    {
      "type": "numberfield",
      "name": "./customWidth",
      "label": "Custom Width"
    },
    {
      "type": "textfield",
      "name": "./dataAttributes",
      "label": "Data Attributes"
    }
  ]
}
```

This will show/hide all three fields inside the container when "Advanced" is selected. Note that `container` doesn't require a `label` - it's just a grouping element.

#### multifield - Repeatable Fields

**Simple Multifield** (single field repeated):
```json
{
  "type": "multifield",
  "name": "./tags",
  "label": "Tags",
  "minItems": 1,
  "maxItems": 5,
  "fields": [
    {
      "type": "textfield",
      "name": "./tag",
      "label": "Tag"
    }
  ]
}
```

**Composite Multifield** (grouped fields repeated together):
```json
{
  "type": "multifield",
  "name": "./slides",
  "label": "Slides",
  "composite": true,
  "minItems": 2,
  "maxItems": 10,
  "fields": [
    {
      "type": "textfield",
      "name": "./title",
      "label": "Title",
      "required": true
    },
    {
      "type": "textarea",
      "name": "./description",
      "label": "Description"
    },
    {
      "type": "pathfield",
      "name": "./image",
      "label": "Image",
      "rootPath": "/content/dam"
    }
  ]
}
```

**Multifield Properties:**

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `minItems` | Number | Minimum number of items required (0 or greater) | `minItems: 1` |
| `maxItems` | Number | Maximum number of items allowed (1 or greater) | `maxItems: 10` |
| `composite` | Boolean | Group multiple fields together in each item | `composite: true` |

## Conditional Tabs

Tabs can be shown or hidden based on the value of another field:

```json
{
  "title": "My Component",
  "tabs": [
    {
      "title": "General",
      "fields": [
        {
          "type": "checkbox",
          "name": "./enableAdvanced",
          "label": "Enable Advanced Features"
        }
      ]
    },
    {
      "title": "Advanced Settings",
      "showIf": {
        "field": "./enableAdvanced",
        "value": true
      },
      "fields": [
        {
          "type": "textfield",
          "name": "./customClass",
          "label": "Custom CSS Class"
        }
      ]
    }
  ]
}
```

The "Advanced Settings" tab will only appear when the "Enable Advanced Features" checkbox is checked.

**showIf Properties:**
- `field` (String): Path to the field to check (e.g., `./enableAdvanced`)
- `value` (Any): Value to compare against (true, false, "video", etc.)

**Use Cases:**
- Advanced/expert mode settings
- Content-type specific tabs (show video tab only when content type is "video")
- Optional feature configurations
- Progressive disclosure to simplify UX

## Accordion Layout

Use `layout: 'accordion'` for collapsible sections instead of tabs:

```json
{
  "title": "My Component",
  "layout": "accordion",
  "tabs": [
    {
      "title": "Basic Settings",
      "active": true,
      "fields": [
        { "type": "textfield", "name": "./title", "label": "Title" },
        { "type": "textarea", "name": "./description", "label": "Description" }
      ]
    },
    {
      "title": "Advanced Options",
      "fields": [
        { "type": "textfield", "name": "./cssClass", "label": "CSS Class" },
        { "type": "numberfield", "name": "./order", "label": "Display Order" }
      ]
    }
  ]
}
```

**Accordion Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `layout` | String | Set to `"accordion"` to use collapsible sections |
| `tabs` | Array | Array of section objects (reuses `tabs` structure) |

**Section Properties:**
- `title` (String): Section heading
- `active` (Boolean): If `true`, this section is expanded by default (default: `false`)
- `fields` (Array): Fields within this section
- `name` (String): Optional custom node name

**When to use Accordion vs Tabs:**
- **Accordion**: Many sections, progressive disclosure, or when authors need to see multiple sections at once
- **Tabs**: Few sections (2-5), mutually exclusive content, or when a cleaner single-view interface is preferred

## Field Descriptions

Add helpful guidance text below any field using the `description` property:

```json
{
  "type": "textfield",
  "name": "./title",
  "label": "Title",
  "description": "Enter a short, descriptive title for this component",
  "required": true
}
```

The description appears below the field in a lighter font, providing context and instructions to content authors.

### Placeholder Text

Add example text inside empty fields using the `placeholder` property:

```json
{
  "type": "textfield",
  "name": "./username",
  "label": "Username",
  "placeholder": "Enter your username"
}
```

Placeholder text appears in a lighter color inside empty fields and disappears when the user starts typing. Very useful for:
- Showing format examples ("MM/DD/YYYY")
- Providing input hints ("Type to search...")
- Clarifying expected values ("e.g., john.doe@example.com")

**Supported on:** textfield, textarea, numberfield, pathfield, select, autocomplete

### Min/Max Validation

Set numeric range constraints on number fields:

```json
{
  "type": "numberfield",
  "name": "./age",
  "label": "Age",
  "min": 18,
  "max": 99,
  "placeholder": "Enter age between 18-99"
}
```

The `min` and `max` properties enforce numeric boundaries:
- `min` (Number): Minimum allowed value (inclusive)
- `max` (Number): Maximum allowed value (inclusive)
- Works with `numberfield` type
- Browser-native validation

**Common Use Cases:**
```json
// Percentage (0-100)
{ "type": "numberfield", "name": "./opacity", "label": "Opacity %", "min": 0, "max": 100 }

// Positive numbers only
{ "type": "numberfield", "name": "./quantity", "label": "Quantity", "min": 1 }

// Rating system
{ "type": "numberfield", "name": "./rating", "label": "Rating", "min": 1, "max": 5 }
```

### Disabled and ReadOnly Fields

Control field interactivity:

```json
// Disabled field - grayed out, not submitted
{
  "type": "textfield",
  "name": "./calculatedValue",
  "label": "Calculated Value",
  "disabled": true,
  "defaultValue": "Auto-generated"
}

// ReadOnly field - visible but not editable, submitted with form
{
  "type": "textfield",
  "name": "./timestamp",
  "label": "Created Date",
  "readOnly": true,
  "defaultValue": "2024-01-15"
}
```

**Properties:**
- `disabled` (Boolean): Disables the field completely (default: `false`)
- `readOnly` (Boolean): Makes field read-only but still submits value (default: `false`)

**Key Differences:**
- **Disabled**: Field is grayed out and value is NOT submitted
- **ReadOnly**: Field looks normal but can't be edited, value IS submitted

**Use Cases:**
- Disabled: Conditional fields, insufficient permissions, calculated values
- ReadOnly: System-generated IDs, timestamps, inherited values, display-only info

### Multiple Selection

Allow selecting multiple options in dropdowns:

```json
{
  "type": "select",
  "name": "./categories",
  "label": "Categories",
  "multiple": true,
  "options": [
    { "text": "News", "value": "news" },
    { "text": "Events", "value": "events" },
    { "text": "Blog", "value": "blog" }
  ]
}
```

The `multiple` property enables multi-select:
- Works on `select` and `autocomplete` field types
- Users can select multiple values using Ctrl/Cmd + click
- Values are stored as an array

**Common Use Cases:**
- Tag selection
- Category assignment
- Permission selection
- Feature toggles

### Contextual Help

Add help icon with tooltip next to field labels:

```json
// Simple text tooltip
{
  "type": "textfield",
  "name": "./pattern",
  "label": "RegEx Pattern",
  "contextualHelp": "Enter a valid JavaScript regular expression"
}

// With external documentation link
{
  "type": "select",
  "name": "./layout",
  "label": "Layout Type",
  "contextualHelp": {
    "text": "Choose the layout format for this component",
    "url": "https://docs.example.com/layouts"
  },
  "options": [...]
}
```

The `contextualHelp` property adds a small ⓘ icon next to the field label:
- **String value**: Shows tooltip on hover
- **Object value**: Shows tooltip and optional "Learn more" link
  - `text` (String): Tooltip content
  - `url` (String): External documentation URL

**Benefits:**
- Keeps UI clean while providing detailed help
- Reduces need for lengthy field descriptions
- Links to external documentation for complex features
- Standard AEM pattern for contextual assistance

### Custom CSS Classes

Add custom CSS classes to any field using the `className` property:

```json
// Single class
{
  "type": "textfield",
  "name": "./title",
  "label": "Title",
  "className": "custom-field-style"
}

// Multiple classes (string with spaces)
{
  "type": "select",
  "name": "./type",
  "label": "Type",
  "className": "highlight-field required-indicator",
  "options": [...]
}

// Multiple classes (array format)
{
  "type": "textarea",
  "name": "./description",
  "label": "Description",
  "className": ["large-textarea", "rich-editor"]
}
```

The `className` property allows you to:
- Apply custom styling to specific fields
- Add JavaScript selector hooks for custom behavior
- Highlight important or required fields visually
- Maintain consistent styling across similar fields

**Note:** Custom classes are merged with existing Granite UI classes (like show/hide classes) and added to the field's `granite:class` attribute.

### Field Width Control

Control the width of individual fields using the `width` property:

```json
// Fixed pixel width
{
  "type": "textfield",
  "name": "./code",
  "label": "Product Code",
  "width": "150px"
}

// Percentage width
{
  "type": "numberfield",
  "name": "./quantity",
  "label": "Qty",
  "width": "30%"
}

// Numeric value (treated as pixels)
{
  "type": "select",
  "name": "./size",
  "label": "Size",
  "width": "200",
  "options": [...]
}
```

The `width` property accepts:
- **Pixel values**: "100px", "250px"
- **Percentages**: "50%", "75%"
- **Numeric strings**: "200" (treated as pixels)
- **CSS values**: "auto", "fit-content"

**Common Use Cases:**
- Short input fields for codes, IDs, or numbers
- Compact layouts with multiple fields per row
- Consistent sizing across related fields
- Optimizing dialog space utilization

### Coral UI Spacing (Margin)

Control vertical spacing between fields using the `margin` property:

```json
// Add margin above field
{
  "type": "heading",
  "text": "Advanced Settings",
  "level": 3,
  "margin": true
}

// No margin (tight layout)
{
  "type": "textfield",
  "name": "./field1",
  "label": "Field 1",
  "margin": false
}

// Default behavior (don't specify)
{
  "type": "textfield",
  "name": "./field2",
  "label": "Field 2"
}
```

The `margin` property controls Coral UI's vertical spacing:
- **`true`**: Adds standard margin above the field
- **`false`**: Removes margin for tight layouts
- **`undefined`**: Uses Coral UI default spacing

**When to Use:**
- `margin: true`: Add visual separation before headings or new sections
- `margin: false`: Create compact, dense layouts; group tightly related fields
- Default: Most fields should use default Coral spacing

**Common Patterns:**
```json
// Section with visual breathing room
{
  "type": "heading",
  "text": "Section Title",
  "margin": true
},

// Compact field group (address fields, name parts, etc.)
{
  "type": "textfield",
  "name": "./street1",
  "label": "Street Address",
  "margin": false
},
{
  "type": "textfield",
  "name": "./street2",
  "label": "Apt/Suite",
  "margin": false
}
```

### Default Values

Set initial values for fields using the `defaultValue` property:

```json
// Text field with default
{
  "type": "textfield",
  "name": "./title",
  "label": "Title",
  "defaultValue": "Welcome Message"
}

// Number field with default
{
  "type": "numberfield",
  "name": "./quantity",
  "label": "Quantity",
  "defaultValue": 1,
  "min": 1
}

// Checkbox with default checked state
{
  "type": "checkbox",
  "name": "./enabled",
  "label": "Enable Feature",
  "defaultValue": true
}

// Select with pre-selected option
{
  "type": "select",
  "name": "./theme",
  "label": "Theme",
  "defaultValue": "dark",
  "options": [
    { "value": "light", "text": "Light" },
    { "value": "dark", "text": "Dark" }
  ]
}
```

The `defaultValue` property:
- Sets the initial value when component is first added
- Works with all field types (textfield, numberfield, checkbox, select, etc.)
- Values are stored in the `value` attribute in the XML
- Useful for sensible defaults that authors can modify

**Common Use Cases:**
- Default "Read More" text for CTAs
- Pre-set quantity to 1 in product components
- Enable features by default (opt-out vs opt-in)
- Default theme or style selection

### Field Descriptions

Add helpful descriptive text below field labels using the `description` property:

```json
{
  "type": "textfield",
  "name": "./email",
  "label": "Email Address",
  "description": "This email will be used for notification purposes only"
}

{
  "type": "pathfield",
  "name": "./backgroundImage",
  "label": "Background Image",
  "description": "Recommended size: 1920x1080px. Supports JPG, PNG, and WebP formats.",
  "rootPath": "/content/dam"
}

{
  "type": "numberfield",
  "name": "./animationDuration",
  "label": "Animation Duration",
  "description": "Duration in milliseconds. Lower values = faster animations.",
  "min": 100,
  "max": 5000,
  "defaultValue": 1000
}
```

The `description` property:
- Adds `fieldDescription` attribute in AEM
- Appears as gray text below the field label
- Helps authors understand field purpose and constraints
- Supports special characters (automatically escaped)

**When to Use:**
- Explaining technical fields (CSS classes, regex patterns)
- Providing examples or format requirements
- Clarifying business rules or constraints
- Guiding authors on best practices

**Pro Tip:** Combine with `contextualHelp` for comprehensive guidance:
```json
{
  "type": "textfield",
  "name": "./regex",
  "label": "Validation Pattern",
  "description": "JavaScript regex pattern for validation",
  "contextualHelp": {
    "text": "Enter a valid JavaScript regular expression",
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions"
  }
}
```

### Maximum Length Validation

Limit the number of characters users can enter using the `maxLength` property:

```json
// Short text field
{
  "type": "textfield",
  "name": "./title",
  "label": "Title",
  "maxLength": 50,
  "placeholder": "Maximum 50 characters"
}

// Textarea with character limit
{
  "type": "textarea",
  "name": "./description",
  "label": "Description",
  "maxLength": 500,
  "rows": 5,
  "description": "Maximum 500 characters"
}

// Product code
{
  "type": "textfield",
  "name": "./sku",
  "label": "SKU",
  "maxLength": 12,
  "placeholder": "12-char code"
}
```

The `maxLength` property:
- Adds `maxlength` attribute to the field
- Prevents users from entering more than the specified number of characters
- Browser-native validation (no form submission required)
- Works with `textfield`, `textarea`, and `pathfield` types

**Common Use Cases:**
```json
// Tweet-length content
{ "maxLength": 280 }

// Meta descriptions for SEO
{ "maxLength": 160 }

// Headline/Title fields
{ "maxLength": 100 }

// Product codes or IDs
{ "maxLength": 20 }
```

**Best Practices:**
- Always inform users about the limit (via description or placeholder)
- Consider UX: extremely restrictive limits can frustrate authors
- Use in combination with required validation for data quality
- Common limits: 50 (titles), 160 (meta), 500 (short descriptions), 2000 (long content)

### Empty Text

Provide placeholder text using the `emptyText` property (Coral UI native alternative to `placeholder`):

```json
// Search field
{
  "type": "textfield",
  "name": "./search",
  "label": "Search",
  "emptyText": "Type to search..."
}

// Email with format example
{
  "type": "textfield",
  "name": "./email",
  "label": "Email",
  "emptyText": "example@domain.com"
}

// Date format hint
{
  "type": "textfield",
  "name": "./eventDate",
  "label": "Event Date",
  "emptyText": "MM/DD/YYYY"
}
```

The `emptyText` property:
- Native Coral UI property (semantic alternative to placeholder)
- Displays hint text in empty fields
- Disappears when user starts typing
- If both `placeholder` and `emptyText` are specified, `emptyText` takes precedence

**Difference from `placeholder`:**
- `placeholder` → Converted to `emptyText` in AEM (for backward compatibility)
- `emptyText` → Direct Coral UI property (more semantic)
- Both achieve the same visual result
- Use `emptyText` for new implementations, `placeholder` for familiarity

**Common Patterns:**
```json
// Format hints
{ "emptyText": "YYYY-MM-DD" }
{ "emptyText": "(555) 123-4567" }

// Action prompts
{ "emptyText": "Start typing..." }
{ "emptyText": "Select an option" }

// Examples
{ "emptyText": "e.g., John Doe" }
{ "emptyText": "e.g., /content/mysite/en" }
```

**Pro Tip:** For complex format requirements, combine with `description` or `validation`:
```json
{
  "type": "textfield",
  "name": "./phone",
  "label": "Phone Number",
  "emptyText": "(555) 123-4567",
  "description": "US phone numbers only",
  "validation": {
    "pattern": "^\\(\\d{3}\\) \\d{3}-\\d{4}$",
    "message": "Please use format: (555) 123-4567"
  }
}
```

```

### Granite ID (Custom Field IDs)

Assign custom IDs to fields for JavaScript integration and specific styling using the `graniteId` property:

```json
// Custom field ID for JavaScript hooks
{
  "type": "select",
  "name": "./contentType",
  "label": "Content Type",
  "graniteId": "content-type-selector",
  "options": [...]
}

// For dynamic field manipulation
{
  "type": "textfield",
  "name": "./dynamicField",
  "label": "Dynamic Field",
  "graniteId": "js-dynamic-field"
}

// Multiple fields with coordinated IDs
{
  "type": "checkbox",
  "name": "./enableAdvanced",
  "label": "Enable Advanced",
  "graniteId": "advanced-toggle",
  "cqShowHide": true,
  "showhideTarget": ".advanced-options"
},
{
  "type": "numberfield",
  "name": "./advancedValue",
  "label": "Advanced Value",
  "graniteId": "advanced-input",
  "showhideClass": "advanced-options"
}
```

The `graniteId` property:
- Adds `granite:id` attribute to the field
- Provides stable, predictable IDs for JavaScript selectors
- Useful for custom client libraries and interactions
- Better than relying on generated or name-based IDs

**Common Use Cases:**
- Custom JavaScript validation or formatting
- Integration with third-party libraries
- Dynamic field behavior (calculations, cascading dropdowns)
- Automated testing with stable selectors
- CSS styling for specific fields

**Best Practices:**
```json
// Use descriptive, kebab-case IDs
{ "graniteId": "hero-title-input" }
{ "graniteId": "primary-cta-link" }

// Prefix by component or feature
{ "graniteId": "carousel-slide-count" }
{ "graniteId": "video-autoplay-toggle" }

// Avoid generic names
// ❌ Bad: "field1", "input", "select"
// ✅ Good: "product-sku", "author-bio", "featured-image"
```

### Tracking Feature (Analytics Integration)

Add analytics tracking identifiers to fields using the `trackingFeature` property:

```json
// Track field usage in Adobe Analytics
{
  "type": "select",
  "name": "./template",
  "label": "Template Selection",
  "trackingFeature": "template-selector",
  "options": [...]
}

// Track feature toggles
{
  "type": "checkbox",
  "name": "./enableVideo",
  "label": "Enable Video Background",
  "trackingFeature": "video-background-toggle"
}

// Track specific component interactions
{
  "type": "pathfield",
  "name": "./ctaLink",
  "label": "CTA Link",
  "trackingFeature": "hero-cta-link",
  "rootPath": "/content"
}
```

The `trackingFeature` property:
- Adds `trackingFeature` attribute for analytics frameworks
- Enables tracking of component configuration patterns
- Helps identify which features are most used by authors
- Integrates with Adobe Analytics or custom tracking solutions

**Enterprise Use Cases:**
```json
// Component adoption tracking
{
  "trackingFeature": "layout-grid-usage"
}

// Feature flag analysis
{
  "trackingFeature": "personalization-enabled"
}

// Content strategy insights
{
  "trackingFeature": "video-content-type"
}

// A/B testing configurations
{
  "trackingFeature": "variation-b-selected"
}
```

**Analytics Dashboard Examples:**
- Most configured component features
- Template selection trends
- Feature adoption rates
- Author workflow patterns

### Render Hidden

Conditionally hide fields in the UI while preserving their functionality using the `renderHidden` property:

```json
// Hidden until condition met
{
  "type": "textfield",
  "name": "./apiKey",
  "label": "API Key",
  "renderHidden": true,
  "description": "Only shown to administrators"
}

// Programmatically revealed field
{
  "type": "numberfield",
  "name": "./advancedSetting",
  "label": "Advanced Setting",
  "renderHidden": true
}

// Combined with conditional logic
{
  "type": "select",
  "name": "./mode",
  "label": "Mode",
  "options": [
    { "value": "simple", "text": "Simple" },
    { "value": "advanced", "text": "Advanced" }
  ]
},
{
  "type": "textfield",
  "name": "./advancedConfig",
  "label": "Advanced Config",
  "renderHidden": true,
  "description": "Revealed when Advanced mode is selected"
}
```

The `renderHidden` property:
- Adds `renderHidden="{Boolean}true"` attribute
- Hides field in dialog UI but keeps it in DOM
- Different from `type: "hidden"` (which never renders)
- Can be shown/hidden dynamically with JavaScript
- Field still submits its value when form is saved

**Difference from `type: "hidden"`:**
| Feature | `renderHidden: true` | `type: "hidden"` |
|---------|---------------------|------------------|
| In DOM | ✅ Yes | ❌ No |
| Can be revealed | ✅ Yes | ❌ No |
| Label shown | ❌ No (while hidden) | ❌ Never |
| Use case | Conditional UI | Always hidden data |

**Common Patterns:**
```json
// Admin-only fields
{
  "renderHidden": true,
  "graniteId": "admin-field",
  "description": "Revealed for admin users via JS"
}

// Progressive disclosure
{
  "renderHidden": true,
  "className": "expert-mode-field"
  // Shown when "Expert Mode" is enabled
}

// Feature flag controlled
{
  "renderHidden": true,
  "description": "Beta feature, hidden until flag enabled"
}
```

### Collapsible Fieldsets and Containers

Make fieldsets and containers collapsible to organize long dialogs using the `collapsible` property:

```json
// Collapsible fieldset
{
  "type": "fieldset",
  "name": "advancedSettings",
  "label": "Advanced Settings",
  "collapsible": true,
  "fields": [
    { "type": "textfield", "name": "./customClass", "label": "Custom CSS Class" },
    { "type": "numberfield", "name": "./zIndex", "label": "Z-Index" },
    { "type": "checkbox", "name": "./lazyLoad", "label": "Lazy Load" }
  ]
}

// Collapsible container
{
  "type": "container",
  "name": "seoOptions",
  "collapsible": true,
  "fields": [
    { "type": "textfield", "name": "./metaTitle", "label": "Meta Title", "maxLength": 60 },
    { "type": "textarea", "name": "./metaDescription", "label": "Meta Description", "maxLength": 160 }
  ]
}

// Multiple collapsible sections
{
  "type": "fieldset",
  "name": "styling",
  "label": "Styling Options",
  "collapsible": true,
  "fields": [
    { "type": "colorfield", "name": "./backgroundColor", "label": "Background Color" },
    { "type": "colorfield", "name": "./textColor", "label": "Text Color" }
  ]
},
{
  "type": "fieldset",
  "name": "animation",
  "label": "Animation Settings",
  "collapsible": true,
  "fields": [
    { "type": "select", "name": "./effect", "label": "Effect", "options": [...] },
    { "type": "numberfield", "name": "./duration", "label": "Duration (ms)" }
  ]
}
```

The `collapsible` property:
- Adds `collapsible="{Boolean}true"` attribute
- Renders a collapse/expand toggle icon
- Helps organize long dialogs into manageable sections
- Users can collapse sections they don't need
- Works with `fieldset` and `container` types

**Best Practices:**
```json
// Group related optional settings
{
  "type": "fieldset",
  "label": "Optional: SEO Settings",
  "collapsible": true,
  "fields": [...]
}

// Separate advanced from basic options
{
  "type": "fieldset",
  "label": "Basic Settings",
  "collapsible": false,  // Always visible
  "fields": [...]
},
{
  "type": "fieldset",
  "label": "Advanced Settings",
  "collapsible": true,  // Collapsed by default
  "fields": [...]
}

// Technical/developer options
{
  "type": "fieldset",
  "label": "Developer Options",
  "collapsible": true,
  "description": "Technical settings for advanced users",
  "fields": [...]
}
```

**When to Use:**
- Dialogs with 10+ fields
- Optional or rarely-used settings
- Advanced configuration sections
- Grouping related fields for better UX
- SEO, analytics, or technical settings

**Dialog Organization Pattern:**
```json
{
  "title": "Hero Component",
  "tabs": [
    {
      "title": "Content",
      "fields": [
        // Always visible core fields
        { "type": "textfield", "name": "./title", "label": "Title" },
        { "type": "textarea", "name": "./description", "label": "Description" },
        
        // Collapsible optional sections
        {
          "type": "fieldset",
          "label": "Call to Action",
          "collapsible": true,
          "fields": [
            { "type": "textfield", "name": "./ctaText", "label": "CTA Text" },
            { "type": "pathfield", "name": "./ctaLink", "label": "CTA Link" }
          ]
        }
      ]
    }
  ]
}
```

### Filter (Path-based Pickers)

Filter selectable items in path-based pickers using the `filter` property:

```json
// Filter by folder type in pathfield
{
  "type": "pathfield",
  "name": "./folderPath",
  "label": "Select Folder",
  "filter": "folder",
  "rootPath": "/content"
}

// Filter by MIME type in assetpicker
{
  "type": "assetpicker",
  "name": "./pdfDocument",
  "label": "PDF Document",
  "filter": "mimetype:application/pdf",
  "rootPath": "/content/dam"
}

// Filter by multiple MIME types
{
  "type": "assetpicker",
  "name": "./media",
  "label": "Image or Video",
  "filter": "mimetype:image/*,mimetype:video/*",
  "rootPath": "/content/dam/media"
}

// Filter pages by template in pagefield
{
  "type": "pagefield",
  "name": "./targetPage",
  "label": "Target Page",
  "filter": "template:/conf/mysite/settings/wcm/templates/landing-page",
  "rootPath": "/content/mysite"
}

// Filter by node type
{
  "type": "pathfield",
  "name": "./contentPath",
  "label": "Content Path",
  "filter": "hierarchyNotFile",
  "rootPath": "/content"
}
```

The `filter` property:
- Restricts selectable items in path browsers
- Works with `pathfield`, `pagefield`, and `assetpicker`
- Supports multiple filter types

**Common Filter Patterns:**
```json
// Asset types
{ "filter": "folder" }                              // Only folders
{ "filter": "hierarchyNotFile" }                    // Folders and pages (no files)
{ "filter": "mimetype:image/*" }                    // All images
{ "filter": "mimetype:image/jpeg,mimetype:image/png" }  // Specific image formats
{ "filter": "mimetype:application/pdf" }            // PDF documents
{ "filter": "mimetype:video/*" }                    // All videos

// Page templates
{ "filter": "template:/conf/mysite/settings/wcm/templates/page" }
{ "filter": "template:/apps/mysite/templates/homepage" }

// Combined filters
{ "filter": "folder,mimetype:image/*" }             // Folders and images
```

**Use Cases:**
- **Image pickers**: Restrict to specific image formats (JPG, PNG, WebP)
- **Document pickers**: Allow only PDFs or Office documents
- **Folder selection**: Ensure users select folders, not files
- **Template-based**: Show only specific page types (landing pages, articles)
- **Content organization**: Guide authors to correct content locations

### Force Ignore Freshness (DAM Assets)

Force revalidation of DAM assets to avoid cache issues using the `forceIgnoreFreshness` property:

```json
// Force asset revalidation
{
  "type": "pathfield",
  "name": "./heroImage",
  "label": "Hero Image",
  "forceIgnoreFreshness": true,
  "filter": "mimetype:image/*",
  "rootPath": "/content/dam/images"
}

// For assetpicker with frequently updated assets
{
  "type": "assetpicker",
  "name": "./productImage",
  "label": "Product Image",
  "forceIgnoreFreshness": true,
  "rootPath": "/content/dam/products"
}

// Combined with other properties
{
  "type": "pathfield",
  "name": "./brandAsset",
  "label": "Brand Asset",
  "forceIgnoreFreshness": true,
  "filter": "folder,mimetype:image/*",
  "required": true,
  "rootPath": "/content/dam/brand-assets"
}
```

The `forceIgnoreFreshness` property:
- Adds `forceIgnoreFreshness="{Boolean}true"` attribute
- Forces AEM to revalidate asset metadata and thumbnails
- Bypasses client-side caching for asset browser
- Useful for frequently updated or time-sensitive assets

**When to Use:**
```json
// Frequently updated assets
{
  "forceIgnoreFreshness": true,
  "description": "Product images updated daily"
}

// Time-sensitive content
{
  "forceIgnoreFreshness": true,
  "description": "Campaign assets with expiration dates"
}

// Multi-environment sync issues
{
  "forceIgnoreFreshness": true,
  "description": "Assets replicated across environments"
}

// Cache-sensitive workflows
{
  "forceIgnoreFreshness": true,
  "description": "Assets modified by external DAM processes"
}
```

**Performance Note:**
Only use `forceIgnoreFreshness: true` when necessary, as it bypasses caching and may impact performance. Most asset pickers don't need this property.

### Delete Confirmation (Multifield)

Add confirmation messages when deleting multifield items using the `deleteHint` property:

```json
// Simple confirmation
{
  "type": "multifield",
  "name": "./slides",
  "label": "Carousel Slides",
  "deleteHint": "Are you sure you want to delete this slide?",
  "composite": true,
  "fields": [
    { "type": "textfield", "name": "./title", "label": "Title" },
    { "type": "pathfield", "name": "./image", "label": "Image", "rootPath": "/content/dam" }
  ]
}

// Specific context warning
{
  "type": "multifield",
  "name": "./team",
  "label": "Team Members",
  "deleteHint": "Removing this team member cannot be undone. Continue?",
  "maxItems": 10,
  "fields": [
    { "type": "textfield", "name": "./name", "label": "Name", "required": true },
    { "type": "textfield", "name": "./role", "label": "Role" }
  ]
}

// Critical data warning
{
  "type": "multifield",
  "name": "./configurations",
  "label": "API Configurations",
  "deleteHint": "⚠️ Deleting this configuration may break integrations. Are you absolutely sure?",
  "minItems": 1,
  "fields": [
    { "type": "textfield", "name": "./endpoint", "label": "Endpoint URL", "required": true },
    { "type": "textfield", "name": "./apiKey", "label": "API Key" }
  ]
}
```

The `deleteHint` property:
- Adds `deleteHint` attribute to multifield
- Shows confirmation dialog before deleting items
- Prevents accidental deletions
- Customizable message for context

**Message Guidelines:**
```json
// Casual/Simple content
{ "deleteHint": "Delete this item?" }
{ "deleteHint": "Remove this entry?" }

// Important content
{ "deleteHint": "Are you sure you want to delete this item?" }
{ "deleteHint": "This action cannot be undone. Continue?" }

// Critical/System data
{ "deleteHint": "⚠️ WARNING: Deleting this may cause system issues. Proceed?" }
{ "deleteHint": "This will permanently remove the configuration. Are you absolutely sure?" }

// Contextual hints
{ "deleteHint": "Removing this slide will affect the carousel. Delete anyway?" }
{ "deleteHint": "This member is referenced in 3 projects. Still delete?" }
```

**Best Practices:**
- Always use for complex composite multifields
- Use for items with many fields or significant data
- Make messages clear and actionable
- Consider the user's context and what they're deleting
- Optional for simple single-field multifields (like tag lists)

### Ordered/Sortable Multifields

Enable drag & drop reordering of multifield items using the `ordered` property:

```json
// Sortable carousel slides
{
  "type": "multifield",
  "name": "./slides",
  "label": "Carousel Slides (Drag to Reorder)",
  "ordered": true,
  "composite": true,
  "fields": [
    { "type": "textfield", "name": "./title", "label": "Title" },
    { "type": "pathfield", "name": "./image", "label": "Image", "rootPath": "/content/dam" },
    { "type": "textarea", "name": "./description", "label": "Description", "rows": 3 }
  ]
}

// Sortable navigation items
{
  "type": "multifield",
  "name": "./navigation",
  "label": "Navigation Items",
  "ordered": true,
  "deleteHint": "Remove this navigation item?",
  "fields": [
    { "type": "textfield", "name": "./label", "label": "Label", "required": true },
    { "type": "pathfield", "name": "./link", "label": "Link", "rootPath": "/content" }
  ]
}

// Priority list with ordering
{
  "type": "multifield",
  "name": "./priorities",
  "label": "Priority Tasks (Order Matters)",
  "ordered": true,
  "minItems": 1,
  "maxItems": 10,
  "fields": [
    { "type": "textfield", "name": "./task", "label": "Task", "required": true },
    { "type": "select", "name": "./status", "label": "Status", "options": [
      { "value": "pending", "text": "Pending" },
      { "value": "complete", "text": "Complete" }
    ]}
  ]
}

// Combined with deleteHint
{
  "type": "multifield",
  "name": "./steps",
  "label": "Process Steps",
  "ordered": true,
  "deleteHint": "Delete this step?",
  "description": "Drag items to reorder the process flow",
  "composite": true,
  "fields": [
    { "type": "numberfield", "name": "./stepNumber", "label": "Step #", "disabled": true },
    { "type": "textfield", "name": "./stepName", "label": "Step Name", "required": true },
    { "type": "textarea", "name": "./instructions", "label": "Instructions" }
  ]
}
```

The `ordered` property:
- Adds `orderable="{Boolean}true"` attribute
- Enables drag & drop handles on multifield items
- Preserves order in JCR (item order matters)
- Visual indication of sortability in dialog

**When Order Matters:**
```json
// Sequential content
{ "ordered": true }  // Carousel slides, image galleries, step-by-step guides

// Navigation structures
{ "ordered": true }  // Menu items, breadcrumbs, footer links

// Priority lists
{ "ordered": true }  // Featured products, top articles, recommended items

// Process flows
{ "ordered": true }  // Workflow steps, tutorial stages, form sections

// Timeline events
{ "ordered": true }  // Historical events, project milestones, release notes
```

**When Order Doesn't Matter:**
```json
// Unordered collections
{ "ordered": false }  // Tags, categories, team members, contact addresses

// Sets (no intrinsic order)
// Default behavior - no need to specify ordered: false
```

**UX Tips:**
- Add "(Drag to Reorder)" or similar to label when `ordered: true`
- Use description to explain ordering significance
- Consider combining with `deleteHint` for safety
- Visual drag handles appear automatically in AEM Touch UI

**Example - Complete Sortable Multifield:**
```json
{
  "type": "multifield",
  "name": "./testimonials",
  "label": "Customer Testimonials (Drag to Reorder by Priority)",
  "description": "Order determines display sequence on the homepage",
  "ordered": true,
  "deleteHint": "Remove this testimonial?",
  "minItems": 3,
  "maxItems": 10,
  "composite": true,
  "fields": [
    { "type": "textarea", "name": "./quote", "label": "Quote", "required": true, "maxLength": 300 },
    { "type": "textfield", "name": "./author", "label": "Author Name", "required": true },
    { "type": "textfield", "name": "./position", "label": "Position/Company" },
    { "type": "pathfield", "name": "./photo", "label": "Photo", "rootPath": "/content/dam/testimonials", "filter": "mimetype:image/*" },
    { "type": "numberfield", "name": "./rating", "label": "Rating", "min": 1, "max": 5, "defaultValue": 5 }
  ]
}
```

## Additional Field Properties

### Multifield Control

```json
{
  "type": "multifield",
  "name": "./items",
  "label": "Items",
  "minItems": 1,
  "maxItems": 5,
  "renderReadOnly": false,
  "deleteHint": "Are you sure you want to delete this item?",
  "fields": [...]
}
```

### Type Hints

Used to force specific data types in the JCR:

```json
{
  "type": "textfield",
  "name": "./count",
  "label": "Count",
  "typeHint": "Long"
}
```

Common type hints: `String`, `Boolean`, `Long`, `Double`, `Date`

### Validation with Regex

Add pattern validation to text inputs:

```json
{
  "type": "textfield",
  "name": "./email",
  "label": "Email",
  "validation": {
    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    "message": "Please enter a valid email address"
  }
}
```

The `validation` object supports:
- `pattern` (String): Regular expression for validation
- `message` (String): Custom error message shown to the user

**Common patterns:**
```json
// Email
"pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"

// Phone (10 digits)
"pattern": "^\\d{10}$"

// URL
"pattern": "^https?://.*$"

// Alphanumeric only
"pattern": "^[a-zA-Z0-9]+$"
```

### Autocomplete

For textfield inputs:

```json
{
  "type": "textfield",
  "name": "./email",
  "label": "Email",
  "autocomplete": "email"
}
```

Common values: `off`, `on`, `name`, `email`, `username`, `tel`, `url`

### Custom Data Attributes

Pass any Granite UI property using the exact property name:

```json
{
  "type": "textfield",
  "name": "./field",
  "label": "Field",
  "granite:class": "custom-class",
  "granite:data-custom": "value"
}
```

## Layouts

### Tabs Layout (Default)

```json
{
  "title": "My Component",
  "tabs": [
    {
      "title": "Content",
      "fields": [...]
    },
    {
      "title": "Styling",
      "fields": [...]
    }
  ]
}
```

### Simple Layout

For components with few fields:

```json
{
  "title": "Simple Component",
  "layout": "simple",
  "fields": [
    {
      "type": "textfield",
      "name": "./title",
      "label": "Title"
    }
  ]
}
```

## Complete Examples

### Hero Component

```json
{
  "title": "Hero Component",
  "tabs": [
    {
      "title": "Content",
      "fields": [
        {
          "type": "textfield",
          "name": "./title",
          "label": "Title",
          "required": true
        },
        {
          "type": "rte",
          "name": "./description",
          "label": "Description",
          "features": ["bold", "italic", "links"]
        },
        {
          "type": "fieldset",
          "label": "Call to Action",
          "fields": [
            {
              "type": "textfield",
              "name": "./ctaText",
              "label": "Button Text"
            },
            {
              "type": "pathfield",
              "name": "./ctaLink",
              "label": "Button Link",
              "rootPath": "/content"
            }
          ]
        }
      ]
    },
    {
      "title": "Media",
      "fields": [
        {
          "type": "pathfield",
          "name": "./backgroundImage",
          "label": "Background Image",
          "rootPath": "/content/dam",
          "required": true
        }
      ]
    },
    {
      "title": "Settings",
      "fields": [
        {
          "type": "select",
          "name": "./alignment",
          "label": "Text Alignment",
          "defaultValue": "center",
          "options": [
            { "value": "left", "text": "Left" },
            { "value": "center", "text": "Center" },
            { "value": "right", "text": "Right" }
          ]
        },
        {
          "type": "checkbox",
          "name": "./overlay",
          "label": "Dark Overlay",
          "text": "Add dark overlay"
        }
      ]
    }
  ]
}
```

### Carousel Component

```json
{
  "title": "Carousel Component",
  "tabs": [
    {
      "title": "Slides",
      "fields": [
        {
          "type": "multifield",
          "name": "./slides",
          "label": "Carousel Slides",
          "composite": true,
          "minItems": 2,
          "maxItems": 10,
          "deleteHint": "Are you sure you want to remove this slide?",
          "fields": [
            {
              "type": "textfield",
              "name": "./title",
              "label": "Slide Title",
              "required": true,
              "maxlength": 100
            },
            {
              "type": "textarea",
              "name": "./description",
              "label": "Description",
              "rows": 3
            },
            {
              "type": "pathfield",
              "name": "./image",
              "label": "Image",
              "rootPath": "/content/dam"
            },
            {
              "type": "textfield",
              "name": "./ctaText",
              "label": "CTA Text"
            },
            {
              "type": "pathfield",
              "name": "./ctaLink",
              "label": "CTA Link",
              "rootPath": "/content"
            }
          ]
        }
      ]
    },
    {
      "title": "Settings",
      "fields": [
        {
          "type": "checkbox",
          "name": "./autoplay",
          "label": "Autoplay",
          "text": "Enable autoplay"
        },
        {
          "type": "numberfield",
          "name": "./interval",
          "label": "Interval (ms)",
          "defaultValue": 5000,
          "min": 1000,
          "max": 10000
        }
      ]
    }
  ]
}
```

### Testimonials Component

```json
{
  "title": "Testimonials Component",
  "tabs": [
    {
      "title": "Testimonials",
      "fields": [
        {
          "type": "multifield",
          "name": "./testimonials",
          "label": "Customer Testimonials",
          "composite": true,
          "fields": [
            {
              "type": "textarea",
              "name": "./quote",
              "label": "Quote",
              "required": true,
              "rows": 4
            },
            {
              "type": "textfield",
              "name": "./author",
              "label": "Author Name",
              "required": true
            },
            {
              "type": "textfield",
              "name": "./position",
              "label": "Position"
            },
            {
              "type": "pathfield",
              "name": "./avatar",
              "label": "Photo",
              "rootPath": "/content/dam"
            },
            {
              "type": "numberfield",
              "name": "./rating",
              "label": "Rating",
              "min": 1,
              "max": 5,
              "defaultValue": 5
            }
          ]
        }
      ]
    }
  ]
}
```

### Product Card Component (Using image, radiogroup, autocomplete)

Example showcasing `image`, `radiogroup`, and `autocomplete` field types:

```json
{
  "title": "Product Card Component",
  "tabs": [
    {
      "title": "Product Info",
      "fields": [
        {
          "type": "textfield",
          "name": "./productName",
          "label": "Product Name",
          "required": true
        },
        {
          "type": "image",
          "name": "./productImage",
          "label": "Product Image",
          "required": true,
          "uploadUrl": "/content/dam/products",
          "mimeTypes": ["image/jpeg", "image/png", "image/webp"]
        },
        {
          "type": "text",
          "text": "Use high-quality images with minimum 800x800 pixels for best results.",
          "variant": "info"
        },
        {
          "type": "autocomplete",
          "name": "./productCategory",
          "label": "Category",
          "required": true,
          "datasource": "/apps/mysite/datasources/categories",
          "forceSelection": true
        },
        {
          "type": "autocomplete",
          "name": "./relatedProducts",
          "label": "Related Products",
          "multiple": true,
          "datasource": "/apps/mysite/datasources/products"
        },
        {
          "type": "textarea",
          "name": "./description",
          "label": "Description",
          "rows": 5
        }
      ]
    },
    {
      "title": "Display",
      "fields": [
        {
          "type": "heading",
          "text": "Card Layout",
          "level": 3
        },
        {
          "type": "radiogroup",
          "name": "./cardStyle",
          "label": "Card Style",
          "options": [
            { "value": "standard", "text": "Standard", "checked": true },
            { "value": "compact", "text": "Compact" },
            { "value": "featured", "text": "Featured" }
          ]
        },
        {
          "type": "radiogroup",
          "name": "./imagePosition",
          "label": "Image Position",
          "vertical": true,
          "options": [
            { "value": "top", "text": "Top", "checked": true },
            { "value": "left", "text": "Left" },
            { "value": "right", "text": "Right" }
          ]
        },
        {
          "type": "checkbox",
          "name": "./showPrice",
          "label": "Show Price",
          "text": "Display product price"
        },
        {
          "type": "checkbox",
          "name": "./showRating",
          "label": "Show Rating",
          "text": "Display star rating"
        }
      ]
    }
  ]
}
```

### Blog Post Component (Using New Field Types)

Example showcasing `heading`, `text/alert`, and `tags` field types:

```json
{
  "title": "Blog Post Component",
  "tabs": [
    {
      "title": "Content",
      "fields": [
        {
          "type": "heading",
          "text": "Article Content",
          "level": 3
        },
        {
          "type": "textfield",
          "name": "./title",
          "label": "Post Title",
          "required": true
        },
        {
          "type": "rte",
          "name": "./content",
          "label": "Content",
          "features": ["*"]
        },
        {
          "type": "heading",
          "text": "Featured Image",
          "level": 3
        },
        {
          "type": "pathfield",
          "name": "./featuredImage",
          "label": "Image",
          "rootPath": "/content/dam"
        },
        {
          "type": "text",
          "text": "The featured image will be used in article previews and social media shares.",
          "variant": "info"
        }
      ]
    },
    {
      "title": "Metadata",
      "fields": [
        {
          "type": "heading",
          "text": "Article Classification",
          "level": 3
        },
        {
          "type": "tags",
          "name": "./cq:tags",
          "label": "Article Tags",
          "required": true,
          "rootPath": "/content/cq:tags/blog"
        },
        {
          "type": "text",
          "text": "Tags help organize content and improve SEO. Select at least one tag.",
          "variant": "info"
        },
        {
          "type": "heading",
          "text": "Publishing",
          "level": 3
        },
        {
          "type": "datepicker",
          "name": "./publishDate",
          "label": "Publish Date",
          "required": true
        },
        {
          "type": "text",
          "text": "Warning: Published articles will be visible to all users immediately.",
          "variant": "warning"
        },
        {
          "type": "textfield",
          "name": "./author",
          "label": "Author",
          "required": true
        }
      ]
    }
  ]
}
```

## Best Practices

### 1. Use Fieldsets for Logical Grouping

✅ **Good:**
```json
{
  "type": "fieldset",
  "label": "Author Information",
  "fields": [
    { "type": "textfield", "name": "./authorName", "label": "Name" },
    { "type": "textfield", "name": "./authorEmail", "label": "Email" }
  ]
}
```

### 2. Choose the Right Layout

- **Tabs**: Complex components with many fields (>8)
- **Simple**: Basic components with few fields (<5)
- **Fieldsets**: Group related fields within tabs

### 3. Multifield Usage

- **Simple multifield**: Single field repeated (tags, URLs)
- **Composite multifield**: Multiple related fields (slides, team members)

### 4. RTE Configuration

- Use `"*"` for full-featured editor
- Specify individual features for simpler editors
- Always include `"bold"`, `"italic"` as minimum

### 5. Use Headings and Alerts for Better UX

✅ **Good:**
```json
{
  "type": "heading",
  "text": "SEO Settings",
  "level": 3
},
{
  "type": "text",
  "text": "These settings improve search engine visibility.",
  "variant": "info"
},
{
  "type": "textfield",
  "name": "./metaTitle",
  "label": "Meta Title"
}
```

**Benefits:**
- Visual separation of dialog sections
- Context and help for authors
- Warnings for important settings
- No data stored (purely presentational)

### 6. Tags for Content Organization

Use the `tags` field type instead of textfield for taxonomy:

✅ **Good:**
```json
{
  "type": "tags",
  "name": "./cq:tags",
  "label": "Categories",
  "rootPath": "/content/cq:tags/mysite"
}
```

❌ **Avoid:**
```json
{
  "type": "textfield",
  "name": "./category",
  "label": "Category"
}
```

**Benefits:**
- Consistent taxonomy across site
- Tag validation and autocomplete
- Integration with AEM's tag management
- Better search and filtering

### 7. Choose the Right Selection Control

**Select vs RadioGroup vs Autocomplete:**

- **select**: Use for 5+ options or when space is limited
- **radiogroup**: Use for 2-4 options that should be immediately visible
- **autocomplete**: Use for dynamic lists or searchable options with many items

✅ **RadioGroup for few options:**
```json
{
  "type": "radiogroup",
  "name": "./alignment",
  "label": "Text Alignment",
  "options": [
    { "value": "left", "text": "Left" },
    { "value": "center", "text": "Center" },
    { "value": "right", "text": "Right" }
  ]
}
```

✅ **Autocomplete for many options:**
```json
{
  "type": "autocomplete",
  "name": "./author",
  "label": "Select Author",
  "datasource": "/apps/mysite/datasources/authors",
  "multiple": false
}
```

### 8. Image Upload Best Practices

Always specify image constraints and provide guidance:

```json
{
  "type": "image",
  "name": "./heroImage",
  "label": "Hero Image",
  "required": true,
  "uploadUrl": "/content/dam/mysite/heroes",
  "mimeTypes": ["image/jpeg", "image/png", "image/webp"]
},
{
  "type": "text",
  "text": "Recommended size: 1920x1080 pixels. Maximum file size: 2MB.",
  "variant": "info"
}
```

**Benefits:**
- Clear expectations for content authors
- Consistent image quality
- Proper DAM organization
- Format validation

## Troubleshooting

### XML files not generated

1. Check `dialog.json` exists in component folder
2. Verify JSON is valid
3. Check paths in webpack config are correct
4. Enable `verbose: true` to see logs

### Wrong field types

Make sure you're using supported types:
- **Form fields**: textfield, textarea, pathfield, pagefield, checkbox, select, radiogroup
- **Special inputs**: datepicker, numberfield, colorfield, switch, hidden, fileupload, image
- **Advanced**: multifield, fieldset, container, rte, autocomplete
- **AEM Pickers**: contentfragmentpicker, experiencefragmentpicker, assetpicker
- **Organizational**: heading, text/alert, tags

### Build errors

```bash
# Check webpack config
cat webpack.common.js | grep AemDialogGeneratorPlugin

# Verify paths
ls -la src/main/webpack/components/*/dialog.json
```

## Output Example

**Input** (`dialog.json`):
```json
{
  "title": "Button",
  "layout": "simple",
  "fields": [
    {
      "type": "textfield",
      "name": "./text",
      "label": "Text",
      "required": true
    }
  ]
}
```

**Output** (`_cq_dialog/.content.xml`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0" 
          xmlns:jcr="http://www.jcp.org/jcr/1.0"
          xmlns:nt="http://www.jcp.org/jcr/nt/1.0" 
          xmlns:cq="http://www.day.com/jcr/cq/1.0"
          xmlns:granite="http://www.adobe.com/jcr/granite/1.0"
    jcr:primaryType="nt:unstructured"
    jcr:title="Button"
    sling:resourceType="cq/gui/components/authoring/dialog">
    <content
        granite:class="cmp-button__editor"
        jcr:primaryType="nt:unstructured">
        <items jcr:primaryType="nt:unstructured">
            <columns
                jcr:primaryType="nt:unstructured"
                sling:resourceType="granite/ui/components/coral/foundation/fixedcolumns"
                margin="{Boolean}true">
                <items jcr:primaryType="nt:unstructured">
                    <column
                        jcr:primaryType="nt:unstructured"
                        sling:resourceType="granite/ui/components/coral/foundation/container">
                        <items jcr:primaryType="nt:unstructured">
                            <text
                                jcr:primaryType="nt:unstructured"
                                sling:resourceType="granite/ui/components/coral/foundation/form/textfield"
                                fieldLabel="Text"
                                name="./text"
                                required="{Boolean}true"/>
                        </items>
                    </column>
                </items>
            </columns>
        </items>
    </content>
</jcr:root>
```

## Project Structure

```
project/
├── ui.frontend/
│   ├── src/main/webpack/components/
│   │   ├── button/
│   │   │   ├── dialog.json          ← Define here
│   │   │   └── button.scss
│   │   └── hero/
│   │       ├── dialog.json          ← Define here
│   │       └── hero.scss
│   └── webpack.common.js             ← Configure plugin
└── ui.apps/
    └── src/main/content/jcr_root/apps/mysite/components/
        ├── button/
        │   └── _cq_dialog/
        │       └── .content.xml      ← Generated here
        └── hero/
            └── _cq_dialog/
                └── .content.xml      ← Generated here
```

## Development

### Running Tests

The plugin includes a comprehensive test suite with 38 tests covering all functionality.

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Test Coverage**: 89.8% (statements), 66.66% (branches), 93.33% (functions)

### Building

The plugin is written in vanilla JavaScript and requires no build step. Simply install dependencies:

```bash
npm install
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/yourusername/aem-dialog-generator-plugin/issues) page.
