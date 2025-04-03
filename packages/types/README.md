# Urbis Types

Shared TypeScript types for Urbis applications. 

## Installation

```bash
npm install @openurbis/types
# or
yarn add @openurbis/types
```

## Usage

```typescript
import { Field, FieldType } from '@openurbis/types';

// Use the types in your code
const field: Field = {
  type: FieldType.Input,
  key: 'myField',
  options: {
    // ... field options
  }
};
```

## Development

1. Install dependencies:
```bash
npm install
# or
yarn
```

2. Build the package:
```bash
npm run build
# or
yarn build
```