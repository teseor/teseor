// Auto-generated from api.json. Do not edit manually.
// Run: pnpm generate:api

// --- shared modifier scales ---

export type Size = 'lg' | 'sm';
export type State = 'error' | 'success';
export type Variant = 'danger' | 'info' | 'success' | 'warning';

// --- accordion ---

export interface AccordionModifiers {
  borderless?: boolean;
  separated?: boolean;
}

export const accordionModifierKeys = ['borderless', 'separated'] as const;

export const accordionElement = 'div' as const;

// --- alert ---

export interface AlertModifiers {
  dismissible?: boolean;
  size?: Size;
  variant?: Variant;
}

export const alertModifierKeys = ['dismissible', 'size', 'variant'] as const;

export const alertElement = 'div' as const;

export const alertElements = ['close', 'content', 'description', 'icon', 'title'] as const;

// --- app-shell ---

export const appShellElement = 'body' as const;

// --- aspect-ratio ---

export interface AspectRatioModifiers {
  ratio?: 'photo' | 'portrait' | 'square' | 'video' | 'wide';
}

export const aspectRatioModifierKeys = ['ratio'] as const;

export const aspectRatioElement = 'div' as const;

// --- avatar ---

export interface AvatarModifiers {
  size?: 'lg' | 'sm' | 'xl' | 'xs';
  square?: boolean;
}

export const avatarModifierKeys = ['size', 'square'] as const;

export const avatarElement = 'div' as const;

export const avatarElements = ['fallback', 'image'] as const;

// --- badge ---

export interface BadgeModifiers {
  size?: Size;
  variant?: 'danger' | 'primary' | 'success' | 'warning';
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
  'bg-muted'?: boolean;
  'bg-subtle'?: boolean;
  'p-1'?: boolean;
  'p-2'?: boolean;
  'p-3'?: boolean;
  'p-4'?: boolean;
  rounded?: boolean;
  'rounded-lg'?: boolean;
}

export const boxModifierKeys = [
  'bg-muted',
  'bg-subtle',
  'p-1',
  'p-2',
  'p-3',
  'p-4',
  'rounded',
  'rounded-lg',
] as const;

export const boxElement = 'div' as const;

// --- breadcrumb ---

export const breadcrumbElement = 'div' as const;

export const breadcrumbElements = ['current', 'ellipsis', 'item', 'link'] as const;

export interface BreadcrumbItemModifiers {
  hidden?: boolean;
}

// --- button ---

export interface ButtonModifiers {
  block?: boolean;
  icon?: boolean;
  loading?: boolean;
  radius?: 'radius-full' | 'radius-lg' | 'radius-none' | 'radius-sm';
  size?: 'lg' | 'md' | 'sm';
  variant?: 'danger' | 'ghost' | 'link' | 'outline' | 'secondary';
}

export const buttonModifierKeys = [
  'block',
  'icon',
  'loading',
  'radius',
  'size',
  'variant',
] as const;

export const buttonElement = 'button' as const;

export const buttonElements = ['icon'] as const;

export interface ButtonIconModifiers {
  end?: boolean;
  start?: boolean;
}

// --- button-group ---

export interface ButtonGroupModifiers {
  vertical?: boolean;
}

export const buttonGroupModifierKeys = ['vertical'] as const;

export const buttonGroupElement = 'div' as const;

// --- card ---

export interface CardModifiers {
  flush?: boolean;
  interactive?: boolean;
  responsive?: boolean;
  size?: Size;
  variant?: 'muted' | 'subtle';
}

export const cardModifierKeys = ['flush', 'interactive', 'responsive', 'size', 'variant'] as const;

export const cardElement = 'div' as const;

export const cardElements = ['body', 'media'] as const;

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

export const checkboxGroupElements = ['item', 'items', 'legend'] as const;

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
  size?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
}

export const columnModifierKeys = ['size'] as const;

export const columnElement = 'div' as const;

// --- container ---

export interface ContainerModifiers {
  center?: boolean;
  size?: 'full' | 'lg' | 'md' | 'sm' | 'xl';
}

export const containerModifierKeys = ['center', 'size'] as const;

export const containerElement = 'div' as const;

// --- content ---

export interface ContentModifiers {
  flush?: boolean;
  prose?: boolean;
}

export const contentModifierKeys = ['flush', 'prose'] as const;

export const contentElement = 'div' as const;

// --- data-list ---

export interface DataListModifiers {
  layout?: 'horizontal';
  size?: Size;
  style?: 'divided' | 'striped';
}

export const dataListModifierKeys = ['layout', 'size', 'style'] as const;

export const dataListElement = 'div' as const;

export const dataListElements = ['item', 'label', 'value'] as const;

// --- dialog ---

export interface DialogModifiers {
  borderless?: boolean;
}

export const dialogModifierKeys = ['borderless'] as const;

export const dialogElement = 'div' as const;

export const dialogElements = ['body', 'close', 'footer', 'header', 'title'] as const;

// --- disclosure ---

export interface DisclosureModifiers {
  animate?: boolean;
  borderless?: boolean;
}

export const disclosureModifierKeys = ['animate', 'borderless'] as const;

export const disclosureElement = 'div' as const;

export const disclosureElements = ['content', 'icon', 'trigger'] as const;

// --- divider ---

export interface DividerModifiers {
  dashed?: boolean;
  position?: 'end' | 'start';
  vertical?: boolean;
}

export const dividerModifierKeys = ['dashed', 'position', 'vertical'] as const;

export const dividerElement = 'div' as const;

// --- drawer ---

export interface DrawerModifiers {
  position?: 'bottom' | 'end' | 'start' | 'top';
  size?: 'full' | 'lg' | 'sm';
}

export const drawerModifierKeys = ['position', 'size'] as const;

export const drawerElement = 'div' as const;

export const drawerElements = [
  'body',
  'close',
  'description',
  'footer',
  'header',
  'title',
] as const;

// --- dropdown-menu ---

export interface DropdownMenuModifiers {
  'align-end'?: boolean;
  'full-width'?: boolean;
  open?: boolean;
  top?: boolean;
}

export const dropdownMenuModifierKeys = ['align-end', 'full-width', 'open', 'top'] as const;

export const dropdownMenuElement = 'div' as const;

export const dropdownMenuElements = ['panel', 'trigger', 'trigger-icon'] as const;

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
  bordered?: boolean;
  compact?: boolean;
}

export const fieldsetModifierKeys = ['bordered', 'compact'] as const;

export const fieldsetElement = 'fieldset' as const;

export const fieldsetElements = ['legend'] as const;

// --- footer ---

export interface FooterModifiers {
  bordered?: boolean;
  fixed?: boolean;
  raised?: boolean;
  sticky?: boolean;
}

export const footerModifierKeys = ['bordered', 'fixed', 'raised', 'sticky'] as const;

export const footerElement = 'footer' as const;

export const footerElements = ['center', 'end', 'start'] as const;

// --- form ---

export interface FormModifiers {
  compact?: boolean;
  inline?: boolean;
}

export const formModifierKeys = ['compact', 'inline'] as const;

export const formElement = 'form' as const;

export const formElements = ['actions', 'section'] as const;

// --- form-error ---

export const formErrorElement = 'div' as const;

export const formErrorElements = ['icon'] as const;

// --- form-helper ---

export const formHelperElement = 'div' as const;

// --- grid ---

export interface GridModifiers {
  columns?: '2' | '3' | '4' | 'auto';
  subgrid?: boolean;
  'subgrid-both'?: boolean;
  'subgrid-rows'?: boolean;
}

export const gridModifierKeys = ['columns', 'subgrid', 'subgrid-both', 'subgrid-rows'] as const;

export const gridElement = 'div' as const;

// --- heading ---

export interface HeadingModifiers {
  size?: '2xl' | '3xl' | '4xl' | 'lg' | 'md' | 'sm' | 'xl';
}

export const headingModifierKeys = ['size'] as const;

export const headingElement = 'h2' as const;

// --- icon ---

export interface IconModifiers {
  filled?: boolean;
  size?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
  spin?: boolean;
  stroke?: 'stroke-thick' | 'stroke-thin';
}

export const iconModifierKeys = ['filled', 'size', 'spin', 'stroke'] as const;

export const iconElement = 'svg' as const;

// --- image ---

export interface ImageModifiers {
  circle?: boolean;
  'object-fit'?: 'contain' | 'cover';
  rounded?: boolean;
  size?: 'full' | 'lg' | 'md' | 'sm' | 'xl';
}

export const imageModifierKeys = ['circle', 'object-fit', 'rounded', 'size'] as const;

export const imageElement = 'figure' as const;

export const imageElements = ['caption', 'img'] as const;

// --- input ---

export interface InputModifiers {
  'auto-size'?: boolean;
  block?: boolean;
  size?: Size;
  state?: State;
  variant?: 'filled' | 'ghost';
}

export const inputModifierKeys = ['auto-size', 'block', 'size', 'state', 'variant'] as const;

export const inputElement = 'input' as const;

// --- kbd ---

export const kbdElement = 'kbd' as const;

// --- label ---

export interface LabelModifiers {
  size?: 'lg';
}

export const labelModifierKeys = ['size'] as const;

export const labelElement = 'label' as const;

export const labelElements = ['optional', 'required'] as const;

// --- link ---

export interface LinkModifiers {
  disabled?: boolean;
  external?: boolean;
  variant?: 'muted' | 'subtle';
}

export const linkModifierKeys = ['disabled', 'external', 'variant'] as const;

export const linkElement = 'a' as const;

// --- list ---

export interface ListModifiers {
  spacing?: 'compact' | 'loose';
  style?: 'inline' | 'unstyled';
}

export const listModifierKeys = ['spacing', 'style'] as const;

export const listElement = 'ul' as const;

export const listElements = ['item'] as const;

// --- main ---

export interface MainModifiers {
  full?: boolean;
  'sidebar-end'?: boolean;
}

export const mainModifierKeys = ['full', 'sidebar-end'] as const;

export const mainElement = 'main' as const;

// --- mark ---

export const markElement = 'mark' as const;

// --- menu ---

export const menuElement = 'div' as const;

export const menuElements = [
  'group',
  'item',
  'item-icon',
  'item-indicator',
  'item-shortcut',
  'label',
  'separator',
] as const;

export interface MenuItemModifiers {
  check?: boolean;
  danger?: boolean;
  disabled?: boolean;
  radio?: boolean;
}

// --- modal ---

export interface ModalModifiers {
  animate?: boolean;
  entering?: boolean;
  exiting?: boolean;
  hidden?: boolean;
  size?: 'full' | 'lg' | 'sm';
  visible?: boolean;
}

export const modalModifierKeys = [
  'animate',
  'entering',
  'exiting',
  'hidden',
  'size',
  'visible',
] as const;

export const modalElement = 'div' as const;

export const modalElements = ['body', 'content'] as const;

// --- nav ---

export interface NavModifiers {
  pills?: 'pills';
  responsive?: boolean;
  vertical?: boolean;
}

export const navModifierKeys = ['pills', 'responsive', 'vertical'] as const;

export const navElement = 'nav' as const;

export const navElements = ['item', 'list'] as const;

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

export const navRailElements = ['actions', 'items'] as const;

// --- number-input ---

export interface NumberInputModifiers {
  block?: boolean;
  disabled?: boolean;
  size?: Size;
}

export const numberInputModifierKeys = ['block', 'disabled', 'size'] as const;

export const numberInputElement = 'div' as const;

export const numberInputElements = ['decrement', 'field', 'increment'] as const;

// --- overlay ---

export interface OverlayModifiers {
  animate?: boolean;
  blur?: boolean;
  entering?: boolean;
  exiting?: boolean;
  hidden?: boolean;
  light?: boolean;
  visible?: boolean;
}

export const overlayModifierKeys = [
  'animate',
  'blur',
  'entering',
  'exiting',
  'hidden',
  'light',
  'visible',
] as const;

export const overlayElement = 'div' as const;

// --- page-header ---

export interface PageHeaderModifiers {
  bordered?: boolean;
  sticky?: boolean;
}

export const pageHeaderModifierKeys = ['bordered', 'sticky'] as const;

export const pageHeaderElement = 'header' as const;

export const pageHeaderElements = ['actions', 'breadcrumb', 'title'] as const;

// --- pagination ---

export interface PaginationModifiers {
  size?: Size;
}

export const paginationModifierKeys = ['size'] as const;

export const paginationElement = 'div' as const;

export const paginationElements = ['ellipsis', 'item', 'link', 'list', 'next', 'prev'] as const;

export interface PaginationLinkModifiers {
  active?: boolean;
  disabled?: boolean;
}

// --- password-input ---

export interface PasswordInputModifiers {
  block?: boolean;
  disabled?: boolean;
  size?: Size;
  state?: State;
}

export const passwordInputModifierKeys = ['block', 'disabled', 'size', 'state'] as const;

export const passwordInputElement = 'div' as const;

export const passwordInputElements = ['field', 'toggle'] as const;

// --- popover ---

export interface PopoverModifiers {
  position?: 'animate' | 'bottom' | 'hidden' | 'top' | 'visible';
}

export const popoverModifierKeys = ['position'] as const;

export const popoverElement = 'div' as const;

export const popoverElements = ['header', 'title'] as const;

// --- progress ---

export interface ProgressModifiers {
  animated?: boolean;
  indeterminate?: boolean;
  size?: Size;
  striped?: boolean;
  variant?: 'danger' | 'success' | 'warning';
}

export const progressModifierKeys = [
  'animated',
  'indeterminate',
  'size',
  'striped',
  'variant',
] as const;

export const progressElement = 'div' as const;

export const progressElements = ['bar'] as const;

// --- progress-circle ---

export interface ProgressCircleModifiers {
  indeterminate?: boolean;
  size?: 'lg' | 'sm' | 'xl';
  variant?: 'danger' | 'success' | 'warning';
}

export const progressCircleModifierKeys = ['indeterminate', 'size', 'variant'] as const;

export const progressCircleElement = 'svg' as const;

export const progressCircleElements = ['fill', 'track'] as const;

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

export const radioGroupElements = ['item', 'items', 'legend'] as const;

// --- row ---

export interface RowModifiers {
  size?: 'between' | 'center' | 'end' | 'lg' | 'md' | 'sm' | 'start' | 'xs';
}

export const rowModifierKeys = ['size'] as const;

export const rowElement = 'div' as const;

// --- scroll-area ---

export interface ScrollAreaModifiers {
  'auto-hide'?: boolean;
  direction?: 'both' | 'horizontal';
  size?: 'lg' | 'sm' | 'xl';
  thin?: boolean;
}

export const scrollAreaModifierKeys = ['auto-hide', 'direction', 'size', 'thin'] as const;

export const scrollAreaElement = 'div' as const;

export const scrollAreaElements = ['viewport'] as const;

// --- search-input ---

export interface SearchInputModifiers {
  block?: boolean;
  disabled?: boolean;
  'has-clear'?: boolean;
  size?: Size;
}

export const searchInputModifierKeys = ['block', 'disabled', 'has-clear', 'size'] as const;

export const searchInputElement = 'div' as const;

export const searchInputElements = ['clear', 'field', 'icon'] as const;

// --- select ---

export interface SelectModifiers {
  block?: boolean;
  size?: Size;
  state?: State;
  variant?: 'filled' | 'ghost';
}

export const selectModifierKeys = ['block', 'size', 'state', 'variant'] as const;

export const selectElement = 'select' as const;

// --- sidebar ---

export interface SidebarModifiers {
  end?: boolean;
  size?: 'lg' | 'md' | 'sm';
}

export const sidebarModifierKeys = ['end', 'size'] as const;

export const sidebarElement = 'aside' as const;

// --- sidebar-nav ---

export interface SidebarNavModifiers {
  collapsed?: boolean;
}

export const sidebarNavModifierKeys = ['collapsed'] as const;

export const sidebarNavElement = 'nav' as const;

export const sidebarNavElements = [
  'badge',
  'content',
  'footer',
  'group',
  'group-items',
  'group-label',
  'header',
  'icon',
  'item',
  'label',
  'subgroup',
  'subgroup-label',
] as const;

export interface SidebarNavItemModifiers {
  active?: boolean;
  disabled?: boolean;
  nested?: boolean;
}

// --- skeleton ---

export interface SkeletonModifiers {
  pulse?: boolean;
  variant?: 'circle' | 'heading' | 'rect' | 'static' | 'text';
}

export const skeletonModifierKeys = ['pulse', 'variant'] as const;

export const skeletonElement = 'div' as const;

// --- slider ---

export interface SliderModifiers {
  color?: 'danger' | 'success' | 'warning';
  size?: Size;
}

export const sliderModifierKeys = ['color', 'size'] as const;

export const sliderElement = 'input' as const;

// --- spacer ---

export const spacerElement = 'div' as const;

// --- spinner ---

export interface SpinnerModifiers {
  size?: 'lg' | 'sm' | 'xl' | 'xs';
}

export const spinnerModifierKeys = ['size'] as const;

export const spinnerElement = 'div' as const;

// --- stat ---

export interface StatModifiers {
  size?: 'sm';
}

export const statModifierKeys = ['size'] as const;

export const statElement = 'div' as const;

export const statElements = ['label', 'value'] as const;

// --- status ---

export interface StatusModifiers {
  pulse?: boolean;
  size?: Size;
  variant?: Variant;
}

export const statusModifierKeys = ['pulse', 'size', 'variant'] as const;

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

export const tabsElements = ['list', 'panel', 'tab'] as const;

export interface TabsPanelModifiers {
  active?: boolean;
}

export interface TabsTabModifiers {
  active?: boolean;
}

// --- tag ---

export interface TagModifiers {
  size?: Size;
  variant?: 'danger' | 'primary' | 'success' | 'warning';
}

export const tagModifierKeys = ['size', 'variant'] as const;

export const tagElement = 'span' as const;

export const tagElements = ['remove'] as const;

// --- textarea ---

export interface TextareaModifiers {
  'auto-size'?: boolean;
  size?: Size;
  state?: State;
  variant?: 'filled' | 'ghost';
}

export const textareaModifierKeys = ['auto-size', 'size', 'state', 'variant'] as const;

export const textareaElement = 'textarea' as const;

// --- toast ---

export interface ToastModifiers {
  variant?: Variant;
}

export const toastModifierKeys = ['variant'] as const;

export const toastElement = 'div' as const;

export const toastElements = [
  'action',
  'close',
  'content',
  'description',
  'icon',
  'title',
] as const;

// --- toggle ---

export interface ToggleModifiers {
  size?: Size;
}

export const toggleModifierKeys = ['size'] as const;

export const toggleElement = 'div' as const;

export const toggleElements = ['input', 'thumb', 'track'] as const;

// --- tooltip ---

export interface TooltipModifiers {
  anchored?: boolean;
  animate?: boolean;
  position?: 'bottom' | 'end' | 'hidden' | 'start' | 'top';
  visible?: boolean;
}

export const tooltipModifierKeys = ['anchored', 'animate', 'position', 'visible'] as const;

export const tooltipElement = 'div' as const;

// --- topbar ---

export interface TopbarModifiers {
  bordered?: boolean;
  fixed?: boolean;
  raised?: boolean;
  sticky?: boolean;
}

export const topbarModifierKeys = ['bordered', 'fixed', 'raised', 'sticky'] as const;

export const topbarElement = 'header' as const;

export const topbarElements = ['center', 'end', 'start'] as const;
