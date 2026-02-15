---
to: packages/css/src/components/<%= group %>/<%= name %>/index.scss
---
@use '../../../config/tokens/variables' as t;

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
