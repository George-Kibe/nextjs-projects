# Innercore Geoconsultants

A small CRUD app for **borehole** and **mineral** records, built with Next.js (App Router route handlers) and MongoDB Atlas.

Boreholes and minerals are separate models (`boreholes` and `minerals` collections) with the same fields:
an ID (Borehole ID / Mineral ID), latitude, longitude, elevation (m asl), depth (m), formation,
yield (m³/h), location, county (one of Kenya's 47) and country (Kenya). Minerals also have a required
**name** (e.g. Gold, Fluorspar).

Kind-specific fields are declared as `extraFields` in `lib/kinds.ts`; the schema, validation, API search and
sorting, form, table, detail page and map popup all pick them up from there.

## Setup

1. Create a free **M0** cluster on [MongoDB Atlas](https://www.mongodb.com/atlas). Add a database user and,
   under *Network Access*, allow your IP (or `0.0.0.0/0` if you deploy to a host with changing IPs).
2. Copy the env template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   | Variable         | Purpose                                                         |
   | ---------------- | --------------------------------------------------------------- |
   | `MONGODB_URI`    | Atlas connection string, e.g. `mongodb+srv://…/boreholes?…`      |
   | `ADMIN_PASSWORD` | Password needed to create, edit and delete records              |
   | `AUTH_SECRET`    | Random string that signs the login cookie (`openssl rand -hex 32`) |

3. Run it:

   ```bash
   npm install
   npm run dev
   ```

To load sample data for testing (BH-001 to BH-010 and MN-001 to MN-010, across different counties):

```bash
npm run seed                          # insert or update samples of both kinds; safe to run again
npm run seed -- --kind=minerals       # only one kind (boreholes or minerals)
npm run seed -- --reset               # delete ALL records of the seeded kind(s) first
```

Anyone can view the list, map and detail pages, and switch between boreholes and minerals with the
switch at the top (`?kind=minerals` in the URL). **Log in** with `ADMIN_PASSWORD` to add, edit or delete records.

## API

The same endpoints exist for both kinds: replace `:kind` with `boreholes` or `minerals`.

| Method   | Route                 | Auth | Description                          |
| -------- | --------------------- | ---- | ------------------------------------ |
| `GET`    | `/api/:kind`          |      | List (see query params below)        |
| `POST`   | `/api/:kind`          | ✓    | Create                               |
| `GET`    | `/api/:kind/:id`      |      | Get one                              |
| `PUT`    | `/api/:kind/:id`      | ✓    | Update (all fields)                  |
| `DELETE` | `/api/:kind/:id`      | ✓    | Delete                               |
| `POST`   | `/api/auth/login`     |      | `{ "password": "…" }` sets a cookie  |
| `POST`   | `/api/auth/logout`    |      | Clears the cookie                    |

The ID field is `boreholeId` for boreholes and `mineralId` for minerals; minerals also require `name`.

List query params: `q` (search), `county`, `sort` (the ID field, `location`, `county`, `formation`,
`depth`, `yield`, `elevation`, `createdAt`), `order` (`asc`/`desc`), `page`, `limit` (max 100), `all=1` (no paging, up to 5000; used by the map).

Validation errors return `400` with a `fields` object; a duplicate ID returns `409`.

## Project layout

```
lib/kinds.ts              the two record kinds (labels, ID field, map colour)
lib/models/siteSchema.ts  shared Mongoose schema; Borehole.ts and Mineral.ts build their models from it
lib/crud.ts               generic CRUD route handlers, wired up in app/api/boreholes and app/api/minerals
lib/validation.ts         shared validation (API + form)
lib/db.ts                 cached MongoDB connection
app/[kind]/…              detail, new and edit pages for both kinds
proxy.ts                  redirects logged-out users away from create/edit pages
components/               table, form, detail, kind switch and map (Leaflet + OpenStreetMap)
```
