import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

/**
 * ResyncBase Icon Component
 * Renders icons from icon libraries or custom SVG
 */
const ResyncBaseIcon = ({
  element,
  onPress,
  style,
  renderOptions = {},
}) => {
  const properties = element.properties || {};
  const styles = element.styles || {};
  
  // Determine icon size
  const iconSize = properties.iconSize || styles.fontSize || 24;
  const containerSize = iconSize + 16;
  
  // Determine icon color
  const iconColor = properties.iconColor || styles.color || '#000000';
  const backgroundColor = styles.backgroundColor || 'transparent';
  
  // Custom styling from render options
  const customStyles = renderOptions.icon || {};
  
  if (properties.customSvg) {
    // For custom SVG, we'll render a placeholder
    // In a real implementation, you'd use react-native-svg
    return (
      <TouchableOpacity
        style={[
          baseIconStyles.container,
          {
            width: containerSize,
            height: containerSize,
            backgroundColor,
          },
          customStyles,
          style,
        ]}
        onPress={() => onPress && onPress(element, 'icon')}
        activeOpacity={0.7}
      >
        <View
          style={[
            baseIconStyles.svgContainer,
            {
              width: iconSize,
              height: iconSize,
            },
          ]}
        >
          <Text style={[baseIconStyles.svgText, { color: iconColor }]}>
            SVG
          </Text>
        </View>
      </TouchableOpacity>
    );
  } else {
    // Render icon library icon
    const iconText = properties.iconName ? properties.iconName.charAt(0).toUpperCase() : 'I';
    
    return (
      <TouchableOpacity
        style={[
          baseIconStyles.container,
          {
            width: containerSize,
            height: containerSize,
            backgroundColor,
          },
          customStyles,
          style,
        ]}
        onPress={() => onPress && onPress(element, 'icon')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            baseIconStyles.iconText,
            {
              fontSize: iconSize,
              color: iconColor,
            },
          ]}
        >
          {iconText}
        </Text>
      </TouchableOpacity>
    );
  }
};

const baseIconStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  svgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  svgText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ResyncBaseIcon;

