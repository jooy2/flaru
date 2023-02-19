/** @jsxImportSource @emotion/react */
import { useEffect, useMemo } from 'react';
import darkScrollbar from '@mui/material/darkScrollbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import MuiThemeProvider from '@mui/material/styles/ThemeProvider';
import createTheme from '@mui/material/styles/createTheme';
import { ThemeProvider } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';

const ThemeContainer = ({ children }) => {
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const darkMode = useMemo((): boolean => {
    if (stateAppScreen.appConfigTheme === 'auto') {
      return prefersDarkMode;
    }
    return stateAppScreen.isDarkTheme;
  }, [stateAppScreen.appConfigTheme, stateAppScreen.isDarkTheme, prefersDarkMode]);
  const muiTheme = useMemo(
    () =>
      createTheme({
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
          },
        },
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: darkMode ? '#ff5e47' : '#ff9014',
          },
          secondary: {
            main: darkMode ? '#595959' : '#909090',
          },
          background: {
            default: darkMode ? '#2c2c2c' : '#ececec',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: darkMode ? darkScrollbar() : null,
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
              },
            },
          },
          MuiToolbar: {
            styleOverrides: {
              dense: {
                height: 42,
                minHeight: 42,
                color: darkMode ? '#fff' : '#333',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                background: darkMode ? '#2c2c2c' : '#ffffff',
              },
            },
          },
        },
      }),
    [stateAppScreen.isDarkTheme],
  );

  useEffect(() => {
    if (stateAppScreen.appConfigTheme === 'auto') {
      dispatch(setConfig({ isDarkTheme: prefersDarkMode }));
    }
  }, [prefersDarkMode]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </MuiThemeProvider>
  );
};

export default ThemeContainer;
