import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3D405B',
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 72,
  },
});
