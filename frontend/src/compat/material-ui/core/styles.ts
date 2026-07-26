import type { Theme } from '@mui/material/styles';

declare module '@mui/styles/defaultTheme' {
  interface DefaultTheme extends Theme {}
}

export { createStyles, makeStyles } from '@mui/styles';
