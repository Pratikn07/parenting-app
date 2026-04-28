import { StyleSheet } from 'react-native';
import { THEME } from '@/src/lib/constants';

export const markdownStyles = StyleSheet.create({
  body: {
    color: '#3D405B',
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 2,
  },
  strong: {
    fontWeight: '700',
    color: '#3D405B',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: THEME.colors.primary,
    textDecorationLine: 'underline',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
  },
  list_item: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet_list: {
    marginBottom: 10,
    paddingLeft: 8,
  },
  ordered_list: {
    marginBottom: 10,
    paddingLeft: 8,
  },
  bullet_list_icon: {
    marginRight: 6,
    fontSize: 18,
    lineHeight: 22,
    color: THEME.colors.primary,
  },
  ordered_list_icon: {
    marginRight: 6,
    fontSize: 16,
    lineHeight: 22,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
});
