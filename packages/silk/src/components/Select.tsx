import { css, cx } from '@linaria/core';
import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import { selectRecipe, type SelectVariantProps } from '@reactive/silk-core';
import { Select as RadixSelect, Slot } from 'radix-ui';
import { densityClass } from '../theme/density.css';
import { useComponentDefaults } from '../theme/SilkProvider';
import { ThemeScopePortal, useThemeDensity } from '../theme/ThemeScope';
import { controlGeometryCss } from './controlGeometry';
import { useFieldControlProps } from './Field';
import {
  floatingMotionClass,
  floatingSurfaceClass,
  floatingSurfacePaddedClass,
  floatingZIndex,
} from './floatingSurface';
import {
  chevronOpenClass,
  menuIndicatorSlotClass,
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
} from './menuListStyles';

const SelectVariantContext = createContext<Required<SelectVariantProps>>({
  size: selectRecipe.defaults.size,
  density: selectRecipe.defaults.density,
});

export interface SelectRootProps
  extends ComponentPropsWithoutRef<typeof RadixSelect.Root>,
    SelectVariantProps {
  readonly children?: ReactNode;
}

export function SelectRoot({
  size,
  density,
  children,
  ...props
}: SelectRootProps): JSX.Element {
  const defaults = useComponentDefaults('Select');
  const themeDensity = useThemeDensity();
  const resolved: Required<SelectVariantProps> = {
    size: size ?? defaults.size ?? selectRecipe.defaults.size,
    density:
      density ??
      defaults.density ??
      themeDensity ??
      selectRecipe.defaults.density,
  };

  return (
    <SelectVariantContext.Provider value={resolved}>
      <RadixSelect.Root {...props}>{children}</RadixSelect.Root>
    </SelectVariantContext.Provider>
  );
}

export const SelectValue: typeof RadixSelect.Value = RadixSelect.Value;
export const SelectGroup: typeof RadixSelect.Group = RadixSelect.Group;

const triggerClass: string = css`
  ${controlGeometryCss('select')}
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--silk-space-2);
  width: 100%;
  cursor: pointer;
  text-align: start;
`;

const iconClass: string = css`
  color: var(--silk-color-text-secondary);
`;

const contentClass: string = css`
  z-index: ${floatingZIndex.menu};
  overflow: hidden;
  min-width: var(--radix-select-trigger-width);
`;

const viewportClass: string = css`
  padding: var(--silk-space-1);
  max-height: var(--radix-select-content-available-height);
`;

const scrollButtonClass: string = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--silk-space-5);
  background-color: var(--silk-color-surface-raised);
  color: var(--silk-color-text-secondary);
  cursor: default;
`;

export interface SelectTriggerProps
  extends ComponentPropsWithoutRef<typeof RadixSelect.Trigger> {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly children?: ReactNode;
}

export function SelectTrigger({
  className,
  id,
  disabled,
  children,
  ...props
}: SelectTriggerProps): JSX.Element {
  const { size, density } = useContext(SelectVariantContext);
  const fieldProps = useFieldControlProps({
    id,
    disabled,
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid'],
  });

  return (
    <RadixSelect.Trigger
      {...props}
      {...fieldProps}
      className={cx(triggerClass, densityClass, className)}
      data-size={size}
      data-density={density}
    >
      {/* See ARCHITECTURE.md#aschild-with-decorations */}
      <Slot.Slottable>{children}</Slot.Slottable>
      <RadixSelect.Icon className={cx(chevronOpenClass, iconClass)}>
        ▾
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
}

/**
 * `asChild` is omitted: content assembles a Viewport plus both scroll buttons,
 * so there is no single slot target.
 * See ARCHITECTURE.md#aschild-with-decorations.
 */
export interface SelectContentProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RadixSelect.Content>,
    'asChild'
  > {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
  readonly container?: HTMLElement | DocumentFragment | null;
}

/**
 * Select content. Defaults to `position="popper"` (Radix defaults to
 * item-aligned). Pass `position` explicitly to override.
 */
export function SelectContent({
  className,
  container,
  position = 'popper',
  sideOffset = 4,
  children,
  ...props
}: SelectContentProps): JSX.Element {
  return (
    <RadixSelect.Portal {...(container != null ? { container } : {})}>
      <ThemeScopePortal>
        <RadixSelect.Content
          {...props}
          position={position}
          sideOffset={sideOffset}
          className={cx(
            floatingSurfaceClass,
            floatingSurfacePaddedClass,
            floatingMotionClass,
            contentClass,
            className,
          )}
        >
          <RadixSelect.ScrollUpButton className={scrollButtonClass}>
            ▴
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className={viewportClass}>
            {children}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className={scrollButtonClass}>
            ▾
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </ThemeScopePortal>
    </RadixSelect.Portal>
  );
}

/**
 * `asChild` is omitted: the item wraps children in `ItemText`, so the consumer's
 * element cannot be both the option and the text source.
 * See ARCHITECTURE.md#aschild-with-decorations.
 */
export interface SelectItemProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixSelect.Item>, 'asChild'> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

export function SelectItem({
  className,
  children,
  ...props
}: SelectItemProps): JSX.Element {
  return (
    <RadixSelect.Item {...props} className={cx(menuItemClass, className)}>
      <span className={menuIndicatorSlotClass}>
        <RadixSelect.ItemIndicator>✓</RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}

export function SelectLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixSelect.Label> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixSelect.Label {...props} className={cx(menuLabelClass, className)} />
  );
}

export function SelectSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixSelect.Separator> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixSelect.Separator
      {...props}
      className={cx(menuSeparatorClass, className)}
    />
  );
}

/** Assembled API — Icon/Viewport/ItemText live inside Trigger/Content/Item. */
export interface SelectNamespace {
  readonly Root: typeof SelectRoot;
  readonly Trigger: typeof SelectTrigger;
  readonly Value: typeof SelectValue;
  readonly Content: typeof SelectContent;
  readonly Group: typeof SelectGroup;
  readonly Label: typeof SelectLabel;
  readonly Item: typeof SelectItem;
  readonly Separator: typeof SelectSeparator;
}

export const Select: SelectNamespace = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Group: SelectGroup,
  Label: SelectLabel,
  Item: SelectItem,
  Separator: SelectSeparator,
};
