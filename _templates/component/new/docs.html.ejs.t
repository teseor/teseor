---
to: packages/css/src/components/<%= group %>/<%= name %>/docs.html
---
---
title: <%= h.changeCase.title(name) %>
type: component
id: <%= name %>
description: <%= description %>
---

<!-- @default -->
<<%= element %> class="ui-<%= name %>">{{ t('default', '<%= h.changeCase.title(name) %>') }}</<%= element %>>
