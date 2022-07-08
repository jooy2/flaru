module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
  ],
  rules: {
    'linebreak-style': 0,
    'arrow-parens': 0,
    'consistent-return': 1,
    'generator-star-spacing': 0,
    'no-nested-ternary': 0,
    'no-tabs': 0,
    'no-mixed-spaces-and-tabs': 0,
    'max-len': 1,
    'import/no-extraneous-dependencies': 0,
    'react/function-component-definition': 0,
    'react/jsx-filename-extension': [1, {
      extensions: ['.js', '.jsx'],
    }],
    'react/prop-types': 0,
    'react-hooks/exhaustive-deps': 0,
    'react/jsx-props-no-spreading': 0,
    'jsx-a11y/anchor-is-valid': 0,
    'jsx-a11y/label-has-associated-control': 1,
    'jsx-a11y/no-noninteractive-element-interactions': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/no-static-element-interactions': 0,
  },
};
