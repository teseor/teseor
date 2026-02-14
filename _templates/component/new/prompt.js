const GROUPS = [
  'actions',
  'typography',
  'forms',
  'data-display',
  'feedback',
  'overlays',
  'disclosure',
  'navigation',
  'layout',
];

module.exports = {
  prompt: ({ inquirer, args }) => {
    // If name passed as arg, use defaults
    if (args.name) {
      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(args.name)) {
        console.error('Error: name must be kebab-case (e.g., button-group)');
        process.exit(1);
      }
      if (args.group && !GROUPS.includes(args.group)) {
        console.error(`Error: group must be one of: ${GROUPS.join(', ')}`);
        process.exit(1);
      }
      // If group not passed as arg, require interactive selection
      if (!args.group) {
        return inquirer
          .prompt([
            {
              type: 'list',
              name: 'group',
              message: 'Component group:',
              choices: GROUPS,
            },
          ])
          .then((answers) => ({
            name: args.name,
            group: answers.group,
            description: `${args.name} component`,
            element: 'div',
          }));
      }
      return Promise.resolve({
        name: args.name,
        group: args.group,
        description: `${args.name} component`,
        element: 'div',
      });
    }

    // Interactive mode
    return inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Component name (kebab-case):',
        validate: (input) => {
          if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(input)) {
            return 'Must be kebab-case (e.g., button-group)';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'group',
        message: 'Component group:',
        choices: GROUPS,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: (answers) => `${answers.name} component`,
      },
      {
        type: 'input',
        name: 'element',
        message: 'Default HTML element:',
        default: 'div',
      },
    ]);
  },
};
