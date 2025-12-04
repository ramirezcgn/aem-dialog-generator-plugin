'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Webpack Plugin to generate AEM component dialogs from JSON files
 */
class AemDialogGeneratorPlugin {
  constructor(options = {}) {
    // Contextual indentation levels for XML
    this.I = {
      F: 11, // FIELD: Fields inside column <items>
      FA: 12, // FIELD_ATTR: Field attributes
      FN: 12, // FIELD_NESTED: Internal field nodes (items, rtePlugins, etc)
      FNI: 13, // FIELD_NESTED_ITEM: Items inside internal nodes
      MI: 14, // MULTIFIELD_ITEM: Items inside composite multifield
    };

    this.options = {
      // Source folder where components with dialog.json are located
      sourceDir:
        options.sourceDir ||
        path.resolve(__dirname, 'src/main/webpack/components'),
      // Target folder where _cq_dialog/.content.xml will be generated
      targetDir:
        options.targetDir ||
        path.resolve(
          __dirname,
          '../ui.apps/src/main/content/jcr_root/apps/mysite/components'
        ),
      // JSON configuration file
      dialogFileName: options.dialogFileName || 'dialog.json',
      // App name in AEM (used in component paths)
      appName: options.appName || 'mysite',
      // Use folder structure _cq_dialog/.content.xml (true) or single file _cq_dialog.xml (false)
      useFolderStructure:
        options.useFolderStructure === undefined || options.useFolderStructure,
      // Verbose mode for logging
      verbose: options.verbose || false,
    };
  }

  apply(compiler) {
    const pluginName = 'AemDialogGeneratorPlugin';
    const { sourceDir, dialogFileName } = this.options;

    // Generate dialogs on initial compilation and watch mode
    compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
      this.log('Starting generation of AEM dialogs...');

      try {
        this.generateDialogs();
        this.log('AEM dialogs generated successfully.');
      } catch (error) {
        compilation.errors.push(new Error(`${pluginName}: ${error.message}`));
      }

      callback();
    });

    // Watch for changes in dialog.json files
    compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
      if (!fs.existsSync(sourceDir)) {
        return;
      }

      // Add all dialog.json files as dependencies so webpack watches them
      const componentFolders = fs.readdirSync(sourceDir).filter((item) => {
        const itemPath = path.join(sourceDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

      for (const componentName of componentFolders) {
        const dialogJsonPath = path.join(
          sourceDir,
          componentName,
          dialogFileName
        );

        if (fs.existsSync(dialogJsonPath)) {
          // Add the file to webpack's file dependencies
          compilation.fileDependencies.add(dialogJsonPath);
        }
      }
    });
  }

  generateDialogs() {
    const { sourceDir, targetDir, dialogFileName } = this.options;

    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source folder does not exist: ${sourceDir}`);
    }

    // Read all component folders
    const componentFolders = fs.readdirSync(sourceDir).filter((item) => {
      const itemPath = path.join(sourceDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    this.log(`Found ${componentFolders.length} components`);

    for (const componentName of componentFolders) {
      const dialogJsonPath = path.join(
        sourceDir,
        componentName,
        dialogFileName
      );

      if (fs.existsSync(dialogJsonPath)) {
        this.log(`Processing: ${componentName}`);

        try {
          const dialogConfig = JSON.parse(
            fs.readFileSync(dialogJsonPath, 'utf8')
          );
          const xmlContent = this.generateDialogXml(
            dialogConfig,
            componentName
          );

          // Create component folder in ui.apps if it doesn't exist
          const componentTargetDir = path.join(targetDir, componentName);
          if (!fs.existsSync(componentTargetDir)) {
            fs.mkdirSync(componentTargetDir, { recursive: true });
          }

          let xmlFilePath;

          if (this.options.useFolderStructure) {
            // Folder structure: _cq_dialog/.content.xml
            const dialogDir = path.join(componentTargetDir, '_cq_dialog');
            if (!fs.existsSync(dialogDir)) {
              fs.mkdirSync(dialogDir, { recursive: true });
            }
            xmlFilePath = path.join(dialogDir, '.content.xml');
          } else {
            // Single file: _cq_dialog.xml
            xmlFilePath = path.join(componentTargetDir, '_cq_dialog.xml');
          }

          fs.writeFileSync(xmlFilePath, xmlContent, 'utf8');

          this.log(`✓ Generated: ${xmlFilePath}`);
        } catch (error) {
          this.log(`✗ Error processing ${componentName}: ${error.message}`);
        }
      }
    }
  }

  generateDialogXml(config, componentName) {
    const {
      title = componentName.charAt(0).toUpperCase() + componentName.slice(1),
      tabs = [],
      fields = [],
      items = [],
      layout = 'tabs', // 'tabs' (default) or 'simple'
    } = config;

    let xml = '';
    xml += this.line(0, '<?xml version="1.0" encoding="UTF-8"?>');
    xml += this.line(
      0,
      '<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0" xmlns:jcr="http://www.jcp.org/jcr/1.0"'
    );
    xml += this.line(
      2.5,
      'xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0"'
    );
    xml += this.line(
      2.5,
      'xmlns:granite="http://www.adobe.com/jcr/granite/1.0"'
    );
    xml += this.line(1, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(1, `jcr:title="${this.escapeXml(title)}"`);
    xml += this.line(
      1,
      'sling:resourceType="cq/gui/components/authoring/dialog">'
    );
    xml += this.line(1, '<content');
    xml += this.line(2, `granite:class="cmp-${componentName}__editor"`);
    xml = xml.trimEnd() + '\n';
    xml += this.line(2, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(
      2,
      'sling:resourceType="granite/ui/components/coral/foundation/container">'
    );

    // Decide whether to use tabs layout or simple
    const useSimpleLayout =
      layout === 'simple' ||
      (tabs.length === 0 && (fields.length > 0 || items.length > 0));

    if (useSimpleLayout) {
      // Simple layout without tabs
      xml += this.line(2, '<items jcr:primaryType="nt:unstructured">');
      xml += this.line(3, '<columns');
      xml += this.line(4, 'jcr:primaryType="nt:unstructured"');
      xml += this.line(
        4,
        'sling:resourceType="granite/ui/components/coral/foundation/fixedcolumns"'
      );
      xml += this.line(4, 'margin="{Boolean}true">');
      xml += this.line(4, '<items jcr:primaryType="nt:unstructured">');
      xml += this.line(5, '<column');
      xml += this.line(6, 'jcr:primaryType="nt:unstructured"');
      xml += this.line(
        6,
        'sling:resourceType="granite/ui/components/coral/foundation/container">'
      );
      xml += this.line(6, '<items jcr:primaryType="nt:unstructured">');

      // Use fields or items
      const dialogFields = fields.length > 0 ? fields : items;
      for (const field of dialogFields) {
        xml += this.generateField(field);
      }

      xml += this.line(6, '</items>');
      xml += this.line(5, '</column>');
      xml += this.line(4, '</items>');
      xml += this.line(3, '</columns>');
      xml += this.line(2, '</items>');
    } else {
      // Layout with tabs (default)
      xml += this.line(2, '<items jcr:primaryType="nt:unstructured">');
      xml += this.line(3, '<tabs');
      xml += this.line(4, 'jcr:primaryType="nt:unstructured"');
      xml += this.line(
        4,
        'sling:resourceType="granite/ui/components/coral/foundation/tabs"'
      );
      xml += this.line(4, 'maximized="{Boolean}true">');
      xml += this.line(4, '<items jcr:primaryType="nt:unstructured">');

      // Generate tabs
      let tabIndex = 0;
      for (const tab of tabs) {
        xml += this.generateTab(tab, tabIndex);
        tabIndex++;
      }

      xml += this.line(4, '</items>');
      xml += this.line(3, '</tabs>');
      xml += this.line(2, '</items>');
    }

    xml += this.line(1, '</content>');
    xml = xml.trimEnd() + '\n';
    xml += '</jcr:root>';

    return xml;
  }

  generateTab(tab, tabIndex) {
    const {
      title = `Tab ${tabIndex + 1}`,
      fields = [],
      items = [], // Support both: fields and items
    } = tab;

    // Generate tab name from title or use an index
    const tabName =
      tab.name ||
      this.sanitizeNodeName(title).toLowerCase() ||
      `tab${tabIndex}`;

    // Use fields or items, whichever is available
    const tabFields = fields.length > 0 ? fields : items;

    let xml = '';
    xml += this.line(5, `<${tabName}`);
    xml += this.line(6, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(6, `jcr:title="${this.escapeXml(title)}"`);

    if (tabIndex === 0) {
      xml = xml.trimEnd() + '\n';
      xml += this.line(6, 'sling:orderBefore="cq:styles"');
    }

    xml = xml.trimEnd() + '\n';
    xml += this.line(
      6,
      'sling:resourceType="granite/ui/components/coral/foundation/container"'
    );
    xml += this.line(6, 'maximized="{Boolean}true">');
    xml += this.line(6, '<items jcr:primaryType="nt:unstructured">');
    xml += this.line(7, '<columns');
    xml += this.line(8, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(
      8,
      'sling:resourceType="granite/ui/components/coral/foundation/fixedcolumns"'
    );
    xml += this.line(8, 'margin="{Boolean}true">');
    xml += this.line(8, '<items jcr:primaryType="nt:unstructured">');
    xml += this.line(9, '<column');
    xml += this.line(10, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(
      10,
      'sling:resourceType="granite/ui/components/coral/foundation/container">'
    );
    xml += this.line(10, '<items jcr:primaryType="nt:unstructured">');

    // Generate fields
    for (const field of tabFields) {
      xml += this.generateField(field);
    }

    xml += this.line(10, '</items>');
    xml += this.line(9, '</column>');
    xml += this.line(8, '</items>');
    xml += this.line(7, '</columns>');
    xml += this.line(6, '</items>');
    xml += this.line(5, `</${tabName}>`);

    return xml;
  }

  generateField(field) {
    const {
      type = 'textfield',
      name,
      label,
      description,
      required = false,
      defaultValue,
      options,
      ...otherProps
    } = field;

    // If it's a multifield, use special generator
    if (type === 'multifield') {
      return this.generateMultifield(field);
    }

    // If it's a fieldset, use special generator
    if (type === 'fieldset') {
      return this.generateFieldset(field);
    }

    // If it's RTE, use special generator
    if (type === 'rte') {
      return this.generateRTE(field);
    }

    const resourceType = this.getResourceType(type);
    const fieldName = name || `./field_${Date.now()}`;
    const nodeName = this.sanitizeNodeName(fieldName);

    let xml = this.line(this.I.F, `<${nodeName}`);
    xml += this.line(this.I.FA, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FA, `sling:resourceType="${resourceType}"`);

    if (label) {
      xml += this.line(this.I.FA, `fieldLabel="${this.escapeXml(label)}"`);
    }

    if (description) {
      xml += this.line(
        this.I.FA,
        `fieldDescription="${this.escapeXml(description)}"`
      );
    }

    xml += this.line(this.I.FA, `name="${fieldName}"`);

    if (required) {
      xml += this.line(this.I.FA, 'required="{Boolean}true"');
    }

    if (defaultValue !== undefined) {
      xml += this.line(
        this.I.FA,
        `value="${this.escapeXml(defaultValue.toString())}"`
      );
    }

    // Add additional field-specific properties
    for (const [key, value] of Object.entries(otherProps)) {
      if (key !== 'options' && key !== 'fields') {
        const attr = this.generateAttributeValue(key, value);
        xml += this.line(this.I.FA, attr);
      }
    }

    // If the field has options (select, radio, etc), generate items node
    if (options && Array.isArray(options) && options.length > 0) {
      xml = xml.trimEnd() + '>\n';
      xml += this.line(this.I.FN, '<items jcr:primaryType="nt:unstructured">');

      for (const [index, option] of options.entries()) {
        const optionName = option.value || `option${index}`;
        xml += this.line(this.I.FNI, `<${optionName}`);
        xml += this.line(this.I.FNI + 1, 'jcr:primaryType="nt:unstructured"');
        xml += this.line(
          this.I.FNI + 1,
          `text="${this.escapeXml(option.text || option.value)}"`
        );
        xml += this.line(
          this.I.FNI + 1,
          `value="${this.escapeXml(option.value)}"/>`
        );
      }

      xml += this.line(this.I.FN, '</items>');
      xml += this.line(this.I.F, `</${nodeName}>`);
    } else {
      xml = xml.trimEnd() + '/>\n';
    }

    return xml;
  }

  getResourceType(type) {
    const resourceTypes = {
      textfield: 'granite/ui/components/coral/foundation/form/textfield',
      textarea: 'granite/ui/components/coral/foundation/form/textarea',
      pathfield: 'granite/ui/components/coral/foundation/form/pathfield',
      checkbox: 'granite/ui/components/coral/foundation/form/checkbox',
      select: 'granite/ui/components/coral/foundation/form/select',
      datepicker: 'granite/ui/components/coral/foundation/form/datepicker',
      numberfield: 'granite/ui/components/coral/foundation/form/numberfield',
      colorfield: 'granite/ui/components/coral/foundation/form/colorfield',
      fileupload: 'cq/gui/components/authoring/dialog/fileupload',
      switch: 'granite/ui/components/coral/foundation/form/switch',
      hidden: 'granite/ui/components/coral/foundation/form/hidden',
      multifield: 'granite/ui/components/coral/foundation/form/multifield',
      fieldset: 'granite/ui/components/coral/foundation/form/fieldset',
      rte: 'cq/gui/components/authoring/dialog/richtext',
    };

    return resourceTypes[type] || resourceTypes.textfield;
  }

  generateAttributeValue(key, value) {
    if (typeof value === 'boolean') {
      return `${key}="{Boolean}${value}"`;
    } else if (typeof value === 'number') {
      return `${key}="{Long}${value}"`;
    } else if (Array.isArray(value)) {
      return `${key}="[${value.join(',')}]"`;
    } else {
      return `${key}="${this.escapeXml(value.toString())}"`;
    }
  }

  generateFieldset(field) {
    const {
      name,
      label,
      description,
      fields = [],
      items = [],
      ...otherProps
    } = field;

    const nodeName = name
      ? this.sanitizeNodeName(name)
      : `fieldset_${Date.now()}`;
    const resourceType = this.getResourceType('fieldset');
    const fieldsetFields = fields.length > 0 ? fields : items;

    let xml = this.line(this.I.F, `<${nodeName}`);
    xml += this.line(this.I.FA, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FA, `sling:resourceType="${resourceType}"`);

    if (label) {
      xml += this.line(this.I.FA, `jcr:title="${this.escapeXml(label)}"`);
    }

    if (description) {
      xml += this.line(
        this.I.FA,
        `fieldDescription="${this.escapeXml(description)}"`
      );
    }

    // Add additional properties
    for (const [key, value] of Object.entries(otherProps)) {
      if (key !== 'type' && key !== 'fields' && key !== 'items') {
        const attr = this.generateAttributeValue(key, value);
        xml += this.line(this.I.FA, attr);
      }
    }

    xml = xml.trimEnd() + '>\n';
    xml += this.line(this.I.FN, '<items jcr:primaryType="nt:unstructured">');

    // Generate fields inside the fieldset
    for (const subField of fieldsetFields) {
      xml += this.generateField(subField);
    }

    xml += this.line(this.I.FN, '</items>');
    xml += this.line(this.I.F, `</${nodeName}>`);

    return xml;
  }

  generateRTE(field) {
    const {
      name,
      label,
      description,
      required = false,
      useFixedInlineToolbar = false,
      features = ['*'],
      ...otherProps
    } = field;

    const fieldName = name || './text';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('rte');

    let xml = this.line(this.I.F, `<${nodeName}`);
    xml += this.line(this.I.FA, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FA, `sling:resourceType="${resourceType}"`);
    xml += this.line(this.I.FA, `name="${fieldName}"`);

    if (label) {
      xml += this.line(this.I.FA, `fieldLabel="${this.escapeXml(label)}"`);
    }

    if (description) {
      xml += this.line(
        this.I.FA,
        `fieldDescription="${this.escapeXml(description)}"`
      );
    }

    if (required) {
      xml += this.line(this.I.FA, 'required="{Boolean}true"');
    }

    if (useFixedInlineToolbar) {
      xml += this.line(this.I.FA, 'useFixedInlineToolbar="{Boolean}true"');
    }

    // Add additional properties
    for (const [key, value] of Object.entries(otherProps)) {
      if (key !== 'type' && key !== 'features') {
        const attr = this.generateAttributeValue(key, value);
        xml += this.line(this.I.FA, attr);
      }
    }

    xml = xml.trimEnd() + '>\n';

    // RTE configuration
    xml += this.line(
      this.I.FN,
      '<rtePlugins jcr:primaryType="nt:unstructured">'
    );

    // If features includes '*', enable all common plugins
    if (features.includes('*')) {
      xml += this.generateRTEDefaultPlugins();
    } else {
      // Enable only specified features
      for (const feature of features) {
        xml += this.generateRTEPlugin(feature);
      }
    }

    xml += this.line(this.I.FN, '</rtePlugins>');

    // UI Config
    xml += this.line(
      this.I.FN,
      '<uiSettings jcr:primaryType="nt:unstructured">'
    );
    xml += this.line(this.I.FNI, '<cui jcr:primaryType="nt:unstructured">');
    xml += this.line(this.I.FNI + 1, '<inline');
    xml += this.line(this.I.FNI + 2, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(
      this.I.FNI + 2,
      'toolbar="[format#bold,format#italic,format#underline,#justify,#lists,links#modifylink,links#unlink,fullscreen#start]"'
    );
    xml += this.line(
      this.I.FNI + 2,
      'popovers="[justify#justifleft,justify#justifycenter,justify#justifyright,lists#unordered,lists#ordered,links#link]">'
    );
    xml += this.line(
      this.I.FNI + 2,
      '<icons jcr:primaryType="nt:unstructured">'
    );
    xml += this.line(
      this.I.FNI + 3,
      '<justify jcr:primaryType="nt:unstructured">'
    );
    xml += this.line(this.I.FNI + 4, '<justifyleft command="justifyleft"/>');
    xml += this.line(
      this.I.FNI + 4,
      '<justifycenter command="justifycenter"/>'
    );
    xml += this.line(this.I.FNI + 4, '<justifyright command="justifyright"/>');
    xml += this.line(this.I.FNI + 3, '</justify>');
    xml += this.line(
      this.I.FNI + 3,
      '<lists jcr:primaryType="nt:unstructured">'
    );
    xml += this.line(this.I.FNI + 4, '<unordered command="bullist"/>');
    xml += this.line(this.I.FNI + 4, '<ordered command="numlist"/>');
    xml += this.line(this.I.FNI + 3, '</lists>');
    xml += this.line(this.I.FNI + 2, '</icons>');
    xml += this.line(this.I.FNI + 1, '</inline>');
    xml += this.line(this.I.FNI, '</cui>');
    xml += this.line(this.I.FN, '</uiSettings>');

    xml += this.line(this.I.F, `</${nodeName}>`);

    return xml;
  }

  generateRTEDefaultPlugins() {
    let xml = '';
    xml += this.line(this.I.FNI, '<format');
    xml += this.line(this.I.FNI + 1, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 1, 'features="bold,italic,underline"/>');
    xml += this.line(this.I.FNI, '<justify');
    xml += this.line(this.I.FNI + 1, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 1, 'features="*"/>');
    xml += this.line(this.I.FNI, '<lists');
    xml += this.line(this.I.FNI + 1, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 1, 'features="*"/>');
    xml += this.line(this.I.FNI, '<links');
    xml += this.line(this.I.FNI + 1, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 1, 'features="modifylink,unlink"/>');
    xml += this.line(this.I.FNI, '<subsuperscript');
    xml += this.line(this.I.FNI + 1, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 1, 'features="*"/>');
    xml += this.line(this.I.FNI, '<paraformat');
    xml += this.line(this.I.FNI + 1, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 1, 'features="*">');
    xml += this.line(
      this.I.FNI + 1,
      '<formats jcr:primaryType="nt:unstructured">'
    );
    xml += this.line(this.I.FNI + 2, '<default');
    xml += this.line(this.I.FNI + 3, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 3, 'description="Paragraph"');
    xml += this.line(this.I.FNI + 3, 'tag="p"/>');
    xml += this.line(this.I.FNI + 2, '<h1');
    xml += this.line(this.I.FNI + 3, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 3, 'description="Heading 1"');
    xml += this.line(this.I.FNI + 3, 'tag="h1"/>');
    xml += this.line(this.I.FNI + 2, '<h2');
    xml += this.line(this.I.FNI + 3, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 3, 'description="Heading 2"');
    xml += this.line(this.I.FNI + 3, 'tag="h2"/>');
    xml += this.line(this.I.FNI + 2, '<h3');
    xml += this.line(this.I.FNI + 3, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FNI + 3, 'description="Heading 3"');
    xml += this.line(this.I.FNI + 3, 'tag="h3"/>');
    xml += this.line(this.I.FNI + 1, '</formats>');
    xml += this.line(this.I.FNI, '</paraformat>');
    return xml;
  }

  generateRTEPlugin(feature) {
    const plugins = {
      bold: '<format jcr:primaryType="nt:unstructured" features="bold"/>',
      italic: '<format jcr:primaryType="nt:unstructured" features="italic"/>',
      underline:
        '<format jcr:primaryType="nt:unstructured" features="underline"/>',
      links:
        '<links jcr:primaryType="nt:unstructured" features="modifylink,unlink"/>',
      lists: '<lists jcr:primaryType="nt:unstructured" features="*"/>',
      justify: '<justify jcr:primaryType="nt:unstructured" features="*"/>',
    };

    return plugins[feature] ? this.line(this.I.FNI, plugins[feature]) : '';
  }

  generateMultifield(field) {
    const {
      name,
      label,
      description,
      required = false,
      fields = [],
      composite = false,
      ...otherProps
    } = field;

    const fieldName = name || './items';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('multifield');

    let xml = this.line(this.I.F, `<${nodeName}`);
    xml += this.line(this.I.FA, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.FA, `sling:resourceType="${resourceType}"`);

    if (label) {
      xml += this.line(this.I.FA, `fieldLabel="${this.escapeXml(label)}"`);
    }

    if (description) {
      xml += this.line(
        this.I.FA,
        `fieldDescription="${this.escapeXml(description)}"`
      );
    }

    if (required) {
      xml += this.line(this.I.FA, 'required="{Boolean}true"');
    }

    if (composite) {
      xml += this.line(this.I.FA, 'composite="{Boolean}true"');
    }

    // Agregar propiedades adicionales
    for (const [key, value] of Object.entries(otherProps)) {
      if (key !== 'type' && key !== 'fields') {
        const attr = this.generateAttributeValue(key, value);
        xml += this.line(this.I.FA, attr);
      }
    }

    xml = xml.trimEnd() + '>\n';
    xml += this.line(this.I.FN, '<field');
    xml += this.line(this.I.FNI, 'jcr:primaryType="nt:unstructured"');

    if (composite && fields.length > 0) {
      // Composite multifield: multiple grouped fields
      xml += this.line(
        this.I.FNI,
        'sling:resourceType="granite/ui/components/coral/foundation/container"'
      );
      xml += this.line(this.I.FNI, `name="${fieldName}">`);
      xml += this.line(this.I.FNI, '<items jcr:primaryType="nt:unstructured">');

      for (const subField of fields) {
        xml += this.generateMultifieldItem(subField);
      }

      xml += this.line(this.I.FNI, '</items>');
      xml += this.line(this.I.FN, '</field>');
    } else if (fields.length > 0) {
      // Simple multifield: single repeated field
      const singleField = fields[0];
      const subResourceType = this.getResourceType(
        singleField.type || 'textfield'
      );

      xml += this.line(this.I.FNI, `sling:resourceType="${subResourceType}"`);
      xml += this.line(this.I.FNI, `name="${fieldName}"`);

      if (singleField.label) {
        xml += this.line(
          this.I.FNI,
          `fieldLabel="${this.escapeXml(singleField.label)}"`
        );
      }

      if (singleField.description) {
        xml += this.line(
          this.I.FNI,
          `fieldDescription="${this.escapeXml(singleField.description)}"`
        );
      }

      // Add additional properties of internal field
      for (const [key, value] of Object.entries(singleField)) {
        if (
          key !== 'type' &&
          key !== 'label' &&
          key !== 'description' &&
          key !== 'name'
        ) {
          const attr = this.generateAttributeValue(key, value);
          xml += this.line(this.I.FNI, attr);
        }
      }

      xml = xml.trimEnd() + '/>\n';
    } else {
      // Multifield without defined fields (use textfield as default)
      xml += this.line(
        this.I.FNI,
        'sling:resourceType="granite/ui/components/coral/foundation/form/textfield"'
      );
      xml += this.line(this.I.FNI, `name="${fieldName}"/>`);
    }

    xml += this.line(this.I.F, `</${nodeName}>`);

    return xml;
  }

  generateMultifieldItem(field) {
    const {
      type = 'textfield',
      name,
      label,
      description,
      required = false,
      defaultValue,
      options,
      ...otherProps
    } = field;

    const resourceType = this.getResourceType(type);
    const fieldName = name || `./field_${Date.now()}`;
    const nodeName = this.sanitizeNodeName(fieldName);

    let xml = this.line(this.I.MI, `<${nodeName}`);
    xml += this.line(this.I.MI + 1, 'jcr:primaryType="nt:unstructured"');
    xml += this.line(this.I.MI + 1, `sling:resourceType="${resourceType}"`);

    if (label) {
      xml += this.line(this.I.MI + 1, `fieldLabel="${this.escapeXml(label)}"`);
    }

    if (description) {
      xml += this.line(
        this.I.MI + 1,
        `fieldDescription="${this.escapeXml(description)}"`
      );
    }

    xml += this.line(this.I.MI + 1, `name="${fieldName}"`);

    if (required) {
      xml += this.line(this.I.MI + 1, 'required="{Boolean}true"');
    }

    if (defaultValue !== undefined) {
      xml += this.line(
        this.I.MI + 1,
        `value="${this.escapeXml(defaultValue.toString())}"`
      );
    }

    for (const [key, value] of Object.entries(otherProps)) {
      if (key !== 'options') {
        xml += this.line(
          this.I.MI + 1,
          this.generateAttributeValue(key, value)
        );
      }
    }

    if (options && Array.isArray(options) && options.length > 0) {
      xml = xml.trimEnd() + '>\n';
      xml += this.line(
        this.I.MI + 1,
        '<items jcr:primaryType="nt:unstructured">'
      );

      for (const [i, opt] of options.entries()) {
        const optName = opt.value || `option${i}`;
        xml += this.line(this.I.MI + 2, `<${optName}`);
        xml += this.line(this.I.MI + 3, 'jcr:primaryType="nt:unstructured"');
        xml += this.line(
          this.I.MI + 3,
          `text="${this.escapeXml(opt.text || opt.value)}"`
        );
        xml += this.line(
          this.I.MI + 3,
          `value="${this.escapeXml(opt.value)}"/>`
        );
      }

      xml += this.line(this.I.MI + 1, '</items>');
      xml += this.line(this.I.MI, `</${nodeName}>`);
    } else {
      xml = xml.trimEnd() + '/>\n';
    }

    return xml;
  }

  sanitizeNodeName(name) {
    // Remove ./ from the start and special characters to use as node name
    return name.replace(/^\.\//, '').replaceAll(/[^a-zA-Z0-9_-]/g, '_');
  }

  escapeXml(text) {
    if (typeof text !== 'string') {
      return text;
    }

    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  line(level, content) {
    return '    '.repeat(level) + content + '\n';
  }

  log(message) {
    if (this.options.verbose) {
      console.log(`[AemDialogGeneratorPlugin] ${message}`);
    }
  }
}

module.exports = AemDialogGeneratorPlugin;
