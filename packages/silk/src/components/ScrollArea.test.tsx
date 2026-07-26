import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ScrollArea } from './ScrollArea';

const VIEWPORT_STYLE =
  '[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}';

test('scroll area renders children', () => {
  render(
    <ScrollArea style={{ height: 80 }}>
      <div>Long content</div>
    </ScrollArea>,
  );
  expect(screen.getByText('Long content')).toBeTruthy();
});

test('assembled viewport is keyboard-focusable for scrollable-region a11y', () => {
  const { container } = render(
    <ScrollArea style={{ height: 80 }}>
      <div>Long content</div>
    </ScrollArea>,
  );
  const viewport = container.querySelector(
    '[data-radix-scroll-area-viewport]',
  );
  expect(viewport?.getAttribute('tabindex')).toBe('0');
});

test('ssr emits only the known constant viewport style', () => {
  const html = renderToString(
    <ScrollArea>
      <p>Hello</p>
    </ScrollArea>,
  );
  expect(html).toContain('<style');
  expect(html).toContain(VIEWPORT_STYLE);
  // Guard against unexpected additional style tags from this tree
  expect(html.match(/<style/g)?.length).toBe(1);
});
