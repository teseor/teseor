---
to: packages/css/src/04-components/<%= name %>/index.scss
---
@use '../../00-config/tokens/variables' as t;

// <%= h.changeCase.title(name) %> component

@layer components.tokens {
  .<%= name %> {
    // Define internal tokens here
    // --_height: var(--ui-<%= name %>-height, var(--ui-row-2, #{t.$row-2}));
  }
}

@layer components.styles {
  .<%= name %> {
    // Structural styles here
  }
}
