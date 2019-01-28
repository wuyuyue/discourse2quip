module.exports =
{
  'extends': 'airbnb-base',
  "parser":"babel-eslint",
  'extends': [
      'plugin:prettier/recommended',
  ],
  'plugins': [
  ],
  'rules': {
    "prettier/prettier": ["error", {
        "singleQuote": true,
        "semi": false,
        "traillingComma": true,
    }],
  },
  'parserOptions': {
      'ecmaVersion': 6,
      'sourceType': 'module',
  },
}
