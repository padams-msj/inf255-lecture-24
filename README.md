# lecture-24

INF255 starter for Lecture 25: the Animal Shelter app as it stood at the end of Lecture 24. Animals can be added, edited, toggled, and deleted, every change is saved in the database, animals can have a breed, and the shelter's name comes from `.env`.

## Setup

You need Node.js 22.18 or newer.

1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env`
4. Run `node seed.js`

Start the server in one terminal:

```sh
npm run server
```

Start the app in a second terminal:

```sh
npm run dev
```

Open the address that Vite shows, like http://localhost:5173

Run `node seed.js` again at any time to reset the database to the original 6 animals.
