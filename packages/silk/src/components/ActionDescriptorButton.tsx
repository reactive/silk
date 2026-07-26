import type { ActionDescriptor } from '@reactive/silk-core';
import type { JSX, MouseEventHandler } from 'react';
import { Button } from './Button';

export interface ActionDescriptorButtonProps {
  readonly action: ActionDescriptor;
  readonly onAction?: (actionId: string) => void;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'solid' | 'soft' | 'outline' | 'ghost';
}

/**
 * Shared ActionDescriptor rendering for composites — links and buttons share
 * disabled semantics (aria-disabled + prevented navigation for href).
 */
export function ActionDescriptorButton({
  action,
  onAction,
  size = 'sm',
  variant = 'ghost',
}: ActionDescriptorButtonProps): JSX.Element {
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
      <Button
        asChild
        variant={variant}
        tone={tone}
        size={size}
        disabled={action.disabled}
      >
        <a
          href={action.href}
          aria-disabled={action.disabled || undefined}
          tabIndex={action.disabled ? -1 : undefined}
          onClick={handleClick}
        >
          {action.label}
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      tone={tone}
      size={size}
      disabled={action.disabled}
      onClick={() => {
        onAction?.(action.id);
      }}
    >
      {action.label}
    </Button>
  );
}
