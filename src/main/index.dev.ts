// Warning: This file is only used in the development environment
// and is removed at build time.
// Do not edit the file unless necessary.
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-extension-installer';

const commonExtensionOptions = {
  loadExtensionOptions: {
    allowFileAccess: true,
  },
};

installExtension(REACT_DEVELOPER_TOOLS, commonExtensionOptions);
installExtension(REDUX_DEVTOOLS, commonExtensionOptions);
