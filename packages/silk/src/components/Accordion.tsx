import { css, cx } from '@linaria/core';
import { Accordion as RadixAccordion } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { focusRingCss } from '../theme/focusRing';
import { chevronOpenClass } from './menuListStyles';

export const AccordionRoot: typeof RadixAccordion.Root = RadixAccordion.Root;

const itemClass: string = css`
  border-bottom: 1px solid var(--silk-color-border-subtle);

  &:where(:first-child) {
    border-top: 1px solid var(--silk-color-border-subtle);
  }
`;

const headerClass: string = css`
  margin: 0;
  display: flex;
`;

const triggerClass: string = css`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--silk-space-3);
  box-sizing: border-box;
  margin: 0;
  padding: var(--silk-space-3) 0;
  border: none;
  background: transparent;
  color: var(--silk-color-text-primary);
  font-family: var(--silk-typography-body-family);
  font-size: var(--silk-typography-body-size);
  font-weight: var(--silk-typography-body-weight);
  text-align: start;
  cursor: pointer;

  &:where(:focus-visible) {
    ${focusRingCss('var(--silk-color-tone-accent-focus-ring)')}
  }

  &:where(:disabled) {
    cursor: not-allowed;
    color: var(--silk-color-tone-neutral-disabled-fg);
  }
`;

const chevronToneClass: string = css`
  color: var(--silk-color-text-secondary);
`;

const contentClass: string = css`
  overflow: hidden;
  color: var(--silk-color-text-secondary);
  font-family: var(--silk-typography-body-family);
  font-size: var(--silk-typography-body-sm-size);
  line-height: var(--silk-typography-body-line-height);

  &:where([data-state='open']) {
    animation: silk-accordion-open var(--silk-motion-normal-duration-ms)
      var(--silk-motion-normal-easing);
  }

  &:where([data-state='closed']) {
    animation: silk-accordion-close var(--silk-motion-normal-duration-ms)
      var(--silk-motion-normal-easing);
  }

  @keyframes silk-accordion-open {
    from {
      height: 0;
      opacity: 0;
    }
    to {
      height: var(--radix-accordion-content-height);
      opacity: 1;
    }
  }

  @keyframes silk-accordion-close {
    from {
      height: var(--radix-accordion-content-height);
      opacity: 1;
    }
    to {
      height: 0;
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &:where([data-state='open']),
    &:where([data-state='closed']) {
      animation: none;
    }
  }
`;

const contentInnerClass: string = css`
  padding-bottom: var(--silk-space-3);
`;

export type AccordionItemProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Item
> & {
  readonly ref?: Ref<HTMLDivElement>;
};

export type AccordionHeaderProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Header
> & {
  readonly ref?: Ref<HTMLHeadingElement>;
};

export type AccordionTriggerProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Trigger
> & {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly children?: ReactNode;
};

export type AccordionContentProps = ComponentPropsWithoutRef<
  typeof RadixAccordion.Content
> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

export function AccordionItem({
  className,
  ...props
}: AccordionItemProps): JSX.Element {
  return (
    <RadixAccordion.Item {...props} className={cx(itemClass, className)} />
  );
}

export function AccordionHeader({
  className,
  ...props
}: AccordionHeaderProps): JSX.Element {
  return (
    <RadixAccordion.Header
      {...props}
      className={cx(headerClass, className)}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionTriggerProps): JSX.Element {
  return (
    <RadixAccordion.Trigger
      {...props}
      className={cx(triggerClass, className)}
    >
      {children}
      <span className={cx(chevronOpenClass, chevronToneClass)} aria-hidden>
        ▾
      </span>
    </RadixAccordion.Trigger>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: AccordionContentProps): JSX.Element {
  return (
    <RadixAccordion.Content
      {...props}
      className={cx(contentClass, className)}
    >
      <div className={contentInnerClass}>{children}</div>
    </RadixAccordion.Content>
  );
}

export interface AccordionNamespace {
  readonly Root: typeof AccordionRoot;
  readonly Item: typeof AccordionItem;
  readonly Header: typeof AccordionHeader;
  readonly Trigger: typeof AccordionTrigger;
  readonly Content: typeof AccordionContent;
}

export const Accordion: AccordionNamespace = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
};
