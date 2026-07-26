import { createTheme } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { Badge } from './Badge';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { Field } from './Field';
import { Heading } from './Heading';
import { Input } from './Input';
import { Progress } from './Progress';
import { RadioGroup } from './RadioGroup';
import { Skeleton } from './Skeleton';
import { Slider } from './Slider';
import { Spinner } from './Spinner';
import { Surface } from './Surface';
import { Switch } from './Switch';
import { Tabs } from './Tabs';
import { Textarea } from './Textarea';
import { Toggle } from './Toggle';
import { ToggleGroup } from './ToggleGroup';
import { Accordion } from './Accordion';
import { ScrollArea } from './ScrollArea';
import { SilkProvider } from '../theme/SilkProvider';

test('Stage 2 form and visual primitives SSR without throwing', () => {
  const theme = createTheme({ colorScheme: 'light' });
  const html = renderToString(
    createElement(
      SilkProvider,
      { theme },
      createElement(Surface, { elevation: 'raised', border: 'subtle' },
        createElement(Card, { padding: '4' },
          createElement(Heading, { level: '2' }, 'SSR'),
          createElement(Badge, { tone: 'success' }, 'ok'),
          createElement(Skeleton, { shape: 'text' }),
          createElement(Spinner, { label: 'Loading' }),
          createElement(Progress, { value: 40, label: 'Progress' }),
          createElement(
            Field.Root,
            null,
            createElement(Field.Label, null, 'Name'),
            createElement(Input, { defaultValue: 'Ada' }),
            createElement(Textarea, { defaultValue: 'Notes' }),
          ),
          createElement(Checkbox, { 'aria-label': 'Accept' }),
          createElement(
            RadioGroup.Root,
            { defaultValue: 'a', 'aria-label': 'Choice' },
            createElement(RadioGroup.Item, { value: 'a' }, 'A'),
          ),
          createElement(Switch, { 'aria-label': 'Toggle' }),
          createElement(Slider, {
            defaultValue: [25],
            'aria-label': 'Amount',
          }),
        ),
      ),
    ),
  );

  expect(html).toContain('SSR');
  expect(html).toContain('data-elevation');
  expect(html).toContain('data-tone="success"');
});

test('Stage 3 inline interaction primitives SSR without throwing', () => {
  const html = renderToString(
    createElement(
      SilkProvider,
      null,
      createElement(
        Tabs.Root,
        { defaultValue: 'a' },
        createElement(
          Tabs.List,
          null,
          createElement(Tabs.Trigger, { value: 'a' }, 'A'),
        ),
        createElement(Tabs.Content, { value: 'a' }, 'Panel'),
      ),
      createElement(
        Accordion.Root,
        { type: 'single' },
        createElement(
          Accordion.Item,
          { value: '1' },
          createElement(
            Accordion.Header,
            null,
            createElement(Accordion.Trigger, null, 'Item'),
          ),
          createElement(Accordion.Content, null, 'Body'),
        ),
      ),
      createElement(Toggle, { 'aria-label': 'Bold' }, 'B'),
      createElement(
        ToggleGroup.Root,
        { type: 'single', 'aria-label': 'Align' },
        createElement(ToggleGroup.Item, { value: 'left', 'aria-label': 'Left' }, 'L'),
      ),
      createElement(ScrollArea, null, createElement('p', null, 'Scroll')),
    ),
  );

  expect(html).toContain('Panel');
  expect(html).toContain('data-variant');
  expect(html).toContain('data-radix-scroll-area-viewport');
  expect(html).toContain('<style');
  expect(html).toContain('scrollbar-width:none');
});

test('Field label/control association is correct in server markup', () => {
  const html = renderToString(
    createElement(
      SilkProvider,
      null,
      createElement(
        Field.Root,
        { controlId: 'email' },
        createElement(Field.Label, null, 'Email'),
        createElement(Input, null),
      ),
    ),
  );

  // Pre-hydration `for` must already point at the rendered control, so the
  // label works with JS disabled and hydration has nothing to correct.
  expect(html).toContain('for="email"');
  expect(html).toContain('id="email"');
});

test('Field+Slider SSR omits Label htmlFor and names thumb via labelledby', () => {
  const html = renderToString(
    createElement(
      SilkProvider,
      null,
      createElement(
        Field.Root,
        { controlId: 'volume' },
        createElement(Field.Label, null, 'Volume'),
        createElement(Slider, { defaultValue: [50] }),
      ),
    ),
  );

  expect(html).not.toContain('for="volume"');
  expect(html).toContain('aria-labelledby=');
  expect(html).toContain('role="slider"');
});
