import { colors } from './colors'
import { spacing } from './spacing'

const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
}

const typography = {
  fontFamily: 'System',
  headings: {
    h1: 28,
    h2: 24,
    h3: 20,
  },
  body: {
    lg: 18,
    md: 16,
    sm: 14,
  },
  caption: 12,
}

export const theme = {
  colors,
  spacing,
  radii,
  typography,
}

export type Theme = typeof theme
