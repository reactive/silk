import { css, cx } from '@linaria/core';
import { DropdownMenu as RadixDropdownMenu, Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { ThemeScopePortal } from '../theme/ThemeScope';
import {
  floatingMotionClass,
  floatingSurfaceClass,
  floatingSurfacePaddedClass,
  floatingZIndex,
} from './floatingSurface';
import {
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
} from './menuListStyles';

export const DropdownMenuRoot: typeof RadixDropdownMenu.Root =
  RadixDropdownMenu.Root;
export const DropdownMenuTrigger: typeof RadixDropdownMenu.Trigger =
  RadixDropdownMenu.Trigger;
export const DropdownMenuGroup: typeof RadixDropdownMenu.Group =
  RadixDropdownMenu.Group;
export const DropdownMenuRadioGroup: typeof RadixDropdownMenu.RadioGroup =
  RadixDropdownMenu.RadioGroup;
export const DropdownMenuItemIndicator: typeof RadixDropdownMenu.ItemIndicator =
  RadixDropdownMenu.ItemIndicator;
export const DropdownMenuSub: typeof RadixDropdownMenu.Sub =
  RadixDropdownMenu.Sub;

const contentClass: string = css`
  z-index: ${floatingZIndex.menu};
  min-width: 180px;
`;

const dangerItemClass: string = css`
  &:where([data-tone='danger']) {
    color: var(--silk-color-tone-danger-text);
  }

  &:where([data-tone='danger'][data-highlighted]) {
    background-color: var(--silk-color-tone-danger-subtle);
    color: var(--silk-color-tone-danger-text);
  }
`;

const shortcutClass: string = css`
  margin-left: auto;
  padding-left: var(--silk-space-4);
  font-size: var(--silk-typography-label-size);
  color: var(--silk-color-text-secondary);
`;

function menuSurfaceClassName(className?: string): string {
  return cx(
    floatingSurfaceClass,
    floatingSurfacePaddedClass,
    floatingMotionClass,
    contentClass,
    className,
  );
}

export interface DropdownMenuContentProps
  extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
  readonly container?: HTMLElement | DocumentFragment | null;
}

export function DropdownMenuContent({
  className,
  container,
  sideOffset = 4,
  children,
  ...props
}: DropdownMenuContentProps): JSX.Element {
  return (
    <RadixDropdownMenu.Portal {...(container != null ? { container } : {})}>
      <ThemeScopePortal>
        <RadixDropdownMenu.Content
          {...props}
          sideOffset={sideOffset}
          className={menuSurfaceClassName(className)}
        >
          {children}
        </RadixDropdownMenu.Content>
      </ThemeScopePortal>
    </RadixDropdownMenu.Portal>
  );
}

export interface DropdownMenuSubContentProps
  extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.SubContent> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
  readonly container?: HTMLElement | DocumentFragment | null;
}

export function DropdownMenuSubContent({
  className,
  container,
  sideOffset = 2,
  children,
  ...props
}: DropdownMenuSubContentProps): JSX.Element {
  return (
    <RadixDropdownMenu.Portal {...(container != null ? { container } : {})}>
      <ThemeScopePortal>
        <RadixDropdownMenu.SubContent
          {...props}
          sideOffset={sideOffset}
          className={menuSurfaceClassName(className)}
        >
          {children}
        </RadixDropdownMenu.SubContent>
      </ThemeScopePortal>
    </RadixDropdownMenu.Portal>
  );
}

export interface DropdownMenuItemProps
  extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
  readonly tone?: 'neutral' | 'danger';
  readonly shortcut?: ReactNode;
}

export function DropdownMenuItem({
  className,
  tone = 'neutral',
  shortcut,
  children,
  ...props
}: DropdownMenuItemProps): JSX.Element {
  return (
    <RadixDropdownMenu.Item
      {...props}
      className={cx(menuItemClass, dangerItemClass, className)}
      data-tone={tone}
    >
      {/* Unconditional even when `shortcut` is unset: the `null` branch still
          counts as a child. See ARCHITECTURE.md#aschild-with-decorations */}
      <Slot.Slottable>{children}</Slot.Slottable>
      {shortcut != null ? (
        <span className={shortcutClass}>{shortcut}</span>
      ) : null}
    </RadixDropdownMenu.Item>
  );
}

export interface DropdownMenuCheckboxItemProps
  extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.CheckboxItem> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: DropdownMenuCheckboxItemProps): JSX.Element {
  return (
    <RadixDropdownMenu.CheckboxItem
      {...props}
      className={cx(menuItemClass, className)}
    >
      {children}
    </RadixDropdownMenu.CheckboxItem>
  );
}

export interface DropdownMenuRadioItemProps
  extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.RadioItem> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: DropdownMenuRadioItemProps): JSX.Element {
  return (
    <RadixDropdownMenu.RadioItem
      {...props}
      className={cx(menuItemClass, className)}
    >
      {children}
    </RadixDropdownMenu.RadioItem>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDropdownMenu.Label> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixDropdownMenu.Label
      {...props}
      className={cx(menuLabelClass, className)}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDropdownMenu.Separator> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixDropdownMenu.Separator
      {...props}
      className={cx(menuSeparatorClass, className)}
    />
  );
}

export function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDropdownMenu.SubTrigger> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}): JSX.Element {
  return (
    <RadixDropdownMenu.SubTrigger
      {...props}
      className={cx(menuItemClass, className)}
    >
      {/* See ARCHITECTURE.md#aschild-with-decorations */}
      <Slot.Slottable>{children}</Slot.Slottable>
      <span className={shortcutClass}>›</span>
    </RadixDropdownMenu.SubTrigger>
  );
}

export interface DropdownMenuNamespace {
  readonly Root: typeof DropdownMenuRoot;
  readonly Trigger: typeof DropdownMenuTrigger;
  readonly Content: typeof DropdownMenuContent;
  readonly Group: typeof DropdownMenuGroup;
  readonly Label: typeof DropdownMenuLabel;
  readonly Item: typeof DropdownMenuItem;
  readonly CheckboxItem: typeof DropdownMenuCheckboxItem;
  readonly RadioGroup: typeof DropdownMenuRadioGroup;
  readonly RadioItem: typeof DropdownMenuRadioItem;
  readonly ItemIndicator: typeof DropdownMenuItemIndicator;
  readonly Separator: typeof DropdownMenuSeparator;
  readonly Sub: typeof DropdownMenuSub;
  readonly SubTrigger: typeof DropdownMenuSubTrigger;
  readonly SubContent: typeof DropdownMenuSubContent;
}

export const DropdownMenu: DropdownMenuNamespace = {
  Root: DropdownMenuRoot,
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Group: DropdownMenuGroup,
  Label: DropdownMenuLabel,
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  ItemIndicator: DropdownMenuItemIndicator,
  Separator: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
};
