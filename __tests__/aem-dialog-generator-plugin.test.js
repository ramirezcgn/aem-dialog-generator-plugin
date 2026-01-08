const AemDialogGeneratorPlugin = require('../aem-dialog-generator-plugin');
const fs = require('node:fs');

// Mock fs module
jest.mock('node:fs');

describe('AemDialogGeneratorPlugin', () => {
  let plugin;
  let mockOptions;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    fs.existsSync = jest.fn();
    fs.readdirSync = jest.fn();
    fs.statSync = jest.fn();
    fs.readFileSync = jest.fn();
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();

    // Default options
    mockOptions = {
      sourceDir: '/test/source',
      targetDir: '/test/target',
      appName: 'testapp',
      verbose: false,
    };
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      plugin = new AemDialogGeneratorPlugin();

      expect(plugin.I).toEqual({
        F: 11,
        FA: 12,
        FN: 12,
        FNI: 13,
        MI: 14,
      });
      expect(plugin.options.dialogFileName).toBe('dialog.json');
      expect(plugin.options.useFolderStructure).toBe(true);
      expect(plugin.options.verbose).toBe(false);
    });

    test('should initialize with custom options', () => {
      plugin = new AemDialogGeneratorPlugin(mockOptions);

      expect(plugin.options.sourceDir).toBe('/test/source');
      expect(plugin.options.targetDir).toBe('/test/target');
      expect(plugin.options.appName).toBe('testapp');
    });

    test('should respect useFolderStructure option', () => {
      plugin = new AemDialogGeneratorPlugin({
        ...mockOptions,
        useFolderStructure: false,
      });

      expect(plugin.options.useFolderStructure).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      plugin = new AemDialogGeneratorPlugin(mockOptions);
    });

    describe('sanitizeNodeName', () => {
      test('should remove ./ prefix', () => {
        expect(plugin.sanitizeNodeName('./myField')).toBe('myField');
      });

      test('should replace special characters with underscore', () => {
        expect(plugin.sanitizeNodeName('./my-field:name')).toBe(
          'my-field_name'
        );
        expect(plugin.sanitizeNodeName('./field@name')).toBe('field_name');
      });

      test('should handle already clean names', () => {
        expect(plugin.sanitizeNodeName('cleanName')).toBe('cleanName');
      });
    });

    describe('escapeXml', () => {
      test('should escape XML special characters', () => {
        expect(plugin.escapeXml('Test & Co')).toBe('Test &amp; Co');
        expect(plugin.escapeXml('<div>Test</div>')).toBe(
          '&lt;div&gt;Test&lt;/div&gt;'
        );
        expect(plugin.escapeXml('Say "Hello"')).toBe('Say &quot;Hello&quot;');
        expect(plugin.escapeXml("It's")).toBe('It&apos;s');
      });

      test('should handle non-string values', () => {
        expect(plugin.escapeXml(123)).toBe(123);
        expect(plugin.escapeXml(null)).toBe(null);
      });
    });

    describe('line', () => {
      test('should generate properly indented line', () => {
        expect(plugin.line(0, 'test')).toBe('test\n');
        expect(plugin.line(1, 'test')).toBe('    test\n');
        expect(plugin.line(2, 'test')).toBe('        test\n');
      });
    });

    describe('generateAttributeValue', () => {
      test('should format boolean values', () => {
        expect(plugin.generateAttributeValue('required', true)).toBe(
          'required="{Boolean}true"'
        );
        expect(plugin.generateAttributeValue('enabled', false)).toBe(
          'enabled="{Boolean}false"'
        );
      });

      test('should format number values', () => {
        expect(plugin.generateAttributeValue('count', 42)).toBe(
          'count="{Long}42"'
        );
      });

      test('should format array values', () => {
        expect(plugin.generateAttributeValue('items', ['a', 'b', 'c'])).toBe(
          'items="[a,b,c]"'
        );
      });

      test('should format string values', () => {
        expect(plugin.generateAttributeValue('name', 'test')).toBe(
          'name="test"'
        );
      });

      test('should escape XML in string values', () => {
        expect(plugin.generateAttributeValue('label', 'Test & Co')).toBe(
          'label="Test &amp; Co"'
        );
      });
    });

    describe('getResourceType', () => {
      test('should return correct resource types', () => {
        expect(plugin.getResourceType('textfield')).toBe(
          'granite/ui/components/coral/foundation/form/textfield'
        );
        expect(plugin.getResourceType('textarea')).toBe(
          'granite/ui/components/coral/foundation/form/textarea'
        );
        expect(plugin.getResourceType('select')).toBe(
          'granite/ui/components/coral/foundation/form/select'
        );
        expect(plugin.getResourceType('multifield')).toBe(
          'granite/ui/components/coral/foundation/form/multifield'
        );
        expect(plugin.getResourceType('rte')).toBe(
          'cq/gui/components/authoring/dialog/richtext'
        );
      });

      test('should fallback to textfield for unknown types', () => {
        expect(plugin.getResourceType('unknown')).toBe(
          'granite/ui/components/coral/foundation/form/textfield'
        );
      });
    });
  });

  describe('XML Generation', () => {
    beforeEach(() => {
      plugin = new AemDialogGeneratorPlugin(mockOptions);
    });

    describe('generateField', () => {
      test('should generate textfield XML', () => {
        const field = {
          type: 'textfield',
          name: './title',
          label: 'Title',
          required: true,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/form/textfield"'
        );
        expect(xml).toContain('fieldLabel="Title"');
        expect(xml).toContain('name="./title"');
        expect(xml).toContain('required="{Boolean}true"');
      });

      test('should generate select with options', () => {
        const field = {
          type: 'select',
          name: './type',
          label: 'Type',
          options: [
            { value: 'type1', text: 'Type 1' },
            { value: 'type2', text: 'Type 2' },
          ],
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/form/select"'
        );
        expect(xml).toContain('<items jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('value="type1"');
        expect(xml).toContain('text="Type 1"');
      });

      test('should delegate to generateMultifield for multifield type', () => {
        const field = {
          type: 'multifield',
          name: './items',
          label: 'Items',
          fields: [],
        };
        const spy = jest.spyOn(plugin, 'generateMultifield');

        plugin.generateField(field);

        expect(spy).toHaveBeenCalledWith(field);
      });

      test('should delegate to generateFieldset for fieldset type', () => {
        const field = { type: 'fieldset', label: 'Group', fields: [] };
        const spy = jest.spyOn(plugin, 'generateFieldsetOrContainer');

        plugin.generateField(field);

        expect(spy).toHaveBeenCalledWith(field, 'fieldset');
      });

      test('should delegate to generateContainer for container type', () => {
        const field = { type: 'container', fields: [] };
        const spy = jest.spyOn(plugin, 'generateFieldsetOrContainer');

        plugin.generateField(field);

        expect(spy).toHaveBeenCalledWith(field, 'container');
      });

      test('should delegate to generateRTE for rte type', () => {
        const field = { type: 'rte', name: './text', label: 'Text' };
        const spy = jest.spyOn(plugin, 'generateRTE');

        plugin.generateField(field);

        expect(spy).toHaveBeenCalledWith(field);
      });
    });

    describe('generateFieldsetOrContainer', () => {
      test('should generate fieldset with nested fields and label', () => {
        const fieldset = {
          type: 'fieldset',
          label: 'SEO Settings',
          fields: [
            { type: 'textfield', name: './metaTitle', label: 'Meta Title' },
            {
              type: 'textarea',
              name: './metaDescription',
              label: 'Meta Description',
            },
          ],
        };

        const xml = plugin.generateFieldsetOrContainer(fieldset, 'fieldset');

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/form/fieldset"'
        );
        expect(xml).toContain('jcr:title="SEO Settings"');
        expect(xml).toContain('<items jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('fieldLabel="Meta Title"');
        expect(xml).toContain('fieldLabel="Meta Description"');
      });

      test('should generate fieldset with nested items', () => {
        const fieldset = {
          type: 'fieldset',
          label: 'SEO Settings',
          items: [
            { type: 'textfield', name: './metaTitle', label: 'Meta Title' },
            {
              type: 'textarea',
              name: './metaDescription',
              label: 'Meta Description',
            },
          ],
        };

        const xml = plugin.generateFieldsetOrContainer(fieldset, 'fieldset');

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/form/fieldset"'
        );
        expect(xml).toContain('jcr:title="SEO Settings"');
        expect(xml).toContain('<items jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('fieldLabel="Meta Title"');
        expect(xml).toContain('fieldLabel="Meta Description"');
      });

      test('should generate container without label', () => {
        const container = {
          type: 'container',
          name: 'wrapper',
          fields: [
            { type: 'textfield', name: './field1', label: 'Field 1' },
          ],
        };

        const xml = plugin.generateFieldsetOrContainer(container, 'container');

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/container"'
        );
        expect(xml).not.toContain('jcr:title');
        expect(xml).toContain('<items jcr:primaryType="nt:unstructured">');
      });
    });

    describe('Accordion Layout', () => {
      test('should generate accordion layout with multiple sections', () => {
        const config = {
          title: 'Test Dialog',
          layout: 'accordion',
          tabs: [
            {
              title: 'General',
              fields: [
                { type: 'textfield', name: './title', label: 'Title' },
              ],
            },
            {
              title: 'Advanced',
              active: true,
              fields: [
                { type: 'textfield', name: './cssClass', label: 'CSS Class' },
              ],
            },
          ],
        };

        const xml = plugin.generateDialogXml(config, 'testcomponent');

        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/accordion"');
        expect(xml).toContain('<general');
        expect(xml).toContain('jcr:title="General"');
        expect(xml).toContain('<advanced');
        expect(xml).toContain('jcr:title="Advanced"');
        expect(xml).toContain('active="{Boolean}true"');
        expect(xml).toContain('name="./title"');
        expect(xml).toContain('name="./cssClass"');
      });

      test('should generate accordion with custom item names', () => {
        const config = {
          layout: 'accordion',
          tabs: [
            {
              name: 'settings',
              title: 'Settings',
              fields: [
                { type: 'checkbox', name: './enabled', label: 'Enabled' },
              ],
            },
          ],
        };

        const xml = plugin.generateDialogXml(config, 'test');

        expect(xml).toContain('<settings');
        expect(xml).toContain('jcr:title="Settings"');
      });

      test('should default accordion item to collapsed', () => {
        const config = {
          layout: 'accordion',
          tabs: [
            {
              title: 'Default',
              fields: [{ type: 'textfield', name: './field', label: 'Field' }],
            },
          ],
        };

        const xml = plugin.generateDialogXml(config, 'test');

        expect(xml).not.toContain('active="{Boolean}true"');
      });
    });

    describe('Field Validation', () => {
      test('should generate field with regex validation', () => {
        const field = {
          type: 'textfield',
          name: './email',
          label: 'Email',
          validation: {
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            message: 'Please enter a valid email address',
          },
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain(
          'validation="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"'
        );
        expect(xml).toContain(
          'validationMessage="Please enter a valid email address"'
        );
      });

      test('should generate field with pattern validation only', () => {
        const field = {
          type: 'textfield',
          name: './phone',
          label: 'Phone',
          validation: {
            pattern: '^\\d{10}$',
          },
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('validation="^\\d{10}$"');
        expect(xml).not.toContain('validationMessage');
      });
    });

    describe('Placeholder Text', () => {
      test('should generate field with placeholder', () => {
        const field = {
          type: 'textfield',
          name: './username',
          label: 'Username',
          placeholder: 'Enter your username',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('emptyText="Enter your username"');
      });

      test('should generate textarea with placeholder', () => {
        const field = {
          type: 'textarea',
          name: './description',
          label: 'Description',
          placeholder: 'Describe your component here...',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('emptyText="Describe your component here..."');
      });

      test('should escape special characters in placeholder', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          placeholder: 'Enter "quoted" text & more',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('emptyText="Enter &quot;quoted&quot; text &amp; more"');
      });
    });

    describe('Min/Max Validation', () => {
      test('should generate numberfield with min and max', () => {
        const field = {
          type: 'numberfield',
          name: './age',
          label: 'Age',
          min: 18,
          max: 99,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('min="18"');
        expect(xml).toContain('max="99"');
      });

      test('should generate numberfield with only min', () => {
        const field = {
          type: 'numberfield',
          name: './quantity',
          label: 'Quantity',
          min: 1,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('min="1"');
        expect(xml).not.toContain('max=');
      });

      test('should generate numberfield with only max', () => {
        const field = {
          type: 'numberfield',
          name: './discount',
          label: 'Discount',
          max: 100,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('max="100"');
        expect(xml).not.toContain('min=');
      });

      test('should support min value of 0', () => {
        const field = {
          type: 'numberfield',
          name: './score',
          label: 'Score',
          min: 0,
          max: 10,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('min="0"');
        expect(xml).toContain('max="10"');
      });
    });

    describe('Disabled and ReadOnly Fields', () => {
      test('should generate disabled field', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          disabled: true,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('disabled="{Boolean}true"');
      });

      test('should generate readOnly field', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          readOnly: true,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('readOnly="{Boolean}true"');
      });

      test('should generate field with both disabled and readOnly', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          disabled: true,
          readOnly: true,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('disabled="{Boolean}true"');
        expect(xml).toContain('readOnly="{Boolean}true"');
      });

      test('should not add disabled or readOnly when false', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          disabled: false,
          readOnly: false,
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('disabled=');
        expect(xml).not.toContain('readOnly=');
      });
    });

    describe('Multiple Selection', () => {
      test('should generate select with multiple selection', () => {
        const field = {
          type: 'select',
          name: './categories',
          label: 'Categories',
          multiple: true,
          options: [
            { text: 'News', value: 'news' },
            { text: 'Blog', value: 'blog' },
          ],
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('multiple="{Boolean}true"');
      });

      test('should not add multiple when false', () => {
        const field = {
          type: 'select',
          name: './category',
          label: 'Category',
          multiple: false,
          options: [
            { text: 'News', value: 'news' },
          ],
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('multiple=');
      });

      test('should only add multiple to select fields', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          multiple: true,
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('multiple=');
      });
    });

    describe('generateWell', () => {
      test('should generate well with nested fields', () => {
        const well = {
          type: 'well',
          fields: [
            { type: 'textfield', name: './title', label: 'Title' },
            { type: 'textarea', name: './description', label: 'Description' },
          ],
        };

        const xml = plugin.generateWell(well);

        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/well"');
        expect(xml).toContain('<items jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('name="./title"');
        expect(xml).toContain('name="./description"');
      });

      test('should generate well with custom name', () => {
        const well = {
          type: 'well',
          name: 'advancedSettings',
          fields: [
            { type: 'textfield', name: './custom', label: 'Custom' },
          ],
        };

        const xml = plugin.generateWell(well);

        expect(xml).toContain('<advancedSettings');
        expect(xml).toContain('</advancedSettings>');
      });

      test('should support items property', () => {
        const well = {
          type: 'well',
          items: [
            { type: 'checkbox', name: './enabled', label: 'Enabled' },
          ],
        };

        const xml = plugin.generateWell(well);

        expect(xml).toContain('name="./enabled"');
      });
    });

    describe('Contextual Help', () => {
      test('should generate field with contextual help as string', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          contextualHelp: 'This is a helpful tooltip',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:data-help="This is a helpful tooltip"');
      });

      test('should generate field with contextual help as object', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          contextualHelp: {
            text: 'Click for more information',
            url: 'https://example.com/help',
          },
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:data-help="Click for more information"');
        expect(xml).toContain('granite:data-help-url="https://example.com/help"');
      });

      test('should escape special characters in contextual help', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          contextualHelp: 'Use "quotes" & <tags>',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:data-help="Use &quot;quotes&quot; &amp; &lt;tags&gt;"');
      });
    });

    describe('Custom CSS Classes', () => {
      test('should add custom className to granite:class', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          className: 'custom-class',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="custom-class"');
      });

      test('should combine className with existing granite classes', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          className: 'custom-class another-class',
          showhideClass: 'video-fields',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="hide video-fields custom-class another-class"');
      });

      test('should handle className as array', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          className: ['class1', 'class2'],
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="class1 class2"');
      });
    });

    describe('Wrapper Class', () => {
      test('should add wrapperClass into granite:class', () => {
        const field = {
          type: 'textfield',
          name: './title',
          label: 'Title',
          wrapperClass: 'wrap-outer',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="wrap-outer"');
      });

      test('should merge wrapperClass with className and showhideClass', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          showhideClass: 'cond-group',
          className: 'inner-a inner-b',
          wrapperClass: 'wrap-a wrap-b',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="hide cond-group inner-a inner-b wrap-a wrap-b"');
      });
    });

    describe('Field Width Control', () => {
      test('should add width attribute', () => {
        const field = {
          type: 'textfield',
          name: './code',
          label: 'Code',
          width: '100px',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('width="100px"');
      });

      test('should support percentage width', () => {
        const field = {
          type: 'numberfield',
          name: './count',
          label: 'Count',
          width: '50%',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('width="50%"');
      });

      test('should support numeric width', () => {
        const field = {
          type: 'textfield',
          name: './short',
          label: 'Short',
          width: '200',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('width="200"');
      });
    });

    describe('Coral Spacing (Margin)', () => {
      test('should add margin attribute when true', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          margin: true,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('margin="{Boolean}true"');
      });

      test('should add margin attribute when false', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          margin: false,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('margin="{Boolean}false"');
      });

      test('should not add margin when undefined', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('margin=');
      });
    });

    describe('Default Values', () => {
      test('should add default value for textfield', () => {
        const field = {
          type: 'textfield',
          name: './title',
          label: 'Title',
          defaultValue: 'Default Title',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('value="Default Title"');
      });

      test('should add default value for numberfield', () => {
        const field = {
          type: 'numberfield',
          name: './count',
          label: 'Count',
          defaultValue: 10,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('value="10"');
      });

      test('should add default value for checkbox', () => {
        const field = {
          type: 'checkbox',
          name: './enabled',
          label: 'Enabled',
          defaultValue: true,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('value="true"');
      });
    });

    describe('Field Description', () => {
      test('should add fieldDescription attribute', () => {
        const field = {
          type: 'textfield',
          name: './email',
          label: 'Email Address',
          description: 'Enter your email address for notifications',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('fieldDescription="Enter your email address for notifications"');
      });

      test('should escape special characters in description', () => {
        const field = {
          type: 'select',
          name: './type',
          label: 'Type',
          description: 'Select "type" & <format>',
          options: [{ value: 'a', text: 'A' }],
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('fieldDescription="Select &quot;type&quot; &amp; &lt;format&gt;"');
      });
    });

    describe('Max Length Validation', () => {
      test('should add maxlength attribute for textfield', () => {
        const field = {
          type: 'textfield',
          name: './title',
          label: 'Title',
          maxLength: 50,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('maxlength="50"');
      });

      test('should add maxlength for textarea', () => {
        const field = {
          type: 'textarea',
          name: './description',
          label: 'Description',
          maxLength: 500,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('maxlength="500"');
      });

      test('should support maxlength of 0', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          maxLength: 0,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('maxlength="0"');
      });
    });

    describe('Empty Text (Alternative to Placeholder)', () => {
      test('should add emptyText attribute', () => {
        const field = {
          type: 'textfield',
          name: './search',
          label: 'Search',
          emptyText: 'Type to search...',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('emptyText="Type to search..."');
      });

      test('should prefer emptyText over placeholder when both specified', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          placeholder: 'Placeholder text',
          emptyText: 'Empty text',
        };

        const xml = plugin.generateField(field);

        // Both should be present, but emptyText appears last (taking precedence)
        expect(xml).toContain('emptyText="Empty text"');
      });

      test('should escape special characters in emptyText', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          emptyText: 'Enter "value" & <data>',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('emptyText="Enter &quot;value&quot; &amp; &lt;data&gt;"');
      });
    });

    describe('Granite ID', () => {
      test('should add granite:id attribute', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          graniteId: 'custom-field-id',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:id="custom-field-id"');
      });

      test('should escape special characters in graniteId', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          graniteId: 'field-with-"quotes"',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:id="field-with-&quot;quotes&quot;"');
      });

      test('should work with select fields', () => {
        const field = {
          type: 'select',
          name: './type',
          label: 'Type',
          graniteId: 'type-selector',
          options: [{ value: 'a', text: 'A' }],
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:id="type-selector"');
      });
    });

    describe('Tracking Feature', () => {
      test('should add trackingFeature attribute', () => {
        const field = {
          type: 'textfield',
          name: './title',
          label: 'Title',
          trackingFeature: 'hero-title',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('trackingFeature="hero-title"');
      });

      test('should work with checkbox for analytics tracking', () => {
        const field = {
          type: 'checkbox',
          name: './enableFeature',
          label: 'Enable Feature',
          trackingFeature: 'feature-toggle',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('trackingFeature="feature-toggle"');
      });

      test('should escape special characters', () => {
        const field = {
          type: 'select',
          name: './type',
          label: 'Type',
          trackingFeature: 'type-select-&-more',
          options: [{ value: 'a', text: 'A' }],
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('trackingFeature="type-select-&amp;-more"');
      });
    });

    describe('Tracking Element', () => {
      test('should add trackingElement attribute', () => {
        const field = {
          type: 'textfield',
          name: './ctaText',
          label: 'CTA Text',
          trackingElement: 'hero-cta',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('trackingElement="hero-cta"');
      });

      test('should work together with trackingFeature', () => {
        const field = {
          type: 'textfield',
          name: './ctaLink',
          label: 'CTA Link',
          trackingFeature: 'hero',
          trackingElement: 'cta',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('trackingFeature="hero"');
        expect(xml).toContain('trackingElement="cta"');
      });
    });

    describe('Render Hidden', () => {
      test('should add renderHidden attribute when true', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          renderHidden: true,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('renderHidden="{Boolean}true"');
      });

      test('should not add renderHidden when false', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          renderHidden: false,
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('renderHidden');
      });

      test('should work with conditional rendering scenarios', () => {
        const field = {
          type: 'numberfield',
          name: './advancedOption',
          label: 'Advanced Option',
          renderHidden: true,
          description: 'This field is hidden until certain conditions are met',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('renderHidden="{Boolean}true"');
        expect(xml).toContain('fieldDescription="This field is hidden until certain conditions are met"');
      });
    });

    describe('Field Show/Hide Expressions', () => {
      test('should add granite:hide for showIf expression', () => {
        const field = {
          type: 'textfield',
          name: './videoUrl',
          label: 'Video URL',
          showIf: { field: './contentType', value: 'video' },
        };

        const xml = plugin.generateField(field);
        expect(xml).toContain('granite:hide="${!./contentType || ./contentType != \'video\'}"');
      });

      test('should add granite:hide for hideIf expression', () => {
        const field = {
          type: 'textfield',
          name: './gifOnly',
          label: 'GIF Only',
          hideIf: { field: './format', value: 'gif' },
        };

        const xml = plugin.generateField(field);
        expect(xml).toContain('granite:hide="${./format && ./format == \'gif\'}"');
      });
    });

    describe('Select with Datasource', () => {
      test('should generate datasource node and flags', () => {
        const field = {
          type: 'select',
          name: './category',
          label: 'Category',
          datasource: '/apps/mysite/datasources/categories',
          emptyOption: true,
          forceSelection: true,
        };

        const xml = plugin.generateField(field);
        expect(xml).toContain('emptyOption="{Boolean}true"');
        expect(xml).toContain('forceSelection="{Boolean}true"');
        expect(xml).toContain('<datasource');
        expect(xml).toContain('sling:resourceType="/apps/mysite/datasources/categories"');
      });
    });

    describe('Validation Messages', () => {
      test('should add requiredMessage and min/max messages', () => {
        const field = {
          type: 'numberfield',
          name: './age',
          label: 'Age',
          required: true,
          requiredMessage: 'Age is required',
          min: 1,
          max: 120,
          minMessage: 'Too small',
          maxMessage: 'Too large',
          patternMessage: 'Wrong format',
        };

        const xml = plugin.generateField(field);
        expect(xml).toContain('requiredMessage="Age is required"');
        expect(xml).toContain('minMessage="Too small"');
        expect(xml).toContain('maxMessage="Too large"');
        expect(xml).toContain('patternMessage="Wrong format"');
      });
    });

    describe('Order Before', () => {
      test('should add sling:orderBefore attribute', () => {
        const field = {
          type: 'textfield',
          name: './title',
          label: 'Title',
          orderBefore: 'cq:styles',
        };

        const xml = plugin.generateField(field);
        expect(xml).toContain('sling:orderBefore="cq:styles"');
      });
    });

    describe('Granite Data', () => {
      test('should add granite:data-* attributes', () => {
        const field = {
          type: 'textfield',
          name: './meta',
          label: 'Meta',
          data: { test: 'x', count: 3, flag: true },
        };

        const xml = plugin.generateField(field);
        expect(xml).toContain('granite:data-test="x"');
        expect(xml).toContain('granite:data-count="3"');
        expect(xml).toContain('granite:data-flag="true"');
      });
    });

    describe('Render Condition', () => {
      test('should add simple rendercondition', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          renderCondition: { type: 'simple', expression: "${currentUser == 'admin'}" },
        };

        const xml = plugin.generateField(field);
        expect(xml).toContain('<granite:rendercondition');
        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/renderconditions/simple"');
        expect(xml).toContain('expression="${currentUser == \'admin\'}"');
      });

      test('should add composite AND rendercondition with children', () => {
        const field = {
          type: 'textfield',
          name: './field2',
          label: 'Field 2',
          renderCondition: {
            type: 'and',
            conditions: [
              { type: 'simple', expression: "${hasPermission == true}" },
              { type: 'privilege', privilege: 'jcr:read' },
            ],
          },
        };

        const xml = plugin.generateField(field);
        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/renderconditions/and"');
        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/renderconditions/simple"');
        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/renderconditions/privilege"');
      });
    });

    describe('Multifield Enhancements', () => {
      test('should add addItemLabel and messages', () => {
        const mf = {
          name: './items',
          label: 'Items',
          addItemLabel: 'Add Item',
          maxItemsMessage: 'Too many',
          minItemsMessage: 'Too few',
          fields: [{ type: 'textfield', name: './item', label: 'Item' }],
        };

        const xml = plugin.generateMultifield(mf);
        expect(xml).toContain('addItemLabel="Add Item"');
        expect(xml).toContain('maxItemsMessage="Too many"');
        expect(xml).toContain('minItemsMessage="Too few"');
      });

      test('should add reorderableHandle', () => {
        const mf = {
          name: './slides',
          label: 'Slides',
          ordered: true,
          reorderableHandle: 'drag',
          fields: [{ type: 'textfield', name: './title', label: 'Title' }],
        };

        const xml = plugin.generateMultifield(mf);
        expect(xml).toContain('reorderableHandle="drag"');
      });
    });

    describe('QoL Input Attributes', () => {
      test('should add clearButton and autocomplete control', () => {
        const field = {
          type: 'textfield',
          name: './search',
          label: 'Search',
          clearButton: true,
          autocomplete: 'off',
          ariaLabel: 'Search field',
          ariaDescribedBy: 'hint',
          tooltipIcon: 'info'
        };

        const xml = plugin.generateField(field);
        expect(xml).toContain('clearButton="{Boolean}true"');
        expect(xml).toContain('autocomplete="off"');
        expect(xml).toContain('ariaLabel="Search field"');
        expect(xml).toContain('ariaDescribedBy="hint"');
        expect(xml).toContain('tooltipIcon="info"');
      });
    });

    describe('Auto Focus', () => {
      test('should add autofocus when true', () => {
        const field = {
          type: 'textfield',
          name: './search',
          label: 'Search',
          autoFocus: true,
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('autofocus="{Boolean}true"');
      });

      test('should not add autofocus when false', () => {
        const field = {
          type: 'textfield',
          name: './query',
          label: 'Query',
          autoFocus: false,
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('autofocus');
      });
    });

    describe('Type Hint', () => {
      test('should add typeHint for JCR type', () => {
        const field = {
          type: 'textfield',
          name: './views',
          label: 'Views',
          typeHint: 'Long',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('typeHint="Long"');
      });

      test('should support array typeHint', () => {
        const field = {
          type: 'select',
          name: './tags',
          label: 'Tags',
          multiple: true,
          typeHint: 'String[]',
          options: [ { value: 'a', text: 'A' } ],
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('typeHint="String[]"');
      });
    });

    describe('Collapsible Fieldset/Container', () => {
      test('should add collapsible to fieldset', () => {
        const field = {
          type: 'fieldset',
          name: 'advancedSettings',
          label: 'Advanced Settings',
          collapsible: true,
          fields: [
            { type: 'textfield', name: './option1', label: 'Option 1' },
          ],
        };

        const xml = plugin.generateFieldsetOrContainer(field, 'fieldset');

        expect(xml).toContain('collapsible="{Boolean}true"');
      });

      test('should add collapsible to container', () => {
        const field = {
          type: 'container',
          name: 'optionalSection',
          collapsible: true,
          fields: [
            { type: 'textfield', name: './field', label: 'Field' },
          ],
        };

        const xml = plugin.generateFieldsetOrContainer(field, 'container');

        expect(xml).toContain('collapsible="{Boolean}true"');
      });

      test('should not add collapsible when false', () => {
        const field = {
          type: 'fieldset',
          name: 'settings',
          label: 'Settings',
          collapsible: false,
          fields: [
            { type: 'textfield', name: './field', label: 'Field' },
          ],
        };

        const xml = plugin.generateFieldsetOrContainer(field, 'fieldset');

        expect(xml).not.toContain('collapsible');
      });
    });

    describe('Filter (Path-based Pickers)', () => {
      test('should add filter to pathfield', () => {
        const field = {
          type: 'pathfield',
          name: './imagePath',
          label: 'Image Path',
          filter: 'folder',
          rootPath: '/content/dam',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('filter="folder"');
      });

      test('should add filter to assetpicker with mime types', () => {
        const field = {
          type: 'assetpicker',
          name: './pdfDocument',
          label: 'PDF Document',
          filter: 'mimetype:application/pdf',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('filter="mimetype:application/pdf"');
      });

      test('should add filter to pagefield with template filter', () => {
        const field = {
          type: 'pagefield',
          name: './targetPage',
          label: 'Target Page',
          filter: 'template:/conf/mysite/settings/wcm/templates/page-template',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('filter="template:/conf/mysite/settings/wcm/templates/page-template"');
      });

      test('should escape special characters in filter', () => {
        const field = {
          type: 'pathfield',
          name: './path',
          label: 'Path',
          filter: 'filter-with-"quotes"',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('filter="filter-with-&quot;quotes&quot;"');
      });
    });

    describe('Force Ignore Freshness (DAM Assets)', () => {
      test('should add forceIgnoreFreshness when true', () => {
        const field = {
          type: 'pathfield',
          name: './assetPath',
          label: 'Asset Path',
          forceIgnoreFreshness: true,
          rootPath: '/content/dam',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('forceIgnoreFreshness="{Boolean}true"');
      });

      test('should not add forceIgnoreFreshness when false', () => {
        const field = {
          type: 'assetpicker',
          name: './image',
          label: 'Image',
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('forceIgnoreFreshness');
      });

      test('should work with assetpicker', () => {
        const field = {
          type: 'assetpicker',
          name: './cachedAsset',
          label: 'Cached Asset',
          forceIgnoreFreshness: true,
          filter: 'folder',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('forceIgnoreFreshness="{Boolean}true"');
        expect(xml).toContain('filter="folder"');
      });
    });

    describe('Hidden Fields', () => {
      test('should generate hidden field', () => {
        const field = {
          type: 'hidden',
          name: './hiddenValue',
          defaultValue: 'secret',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/form/hidden"');
        expect(xml).toContain('name="./hiddenValue"');
        expect(xml).toContain('value="secret"');
      });

      test('should generate hidden field without label', () => {
        const field = {
          type: 'hidden',
          name: './id',
          defaultValue: '12345',
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('fieldLabel');
        expect(xml).toContain('value="12345"');
      });
    });

    describe('generateButton', () => {
      test('should generate button with default variant', () => {
        const button = {
          type: 'button',
          text: 'Save',
        };

        const xml = plugin.generateButton(button);

        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/button"');
        expect(xml).toContain('text="Save"');
        expect(xml).toContain('variant="primary"');
      });

      test('should generate button with custom variant and icon', () => {
        const button = {
          type: 'button',
          name: 'clearBtn',
          text: 'Clear',
          variant: 'secondary',
          icon: 'close',
        };

        const xml = plugin.generateButton(button);

        expect(xml).toContain('<clearBtn');
        expect(xml).toContain('text="Clear"');
        expect(xml).toContain('variant="secondary"');
        expect(xml).toContain('icon="close"');
      });

      test('should generate button with command', () => {
        const button = {
          type: 'button',
          text: 'Generate',
          command: 'generateContent',
        };

        const xml = plugin.generateButton(button);

        expect(xml).toContain('command="generateContent"');
      });

      test('should generate button with handler', () => {
        const button = {
          type: 'button',
          text: 'Preview',
          handler: 'preview.js',
        };

        const xml = plugin.generateButton(button);

        expect(xml).toContain('granite:data=');
        expect(xml).toContain('preview.js');
      });
    });

    describe('generateFixedColumns', () => {
      test('should generate fixedcolumns layout with multiple columns', () => {
        const fixedColumns = {
          type: 'fixedcolumns',
          columns: [
            {
              fields: [
                { type: 'textfield', name: './firstName', label: 'First Name' },
              ],
            },
            {
              fields: [
                { type: 'textfield', name: './lastName', label: 'Last Name' },
              ],
            },
          ],
        };

        const xml = plugin.generateFixedColumns(fixedColumns);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/fixedcolumns"'
        );
        expect(xml).toContain('<column1');
        expect(xml).toContain('<column2');
        expect(xml).toContain('name="./firstName"');
        expect(xml).toContain('name="./lastName"');
      });

      test('should generate fixedcolumns with custom column names', () => {
        const fixedColumns = {
          type: 'fixedcolumns',
          name: 'personalInfo',
          columns: [
            {
              name: 'nameColumn',
              fields: [{ type: 'textfield', name: './name', label: 'Name' }],
            },
            {
              name: 'ageColumn',
              fields: [
                { type: 'numberfield', name: './age', label: 'Age' },
              ],
            },
          ],
        };

        const xml = plugin.generateFixedColumns(fixedColumns);

        expect(xml).toContain('<nameColumn');
        expect(xml).toContain('<ageColumn');
      });

      test('should generate fixedcolumns with three columns', () => {
        const fixedColumns = {
          type: 'fixedcolumns',
          columns: [
            {
              fields: [{ type: 'textfield', name: './col1', label: 'Col 1' }],
            },
            {
              fields: [{ type: 'textfield', name: './col2', label: 'Col 2' }],
            },
            {
              fields: [{ type: 'textfield', name: './col3', label: 'Col 3' }],
            },
          ],
        };

        const xml = plugin.generateFixedColumns(fixedColumns);

        expect(xml).toContain('<column1');
        expect(xml).toContain('<column2');
        expect(xml).toContain('<column3');
      });
    });

    describe('generateMultifield', () => {
      test('should generate simple multifield with fields', () => {
        const multifield = {
          name: './tags',
          label: 'Tags',
          fields: [{ type: 'textfield', name: './tag', label: 'Tag' }],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/form/multifield"'
        );
        expect(xml).toContain('fieldLabel="Tags"');
        expect(xml).not.toContain('composite="{Boolean}true"');
      });

      test('should generate simple multifield with items', () => {
        const multifield = {
          name: './tags',
          label: 'Tags',
          items: [{ type: 'textfield', name: './tag', label: 'Tag' }],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/form/multifield"'
        );
        expect(xml).toContain('fieldLabel="Tags"');
        expect(xml).not.toContain('composite="{Boolean}true"');
        expect(xml).not.toContain('items="');
      });

      test('should generate composite multifield with fields', () => {
        const multifield = {
          name: './slides',
          label: 'Slides',
          composite: true,
          fields: [
            { type: 'textfield', name: './title', label: 'Title' },
            { type: 'textarea', name: './description', label: 'Description' },
          ],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain('composite="{Boolean}true"');
        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/container"'
        );
      });

      test('should generate composite multifield with items', () => {
        const multifield = {
          name: './menuItems',
          label: 'Menu Items',
          composite: true,
          items: [
            { type: 'textfield', name: './linkText', label: 'Link Text' },
            {
              type: 'pathfield',
              name: './link',
              label: 'Link',
              rootPath: '/content',
            },
          ],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain('composite="{Boolean}true"');
        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/container"'
        );
        expect(xml).toContain('fieldLabel="Link Text"');
        expect(xml).toContain('fieldLabel="Link"');
        expect(xml).not.toContain('items="');
      });

      test('should not add items array as XML attribute', () => {
        const multifield = {
          name: './items',
          label: 'Items',
          composite: true,
          items: [
            { type: 'textfield', name: './text', label: 'Text' },
            { type: 'textfield', name: './value', label: 'Value' },
          ],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).not.toContain('items="[');
        expect(xml).not.toContain('[object Object]');
      });

      test('should generate multifield with maxItems', () => {
        const multifield = {
          name: './tags',
          label: 'Tags',
          maxItems: 5,
          fields: [{ type: 'textfield', name: './tag', label: 'Tag' }],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain('maxItems="{Long}5"');
      });

      test('should generate multifield with minItems', () => {
        const multifield = {
          name: './tags',
          label: 'Tags',
          minItems: 2,
          fields: [{ type: 'textfield', name: './tag', label: 'Tag' }],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain('minItems="{Long}2"');
      });

      test('should generate multifield with both maxItems and minItems', () => {
        const multifield = {
          name: './items',
          label: 'Items',
          minItems: 1,
          maxItems: 10,
          fields: [{ type: 'textfield', name: './item' }],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain('minItems="{Long}1"');
        expect(xml).toContain('maxItems="{Long}10"');
      });

      test('should throw error if maxItems is not a positive number', () => {
        const multifield = {
          name: './tags',
          maxItems: -1,
          fields: [{ type: 'textfield' }],
        };

        expect(() => plugin.generateMultifield(multifield)).toThrow(
          'maxItems must be a positive number'
        );
      });

      test('should throw error if minItems is negative', () => {
        const multifield = {
          name: './tags',
          minItems: -1,
          fields: [{ type: 'textfield' }],
        };

        expect(() => plugin.generateMultifield(multifield)).toThrow(
          'minItems must be a non-negative number'
        );
      });

      test('should throw error if minItems is greater than maxItems', () => {
        const multifield = {
          name: './tags',
          minItems: 5,
          maxItems: 3,
          fields: [{ type: 'textfield' }],
        };

        expect(() => plugin.generateMultifield(multifield)).toThrow(
          'minItems (5) cannot be greater than maxItems (3)'
        );
      });

      test('should add deleteHint for confirmation message', () => {
        const multifield = {
          name: './items',
          label: 'Items',
          deleteHint: 'Are you sure you want to delete this item?',
          fields: [{ type: 'textfield', name: './item', label: 'Item' }],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain('deleteHint="Are you sure you want to delete this item?"');
      });

      test('should escape special characters in deleteHint', () => {
        const multifield = {
          name: './items',
          label: 'Items',
          deleteHint: 'Delete this "item" & confirm?',
          fields: [{ type: 'textfield', name: './item' }],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain('deleteHint="Delete this &quot;item&quot; &amp; confirm?"');
      });

      test('should add ordered for drag & drop reordering', () => {
        const multifield = {
          name: './slides',
          label: 'Slides',
          ordered: true,
          composite: true,
          fields: [
            { type: 'textfield', name: './title', label: 'Title' },
            { type: 'textarea', name: './description', label: 'Description' },
          ],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain('orderable="{Boolean}true"');
      });

      test('should not add ordered when false', () => {
        const multifield = {
          name: './items',
          label: 'Items',
          ordered: false,
          fields: [{ type: 'textfield', name: './item' }],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).not.toContain('orderable');
      });

      test('should support deleteHint and ordered together', () => {
        const multifield = {
          name: './sortableItems',
          label: 'Sortable Items',
          ordered: true,
          deleteHint: 'Remove this item?',
          fields: [{ type: 'textfield', name: './item', label: 'Item' }],
        };

        const xml = plugin.generateMultifield(multifield);

        expect(xml).toContain('orderable="{Boolean}true"');
        expect(xml).toContain('deleteHint="Remove this item?"');
      });
    });

    describe('generateHeading', () => {
      test('should generate heading with text and default level', () => {
        const heading = {
          type: 'heading',
          text: 'Advanced Settings',
        };

        const xml = plugin.generateHeading(heading);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/heading"'
        );
        expect(xml).toContain('text="Advanced Settings"');
        expect(xml).toContain('level="{Long}3"');
      });

      test('should generate heading with custom level', () => {
        const heading = {
          type: 'heading',
          text: 'Main Title',
          level: 2,
        };

        const xml = plugin.generateHeading(heading);

        expect(xml).toContain('level="{Long}2"');
      });
    });

    describe('generateText', () => {
      test('should generate text element with default variant', () => {
        const text = {
          type: 'text',
          text: 'This is an informational message',
        };

        const xml = plugin.generateText(text);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/text"'
        );
        expect(xml).toContain('text="This is an informational message"');
      });

      test('should generate text with variant', () => {
        const text = {
          type: 'text',
          text: 'Warning message',
          variant: 'warning',
        };

        const xml = plugin.generateText(text);

        expect(xml).toContain('variant="warning"');
      });

      test('should support all variant types', () => {
        const variants = ['info', 'warning', 'error', 'success'];

        variants.forEach((variant) => {
          const text = {
            type: 'text',
            text: 'Message',
            variant: variant,
          };

          const xml = plugin.generateText(text);

          expect(xml).toContain(`variant="${variant}"`);
        });
      });
    });

    describe('generateTags', () => {
      test('should generate tags field with default rootPath', () => {
        const tags = {
          type: 'tags',
          name: './cq:tags',
          label: 'Tags',
        };

        const xml = plugin.generateTags(tags);

        expect(xml).toContain(
          'sling:resourceType="cq/gui/components/coral/common/form/tagfield"'
        );
        expect(xml).toContain('fieldLabel="Tags"');
        expect(xml).toContain('name="./cq:tags"');
        expect(xml).toContain('rootPath="/content/cq:tags"');
      });

      test('should generate tags with custom rootPath', () => {
        const tags = {
          type: 'tags',
          name: './tags',
          label: 'Article Tags',
          rootPath: '/content/cq:tags/myapp',
        };

        const xml = plugin.generateTags(tags);

        expect(xml).toContain('rootPath="/content/cq:tags/myapp"');
      });

      test('should generate tags with required', () => {
        const tags = {
          type: 'tags',
          name: './tags',
          label: 'Tags',
          required: true,
        };

        const xml = plugin.generateTags(tags);

        expect(xml).toContain('required="{Boolean}true"');
      });
    });

    describe('generateImage', () => {
      test('should generate image field with default settings', () => {
        const image = {
          type: 'image',
          name: './image',
          label: 'Image',
        };

        const xml = plugin.generateImage(image);

        expect(xml).toContain(
          'sling:resourceType="cq/gui/components/authoring/dialog/fileupload"'
        );
        expect(xml).toContain('fieldLabel="Image"');
        expect(xml).toContain('name="./image"');
        expect(xml).toContain('allowUpload="{Boolean}true"');
        expect(xml).toContain('fileNameParameter="./fileName"');
        expect(xml).toContain('fileReferenceParameter="./fileReference"');
        expect(xml).toContain('mimeTypes="[image/gif,image/jpeg,image/png,image/webp,image/tiff,image/svg+xml]"');
      });

      test('should generate image with custom uploadUrl and parameters', () => {
        const image = {
          type: 'image',
          name: './heroImage',
          label: 'Hero Image',
          uploadUrl: '/content/dam/mysite',
          fileNameParameter: './imageName',
          fileReferenceParameter: './imageRef',
        };

        const xml = plugin.generateImage(image);

        expect(xml).toContain('uploadUrl="/content/dam/mysite"');
        expect(xml).toContain('fileNameParameter="./imageName"');
        expect(xml).toContain('fileReferenceParameter="./imageRef"');
      });

      test('should generate image with custom mimeTypes', () => {
        const image = {
          type: 'image',
          name: './logo',
          label: 'Logo',
          mimeTypes: ['image/png', 'image/svg+xml'],
        };

        const xml = plugin.generateImage(image);

        expect(xml).toContain('mimeTypes="[image/png,image/svg+xml]"');
      });

      test('should generate image with required', () => {
        const image = {
          type: 'image',
          name: './image',
          label: 'Image',
          required: true,
          allowUpload: false,
        };

        const xml = plugin.generateImage(image);

        expect(xml).toContain('required="{Boolean}true"');
        expect(xml).toContain('allowUpload="{Boolean}false"');
      });
    });

    describe('generateAutocomplete', () => {
      test('should generate autocomplete field', () => {
        const autocomplete = {
          type: 'autocomplete',
          name: './product',
          label: 'Select Product',
        };

        const xml = plugin.generateAutocomplete(autocomplete);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/form/autocomplete"'
        );
        expect(xml).toContain('fieldLabel="Select Product"');
        expect(xml).toContain('name="./product"');
        expect(xml).toContain('forceSelection="{Boolean}true"');
      });

      test('should generate autocomplete with datasource', () => {
        const autocomplete = {
          type: 'autocomplete',
          name: './category',
          label: 'Category',
          datasource: '/apps/mysite/datasources/categories',
        };

        const xml = plugin.generateAutocomplete(autocomplete);

        expect(xml).toContain('<datasource');
        expect(xml).toContain('sling:resourceType="/apps/mysite/datasources/categories"');
      });

      test('should generate autocomplete with multiple selection', () => {
        const autocomplete = {
          type: 'autocomplete',
          name: './tags',
          label: 'Tags',
          multiple: true,
          required: true,
          forceSelection: false,
        };

        const xml = plugin.generateAutocomplete(autocomplete);

        expect(xml).toContain('multiple="{Boolean}true"');
        expect(xml).toContain('required="{Boolean}true"');
        expect(xml).toContain('forceSelection="{Boolean}false"');
      });
    });

    describe('generateRadioGroup', () => {
      test('should generate radiogroup with options', () => {
        const radiogroup = {
          type: 'radiogroup',
          name: './layout',
          label: 'Layout',
          options: [
            { value: 'grid', text: 'Grid' },
            { value: 'list', text: 'List' },
          ],
        };

        const xml = plugin.generateRadioGroup(radiogroup);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/form/radiogroup"'
        );
        expect(xml).toContain('fieldLabel="Layout"');
        expect(xml).toContain('name="./layout"');
        expect(xml).toContain('<items jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('<grid');
        expect(xml).toContain('text="Grid"');
        expect(xml).toContain('value="grid"');
        expect(xml).toContain('<list');
        expect(xml).toContain('text="List"');
        expect(xml).toContain('value="list"');
      });

      test('should generate radiogroup with vertical layout', () => {
        const radiogroup = {
          type: 'radiogroup',
          name: './alignment',
          label: 'Alignment',
          vertical: true,
          options: [
            { value: 'left', text: 'Left' },
            { value: 'right', text: 'Right' },
          ],
        };

        const xml = plugin.generateRadioGroup(radiogroup);

        expect(xml).toContain('vertical="{Boolean}true"');
      });

      test('should generate radiogroup with checked option', () => {
        const radiogroup = {
          type: 'radiogroup',
          name: './mode',
          label: 'Mode',
          options: [
            { value: 'auto', text: 'Auto', checked: true },
            { value: 'manual', text: 'Manual' },
          ],
        };

        const xml = plugin.generateRadioGroup(radiogroup);

        expect(xml).toContain('checked="{Boolean}true"');
      });

      test('should generate radiogroup with required', () => {
        const radiogroup = {
          type: 'radiogroup',
          name: './type',
          label: 'Type',
          required: true,
          options: [{ value: 'a', text: 'A' }],
        };

        const xml = plugin.generateRadioGroup(radiogroup);

        expect(xml).toContain('required="{Boolean}true"');
      });
    });

    describe('generatePageField', () => {
      test('should generate pagefield with default rootPath', () => {
        const pagefield = {
          type: 'pagefield',
          name: './targetPage',
          label: 'Target Page',
        };

        const xml = plugin.generatePageField(pagefield);

        expect(xml).toContain(
          'sling:resourceType="cq/gui/components/siteadmin/admin/searchpanel/searchpredicates/pathpredicate"'
        );
        expect(xml).toContain('fieldLabel="Target Page"');
        expect(xml).toContain('name="./targetPage"');
        expect(xml).toContain('rootPath="/content"');
      });

      test('should generate pagefield with custom rootPath', () => {
        const pagefield = {
          type: 'pagefield',
          name: './linkPage',
          label: 'Link to Page',
          rootPath: '/content/mysite/en',
        };

        const xml = plugin.generatePageField(pagefield);

        expect(xml).toContain('rootPath="/content/mysite/en"');
      });

      test('should generate pagefield with required', () => {
        const pagefield = {
          type: 'pagefield',
          name: './page',
          label: 'Page',
          required: true,
        };

        const xml = plugin.generatePageField(pagefield);

        expect(xml).toContain('required="{Boolean}true"');
      });
    });

    describe('generateContentFragmentPicker', () => {
      test('should generate contentfragmentpicker with default rootPath', () => {
        const cfPicker = {
          type: 'contentfragmentpicker',
          name: './fragmentPath',
          label: 'Select Content Fragment',
        };

        const xml = plugin.generateContentFragmentPicker(cfPicker);

        expect(xml).toContain(
          'sling:resourceType="dam/cfm/components/authoring/contentfragment"'
        );
        expect(xml).toContain('fieldLabel="Select Content Fragment"');
        expect(xml).toContain('name="./fragmentPath"');
        expect(xml).toContain('rootPath="/content/dam"');
      });

      test('should generate contentfragmentpicker with fragmentModel', () => {
        const cfPicker = {
          type: 'contentfragmentpicker',
          name: './article',
          label: 'Article Fragment',
          rootPath: '/content/dam/fragments',
          fragmentModel: '/conf/mysite/settings/dam/cfm/models/article',
        };

        const xml = plugin.generateContentFragmentPicker(cfPicker);

        expect(xml).toContain('rootPath="/content/dam/fragments"');
        expect(xml).toContain('fragmentPath="/conf/mysite/settings/dam/cfm/models/article"');
      });

      test('should generate contentfragmentpicker with required', () => {
        const cfPicker = {
          type: 'contentfragmentpicker',
          name: './fragment',
          label: 'Fragment',
          required: true,
        };

        const xml = plugin.generateContentFragmentPicker(cfPicker);

        expect(xml).toContain('required="{Boolean}true"');
      });
    });

    describe('generateExperienceFragmentPicker', () => {
      test('should generate experiencefragmentpicker with default rootPath', () => {
        const xfPicker = {
          type: 'experiencefragmentpicker',
          name: './xfPath',
          label: 'Select Experience Fragment',
        };

        const xml = plugin.generateExperienceFragmentPicker(xfPicker);

        expect(xml).toContain(
          'sling:resourceType="cq/experience-fragments/editor/components/experiencefragment"'
        );
        expect(xml).toContain('fieldLabel="Select Experience Fragment"');
        expect(xml).toContain('name="./xfPath"');
        expect(xml).toContain('rootPath="/content/experience-fragments"');
      });

      test('should generate experiencefragmentpicker with custom rootPath', () => {
        const xfPicker = {
          type: 'experiencefragmentpicker',
          name: './headerXF',
          label: 'Header Fragment',
          rootPath: '/content/experience-fragments/mysite/us/en',
        };

        const xml = plugin.generateExperienceFragmentPicker(xfPicker);

        expect(xml).toContain('rootPath="/content/experience-fragments/mysite/us/en"');
      });

      test('should generate experiencefragmentpicker with required', () => {
        const xfPicker = {
          type: 'experiencefragmentpicker',
          name: './xf',
          label: 'XF',
          required: true,
        };

        const xml = plugin.generateExperienceFragmentPicker(xfPicker);

        expect(xml).toContain('required="{Boolean}true"');
      });
    });

    describe('generateAssetPicker', () => {
      test('should generate assetpicker with default rootPath', () => {
        const assetPicker = {
          type: 'assetpicker',
          name: './assetPath',
          label: 'Select Asset',
        };

        const xml = plugin.generateAssetPicker(assetPicker);

        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/form/pathfield"'
        );
        expect(xml).toContain('fieldLabel="Select Asset"');
        expect(xml).toContain('name="./assetPath"');
        expect(xml).toContain('rootPath="/content/dam"');
      });

      test('should generate assetpicker with mimeTypes', () => {
        const assetPicker = {
          type: 'assetpicker',
          name: './video',
          label: 'Video Asset',
          mimeTypes: ['video/mp4', 'video/webm'],
        };

        const xml = plugin.generateAssetPicker(assetPicker);

        expect(xml).toContain('mimeTypes="[video/mp4,video/webm]"');
      });

      test('should generate assetpicker with custom rootPath and required', () => {
        const assetPicker = {
          type: 'assetpicker',
          name: './document',
          label: 'Document',
          rootPath: '/content/dam/documents',
          mimeTypes: ['application/pdf', 'application/msword'],
          required: true,
        };

        const xml = plugin.generateAssetPicker(assetPicker);

        expect(xml).toContain('rootPath="/content/dam/documents"');
        expect(xml).toContain('mimeTypes="[application/pdf,application/msword]"');
        expect(xml).toContain('required="{Boolean}true"');
      });
    });

    describe('generateRTE', () => {
      test('should generate RTE with all features', () => {
        const rte = {
          name: './text',
          label: 'Content',
          features: ['*'],
        };

        const xml = plugin.generateRTE(rte);

        expect(xml).toContain(
          'sling:resourceType="cq/gui/components/authoring/dialog/richtext"'
        );
        expect(xml).toContain('fieldLabel="Content"');
        expect(xml).toContain('<rtePlugins jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('features="bold,italic,underline"');
      });

      test('should generate RTE with specific features', () => {
        const rte = {
          name: './text',
          label: 'Content',
          features: ['bold', 'italic', 'links'],
        };

        const xml = plugin.generateRTE(rte);

        expect(xml).toContain('fieldLabel="Content"');
      });
    });

    describe('Show/Hide Functionality', () => {
      test('should generate dropdown with show/hide', () => {
        const field = {
          type: 'select',
          name: './contentType',
          label: 'Content Type',
          cqShowHide: true,
          options: [
            {
              text: 'Image',
              value: 'image',
              showhideTarget: '.image-fields',
            },
            {
              text: 'Video',
              value: 'video',
              showhideTarget: '.video-fields',
            },
          ],
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="cq-dialog-dropdown-showhide"');
        expect(xml).toContain(
          'granite:data-cq-dialog-dropdown-showhide-target=".image-fields"'
        );
        expect(xml).toContain(
          'granite:data-cq-dialog-dropdown-showhide-target=".video-fields"'
        );
      });

      test('should generate checkbox with show/hide', () => {
        const field = {
          type: 'checkbox',
          name: './enableCustom',
          label: 'Enable Custom Options',
          cqShowHide: true,
          showhideTarget: '.custom-options',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="cq-dialog-checkbox-showhide"');
        expect(xml).toContain(
          'granite:data-cq-dialog-checkbox-showhide-target=".custom-options"'
        );
      });

      test('should generate field with showhide class', () => {
        const field = {
          type: 'textfield',
          name: './customValue',
          label: 'Custom Value',
          showhideClass: 'custom-options',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="hide custom-options"');
      });

      test('should not add show/hide when cqShowHide is false', () => {
        const field = {
          type: 'select',
          name: './type',
          label: 'Type',
          cqShowHide: false,
          options: [
            { text: 'A', value: 'a', showhideTarget: '.a-fields' },
            { text: 'B', value: 'b', showhideTarget: '.b-fields' },
          ],
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('cq-dialog-dropdown-showhide');
        expect(xml).not.toContain('granite:data-cq-dialog-dropdown-showhide-target');
      });

      test('should handle dropdown without showhideTarget in options', () => {
        const field = {
          type: 'select',
          name: './type',
          label: 'Type',
          cqShowHide: true,
          options: [
            { text: 'A', value: 'a' },
            { text: 'B', value: 'b', showhideTarget: '.b-fields' },
          ],
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="cq-dialog-dropdown-showhide"');
        expect(xml).toContain(
          'granite:data-cq-dialog-dropdown-showhide-target=".b-fields"'
        );
        // Should not add target for option without it
        const lines = xml.split('\n');
        const optionALines = lines.filter((line) => line.includes('value="a"'));
        expect(
          optionALines.some((line) =>
            line.includes('granite:data-cq-dialog-dropdown-showhide-target')
          )
        ).toBe(false);
      });

      test('should combine multiple granite classes correctly', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          showhideClass: 'group-a group-b',
        };

        const xml = plugin.generateField(field);

        expect(xml).toContain('granite:class="hide group-a group-b"');
      });

      test('should not generate cqShowHide as XML attribute', () => {
        const field = {
          type: 'select',
          name: './type',
          label: 'Type',
          cqShowHide: true,
          options: [{ text: 'A', value: 'a' }],
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('cqShowHide=');
      });

      test('should not generate showhideTarget as XML attribute', () => {
        const field = {
          type: 'checkbox',
          name: './enable',
          label: 'Enable',
          cqShowHide: true,
          showhideTarget: '.fields',
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('showhideTarget=');
      });

      test('should not generate showhideClass as XML attribute', () => {
        const field = {
          type: 'textfield',
          name: './field',
          label: 'Field',
          showhideClass: 'my-class',
        };

        const xml = plugin.generateField(field);

        expect(xml).not.toContain('showhideClass=');
      });
    });

    describe('generateRTE', () => {
      test('should generate RTE with default features', () => {
        const rte = {
          name: './text',
          label: 'Content',
          features: ['*'],
        };

        const xml = plugin.generateRTE(rte);

        expect(xml).toContain(
          'sling:resourceType="cq/gui/components/authoring/dialog/richtext"'
        );
        expect(xml).toContain('<rtePlugins jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('<format');
        expect(xml).toContain('features="bold,italic,underline"');
      });

      test('should generate RTE with specific features', () => {
        const rte = {
          name: './text',
          label: 'Content',
          features: ['bold', 'italic'],
        };

        const xml = plugin.generateRTE(rte);

        expect(xml).toContain(
          'sling:resourceType="cq/gui/components/authoring/dialog/richtext"'
        );
        expect(xml).toContain('<rtePlugins jcr:primaryType="nt:unstructured">');
      });
    });

    describe('generateDialogXml', () => {
      test('should generate simple layout dialog', () => {
        const config = {
          title: 'Test Component',
          layout: 'simple',
          fields: [{ type: 'textfield', name: './title', label: 'Title' }],
        };

        const xml = plugin.generateDialogXml(config, 'test');

        expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(xml).toContain('jcr:title="Test Component"');
        expect(xml).toContain('granite:class="cmp-test__editor"');
        expect(xml).not.toContain('<tabs');
      });

      test('should generate tabs layout dialog', () => {
        const config = {
          title: 'Test Component',
          tabs: [
            {
              title: 'Content',
              fields: [{ type: 'textfield', name: './title', label: 'Title' }],
            },
            {
              title: 'Styling',
              fields: [{ type: 'colorfield', name: './color', label: 'Color' }],
            },
          ],
        };

        const xml = plugin.generateDialogXml(config, 'test');

        expect(xml).toContain('<tabs');
        expect(xml).toContain(
          'sling:resourceType="granite/ui/components/coral/foundation/tabs"'
        );
        expect(xml).toContain('jcr:title="Content"');
        expect(xml).toContain('jcr:title="Styling"');
      });
    });

    describe('generateTab', () => {
      test('should generate tab with fields', () => {
        const tab = {
          title: 'Properties',
          fields: [{ type: 'textfield', name: './title', label: 'Title' }],
        };

        const xml = plugin.generateTab(tab, 0);

        expect(xml).toContain('jcr:title="Properties"');
        expect(xml).toContain('sling:orderBefore="cq:styles"'); // First tab
        expect(xml).toContain('fieldLabel="Title"');
      });

      test('should generate tab with items', () => {
        const tab = {
          title: 'Properties',
          items: [{ type: 'textfield', name: './title', label: 'Title' }],
        };

        const xml = plugin.generateTab(tab, 0);

        expect(xml).toContain('jcr:title="Properties"');
        expect(xml).toContain('sling:orderBefore="cq:styles"'); // First tab
        expect(xml).toContain('fieldLabel="Title"');
      });

      test('should not add orderBefore for non-first tabs', () => {
        const tab = {
          title: 'Styling',
          fields: [],
        };

        const xml = plugin.generateTab(tab, 1);

        expect(xml).not.toContain('sling:orderBefore');
      });

      test('should generate conditional tab with showIf', () => {
        const tab = {
          title: 'Advanced Settings',
          showIf: {
            field: './enableAdvanced',
            value: true,
          },
          fields: [
            { type: 'textfield', name: './customClass', label: 'Custom Class' },
          ],
        };

        const xml = plugin.generateTab(tab, 1);

        expect(xml).toContain('granite:hide="${!./enableAdvanced || ./enableAdvanced != \'true\'}"');
        expect(xml).toContain('jcr:title="Advanced Settings"');
      });

      test('should generate conditional tab with string value', () => {
        const tab = {
          title: 'Video Options',
          showIf: {
            field: './contentType',
            value: 'video',
          },
          fields: [{ type: 'textfield', name: './videoUrl', label: 'Video URL' }],
        };

        const xml = plugin.generateTab(tab, 0);

        expect(xml).toContain('granite:hide="${!./contentType || ./contentType != \'video\'}"');
      });
    });
  });

  describe('File Operations', () => {
    beforeEach(() => {
      plugin = new AemDialogGeneratorPlugin(mockOptions);
    });

    describe('generateDialogs', () => {
      test('should throw error if source directory does not exist', () => {
        fs.existsSync.mockReturnValue(false);

        expect(() => plugin.generateDialogs()).toThrow(
          'Source folder does not exist'
        );
      });

      test('should process components with dialog.json', () => {
        // Mock file system
        fs.existsSync.mockImplementation((path) => {
          if (path === mockOptions.sourceDir) return true;
          if (path.includes('dialog.json')) return true;
          return false;
        });

        fs.readdirSync.mockReturnValue(['button', 'hero']);
        fs.statSync.mockReturnValue({ isDirectory: () => true });
        fs.readFileSync.mockReturnValue(
          JSON.stringify({
            title: 'Test Component',
            layout: 'simple',
            fields: [{ type: 'textfield', name: './title', label: 'Title' }],
          })
        );
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        plugin.generateDialogs();

        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      test('should create folder structure when useFolderStructure is true', () => {
        plugin = new AemDialogGeneratorPlugin({
          ...mockOptions,
          useFolderStructure: true,
        });

        fs.existsSync.mockImplementation((path) => {
          if (path === mockOptions.sourceDir) return true;
          if (path.includes('dialog.json')) return true;
          return false;
        });

        fs.readdirSync.mockReturnValue(['button']);
        fs.statSync.mockReturnValue({ isDirectory: () => true });
        fs.readFileSync.mockReturnValue(
          JSON.stringify({
            title: 'Button',
            layout: 'simple',
            fields: [],
          })
        );
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        plugin.generateDialogs();

        const mkdirCalls = fs.mkdirSync.mock.calls;
        expect(mkdirCalls.some((call) => call[0].includes('_cq_dialog'))).toBe(
          true
        );
      });

      test('should create single file when useFolderStructure is false', () => {
        plugin = new AemDialogGeneratorPlugin({
          ...mockOptions,
          useFolderStructure: false,
        });

        fs.existsSync.mockImplementation((path) => {
          if (path === mockOptions.sourceDir) return true;
          if (path.includes('dialog.json')) return true;
          return false;
        });

        fs.readdirSync.mockReturnValue(['button']);
        fs.statSync.mockReturnValue({ isDirectory: () => true });
        fs.readFileSync.mockReturnValue(
          JSON.stringify({
            title: 'Button',
            layout: 'simple',
            fields: [],
          })
        );
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        plugin.generateDialogs();

        const writeCalls = fs.writeFileSync.mock.calls;
        expect(
          writeCalls.some((call) => call[0].endsWith('_cq_dialog.xml'))
        ).toBe(true);
      });
    });
  });

  describe('Webpack Integration', () => {
    test('should register with webpack compiler', () => {
      plugin = new AemDialogGeneratorPlugin(mockOptions);

      const mockCompiler = {
        hooks: {
          emit: {
            tapAsync: jest.fn(),
          },
          afterCompile: {
            tap: jest.fn(),
          },
        },
      };

      plugin.apply(mockCompiler);

      expect(mockCompiler.hooks.emit.tapAsync).toHaveBeenCalledWith(
        'AemDialogGeneratorPlugin',
        expect.any(Function)
      );
      expect(mockCompiler.hooks.afterCompile.tap).toHaveBeenCalledWith(
        'AemDialogGeneratorPlugin',
        expect.any(Function)
      );
    });

    test('should handle errors during generation', () => {
      plugin = new AemDialogGeneratorPlugin(mockOptions);

      const mockCompiler = {
        hooks: {
          emit: {
            tapAsync: jest.fn((name, callback) => {
              // Simulate the callback being called
              const mockCompilation = { errors: [] };
              const done = jest.fn();
              callback(mockCompilation, done);
            }),
          },
          afterCompile: {
            tap: jest.fn(),
          },
        },
      };

      // Mock generateDialogs to throw error
      fs.existsSync.mockReturnValue(false);

      plugin.apply(mockCompiler);

      // The error should be caught and added to compilation.errors
    });
  });

  describe('Logging', () => {
    test('should log when verbose is true', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      plugin = new AemDialogGeneratorPlugin({ ...mockOptions, verbose: true });

      plugin.log('Test message');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AemDialogGeneratorPlugin] Test message'
      );

      consoleSpy.mockRestore();
    });

    test('should not log when verbose is false', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      plugin = new AemDialogGeneratorPlugin({ ...mockOptions, verbose: false });

      plugin.log('Test message');

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Container Fields', () => {
    beforeEach(() => {
      plugin = new AemDialogGeneratorPlugin(mockOptions);
    });

    test('should generate container with nested fields', () => {
      const field = {
        type: 'container',
        name: 'advancedSettings',
        fields: [
          { type: 'textfield', name: './setting1', label: 'Setting 1' },
          { type: 'textfield', name: './setting2', label: 'Setting 2' },
        ],
      };

      const xml = plugin.generateFieldsetOrContainer(field, 'container');

      expect(xml).toContain('<advancedSettings');
      expect(xml).not.toContain('jcr:title');
      expect(xml).toContain(
        'sling:resourceType="granite/ui/components/coral/foundation/container"'
      );
      expect(xml).toContain('<items jcr:primaryType="nt:unstructured">');
      expect(xml).toContain('</items>');
    });

    test('should generate container with showhideClass', () => {
      const field = {
        type: 'container',
        name: 'advancedOptions',
        showhideClass: 'advanced-opts',
        fields: [
          { type: 'textfield', name: './option1', label: 'Option 1' },
        ],
      };

      const xml = plugin.generateFieldsetOrContainer(field, 'container');

      expect(xml).toContain('granite:class="hide advanced-opts"');
      expect(xml).not.toContain('jcr:title');
    });

    test('should generate container in multifield', () => {
      const field = {
        type: 'container',
        name: 'settings',
        fields: [
          { type: 'textfield', name: './value', label: 'Value' },
        ],
      };

      const xml = plugin.generateMultifieldFieldsetOrContainer(field, 'container');

      expect(xml).toContain('<settings');
      expect(xml).not.toContain('jcr:title');
      expect(xml).toContain(
        'sling:resourceType="granite/ui/components/coral/foundation/container"'
      );
    });
  });
});
