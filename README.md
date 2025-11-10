# BudgetAppCSCE361
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

Frontend

React / Angular / Modern HTML, CSS, JS

Highly interactive and responsive user interface.

Backend

Node.js / Python (Flask/Django)

Business logic, API handling, and AI integration.

Database

Firestore / PostgreSQL / MongoDB

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
