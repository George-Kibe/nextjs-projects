# Innercore Boreholes

A small CRUD app for borehole records, built with Next.js (App Router route handlers) and MongoDB Atlas.

Each borehole stores: Borehole ID, latitude, longitude, elevation (m asl), depth (m), formation,
yield (m³/h), location, county (one of Kenya's 47) and country (Kenya).

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
   | `ADMIN_PASSWORD` | Password needed to create, edit and delete boreholes            |
   | `AUTH_SECRET`    | Random string that signs the login cookie (`openssl rand -hex 32`) |

3. Run it:

   ```bash
   npm install
   npm run dev
   ```

To load 10 sample boreholes (BH-001 to BH-010, across different counties) for testing:

```bash
npm run seed              # insert or update the samples; safe to run again
npm run seed -- --reset   # delete ALL boreholes first, then insert the samples
```

Anyone can view the list, map and detail pages. **Log in** with `ADMIN_PASSWORD` to add, edit or delete boreholes.

## API

| Method   | Route                 | Auth | Description                          |
| -------- | --------------------- | ---- | ------------------------------------ |
| `GET`    | `/api/boreholes`      |      | List (see query params below)        |
| `POST`   | `/api/boreholes`      | ✓    | Create                               |
| `GET`    | `/api/boreholes/:id`  |      | Get one                              |
| `PUT`    | `/api/boreholes/:id`  | ✓    | Update (all fields)                  |
| `DELETE` | `/api/boreholes/:id`  | ✓    | Delete                               |
| `POST`   | `/api/auth/login`     |      | `{ "password": "…" }` sets a cookie  |
| `POST`   | `/api/auth/logout`    |      | Clears the cookie                    |

List query params: `q` (search), `county`, `sort` (`boreholeId`, `location`, `county`, `formation`,
`depth`, `yield`, `elevation`, `createdAt`), `order` (`asc`/`desc`), `page`, `limit` (max 100), `all=1` (no paging, up to 5000; used by the map).

Validation errors return `400` with a `fields` object; a duplicate Borehole ID returns `409`.

## Project layout

```
app/api/boreholes/…     route handlers (CRUD)
app/api/auth/…          login / logout
lib/models/Borehole.ts  Mongoose model
lib/validation.ts       shared validation (API + form)
lib/db.ts               cached MongoDB connection
proxy.ts                redirects logged-out users away from create/edit pages
components/             table, form, detail and map (Leaflet + OpenStreetMap)
```
