# Planer

**Planer** is a production planning and workload scheduling system for manufacturing teams.

The project is designed as an MVP of a mini-MES / production planning platform. It helps production teams calculate the fastest possible way to manufacture an item based on real operational constraints: worker skills, production center capacity, schedules, current workload, operation duration, and dependencies between tasks.

The system was created independently from idea to production: product logic, architecture, frontend, backend, database structure, scheduling logic, optimization, deployment, and production setup.

The project is deployed in production on **DigitalOcean** and is ready for real MVP usage.

---

## Purpose

Planer helps manufacturing teams answer one of the most important operational questions:

> When exactly can this item be produced, and what is the fastest realistic production plan?

Instead of planning manually in spreadsheets or guessing workload by eye, the system calculates and visualizes production workload on a scalable timeline.

It allows teams to see:

- what is already planned;
- which production centers are overloaded;
- which resources are underused;
- when each detail or order item is expected to be completed;
- how changes affect the full production plan.

---

## Key Product Value

Planer is not just a task board. It is a production-oriented planning system with scheduling logic.

The system can automatically suggest the fastest available production plan while taking into account:

- worker skills;
- production center availability;
- current workload;
- team working schedule;
- operation duration;
- pauses between operations;
- order structure;
- dependencies between tasks;
- time zone of the production team.

This makes the project useful for real production environments where the main problem is not only to store tasks, but to understand realistic execution capacity.

---

## Unique Features

### Smart Production Scheduling

The system automatically proposes the fastest possible manufacturing plan for an item based on real constraints.

It considers:

- available workers;
- worker skills;
- production centers;
- planned workload;
- working calendar;
- operation sequence;
- operation duration;
- time gaps between operations.

As a result, the team always has a calculated planned completion date and time.

---

### Team Time Zone Logic

Each production team is linked to its own working time zone.

All planning, scheduling, workload calculation, and task execution logic are based on the team time zone, not on the browser or device time zone.

This is important for distributed teams, remote management, and production units working in different locations.

---

### Individual Operation Configuration

Operations can be configured individually.

The system supports:

- custom operation duration;
- custom pauses between operations;
- different operation sequences;
- different execution logic depending on the production process.

This allows the system to model real manufacturing workflows instead of forcing the company into a fixed generic template.

---

### Scalable Timeline Visualization

Production workload is displayed on a scalable timeline.

The user can visually see:

- planned tasks;
- workload by day;
- workload by production center;
- bottlenecks;
- underloaded areas;
- available capacity;
- task distribution over time.

This gives production managers a clear operational picture without needing to analyze complex tables manually.

---

### Live Replanning

The system supports operational changes during the production process.

Users can:

- cancel planned tasks;
- move tasks;
- replan workload;
- update the production plan on the fly;
- react to real production changes;
- adjust the plan without rebuilding everything manually.

This is important because production rarely follows the original plan perfectly.

---

### Defect and Rework Handling

The system includes logic for handling production defects and corrective operations.

It supports:

- defect registration;
- rework operations;
- additional corrective tasks;
- control of production status;
- tracking of how defects affect execution.

This makes the planning model closer to real manufacturing, where quality control and rework are part of the process.

---

### Outsourcer Support

Planer can include work with external contractors and outsourced operations.

This allows production teams to model not only internal workload, but also parts of the process that are transferred outside the company.

---

### Real-Time Worker Tasks

Workers can receive individual tasks in real time directly in the browser, including from a mobile phone.

This makes the system useful not only for office planning, but also for shop-floor execution.

The goal is to connect planning and real production work in one flow.

---

### Real-Time KPI and Progress Reports

The system provides reporting for:

- production deadlines;
- order progress;
- percentage of order completion;
- task execution;
- workload status;
- performance indicators;
- real-time production state.

Managers can track how the order is progressing without waiting for manual reports.

---

## Competitive Advantages

The system is especially useful for small and medium manufacturing companies that need more control than spreadsheets provide, but do not want to implement a large and expensive enterprise MES/ERP system.

---

## Technical Overview

Planer is a full-stack web application built with a modern production-oriented stack.

The project demonstrates senior-level engineering skills across:

- frontend architecture;
- backend API design;
- database modeling;
- authorization;
- performance optimization;
- production deployment;
- state management;
- business logic implementation;
- manufacturing process modeling.

---

## Tech Stack

The project is built with:

- **Next.js**
- **React**
- **TypeScript**
- **Redux Toolkit**
- **React Redux**
- **Redux Persist**
- **PostgreSQL**
- **TypeORM**
- **JWT authentication**
- **SCSS / Sass**
- **i18next**
- **Zod**
- **Nodemailer / SendGrid**
- **Framer Motion**
- **DigitalOcean deployment**

Main technical areas:

- full-stack application architecture;
- REST/API routes;
- server-side business logic;
- database migrations;
- protected routes;
- middleware-level security;
- optimized frontend rendering;
- scalable timeline UI;
- real-time-style operational updates.

---

## Frontend Architecture and Optimization

The frontend is optimized for complex production planning screens where many calculated entities can appear on the timeline.

Special attention is paid to performance:

- unnecessary recalculations are reduced with memoization;
- expensive daily workload calculations are cached through React optimization patterns such as `useMemo`;
- only the visible part of the timeline is rendered into the DOM;
- invisible days are excluded from rendering instead of displaying the full array at once;
- the UI is designed to support a large planning horizon;
- timeline rendering is optimized for scalability;
- state updates are managed through Redux to keep the application predictable.

This is important because production planning screens can become heavy very quickly when many resources, days, operations, and tasks are displayed at the same time.

---

## Backend and Data Layer

The backend is responsible for business logic, data persistence, authentication, and production planning operations.

The backend includes:

- API routes;
- PostgreSQL database;
- TypeORM data models;
- database migrations;
- JWT-based authentication;
- middleware-level access protection;
- structured services and handlers;
- server-side validation;
- production-oriented persistence logic.

The backend is not just a simple CRUD layer. It supports planning logic, user authorization, schedule-related operations, task updates, and production workflow state.

---

## Security

The project includes protected access logic based on authentication.

Security-related parts include:

- JWT authorization;
- protected API routes;
- middleware-level checks;
- separation between client-side and server-side logic;
- controlled access to production data;
- server-side handling of sensitive operations.

---

## State Management

The application uses Redux Toolkit for predictable state management.

Redux is used to manage complex application state related to:

- user session;
- production entities;
- planning data;
- UI state;
- selected resources;
- timeline interaction;
- operational updates.

This approach makes the application easier to scale and maintain as the planning logic grows.

---

## Project Structure

```txt
planer/
├── components/              # Reusable UI components and production screens
├── db/                      # Database configuration, models and migrations
├── handlers/                # Server-side request handlers
├── job/                     # Job-related logic
├── lib/                     # Shared utilities and infrastructure logic
├── pages/                   # Next.js pages and API routes
├── public/                  # Static assets
├── services/                # Business logic and API services
├── store/                   # Redux store, slices and hooks
├── styles/                  # Global styles and SCSS files
├── types/                   # TypeScript types and domain models
├── next.config.mjs          # Next.js configuration
├── package.json             # Scripts and dependencies
└── tsconfig.json            # TypeScript configuration
```

---

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the application in the browser:

```txt
http://localhost:3000
```

Build the project:

```bash
npm run build
```

Run production build locally:

```bash
npm run start
```

Run linting:

```bash
npm run lint
```

---

## Database and Migrations

The project uses PostgreSQL and TypeORM.

Available migration scripts include:

```bash
npm run migration:create
npm run migration:generate
npm run migration:run
npm run migration:show
npm run migration:revert
```

For production migration execution:

```bash
npm run migration:run:prod
```

---

## Production Status

The project is deployed on **DigitalOcean** and works as a production-ready MVP.

Current status:

- MVP is implemented;
- production deployment is configured;
- core planning logic is working;
- frontend and backend are connected;
- database layer is implemented;
- authentication is implemented;
- system is ready for demonstration and controlled real usage.

---

## Business Use Cases

Planer can be used by:

- small manufacturing companies;
- workshops;
- production teams;
- custom manufacturing businesses;
- companies with multi-step production processes;
- teams that need workload planning;
- teams that need deadline visibility;
- companies that currently plan production in spreadsheets.

Typical use cases:

- calculate the fastest production plan;
- assign operations to workers and production centers;
- monitor workload;
- detect bottlenecks;
- track order progress;
- replan tasks when production changes;
- manage defects and rework;
- provide workers with individual tasks;
- monitor KPI and production deadlines.

---

## Why This Project Matters

Many production teams still plan work manually.

This often leads to:

- unclear deadlines;
- overloaded workers;
- idle production centers;
- missed bottlenecks;
- manual recalculation after every change;
- lack of real-time visibility;
- weak connection between planning and execution.

Planer solves this by connecting production logic, scheduling, workload visualization, and execution tracking in one web application.

---

## Development Notes

This project was created independently.

The full product was designed and developed by one developer, including:

- product concept;
- business logic;
- manufacturing workflow modeling;
- frontend implementation;
- backend implementation;
- database design;
- authentication;
- performance optimization;
- production deployment;
- UI/UX decisions;
- testing and iteration.

The project demonstrates the ability to build a complex SaaS-style business application from scratch.

---

## License and Usage

This project is available for review and non-commercial use only.

Commercial use, copying, redistribution, resale, implementation for clients, or use inside a business process requires written permission from the author.

For commercial licensing or collaboration, please contact:

```txt
ip.portu.me@gmail.com
```

---

## Author

Created by **Natalia Barinova**.

Full-stack developer with experience in business process automation, manufacturing systems, enterprise software, SaaS products, React, Next.js, TypeScript, Node.js, PostgreSQL, and full-cycle product development.

This project represents practical experience in building real business software, not only interface prototypes.
