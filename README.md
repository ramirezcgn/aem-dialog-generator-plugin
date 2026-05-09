# AEM Dialog Generator Plugin

A Webpack plugin that automatically generates AEM component `_cq_dialog.xml` and `_cq_design_dialog.xml` files with associated policies from simple JSON configurations. Features intelligent automation including automatic style tab generation, policy-to-template mapping, and dynamic indentation for production-ready AEM components.

[![npm version](https://img.shields.io/npm/v/aem-dialog-generator-plugin.svg)](https://www.npmjs.com/package/aem-dialog-generator-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-89.8%25-brightgreen.svg)](https://github.com/yourusername/aem-dialog-generator-plugin)

## Features

- **30+ Field Types** - textfield, textarea, select, pathfield, pagefield, checkbox, alert, multifield, RTE, fieldset, container, heading, text, tags, image, autocomplete, radiogroup, contentfragmentpicker, experiencefragmentpicker, assetpicker, hidden, button, well, include, styletab, and more
- **Custom Resource Types** - Override `sling:resourceType` on any field via `resourceType` for unsupported or project-specific components
- **Extended Datasource** - `datasource` accepts a string, an object with extra attributes (e.g. `rootPath`), or a shorthand `type` (`"tags"`) for built-in AEM datasources; fieldset and container also support `datasource` as the sole content source without requiring static `fields`
- **Flexible Layouts** - Tabs, simple layouts, accordion, or fieldsets for organization
- **Auto-generation** - XML files generated on every webpack build
- **Simple JSON** - Easy-to-read configuration instead of verbose XML
- **Multifield Support** - Both simple and composite multifields with delete confirmation and drag & drop reordering
- **Rich Text Editor** - Full RTE configuration with customizable features
- **Folder Structure** - Supports both `_cq_dialog/.content.xml` and `_cq_dialog.xml` formats
- **Show/Hide** - Dynamic field visibility based on dropdown or checkbox values
- **Image Upload** - Built-in support for DAM integration and file uploads
- **Page Selection** - Native AEM page picker with content tree navigation
- **Content Fragments** - Full support for Content Fragment and Experience Fragment pickers
- **Validation** - Regex patterns, plain string validator keys, min/max values, required fields, maxLength
- **Contextual Help** - Inline help tooltips and documentation links
- **Custom Styling** - CSS classes, field width control, and Coral UI spacing
- **Field Enhancements** - Default values, descriptions, placeholder/emptyText, autoFocus, wrapperClass
- **Enterprise Features** - Custom IDs (`granite:id`), analytics tracking (`trackingFeature`, `trackingElement`), render hidden, collapsible sections
- **Advanced Pickers** - Filter support, freshness control for DAM assets
- **typeHint** - Force JCR data type on save (String, Boolean, Long, etc.)
- **Design Dialogs** - Generate design dialogs (`_cq_design_dialog`) for component policies
- **Policy Generation** - Automatically create component policies with RTE config, styles, and more
- **Style System** - Define style groups and variants for the AEM Style System
- **Component Mapping** - Configure asset-to-component drag & drop mappings
- **Auto Style Tab** - Automatic `cq:styles` tab generation when styleGroups are present
- **Template Integration** - Automatic policy-to-template mapping for seamless deployment
- **Include / Styletab** - Embed any Granite UI include node, with a `styletab` shorthand for the AEM Style System edit tab
- **Dialog Root Attributes** - `extraClientlibs`, `helpPath`, and `trackingFeature` on the `jcr:root` node of both dialog and design dialog
- **Render Conditions** - `renderCondition` supports `simple`, `privilege`, `feature`, `and`, `or`, `legacy:simple`, full resource type paths, and explicit `resourceType` overrides
- **graniteData child node** - `graniteData` prop generates a `<granite:data>` child node with arbitrary attributes (distinct from `data`, which generates inline `granite:data-*` attributes)
- **Select Enhancements** - `selectType: 'editable'` creates a combobox-style input; options support `selected` and `hide` (→ `granite:hide`) attributes

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
      generatePolicies: true,
      policiesTargetDir: path.resolve(__dirname, '../ui.content/src/main/content/jcr_root/conf/mysite/settings/wcm/policies'),
      templatePoliciesDir: path.resolve(__dirname, '../ui.content/src/main/content/jcr_root/conf/mysite/settings/wcm/templates'),
      autoMapPoliciesToTemplates: true
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
            {
              "value": "primary",
              "text": "Primary"
            },
            {
              "value": "secondary",
              "text": "Secondary"
            }
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
| `designDialogFileName` | String | `designDialog.json` | Name of the design dialog JSON configuration file |
| `appName` | String | `mysite` | AEM application name |
| `useFolderStructure` | Boolean | `true` | Use `_cq_dialog/.content.xml` (true) or `_cq_dialog.xml` (false) |
| `verbose` | Boolean | `false` | Enable detailed logging |
| `generatePolicies` | Boolean | `true` | Enable automatic policy generation from designDialog.json |
| `policiesTargetDir` | String | `../ui.content/.../policies` | Target folder for generated policy XML files |
| `templatePoliciesDir` | String | `../ui.content/.../templates` | Target folder for template policy mapping |
| `autoMapPoliciesToTemplates` | Boolean | `true` | Automatically map policies to specified templates |

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

## Design Dialogs & Component Policies

The plugin now supports generating Design Dialogs (`_cq_design_dialog`) and their associated component policies. This simplifies the complex task of configuring component policies in AEM.

### Creating a Design Dialog

Create a `designDialog.json` file alongside your `dialog.json`:

**Example: `src/main/webpack/components/button/designDialog.json`**

```json
{
  "title": "Button Design",
  "layout": "simple",
  "fields": [
    {
      "type": "checkbox",
      "name": "./enableVariants",
      "label": "Enable Button Variants",
      "description": "Allow authors to choose between different button styles"
    },
    {
      "type": "checkbox",
      "name": "./enableSizes",
      "label": "Enable Size Options"
    }
  ],
  "policy": {
    "name": "policy_button",
    "title": "Button Policy",
    "description": "Policy configuration for button component",
    "properties": {
      "allowedVariants": "[primary,secondary,outline]",
      "enableAnimation": "{Boolean}true"
    },
    "styleGroups": [
      {
        "name": "variants",
        "label": "Button Variants",
        "styles": [
          {
            "name": "primary",
            "label": "Primary",
            "classes": "cmp-button--primary"
          },
          {
            "name": "secondary",
            "label": "Secondary",
            "classes": "cmp-button--secondary"
          }
        ]
      }
    ]
  }
}
```

### Policy Configuration

The `policy` object in your `designDialog.json` supports:

#### Basic Policy Properties

```json
{
  "policy": {
    "name": "policy_mycomponent",
    "title": "My Component Policy",
    "description": "Policy description shown in template editor",
    "properties": {
      "customProperty": "value",
      "enableFeature": "{Boolean}true",
      "maxItems": "{Long}5"
    }
  }
}
```

#### Style System Configuration

Define style groups for the AEM Style System:

```json
{
  "policy": {
    "styleGroups": [
      {
        "name": "layout",
        "label": "Layout Options",
        "styles": [
          {
            "name": "grid",
            "label": "Grid Layout",
            "classes": "cmp-container--grid",
            "icon": "viewGrid"
          },
          {
            "name": "flex",
            "label": "Flex Layout",
            "classes": "cmp-container--flex"
          }
        ]
      }
    ]
  }
}
```

#### RTE Plugin Configuration

Configure Rich Text Editor plugins in policies:

```json
{
  "policy": {
    "rtePlugins": {
      "format": {
        "features": "bold,italic,underline"
      },
      "paraformat": {
        "features": "*",
        "formats": [
          {
            "description": "Heading 1",
            "tag": "h1"
          },
          {
            "description": "Heading 2",
            "tag": "h2"
          },
          {
            "description": "Paragraph",
            "tag": "p"
          }
        ]
      },
      "links": {
        "features": "modifylink,unlink"
      },
      "lists": {
        "features": "*"
      },
      "justify": {
        "features": "-"
      },
      "table": {
        "features": "-"
      }
    }
  }
}
```

#### Component Mapping

Configure asset-to-component drag & drop mappings:

```json
{
  "policy": {
    "componentMapping": [
      {
        "assetGroup": "media",
        "assetMimetype": "image/*",
        "droptarget": "image",
        "resourceType": "mysite/components/image"
      },
      {
        "assetGroup": "content",
        "assetMimetype": "text/html",
        "droptarget": "experiencefragment",
        "resourceType": "mysite/components/experiencefragment"
      }
    ]
  }
}
```

### Complete Design Dialog Example

**Hero Component with Full Policy Configuration:**

```json
{
  "title": "Hero Design",
  "layout": "tabs",
  "tabs": [
    {
      "title": "Layout Options",
      "fields": [
        {
          "type": "select",
          "name": "./defaultLayout",
          "label": "Default Layout",
          "defaultValue": "centered",
          "options": [
            {
              "text": "Centered",
              "value": "centered"
            },
            {
              "text": "Left Aligned",
              "value": "left"
            },
            {
              "text": "Right Aligned",
              "value": "right"
            }
          ]
        },
        {
          "type": "checkbox",
          "name": "./allowBackgroundImage",
          "label": "Allow Background Image"
        }
      ]
    }
  ],
  "policy": {
    "name": "policy_hero",
    "title": "Hero Component Policy",
    "description": "Comprehensive policy for hero component",
    "properties": {
      "allowedLayouts": "[centered,left,right]",
      "minHeight": "{Long}400",
      "maxHeight": "{Long}800"
    },
    "rtePlugins": {
      "format": {
        "features": "bold,italic"
      },
      "paraformat": {
        "features": "*",
        "formats": [
          {
            "description": "Heading 1",
            "tag": "h1"
          },
          {
            "description": "Paragraph",
            "tag": "p"
          }
        ]
      },
      "links": {
        "features": "modifylink,unlink"
      }
    },
    "styleGroups": [
      {
        "name": "layouts",
        "label": "Hero Layouts",
        "styles": [
          {
            "name": "centered",
            "label": "Centered",
            "classes": "cmp-hero--centered"
          },
          {
            "name": "left",
            "label": "Left Aligned",
            "classes": "cmp-hero--left"
          }
        ]
      },
      {
        "name": "themes",
        "label": "Color Themes",
        "styles": [
          {
            "name": "light",
            "label": "Light Theme",
            "classes": "cmp-hero--light"
          },
          {
            "name": "dark",
            "label": "Dark Theme",
            "classes": "cmp-hero--dark"
          }
        ]
      }
    ]
  }
}
```

### Generated Output

When you build, the plugin generates:

1. **Design Dialog XML**: `ui.apps/.../button/_cq_design_dialog/.content.xml`
2. **Policy XML**: `ui.content/.../policies/button/.content.xml`
3. **Template Mapping**: Automatically maps policies to specified templates (when `autoMapPoliciesToTemplates: true`)

The policy XML is structured according to AEM standards and can be referenced in your page templates.

### Automatic Features

The plugin now includes several automatic features to streamline AEM component development:

#### Automatic cq:styles Tab Generation

When a policy includes `styleGroups`, the plugin automatically generates a `cq:styles` tab in the design dialog:

```json
{
  "policy": {
    "styleGroups": [
      {
        "name": "variants",
        "label": "Button Variants",
        "styles": [...]
      }
    ]
  }
}
```

#### Automatic Policy-to-Template Mapping

Configure which templates should use a component policy by adding a `templates` array to your policy:

```json
{
  "policy": {
    "name": "policy_section_container",
    "title": "Section Container Policy",
    "description": "Policy for section component",
    "templates": ["page-content", "landing-page"]
  }
}
```

The plugin will automatically update the template policy files to include the mapping:

```xml
<section
    cq:policy="mysite/components/section/policy_section_container"
    jcr:primaryType="nt:unstructured"
    sling:resourceType="wcm/core/components/policies/mapping"/>
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
    {
      "value": "type1",
      "text": "Type 1"
    },
    {
      "value": "type2",
      "text": "Type 2"
    }
  ]
}
```

**Option properties:**

| Property | Type | Description |
|----------|------|-------------|
| `value` | String | The stored value |
| `text` | String | Display label |
| `selected` | Boolean | Pre-select this option (`selected="{Boolean}true"`) |
| `hide` | Boolean \| String | Hide this option; `true` → `granite:hide="{Boolean}true"`, or pass an EL string |

**Select field properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `emptyOption` | Boolean | Add an empty first option | `false` |
| `forceSelection` | Boolean | Require a valid option to be selected | `false` |
| `multiple` | Boolean | Allow multiple selections | `false` |
| `selectType` | String | Set to `'editable'` to render an editable combobox instead of a standard dropdown | - |

When `selectType: 'editable'` is set, the generated XML includes `type="editable"`, which renders the field as a combobox — authors can either pick from the list or type a custom value.

## Advanced Properties

- Show/Hide by expression: use `showIf` or `hideIf` to emit `granite:hide` and control field visibility.
- Select datasource: add `datasource` (child node), `emptyOption`, `forceSelection`. Accepts three forms: a plain string (`sling:resourceType`), an object with `resourceType` plus extra attributes, or an object with `type` shorthand for built-in AEM datasources (`"tags"`).
- Validation messages: override built-ins with `requiredMessage`, `minMessage`, `maxMessage`, `patternMessage`.
- Order fields: place with `orderBefore` (emits `sling:orderBefore`).
- Granite data: set `data: { key: value }` → `granite:data-key="value"` attributes inline on the field. For a separate `<granite:data>` child node with arbitrary attributes, use `graniteData: { key: value }` instead.
- Render conditions: `renderCondition` supports `simple`, `privilege`, `feature`, `and`, `or`, `legacy:simple`, full resource type paths (any string containing `/`), and an explicit `resourceType` override. See the render condition example below.
- Multifield UX: `addItemLabel`, `maxItemsMessage`, `minItemsMessage`, `reorderableHandle`.
- QoL inputs: `clearButton` (textfield), `autocomplete`, `ariaLabel`, `ariaDescribedBy`, `tooltipIcon`.

Examples:

```json
{
  "type": "textfield",
  "name": "./videoUrl",
  "label": "Video URL",
  "showIf": {
    "field": "./contentType",
    "value": "video"
  },
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
  "type": "select",
  "name": "./tag",
  "label": "Select Tag",
  "datasource": {
    "type": "tags",
    "rootPath": "/content/cq:tags/products"
  }
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
      {
        "type": "simple",
        "expression": "${currentUser == 'admin'}"
      },
      {
        "type": "privilege",
        "privilege": "jcr:read"
      }
    ]
  }
}
```

```json
{
  "type": "textfield",
  "name": "./betaField",
  "label": "Beta Feature",
  "renderCondition": {
    "type": "feature",
    "feature": "com.mysite.beta.feature"
  }
}
```

```json
{
  "type": "textfield",
  "name": "./legacyField",
  "label": "Legacy Field",
  "renderCondition": {
    "type": "legacy:simple",
    "expression": "${currentUser == 'admin'}"
  }
}
```

```json
{
  "type": "textfield",
  "name": "./customConditionField",
  "label": "Custom Condition",
  "renderCondition": {
    "resourceType": "mysite/components/renderconditions/custom",
    "param": "someValue"
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
  "uncheckedValue": "false",
  "checked": true
}
```

Generates a Coral UI checkbox (`granite/ui/components/coral/foundation/form/checkbox`).

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `name` | String | Property name (required) | - |
| `label` | String | Used as the visible checkbox label (`text` attribute in XML) | - |
| `value` | String | Value saved when checked | `{Boolean}true` |
| `uncheckedValue` | String | Value saved when unchecked | `false` |
| `checked` | Boolean \| String | Initial checked state; pass `true`/`false` or an EL expression (e.g. `"${not empty cqDesign.autoplay}"`) | - |
| `description` | String | Help text below the field | - |
| `required` | Boolean | Make field mandatory | `false` |
| `disabled` | Boolean | Disable the field | `false` |

> **Note:** The `label` property sets the checkbox's visible text label (mapped to the `text` XML attribute). There is no separate `text` property — `label` covers both the field label and the display text.

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
| `type` | String | Button type attribute | - |
| `disabled` | Boolean | Disable the button | `false` |

#### include - Embed a Granite UI Include
```json
{
  "type": "include",
  "name": "myInclude",
  "path": "/mnt/overlay/path/to/component"
}
```

Embeds any Granite UI component via `granite/ui/components/coral/foundation/include`. Useful for injecting shared tabs or panels that are not generated by this plugin.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `path` | String | Path to the Granite UI resource to include (required) | - |
| `name` | String | JCR node name | auto-generated |

#### styletab - AEM Style System Tab
```json
{
  "type": "styletab"
}
```

Shorthand that injects the AEM Style System tab into the **edit dialog** (`_cq_dialog`). Generates:

```xml
<styletab
    jcr:primaryType="nt:unstructured"
    sling:resourceType="granite/ui/components/coral/foundation/include"
    path="/mnt/overlay/cq/gui/components/authoring/dialog/style/tab_edit/styletab"/>
```

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `name` | String | JCR node name | `styletab` |

**Usage example** — add the style tab alongside your custom tabs:
```json
{
  "title": "My Component",
  "tabs": [
    {
      "title": "Properties",
      "fields": [
        {
          "type": "textfield",
          "name": "./title",
          "label": "Title"
        }
      ]
    },
    {
      "type": "styletab"
    }
  ]
}
```

> **Note:** The design dialog (`_cq_design_dialog`) also includes a style tab automatically when `styleGroups` are present in the policy configuration — no extra config required.

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

Fieldset also supports a `datasource` property. When present, the plugin generates a `<datasource>` child node and `fields`/`items` become optional — the fieldset can be driven entirely by the datasource:

```json
{
  "type": "fieldset",
  "label": "Dynamic Options",
  "datasource": {
    "resourceType": "mysite/datasources/options"
  }
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

Like fieldset, container also accepts a `datasource` property (without requiring `fields`).

**Differences:**
- **fieldset**: Form-specific grouping with a visible label (`jcr:title`). Requires `label` property.
- **container**: Generic grouping element without visual label. The `name` property is optional (used only for node naming).

**Note:** Both support `showhideClass` for hiding entire groups of fields together. Both support `datasource`, `renderCondition`, and `graniteData`.

#### fixedcolumns - Multi-Column Layout
```json
{
  "type": "fixedcolumns",
  "columns": [
    {
      "fields": [
        {
          "type": "textfield",
          "name": "./firstName",
          "label": "First Name"
          },
        {
          "type": "textfield",
          "name": "./email",
          "label": "Email"
        }
      ]
    },
    {
      "fields": [
        {
          "type": "textfield",
          "name": "./lastName",
          "label": "Last Name"
        },
        {
          "type": "textfield",
          "name": "./phone",
          "label": "Phone"
        }
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

#### well - Visual Grouping Container
```json
{
  "type": "well",
  "name": "advancedSettings",
  "fields": [
    {
      "type": "textfield",
      "name": "./cssClass",
      "label": "CSS Class"
    },
    {
      "type": "numberfield",
      "name": "./zIndex",
      "label": "Z-Index"
    },
    {
      "type": "checkbox",
      "name": "./customBehavior",
      "label": "Enable Custom Behavior"
    }
  ]
}
```

A well is a container with a subtle gray background that visually groups related fields.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `fields` | Array | Array of field definitions to display in the well |
| `name` | String | Optional custom node name |

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

#### text - Informational Text
```json
{
  "type": "text",
  "text": "This setting will affect all child pages.",
  "variant": "warning"
}
```

Displays static informational text. Does not store any data.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `text` | String | The message to display (required) | - |
| `variant` | String | Visual style: `info`, `warning`, `error`, `success` | `info` |

#### alert - Coral UI Alert Component
```json
{
  "type": "alert",
  "text": "Changes to this field will affect all child pages.",
  "variant": "warning",
  "size": "S"
}
```

Renders a proper Coral UI `<coral-alert>` component (`granite/ui/components/coral/foundation/alert`). Does not store any data. Use `alert` when you need the full Coral alert appearance; use `text` for simple inline notices.

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `text` | String | The alert message (required) | - |
| `variant` | String | Visual style: `info`, `warning`, `error`, `success` | `info` |
| `size` | String | Alert size: `S`, `M`, `L` | `S` |

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

#### radiogroup - Radio Button Group
```json
{
  "type": "radiogroup",
  "name": "./layout",
  "label": "Layout",
  "vertical": false,
  "options": [
    {
      "value": "grid",
      "text": "Grid"
    },
    {
      "value": "list",
      "text": "List",
      "checked": true
    }
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
| `defaultValue` | Any | Default selected value | - |
| `disabled` | Boolean | Disable the field | `false` |
| `required` | Boolean | Make field mandatory | `false` |

**Option Properties:**
- `value` (String): The value to store
- `text` (String): Display text
- `checked` (Boolean): Default selected option

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

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `rootPath` | String | Root path in content tree | `/content` |
| `multiple` | Boolean | Allow multiple page selection | `false` |
| `filter` | String | Filter node types or properties | - |
| `pickerSrc` | String | Custom picker dialog source | - |
| `pickerTitle` | String | Custom picker dialog title | - |
| `pickerMultiselect` | Boolean | Enable multiselect in picker | `false` |
| `forceSelection` | Boolean | Only allow values from picker | `false` |
| `typeHint` | String | JCR/Sling type hint | - |
| `disabled` | Boolean | Disable the field | `false` |
| `required` | Boolean | Make field mandatory | `false` |

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

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `rootPath` | String | Root path in DAM | `/content/dam` |
| `fragmentModel` | String | Path to specific Content Fragment Model | - |
| `multiple` | Boolean | Allow multiple fragment selection | `false` |
| `filter` | String | Filter fragment types | - |
| `pickerSrc` | String | Custom picker dialog source | - |
| `typeHint` | String | JCR/Sling type hint | - |
| `disabled` | Boolean | Disable the field | `false` |
| `required` | Boolean | Make field mandatory | `false` |

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

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `rootPath` | String | Root path for XF | `/content/experience-fragments` |
| `multiple` | Boolean | Allow multiple XF selection | `false` |
| `filter` | String | Filter XF types | - |
| `pickerSrc` | String | Custom picker dialog source | - |
| `typeHint` | String | JCR/Sling type hint | - |
| `disabled` | Boolean | Disable the field | `false` |
| `required` | Boolean | Make field mandatory | `false` |

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

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `rootPath` | String | Root path in DAM | `/content/dam` |
| `mimeTypes` | Array | Allowed mime types | - |
| `multiple` | Boolean | Allow multiple asset selection | `false` |
| `filter` | String | Filter asset types | - |
| `pickerSrc` | String | Custom picker dialog source | - |
| `pickerTitle` | String | Custom picker dialog title | - |
| `pickerMultiselect` | Boolean | Enable multiselect in picker | `false` |
| `forceSelection` | Boolean | Only allow values from picker | `false` |
| `typeHint` | String | JCR/Sling type hint | - |
| `disabled` | Boolean | Disable the field | `false` |
| `required` | Boolean | Make field mandatory | `false` |

#### rte - Rich Text Editor
```json
{
  "type": "rte",
  "name": "./text",
  "label": "Content",
  "required": true,
  "disabled": false,
  "readOnly": false,
  "height": "300px",
  "width": "100%",
  "maxlength": 5000,
  "features": ["bold", "italic", "underline", "links", "lists"]
}
```

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|  
| `name` | String | Property name (required) | - |
| `label` | String | Field label (required) | - |
| `required` | Boolean | Make field mandatory | `false` |
| `disabled` | Boolean | Disable the editor | `false` |
| `readOnly` | Boolean | Make editor read-only | `false` |
| `height` | String | Editor height (CSS value) | - |
| `width` | String | Editor width (CSS value) | - |
| `maxlength` | Number | Maximum character count | - |
| `useFixedInlineToolbar` | Boolean | Use fixed inline toolbar | `false` |
| `features` | Array | Enabled RTE features | `['*']` |

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
  "showhideTarget": ".content-fields",
  "options": [
    {
      "text": "Image",
      "value": "image"
    },
    {
      "text": "Video",
      "value": "video"
    },
    {
      "text": "Text",
      "value": "text"
    }
  ]
}
```

Then define containers that will be shown/hidden based on the selected value:

```json
{
  "type": "container",
  "showhideClass": "content-fields",
  "showhidetargetvalue": "image",
  "fields": [
    {
      "type": "pathfield",
      "name": "./imagePath",
      "label": "Image Path",
      "rootPath": "/content/dam"
    },
    {
      "type": "textfield",
      "name": "./altText",
      "label": "Alt Text"
    }
  ]
},
{
  "type": "container",
  "showhideClass": "content-fields",
  "showhidetargetvalue": "video",
  "fields": [
    {
      "type": "pathfield",
      "name": "./videoUrl",
      "label": "Video URL"
    }
  ]
},
{
  "type": "container",
  "showhideClass": "content-fields",
  "showhidetargetvalue": "text",
  "fields": [
    {
      "type": "textarea",
      "name": "./textContent",
      "label": "Text Content"
    }
  ]
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
| `showhideTarget` | String | select, checkbox | CSS selector of elements to show/hide (e.g., ".my-fields") |
| `showhideClass` | String | fieldset, container | CSS class for elements that will be shown/hidden (e.g., "my-fields") |
| `showhidetargetvalue` | String | fieldset, container | Value that triggers showing this container (used with showhideClass) |

**Note:** You can use `showhideClass` on `fieldset` or `container` types to hide entire groups of fields together.

**Generated XML for dropdown:**
```xml
<contentType
    granite:class="cq-dialog-dropdown-showhide"
    ...>
    <granite:data
        jcr:primaryType="nt:unstructured"
        cq-dialog-dropdown-showhide-target=".content-fields"/>
    <items jcr:primaryType="nt:unstructured">
        <image text="Image" value="image"/>
        <video text="Video" value="video"/>
        <text text="Text" value="text"/>
    </items>
</contentType>

<container_123456
    sling:resourceType="granite/ui/components/coral/foundation/container"
    granite:class="hide content-fields">
    <granite:data
        jcr:primaryType="nt:unstructured"
        showhidetargetvalue="image"/>
    <items jcr:primaryType="nt:unstructured">
        <!-- image fields -->
    </items>
</container_123456>
```

**Generated XML for checkbox:**
```xml
<enableCustomSettings
    granite:class="cq-dialog-checkbox-showhide"
    ...>
    <granite:data
        jcr:primaryType="nt:unstructured"
        cq-dialog-checkbox-showhide-target=".custom-settings"/>
</enableCustomSettings>

<customValue
    granite:class="hide custom-settings"
    .../>
```

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

**showIf Properties:**
- `field` (String): Path to the field to check (e.g., `./enableAdvanced`)
- `value` (Any): Value to compare against (true, false, "video", etc.)

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
        {
          "type": "textfield",
          "name": "./title",
          "label": "Title"
        },
        {
          "type": "textarea",
          "name": "./description",
          "label": "Description"
        }
      ]
    },
    {
      "title": "Advanced Options",
      "fields": [
        {
          "type": "textfield",
          "name": "./cssClass",
          "label": "CSS Class"
        },
        {
          "type": "numberfield",
          "name": "./order",
          "label": "Display Order"
        }
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

**Properties:**
- `min` (Number): Minimum allowed value (inclusive)
- `max` (Number): Maximum allowed value (inclusive)

### Disabled and ReadOnly Fields

Control field interactivity:

```jsonc
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

### Multiple Selection

Allow selecting multiple options in dropdowns:

```json
{
  "type": "select",
  "name": "./categories",
  "label": "Categories",
  "multiple": true,
  "options": [
    {
      "text": "News",
      "value": "news"
    },
    {
      "text": "Events",
      "value": "events"
    },
    {
      "text": "Blog",
      "value": "blog"
    }
  ]
}
```

### Contextual Help

Add help icon with tooltip next to field labels:

```jsonc
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

### Custom CSS Classes

Add custom CSS classes to any field using the `className` property:

```jsonc
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

**Note:** Custom classes are merged with existing Granite UI classes (like show/hide classes) and added to the field's `granite:class` attribute.

### Field Width Control

Control the width of individual fields using the `width` property:

```jsonc
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

### Coral UI Spacing (Margin)

Control vertical spacing between fields using the `margin` property:

```jsonc
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

### Default Values

Set initial values for fields using the `defaultValue` property:

```jsonc
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
    {
      "value": "light",
      "text": "Light"
    },
    {
      "value": "dark",
      "text": "Dark"
    }
  ]
}
```

### Maximum Length Validation

Limit the number of characters users can enter using the `maxLength` property:

```jsonc
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

### Empty Text

Provide placeholder text using the `emptyText` property (Coral UI native alternative to `placeholder`):

```jsonc
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

### Granite ID (Custom Field IDs)

Assign custom IDs to fields for JavaScript integration and specific styling using the `graniteId` property:

```jsonc
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

### Tracking Feature (Analytics Integration)

Add analytics tracking identifiers to fields using the `trackingFeature` property:

```jsonc
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

### Render Hidden

Conditionally hide fields in the UI while preserving their functionality using the `renderHidden` property:

```jsonc
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
    {
      "value": "simple",
      "text": "Simple"
    },
    {
      "value": "advanced",
      "text": "Advanced"
    }
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

### Collapsible Fieldsets and Containers

Make fieldsets and containers collapsible to organize long dialogs using the `collapsible` property:

```jsonc
// Collapsible fieldset
{
  "type": "fieldset",
  "name": "advancedSettings",
  "label": "Advanced Settings",
  "collapsible": true,
  "fields": [
    {
      "type": "textfield",
      "name": "./customClass",
      "label": "Custom CSS Class"
    },
    {
      "type": "numberfield",
      "name": "./zIndex",
      "label": "Z-Index"
    },
    {
      "type": "checkbox",
      "name": "./lazyLoad",
      "label": "Lazy Load"
    }
  ]
}

// Collapsible container
{
  "type": "container",
  "name": "seoOptions",
  "collapsible": true,
  "fields": [
    {
      "type": "textfield",
      "name": "./metaTitle",
      "label": "Meta Title",
      "maxLength": 60
    },
    {
      "type": "textarea",
      "name": "./metaDescription",
      "label": "Meta Description",
      "maxLength": 160
    }
  ]
}

// Multiple collapsible sections
{
  "type": "fieldset",
  "name": "styling",
  "label": "Styling Options",
  "collapsible": true,
  "fields": [
    {
      "type": "colorfield",
      "name": "./backgroundColor",
      "label": "Background Color"
    },
    {
      "type": "colorfield",
      "name": "./textColor",
      "label": "Text Color"
    }
  ]
},
{
  "type": "fieldset",
  "name": "animation",
  "label": "Animation Settings",
  "collapsible": true,
  "fields": [
    {
      "type": "select",
      "name": "./effect",
      "label": "Effect",
      "options": [...]
    },
    {
      "type": "numberfield",
      "name": "./duration",
      "label": "Duration (ms)"
    }
  ]
}
```

### Filter (Path-based Pickers)

Filter selectable items in path-based pickers using the `filter` property:

```jsonc
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

### Force Ignore Freshness (DAM Assets)

Force revalidation of DAM assets to avoid cache issues using the `forceIgnoreFreshness` property:

```jsonc
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

### Delete Confirmation (Multifield)

Add confirmation messages when deleting multifield items using the `deleteHint` property:

```jsonc
// Simple confirmation
{
  "type": "multifield",
  "name": "./slides",
  "label": "Carousel Slides",
  "deleteHint": "Are you sure you want to delete this slide?",
  "composite": true,
  "fields": [
    {
      "type": "textfield",
      "name": "./title",
      "label": "Title"
    },
    {
      "type": "pathfield",
      "name": "./image",
      "label": "Image",
      "rootPath": "/content/dam"
    }
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
    {
      "type": "textfield",
      "name": "./name",
      "label": "Name",
      "required": true
    },
    {
      "type": "textfield",
      "name": "./role",
      "label": "Role"
    }
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
    {
      "type": "textfield",
      "name": "./endpoint",
      "label": "Endpoint URL",
      "required": true
    },
    {
      "type": "textfield",
      "name": "./apiKey",
      "label": "API Key"
    }
  ]
}
```

### Ordered/Sortable Multifields

Enable drag & drop reordering of multifield items using the `ordered` property:

```jsonc
// Sortable carousel slides
{
  "type": "multifield",
  "name": "./slides",
  "label": "Carousel Slides (Drag to Reorder)",
  "ordered": true,
  "composite": true,
  "fields": [
    {
      "type": "textfield",
      "name": "./title",
      "label": "Title"
    },
    {
      "type": "pathfield",
      "name": "./image",
      "label": "Image",
      "rootPath": "/content/dam"
    },
    {
      "type": "textarea",
      "name": "./description",
      "label": "Description",
      "rows": 3
    }
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
    {
      "type": "textfield",
      "name": "./label",
      "label": "Label",
      "required": true
    },
    {
      "type": "pathfield",
      "name": "./link",
      "label": "Link",
      "rootPath": "/content"
    }
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
    {
      "type": "textfield",
      "name": "./task",
      "label": "Task",
      "required": true
    },
    {
      "type": "select",
      "name": "./status",
      "label": "Status",
      "options": [
        {
          "value": "pending",
          "text": "Pending"
        },
        {
          "value": "complete",
          "text": "Complete"
        }
      ]
    }
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
    {
      "type": "numberfield",
      "name": "./stepNumber",
      "label": "Step #",
      "disabled": true
    },
    {
      "type": "textfield",
      "name": "./stepName",
      "label": "Step Name",
      "required": true
    },
    {
      "type": "textarea",
      "name": "./instructions",
      "label": "Instructions"
    }
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

You can also pass `validation` as a plain string to reference a named validator registered in the Granite UI client libraries:

```json
{
  "type": "textfield",
  "name": "./id",
  "label": "Component ID",
  "validation": "html-unique-id-validator"
}
```

The `validation` property supports:
- **Object** with `pattern` (regex) and optional `message`
- **String** — passed directly as the `validation` attribute (named validator key)

**Common patterns:**
```jsonc
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

## License

MIT
