# AEM Dialog Generator Plugin

A Webpack plugin that automatically generates AEM component `_cq_dialog.xml` files from simple JSON configurations.

[![npm version](https://img.shields.io/npm/v/aem-dialog-generator-plugin.svg)](https://www.npmjs.com/package/aem-dialog-generator-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-89.8%25-brightgreen.svg)](https://github.com/yourusername/aem-dialog-generator-plugin)

## Features

✨ **15 Field Types Supported** - textfield, textarea, select, pathfield, checkbox, multifield, RTE, fieldset, and more  
🎨 **Flexible Layouts** - Tabs, simple layouts, or fieldsets for organization  
🔄 **Auto-generation** - XML files generated on every webpack build  
📝 **Simple JSON** - Easy-to-read configuration instead of verbose XML  
🎯 **Multifield Support** - Both simple and composite multifields  
📋 **Rich Text Editor** - Full RTE configuration with customizable features  
🗂️ **Folder Structure** - Supports both `_cq_dialog/.content.xml` and `_cq_dialog.xml` formats

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

#### multifield - Repeatable Fields

**Simple Multifield** (single field repeated):
```json
{
  "type": "multifield",
  "name": "./tags",
  "label": "Tags",
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
          "fields": [
            {
              "type": "textfield",
              "name": "./title",
              "label": "Slide Title",
              "required": true
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

## Troubleshooting

### XML files not generated

1. Check `dialog.json` exists in component folder
2. Verify JSON is valid
3. Check paths in webpack config are correct
4. Enable `verbose: true` to see logs

### Wrong field types

Make sure you're using supported types:
- textfield, textarea, pathfield, checkbox, select
- datepicker, numberfield, colorfield, switch, hidden, fileupload
- multifield, fieldset, rte

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
