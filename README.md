# @incluye-y-emprende/ui

React component library for Incluye y Emprende, documented with Storybook.

## Installation

```bash
npm install @incluye-y-emprende/ui
```

`react` and `react-dom` (>= 18) are peer dependencies.

## Usage

### useTypedForm

Binds native form elements to a typed payload. Each key has its own config: how to read its value
from the change event, its default value and its validations.

```tsx
import type { ChangeEvent } from 'react';
import { useTypedForm } from '@incluye-y-emprende/ui';

interface Payload {
  name: string;
  terms: boolean;
}

export function SignUp() {
  const { bind, handleSubmit, state } = useTypedForm<Payload>({
    fieldsConfig: {
      name: {
        eventToPayloadAdapter: (e) => e.target.value,
        validations: { required: { propValue: true, errorMessage: 'Write your name' } },
      },
      terms: {
        eventToPayloadAdapter: (e: ChangeEvent<HTMLInputElement>) => e.target.checked,
        defaultValue: false,
        validations: { required: { propValue: true } },
      },
    },
  });

  return (
    <form noValidate onSubmit={handleSubmit((payload) => console.log(payload))}>
      <input {...bind('name')} />
      <input type="checkbox" {...bind('terms')} />
      <button disabled={state.isValid === false}>Send</button>
    </form>
  );
}
```

See the **Hooks › useTypedForm** section of Storybook (`npm run dev`) for the full documentation and
the validation rules.

## Development

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `npm run dev`             | Start Storybook on http://localhost:6006      |
| `npm test`                | Run unit tests (Vitest + Testing Library)     |
| `npm run test:watch`      | Run tests in watch mode                       |
| `npm run build`           | Type-check and build the library into `dist/` |
| `npm run build-storybook` | Build a static Storybook into `storybook-static/` |

Storybook is divided into sections by the first part of each story's title: `Hooks/...`,
`Components/...`. Their order is set in `.storybook/preview.ts`.

### Adding a component

```
src/components/MyComponent/
├── MyComponent.tsx          # component
├── MyComponent.css          # styles (prefix classes with `ie-`)
├── MyComponent.test.tsx     # unit tests
├── MyComponent.stories.tsx  # Storybook stories, titled "Components/MyComponent"
└── index.ts                 # public exports
```

Then export it from `src/index.ts`. The build bundles the components' CSS into
`dist/styles.css`, which consumers import once at their app's entry point:

```tsx
import '@incluye-y-emprende/ui/styles.css';
```

## Publishing to npm

```bash
npm login
npm version patch   # or minor / major
npm publish         # runs tests + build first (prepublishOnly)
```

Use `npm pack --dry-run` to check what will be published (only `dist/`).
