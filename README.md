# StockSense

> **Inventory management, designed around real stock movement.**

StockSense is our approach to the inventory management problem from the Odoo Hackathon. We are building it as a practical system rather than treating inventory as just a list of products and quantities.

## What We Understand

The core problem is maintaining a reliable picture of:

- **What** stock exists
- **How much** is available
- **Where** it is located
- **What changed** and why
- **What needs attention** (low stock, pending operations, etc.)

The important part for us is the relationship between **inventory state and inventory operations**. A receipt, delivery, transfer, or adjustment should not just create a record — it should correctly affect stock and remain traceable.

## Our Approach

We are currently breaking the system into a few clear areas:

```text
                    StockSense
                        │
        ┌───────────────┼───────────────┐
        │               │               │
     Products       Operations       Locations
                        │
             ┌──────────┼──────────┐
             │          │          │
          Receipts   Deliveries  Transfers
                        │
                   Adjustments
                        │
                  Stock Ledger
                        │
                    Dashboard
```

The stock ledger is an important part of our design. We want every meaningful stock change to be explainable instead of only storing the latest quantity.

## Initial Thinking

We are currently exploring:

- Product and SKU management
- Warehouse/location-based stock
- Receipt and delivery workflows
- Internal stock transfers
- Physical stock adjustments
- Low-stock/reorder rules
- Operation statuses and validation
- A searchable and filterable dashboard
- A history/ledger for stock movements

The exact data model and workflow rules will be finalized as we work through the edge cases.

## Architecture

We are aiming for a modular architecture where the UI, business logic, and data layer have clear responsibilities.

```text

            UI
            ↓
    Application / API Layer
            ↓
    Inventory Business Logic
            ↓
        Data Layer
            ↓
        Database

```

We especially want inventory rules to stay independent from the UI so that stock calculations and validations remain consistent throughout the application.

## Tech Stack

We are building StockSense using the **MERN stack**, with a few supporting technologies where they add value.

### Core Stack

- **MongoDB** — Database for users, products, warehouses, inventory records, operations, and stock history
- **Express.js** — Backend API layer and request handling
- **React.js** — Frontend application and dashboard
- **Node.js** — Backend runtime

### Supporting Technologies

- **JWT / HTTP-only cookies** — Authentication and session handling
- **REST APIs** — Communication between the frontend and backend
- **Mongoose** — MongoDB schema modelling and database interaction
- **Tailwind CSS** — UI styling and responsive layouts
- **Git & GitHub** — Version control and team collaboration

## Team

We are a team of 4 developers, working collaboratively across architecture, frontend, backend, data modelling, and integration.

Responsibilities may overlap as the project evolves rather than being treated as four completely separate modules.

## Current Status

Phase: Planning & Architecture

Currently we are:

- Breaking down the problem
- Mapping the main inventory workflows
- Identifying core entities
- Discussing stock and ledger behaviour
- Exploring the architecture
- Evaluating the technology stack

Next, we plan to turn these decisions into the initial data model, project structure, and working application foundation.