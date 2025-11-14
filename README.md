# ClearDollar
AI-Powered Budgeting App

A modern, secure, and intelligent platform for managing personal finances with unprecedented detail and visualization.

💡 Overview

An online budgeting application designed for users who need more control and deeper insight into their spending than standard budgeting tools offer. By combining secure bank account aggregation with a hierarchical, three-tier tagging system and conversational AI automation, the app transforms raw transaction data into actionable, easy-to-digest financial reports.

✨ Key Features

1. Secure Bank Integration

Seamlessly connect to thousands of financial institutions using a secure third-party service (like Plaid or Stripe Financial Connections) to import real-time transaction data.

2. Hierarchical Tagging System

Define spending with unparalleled granularity using three distinct levels of categorization:

Primary Tags: (e.g., Housing, Food, Entertainment)

Secondary Tags: (e.g., Food > Groceries, Food > Restaurants)

Tertiary Tags: (e.g., Groceries > Produce, Restaurants > Fine Dining)

3. AI-Powered Transaction Automation

Reduce manual effort with smart tagging assistance:

Conversational AI/MCP Server: Automatically suggests and applies the appropriate Primary, Secondary, and Tertiary tags based on transaction history and context.

Optional Approval: Users can opt for an approval flow for each automated tag, ensuring complete control before a transaction is finalized.

4. Real-Time Budgeting & Tracking

Create a monthly budget by assigning dollar limits to any custom tag you create.

Progress Visualization: View intuitive loading bar UI elements for every Primary Tag, showing the remaining budget percentage and current spending amount for the month.

5. Multi-Level Drill-Down Analytics

Gain deep insights through dynamic visualizations:

A primary Pie Chart displays the spending ratio across all Primary Tags.

Clicking a slice instantly reveals a secondary pie chart detailing the spending ratios of the Secondary Tags within that category.

A subsequent click on the second pie drill-downs to the Tertiary Tag spending breakdown.

🛠️ Technology Stack (Planned)

Component

Technology / Service

Purpose

# Frontend

React

Highly interactive and responsive user interface.

# Backend

C#.Net

Business logic, API handling, and AI integration.

# Database

Microsoft SQL

Persistent, scalable storage for user transactions and custom tags.

Banking API

Plaid / Stripe

Securely connect and access bank transaction data.

AI/ML

Custom model or External Service

Transaction parsing and automated tagging suggestions.

🔒 Data Persistence

All user transactions, custom tags, budget allocations, and automation rules are stored securely in a database, ensuring that all financial data and configuration persist across sessions.

🚀 Getting Started

Prerequisites: (To be defined)

Installation: (To be defined)
=======
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
>>>>>>> master
