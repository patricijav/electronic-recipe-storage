# Electronic recipe storage

![all_screens](https://github.com/user-attachments/assets/55100d6d-29ec-4f30-b331-66581653c399)


# Usage

Get the database up and running:

- Create the necessary tables by running `queries.sql` on your PostgreSQL (pgAdmin 4);
- The credentials currently aren't hidden as this is a local project for now, so when you create your database, update `server/index.js` to match your port, database name, etc.

On terminal one run back-end:

```
cd server/
npm install
node index.js
```

On terminal two run front-end:

```
cd client/
npm install
npm run dev
```
