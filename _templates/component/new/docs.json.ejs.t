---
to: packages/css/src/04-components/<%= name %>/<%= name %>.docs.json
---
{
  "api": "./<%= name %>.api.json",
  "sections": [
    {
      "title": "Default",
      "examples": [
        {
          "html": "<<%= element %> class=\"ui-<%= name %>\"><%= h.changeCase.title(name) %></<%= element %>>"
        }
      ]
    }
  ]
}
