'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

class AemDialogGeneratorPlugin {
  constructor(options = {}) {
    this._baseIndentLevel = 0;
    this._indentStack = [];
    
    this.I = {
      F: 0, // FIELD: Field base (relative to current base)
      FA: 1, // FIELD_ATTR: Field attributes (+1 from field)
      FN: 1, // FIELD_NESTED: Internal field nodes (+1 from field)
      FNI: 2, // FIELD_NESTED_ITEM: Items inside internal nodes (+2 from field)
      MI: 3, // MULTIFIELD_ITEM: Items inside composite multifield (+3 from field)
    };

    this._fieldCounter = 0;

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
      designDialogFileName: options.designDialogFileName || 'designDialog.json',
      appName: options.appName || 'mysite',
      useFolderStructure:
        options.useFolderStructure === undefined || options.useFolderStructure,
      verbose: options.verbose || false,
      generatePolicies: options.generatePolicies !== false,
      policiesTargetDir:
        options.policiesTargetDir ||
        path.resolve(
          __dirname,
          '../ui.content/src/main/content/jcr_root/conf/mysite/settings/wcm/policies'
        ),
      templatePoliciesDir:
        options.templatePoliciesDir ||
        path.resolve(
          __dirname,
          '../ui.content/src/main/content/jcr_root/conf/mysite/settings/wcm/templates'
        ),
      autoMapPoliciesToTemplates: options.autoMapPoliciesToTemplates !== false,
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
        this.log(`Processing dialog: ${componentName}`);

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

          this.log(`✓ Generated dialog: ${xmlFilePath}`);
        } catch (error) {
          this.log(`✗ Error processing ${componentName}: ${error.message}`);
        }
      }

      const designDialogJsonPath = path.join(
        sourceDir,
        componentName,
        this.options.designDialogFileName
      );

      if (fs.existsSync(designDialogJsonPath)) {
        this.log(`Processing design dialog: ${componentName}`);

        try {
          const designDialogConfig = JSON.parse(
            fs.readFileSync(designDialogJsonPath, 'utf8')
          );
          const xmlContent = this.generateDesignDialogXml(
            designDialogConfig,
            componentName
          );

          const componentTargetDir = path.join(targetDir, componentName);
          if (!fs.existsSync(componentTargetDir)) {
            fs.mkdirSync(componentTargetDir, { recursive: true });
          }

          let xmlFilePath;

          if (this.options.useFolderStructure) {
            const designDialogDir = path.join(componentTargetDir, '_cq_design_dialog');
            if (!fs.existsSync(designDialogDir)) {
              fs.mkdirSync(designDialogDir, { recursive: true });
            }
            xmlFilePath = path.join(designDialogDir, '.content.xml');
          } else {
            xmlFilePath = path.join(componentTargetDir, '_cq_design_dialog.xml');
          }

          fs.writeFileSync(xmlFilePath, xmlContent, 'utf8');

          this.log(`✓ Generated design dialog: ${xmlFilePath}`);

          if (this.options.generatePolicies && designDialogConfig.policy) {
            this.generatePolicy(componentName, designDialogConfig.policy);
            
            if (this.options.autoMapPoliciesToTemplates && designDialogConfig.policy.templates) {
              this.mapPolicyToTemplates(componentName, designDialogConfig.policy);
            }
          }
        } catch (error) {
          this.log(`✗ Error processing design dialog ${componentName}: ${error.message}`);
        }
      }
    }
  }

  generateDialogXml(config, componentName) {
    this._fieldCounter = 0;
    
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
        'jcr:primaryType': 'nt:unstructured',
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

      xml += this.withIndentLevel(7, () => {
        let result = '';
        for (const field of dialogFields) {
          result += this.generateField(field);
        }
        return result;
      });

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

      xml += this.withIndentLevel(4, () => {
        let result = '';
        tabs.forEach((item, index) => {
          result += this.generateAccordionItem(item, index);
        });
        return result;
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

      xml += this.withIndentLevel(4, () => {
        let result = '';
        tabs.forEach((tab, index) => {
          result += this.generateTab(tab, index);
        });
        return result;
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

    const tabLevel = this.getIndentLevel(1);
    let xml = this.buildNode(tabLevel, tabName, attributes, 'none');

    if (showIf && showIf.field && showIf.value !== undefined) {
      xml = this.appendAttribute(
        xml,
        tabLevel + 1,
        {
          'granite:hide': `\${!${showIf.field} || ${showIf.field} != '${showIf.value}'}`,
        },
        { preserveSingleQuotes: true }
      );
    }

    xml = this.openBlock(xml);
    xml += this.buildNodes([
      [tabLevel + 1, 'items'],
      [
        tabLevel + 2,
        'columns',
        {
          'sling:resourceType':
            'granite/ui/components/coral/foundation/fixedcolumns',
          margin: '{Boolean}true',
        },
      ],
      [tabLevel + 3, 'items'],
      [
        tabLevel + 4,
        'column',
        {
          'sling:resourceType':
            'granite/ui/components/coral/foundation/container',
        },
      ],
      [tabLevel + 5, 'items'],
    ]);

    xml += this.withIndentLevel(tabLevel + 6, () => {
      let result = '';
      for (const field of tabFields) {
        result += this.generateField(field);
      }
      return result;
    });

    xml += this.closeNodes([
      [tabLevel + 5, 'items'],
      [tabLevel + 4, 'column'],
      [tabLevel + 3, 'items'],
      [tabLevel + 2, 'columns'],
      [tabLevel + 1, 'items'],
      [tabLevel, tabName],
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

    const tabLevel = this.getIndentLevel(1);
    const itemsLevel = this.getIndentLevel(2);
    
    let xml = this.buildNode(tabLevel, itemName, attributes, 'open');
    xml += this.buildNode(itemsLevel, 'items', {}, 'open');

    const fieldsArray = fields.length > 0 ? fields : items;

    xml += this.withIndentLevel(this.getIndentLevel(3), () => {
      let result = '';
      for (const field of fieldsArray) {
        result += this.generateField(field);
      }
      return result;
    });

    xml += this.closeNodes([
      [itemsLevel, 'items'],
      [tabLevel, itemName],
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
      this.getIndentLevel(this.I.F),
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
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
        'granite:class': graniteClasses.join(' '),
      });
    }

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      fieldLabel: label,
      'sling:orderBefore': orderBefore,
    });

    if (showIf && showIf.field && showIf.value !== undefined) {
      xml = this.appendAttribute(
        xml,
        this.getIndentLevel(this.I.FA),
        {
          'granite:hide': `\${!${showIf.field} || ${showIf.field} != '${showIf.value}'}`,
        },
        { preserveSingleQuotes: true }
      );
    } else if (hideIf && hideIf.field && hideIf.value !== undefined) {
      xml = this.appendAttribute(
        xml,
        this.getIndentLevel(this.I.FA),
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
        this.getIndentLevel(this.I.FA),
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
        this.getIndentLevel(this.I.FA),
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

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      name: fieldName,
      typeHint,
      requiredMessage,
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { renderHidden, required, disabled, readOnly },
      { isBoolean: true }
    );

    if (validation) {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
        validation: validation.pattern,
        validationMessage: validation.message,
      });
    }
    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
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
        this.getIndentLevel(this.I.FA),
        {
          emptyOption,
          forceSelection,
        },
        { allowFalsy: true }
      );
    }

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      {
        multiple: multiple && type === 'select',
        autofocus: autoFocus,
        forceIgnoreFreshness,
        clearButton: type === 'textfield' && clearButton,
      },
      { isBoolean: true }
    );
    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
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
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), dataAttrs);
    }

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
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
      xml += this.buildNode(this.getIndentLevel(this.I.FN), 'items', {}, 'open');
      xml += this.appendOptions(options, this.getIndentLevel(this.I.FNI));
      xml += this.closeNode(this.getIndentLevel(this.I.FN), 'items');
      
      if (cqShowHide && showhideTarget) {
        xml += this.buildNode(this.getIndentLevel(this.I.FN), 'granite:data', {
          'jcr:primaryType': 'nt:unstructured',
          ...(type === 'select' && { 'cq-dialog-dropdown-showhide-target': showhideTarget }),
          ...(type === 'checkbox' && { 'cq-dialog-checkbox-showhide-target': showhideTarget }),
        });
      }
      
      if (type === 'select' && datasource) {
        xml += this.buildNode(this.getIndentLevel(this.I.FN), 'datasource', {
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
            this.getIndentLevel(this.I.FN),
            'granite:rendercondition',
            { 'sling:resourceType': rcRes },
            'open'
          );
          let idx = 0;
          for (const cond of renderCondition.conditions) {
            const childRes = rcMap[cond.type || 'simple'] || rcMap.simple;
            const cn = `cond${++idx}`;
            xml += this.buildNode(
              this.getIndentLevel(this.I.FNI),
              cn,
              { 'sling:resourceType': childRes },
              'none'
            );
            if (cond.expression) {
              const expr = this.escapeXmlExceptSingleQuote(cond.expression);
              xml = this.appendAttribute(
                xml,
                this.getIndentLevel(this.I.FNI) + 1,
                { expression: expr },
                { preserveSingleQuotes: true }
              );
            }
            if (cond.privilege) {
              xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FNI) + 1, {
                privilege: cond.privilege,
              });
            }
            xml = this.selfClose(xml);
          }
          xml += this.closeNode(this.getIndentLevel(this.I.FN), 'granite:rendercondition');
        } else {
          xml += this.buildNode(
            this.getIndentLevel(this.I.FN),
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
              this.getIndentLevel(this.I.FNI),
              { expression: expr },
              { preserveSingleQuotes: true }
            );
          }
          if (renderCondition.privilege) {
            xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FNI), {
              privilege: renderCondition.privilege,
            });
          }
          xml = this.selfClose(xml);
        }
      }
      xml += this.closeNode(this.getIndentLevel(this.I.F), nodeName);
    } else if (
      (type === 'select' && datasource) ||
      (renderCondition && renderCondition.type) ||
      (cqShowHide && showhideTarget)
    ) {
      xml = this.openBlock(xml);
      
      if (cqShowHide && showhideTarget) {
        xml += this.buildNode(this.getIndentLevel(this.I.FN), 'granite:data', {
          'jcr:primaryType': 'nt:unstructured',
          ...(type === 'select' && { 'cq-dialog-dropdown-showhide-target': showhideTarget }),
          ...(type === 'checkbox' && { 'cq-dialog-checkbox-showhide-target': showhideTarget }),
        });
      }
      
      if (type === 'select' && datasource) {
        xml += this.buildNode(this.getIndentLevel(this.I.FN), 'datasource', {
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
            this.getIndentLevel(this.I.FN),
            'granite:rendercondition',
            { 'sling:resourceType': rcRes },
            'open'
          );
          let idx = 0;
          for (const cond of renderCondition.conditions) {
            const childRes = rcMap[cond.type || 'simple'] || rcMap.simple;
            const cn = `cond${++idx}`;
            xml += this.buildNode(
              this.getIndentLevel(this.I.FNI),
              cn,
              { 'sling:resourceType': childRes },
              'none'
            );
            if (cond.expression) {
              const expr = this.escapeXmlExceptSingleQuote(cond.expression);
              xml = this.appendAttribute(
                xml,
                this.getIndentLevel(this.I.FNI) + 1,
                { expression: expr },
                { preserveSingleQuotes: true }
              );
            }
            if (cond.privilege) {
              xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FNI) + 1, {
                privilege: cond.privilege,
              });
            }
            xml = this.selfClose(xml);
          }
          xml += this.closeNode(this.getIndentLevel(this.I.FN), 'granite:rendercondition');
        } else {
          xml += this.buildNode(
            this.getIndentLevel(this.I.FN),
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
              this.getIndentLevel(this.I.FNI),
              { expression: expr },
              { preserveSingleQuotes: true }
            );
          }
          if (renderCondition.privilege) {
            xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FNI), {
              privilege: renderCondition.privilege,
            });
          }
          xml = this.selfClose(xml);
        }
      }
      xml += this.closeNode(this.getIndentLevel(this.I.F), nodeName);
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
      showhidetargetvalue,
      collapsible = false,
      ...otherProps
    } = field;

    const defaultNodeName = type === 'fieldset' ? 'fieldset' : 'container';
    const nodeName = name
      ? this.sanitizeNodeName(name)
      : this.generateDeterministicNodeName(defaultNodeName, {
          label,
          description,
          fields,
          items,
          collapsible,
          showhideClass,
          showhidetargetvalue,
          ...otherProps,
        });
    const resourceType = this.getResourceType(type);
    const nestedFields = fields.length > 0 ? fields : items;

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      {
        'sling:resourceType': resourceType,
      },
      'none'
    );

    if (showhideClass) {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
        'granite:class': `hide ${showhideClass}`,
      });
    }

    if (label && type === 'fieldset') {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), { 'jcr:title': label });
    }

    if (description) {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
        fieldDescription: description,
      });
    }

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { collapsible },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'fields',
      'items',
      'showhideClass',
      'showhidetargetvalue',
      'collapsible',
    ]);

    xml = this.openBlock(xml);
    
    if (showhidetargetvalue) {
      xml += this.buildNode(this.getIndentLevel(this.I.FN), 'granite:data', {
        'jcr:primaryType': 'nt:unstructured',
        'showhidetargetvalue': showhidetargetvalue,
      });
    }
    
    xml += this.buildNode(this.getIndentLevel(this.I.FN), 'items', {}, 'open');

    xml += this.withAdjustedIndentation(0, 1, () => {
      let nestedXml = '';
      for (const subField of nestedFields) {
        nestedXml += this.generateField(subField);
      }
      return nestedXml;
    });

    xml += this.closeNode(this.getIndentLevel(this.I.FN), 'items');
    xml += this.closeNode(this.getIndentLevel(this.I.F), nodeName);

    return xml;
  }

  generateFixedColumns(field) {
    const { name, columns = [], ...otherProps } = field;

    const nodeName = name || this.generateDeterministicNodeName('columns', { columns, ...otherProps });

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      {
        'sling:resourceType':
          'granite/ui/components/coral/foundation/fixedcolumns',
      },
      'none'
    );

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'columns',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.getIndentLevel(this.I.FN), 'items', {}, 'open');

    for (const [index, column] of columns.entries()) {
      const columnName = column.name || `column${index + 1}`;
      const columnFields = column.fields || [];

      xml += this.buildNode(
        this.getIndentLevel(this.I.FNI),
        columnName,
        {
          'sling:resourceType':
            'granite/ui/components/coral/foundation/container',
        },
        'none'
      );
      xml = this.openBlock(xml);
      xml += this.buildNode(this.getIndentLevel(this.I.FNI) + 1, 'items', {}, 'open');

      xml += this.withAdjustedIndentation(2, 3, () => {
        let nestedXml = '';
        for (const colField of columnFields) {
          nestedXml += this.generateField(colField);
        }
        return nestedXml;
      });

      xml += this.closeNodes([
        [this.getIndentLevel(this.I.FNI) + 1, 'items'],
        [this.getIndentLevel(this.I.FNI), columnName],
      ]);
    }

    xml += this.closeNodes([
      [this.getIndentLevel(this.I.FN), 'items'],
      [this.getIndentLevel(this.I.F), nodeName],
    ]);

    return xml;
  }

  generateWell(field) {
    const { fields = [], items = [], name, ...otherProps } = field;

    const wellFields = fields.length > 0 ? fields : items;
    const nodeName = name || this.generateDeterministicNodeName('well', { fields, items, ...otherProps });
    const sanitizedName = this.sanitizeNodeName(nodeName);

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      sanitizedName,
      { 'sling:resourceType': 'granite/ui/components/coral/foundation/well' },
      'none'
    );

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'fields',
      'items',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.getIndentLevel(this.I.FN), 'items', {}, 'open');

    xml += this.withAdjustedIndentation(0, 1, () => {
      let nestedXml = '';
      for (const nestedField of wellFields) {
        nestedXml += this.generateField(nestedField);
      }
      return nestedXml;
    });

    xml += this.closeNodes([
      [this.getIndentLevel(this.I.FN), 'items'],
      [this.getIndentLevel(this.I.F), sanitizedName],
    ]);

    return xml;
  }

  generateHeading(field) {
    const { name, text, level = 3, ...otherProps } = field;

    const nodeName = name || this.generateDeterministicNodeName('heading', { text, level, ...otherProps });
    const resourceType = this.getResourceType('heading');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      text,
      level: `{Long}${level}`,
    });

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'text',
      'level',
    ]);

    xml = this.selfClose(xml);

    return xml;
  }

  generateText(field) {
    const { name, text, variant, ...otherProps } = field;

    const nodeName = name || this.generateDeterministicNodeName('text', { text, variant, ...otherProps });
    const resourceType = this.getResourceType('text');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );
    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      text,
      variant,
    });
    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
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
      disabled = false,
      multiple = false,
      forceSelection = false,
      rootPath = '/content/cq:tags',
      displayProperty,
      valueProperty,
      typeHint,
      ...otherProps
    } = field;

    const fieldName = name || './cq:tags';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('tags');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
      displayProperty,
      valueProperty,
      typeHint,
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { required, multiple, forceSelection, disabled },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'rootPath',
      'multiple',
      'forceSelection',
      'displayProperty',
      'valueProperty',
      'typeHint',
      'disabled',
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
      disabled = false,
      multiple = false,
      uploadUrl,
      allowUpload = true,
      autoStart = true,
      async = true,
      sizeLimit,
      mimeTypes,
      fileNameParameter = './fileName',
      fileReferenceParameter = './fileReference',
      typeHint,
      ...otherProps
    } = field;

    const fieldName = name || './image';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('image');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      uploadUrl,
      fileNameParameter,
      fileReferenceParameter,
      sizeLimit: sizeLimit !== undefined ? `{Long}${sizeLimit}` : undefined,
      typeHint,
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { required, multiple, autoStart, async, disabled },
      { isBoolean: true }
    );
    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { allowUpload },
      { allowFalsy: true }
    );

    if (mimeTypes && Array.isArray(mimeTypes)) {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), { mimeTypes });
    } else {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
        mimeTypes:
          '[image/gif,image/jpeg,image/png,image/webp,image/tiff,image/svg+xml]',
      });
    }
    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'uploadUrl',
      'allowUpload',
      'mimeTypes',
      'fileNameParameter',
      'fileReferenceParameter',
      'multiple',
      'autoStart',
      'async',
      'sizeLimit',
      'typeHint',
      'disabled',
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
      disabled = false,
      multiple = false,
      datasource,
      forceSelection = true,
      mode,
      valueProperty,
      displayProperty,
      typeHint,
      ...otherProps
    } = field;

    const fieldName = name || './autocomplete';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('autocomplete');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      mode,
      valueProperty,
      displayProperty,
      typeHint,
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { required, multiple, disabled },
      { isBoolean: true }
    );
    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { forceSelection },
      { allowFalsy: true }
    );
    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'datasource',
      'mode',
      'valueProperty',
      'displayProperty',
      'typeHint',
      'disabled',
    ]);

    if (datasource) {
      xml = this.openBlock(xml);
      xml += this.buildNode(this.getIndentLevel(this.I.FN), 'datasource', {
        'sling:resourceType': datasource,
      });
      xml += this.closeNode(this.getIndentLevel(this.I.F), nodeName);
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
      disabled = false,
      vertical = false,
      defaultValue,
      options = [],
      ...otherProps
    } = field;

    const fieldName = name || './radiogroup';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('radiogroup');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      value: defaultValue?.toString(),
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { required, vertical, disabled },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'options',
      'vertical',
      'defaultValue',
      'disabled',
    ]);

    if (options && Array.isArray(options) && options.length > 0) {
      xml = this.openBlock(xml);
      xml += this.buildNode(this.getIndentLevel(this.I.FN), 'items', {}, 'open');
      xml += this.appendOptions(options, this.getIndentLevel(this.I.FNI));
      xml += this.closeNode(this.getIndentLevel(this.I.FN), 'items');
      xml += this.closeNode(this.getIndentLevel(this.I.F), nodeName);
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
      disabled = false,
      multiple = false,
      rootPath = '/content',
      filter,
      pickerSrc,
      pickerTitle,
      pickerMultiselect = false,
      forceSelection = false,
      typeHint,
      ...otherProps
    } = field;

    const fieldName = name || './pagePath';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('pagefield');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
      filter,
      pickerSrc,
      pickerTitle,
      typeHint,
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { required, multiple, pickerMultiselect, forceSelection, disabled },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'rootPath',
      'multiple',
      'filter',
      'pickerSrc',
      'pickerTitle',
      'pickerMultiselect',
      'forceSelection',
      'typeHint',
      'disabled',
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
      disabled = false,
      multiple = false,
      rootPath = '/content/dam',
      fragmentModel,
      filter,
      pickerSrc,
      typeHint,
      ...otherProps
    } = field;

    const fieldName = name || './fragmentPath';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('contentfragmentpicker');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
      fragmentPath: fragmentModel,
      filter,
      pickerSrc,
      typeHint,
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { required, multiple, disabled },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'rootPath',
      'fragmentModel',
      'multiple',
      'filter',
      'pickerSrc',
      'typeHint',
      'disabled',
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
      disabled = false,
      multiple = false,
      rootPath = '/content/experience-fragments',
      filter,
      pickerSrc,
      typeHint,
      ...otherProps
    } = field;

    const fieldName = name || './xfPath';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('experiencefragmentpicker');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
      filter,
      pickerSrc,
      typeHint,
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { required, multiple, disabled },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'rootPath',
      'multiple',
      'filter',
      'pickerSrc',
      'typeHint',
      'disabled',
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
      disabled = false,
      multiple = false,
      rootPath = '/content/dam',
      mimeTypes,
      filter,
      pickerSrc,
      pickerTitle,
      pickerMultiselect = false,
      forceSelection = false,
      typeHint,
      ...otherProps
    } = field;

    const fieldName = name || './assetPath';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('assetpicker');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      rootPath,
      filter,
      pickerSrc,
      pickerTitle,
      typeHint,
      ...(mimeTypes && Array.isArray(mimeTypes) && { mimeTypes }),
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { required, multiple, pickerMultiselect, forceSelection, disabled },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'rootPath',
      'mimeTypes',
      'multiple',
      'filter',
      'pickerSrc',
      'pickerTitle',
      'pickerMultiselect',
      'forceSelection',
      'typeHint',
      'disabled',
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
      disabled = false,
      type,
      ...otherProps
    } = field;

    const nodeName =
      name ||
      this.sanitizeNodeName(text).toLowerCase() ||
      this.generateDeterministicNodeName('button', { text, variant, icon, command, handler });

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': 'granite/ui/components/coral/foundation/button' },
      'none'
    );
    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      text,
      variant,
      icon,
      command,
      type,
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { disabled },
      { isBoolean: true }
    );

    if (handler) {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
        'granite:data': `{Object}${JSON.stringify({ handler: handler })}`,
      });
    }

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'text',
      'variant',
      'icon',
      'command',
      'handler',
      'disabled',
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
      disabled = false,
      readOnly = false,
      useFixedInlineToolbar = false,
      height,
      width,
      maxlength,
      features = ['*'],
      ...otherProps
    } = field;

    const fieldName = name || './text';
    const nodeName = this.sanitizeNodeName(fieldName);
    const resourceType = this.getResourceType('rte');

    let xml = this.buildNode(
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );
    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
      name: fieldName,
      fieldLabel: label,
      fieldDescription: description,
      height,
      width,
      maxlength: maxlength !== undefined ? `{Long}${maxlength}` : undefined,
    });

    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.FA),
      { required, useFixedInlineToolbar, disabled, readOnly },
      { isBoolean: true }
    );
    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
      'type',
      'features',
      'height',
      'width',
      'maxlength',
      'disabled',
      'readOnly',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.getIndentLevel(this.I.FN), 'rtePlugins', {}, 'open');

    if (features.includes('*')) {
      xml += this.generateRTEDefaultPlugins();
    } else {
      for (const feature of features) {
        xml += this.generateRTEPlugin(feature);
      }
    }

    xml += this.closeNode(this.getIndentLevel(this.I.FN), 'rtePlugins');

    xml += this.buildNodes([
      [this.getIndentLevel(this.I.FN), 'uiSettings'],
      [this.getIndentLevel(this.I.FNI), 'cui'],
      [
        this.getIndentLevel(this.I.FNI) + 1,
        'inline',
        {
          toolbar:
            '[format#bold,format#italic,format#underline,#justify,#lists,links#modifylink,links#unlink,fullscreen#start]',
          popovers:
            '[justify#justifleft,justify#justifycenter,justify#justifyright,lists#unordered,lists#ordered,links#link]',
        },
      ],
      [this.getIndentLevel(this.I.FNI) + 2, 'icons'],
      [this.getIndentLevel(this.I.FNI) + 3, 'justify', {}, 'open'],
      [this.getIndentLevel(this.I.FNI) + 4, 'justifyleft', { command: 'justifyleft' }, 'self'],
      [this.getIndentLevel(this.I.FNI) + 4, 'justifycenter', { command: 'justifycenter' }, 'self'],
      [this.getIndentLevel(this.I.FNI) + 4, 'justifyright', { command: 'justifyright' }, 'self'],
    ]);

    xml += this.closeNode(this.getIndentLevel(this.I.FNI) + 3, 'justify');

    xml += this.buildNodes([
      [this.getIndentLevel(this.I.FNI) + 3, 'lists', {}, 'open'],
      [this.getIndentLevel(this.I.FNI) + 4, 'unordered', { command: 'bullist' }, 'self'],
      [this.getIndentLevel(this.I.FNI) + 4, 'ordered', { command: 'numlist' }, 'self'],
    ]);

    xml += this.closeNodes([
      [this.getIndentLevel(this.I.FNI) + 3, 'lists'],
      [this.getIndentLevel(this.I.FNI) + 2, 'icons'],
      [this.getIndentLevel(this.I.FNI) + 1, 'inline'],
      [this.getIndentLevel(this.I.FNI), 'cui'],
      [this.getIndentLevel(this.I.FN), 'uiSettings'],
      [this.getIndentLevel(this.I.F), nodeName],
    ]);

    return xml;
  }

  generateRTEDefaultPlugins() {
    let xml = this.buildNodes([
      [this.getIndentLevel(this.I.FNI), 'format', { features: 'bold,italic,underline' }, 'self'],
      [this.getIndentLevel(this.I.FNI), 'justify', { features: '*' }, 'self'],
      [this.getIndentLevel(this.I.FNI), 'lists', { features: '*' }, 'self'],
      [this.getIndentLevel(this.I.FNI), 'links', { features: 'modifylink,unlink' }, 'self'],
      [this.getIndentLevel(this.I.FNI), 'subsuperscript', { features: '*' }, 'self'],
      [this.getIndentLevel(this.I.FNI), 'paraformat', { features: '*' }, 'open'],
      [this.getIndentLevel(this.I.FNI) + 1, 'formats', {}, 'open'],
      [
        this.getIndentLevel(this.I.FNI) + 2,
        'default',
        { description: 'Paragraph', tag: 'p' },
        'self',
      ],
      [this.getIndentLevel(this.I.FNI) + 2, 'h1', { description: 'Heading 1', tag: 'h1' }, 'self'],
      [this.getIndentLevel(this.I.FNI) + 2, 'h2', { description: 'Heading 2', tag: 'h2' }, 'self'],
      [this.getIndentLevel(this.I.FNI) + 2, 'h3', { description: 'Heading 3', tag: 'h3' }, 'self'],
    ]);
    xml += this.closeNodes([
      [this.getIndentLevel(this.I.FNI) + 1, 'formats'],
      [this.getIndentLevel(this.I.FNI), 'paraformat'],
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
    return this.buildNode(this.getIndentLevel(this.I.FNI), node, attrs, 'self');
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
      this.getIndentLevel(this.I.F),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FA), {
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
      this.getIndentLevel(this.I.FA),
      { required, composite, orderable: ordered },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FA), otherProps, [
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
    xml += this.buildNode(this.getIndentLevel(this.I.FN), 'field', {}, 'none');

    if (composite && multifieldItems.length > 0) {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FNI), {
        'sling:resourceType':
          'granite/ui/components/coral/foundation/container',
        name: fieldName,
      });
      xml = this.openBlock(xml);
      xml += this.buildNode(this.getIndentLevel(this.I.FNI), 'items', {}, 'open');

      for (const subField of multifieldItems) {
        xml += this.generateMultifieldItem(subField);
      }

      xml += this.closeNode(this.getIndentLevel(this.I.FNI), 'items');
      xml += this.closeNode(this.getIndentLevel(this.I.FN), 'field');
    } else if (multifieldItems.length > 0) {
      const singleField = multifieldItems[0];
      const subResourceType = this.getResourceType(
        singleField.type || 'textfield'
      );

      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FNI), {
        'sling:resourceType': subResourceType,
        name: fieldName,
        fieldLabel: singleField.label,
        fieldDescription: singleField.description,
      });

      xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.FNI), singleField, [
        'type',
        'label',
        'description',
        'name',
      ]);

      xml = this.selfClose(xml);
    } else {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.FNI), {
        'sling:resourceType':
          'granite/ui/components/coral/foundation/form/textfield',
        name: fieldName,
      });
      xml = this.selfClose(xml);
    }

    xml += this.closeNode(this.getIndentLevel(this.I.F), nodeName);

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

    if (type === 'multifield') {
      const nestedMultifield = this.generateMultifield(field);
      
      const lines = nestedMultifield.split('\n');
      const reIndented = lines.map((line) => {
        if (line.trim() === '') return line;
        const indentMatch = /^(\s*)/.exec(line);
        const currentIndent = indentMatch ? indentMatch[1].length / 4 : 0;
        const newIndent = currentIndent + 3;
        return '    '.repeat(newIndent) + line.trim();
      }).join('\n');
      
      return reIndented;
    }

    const resourceType = this.getResourceType(type);
    const fieldName = this.getFieldName(name);
    const nodeName = this.sanitizeNodeName(fieldName);

    let xml = this.buildNode(
      this.getIndentLevel(this.I.MI),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.MI) + 1, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      value: defaultValue?.toString(),
    });
    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.MI) + 1,
      { required },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.MI) + 1, otherProps, [
      'options',
      'fields',
      'items',
    ]);

    if (options && Array.isArray(options) && options.length > 0) {
      xml = this.openBlock(xml);
      xml += this.buildNode(this.getIndentLevel(this.I.MI) + 3, 'items', {}, 'open');
      xml += this.appendOptions(options, this.getIndentLevel(this.I.MI) + 4);
      xml += this.closeNode(this.getIndentLevel(this.I.MI) + 3, 'items');
      xml += this.closeNode(this.getIndentLevel(this.I.MI) + 2, nodeName);
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
      : this.generateDeterministicNodeName(defaultNodeName, { label, description, fields, items, showhideClass, ...otherProps });
    const resourceType = this.getResourceType(type);
    const nestedFields = fields.length > 0 ? fields : items;

    let xml = this.buildNode(
      this.getIndentLevel(this.I.MI),
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    if (label && type === 'fieldset') {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.MI) + 1, { 'jcr:title': label });
    }

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.MI) + 1, {
      fieldDescription: description,
    });

    if (showhideClass) {
      xml = this.appendAttribute(xml, this.getIndentLevel(this.I.MI) + 1, {
        'granite:class': `hide ${showhideClass}`,
      });
    }

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.MI) + 1, otherProps, [
      'type',
      'fields',
      'items',
      'showhideClass',
    ]);

    xml = this.openBlock(xml);
    xml += this.buildNode(this.getIndentLevel(this.I.MI) + 1, 'items', {}, 'open');

    for (const subField of nestedFields) {
      xml += this.generateMultifieldFieldsetOrContainerItem(subField);
    }

    xml += this.closeNode(this.getIndentLevel(this.I.MI) + 1, 'items');
    xml += this.closeNode(this.getIndentLevel(this.I.MI), nodeName);

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
      this.getIndentLevel(this.I.MI) + 2,
      nodeName,
      { 'sling:resourceType': resourceType },
      'none'
    );

    xml = this.appendAttribute(xml, this.getIndentLevel(this.I.MI) + 3, {
      fieldLabel: label,
      fieldDescription: description,
      name: fieldName,
      value: defaultValue?.toString(),
    });
    xml = this.appendAttribute(
      xml,
      this.getIndentLevel(this.I.MI) + 3,
      { required },
      { isBoolean: true }
    );

    xml = this.appendAdditionalProperties(xml, this.getIndentLevel(this.I.MI) + 3, otherProps, [
      'options',
      'fields',
      'items',
    ]);

    if (options && Array.isArray(options) && options.length > 0) {
      xml = this.openBlock(xml);
      xml += this.buildNode(this.getIndentLevel(this.I.MI) + 3, 'items', {}, 'open');
      xml += this.appendOptions(options, this.getIndentLevel(this.I.MI) + 4);
      xml += this.closeNode(this.getIndentLevel(this.I.MI) + 3, 'items');
      xml += this.closeNode(this.getIndentLevel(this.I.MI) + 2, nodeName);
    } else {
      xml = this.selfClose(xml);
    }

    return xml;
  }

  sanitizeNodeName(name, prefix = '') {
    let sanitized = name.replace(/^\.\//, '').replaceAll(/\W/g, '_');
    if (/^\d/.test(sanitized)) {
      sanitized = (prefix ? prefix + '_' : '_') + sanitized;
    }
    return sanitized;
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
      const optName = this.sanitizeNodeName(opt.value || `option_${i}`, 'option');
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
    return xml.trimEnd() + '/>\n';
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
    if (name) return name;
    this._fieldCounter = (this._fieldCounter || 0) + 1;
    return `./field_${this._fieldCounter}`;
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

    const hasXmlnsAttributes = Object.keys(attributes).some(key => key.startsWith('xmlns:'));
    if (!attributes['jcr:primaryType'] && !hasXmlnsAttributes) {
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

  generateDeterministicNodeName(baseName, content) {
    const deterministicStringify = (obj) => {
      if (obj === null || obj === undefined) return String(obj);
      if (typeof obj !== 'object') return String(obj);
      if (Array.isArray(obj)) {
        return '[' + obj.map(item => deterministicStringify(item)).join(',') + ']';
      }
      const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
      const pairs = sortedKeys.map(key => `"${key}":${deterministicStringify(obj[key])}`);
      return '{' + pairs.join(',') + '}';
    };    
    const contentString = deterministicStringify(content);
    const hash = crypto.createHash('md5').update(contentString).digest('hex').substring(0, 8);
    const decimal = Number.parseInt(hash, 16);
    return `${baseName}_${decimal}`;
  }

  pushIndentLevel(level) {
    this._indentStack.push(this._baseIndentLevel);
    this._baseIndentLevel = level;
  }
  
  popIndentLevel() {
    if (this._indentStack.length > 0) {
      this._baseIndentLevel = this._indentStack.pop();
    }
  }
  
  getIndentLevel(relativeOffset = 0) {
    return this._baseIndentLevel + relativeOffset;
  }
  
  withIndentLevel(level, callback) {
    this.pushIndentLevel(level);
    try {
      return callback();
    } finally {
      this.popIndentLevel();
    }
  }
  
  withAdjustedIndentation(fieldOffset, attributeOffset, callback) {
    const originalLevels = { ...this.I };
    this.I.F = this.I.FNI + fieldOffset;
    this.I.FA = this.I.FNI + attributeOffset;
    try {
      return callback();
    } finally {
      this.I = originalLevels;
    }
  }

  generateDesignDialogXml(config, componentName) {
    this._fieldCounter = 0;
    
    const {
      title = `${componentName.charAt(0).toUpperCase() + componentName.slice(1)} Design`,
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
        'jcr:primaryType': 'nt:unstructured',
        'jcr:title': title,
        'sling:resourceType': 'cq/gui/components/authoring/dialog',
      },
      'open'
    );
    xml += this.buildNode(
      1,
      'content',
      {
        'sling:resourceType':
          'granite/ui/components/coral/foundation/container',
      },
      'open'
    );

    const useSimpleLayout =
      layout === 'simple' ||
      (tabs.length === 0 && (fields.length > 0 || items.length > 0));

    if (useSimpleLayout) {
      xml += this.buildNode(2, 'items', {}, 'open');
      xml += this.buildNode(
        3,
        'columns',
        {
          'sling:resourceType':
            'granite/ui/components/coral/foundation/fixedcolumns',
          margin: '{Boolean}true',
        },
        'open'
      );
      xml += this.buildNode(4, 'items', {}, 'open');
      xml += this.buildNode(
        5,
        'column',
        {
          'sling:resourceType':
            'granite/ui/components/coral/foundation/container',
        },
        'open'
      );
      xml += this.buildNode(6, 'items', {}, 'open');

      const fieldsArray = fields.length > 0 ? fields : items;
      
      xml += this.withIndentLevel(7, () => {
        let result = '';
        for (const field of fieldsArray) {
          result += this.generateField(field);
        }
        return result;
      });

      xml += this.closeNodes([
        [6, 'items'],
        [5, 'column'],
        [4, 'items'],
        [3, 'columns'],
        [2, 'items'],
      ]);
    } else {
      xml += this.buildNode(
        2,
        'items',
        {
          'sling:resourceType':
            'granite/ui/components/coral/foundation/tabs',
          maximized: '{Boolean}true',
        },
        'open'
      );
      xml += this.buildNode(3, 'items', {}, 'open');

      xml += this.withIndentLevel(3, () => {
        let result = '';
        for (const [index, tab] of tabs.entries()) {
          result += this.generateTab(tab, index);
        }
        
        if (config.policy && config.policy.styleGroups && config.policy.styleGroups.length > 0) {
          result += this.generateStylesTab();
        }
        
        return result;
      });

      xml += this.closeNodes([
        [3, 'items'],
        [2, 'items'],
      ]);
    }

    xml += this.closeNode(1, 'content');
    xml = this.trimLine(xml);
    xml += '</jcr:root>';

    return xml;
  }

  generatePolicy(componentName, policyConfig) {
    const {
      name = `policy_${componentName}`,
      title = `${componentName.charAt(0).toUpperCase() + componentName.slice(1)} Policy`,
      description = '',
      properties = {},
      componentMapping = [],
      rtePlugins = null,
      styleGroups = [],
      mergeWithExisting = true,
    } = policyConfig;

    const policiesDir = this.options.policiesTargetDir;
    const appName = this.options.appName;
    
    const componentPolicyDir = path.join(policiesDir, appName, 'components', componentName);
    if (!fs.existsSync(componentPolicyDir)) {
      fs.mkdirSync(componentPolicyDir, { recursive: true });
    }

    const policyFilePath = path.join(componentPolicyDir, '.content.xml');
    
    let existingProperties = {};
    let existingChildNodes = '';
    if (mergeWithExisting && fs.existsSync(policyFilePath)) {
      try {
        const existingXml = fs.readFileSync(policyFilePath, 'utf8');
        existingProperties = this.extractPolicyProperties(existingXml, name);
        existingChildNodes = this.extractPolicyChildNodes(existingXml, name);
        this.log(`• Merging with existing policy: ${name}`);
      } catch (error) {
        this.log(`⚠ Could not read existing policy, creating new: ${error.message}`);
      }
    }

    const mergedProperties = {
      ...existingProperties,
      ...properties,
    };

    let xml = '';
    xml += this.line(0, '<?xml version="1.0" encoding="UTF-8"?>');
    xml += this.buildNode(
      0,
      'jcr:root',
      {
        'xmlns:sling': 'http://sling.apache.org/jcr/sling/1.0',
        'xmlns:cq': 'http://www.day.com/jcr/cq/1.0',
        'xmlns:jcr': 'http://www.jcp.org/jcr/1.0',
        'xmlns:nt': 'http://www.jcp.org/jcr/nt/1.0',
        'jcr:primaryType': 'nt:unstructured',
      },
      'open'
    );

    xml += this.buildNode(
      1,
      this.sanitizeNodeName(name),
      {
        'jcr:primaryType': 'nt:unstructured',
        'jcr:title': title,
        ...(description && { 'jcr:description': description }),
        'sling:resourceType': 'wcm/core/components/policy/policy',
        ...mergedProperties,
      },
      'open'
    );

    if (rtePlugins) {
      xml += this.generatePolicyRTEPlugins(rtePlugins);
    }

    if (componentMapping && componentMapping.length > 0) {
      xml += this.generatePolicyComponentMapping(componentMapping);
    }

    if (styleGroups && styleGroups.length > 0) {
      xml += this.generatePolicyStyleGroups(styleGroups);
    }

    if (existingChildNodes && !rtePlugins && !componentMapping.length && !styleGroups.length) {
      xml += existingChildNodes;
    }

    xml += this.closeNode(1, this.sanitizeNodeName(name));
    xml = this.trimLine(xml);
    xml += '</jcr:root>';

    fs.writeFileSync(policyFilePath, xml, 'utf8');

    this.log(`✓ Generated policy: ${policyFilePath}`);
  }

  generatePolicyRTEPlugins(rtePlugins, baseLevel = 2) {
    let xml = this.buildNode(baseLevel, 'rtePlugins', {}, 'open');

    for (const [pluginName, pluginConfig] of Object.entries(rtePlugins)) {
      const { features = '*', ...otherConfig } = pluginConfig;

      xml += this.buildNode(
        baseLevel + 1,
        pluginName,
        {
          'jcr:primaryType': 'nt:unstructured',
          features: features,
          ...otherConfig,
        },
        'none'
      );

      if (pluginConfig.formats || pluginConfig.chars || pluginConfig.styles) {
        xml = this.openBlock(xml);

        if (pluginConfig.formats) {
          xml += this.buildNode(baseLevel + 2, 'formats', { 'jcr:primaryType': 'nt:unstructured', override: '{Boolean}true' }, 'open');
          pluginConfig.formats.forEach((format, index) => {
            xml += this.buildNode(
              baseLevel + 3,
              `item${index}`,
              {
                'jcr:primaryType': 'nt:unstructured',
                ...format,
              },
              'self'
            );
          });
          xml += this.closeNode(baseLevel + 2, 'formats');
        }

        if (pluginConfig.chars) {
          xml += this.buildNode(baseLevel + 2, 'specialCharsConfig', {}, 'open');
          xml += this.buildNode(baseLevel + 3, 'chars', { 'jcr:primaryType': 'nt:unstructured', override: '{Boolean}true' }, 'open');
          pluginConfig.chars.forEach((char, index) => {
            xml += this.buildNode(
              baseLevel + 4,
              `item${index}`,
              {
                'jcr:primaryType': 'nt:unstructured',
                ...char,
              },
              'self'
            );
          });
          xml += this.closeNodes([
            [baseLevel + 3, 'chars'],
            [baseLevel + 2, 'specialCharsConfig'],
          ]);
        }

        xml += this.closeNode(baseLevel + 1, pluginName);
      } else {
        xml = this.selfClose(xml);
      }
    }

    xml += this.closeNode(baseLevel, 'rtePlugins');
    return xml;
  }

  generatePolicyComponentMapping(mappings, baseLevel = 2) {
    let xml = this.buildNode(baseLevel, 'cq:authoring', {}, 'open');
    xml += this.buildNode(baseLevel + 1, 'assetToComponentMapping', {}, 'open');

    mappings.forEach((mapping, index) => {
      const nodeName = mapping.name || `mapping_${Date.now() + index}`;
      xml += this.buildNode(
        baseLevel + 2,
        nodeName,
        {
          'jcr:primaryType': 'nt:unstructured',
          assetGroup: mapping.assetGroup,
          assetMimetype: mapping.assetMimetype,
          droptarget: mapping.droptarget,
          resourceType: mapping.resourceType,
        },
        'self'
      );
    });

    xml += this.closeNodes([
      [baseLevel + 1, 'assetToComponentMapping'],
      [baseLevel, 'cq:authoring'],
    ]);

    return xml;
  }

  generatePolicyStyleGroups(styleGroups, baseLevel = 2) {
    let xml = this.buildNode(baseLevel, 'cq:styleGroups', {}, 'open');

    styleGroups.forEach((group, index) => {
      const groupName = group.name || `stylegroup_${index}`;
      xml += this.buildNode(
        baseLevel + 1,
        groupName,
        {
          'jcr:primaryType': 'nt:unstructured',
          'cq:styleGroupLabel': group.label,
        },
        'open'
      );

      xml += this.buildNode(baseLevel + 2, 'cq:styles', {}, 'open');

      if (group.styles && Array.isArray(group.styles)) {
        const usedStyleIds = new Set();
        
        group.styles.forEach((style, styleIndex) => {
          const styleName = style.name || `style_${styleIndex}`;
          
          // Ensure unique cq:styleId within the group
          let styleId = styleName;
          let counter = 1;
          while (usedStyleIds.has(styleId)) {
            styleId = `${styleName}_${counter}`;
            counter++;
          }
          usedStyleIds.add(styleId);
          
          xml += this.buildNode(
            baseLevel + 3,
            styleName,
            {
              'jcr:primaryType': 'nt:unstructured',
              'cq:styleId': styleId,
              'cq:styleLabel': style.label,
              'cq:styleClasses': style.classes,
              ...(style.icon && { 'cq:styleIcon': style.icon }),
            },
            'self'
          );
        });
      }

      xml += this.closeNodes([
        [baseLevel + 2, 'cq:styles'],
        [baseLevel + 1, groupName],
      ]);
    });

    xml += this.closeNode(baseLevel, 'cq:styleGroups');
    return xml;
  }

  generateStylesTab() {
    const tabLevel = this.getIndentLevel(1);
    
    const xml = this.buildNode(
      tabLevel,
      'cq:styles',
      {
        'jcr:primaryType': 'nt:unstructured',
        'sling:resourceType': 'granite/ui/components/coral/foundation/include',
        path: '/mnt/overlay/cq/gui/components/authoring/dialog/style/tab_design/styletab',
      },
      'self'
    );
    
    return xml;
  }

  mapPolicyToTemplates(componentName, policyConfig) {
    const { name: policyName, templates = [] } = policyConfig;
    const appName = this.options.appName;
    
    if (templates.length === 0) {
      return;
    }

    templates.forEach(templateName => {
      const templatePoliciesPath = path.join(
        this.options.templatePoliciesDir,
        templateName,
        'policies',
        '.content.xml'
      );

      if (!fs.existsSync(templatePoliciesPath)) {
        this.log(`✗ Template policies file not found: ${templatePoliciesPath}`);
        return;
      }

      try {
        let xml = fs.readFileSync(templatePoliciesPath, 'utf8');
        
        const policyPath = `${appName}/components/${componentName}/${policyName}`;
        
        const exactPolicyPattern = new RegExp(String.raw`<${componentName}\s[^>]*cq:policy="${policyPath.replace(/\//g, '\\/')}"[^>]*>`);
        if (exactPolicyPattern.test(xml)) {
          this.log(`• Policy ${policyPath} already mapped to ${templateName}`);
          return;
        }
        
        const anyMappingPattern = new RegExp(String.raw`<${componentName}\s[^>]*cq:policy="([^"]*)"[^>]*>`, 'g');
        const existingMatch = anyMappingPattern.exec(xml);
        
        if (existingMatch) {
          const oldPolicyPath = existingMatch[1];
          const oldMappingPattern = new RegExp(String.raw`<${componentName}\s[^>]*cq:policy="${oldPolicyPath.replace(/\//g, '\\/')}"[^>]*>`, 'g');
          
          const newMappingXml = this.buildNode(
            7,
            componentName,
            {
              'cq:policy': policyPath,
              'jcr:primaryType': 'nt:unstructured',
              'sling:resourceType': 'wcm/core/components/policies/mapping'
            },
            'self'
          ).trim();
          
          xml = xml.replace(oldMappingPattern, newMappingXml);
          this.log(`✓ Updated policy mapping for ${componentName} from ${oldPolicyPath} to ${policyPath} in ${templateName}`);
        } else {
          const componentsEndTag = '</components>';
          const componentsIndex = xml.lastIndexOf(componentsEndTag);
          
          if (componentsIndex === -1) {
            this.log(`✗ Could not find components section in ${templateName} policies`);
            return;
          }
          
          const beforeComponents = xml.substring(0, componentsIndex);
          
          const lastNewlineIndex = beforeComponents.lastIndexOf('\n');
          const componentsIndent = xml.substring(lastNewlineIndex + 1, componentsIndex);
          
          const nodeIndent = componentsIndent + '    ';
          const indentLevel = nodeIndent.length / 4;
          const mappingXml = this.buildNode(
            indentLevel,
            componentName,
            {
              'cq:policy': policyPath,
              'jcr:primaryType': 'nt:unstructured',
              'sling:resourceType': 'wcm/core/components/policies/mapping'
            },
            'self'
          ).trim();

          xml = xml.substring(0, lastNewlineIndex + 1) + mappingXml + '\n' + componentsIndent + xml.substring(componentsIndex);
          this.log(`✓ Mapped policy ${policyPath} to template ${templateName}`);
        }
        
        fs.writeFileSync(templatePoliciesPath, xml, 'utf8');
        
      } catch (error) {
        this.log(`✗ Error mapping policy to template ${templateName}: ${error.message}`);
      }
    });
  }

  extractPolicyProperties(xml, policyName) {
    const properties = {};
    
    const policyNodePattern = new RegExp(
      `<${this.sanitizeNodeName(policyName)}[^>]*>`,
      's'
    );
    const match = xml.match(policyNodePattern);
    
    if (!match) return properties;
    
    const nodeTag = match[0];
    
    const excludedAttrs = new Set([
      'jcr:primaryType',
      'jcr:title',
      'jcr:description',
      'sling:resourceType',
      'xmlns:sling',
      'xmlns:cq',
      'xmlns:jcr',
      'xmlns:nt'
    ]);
    
    const attrPattern = /(\S+)="([^"]*)"/g;
    let attrMatch;
    
    while ((attrMatch = attrPattern.exec(nodeTag)) !== null) {
      const [, attrName, attrValue] = attrMatch;
      if (!excludedAttrs.has(attrName)) {
        properties[attrName] = attrValue;
      }
    }
    
    return properties;
  }

  extractPolicyChildNodes(xml, policyName) {
    const sanitizedName = this.sanitizeNodeName(policyName);
    const openTagPattern = new RegExp(`<${sanitizedName}[^>]*>`, 's');
    const closeTagPattern = new RegExp(`</${sanitizedName}>`, 's');
    
    const openMatch = xml.match(openTagPattern);
    const closeMatch = xml.match(closeTagPattern);
    
    if (!openMatch || !closeMatch) return '';
    
    const openIndex = xml.indexOf(openMatch[0]) + openMatch[0].length;
    const closeIndex = xml.indexOf(closeMatch[0]);
    
    if (openIndex >= closeIndex) return '';
    
    const content = xml.substring(openIndex, closeIndex).trim();
    
    const knownNodes = ['rtePlugins', 'cq:authoring', 'cq:styleGroups'];
    let filteredContent = content;
    
    for (const nodeName of knownNodes) {
      const nodePattern = new RegExp(
        `<${nodeName}[^>]*>.*?</${nodeName}>`,
        'gs'
      );
      filteredContent = filteredContent.replace(nodePattern, '');
    }
    
    return filteredContent.trim() ? '\n' + filteredContent : '';
  }
}

module.exports = AemDialogGeneratorPlugin;
