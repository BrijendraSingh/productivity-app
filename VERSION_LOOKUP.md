# Package Version Lookup Table

> Generated: February 18, 2026
> Purpose: Verified latest stable versions for REQUIREMENTS_AND_FEATURES.txt rewrite (Agent D)

## Changes from Original Spec

| Original Spec | Problem | Corrected To |
|---|---|---|
| React 19.1.1 | React 19 not stable | React 18.3.1 |
| Create React App | Deprecated | Vite 7.3.1 |
| TypeScript 4.9.5 (frontend) | Outdated, mismatched with backend | TypeScript 5.9.3 (unified) |
| TypeScript 5.9.2 (backend) | Minor version behind | TypeScript 5.9.3 (unified) |
| Express 5.1.0 | v5 not intended per plan | Express 4.22.1 |
| MUI v7.3.1 | v7 not intended per plan | MUI v6.5.0 |
| dotenv 17.2.1 | v17 not intended per plan | dotenv 16.6.1 |
| node:18-alpine (Docker) | Outdated LTS | node:20-alpine |
| bcryptjs 3.0.2 | Slightly behind | bcryptjs 3.0.3 |
| express-rate-limit 8.0.1 | Behind | express-rate-limit 8.2.1 |
| express-validator 7.2.1 | Behind | express-validator 7.3.1 |
| concurrently 8.2.2 | Behind (major bump) | concurrently 9.2.1 |
| React Router DOM 7.8.1 | Behind | React Router DOM 7.13.0 |
| Recharts 3.1.2 | Behind | Recharts 3.7.0 |
| Framer Motion 12.23.12 | Behind | Framer Motion 12.34.1 |
| @uiw/react-md-editor 4.0.8 | Behind | @uiw/react-md-editor 4.0.11 |
| nodemon 3.1.10 | Behind | nodemon 3.1.11 |

## Full Version Lookup Table

### Build Tools & Dev Tooling

| Package | Version | Category |
|---|---|---|
| vite | 7.3.1 | build tool (replaces CRA) |
| @vitejs/plugin-react | 5.1.4 | vite plugin |
| typescript | 5.9.3 | language (unified FE + BE) |
| nodemon | 3.1.11 | dev tool |
| ts-node | 10.9.2 | dev tool |
| concurrently | 9.2.1 | dev tool (root workspace) |

### Frontend Dependencies

| Package | Version | Category |
|---|---|---|
| react | 18.3.1 | framework |
| react-dom | 18.3.1 | framework |
| react-router-dom | 7.13.0 | routing |
| @mui/material | 6.5.0 | UI library |
| @mui/icons-material | 6.5.0 | UI icons |
| @mui/lab | 6.0.1-beta.36 | UI lab components (always beta) |
| @mui/x-date-pickers | 7.23.6 | date pickers (MUI X, compatible with MUI v6) |
| @emotion/react | 11.14.0 | CSS-in-JS |
| @emotion/styled | 11.14.1 | CSS-in-JS |
| @uiw/react-md-editor | 4.0.11 | markdown editor |
| recharts | 3.7.0 | charts |
| framer-motion | 12.34.1 | animations |
| date-fns | 4.1.0 | date utilities |
| @date-io/date-fns | 3.2.1 | date adapter for MUI pickers |

### Backend Dependencies

| Package | Version | Category |
|---|---|---|
| express | 4.22.1 | web framework |
| sqlite3 | 5.1.7 | database driver |
| bcryptjs | 3.0.3 | password hashing |
| helmet | 8.1.0 | security headers |
| cors | 2.8.6 | CORS middleware |
| express-rate-limit | 8.2.1 | rate limiting |
| express-validator | 7.3.1 | input validation |
| morgan | 1.10.1 | HTTP logging |
| compression | 1.8.1 | response compression |
| dotenv | 16.6.1 | environment variables |

### Infrastructure

| Item | Value | Notes |
|---|---|---|
| Docker base image | node:20-alpine | Node.js 20 LTS |
| Docker Compose | v3.8 | compose file version |

## Verification Notes

- **React 18.3.1**: Confirmed on npm registry. Functionally identical to 18.2 but adds deprecation warnings for React 19 prep.
- **Vite 7.3.1**: Latest stable. Vite 8.0 is in beta (do not use).
- **Express 4.22.1**: Latest 4.x release (Dec 2025). Express 5.2.1 exists but plan specifies 4.x.
- **MUI 6.5.0**: Latest v6 stable (Jul 2025). MUI v7.3.8 exists but plan specifies v6.
- **@mui/lab 6.0.1-beta.36**: Lab package only has beta releases in v6 line. This is normal — lab components are experimental by design.
- **@mui/x-date-pickers 7.23.6**: MUI X follows its own versioning (separate from MUI core). v7.23.6 peer deps: `@mui/material: ^5.15.14 || ^6.0.0`. Fully compatible with MUI v6.
- **dotenv 16.6.1**: Latest 16.x (Jun 2025). 17.x exists but plan specifies 16.x.
- **React Router DOM 7.13.0**: v7 is latest stable, non-breaking upgrade from v6.
- **TypeScript 5.9.3**: Latest stable. TS 6.0 is in beta (do not use).
- **cors 2.8.6**: First update in 6 years (from 2.8.5), released Jan 2026.
- **sqlite3 5.1.7**: Bundles SQLite 3.44.2. No newer npm release despite SQLite 3.51.2 being available.
