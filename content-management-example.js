/**
 * ResyncBase Content Management Example
 * Demonstrates how to use the new section-based content management system
 */

import { ResyncBase } from './index.js';

// Initialize ResyncBase
ResyncBase.init({
  key: 'your-api-key',
  appId: 'your-app-id',
  callback: (config) => {
    console.log('ResyncBase initialized with config:', config);
  }
});

// Example 1: Fetch a single content view
async function fetchSingleContentView() {
  try {
    const contentView = await ResyncBase.fetchContentView('cv-123');
    console.log('Content View:', contentView);
    
    // Access sections
    contentView.sections.forEach(section => {
      console.log(`Section: ${section.name}`);
      console.log(`Layout: ${section.containerStyles.layout}`);
      console.log(`Elements: ${section.elements.length}`);
    });
  } catch (error) {
    console.error('Error fetching content view:', error);
  }
}

// Example 2: Fetch all content views for an app
async function fetchAllContentViews() {
  try {
    const contentViews = await ResyncBase.fetchContentViews('app-123');
    console.log('All Content Views:', contentViews);
    
    contentViews.forEach(cv => {
      console.log(`\nContent View: ${cv.name}`);
      cv.sections.forEach(section => {
        const stats = ResyncBase.getSectionStats(section);
        console.log(`  Section: ${section.name} (${stats.elementCount} elements, ${stats.visibleElements} visible)`);
      });
    });
  } catch (error) {
    console.error('Error fetching content views:', error);
  }
}

// Example 3: Create a new section programmatically
function createNewSection() {
  const newSection = ResyncBase.createSection('Custom Section', 1);
  console.log('New Section:', newSection);
  
  // Modify container styles
  newSection.containerStyles.layout = 'row';
  newSection.containerStyles.alignment = 'space-between';
  newSection.containerStyles.backgroundColor = '#f0f0f0';
  
  console.log('Modified Section:', newSection);
}

// Example 4: Get default container styles
function getDefaultStyles() {
  const defaultStyles = ResyncBase.getDefaultContainerStyles();
  console.log('Default Container Styles:', defaultStyles);
  
  // Available properties:
  // - layout: 'row' | 'column' | 'grid'
  // - alignment: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
  // - gap: number (in pixels)
  // - padding: number (in pixels)
  // - borderRadius: number (in pixels)
  // - backgroundColor: string (hex color)
  // - flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse'
  // - maxWidth: number (in pixels, optional)
}

// Example 5: Analyze section structure
function analyzeSectionStructure(contentView) {
  contentView.sections.forEach((section, index) => {
    const stats = ResyncBase.getSectionStats(section);
    
    console.log(`\nSection ${index + 1}: ${section.name}`);
    console.log(`  Valid: ${stats.valid}`);
    console.log(`  Element Count: ${stats.elementCount}`);
    console.log(`  Visible Elements: ${stats.visibleElements}`);
    console.log(`  Layout: ${stats.layout}`);
    console.log(`  Has Container Styles: ${stats.hasContainerStyles}`);
    
    if (stats.valid) {
      section.elements.forEach((element, elemIndex) => {
        console.log(`    Element ${elemIndex + 1}: ${element.name} (${element.type})`);
        console.log(`      Visible: ${element.isVisible}`);
        console.log(`      Order: ${element.order}`);
      });
    }
  });
}

// Example 6: React Native usage with sections
function reactNativeExample() {
  // In a React Native component:
  /*
  import React, { useState, useEffect } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { ResyncBase } from 'resyncbase-js';
  
  const ContentViewComponent = ({ contentViewId }) => {
    const [contentView, setContentView] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      fetchContent();
    }, [contentViewId]);
    
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await ResyncBase.fetchContentView(contentViewId);
        setContentView(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (loading) {
      return <Text>Loading...</Text>;
    }
    
    if (!contentView || !contentView.sections) {
      return <Text>No content available</Text>;
    }
    
    return (
      <View style={styles.container}>
        {contentView.sections.map(section => (
          <View
            key={section.id}
            style={[
              styles.section,
              {
                flexDirection: section.containerStyles.layout === 'column' ? 'column' : 'row',
                justifyContent: section.containerStyles.alignment,
                gap: section.containerStyles.gap,
                padding: section.containerStyles.padding,
                backgroundColor: section.containerStyles.backgroundColor,
                borderRadius: section.containerStyles.borderRadius,
                flexWrap: section.containerStyles.flexWrap,
                maxWidth: section.containerStyles.maxWidth,
              }
            ]}
          >
            {section.elements.map(element => (
              <View key={element.id} style={styles.element}>
                {element.type === 'text' && (
                  <Text style={styles.text}>{element.properties?.textContent || 'Text'}</Text>
                )}
                {element.type === 'button' && (
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>{element.properties?.buttonText || 'Button'}</Text>
                  </TouchableOpacity>
                )}
                {element.type === 'icon' && (
                  <Text style={styles.icon}>{element.properties?.iconName || '★'}</Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    section: {
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    element: {
      margin: 4,
    },
    text: {
      fontSize: 16,
      color: '#000000',
    },
    button: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    icon: {
      fontSize: 24,
      textAlign: 'center',
    },
  });
  
  export default ContentViewComponent;
  */
}

// Run examples
console.log('=== ResyncBase Content Management Examples ===\n');

// Wait for initialization
setTimeout(() => {
  if (ResyncBase.ready) {
    console.log('✅ ResyncBase is ready!\n');
    
    // Run examples
    getDefaultStyles();
    createNewSection();
    
    // Note: These require actual API endpoints and data
    // fetchSingleContentView();
    // fetchAllContentViews();
    
  } else {
    console.log('⏳ Waiting for ResyncBase to initialize...');
  }
}, 1000);

export {
  fetchSingleContentView,
  fetchAllContentViews,
  createNewSection,
  getDefaultStyles,
  analyzeSectionStructure,
  reactNativeExample
};

// Example 7: Content versioning
async function contentVersioningExamples() {
  try {
    const contentViewId = 'cv-123';
    
    // Get version history
    const versions = await ResyncBase.getVersionHistory(contentViewId);
    console.log('Version History:', versions);
    
    // Get a specific version
    const version2 = await ResyncBase.getVersionByNumber(contentViewId, 2);
    console.log('Version 2:', version2);
    
    // Compare two versions
    const comparison = await ResyncBase.compareVersions(contentViewId, 1, 2);
    console.log('Version Comparison:', comparison);
    
    // Get version statistics
    const stats = await ResyncBase.getVersionStats(contentViewId);
    console.log('Version Stats:', stats);
    
    // Access version data
    versions.forEach(version => {
      console.log(`\nVersion ${version.version}:`);
      console.log(`  Note: ${version.note || 'No note'}`);
      console.log(`  Created: ${version.createdAt}`);
      console.log(`  Sections: ${version.snapshot.sections.length}`);
      
      version.snapshot.sections.forEach(section => {
        console.log(`    Section: ${section.name}`);
        console.log(`      Layout: ${section.containerStyles.layout}`);
        console.log(`      Elements: ${section.elements.length}`);
      });
    });
    
  } catch (error) {
    console.error('Error with versioning examples:', error);
  }
}

// Example 8: Version rollback simulation
function versionRollbackExample() {
  // This would typically be done through the admin interface
  // but here's how you might handle it in the client:
  
  /*
  // Get current content view
  const currentContentView = await ResyncBase.fetchContentView('cv-123');
  
  // Get a previous version
  const previousVersion = await ResyncBase.getVersionHistory('cv-123', 2);
  
  // Compare to see what changed
  const comparison = await ResyncBase.compareVersions('cv-123', 1, 2);
  
  if (comparison.differences.sections.count > 0) {
    console.log('Major structural changes detected!');
    console.log('Sections added:', comparison.differences.sections.changes.added.length);
    console.log('Sections removed:', comparison.differences.sections.changes.removed.length);
    console.log('Sections modified:', comparison.differences.sections.changes.modified.length);
  }
  
  // You could then show a UI to let users preview the old version
  // and decide if they want to rollback
  */
}
