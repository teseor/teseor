// Consolidator: read raw workflow output and emit a structured survey matrix.
// Output is consumed by render-doc.mjs to produce the final Markdown.

import fs from "node:fs";

const raw = JSON.parse(fs.readFileSync(".local/component-survey/raw-workflow-output.json", "utf8"));
const groups = [...raw.result.groups];
if (fs.existsSync(".local/component-survey/raw-workflow-1b-output.json")) {
  const raw1b = JSON.parse(
    fs.readFileSync(".local/component-survey/raw-workflow-1b-output.json", "utf8"),
  );
  for (const g of raw1b.result.groups) groups.push(g);
}

// Teseor's current spec coverage (from specs/*.yaml).
const TESEOR_COVERAGE = {
  button: "shipped",
  cluster: "shipped",
  code: "shipped",
  codeblock: "shipped",
  modal: "shipped",
  pagination: "shipped",
  stack: "shipped",
  tablist: "shipped",
  tooltip: "shipped",
};

// Synonym map: any normalized name on the right side maps to the canonical key on the left.
// "head" of compound part names is stripped before lookup (Tabs.Root -> Tabs).
const SYNONYMS = {
  Accordion: ["accordion", "collapsible-group", "expandable"],
  AlertDialog: ["alert-dialog", "alertdialog", "confirm-dialog"],
  Alert: [
    "alert",
    "banner",
    "inline-alert",
    "inline-message",
    "messagebar",
    "inlinenotification",
    "inlinemessage",
    "notification-inline",
    "flash",
  ],
  Anchor: ["anchor"],
  Aside: ["aside", "sidebar-content"],
  AspectRatio: ["aspect-ratio", "aspectratio", "ratio"],
  Autocomplete: ["autocomplete", "auto-complete"],
  Avatar: ["avatar", "user-avatar"],
  Badge: ["badge", "tag", "chip", "pill", "label-status", "tagcomponent"],
  Blockquote: ["blockquote", "quote", "pullquote", "pull-quote"],
  Breadcrumbs: ["breadcrumb", "breadcrumbs"],
  Button: ["button", "btn", "iconbutton", "icon-button", "togglebutton", "splitbutton"],
  ButtonGroup: [
    "button-group",
    "buttongroup",
    "btn-group",
    "segmentedcontrol",
    "segmented-control",
  ],
  Calendar: ["calendar", "datecalendar"],
  Callout: ["callout", "admonition", "note", "notice", "aside-box", "tip", "inline-notice"],
  Card: ["card"],
  Carousel: ["carousel", "image-carousel", "slider-carousel"],
  Checkbox: ["checkbox", "check-box"],
  CheckboxGroup: ["checkbox-group", "checkboxgroup"],
  ChoiceList: ["choicelist", "choice-list"],
  Code: ["code", "inline-code"],
  CodeBlock: ["code-block", "codeblock", "pre", "code-snippet"],
  Collapsible: ["collapsible", "disclosure"],
  ColorInput: ["colorinput", "color-input", "colorpicker", "color-picker"],
  Combobox: ["combobox", "combo-box"],
  CommandPalette: ["command", "commandpalette", "command-palette", "cmdk", "commandmenu", "kbar"],
  Container: ["container", "page-container", "box", "centered"],
  ContextMenu: ["context-menu", "contextmenu"],
  Counter: ["counter"],
  DataTable: ["data-table", "datatable", "datagrid", "data-grid", "aggrid", "enhanced-table"],
  DatePicker: ["datepicker", "date-picker", "date-input", "date-field", "dateinput", "datefield"],
  DateRangePicker: ["daterangepicker", "date-range-picker", "datepickerrange"],
  DescriptionList: [
    "descriptionlist",
    "description-list",
    "dl",
    "definition-list",
    "definitionlist",
  ],
  Details: ["details", "detail-disclosure"],
  Dialog: ["dialog", "modal", "modaldialog"],
  Divider: ["divider", "hr", "horizontal-rule", "separator"],
  Drawer: ["drawer", "sheet", "side-sheet", "sidesheet", "side-panel"],
  DropdownMenu: ["dropdown", "dropdown-menu", "dropdownmenu", "menu", "menubutton"],
  EmptyState: ["empty-state", "emptystate", "placeholder", "empty"],
  ErrorBoundary: ["errorboundary"],
  ErrorPage: ["errorpage", "error-page", "error-banner"],
  ExceptionList: ["exception-list", "exceptionlist"],
  FileInput: [
    "fileinput",
    "file-input",
    "file-upload",
    "file-uploader",
    "fileuploader",
    "fileupload",
    "uploadfile",
  ],
  Figure: ["figure", "figcaption"],
  Footer: ["footer", "page-footer", "sitefooter"],
  Form: ["form"],
  FormControl: ["formcontrol", "form-control", "field", "formfield", "form-field"],
  FormGroup: ["formgroup", "form-group", "fieldgroup"],
  Frame: ["frame", "app-frame", "appshell", "app-shell"],
  Grid: ["grid", "simple-grid", "simplegrid", "grid-layout"],
  Group: ["group", "cluster", "inline"],
  Header: ["header", "page-header", "site-header"],
  Heading: ["heading", "h1", "h2", "h3", "h4", "h5", "h6", "title"],
  HoverCard: ["hover-card", "hovercard", "tooltipcard"],
  Icon: ["icon"],
  Image: ["image", "img", "avatar-image"],
  IndexTable: ["indextable", "index-table"],
  Input: ["input", "text-input", "textinput", "text-field", "textfield"],
  InputGroup: ["inputgroup", "input-group", "input-addon"],
  Kbd: ["kbd", "keyboard-key", "keyboardkey"],
  Label: ["label"],
  Layer: ["layer", "page-layer"],
  Layout: ["layout", "page-layout", "split-layout", "splitlayout", "two-column"],
  Legend: ["legend"],
  Link: ["link", "a", "anchor-link", "textlink"],
  LinkList: ["link-list", "linklist"],
  List: ["list", "ul", "ol", "orderedlist", "unorderedlist"],
  ListBox: ["listbox", "list-box", "optionlist"],
  ListItem: ["listitem", "list-item", "li"],
  Loader: ["loader"],
  Logo: ["logo"],
  Mark: ["mark", "highlight"],
  Masonry: ["masonry"],
  MediaCard: ["mediacard", "media-card"],
  MediaObject: ["mediaobject", "media-object", "media"],
  Menubar: ["menubar"],
  Meter: ["meter"],
  Modal: ["modal"],
  Nav: ["nav", "navigation"],
  NavigationMenu: ["navigationmenu", "navigation-menu", "megamenu", "mega-menu"],
  NumberInput: ["numberinput", "number-input", "numericinput", "spinbutton"],
  Pagination: ["pagination", "pager", "paginate"],
  Paragraph: ["paragraph", "p"],
  Picker: ["picker", "select-picker"],
  Pin: ["pin", "pininput", "pin-input", "onetimepasswordfield", "one-time-password-field", "otp"],
  Popover: ["popover"],
  Portal: ["portal"],
  ProgressBar: ["progress", "progress-bar", "progressbar", "linearprogress", "progressmeter"],
  ProgressCircle: [
    "progresscircle",
    "progress-circle",
    "circular-progress",
    "circularprogress",
    "donut-progress",
  ],
  RadioGroup: ["radio-group", "radiogroup", "radio-button-group", "radiobuttongroup", "radio"],
  Rating: ["rating", "star-rating", "starrating"],
  Resizable: ["resizable", "splitter", "resize-panel"],
  RichTextEditor: [
    "rich-text-editor",
    "richtexteditor",
    "rte",
    "editor",
    "tiptap",
    "lexical",
    "composer",
    "lexicalcomposer",
    "editorshell",
  ],
  ScrollArea: ["scroll-area", "scrollarea", "scrollview", "scrollable"],
  SearchField: ["searchfield", "search-field", "search-input", "searchinput", "search"],
  Section: ["section"],
  SegmentedControl: ["segmentedcontrol", "segmented-control", "segmented", "tabsegmented"],
  Select: ["select", "native-select", "nativeselect", "dropdownselect"],
  Shell: ["shell", "pageshell", "appshell-2"],
  Sidebar: ["sidebar", "side-nav", "sidenav", "side-navigation", "sidenavigation"],
  Skeleton: ["skeleton", "skeleton-loader", "placeholder-loading"],
  Slider: ["slider", "range-slider", "rangeslider"],
  SortableList: ["sortable", "sortable-list"],
  SpeedDial: ["speeddial", "speed-dial"],
  Spinner: ["spinner", "loading", "loadingspinner", "loading-indicator"],
  Stack: ["stack", "vstack", "hstack", "flex-stack"],
  Stat: ["stat", "statistic", "stat-card"],
  Steps: ["steps", "stepper", "wizard"],
  Subnav: ["subnav", "sub-nav", "tabnav"],
  Summary: ["summary"],
  Switch: ["switch", "toggle"],
  Table: ["table"],
  TableOfContents: ["toc", "table-of-contents", "tableofcontents", "in-page-nav", "on-this-page"],
  Tabs: ["tabs", "tablist", "tabnav-2"],
  Tag: ["tag", "chip-tag"],
  TagInput: ["taginput", "tag-input", "tagsinput", "tags-input", "tokeninput"],
  Text: ["text", "span", "typography"],
  Textarea: ["textarea", "text-area"],
  TimeInput: ["timeinput", "time-input", "time-field", "timefield", "timepicker", "time-picker"],
  Timeline: ["timeline"],
  Toast: ["toast", "toaster", "snackbar", "notifier", "sonner", "hotToast", "react-hot-toast"],
  Toolbar: ["toolbar"],
  Tooltip: ["tooltip"],
  Transfer: ["transfer", "transferlist"],
  Tree: ["tree", "treeview", "tree-view"],
  Typeahead: ["typeahead"],
  VisuallyHidden: ["visually-hidden", "visuallyhidden", "screenreader-only", "sr-only"],
  Wizard: ["wizard"],
  // Form / native element additions
  Fieldset: ["fieldset"],
  ToggleGroup: [
    "toggle-group",
    "togglegroup",
    "togglebuttongroup",
    "toggle-button-group",
    "tag-group",
    "taggroup",
  ],
  Notification: ["notification", "notifications"],
  Article: ["article"],
  Strong: ["strong"],
  Small: ["small-text", "smalltext", "small"],
  Main: ["main", "main-content"],
  Page: ["page", "pageheader"],
  CloseButton: ["close-button", "closebutton", "close"],
  Tile: ["tile"],
  Onboarding: ["tour", "onboarding", "walkthrough", "coachmark", "coach-mark"],
  QRCode: ["qrcode", "qr-code"],
  ColorSwatch: [
    "colorswatch",
    "color-swatch",
    "colorarea",
    "color-area",
    "colorslider",
    "color-slider",
    "colorwheel",
    "color-wheel",
    "colorfield",
    "color-field",
  ],
  Affix: ["affix", "sticky"],
  LoadingOverlay: ["loadingoverlay", "loading-overlay", "overlay"],
  Indicator: ["indicator"],
  MaskedInput: ["mask", "maskedinput", "masked-input"],
  Watermark: ["watermark"],
  Marquee: ["marquee"],
  Bleed: ["bleed"],
  Backdrop: ["backdrop"],
  Vstack: ["vstack-extra"],
  Center: ["center", "centered-2"],
  Box: ["box"],
  Paper: ["paper"],
  Space: ["space", "spacer"],
  // Form library specific shapes
  Controller: ["controller", "control-wrapper"],
  FieldArray: ["fieldarray", "field-array", "usefieldarray"],
  FormProvider: ["formprovider", "form-provider"],
  MultiSelect: ["multiselect", "multi-select"],
  TreeSelect: ["treeselect", "tree-select"],
  Cascader: ["cascader"],
  // Doc-shape additions
  HorizontalRule: ["hr", "horizontal-rule"],
  // Replace Slider entry to merge "range" too
};
SYNONYMS.Slider.push("range");
SYNONYMS.Collapsible.push("collapse", "collapses");
SYNONYMS.NumberInput.push("numberfield", "number-field");
SYNONYMS.ColorInput.push("color");
SYNONYMS.Calendar.push("month", "week");
SYNONYMS.Toast.push("hot-toast", "notification-toast");
SYNONYMS.FileInput.push("dropzone", "filetrigger", "file-trigger");
SYNONYMS.DateRangePicker.push("rangecalendar", "range-calendar");
SYNONYMS.Sidebar.push("navbar", "nav-bar");
SYNONYMS.Toolbar.push("actionbar", "action-bar");
SYNONYMS.DropdownMenu.push("actionmenu", "action-menu");
SYNONYMS.Header.push("pageheader");
SYNONYMS.Grid.push("flexgrid", "flex-grid");
SYNONYMS.ListItem.push("item");
SYNONYMS.Heading.push("headings");
SYNONYMS.List.push("lists", "definition-list-dl-dt-dd");
SYNONYMS.DescriptionList.push("definition-list", "definition-list-dl-dt-dd");
SYNONYMS.Pin.push("input-otp", "password-input", "passwordinput", "password-toggle-field");
SYNONYMS.Link.push("a", "links");
SYNONYMS.Code.push("code-code-pre-kbd");
SYNONYMS.Image.push("img", "image-img");
SYNONYMS.Popover.push("floating-panel", "floatingpanel");
SYNONYMS.ListBox.push("gridlist", "grid-list");
SYNONYMS.Stack.push("flex", "wrap", "flex-wrap");
SYNONYMS.DatePicker.push("daypicker", "date");
SYNONYMS.RadioGroup.push("radio-button");
SYNONYMS.ProgressBar.push("progress---linear");
SYNONYMS.ProgressCircle.push(
  "progress---circular",
  "ringprogress",
  "ring-progress",
  "semicircleprogress",
);
SYNONYMS.Switch.push("toggle-tip");
SYNONYMS.Button.push(
  "actionicon",
  "action-icon",
  "copybutton",
  "copy-button",
  "filebutton",
  "file-button",
  "unstyledbutton",
  "unstyled-button",
  "closebutton",
);
SYNONYMS.Combobox.push("autocomplete-input", "pillsinput", "pills-input");
SYNONYMS.DataTable.push("data-list", "datalist");
SYNONYMS.Link.push("navlink", "nav-link", "skip-nav");
SYNONYMS.Pin.push("otp-field", "otpfield");
SYNONYMS.Card.push("checkbox-card", "radio-card", "preview-card");
SYNONYMS.Toast.push("toaster-2");
SYNONYMS.Calendar.push("date-2");
SYNONYMS.NumberInput.push("formatnumber", "format-number");
SYNONYMS.Loader.push("burger");
SYNONYMS.Tooltip.push("toggle-tip-2");
SYNONYMS.Section.push("em", "strong-2", "prose");
// Docs-platform vocabulary merges
SYNONYMS.Callout.push(
  "admonition",
  "admonition-note",
  "admonition-tip",
  "admonition-info",
  "admonition-warning",
  "admonition-danger",
  "note-2",
  "tip-2",
  "warning-2",
  "danger",
  "check",
  "info-2",
  "container-tip",
  "container-info",
  "container-warning",
  "container-danger",
  "container-details",
  "github-style-alert",
  "custom-containers",
);
SYNONYMS.CodeBlock.push(
  "code-group",
  "codegroup",
  "code-blocks",
  "code-block-with-title",
  "fenced-code-block",
  "live-code-block",
  "code-fence",
);
SYNONYMS.Tabs.push("tabitem", "tab-item", "tabs.tab", "code-group-tabs");
SYNONYMS.Card.push("cardgroup", "card-group", "link-card", "linkcard", "cards.card", "tile-card");
SYNONYMS.Steps.push("step", "steps.step");
SYNONYMS.FileInput.push("filetree", "file-tree", "filetree.folder", "filetree.file");
SYNONYMS.Aside.push("aside-component");
SYNONYMS.Image.push("mdx-image", "image-mdx");
SYNONYMS.Math = SYNONYMS.Math || [];
SYNONYMS.Math.push("math", "math-katex", "katex", "math-equations");
SYNONYMS.Mermaid = SYNONYMS.Mermaid || [];
SYNONYMS.Mermaid.push("mermaid", "mermaid-diagram");
SYNONYMS.Head = SYNONYMS.Head || [];
SYNONYMS.Head.push("head", "page-head", "head-metadata");
SYNONYMS.Frontmatter = SYNONYMS.Frontmatter || [];
SYNONYMS.Frontmatter.push("frontmatter", "front-matter");
SYNONYMS.Hero = SYNONYMS.Hero || [];
SYNONYMS.Hero.push("hero", "splashlayout", "splash-layout", "splash");
SYNONYMS.LinkCard = SYNONYMS.LinkCard || [];
SYNONYMS.Anchor.push("anchor-link", "in-page-anchor");
SYNONYMS.TableOfContents.push("toc-2", "page-toc", "on-this-page-2", "in-page-toc");
SYNONYMS.NavigationMenu.push("navbar-2", "page-nav");
SYNONYMS.Section.push("mdx-content", "main-content");
SYNONYMS.Frame = SYNONYMS.Frame || [];
SYNONYMS.Frame.push("frame", "iframe-component", "embed", "embedded-content");
SYNONYMS.Video = SYNONYMS.Video || [];
SYNONYMS.Video.push("video", "video-element", "youtube-embed", "youtube");
SYNONYMS.Accordion.push("accordiongroup", "accordion-group");
SYNONYMS.Update = SYNONYMS.Update || [];
SYNONYMS.Update.push("update", "changelog-entry");
// Tailwind Typography selectors that ship as named prose elements
SYNONYMS.Heading.push("prose-h1", "prose-h2", "prose-h3", "prose-h4", "prose-h5", "prose-h6");
SYNONYMS.Paragraph.push("prose-p");
SYNONYMS.Link.push("prose-a");
SYNONYMS.Blockquote.push("prose-blockquote");
SYNONYMS.Code.push("prose-code");
SYNONYMS.CodeBlock.push("prose-pre");
SYNONYMS.List.push("prose-ul", "prose-ol", "prose-li");
SYNONYMS.DescriptionList.push("prose-dl", "prose-dt", "prose-dd");
SYNONYMS.Image.push("prose-img");
SYNONYMS.Figure.push("prose-figure", "prose-figcaption");
SYNONYMS.Table.push(
  "prose-table",
  "prose-thead",
  "prose-tbody",
  "prose-tr",
  "prose-th",
  "prose-td",
);
SYNONYMS.HorizontalRule.push("prose-hr");
SYNONYMS.Kbd.push("prose-kbd");
SYNONYMS.Mark.push("prose-mark");
SYNONYMS.Strong.push("prose-strong", "prose-b");
SYNONYMS.Small.push("prose-small", "prose-sub", "prose-sup");
SYNONYMS.VisuallyHidden.push("prose-sr-only");
SYNONYMS.Section.push(
  "prose-modifier-base",
  "prose-modifier-sm",
  "prose-modifier-lg",
  "prose-modifier-xl",
  "prose-modifier-2xl",
  "prose-modifier-invert",
  "prose-modifier-color",
  "prose-modifier-gray-scale",
);
SYNONYMS.Callout.push("github-alert", "github-style-alert-2");
SYNONYMS.Paragraph.push("prose-lead");
SYNONYMS.Strong.push("prose-em");
SYNONYMS.Image.push("prose-picture");
SYNONYMS.Video.push("prose-video");

// Doc-relevance heuristic: which consensus components matter for the dogfooded docs site.
// "doc" = needed to render Markdown-shaped prose / docs surface.
// "app" = needed for the application surface (forms, dialogs, navigation, etc.).
// "both" = used in both worlds.
const RELEVANCE = {
  Alert: "both",
  Anchor: "both",
  AspectRatio: "doc",
  Aside: "doc",
  Avatar: "app",
  Badge: "both",
  Blockquote: "doc",
  Breadcrumbs: "both",
  Button: "both",
  ButtonGroup: "app",
  Calendar: "app",
  Callout: "doc",
  Card: "both",
  Carousel: "both",
  Checkbox: "app",
  CheckboxGroup: "app",
  ChoiceList: "app",
  Code: "doc",
  CodeBlock: "doc",
  Collapsible: "both",
  ColorInput: "app",
  Combobox: "app",
  CommandPalette: "app",
  Container: "both",
  ContextMenu: "app",
  Counter: "app",
  DataTable: "app",
  DatePicker: "app",
  DateRangePicker: "app",
  DescriptionList: "doc",
  Details: "doc",
  Dialog: "both",
  Divider: "doc",
  Drawer: "app",
  DropdownMenu: "app",
  EmptyState: "app",
  ErrorBoundary: "app",
  ErrorPage: "app",
  FileInput: "app",
  Figure: "doc",
  Footer: "both",
  Form: "app",
  FormControl: "app",
  FormGroup: "app",
  Frame: "app",
  Grid: "both",
  Group: "both",
  Header: "both",
  Heading: "doc",
  HoverCard: "app",
  Icon: "both",
  Image: "doc",
  IndexTable: "app",
  Input: "app",
  InputGroup: "app",
  Kbd: "doc",
  Label: "app",
  Layer: "app",
  Layout: "app",
  Legend: "app",
  Link: "doc",
  LinkList: "doc",
  List: "doc",
  ListBox: "app",
  ListItem: "doc",
  Loader: "app",
  Logo: "both",
  Mark: "doc",
  Masonry: "both",
  MediaCard: "both",
  MediaObject: "doc",
  Menubar: "app",
  Meter: "app",
  Modal: "both",
  Nav: "both",
  NavigationMenu: "both",
  NumberInput: "app",
  AlertDialog: "app",
  Accordion: "both",
  Autocomplete: "app",
  Pagination: "both",
  Paragraph: "doc",
  Picker: "app",
  Pin: "app",
  Popover: "app",
  Portal: "app",
  ProgressBar: "both",
  ProgressCircle: "app",
  RadioGroup: "app",
  Rating: "both",
  Resizable: "app",
  RichTextEditor: "both",
  ScrollArea: "both",
  SearchField: "both",
  Section: "doc",
  SegmentedControl: "app",
  Select: "app",
  Shell: "app",
  Sidebar: "both",
  Skeleton: "app",
  Slider: "app",
  SortableList: "app",
  SpeedDial: "app",
  Spinner: "app",
  Stack: "both",
  Stat: "app",
  Steps: "both",
  Subnav: "both",
  Summary: "doc",
  Switch: "app",
  Table: "doc",
  TableOfContents: "doc",
  Tabs: "both",
  Tag: "both",
  TagInput: "app",
  Text: "doc",
  Textarea: "app",
  TimeInput: "app",
  Timeline: "doc",
  Toast: "app",
  Toolbar: "app",
  Tooltip: "app",
  Transfer: "app",
  Tree: "app",
  Typeahead: "app",
  VisuallyHidden: "both",
  Wizard: "app",
  Fieldset: "app",
  ToggleGroup: "app",
  Notification: "both",
  Article: "doc",
  Strong: "doc",
  Small: "doc",
  Main: "doc",
  Page: "app",
  CloseButton: "app",
  Tile: "app",
  Onboarding: "app",
  QRCode: "app",
  ColorSwatch: "app",
  Affix: "app",
  LoadingOverlay: "app",
  Indicator: "app",
  MaskedInput: "app",
  Watermark: "doc",
  Marquee: "doc",
  Bleed: "both",
  Backdrop: "app",
  Center: "both",
  Box: "both",
  Paper: "both",
  Space: "both",
  Controller: "app",
  FieldArray: "app",
  FormProvider: "app",
  MultiSelect: "app",
  TreeSelect: "app",
  Cascader: "app",
  HorizontalRule: "doc",
  Math: "doc",
  Mermaid: "doc",
  Head: "doc",
  Frontmatter: "doc",
  Hero: "doc",
  LinkCard: "doc",
  Video: "doc",
  Update: "doc",
};

// Build a reverse lookup from any synonym → canonical key.
const reverse = new Map();
for (const [canon, syns] of Object.entries(SYNONYMS)) {
  reverse.set(canon.toLowerCase(), canon);
  for (const s of syns) reverse.set(s.toLowerCase(), canon);
}

function normalize(name) {
  if (!name) return "";
  // Strip everything in parentheses: "Headings (h1-h6)" -> "Headings", "Link (a)" -> "Link"
  let head = String(name)
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
  // Strip part suffixes like Tabs.Root, Dialog.Trigger -> Tabs, Dialog.
  head = head.split(".")[0].split("/")[0];
  // Strip "react-" / "Radix" / "@radix-ui/" prefixes that sneak in via package naming
  head = head.replace(/^@?radix-ui\//, "").replace(/^react-/i, "");
  // Hyphen / camel normalize
  let key = head
    .toLowerCase()
    .replace(/[\s_]/g, "-")
    .replace(/^-+|-+$/g, "");
  // Strip trailing role markers
  key = key.replace(/-component$/, "").replace(/-element$/, "");
  return key;
}

function canonical(name) {
  const key = normalize(name);
  if (!key) return null;
  if (reverse.has(key)) return reverse.get(key);
  // Try removing pluralization
  const sing = key.replace(/s$/, "");
  if (reverse.has(sing)) return reverse.get(sing);
  // Try replacing "-" with ""
  const collapsed = key.replace(/-/g, "");
  if (reverse.has(collapsed)) return reverse.get(collapsed);
  return null;
}

const matrix = new Map(); // canonical name -> { systems: Map<sysName, [origName, sourceUrl, category]>, aliases: Set, categories: Map<cat,count> }
const unmatched = new Map(); // normalized key -> count

function record(systemName, comp) {
  const canon = canonical(comp.name);
  if (!canon) {
    const k = normalize(comp.name);
    unmatched.set(k, (unmatched.get(k) || 0) + 1);
    return;
  }
  if (!matrix.has(canon)) {
    matrix.set(canon, {
      systems: new Map(),
      aliases: new Set(),
      categories: new Map(),
    });
  }
  const m = matrix.get(canon);
  m.aliases.add(comp.name);
  m.systems.set(systemName, {
    origName: comp.name,
    source_url: comp.source_url,
    category: comp.category,
    key_props: comp.key_props || [],
    a11y_aria: comp.a11y_aria,
    design_choices: comp.design_choices,
  });
  m.categories.set(comp.category, (m.categories.get(comp.category) || 0) + 1);
}

for (const g of groups) {
  if (!g) continue;
  for (const sys of g.systems) {
    for (const c of sys.components) record(sys.name, c);
  }
}

// Rank: by number of systems including, descending.
const ranked = [...matrix.entries()]
  .map(([canon, m]) => {
    const sysCount = m.systems.size;
    const topCategory = [...m.categories.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const teseorKey = canon.toLowerCase();
    // Match Teseor coverage including aliases
    let teseor = TESEOR_COVERAGE[teseorKey] || "";
    if (!teseor) {
      if (canon === "Dialog" && TESEOR_COVERAGE.modal) teseor = "shipped-as-modal";
      if (canon === "Modal" && TESEOR_COVERAGE.modal) teseor = "shipped";
      if (canon === "Group" && TESEOR_COVERAGE.cluster) teseor = "shipped-as-cluster";
      if (canon === "Tabs" && TESEOR_COVERAGE.tablist) teseor = "shipped-as-tablist";
      if (canon === "CodeBlock" && TESEOR_COVERAGE.codeblock) teseor = "shipped";
    }
    const relevance = RELEVANCE[canon] || "app";
    return {
      canon,
      sysCount,
      topCategory,
      relevance,
      teseor,
      aliases: [...m.aliases].sort(),
      systems: [...m.systems.entries()].sort(),
    };
  })
  .sort((a, b) => b.sysCount - a.sysCount || a.canon.localeCompare(b.canon));

const summary = {
  totalGroups: groups.filter(Boolean).length,
  totalSystems: groups.filter(Boolean).reduce((a, g) => a + g.systems.length, 0),
  totalComponentEntries: groups
    .filter(Boolean)
    .reduce((a, g) => a + g.systems.reduce((b, s) => b + s.components.length, 0), 0),
  consensusComponents: ranked.length,
  unmatched: [...unmatched.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80),
};

fs.writeFileSync(
  ".local/component-survey/consolidated.json",
  JSON.stringify({ summary, ranked, groups }, null, 2),
);
console.log("summary:", summary);
console.log("top 30 by frequency:");
for (const r of ranked.slice(0, 30)) {
  console.log(
    `  ${r.sysCount.toString().padStart(2)}  ${r.canon.padEnd(18)} cat=${r.topCategory.padEnd(10)} rel=${r.relevance.padEnd(5)} teseor=${r.teseor || "-"}`,
  );
}
console.log(`\ntop unmatched (consider adding to synonyms):`);
for (const [k, c] of summary.unmatched.slice(0, 40)) console.log(`  ${c}x  ${k}`);
