module.exports = {
  env: {
    browser: true,
    node: true,
    commonjs: true,
    es2021: true,
    mocha: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': 0,
    semi: ['error', 'always'],
    'no-inner-declarations': 0,
  },
};
