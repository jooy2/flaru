/** @jsxImportSource @emotion/react */
import { useEffect, useMemo } from 'react';
import { darkScrollbar, useMediaQuery, CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { css, Global, ThemeProvider } from '@emotion/react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as configActions from '@/renderer/store/modules/config';

const ThemeContainer = ({ children, config, ConfigActions }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const darkMode = useMemo((): boolean => {
    if (config.appConfigTheme === 'auto') {
      return prefersDarkMode;
    }
    return config.isDarkTheme;
  }, [config.appConfigTheme, config.isDarkTheme, prefersDarkMode]);
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
    [config.isDarkTheme],
  );

  useEffect(() => {
    if (config.appConfigTheme === 'auto') {
      ConfigActions.setConfig({ isDarkTheme: prefersDarkMode });
    }
  }, [prefersDarkMode]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Global
        styles={css`
          body {
            margin: 0;
          }
        `}
      />
      <CssBaseline />
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </MuiThemeProvider>
  );
};

const mapStateToProps = (state) => ({
  config: state.config,
});

const mapDispatchToProps = (dispatch) => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ThemeContainer);
