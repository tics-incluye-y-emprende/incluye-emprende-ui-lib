# incluye-emprende-ui

React component library for Incluye y Emprende, documented with Storybook.

## Installation

```bash
npm install incluye-emprende-ui
```

`react` and `react-dom` (>= 18) are peer dependencies.

## Usage

```tsx
import { Button } from 'incluye-emprende-ui';
import 'incluye-emprende-ui/styles.css'; // once, at your app's entry point

export function App() {
  return <Button variant="primary" onClick={() => alert('Hi!')}>Click me</Button>;
}
```

## Development

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `npm run dev`             | Start Storybook on http://localhost:6006      |
| `npm test`                | Run unit tests (Vitest + Testing Library)     |
| `npm run test:watch`      | Run tests in watch mode                       |
| `npm run build`           | Type-check and build the library into `dist/` |
| `npm run build-storybook` | Build a static Storybook into `storybook-static/` |

### Adding a component

```
src/components/MyComponent/
├── MyComponent.tsx          # component
├── MyComponent.css          # styles (prefix classes with `ie-`)
├── MyComponent.test.tsx     # unit tests
├── MyComponent.stories.tsx  # Storybook stories
└── index.ts                 # public exports
```

Then export it from `src/index.ts`.

## Publishing to npm

```bash
npm login
npm version patch   # or minor / major
npm publish         # runs tests + build first (prepublishOnly)
```

Use `npm pack --dry-run` to check what will be published (only `dist/`).
