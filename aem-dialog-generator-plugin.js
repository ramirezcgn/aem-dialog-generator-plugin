'use strict';

const fs = require('node:fs');
const path = require('node:path');

class AemDialogGeneratorPlugin {
  constructor(options = {}) {
    this.I = {
      F: 11, // FIELD: Fields inside column <items>
      FA: 12, // FIELD_ATTR: Field attributes
      FN: 12, // FIELD_NESTED: Internal field nodes (items, rtePlugins, etc)
      FNI: 13, // FIELD_NESTED_ITEM: Items inside internal nodes
      MI: 14, // MULTIFIELD_ITEM: Items inside composite multifield
    };

    this.options = {
      sourceDir:
        options.sourceDir ||
        path.resolve(__dirname, 'src/main/webpack/components'),
      targetDir:
        options.targetDir ||
        path.resolve(
          __dirname,
          '../ui.apps/src/main/content/jcr_root/apps/mysite/components'
        ),
      dialogFileName: options.dialogFileName || 'dialog.json',
      appName: options.appName || 'mysite',
      useFolderStructure:
        options.useFolderStructure === undefined || options.useFolderStructure,
      verbose: options.verbose || false,
    };
  }

  apply(compiler) {
    const pluginName = 'AemDialogGeneratorPlugin';
    const { sourceDir, dialogFileName } = this.options;

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

    compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
      if (!fs.existsSync(sourceDir)) {
        return;
      }

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

          const componentTargetDir = path.join(targetDir, componentName);
          if (!fs.existsSync(componentTargetDir)) {
            fs.mkdirSync(componentTargetDir, { recursive: true });
          }

          let xmlFilePath;

          if (this.options.useFolderStructure) {
            const dialogDir = path.join(componentTargetDir, '_cq_dialog');
            if (!fs.existsSync(dialogDir)) {
              fs.mkdirSync(dialogDir, { recursive: true });
            }
            xmlFilePath = path.join(dialogDir, '.content.xml');
          } else {
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
      layout = 'tabs',
    } = config;

    let xml = '';
    xml += this.line(0, '<?xml version="1.0" encoding="UTF-8"?>');
    xml += this.buildNode(
      0,
      'jcr:root',
      {
        'xmlns:sling': 'http://sling.apache.org/jcr/sling/1.0',
        'xmlns:jcr': 'http://www.jcp.org/jcr/1.0',
        'xmlns:nt': 'http://www.jcp.org/jcr/nt/1.0',
        'xmlns:cq': 'http://www.day.com/jcr/cq/1.0',
        'xmlns:granite': 'http://www.adobe.com/jcr/granite/1.0',
        'jcr:title': title,
        'sling:resourceType': 'cq/gui/components/authoring/dialog',
      },
      'open'
    );
    xml += this.buildNode(
      1,
      'content',
      {
        'granite:class': `cmp-${componentName}__editor`,
        'sling:resourceType':
          'granite/ui/components/coral/foundation/container',
      },
      'open'
    );

    const useSimpleLayout =
      layout === 'simple' ||
      (tabs.length === 0 && (fields.length > 0 || items.length > 0));

    if (useSimpleLayout) {
      xml += this.buildNodes([
        [2, 'items'],
        [
          3,
          'columns',
          {
            'sling:resourceType':
              'granite/ui/components/coral/foundation/fixedcolumns',
            margin: '{Boolean}true',
          },
        ],
        [4, 'items'],
        [
          5,
          'column',
          {
            'sling:resourceType':
              'granite/ui/components/coral/foundation/container',
          },
        ],
        [6, 'items'],
      ]);

      const dialogFields = fields.length > 0 ? fields : items;
      for (const field of dialogFields) {
        xml += this.generateField(field);
      }

      xml += this.closeNodes([
        [6, 'items'],
        [5, 'column'],
        [4, 'items'],
        [3, 'columns'],
        [2, 'items'],
      ]);
    } else if (layout === 'accordion') {
      xml += this.buildNodes([
        [2, 'items'],
        [
          3,
          'accordion',
          {
            'sling:resourceType':
              'granite/ui/components/coral/foundation/accordion',
            margin: '{Boolean}true',
          },
        ],
        [4, 'items'],
      ]);

      tabs.forEach((item, index) => {
        xml += this.generateAccordionItem(item, index);
      });

      xml += this.closeNodes([
        [4, 'items'],
        [3, 'accordion'],
        [2, 'items'],
      ]);
    } else {
      xml += this.buildNodes([
        [2, 'items'],
        [
          3,
          'tabs',
          {
            'sling:resourceType': 'granite/ui/components/coral/foundation/tabs',
            maximized: '{Boolean}true',
          },
        ],
        [4, 'items'],
      ]);

      tabs.forEach((tab, index) => {
        xml += this.generateTab(tab, index);
      });

      xml += this.closeNodes([
        [4, 'items'],
        [3, 'tabs'],
        [2, 'items'],
      ]);
    }

    xml += this.closeNode(1, 'content');
    xml = this.trimLine(xml);
    xml += '</jcr:root>';

    return xml;
  }

  generateTab(tab, tabIndex) {
    const {
      title = `Tab ${tabIndex + 1}`,
      fields = [],
      items = [],
      showIf,
    } = tab;

    const tabName =
      tab.name ||
      this.sanitizeNodeName(title).toLowerCase() ||
      `tab${tabIndex}`;

    const tabFields = fields.length > 0 ? fields : items;

    const attributes = {
      'jcr:primaryType': 'nt:unstructured',
      'jcr:title': title,
      ...(tabIndex === 0 && { 'sling:orderBefore': 'cq:styles' }),
      'sling:resourceType': 'granite/ui/components/coral/foundation/container',
      maximized: '{Boolean}true',
    };

    let xml = this.buildNode(5, tabName, attributes, 'none');

    if (showIf && showIf.field && showIf.value !== undefined) {
      xml = this.appendAttribute(
        xml,
        6,
        {
          'granite:hide': `\${!${showIf.field} || ${showIf.field} != '${showIf.value}'}`,
        },
        { preserveSingleQuotes: true }
      );
    }

    xml = this.openBlock(xml);
    xml += this.buildNodes([
      [6, 'items'],
      [
        7,
        'columns',
        {
          'sling:resourceType':
            'granite/ui/components/coral/foundation/fixedcolumns',
          margin: '{Boolean}true',
        },
      ],
      [8, 'items'],
      [
        9,
        'column',
        {
          'sling:resourceType':
            'granite/ui/components/coral/foundation/container',
        },
      ],
      [10, 'items'],
    ]);

    for (const field of tabFields) {
      xml += this.generateField(field);
    }

    xml += this.closeNodes([
      [10, 'items'],
      [9, 'column'],
      [8, 'items'],
      [7, 'columns'],
      [6, 'items'],
      [5, tabName],
    ]);

    return xml;
  }

  generateAccordionItem(item, itemIndex) {
    const {
      title = `Section ${itemIndex + 1}`,
      fields = [],
      items = [],
      active = false,
    } = item;

    const itemName =
      item.name ||
      this.sanitizeNodeName(title).toLowerCase() ||
      `item${itemIndex}`;

    const attributes = {
      'jcr:title': title,
      'sling:resourceType': 'granite/ui/components/coral/foundation/container',
      ...(active && { active: '{Boolean}true' }),
      margin: '{Boolean}true',
    };

    let xml = this.buildNode(5, itemName, attributes, 'open');
    xml += this.buildNode(6, 'items', {}, 'open');

    const fieldsArray = fields.length > 0 ? fields : items;
    for (const field of fieldsArray) {
      xml += this.generateField(field);
    }

    xml += this.closeNodes([
      [6, 'items'],
      [5, itemName],
    ]);

    return xml;
  }

  generateField(field) {
    const {
      type = 'textfield',
      name,
      label,
      description,
      required = false,
      requiredMessage,
      disabled = false,
      readOnly = false,
      defaultValue,
      options,
      validation,
      minMessage,
      maxMessage,
      patternMessage,
      placeholder,
      emptyText,
      maxLength,
      min,
      max,
      multiple = false,
      contextualHelp,
      className,
      wrapperClass,
      width,
      margin,
      graniteId,
      trackingFeature,
      trackingElement,
      renderHidden = false,
      orderBefore,
      filter,
      forceIgnoreFreshness,
      autoFocus = false,
      typeHint,
      showIf,
      hideIf,
      data,
      renderCondition,
      datasource,
      emptyOption,
      forceSelection,
      clearButton,
      autocomplete,
      ariaLabel,
      ariaDescribedBy,
      tooltipIcon,
      cqShowHide = false,
      showhideTarget,
      showhideClass,
      ...otherProps
    } = field;

    if (type === 'multifield') {
      return this.generateMultifield(field);
    }

    if (type === 'fieldset' || type === 'container') {
      return this.generateFieldsetOrContainer(field, type);
    }

    if (type === 'well') {
      return this.generateWell(field);
    }

    if (type === 'fixedcolumns') {
      return this.generateFixedColumns(field);
    }

    if (type === 'heading') {
      return this.generateHeading(field);
    }

    if (type === 'text' || type === 'alert') {
      return this.generateText(field);
    }

    if (type === 'tags') {
      return this.generateTags(field);
    }

    if (type === 'image') {
      return this.generateImage(field);
    }

    if (type === 'autocomplete') {
      return this.generateAutocomplete(field);
    }

    if (type === 'radiogroup') {
      return this.generateRadioGroup(field);
    }

    if (type === 'pagefield') {
      return this.generatePageField(field);
    }

    if (type === 'contentfragmentpicker') {
      return this.generateContentFragmentPicker(field);
    }

    if (type === 'experiencefragmentpicker') {
      return this.generateExperienceFragmentPicker(field);
    }

    if (type === 'assetpicker') {
      return this.generateAssetPicker(field);
    }

    if (type === 'rte') {
      return this.generateRTE(field);
    }

    if (type === 'button') {
      return this.generateButton(field);
    }

    const resourceType = this.getResourceType(type);
    const fieldName = this.getFieldName(name);
    const nodeName = this.sanitizeNodeName(fieldName);

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    let graniteClasses = [];

    if (cqShowHide) {
      if (type === 'select') {
        graniteClasses.push('cq-dialog-dropdown-showhide');
      } else if (type === 'checkbox') {
        graniteClasses.push('cq-dialog-checkbox-showhide');
      }
    }

    if (showhideClass) {
      graniteClasses.push('hide', showhideClass);
    }

    if (className) {
      const customClasses =
        typeof className === 'string' ? className.split(' ') : className;
      if (Array.isArray(customClasses)) {
        graniteClasses.push(...customClasses);
      } else {
        graniteClasses.push(customClasses);
      }
    }

    if (wrapperClass) {
      const wrapperClasses =
        typeof wrapperClass === 'string'
          ? wrapperClass.split(' ')
          : wrapperClass;
      if (Array.isArray(wrapperClasses)) {
        graniteClasses.push(...wrapperClasses);
      } else {
        graniteClasses.push(wrapperClasses);
      }
    }

    if (graniteClasses.length > 0) {
      xml = this.appendAttribute(xml, this.I.FA, {
        'granite:class': graniteClasses.join(' '),
      });
    }

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      'sling:orderBefore': orderBefore,
    });

    if (showIf && showIf.field && showIf.value !== undefined) {
      xml = this.appendAttribute(
        xml,
        this.I.FA,
        {
          'granite:hide': `\${!${showIf.field} || ${showIf.field} != '${showIf.value}'}`,
        },
        { preserveSingleQuotes: true }
      );
    } else if (hideIf && hideIf.field && hideIf.value !== undefined) {
      xml = this.appendAttribute(
        xml,
        this.I.FA,
        {
          'granite:hide': `\${${hideIf.field} && ${hideIf.field} == '${hideIf.value}'}`,
        },
        { preserveSingleQuotes: true }
      );
    }

    if (contextualHelp) {
      const helpText =
        typeof contextualHelp === 'string'
          ? contextualHelp
          : contextualHelp.text;
      const helpUrl =
        typeof contextualHelp === 'object' ? contextualHelp.url : undefined;

      xml = this.appendAttribute(
        xml,
        this.I.FA,
        {
          fieldDescription: description,
          'granite:data-help': helpText,
          'granite:data-help-url': helpUrl,
          width,
          'granite:id': graniteId,
          trackingFeature,
          trackingElement,
          margin,
        },
        { allowFalsy: true }
      );
    } else {
      xml = this.appendAttribute(
        xml,
        this.I.FA,
        {
          fieldDescription: description,
          width,
          'granite:id': graniteId,
          trackingFeature,
          trackingElement,
          margin,
        },
        { allowFalsy: true }
      );
    }

    xml = this.appendAttribute(xml, this.I.FA, {
      name: fieldName,
      typeHint,
      requiredMessage,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { renderHidden, required, disabled, readOnly },
      { isBoolean: true }
    );

    if (validation) {
      xml = this.appendAttribute(xml, this.I.FA, {
        validation: validation.pattern,
        validationMessage: validation.message,
      });
    }
    xml = this.appendAttribute(
      xml,
      this.I.FA,
      {
        minMessage,
        maxMessage,
        patternMessage,
        emptyText: emptyText || placeholder,
        maxlength: maxLength === undefined ? undefined : maxLength.toString(),
        min: min === undefined ? undefined : min.toString(),
        max: max === undefined ? undefined : max.toString(),
        value: defaultValue === undefined ? undefined : defaultValue.toString(),
        filter,
      },
      { allowFalsy: true }
    );

    if (type === 'select') {
      xml = this.appendAttribute(
        xml,
        this.I.FA,
        {
          emptyOption,
          forceSelection,
        },
        { allowFalsy: true }
      );
    }

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      {
        multiple: multiple && type === 'select',
        autofocus: autoFocus,
        forceIgnoreFreshness,
        clearButton: type === 'textfield' && clearButton,
      },
      { isBoolean: true }
    );
    xml = this.appendAttribute(xml, this.I.FA, {
      autocomplete,
      ariaLabel,
      ariaDescribedBy,
      tooltipIcon,
    });

    if (data && typeof data === 'object') {
      const dataAttrs = {};
      for (const [dk, dv] of Object.entries(data)) {
        if (dv !== undefined && dv !== null) {
          dataAttrs[`granite:data-${dk}`] = dv.toString();
        }
      }
      xml = this.appendAttribute(xml, this.I.FA, dataAttrs);
    }

    if (type === 'checkbox' && cqShowHide && showhideTarget) {
      xml = this.appendAttribute(xml, this.I.FA, {
        'granite:data-cq-dialog-checkbox-showhide-target': showhideTarget,
      });
    }

    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'options',
      'fields',
      'cqShowHide',
      'showhideTarget',
      'showhideClass',
      'validation',
      'placeholder',
      'emptyText',
      'maxLength',
      'min',
      'max',
      'disabled',
      'readOnly',
      'multiple',
      'contextualHelp',
      'className',
      'wrapperClass',
      'width',
      'margin',
      'graniteId',
      'trackingFeature',
      'trackingElement',
      'renderHidden',
      'filter',
      'forceIgnoreFreshness',
      'description',
      'autoFocus',
      'typeHint',
      'orderBefore',
      'showIf',
      'hideIf',
      'data',
      'renderCondition',
      'datasource',
      'emptyOption',
      'forceSelection',
      'clearButton',
      'autocomplete',
      'ariaLabel',
      'ariaDescribedBy',
      'tooltipIcon',
      'requiredMessage',
      'minMessage',
      'maxMessage',
      'patternMessage',
    ]);

    if (options && Array.isArray(options) && options.length > 0) {
      xml = this.openBlock(xml);
      xml += this.buildNode(this.I.FN, 'items', {}, 'open');

      for (const [index, option] of options.entries()) {
        const optionName = option.value || `option${index}`;
        const optAttributes = {
          text: option.text || option.value,
          value: option.value,
        };

        if (cqShowHide && option.showhideTarget) {
          optAttributes['granite:data-cq-dialog-dropdown-showhide-target'] =
            option.showhideTarget;
        }

        xml += this.buildNode(this.I.FNI, optionName, optAttributes);
      }

      xml += this.closeNode(this.I.FN, 'items');
      if (type === 'select' && datasource) {
        xml += this.buildNode(this.I.FN, 'datasource', {
          'sling:resourceType': datasource,
        });
      }
      if (renderCondition && renderCondition.type) {
        const rcMap = {
          simple:
            'granite/ui/components/coral/foundation/renderconditions/simple',
          privilege:
            'granite/ui/components/coral/foundation/renderconditions/privilege',
          and: 'granite/ui/components/coral/foundation/renderconditions/and',
          or: 'granite/ui/components/coral/foundation/renderconditions/or',
        };
        const rcType = renderCondition.type;
        const rcRes = rcMap[rcType] || rcMap.simple;
        if (
          (rcType === 'and' || rcType === 'or') &&
          Array.isArray(renderCondition.conditions) &&
          renderCondition.conditions.length > 0
        ) {
          xml += this.buildNode(
            this.I.FN,
            'granite:rendercondition',
            { 'sling:resourceType': rcRes },
            'open'
          );
          let idx = 0;
          for (const cond of renderCondition.conditions) {
            const childRes = rcMap[cond.type || 'simple'] || rcMap.simple;
            const cn = `cond${++idx}`;
            xml += this.buildNode(
              this.I.FNI,
              cn,
              { 'sling:resourceType': childRes },
              'none'
            );
            if (cond.expression) {
              const expr = this.escapeXmlExceptSingleQuote(cond.expression);
              xml = this.appendAttribute(
                xml,
                this.I.FNI + 1,
                { expression: expr },
                { preserveSingleQuotes: true }
              );
            }
            if (cond.privilege) {
              xml = this.appendAttribute(xml, this.I.FNI + 1, {
                privilege: cond.privilege,
              });
            }
            xml = this.selfClose(xml);
          }
          xml += this.closeNode(this.I.FN, 'granite:rendercondition');
        } else {
          xml += this.buildNode(
            this.I.FN,
            'granite:rendercondition',
            { 'sling:resourceType': rcRes },
            'none'
          );
          if (renderCondition.expression) {
            const expr = this.escapeXmlExceptSingleQuote(
              renderCondition.expression
            );
            xml = this.appendAttribute(
              xml,
              this.I.FNI,
              { expression: expr },
              { preserveSingleQuotes: true }
            );
          }
          if (renderCondition.privilege) {
            xml = this.appendAttribute(xml, this.I.FNI, {
              privilege: renderCondition.privilege,
            });
          }
          xml = this.selfClose(xml);
        }
      }
      xml += this.closeNode(this.I.F, nodeName);
    } else if (
      (type === 'select' && datasource) ||
      (renderCondition && renderCondition.type)
    ) {
      xml = this.selfClose(xml);
      if (type === 'select' && datasource) {
        xml += this.buildNode(this.I.FN, 'datasource', {
          'sling:resourceType': datasource,
        });
      }
      if (renderCondition && renderCondition.type) {
        const rcMap = {
          simple:
            'granite/ui/components/coral/foundation/renderconditions/simple',
          privilege:
            'granite/ui/components/coral/foundation/renderconditions/privilege',
          and: 'granite/ui/components/coral/foundation/renderconditions/and',
          or: 'granite/ui/components/coral/foundation/renderconditions/or',
        };
        const rcType = renderCondition.type;
        const rcRes = rcMap[rcType] || rcMap.simple;
        if (
          (rcType === 'and' || rcType === 'or') &&
          Array.isArray(renderCondition.conditions) &&
          renderCondition.conditions.length > 0
        ) {
          xml += this.buildNode(
            this.I.FN,
            'granite:rendercondition',
            { 'sling:resourceType': rcRes },
            'open'
          );
          let idx = 0;
          for (const cond of renderCondition.conditions) {
            const childRes = rcMap[cond.type || 'simple'] || rcMap.simple;
            const cn = `cond${++idx}`;
            xml += this.buildNode(
              this.I.FNI,
              cn,
              { 'sling:resourceType': childRes },
              'none'
            );
            if (cond.expression) {
              const expr = this.escapeXmlExceptSingleQuote(cond.expression);
              xml = this.appendAttribute(
                xml,
                this.I.FNI + 1,
                { expression: expr },
                { preserveSingleQuotes: true }
              );
            }
            if (cond.privilege) {
              xml = this.appendAttribute(xml, this.I.FNI + 1, {
                privilege: cond.privilege,
              });
            }
            xml = this.selfClose(xml);
          }
          xml += this.closeNode(this.I.FN, 'granite:rendercondition');
        } else {
          xml += this.buildNode(
            this.I.FN,
            'granite:rendercondition',
            { 'sling:resourceType': rcRes },
            'none'
          );
          if (renderCondition.expression) {
            const expr = this.escapeXmlExceptSingleQuote(
              renderCondition.expression
            );
            xml = this.appendAttribute(
              xml,
              this.I.FNI,
              { expression: expr },
              { preserveSingleQuotes: true }
            );
          }
          if (renderCondition.privilege) {
            xml = this.appendAttribute(xml, this.I.FNI, {
              privilege: renderCondition.privilege,
            });
          }
          xml = this.selfClose(xml);
        }
      }
      xml += this.closeNode(this.I.F, nodeName);
    } else {
      xml = this.selfClose(xml);
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
      container: 'granite/ui/components/coral/foundation/container',
      well: 'granite/ui/components/coral/foundation/well',
      heading: 'granite/ui/components/coral/foundation/heading',
      text: 'granite/ui/components/coral/foundation/text',
      tags: 'cq/gui/components/coral/common/form/tagfield',
      image: 'cq/gui/components/authoring/dialog/fileupload',
      autocomplete: 'granite/ui/components/coral/foundation/form/autocomplete',
      radiogroup: 'granite/ui/components/coral/foundation/form/radiogroup',
      pagefield:
        'cq/gui/components/siteadmin/admin/searchpanel/searchpredicates/pathpredicate',
      contentfragmentpicker: 'dam/cfm/components/authoring/contentfragment',
      experiencefragmentpicker:
        'cq/experience-fragments/editor/components/experiencefragment',
      assetpicker: 'granite/ui/components/coral/foundation/form/pathfield',
      rte: 'cq/gui/components/authoring/dialog/richtext',
      button: 'granite/ui/components/coral/foundation/button',
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

  generateFieldsetOrContainer(field, type) {
    const {
      name,
      label,
      description,
      fields = [],
      items = [],
      showhideClass,
      collapsible = false,
      ...otherProps
    } = field;

    const defaultNodeName = type === 'fieldset' ? 'fieldset' : 'container';
    const nodeName = name
      ? this.sanitizeNodeName(name)
      : `${defaultNodeName}_${Date.now()}`;
    const resourceType = this.getResourceType(type);
    const nestedFields = fields.length > 0 ? fields : items;

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      {
        'sling:resourceType': resourceType,
      },
      'none'
    );

    if (showhideClass) {
      xml = this.appendAttribute(xml, this.I.FA, {
        'granite:class': `hide ${showhideClass}`,
      });
    }

    if (label && type === 'fieldset') {
      xml = this.appendAttribute(xml, this.I.FA, { 'jcr:title': label });
    }

    if (description) {
      xml = this.appendAttribute(xml, this.I.FA, {
        fieldDescription: description,
      });
    }

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { collapsible },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'fields',
      'items',
      'showhideClass',
      'collapsible',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.I.FN, 'items', {}, 'open');

    for (const subField of nestedFields) {
      xml += this.generateField(subField);
    }

    xml += this.closeNode(this.I.FN, 'items');
    xml += this.closeNode(this.I.F, nodeName);

    return xml;
  }

  generateFixedColumns(field) {
    const { name, columns = [], ...otherProps } = field;

    const nodeName = name || `columns_${Date.now()}`;

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      {
        'sling:resourceType':
          'granite/ui/components/coral/foundation/fixedcolumns',
      },
      'none'
    );

    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'columns',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.I.FN, 'items', {}, 'open');

    for (const [index, column] of columns.entries()) {
      const columnName = column.name || `column${index + 1}`;
      const columnFields = column.fields || [];

      xml += this.buildNode(
        this.I.FNI,
        columnName,
        {
          'sling:resourceType':
            'granite/ui/components/coral/foundation/container',
        },
        'none'
      );
      xml = this.openBlock(xml);
      xml += this.buildNode(this.I.FNI + 1, 'items', {}, 'open');

      for (const colField of columnFields) {
        xml += this.generateField(colField);
      }

      xml += this.closeNodes([
        [this.I.FNI + 1, 'items'],
        [this.I.FNI, columnName],
      ]);
    }

    xml += this.closeNodes([
      [this.I.FN, 'items'],
      [this.I.F, nodeName],
    ]);

    return xml;
  }

  generateWell(field) {
    const { fields = [], items = [], name, ...otherProps } = field;

    const wellFields = fields.length > 0 ? fields : items;
    const nodeName = name || `well_${Date.now()}`;
    const sanitizedName = this.sanitizeNodeName(nodeName);

    let xml = this.buildNode(
      this.I.F,
      sanitizedName,
      { 'sling:resourceType': 'granite/ui/components/coral/foundation/well' },
      'none'
    );

    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'fields',
      'items',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.I.FN, 'items', {}, 'open');

    for (const nestedField of wellFields) {
      xml += this.generateField(nestedField);
    }

    xml += this.closeNodes([
      [this.I.FN, 'items'],
      [this.I.F, sanitizedName],
    ]);

    return xml;
  }

  generateHeading(field) {
    const { name, text, level = 3, ...otherProps } = field;

    const nodeName = name || `heading_${Date.now()}`;
    const resourceType = this.getResourceType('heading');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      text,
      level: `{Long}${level}`,
    });

    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'text',
      'level',
    ]);

    xml = this.selfClose(xml);

    return xml;
  }

  generateText(field) {
    const { name, text, variant, ...otherProps } = field;

    const nodeName = name || `text_${Date.now()}`;
    const resourceType = this.getResourceType('text');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );
    xml = this.appendAttribute(xml, this.I.FA, {
      text,
      variant,
    });
    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'text',
      'variant',
    ]);

    xml = this.selfClose(xml);

    return xml;
  }

  generateTags(field) {
    const {
      name,
      label,
      description,
      required = false,
      rootPath = '/content/cq:tags',
      ...otherProps
    } = field;

    const fieldName = name || './cq:tags';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('tags');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'rootPath',
    ]);

    xml = this.selfClose(xml);

    return xml;
  }

  generateImage(field) {
    const {
      name,
      label,
      description,
      required = false,
      uploadUrl,
      allowUpload = true,
      mimeTypes,
      fileNameParameter = './fileName',
      fileReferenceParameter = './fileReference',
      ...otherProps
    } = field;

    const fieldName = name || './image';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('image');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      uploadUrl,
      fileNameParameter,
      fileReferenceParameter,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required },
      { isBoolean: true }
    );
    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { allowUpload },
      { allowFalsy: true }
    );

    if (mimeTypes && Array.isArray(mimeTypes)) {
      xml = this.appendAttribute(xml, this.I.FA, { mimeTypes });
    } else {
      xml = this.appendAttribute(xml, this.I.FA, {
        mimeTypes:
          '[image/gif,image/jpeg,image/png,image/webp,image/tiff,image/svg+xml]',
      });
    }
    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'uploadUrl',
      'allowUpload',
      'mimeTypes',
      'fileNameParameter',
      'fileReferenceParameter',
    ]);

    xml = this.selfClose(xml);

    return xml;
  }

  generateAutocomplete(field) {
    const {
      name,
      label,
      description,
      required = false,
      multiple = false,
      datasource,
      forceSelection = true,
      ...otherProps
    } = field;

    const fieldName = name || './autocomplete';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('autocomplete');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required, multiple },
      { isBoolean: true }
    );
    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { forceSelection, ...otherProps },
      { allowFalsy: true }
    );

    if (datasource) {
      xml = this.openBlock(xml);
      xml += this.buildNode(this.I.FN, 'datasource', {
        'sling:resourceType': datasource,
      });
      xml += this.closeNode(this.I.F, nodeName);
    } else {
      xml = this.selfClose(xml);
    }

    return xml;
  }

  generateRadioGroup(field) {
    const {
      name,
      label,
      description,
      required = false,
      vertical = false,
      options = [],
      ...otherProps
    } = field;

    const fieldName = name || './radiogroup';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('radiogroup');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required, vertical },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'options',
      'vertical',
    ]);

    if (options && Array.isArray(options) && options.length > 0) {
      xml = this.openBlock(xml);
      xml += this.buildNode(this.I.FN, 'items', {}, 'open');
      xml += this.appendOptions(options, this.I.FNI);
      xml += this.closeNode(this.I.FN, 'items');
      xml += this.closeNode(this.I.F, nodeName);
    } else {
      xml = this.selfClose(xml);
    }

    return xml;
  }

  generatePageField(field) {
    const {
      name,
      label,
      description,
      required = false,
      rootPath = '/content',
      ...otherProps
    } = field;

    const fieldName = name || './pagePath';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('pagefield');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'rootPath',
    ]);

    xml = this.selfClose(xml);

    return xml;
  }

  generateContentFragmentPicker(field) {
    const {
      name,
      label,
      description,
      required = false,
      rootPath = '/content/dam',
      fragmentModel,
      ...otherProps
    } = field;

    const fieldName = name || './fragmentPath';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('contentfragmentpicker');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
      fragmentPath: fragmentModel,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'rootPath',
      'fragmentModel',
    ]);

    xml = this.selfClose(xml);

    return xml;
  }

  generateExperienceFragmentPicker(field) {
    const {
      name,
      label,
      description,
      required = false,
      rootPath = '/content/experience-fragments',
      ...otherProps
    } = field;

    const fieldName = name || './xfPath';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('experiencefragmentpicker');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'rootPath',
    ]);

    xml = this.selfClose(xml);

    return xml;
  }

  generateAssetPicker(field) {
    const {
      name,
      label,
      description,
      required = false,
      rootPath = '/content/dam',
      mimeTypes,
      ...otherProps
    } = field;

    const fieldName = name || './assetPath';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('assetpicker');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
      ...(mimeTypes && Array.isArray(mimeTypes) && { mimeTypes }),
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'rootPath',
      'mimeTypes',
    ]);

    xml = this.selfClose(xml);

    return xml;
  }

  generateButton(field) {
    const {
      name,
      text = 'Button',
      variant = 'primary',
      icon,
      command,
      handler,
      ...otherProps
    } = field;

    const nodeName =
      name ||
      this.sanitizeNodeName(text).toLowerCase() ||
      `button_${Date.now()}`;

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': 'granite/ui/components/coral/foundation/button' },
      'none'
    );
    xml = this.appendAttribute(xml, this.I.FA, {
      text,
      variant,
      icon,
      command,
    });

    if (handler) {
      xml = this.appendAttribute(xml, this.I.FA, {
        'granite:data': `{Object}${JSON.stringify({ handler: handler })}`,
      });
    }

    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'text',
      'variant',
      'icon',
      'command',
      'handler',
    ]);

    xml = this.selfClose(xml);

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

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );
    xml = this.appendAttribute(xml, this.I.FA, {
      name: fieldName,
      fieldLabel: label,
      fieldDescription: description,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required, useFixedInlineToolbar },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'features',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.I.FN, 'rtePlugins', {}, 'open');

    if (features.includes('*')) {
      xml += this.generateRTEDefaultPlugins();
    } else {
      for (const feature of features) {
        xml += this.generateRTEPlugin(feature);
      }
    }

    xml += this.closeNode(this.I.FN, 'rtePlugins');

    xml += this.buildNodes([
      [this.I.FN, 'uiSettings'],
      [this.I.FNI, 'cui'],
      [
        this.I.FNI + 1,
        'inline',
        {
          toolbar:
            '[format#bold,format#italic,format#underline,#justify,#lists,links#modifylink,links#unlink,fullscreen#start]',
          popovers:
            '[justify#justifleft,justify#justifycenter,justify#justifyright,lists#unordered,lists#ordered,links#link]',
        },
      ],
      [this.I.FNI + 2, 'icons'],
      [this.I.FNI + 3, 'justify', {}, 'open'],
      [this.I.FNI + 4, 'justifyleft', { command: 'justifyleft' }, 'self'],
      [this.I.FNI + 4, 'justifycenter', { command: 'justifycenter' }, 'self'],
      [this.I.FNI + 4, 'justifyright', { command: 'justifyright' }, 'self'],
    ]);

    xml += this.closeNode(this.I.FNI + 3, 'justify');

    xml += this.buildNodes([
      [this.I.FNI + 3, 'lists', {}, 'open'],
      [this.I.FNI + 4, 'unordered', { command: 'bullist' }, 'self'],
      [this.I.FNI + 4, 'ordered', { command: 'numlist' }, 'self'],
    ]);

    xml += this.closeNodes([
      [this.I.FNI + 3, 'lists'],
      [this.I.FNI + 2, 'icons'],
      [this.I.FNI + 1, 'inline'],
      [this.I.FNI, 'cui'],
      [this.I.FN, 'uiSettings'],
      [this.I.F, nodeName],
    ]);

    return xml;
  }

  generateRTEDefaultPlugins() {
    let xml = this.buildNodes([
      [this.I.FNI, 'format', { features: 'bold,italic,underline' }, 'self'],
      [this.I.FNI, 'justify', { features: '*' }, 'self'],
      [this.I.FNI, 'lists', { features: '*' }, 'self'],
      [this.I.FNI, 'links', { features: 'modifylink,unlink' }, 'self'],
      [this.I.FNI, 'subsuperscript', { features: '*' }, 'self'],
      [this.I.FNI, 'paraformat', { features: '*' }, 'open'],
      [this.I.FNI + 1, 'formats', {}, 'open'],
      [
        this.I.FNI + 2,
        'default',
        { description: 'Paragraph', tag: 'p' },
        'self',
      ],
      [this.I.FNI + 2, 'h1', { description: 'Heading 1', tag: 'h1' }, 'self'],
      [this.I.FNI + 2, 'h2', { description: 'Heading 2', tag: 'h2' }, 'self'],
      [this.I.FNI + 2, 'h3', { description: 'Heading 3', tag: 'h3' }, 'self'],
    ]);
    xml += this.closeNodes([
      [this.I.FNI + 1, 'formats'],
      [this.I.FNI, 'paraformat'],
    ]);
    return xml;
  }

  generateRTEPlugin(feature) {
    const plugins = {
      bold: { node: 'format', attrs: { features: 'bold' } },
      italic: { node: 'format', attrs: { features: 'italic' } },
      underline: { node: 'format', attrs: { features: 'underline' } },
      links: { node: 'links', attrs: { features: 'modifylink,unlink' } },
      lists: { node: 'lists', attrs: { features: '*' } },
      justify: { node: 'justify', attrs: { features: '*' } },
    };

    if (!plugins[feature]) return '';

    const { node, attrs } = plugins[feature];
    return this.buildNode(this.I.FNI, node, attrs, 'self');
  }

  generateMultifield(field) {
    const {
      name,
      label,
      description,
      required = false,
      fields = [],
      items = [],
      composite = false,
      maxItems,
      minItems,
      deleteHint,
      ordered = false,
      addItemLabel,
      maxItemsMessage,
      minItemsMessage,
      reorderableHandle,
      ...otherProps
    } = field;

    if (
      maxItems !== undefined &&
      (typeof maxItems !== 'number' || maxItems < 1)
    ) {
      throw new Error(`maxItems must be a positive number, got: ${maxItems}`);
    }
    if (
      minItems !== undefined &&
      (typeof minItems !== 'number' || minItems < 0)
    ) {
      throw new Error(
        `minItems must be a non-negative number, got: ${minItems}`
      );
    }
    if (
      maxItems !== undefined &&
      minItems !== undefined &&
      minItems > maxItems
    ) {
      throw new Error(
        `minItems (${minItems}) cannot be greater than maxItems (${maxItems})`
      );
    }

    const multifieldItems = fields.length > 0 ? fields : items;

    const fieldName = name || './items';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('multifield');

    let xml = this.buildNode(
      this.I.F,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.FA, {
      fieldLabel: label,
      fieldDescription: description,
      deleteHint,
      maxItems: maxItems !== undefined ? `{Long}${maxItems}` : undefined,
      minItems: minItems !== undefined ? `{Long}${minItems}` : undefined,
      addItemLabel,
      maxItemsMessage,
      minItemsMessage,
      reorderableHandle,
    });

    xml = this.appendAttribute(
      xml,
      this.I.FA,
      { required, composite, orderable: ordered },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.I.FA, otherProps, [
      'type',
      'fields',
      'items',
      'maxItems',
      'minItems',
      'deleteHint',
      'ordered',
      'addItemLabel',
      'maxItemsMessage',
      'minItemsMessage',
      'reorderableHandle',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.I.FN, 'field', {}, 'none');

    if (composite && multifieldItems.length > 0) {
      xml = this.appendAttribute(xml, this.I.FNI, {
        'sling:resourceType':
          'granite/ui/components/coral/foundation/container',
        name: fieldName,
      });
      xml = this.openBlock(xml);
      xml += this.buildNode(this.I.FNI, 'items', {}, 'open');

      for (const subField of multifieldItems) {
        xml += this.generateMultifieldItem(subField);
      }

      xml += this.closeNode(this.I.FNI, 'items');
      xml += this.closeNode(this.I.FN, 'field');
    } else if (multifieldItems.length > 0) {
      const singleField = multifieldItems[0];
      const subResourceType = this.getResourceType(
        singleField.type || 'textfield'
      );

      xml = this.appendAttribute(xml, this.I.FNI, {
        'sling:resourceType': subResourceType,
        name: fieldName,
        fieldLabel: singleField.label,
        fieldDescription: singleField.description,
      });

      xml = this.appendAdditionalProperties(xml, this.I.FNI, singleField, [
        'type',
        'label',
        'description',
        'name',
      ]);

      xml = this.selfClose(xml);
    } else {
      xml = this.appendAttribute(xml, this.I.FNI, {
        'sling:resourceType':
          'granite/ui/components/coral/foundation/form/textfield',
        name: fieldName,
      });
      xml = this.selfClose(xml);
    }

    xml += this.closeNode(this.I.F, nodeName);

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

    if (type === 'fieldset' || type === 'container') {
      return this.generateMultifieldFieldsetOrContainer(field, type);
    }

    const resourceType = this.getResourceType(type);
    const fieldName = this.getFieldName(name);
    const nodeName = this.sanitizeNodeName(fieldName);

    let xml = this.buildNode(
      this.I.MI,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.MI + 1, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      value: defaultValue?.toString(),
    });
    xml = this.appendAttribute(
      xml,
      this.I.MI + 1,
      { required },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.I.MI + 1, otherProps, [
      'options',
      'fields',
      'items',
    ]);

    if (options && Array.isArray(options) && options.length > 0) {
      xml = this.openBlock(xml);
      xml += this.buildNode(this.I.MI + 3, 'items', {}, 'open');
      xml += this.appendOptions(options, this.I.MI + 4);
      xml += this.closeNode(this.I.MI + 3, 'items');
      xml += this.closeNode(this.I.MI + 2, nodeName);
    } else {
      xml = this.selfClose(xml);
    }

    return xml;
  }

  generateMultifieldFieldsetOrContainer(field, type) {
    const {
      name,
      label,
      description,
      fields = [],
      items = [],
      showhideClass,
      ...otherProps
    } = field;

    const defaultNodeName = type === 'fieldset' ? 'fieldset' : 'container';
    const nodeName = name
      ? this.sanitizeNodeName(name)
      : `${defaultNodeName}_${Date.now()}`;
    const resourceType = this.getResourceType(type);
    const nestedFields = fields.length > 0 ? fields : items;

    let xml = this.buildNode(
      this.I.MI,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    if (label && type === 'fieldset') {
      xml = this.appendAttribute(xml, this.I.MI + 1, { 'jcr:title': label });
    }

    xml = this.appendAttribute(xml, this.I.MI + 1, {
      fieldDescription: description,
    });

    if (showhideClass) {
      xml = this.appendAttribute(xml, this.I.MI + 1, {
        'granite:class': `hide ${showhideClass}`,
      });
    }

    xml = this.appendAdditionalProperties(xml, this.I.MI + 1, otherProps, [
      'type',
      'fields',
      'items',
      'showhideClass',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.I.MI + 1, 'items', {}, 'open');

    for (const subField of nestedFields) {
      xml += this.generateMultifieldFieldsetOrContainerItem(subField);
    }

    xml += this.closeNode(this.I.MI + 1, 'items');
    xml += this.closeNode(this.I.MI, nodeName);

    return xml;
  }

  generateMultifieldFieldsetOrContainerItem(field) {
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
    const fieldName = this.getFieldName(name);
    const nodeName = this.sanitizeNodeName(fieldName);

    let xml = this.buildNode(
      this.I.MI + 2,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.I.MI + 3, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      value: defaultValue?.toString(),
    });
    xml = this.appendAttribute(
      xml,
      this.I.MI + 3,
      { required },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.I.MI + 3, otherProps, [
      'options',
      'fields',
      'items',
    ]);

    if (options && Array.isArray(options) && options.length > 0) {
      xml = this.openBlock(xml);
      xml += this.buildNode(this.I.MI + 3, 'items', {}, 'open');
      xml += this.appendOptions(options, this.I.MI + 4);
      xml += this.closeNode(this.I.MI + 3, 'items');
      xml += this.closeNode(this.I.MI + 2, nodeName);
    } else {
      xml = this.selfClose(xml);
    }

    return xml;
  }

  sanitizeNodeName(name) {
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

  escapeXmlExceptSingleQuote(text) {
    if (typeof text !== 'string') {
      return text;
    }
    return text.replaceAll('"', '&quot;');
  }

  appendAttribute(xml, level, attributes, options = {}) {
    const {
      allowFalsy = false,
      preserveSingleQuotes = false,
      isBoolean = false,
    } = options;
    for (const [key, val] of Object.entries(attributes)) {
      if (isBoolean) {
        if (val) {
          xml += this.line(level, this.generateAttributeValue(key, true));
        }
      } else {
        const isNullish = val === undefined || val === null;
        const isDisallowedFalsy = !allowFalsy && val === false;
        if (!isNullish && !isDisallowedFalsy) {
          const attrValue = preserveSingleQuotes
            ? `${key}="${this.escapeXmlExceptSingleQuote(String(val))}"`
            : this.generateAttributeValue(key, val);
          xml += this.line(level, attrValue);
        }
      }
    }
    return xml;
  }

  appendOptions(options, baseIndent) {
    let xml = '';
    for (const [i, opt] of options.entries()) {
      const optName = this.sanitizeNodeName(opt.value || `option${i}`);
      const attributes = {
        text: opt.text || opt.value,
        value: opt.value,
        ...(opt.checked && { checked: '{Boolean}true' }),
      };
      xml += this.buildNode(baseIndent, optName, attributes, 'self');
    }
    return xml;
  }

  selfClose(xml) {
    return xml.trimEnd() + ' />\n';
  }

  openBlock(xml) {
    return xml.trimEnd() + '>\n';
  }

  closeNode(level, nodeName) {
    return this.line(level, `</${nodeName}>`);
  }

  closeNodes(closures) {
    return closures
      .map(([level, name]) => this.closeNode(level, name))
      .join('');
  }

  trimLine(xml) {
    return xml.trimEnd() + '\n';
  }

  getFieldName(name) {
    return name || `./field_${Date.now()}`;
  }

  appendAdditionalProperties(xml, level, otherProps, excludedKeys = []) {
    for (const [key, value] of Object.entries(otherProps)) {
      if (!excludedKeys.includes(key)) {
        const attr = this.generateAttributeValue(key, value);
        xml += this.line(level, attr);
      }
    }
    return xml;
  }

  buildNode(level, nodeName, attributes = {}, closeType = 'self') {
    const hasOnlyPrimaryType =
      Object.keys(attributes).length === 0 ||
      (Object.keys(attributes).length === 1 && attributes['jcr:primaryType']);

    if (hasOnlyPrimaryType && closeType === 'open') {
      return this.line(
        level,
        `<${nodeName} jcr:primaryType="${attributes['jcr:primaryType'] || 'nt:unstructured'}">`
      );
    }

    let xml = this.line(level, `<${nodeName}`);

    if (!attributes['jcr:primaryType']) {
      xml += this.line(level + 1, 'jcr:primaryType="nt:unstructured"');
    }

    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined && value !== null) {
        xml += this.line(
          level + 1,
          `${key}="${this.escapeXml(String(value))}"`
        );
      }
    }

    if (closeType === 'self') {
      return this.selfClose(xml);
    } else if (closeType === 'open') {
      return this.openBlock(xml);
    } else if (closeType === 'none') {
      return xml;
    } else {
      return this.openBlock(xml);
    }
  }

  buildNodes(nodes) {
    return nodes
      .map(([level, name, attrs, closeType]) =>
        this.buildNode(level, name, attrs || {}, closeType || 'open')
      )
      .join('');
  }

  buildItemsBlock(xml, level) {
    return this.openBlock(xml) + this.buildNode(level, 'items', {}, 'open');
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
