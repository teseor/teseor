---
to: packages/css/src/components/<%= group %>/<%= name %>/docs.html
---
---
title: <%= h.changeCase.title(name) %>
description: <%= description %>
---

<!-- @default -->
<<%= element %> class="ui-<%= name %>">{{ t('default', '<%= h.changeCase.title(name) %>') }}</<%= element %>>
