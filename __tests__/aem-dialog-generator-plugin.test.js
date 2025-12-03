const AemDialogGeneratorPlugin = require('../aem-dialog-generator-plugin');
const path = require('path');
const fs = require('fs');

// Mock fs module
jest.mock('fs');

describe('AemDialogGeneratorPlugin', () => {
  let plugin;
  let mockOptions;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Default options
    mockOptions = {
      sourceDir: '/test/source',
      targetDir: '/test/target',
      appName: 'testapp',
      verbose: false
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
        MI: 14
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
        useFolderStructure: false 
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
        expect(plugin.sanitizeNodeName('./my-field:name')).toBe('my-field_name');
        expect(plugin.sanitizeNodeName('./field@name')).toBe('field_name');
      });

      test('should handle already clean names', () => {
        expect(plugin.sanitizeNodeName('cleanName')).toBe('cleanName');
      });
    });

    describe('escapeXml', () => {
      test('should escape XML special characters', () => {
        expect(plugin.escapeXml('Test & Co')).toBe('Test &amp; Co');
        expect(plugin.escapeXml('<div>Test</div>')).toBe('&lt;div&gt;Test&lt;/div&gt;');
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
        expect(plugin.generateAttributeValue('required', true)).toBe('required="{Boolean}true"');
        expect(plugin.generateAttributeValue('enabled', false)).toBe('enabled="{Boolean}false"');
      });

      test('should format number values', () => {
        expect(plugin.generateAttributeValue('count', 42)).toBe('count="{Long}42"');
      });

      test('should format array values', () => {
        expect(plugin.generateAttributeValue('items', ['a', 'b', 'c'])).toBe('items="[a,b,c]"');
      });

      test('should format string values', () => {
        expect(plugin.generateAttributeValue('name', 'test')).toBe('name="test"');
      });

      test('should escape XML in string values', () => {
        expect(plugin.generateAttributeValue('label', 'Test & Co')).toBe('label="Test &amp; Co"');
      });
    });

    describe('getResourceType', () => {
      test('should return correct resource types', () => {
        expect(plugin.getResourceType('textfield')).toBe('granite/ui/components/coral/foundation/form/textfield');
        expect(plugin.getResourceType('textarea')).toBe('granite/ui/components/coral/foundation/form/textarea');
        expect(plugin.getResourceType('select')).toBe('granite/ui/components/coral/foundation/form/select');
        expect(plugin.getResourceType('multifield')).toBe('granite/ui/components/coral/foundation/form/multifield');
        expect(plugin.getResourceType('rte')).toBe('cq/gui/components/authoring/dialog/richtext');
      });

      test('should fallback to textfield for unknown types', () => {
        expect(plugin.getResourceType('unknown')).toBe('granite/ui/components/coral/foundation/form/textfield');
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
          required: true
        };
        
        const xml = plugin.generateField(field);
        
        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/form/textfield"');
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
            { value: 'type2', text: 'Type 2' }
          ]
        };
        
        const xml = plugin.generateField(field);
        
        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/form/select"');
        expect(xml).toContain('<items jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('value="type1"');
        expect(xml).toContain('text="Type 1"');
      });

      test('should delegate to generateMultifield for multifield type', () => {
        const field = { type: 'multifield', name: './items', label: 'Items', fields: [] };
        const spy = jest.spyOn(plugin, 'generateMultifield');
        
        plugin.generateField(field);
        
        expect(spy).toHaveBeenCalledWith(field);
      });

      test('should delegate to generateFieldset for fieldset type', () => {
        const field = { type: 'fieldset', label: 'Group', fields: [] };
        const spy = jest.spyOn(plugin, 'generateFieldset');
        
        plugin.generateField(field);
        
        expect(spy).toHaveBeenCalledWith(field);
      });

      test('should delegate to generateRTE for rte type', () => {
        const field = { type: 'rte', name: './text', label: 'Text' };
        const spy = jest.spyOn(plugin, 'generateRTE');
        
        plugin.generateField(field);
        
        expect(spy).toHaveBeenCalledWith(field);
      });
    });

    describe('generateFieldset', () => {
      test('should generate fieldset with nested fields', () => {
        const fieldset = {
          label: 'SEO Settings',
          fields: [
            { type: 'textfield', name: './metaTitle', label: 'Meta Title' },
            { type: 'textarea', name: './metaDescription', label: 'Meta Description' }
          ]
        };
        
        const xml = plugin.generateFieldset(fieldset);
        
        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/form/fieldset"');
        expect(xml).toContain('jcr:title="SEO Settings"');
        expect(xml).toContain('<items jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('fieldLabel="Meta Title"');
        expect(xml).toContain('fieldLabel="Meta Description"');
      });
    });

    describe('generateMultifield', () => {
      test('should generate simple multifield', () => {
        const multifield = {
          name: './tags',
          label: 'Tags',
          fields: [
            { type: 'textfield', name: './tag', label: 'Tag' }
          ]
        };
        
        const xml = plugin.generateMultifield(multifield);
        
        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/form/multifield"');
        expect(xml).toContain('fieldLabel="Tags"');
        expect(xml).not.toContain('composite="{Boolean}true"');
      });

      test('should generate composite multifield', () => {
        const multifield = {
          name: './slides',
          label: 'Slides',
          composite: true,
          fields: [
            { type: 'textfield', name: './title', label: 'Title' },
            { type: 'textarea', name: './description', label: 'Description' }
          ]
        };
        
        const xml = plugin.generateMultifield(multifield);
        
        expect(xml).toContain('composite="{Boolean}true"');
        expect(xml).toContain('sling:resourceType="granite/ui/components/coral/foundation/container"');
      });
    });

    describe('generateRTE', () => {
      test('should generate RTE with default features', () => {
        const rte = {
          name: './text',
          label: 'Content',
          features: ['*']
        };
        
        const xml = plugin.generateRTE(rte);
        
        expect(xml).toContain('sling:resourceType="cq/gui/components/authoring/dialog/richtext"');
        expect(xml).toContain('<rtePlugins jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('<format');
        expect(xml).toContain('features="bold,italic,underline"');
      });

      test('should generate RTE with specific features', () => {
        const rte = {
          name: './text',
          label: 'Content',
          features: ['bold', 'italic']
        };
        
        const xml = plugin.generateRTE(rte);
        
        expect(xml).toContain('sling:resourceType="cq/gui/components/authoring/dialog/richtext"');
        expect(xml).toContain('<rtePlugins jcr:primaryType="nt:unstructured">');
      });
    });

    describe('generateDialogXml', () => {
      test('should generate simple layout dialog', () => {
        const config = {
          title: 'Test Component',
          layout: 'simple',
          fields: [
            { type: 'textfield', name: './title', label: 'Title' }
          ]
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
              fields: [
                { type: 'textfield', name: './title', label: 'Title' }
              ]
            },
            {
              title: 'Styling',
              fields: [
                { type: 'colorfield', name: './color', label: 'Color' }
              ]
            }
          ]
        };
        
        const xml = plugin.generateDialogXml(config, 'test');
        
        expect(xml).toContain('<tabs jcr:primaryType="nt:unstructured">');
        expect(xml).toContain('jcr:title="Content"');
        expect(xml).toContain('jcr:title="Styling"');
      });
    });

    describe('generateTab', () => {
      test('should generate tab with fields', () => {
        const tab = {
          title: 'Properties',
          fields: [
            { type: 'textfield', name: './title', label: 'Title' }
          ]
        };
        
        const xml = plugin.generateTab(tab, 0);
        
        expect(xml).toContain('jcr:title="Properties"');
        expect(xml).toContain('sling:orderBefore="cq:styles"'); // First tab
        expect(xml).toContain('fieldLabel="Title"');
      });

      test('should not add orderBefore for non-first tabs', () => {
        const tab = {
          title: 'Styling',
          fields: []
        };
        
        const xml = plugin.generateTab(tab, 1);
        
        expect(xml).not.toContain('sling:orderBefore');
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
        
        expect(() => plugin.generateDialogs()).toThrow('Source folder does not exist');
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
        fs.readFileSync.mockReturnValue(JSON.stringify({
          title: 'Test Component',
          layout: 'simple',
          fields: [{ type: 'textfield', name: './title', label: 'Title' }]
        }));
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});
        
        plugin.generateDialogs();
        
        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      test('should create folder structure when useFolderStructure is true', () => {
        plugin = new AemDialogGeneratorPlugin({ 
          ...mockOptions, 
          useFolderStructure: true 
        });
        
        fs.existsSync.mockImplementation((path) => {
          if (path === mockOptions.sourceDir) return true;
          if (path.includes('dialog.json')) return true;
          return false;
        });
        
        fs.readdirSync.mockReturnValue(['button']);
        fs.statSync.mockReturnValue({ isDirectory: () => true });
        fs.readFileSync.mockReturnValue(JSON.stringify({
          title: 'Button',
          layout: 'simple',
          fields: []
        }));
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});
        
        plugin.generateDialogs();
        
        const mkdirCalls = fs.mkdirSync.mock.calls;
        expect(mkdirCalls.some(call => call[0].includes('_cq_dialog'))).toBe(true);
      });

      test('should create single file when useFolderStructure is false', () => {
        plugin = new AemDialogGeneratorPlugin({ 
          ...mockOptions, 
          useFolderStructure: false 
        });
        
        fs.existsSync.mockImplementation((path) => {
          if (path === mockOptions.sourceDir) return true;
          if (path.includes('dialog.json')) return true;
          return false;
        });
        
        fs.readdirSync.mockReturnValue(['button']);
        fs.statSync.mockReturnValue({ isDirectory: () => true });
        fs.readFileSync.mockReturnValue(JSON.stringify({
          title: 'Button',
          layout: 'simple',
          fields: []
        }));
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});
        
        plugin.generateDialogs();
        
        const writeCalls = fs.writeFileSync.mock.calls;
        expect(writeCalls.some(call => call[0].endsWith('_cq_dialog.xml'))).toBe(true);
      });
    });
  });

  describe('Webpack Integration', () => {
    test('should register with webpack compiler', () => {
      plugin = new AemDialogGeneratorPlugin(mockOptions);
      
      const mockCompiler = {
        hooks: {
          emit: {
            tapAsync: jest.fn()
          }
        }
      };
      
      plugin.apply(mockCompiler);
      
      expect(mockCompiler.hooks.emit.tapAsync).toHaveBeenCalledWith(
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
            })
          }
        }
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
      
      expect(consoleSpy).toHaveBeenCalledWith('[AemDialogGeneratorPlugin] Test message');
      
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
});
