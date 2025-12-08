module.exports = {
  prompt: ({ inquirer, args }) => {
    // If name passed as arg, use defaults
    if (args.name) {
      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(args.name)) {
        console.error('Error: name must be kebab-case (e.g., button-group)');
        process.exit(1);
      }
      return Promise.resolve({
        name: args.name,
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
