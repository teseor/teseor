// Auto-generated from api.json. Do not edit manually.
// Run: pnpm generate:api

// --- shared modifier scales ---

export type Size = 'sm' | 'lg';
export type State = 'error' | 'success';
export type Variant = 'info' | 'success' | 'warning' | 'danger';

// --- accordion ---

export interface AccordionModifiers {
  separated?: boolean;
}

export const accordionModifierKeys = ['separated'] as const;

export const accordionElement = 'div' as const;

// --- alert ---

export interface AlertModifiers {
  variant?: Variant;
  size?: Size;
  dismissible?: boolean;
}

export const alertModifierKeys = ['variant', 'size', 'dismissible'] as const;

export const alertElement = 'div' as const;

export const alertElements = ['icon', 'content', 'title', 'description', 'close'] as const;

// --- app-shell ---

export const appShellElement = 'body' as const;

// --- aspect-ratio ---

export interface AspectRatioModifiers {
  ratio?: 'square' | 'video' | 'photo' | 'wide' | 'portrait';
}

export const aspectRatioModifierKeys = ['ratio'] as const;

export const aspectRatioElement = 'div' as const;

// --- avatar ---

export interface AvatarModifiers {
  size?: 'xs' | 'sm' | 'lg' | 'xl';
  square?: boolean;
}

export const avatarModifierKeys = ['size', 'square'] as const;

export const avatarElement = 'div' as const;

export const avatarElements = ['image', 'fallback'] as const;

// --- badge ---

export interface BadgeModifiers {
  size?: Size;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export const badgeModifierKeys = ['size', 'variant'] as const;

export const badgeElement = 'span' as const;

// --- blockquote ---

export interface BlockquoteModifiers {
  variant?: 'accent';
}

export const blockquoteModifierKeys = ['variant'] as const;

export const blockquoteElement = 'blockquote' as const;

export const blockquoteElements = ['cite'] as const;

// --- box ---

export interface BoxModifiers {
  'p-1'?: boolean;
  'p-2'?: boolean;
  'p-3'?: boolean;
  'p-4'?: boolean;
  'bg-subtle'?: boolean;
  'bg-muted'?: boolean;
  rounded?: boolean;
  'rounded-lg'?: boolean;
}

export const boxModifierKeys = [
  'p-1',
  'p-2',
  'p-3',
  'p-4',
  'bg-subtle',
  'bg-muted',
  'rounded',
  'rounded-lg',
] as const;

export const boxElement = 'div' as const;

// --- breadcrumb ---

export const breadcrumbElement = 'div' as const;

export const breadcrumbElements = ['item', 'link', 'current', 'ellipsis'] as const;

export interface BreadcrumbItemModifiers {
  hidden?: boolean;
}

// --- button ---

export interface ButtonModifiers {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'secondary' | 'ghost' | 'outline' | 'danger' | 'link';
  icon?: boolean;
  radius?: 'radius-none' | 'radius-sm' | 'radius-lg' | 'radius-full';
  block?: boolean;
  loading?: boolean;
}

export const buttonModifierKeys = [
  'size',
  'variant',
  'icon',
  'radius',
  'block',
  'loading',
] as const;

export const buttonElement = 'button' as const;

export const buttonElements = ['icon'] as const;

export interface ButtonIconModifiers {
  start?: boolean;
  end?: boolean;
}

// --- button-group ---

export interface ButtonGroupModifiers {
  vertical?: boolean;
}

export const buttonGroupModifierKeys = ['vertical'] as const;

export const buttonGroupElement = 'div' as const;

// --- card ---

export interface CardModifiers {
  variant?: 'subtle' | 'muted';
  size?: Size;
  flush?: boolean;
  interactive?: boolean;
  responsive?: boolean;
}

export const cardModifierKeys = ['variant', 'size', 'flush', 'interactive', 'responsive'] as const;

export const cardElement = 'div' as const;

export const cardElements = ['media', 'body'] as const;

// --- center ---

export interface CenterModifiers {
  column?: boolean;
}

export const centerModifierKeys = ['column'] as const;

export const centerElement = 'div' as const;

// --- checkbox ---

export interface CheckboxModifiers {
  size?: 'lg';
  state?: State;
}

export const checkboxModifierKeys = ['size', 'state'] as const;

export const checkboxElement = 'input' as const;

// --- checkbox-group ---

export interface CheckboxGroupModifiers {
  compact?: boolean;
  error?: boolean;
  horizontal?: boolean;
}

export const checkboxGroupModifierKeys = ['compact', 'error', 'horizontal'] as const;

export const checkboxGroupElement = 'fieldset' as const;

export const checkboxGroupElements = ['legend', 'items', 'item'] as const;

// --- close-button ---

export interface CloseButtonModifiers {
  size?: Size;
  subtle?: boolean;
}

export const closeButtonModifierKeys = ['size', 'subtle'] as const;

export const closeButtonElement = 'button' as const;

export const closeButtonElements = ['icon'] as const;

// --- code ---

export interface CodeModifiers {
  size?: 'sm';
}

export const codeModifierKeys = ['size'] as const;

export const codeElement = 'div' as const;

// --- code-block ---

export interface CodeBlockModifiers {
  compact?: boolean;
  'line-numbers'?: boolean;
}

export const codeBlockModifierKeys = ['compact', 'line-numbers'] as const;

export const codeBlockElement = 'pre' as const;

export const codeBlockElements = ['code', 'line', 'line-number'] as const;

// --- column ---

export interface ColumnModifiers {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const columnModifierKeys = ['size'] as const;

export const columnElement = 'div' as const;

// --- container ---

export interface ContainerModifiers {
  center?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const containerModifierKeys = ['center', 'size'] as const;

export const containerElement = 'div' as const;

// --- content ---

export interface ContentModifiers {
  prose?: boolean;
  flush?: boolean;
}

export const contentModifierKeys = ['prose', 'flush'] as const;

export const contentElement = 'div' as const;

// --- data-list ---

export interface DataListModifiers {
  size?: Size;
  layout?: 'horizontal';
  style?: 'divided' | 'striped';
}

export const dataListModifierKeys = ['size', 'layout', 'style'] as const;

export const dataListElement = 'div' as const;

export const dataListElements = ['item', 'label', 'value'] as const;

// --- dialog ---

export interface DialogModifiers {
  borderless?: boolean;
}

export const dialogModifierKeys = ['borderless'] as const;

export const dialogElement = 'div' as const;

export const dialogElements = ['header', 'title', 'close', 'body', 'footer'] as const;

// --- disclosure ---

export interface DisclosureModifiers {
  borderless?: boolean;
  animate?: boolean;
}

export const disclosureModifierKeys = ['borderless', 'animate'] as const;

export const disclosureElement = 'div' as const;

export const disclosureElements = ['trigger', 'icon', 'content'] as const;

// --- divider ---

export interface DividerModifiers {
  vertical?: boolean;
  position?: 'start' | 'end';
  dashed?: boolean;
}

export const dividerModifierKeys = ['vertical', 'position', 'dashed'] as const;

export const dividerElement = 'div' as const;

// --- drawer ---

export interface DrawerModifiers {
  size?: 'sm' | 'lg' | 'full';
  position?: 'end' | 'start' | 'top' | 'bottom';
}

export const drawerModifierKeys = ['size', 'position'] as const;

export const drawerElement = 'div' as const;

export const drawerElements = [
  'header',
  'title',
  'description',
  'close',
  'body',
  'footer',
] as const;

// --- dropdown-menu ---

export interface DropdownMenuModifiers {
  open?: boolean;
  top?: boolean;
  'align-end'?: boolean;
  'full-width'?: boolean;
}

export const dropdownMenuModifierKeys = ['open', 'top', 'align-end', 'full-width'] as const;

export const dropdownMenuElement = 'div' as const;

export const dropdownMenuElements = ['trigger', 'trigger-icon', 'panel'] as const;

// --- field ---

export interface FieldModifiers {
  horizontal?: boolean;
  responsive?: boolean;
}

export const fieldModifierKeys = ['horizontal', 'responsive'] as const;

export const fieldElement = 'div' as const;

export const fieldElements = ['control', 'label'] as const;

// --- fieldset ---

export interface FieldsetModifiers {
  compact?: boolean;
  bordered?: boolean;
}

export const fieldsetModifierKeys = ['compact', 'bordered'] as const;

export const fieldsetElement = 'fieldset' as const;

export const fieldsetElements = ['legend'] as const;

// --- footer ---

export interface FooterModifiers {
  sticky?: boolean;
  fixed?: boolean;
  bordered?: boolean;
  raised?: boolean;
}

export const footerModifierKeys = ['sticky', 'fixed', 'bordered', 'raised'] as const;

export const footerElement = 'footer' as const;

export const footerElements = ['start', 'center', 'end'] as const;

// --- form ---

export interface FormModifiers {
  compact?: boolean;
  inline?: boolean;
}

export const formModifierKeys = ['compact', 'inline'] as const;

export const formElement = 'form' as const;

export const formElements = ['section', 'actions'] as const;

// --- form-error ---

export const formErrorElement = 'div' as const;

export const formErrorElements = ['icon'] as const;

// --- form-helper ---

export const formHelperElement = 'div' as const;

// --- grid ---

export interface GridModifiers {
  columns?: '2' | '3' | '4' | 'auto';
  subgrid?: boolean;
  'subgrid-rows'?: boolean;
  'subgrid-both'?: boolean;
}

export const gridModifierKeys = ['columns', 'subgrid', 'subgrid-rows', 'subgrid-both'] as const;

export const gridElement = 'div' as const;

// --- heading ---

export interface HeadingModifiers {
  size?: '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm';
}

export const headingModifierKeys = ['size'] as const;

export const headingElement = 'h2' as const;

// --- icon ---

export interface IconModifiers {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  stroke?: 'stroke-thin' | 'stroke-thick';
  filled?: boolean;
  spin?: boolean;
}

export const iconModifierKeys = ['size', 'stroke', 'filled', 'spin'] as const;

export const iconElement = 'svg' as const;

// --- image ---

export interface ImageModifiers {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  rounded?: boolean;
  circle?: boolean;
  'object-fit'?: 'cover' | 'contain';
}

export const imageModifierKeys = ['size', 'rounded', 'circle', 'object-fit'] as const;

export const imageElement = 'figure' as const;

export const imageElements = ['img', 'caption'] as const;

// --- input ---

export interface InputModifiers {
  size?: Size;
  variant?: 'filled' | 'ghost';
  state?: State;
  'auto-size'?: boolean;
  block?: boolean;
}

export const inputModifierKeys = ['size', 'variant', 'state', 'auto-size', 'block'] as const;

export const inputElement = 'input' as const;

// --- kbd ---

export const kbdElement = 'kbd' as const;

// --- label ---

export interface LabelModifiers {
  size?: 'lg';
}

export const labelModifierKeys = ['size'] as const;

export const labelElement = 'label' as const;

export const labelElements = ['required', 'optional'] as const;

// --- link ---

export interface LinkModifiers {
  variant?: 'muted' | 'subtle';
  disabled?: boolean;
  external?: boolean;
}

export const linkModifierKeys = ['variant', 'disabled', 'external'] as const;

export const linkElement = 'a' as const;

// --- list ---

export interface ListModifiers {
  spacing?: 'compact' | 'loose';
  style?: 'unstyled' | 'inline';
}

export const listModifierKeys = ['spacing', 'style'] as const;

export const listElement = 'ul' as const;

export const listElements = ['item'] as const;

// --- main ---

export interface MainModifiers {
  'sidebar-end'?: boolean;
  full?: boolean;
}

export const mainModifierKeys = ['sidebar-end', 'full'] as const;

export const mainElement = 'main' as const;

// --- mark ---

export const markElement = 'mark' as const;

// --- menu ---

export const menuElement = 'div' as const;

export const menuElements = [
  'group',
  'label',
  'item',
  'item-icon',
  'item-shortcut',
  'separator',
  'item-indicator',
] as const;

export interface MenuItemModifiers {
  danger?: boolean;
  disabled?: boolean;
  check?: boolean;
  radio?: boolean;
}

// --- modal ---

export interface ModalModifiers {
  size?: 'sm' | 'lg' | 'full';
  entering?: boolean;
  visible?: boolean;
  exiting?: boolean;
  hidden?: boolean;
  animate?: boolean;
}

export const modalModifierKeys = [
  'size',
  'entering',
  'visible',
  'exiting',
  'hidden',
  'animate',
] as const;

export const modalElement = 'div' as const;

export const modalElements = ['content', 'body'] as const;

// --- nav ---

export interface NavModifiers {
  pills?: 'pills';
  vertical?: boolean;
  responsive?: boolean;
}

export const navModifierKeys = ['pills', 'vertical', 'responsive'] as const;

export const navElement = 'nav' as const;

export const navElements = ['list', 'item'] as const;

export interface NavItemModifiers {
  active?: boolean;
  disabled?: boolean;
}

// --- nav-rail ---

export interface NavRailModifiers {
  end?: boolean;
}

export const navRailModifierKeys = ['end'] as const;

export const navRailElement = 'nav' as const;

export const navRailElements = ['items', 'actions'] as const;

// --- number-input ---

export interface NumberInputModifiers {
  size?: Size;
  block?: boolean;
  disabled?: boolean;
}

export const numberInputModifierKeys = ['size', 'block', 'disabled'] as const;

export const numberInputElement = 'div' as const;

export const numberInputElements = ['field', 'decrement', 'increment'] as const;

// --- overlay ---

export interface OverlayModifiers {
  light?: boolean;
  blur?: boolean;
  entering?: boolean;
  visible?: boolean;
  exiting?: boolean;
  hidden?: boolean;
  animate?: boolean;
}

export const overlayModifierKeys = [
  'light',
  'blur',
  'entering',
  'visible',
  'exiting',
  'hidden',
  'animate',
] as const;

export const overlayElement = 'div' as const;

// --- page-header ---

export interface PageHeaderModifiers {
  bordered?: boolean;
  sticky?: boolean;
}

export const pageHeaderModifierKeys = ['bordered', 'sticky'] as const;

export const pageHeaderElement = 'header' as const;

export const pageHeaderElements = ['title', 'actions', 'breadcrumb'] as const;

// --- pagination ---

export interface PaginationModifiers {
  size?: Size;
}

export const paginationModifierKeys = ['size'] as const;

export const paginationElement = 'div' as const;

export const paginationElements = ['list', 'item', 'link', 'prev', 'next', 'ellipsis'] as const;

export interface PaginationLinkModifiers {
  active?: boolean;
  disabled?: boolean;
}

// --- password-input ---

export interface PasswordInputModifiers {
  size?: Size;
  state?: State;
  block?: boolean;
  disabled?: boolean;
}

export const passwordInputModifierKeys = ['size', 'state', 'block', 'disabled'] as const;

export const passwordInputElement = 'div' as const;

export const passwordInputElements = ['field', 'toggle'] as const;

// --- popover ---

export interface PopoverModifiers {
  position?: 'top' | 'bottom' | 'visible' | 'hidden' | 'animate';
}

export const popoverModifierKeys = ['position'] as const;

export const popoverElement = 'div' as const;

export const popoverElements = ['header', 'title'] as const;

// --- progress ---

export interface ProgressModifiers {
  size?: Size;
  variant?: 'success' | 'warning' | 'danger';
  indeterminate?: boolean;
  striped?: boolean;
  animated?: boolean;
}

export const progressModifierKeys = [
  'size',
  'variant',
  'indeterminate',
  'striped',
  'animated',
] as const;

export const progressElement = 'div' as const;

export const progressElements = ['bar'] as const;

// --- progress-circle ---

export interface ProgressCircleModifiers {
  size?: 'sm' | 'lg' | 'xl';
  variant?: 'success' | 'warning' | 'danger';
  indeterminate?: boolean;
}

export const progressCircleModifierKeys = ['size', 'variant', 'indeterminate'] as const;

export const progressCircleElement = 'svg' as const;

export const progressCircleElements = ['track', 'fill'] as const;

// --- radio ---

export interface RadioModifiers {
  size?: 'lg';
  state?: State;
}

export const radioModifierKeys = ['size', 'state'] as const;

export const radioElement = 'input' as const;

// --- radio-group ---

export interface RadioGroupModifiers {
  compact?: boolean;
  error?: boolean;
  horizontal?: boolean;
}

export const radioGroupModifierKeys = ['compact', 'error', 'horizontal'] as const;

export const radioGroupElement = 'fieldset' as const;

export const radioGroupElements = ['legend', 'items', 'item'] as const;

// --- row ---

export interface RowModifiers {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'start' | 'center' | 'end' | 'between';
}

export const rowModifierKeys = ['size'] as const;

export const rowElement = 'div' as const;

// --- scroll-area ---

export interface ScrollAreaModifiers {
  size?: 'sm' | 'lg' | 'xl';
  thin?: boolean;
  direction?: 'horizontal' | 'both';
  'auto-hide'?: boolean;
}

export const scrollAreaModifierKeys = ['size', 'thin', 'direction', 'auto-hide'] as const;

export const scrollAreaElement = 'div' as const;

export const scrollAreaElements = ['viewport'] as const;

// --- search-input ---

export interface SearchInputModifiers {
  size?: Size;
  block?: boolean;
  disabled?: boolean;
  'has-clear'?: boolean;
}

export const searchInputModifierKeys = ['size', 'block', 'disabled', 'has-clear'] as const;

export const searchInputElement = 'div' as const;

export const searchInputElements = ['field', 'icon', 'clear'] as const;

// --- select ---

export interface SelectModifiers {
  size?: Size;
  variant?: 'filled' | 'ghost';
  state?: State;
  block?: boolean;
}

export const selectModifierKeys = ['size', 'variant', 'state', 'block'] as const;

export const selectElement = 'select' as const;

// --- sidebar ---

export interface SidebarModifiers {
  size?: 'sm' | 'md' | 'lg';
  end?: boolean;
}

export const sidebarModifierKeys = ['size', 'end'] as const;

export const sidebarElement = 'aside' as const;

// --- sidebar-nav ---

export interface SidebarNavModifiers {
  collapsed?: boolean;
}

export const sidebarNavModifierKeys = ['collapsed'] as const;

export const sidebarNavElement = 'nav' as const;

export const sidebarNavElements = [
  'header',
  'content',
  'footer',
  'group',
  'group-label',
  'group-items',
  'subgroup',
  'subgroup-label',
  'item',
  'icon',
  'label',
  'badge',
] as const;

export interface SidebarNavItemModifiers {
  active?: boolean;
  nested?: boolean;
  disabled?: boolean;
}

// --- skeleton ---

export interface SkeletonModifiers {
  variant?: 'text' | 'heading' | 'circle' | 'rect' | 'static';
  pulse?: boolean;
}

export const skeletonModifierKeys = ['variant', 'pulse'] as const;

export const skeletonElement = 'div' as const;

// --- slider ---

export interface SliderModifiers {
  size?: Size;
  color?: 'success' | 'warning' | 'danger';
}

export const sliderModifierKeys = ['size', 'color'] as const;

export const sliderElement = 'input' as const;

// --- spacer ---

export const spacerElement = 'div' as const;

// --- spinner ---

export interface SpinnerModifiers {
  size?: 'xs' | 'sm' | 'lg' | 'xl';
}

export const spinnerModifierKeys = ['size'] as const;

export const spinnerElement = 'div' as const;

// --- stat ---

export interface StatModifiers {
  size?: 'sm';
}

export const statModifierKeys = ['size'] as const;

export const statElement = 'div' as const;

export const statElements = ['value', 'label'] as const;

// --- status ---

export interface StatusModifiers {
  variant?: Variant;
  size?: Size;
  pulse?: boolean;
}

export const statusModifierKeys = ['variant', 'size', 'pulse'] as const;

export const statusElement = 'div' as const;

export const statusElements = ['dot'] as const;

// --- table ---

export interface TableModifiers {
  compact?: boolean;
  striped?: boolean;
}

export const tableModifierKeys = ['compact', 'striped'] as const;

export const tableElement = 'div' as const;

// --- tabs ---

export interface TabsModifiers {
  size?: Size;
  vertical?: boolean;
}

export const tabsModifierKeys = ['size', 'vertical'] as const;

export const tabsElement = 'div' as const;

export const tabsElements = ['list', 'tab', 'panel'] as const;

export interface TabsTabModifiers {
  active?: boolean;
}

export interface TabsPanelModifiers {
  active?: boolean;
}

// --- tag ---

export interface TagModifiers {
  size?: Size;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export const tagModifierKeys = ['size', 'variant'] as const;

export const tagElement = 'span' as const;

export const tagElements = ['remove'] as const;

// --- textarea ---

export interface TextareaModifiers {
  size?: Size;
  variant?: 'filled' | 'ghost';
  state?: State;
  'auto-size'?: boolean;
}

export const textareaModifierKeys = ['size', 'variant', 'state', 'auto-size'] as const;

export const textareaElement = 'textarea' as const;

// --- toast ---

export interface ToastModifiers {
  variant?: Variant;
}

export const toastModifierKeys = ['variant'] as const;

export const toastElement = 'div' as const;

export const toastElements = [
  'icon',
  'content',
  'title',
  'description',
  'action',
  'close',
] as const;

// --- toggle ---

export interface ToggleModifiers {
  size?: Size;
}

export const toggleModifierKeys = ['size'] as const;

export const toggleElement = 'div' as const;

export const toggleElements = ['input', 'track', 'thumb'] as const;

// --- tooltip ---

export interface TooltipModifiers {
  position?: 'top' | 'bottom' | 'start' | 'end' | 'hidden';
  visible?: boolean;
  animate?: boolean;
  anchored?: boolean;
}

export const tooltipModifierKeys = ['position', 'visible', 'animate', 'anchored'] as const;

export const tooltipElement = 'div' as const;

// --- topbar ---

export interface TopbarModifiers {
  sticky?: boolean;
  fixed?: boolean;
  bordered?: boolean;
  raised?: boolean;
}

export const topbarModifierKeys = ['sticky', 'fixed', 'bordered', 'raised'] as const;

export const topbarElement = 'header' as const;

export const topbarElements = ['start', 'center', 'end'] as const;
