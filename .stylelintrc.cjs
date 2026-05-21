module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'selector-pseudo-class-disallowed-list': [':focus'],
    'declaration-no-important': true,
    'property-disallowed-list': [
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['layer', 'container', 'custom-media', 'each', 'theme'],
      },
    ],
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['oklch', 'color-mix', 'light-dark'],
      },
    ],
    'selector-class-pattern': null,
    'custom-property-pattern': null,
  },
};
