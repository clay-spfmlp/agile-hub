# Boilerplate: Turborepo + Shadcn/ui + Tailwind CSS v4 + Next.js

## Introduction

- I created this setup to share after completing the migration process from Tailwind CSS v3 to v4 in a monorepo structure, as I found it difficult to find documentation on this. It offers a ready-to-use configuration with Turborepo, Tailwind CSS v4, Shadcn/ui, and Next.js.

- Since I can’t always keep this up to date, please adjust versions like `react`, `next` and others as needed.

- Please use this with a basic understanding of Monorepo concepts using Turborepo.  
[-> Turborepo Docs](https://turborepo.com/docs)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/bytaesu/turborepo-shadcn-tailwind-v4.git

# Install dependencies
pnpm install

# Run the development server
turbo dev --filter nextjs

# Add new shadcn component
cd packages/ui
pnpm dlx shadcn@latest add [component]
```

or

Use this button:

[<img width="170" alt="img" src="https://github.com/user-attachments/assets/28541bbe-2c49-4c8e-8d09-84ff13c29a54" />](https://github.com/new?template_name=turborepo-shadcn-tailwind-v4&template_owner=bytaesu)

## Structure

```
.
├── apps
│   └── nextjs                # Next.js application
│       ├── src
│       │   ├── app
│       │   │   └── globals.css # Critical configuration here
│       │   └── ...
│       └── ...
├── packages
│   ├── eslint-config         # ESLint configuration
│   ├── typescript-config     # TypeScript configuration
│   ├── ui                    # Internal UI package (including shadcn)
│       ├── src
│       │    ├── components
│       │    ├── hooks
│       │    ├── lib
│       │    └── styles
│       │── components.json  # Shadcn CLI configuration
│       └── ...
│   └── ...
└── ...
```

## Critical Configuration

[-> Tailwind CSS Docs](https://tailwindcss.com/docs/detecting-classes-in-source-files)

The most important part of this setup is the `/src/app/globals.css` file in the Next.js application. Proper configuration of the `@source` directive is essential for the UI package to work correctly:

```css
@import 'tailwindcss';
@import '@repo/ui/styles/default.css';

@source '../../node_modules/@repo/ui';
```

## License

MIT
