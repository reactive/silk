import {
  actionBarRecipe,
  type ActionBarVariantProps,
  type ActionDescriptor,
} from '@reactive/silk-core';
import { Toolbar as RadixToolbar } from 'radix-ui';
import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type JSX,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from 'react';
import { densityClass } from '../theme/density.css';
import { useComponentDefaults } from '../theme/SilkProvider';
import { Button, type ButtonProps } from './Button';
import { Inline } from './Inline';

interface ActionBarContextValue {
  readonly density: NonNullable<ActionBarVariantProps['density']>;
}

const ActionBarContext = createContext<ActionBarContextValue | null>(null);

function useActionBarContext(): ActionBarContextValue {
  const ctx = useContext(ActionBarContext);
  if (!ctx) {
    throw new Error(
      'ActionBar compound parts must be used within ActionBar.Root',
    );
  }
  return ctx;
}

export type ActionBarRootProps = Omit<
  ComponentPropsWithoutRef<typeof RadixToolbar.Root>,
  'orientation'
> &
  ActionBarVariantProps & {
    /** Required accessible name for the toolbar. */
    readonly 'aria-label': string;
    readonly ref?: Ref<HTMLDivElement>;
    readonly children?: ReactNode;
  };

function ActionBarRoot({
  className,
  justify,
  density,
  children,
  ...props
}: ActionBarRootProps): JSX.Element {
  const defaults = useComponentDefaults('ActionBar');
  const resolvedJustify =
    justify ?? defaults.justify ?? actionBarRecipe.defaults.justify;
  const resolvedDensity =
    density ?? defaults.density ?? actionBarRecipe.defaults.density;

  return (
    <ActionBarContext.Provider value={{ density: resolvedDensity }}>
      <Inline
        asChild
        gap="1"
        align="center"
        justify={resolvedJustify}
        wrap="wrap"
        className={className}
        data-density={resolvedDensity}
        data-justify={resolvedJustify}
      >
        <RadixToolbar.Root
          {...props}
          orientation="horizontal"
          className={densityClass}
          data-density={resolvedDensity}
        >
          {children}
        </RadixToolbar.Root>
      </Inline>
    </ActionBarContext.Provider>
  );
}

export type ActionBarActionProps = Omit<
  ComponentPropsWithoutRef<typeof RadixToolbar.Button>,
  'asChild'
> &
  Pick<ButtonProps, 'variant' | 'tone' | 'size' | 'disabled'> & {
    readonly asChild?: boolean;
    readonly ref?: Ref<HTMLButtonElement>;
    readonly children?: ReactNode;
  };

function ActionBarAction({
  className,
  variant = 'ghost',
  tone = 'neutral',
  size = 'sm',
  asChild = false,
  children,
  ...props
}: ActionBarActionProps): JSX.Element {
  const { density } = useActionBarContext();
  return (
    <RadixToolbar.Button {...props} asChild>
      <Button
        variant={variant}
        tone={tone}
        size={size}
        density={density}
        asChild={asChild}
        className={className}
      >
        {children}
      </Button>
    </RadixToolbar.Button>
  );
}

export type ActionBarSpacerProps = ComponentPropsWithoutRef<'div'> & {
  readonly ref?: Ref<HTMLDivElement>;
};

function ActionBarSpacer({
  style,
  ...props
}: ActionBarSpacerProps): JSX.Element {
  useActionBarContext();
  // Flex grow is a layout affordance with no current primitive; style is the
  // ranked escape for runtime flex basis (see COMPOSITES.md escape hatch).
  return <div {...props} style={{ flex: 1, minWidth: 0, ...style }} />;
}

export interface ActionBarDescriptorProps {
  readonly action: ActionDescriptor;
  readonly onAction?: (actionId: string) => void;
  readonly variant?: ButtonProps['variant'];
}

function ActionBarDescriptor({
  action,
  onAction,
  variant = 'soft',
}: ActionBarDescriptorProps): JSX.Element {
  const tone = action.tone ?? 'neutral';

  if (action.href !== undefined) {
    const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
      if (action.disabled) {
        event.preventDefault();
        return;
      }
      onAction?.(action.id);
    };

    return (
      <ActionBarAction
        asChild
        disabled={action.disabled}
        tone={tone}
        variant={variant}
      >
        <a
          href={action.href}
          aria-disabled={action.disabled || undefined}
          tabIndex={action.disabled ? -1 : undefined}
          onClick={handleClick}
        >
          {action.label}
        </a>
      </ActionBarAction>
    );
  }

  return (
    <ActionBarAction
      disabled={action.disabled}
      tone={tone}
      variant={variant}
      onClick={() => {
        onAction?.(action.id);
      }}
    >
      {action.label}
    </ActionBarAction>
  );
}

export interface ActionBarNamespace {
  readonly Root: typeof ActionBarRoot;
  readonly Action: typeof ActionBarAction;
  readonly Descriptor: typeof ActionBarDescriptor;
  readonly Spacer: typeof ActionBarSpacer;
}

export const ActionBar: ActionBarNamespace = {
  Root: ActionBarRoot,
  Action: ActionBarAction,
  Descriptor: ActionBarDescriptor,
  Spacer: ActionBarSpacer,
};
