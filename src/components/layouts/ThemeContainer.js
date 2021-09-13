/** @jsxImportSource @emotion/react */
import React, { useMemo } from 'react';
import { darkScrollbar } from '@mui/material';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@emotion/react';
import { connect } from 'react-redux';

const ThemeContainer = ({ children, config }) => {
  const darkMode = config.isDarkTheme;
  const muiTheme = useMemo(() => createTheme({
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
        main: darkMode ? '#ba7100' : '#d26300',
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
      MuiPaper: {
        styleOverrides: {
          root: {
            background: darkMode ? '#2c2c2c' : '#ffffff',
          },
        },
      },
    },
  }), [config.isDarkTheme]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <ThemeProvider theme={muiTheme}>
        {children}
      </ThemeProvider>
    </MuiThemeProvider>
  );
};

const mapStateToProps = state => ({
  config: state.config,
});

export default connect(mapStateToProps)(ThemeContainer);
