# ResyncBase Icon System Guide

## Overview

The ResyncBase icon system supports two types of icons:

1. **Icon Library Icons**: Pre-built icons from popular icon libraries
2. **Custom SVG Icons**: User-uploaded or custom SVG files

## Icon Library Icons

### Supported Libraries

- **MaterialIcons**: Google's Material Design icons
- **FontAwesome**: Font Awesome icon set
- **Ionicons**: Ionic framework icons
- **Feather**: Simple, elegant icons
- **AntDesign**: Ant Design icon set
- **Entypo**: Carefully crafted icon set
- **EvilIcons**: Evil Icons set
- **Fontisto**: Fontisto icon set
- **Foundation**: Foundation framework icons
- **MaterialCommunityIcons**: Material Design Community icons
- **Octicons**: GitHub's icon set
- **SimpleLineIcons**: Simple line icons
- **Zocial**: Social media icons

### Configuration

```json
{
  "type": "icon",
  "properties": {
    "iconLibrary": "MaterialIcons",
    "iconName": "home",
    "iconSize": 24,
    "iconColor": "#007AFF"
  }
}
```

### Properties

- **iconLibrary**: The icon library to use
- **iconName**: The specific icon name from the library
- **iconSize**: Icon size in pixels (default: 24)
- **iconColor**: Icon color (default: inherits from element styles)

## Custom SVG Icons

### Upload Methods

1. **File Upload**: Upload an SVG file directly
2. **Paste SVG Code**: Copy and paste SVG markup

### Configuration

```json
{
  "type": "icon",
  "properties": {
    "customSvg": "<svg>...</svg>",
    "iconSize": 32
  }
}
```

### SVG Requirements

- Must be valid SVG markup
- Should be optimized for web use
- Recommended to include `viewBox` attribute
- Keep file size reasonable (< 50KB)

### Example SVG

```svg
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
</svg>
```

## Dashboard Usage

### Creating Icon Elements

1. **Add Icon Element**: Click the icon button in the element toolbar
2. **Choose Icon Type**: Select between "Icon Library" or "Custom SVG"
3. **Configure Properties**:
   - For library icons: Select library, name, size, and color
   - For custom SVG: Upload file or paste SVG code
4. **Style Element**: Apply additional styling (background, borders, etc.)

### Icon Library Selection

1. Select "Icon Library" as icon type
2. Choose from the dropdown of supported libraries
3. Enter the icon name (e.g., "home", "user", "settings")
4. Set icon size and color
5. Preview the icon in real-time

### Custom SVG Upload

1. Select "Custom SVG" as icon type
2. Either:
   - Click "Upload SVG File" and select an SVG file
   - Paste SVG code directly into the text area
3. Set icon size
4. Preview the SVG in real-time

## React Native Integration

### Basic Usage

```jsx
import ResyncBaseContentView from 'resyncbase-react-native-sdk';

const App = () => (
  <ResyncBaseContentView
    contentViewId="your-content-view-id"
    sdkConfig={{ baseUrl: 'https://api.resyncbase.com' }}
    onElementPress={(element, type, action) => {
      if (type === 'icon') {
        console.log('Icon pressed:', element.properties);
      }
    }}
  />
);
```

### Icon-Specific Handling

```jsx
const handleIconPress = (element) => {
  const properties = element.properties || {};
  
  if (properties.customSvg) {
    // Handle custom SVG icon
    console.log('Custom SVG icon:', properties.customSvg);
  } else {
    // Handle library icon
    console.log('Library icon:', {
      library: properties.iconLibrary,
      name: properties.iconName,
      size: properties.iconSize,
      color: properties.iconColor
    });
  }
};
```

### Custom Styling

```jsx
const renderOptions = {
  icon: {
    margin: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
};
```

## Advanced Features

### Icon Size Inheritance

Icons can inherit size from element styles:

```json
{
  "type": "icon",
  "styles": {
    "fontSize": 32
  },
  "properties": {
    "iconLibrary": "MaterialIcons",
    "iconName": "star"
  }
}
```

### Color Override

Icon color can override element color:

```json
{
  "type": "icon",
  "styles": {
    "color": "#000000"
  },
  "properties": {
    "iconLibrary": "MaterialIcons",
    "iconName": "heart",
    "iconColor": "#FF0000"  // This overrides the element color
  }
}
```

### Responsive Icons

Icons automatically scale with their container:

```json
{
  "type": "icon",
  "styles": {
    "width": "100%",
    "height": "auto"
  },
  "properties": {
    "iconLibrary": "MaterialIcons",
    "iconName": "expand",
    "iconSize": 48
  }
}
```

## Best Practices

### Icon Library Icons

1. **Use Standard Names**: Stick to common icon names for better compatibility
2. **Consistent Sizing**: Use consistent icon sizes across your app
3. **Color Harmony**: Ensure icon colors work with your app's color scheme
4. **Library Consistency**: Use the same icon library for related icons

### Custom SVG Icons

1. **Optimize SVGs**: Remove unnecessary attributes and metadata
2. **Responsive Design**: Use `viewBox` for proper scaling
3. **Accessibility**: Include meaningful `aria-label` attributes
4. **File Size**: Keep SVG files under 50KB for performance

### Performance

1. **Cache Icons**: Icons are automatically cached by the SDK
2. **Lazy Loading**: Icons load only when needed
3. **Optimized Rendering**: Efficient rendering for both types
4. **Memory Management**: Proper cleanup of icon resources

## Troubleshooting

### Common Issues

1. **Icon Not Displaying**:
   - Check icon library and name spelling
   - Verify SVG markup is valid
   - Ensure icon size is reasonable

2. **Wrong Icon**:
   - Verify icon name exists in selected library
   - Check for typos in icon names
   - Confirm library selection

3. **SVG Not Rendering**:
   - Validate SVG markup
   - Check for unsupported SVG features
   - Ensure SVG is properly formatted

4. **Performance Issues**:
   - Optimize SVG files
   - Use appropriate icon sizes
   - Consider using library icons for common elements

### Debug Mode

Enable debug logging to troubleshoot icon issues:

```jsx
const sdkConfig = {
  baseUrl: 'https://api.resyncbase.com',
  debug: true
};
```

## Future Enhancements

### Planned Features

- **Icon Search**: Search through icon libraries
- **Icon Categories**: Organized icon collections
- **Icon Favorites**: Save frequently used icons
- **Icon History**: Track recently used icons
- **Icon Validation**: Automatic SVG validation
- **Icon Optimization**: Automatic SVG optimization

### Integration Possibilities

- **Design Tools**: Figma, Sketch integration
- **Icon Marketplaces**: Integration with icon stores
- **Custom Icon Sets**: User-created icon collections
- **Icon Analytics**: Track icon usage and performance

## Examples

### Complete Icon Element

```json
{
  "id": "icon-1",
  "type": "icon",
  "name": "Home Icon",
  "styles": {
    "margin": 8,
    "padding": 12,
    "backgroundColor": "#f8f9fa",
    "borderRadius": 8
  },
  "properties": {
    "iconLibrary": "MaterialIcons",
    "iconName": "home",
    "iconSize": 24,
    "iconColor": "#007AFF"
  },
  "order": 1,
  "isVisible": true
}
```

### Custom SVG Element

```json
{
  "id": "icon-2",
  "type": "icon",
  "name": "Custom Logo",
  "styles": {
    "margin": 16,
    "padding": 8
  },
  "properties": {
    "customSvg": "<svg viewBox=\"0 0 100 100\">...</svg>",
    "iconSize": 48
  },
  "order": 2,
  "isVisible": true
}
```

This comprehensive icon system provides flexibility for both designers and developers, allowing for consistent icon usage across your React Native applications while supporting custom branding and design requirements.

