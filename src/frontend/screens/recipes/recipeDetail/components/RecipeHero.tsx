import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

interface RecipeHeroProps {
  imageUrl: string;
}

export function RecipeHero({ imageUrl }: RecipeHeroProps) {
  return (
    <View style={styles.imageContainer}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      <View style={styles.imageOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: IMG_HEIGHT,
    width: width,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
