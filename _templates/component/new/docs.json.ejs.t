---
to: packages/css/src/components/<%= group %>/<%= name %>/<%= name %>.docs.json
---
{
  "id": "<%= name %>",
  "type": "component",
  "api": "./<%= name %>.api.json",
  "sections": [
    {
      "title": "Default",
      "examples": [
        {
          "items": [
            {
              "tag": "<%= element %>",
              "class": "ui-<%= name %>",
              "text": "<%= h.changeCase.title(name) %>"
            }
          ]
        }
      ]
    }
  ]
}
