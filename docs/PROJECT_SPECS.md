# Project Specs — My App

## Overview

<!-- Describe what your app does in 2-3 sentences -->
My App is a [describe your app]. It [key value proposition]. Built entirely on Cloudflare's free/cheap tier.

---

## Core Features

1. **[Feature 1]** — description
   - Sub-point
   - Status: ⏳ planned

2. **[Feature 2]** — description
   - Status: ⏳ planned

3. **[Feature 3]** — description
   - Status: ⏳ planned

---

## Data Model (conceptual)

- **Items**: name, description, status, timestamps
  - Replace with your actual entities

---

## Non-functional

- Mobile-responsive
- Data stored in Cloudflare's default region
- Target cost: free tier (Workers, D1, R2, Pages); optional paid AI

---

## Rules

<!-- Add project-specific invariants here, e.g.: -->
- Every monetary value must display with a currency symbol
- Every new table must use `useSortFilter` + `SortTh` + `FilterInput`
- Secrets never go in source code — always `wrangler secret put` or `.dev.vars`
