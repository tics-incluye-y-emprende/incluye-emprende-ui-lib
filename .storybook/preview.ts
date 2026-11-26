import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    options: {
      // Sections of the sidebar: the first part of each story's title, e.g. "Hooks/useTypedForm"
      storySort: {
        order: ['Hooks', ['useTypedForm', ['Docs', '*', 'Validation']], 'Components', '*'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
