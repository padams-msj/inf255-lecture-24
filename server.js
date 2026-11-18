import express from "express";
import { DatabaseSync } from "node:sqlite";

const app = express();
const port = 3000;
const db = new DatabaseSync("shelter.db");

// Turns a JSON request body into the req.body object.
app.use(express.json());

/*
 * checkAnimal(animal)
 *
 * Checks an animal's name, species, and age before it's saved.
 * Used by POST /api/animals and PATCH /api/animals/:id.
 *
 * Returns: the error message for the first problem it finds,
 *          or "" if there are no problems
 */
function checkAnimal(animal) {
  if (!animal.name || animal.name.trim() === "") {
    return "Name is required";
  }

  const allSpecies = ["Dog", "Cat", "Rabbit", "Guinea pig"];
  if (!allSpecies.includes(animal.species)) {
    return "Species must be Dog, Cat, Rabbit, or Guinea pig";
  }

  if (!Number.isInteger(animal.age) || animal.age < 0) {
    return "Age must be a whole number, 0 or more";
  }

  return "";
}

/*
 * GET /
 *
 * A test route, to check that the server is running.
 *
 * Sends: 200, the text "Hello from the server!"
 */
app.get("/", (req, res) => {
  console.log(req.method, req.url);
  res.send("Hello from the server!");
});

/*
 * GET /api/animals
 *
 * Sends every animal in the database.
 *
 * Sends: 200, an array of animals
 */
app.get("/api/animals", (req, res) => {
  const animals = db.prepare("SELECT * FROM animals").all();
  res.json(animals);
});

/*
 * GET /api/animals/:id
 *
 * Sends one animal.
 *
 * Example: GET /api/animals/3
 *
 * Sends: 200, the animal
 *        404, { error } if there's no animal with that id
 */
app.get("/api/animals/:id", (req, res) => {
  const id = Number(req.params.id);
  const animal = db.prepare("SELECT * FROM animals WHERE id = ?").get(id);
  if (!animal) {
    res.status(404).json({ error: "Animal not found" });
    return;
  }
  res.json(animal);
});

/*
 * POST /api/animals
 *
 * Adds a new animal.
 *
 * Body: { name, species, age, adopted }
 *
 * Sends: 201, { message } like "Added Ziggy."
 *        400, { error } if checkAnimal finds a problem. Nothing is saved.
 */
app.post("/api/animals", (req, res) => {
  const animal = req.body;
  const problem = checkAnimal(animal);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }

  db.prepare(
    "INSERT INTO animals (name, species, age, adopted) VALUES (?, ?, ?, ?)"
  ).run(animal.name, animal.species, animal.age, animal.adopted ? 1 : 0);

  res.status(201).json({ message: "Added " + animal.name + "." });
});

/*
 * PATCH /api/animals/:id
 *
 * Changes some of an animal's data. Only the fields in the body change.
 * The rest keep their saved values.
 *
 * Example: PATCH /api/animals/3 with { adopted: true }
 *
 * Body: any of { name, species, age, adopted }
 *
 * Sends: 200, the saved animal
 *        404, { error } if there's no animal with that id
 *        400, { error } if checkAnimal finds a problem. Nothing is saved.
 */
app.patch("/api/animals/:id", (req, res) => {
  const id = Number(req.params.id);
  const animal = db.prepare("SELECT * FROM animals WHERE id = ?").get(id);
  if (!animal) {
    res.status(404).json({ error: "Animal not found" });
    return;
  }

  if (req.body.name !== undefined) {
    animal.name = req.body.name;
  }
  if (req.body.species !== undefined) {
    animal.species = req.body.species;
  }
  if (req.body.age !== undefined) {
    animal.age = req.body.age;
  }
  if (req.body.adopted !== undefined) {
    animal.adopted = req.body.adopted;
  }

  const problem = checkAnimal(animal);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }

  db.prepare(
    "UPDATE animals SET name = ?, species = ?, age = ?, adopted = ? WHERE id = ?"
  ).run(animal.name, animal.species, animal.age, animal.adopted ? 1 : 0, id);

  const saved = db.prepare("SELECT * FROM animals WHERE id = ?").get(id);
  res.json(saved);
});

/*
 * DELETE /api/animals/:id
 *
 * Deletes an animal. Adopted animals can't be deleted, so the shelter
 * keeps its adoption records.
 *
 * Example: DELETE /api/animals/5
 *
 * Sends: 204, no body
 *        404, { error } if there's no animal with that id
 *        400, { error } if the animal is adopted
 */
app.delete("/api/animals/:id", (req, res) => {
  const id = Number(req.params.id);
  const animal = db.prepare("SELECT * FROM animals WHERE id = ?").get(id);
  if (!animal) {
    res.status(404).json({ error: "Animal not found" });
    return;
  }
  if (animal.adopted) {
    res.status(400).json({ error: "Adopted animals can't be deleted" });
    return;
  }
  db.prepare("DELETE FROM animals WHERE id = ?").run(id);
  res.status(204).end();
});

/*
 * GET /api/shelter
 *
 * Sends the shelter's details. The name comes from SHELTER_NAME in .env.
 *
 * Sends: 200, { name, city, phone }
 */
app.get("/api/shelter", (req, res) => {
  const shelter = {
    name: process.env.SHELTER_NAME,
    city: "Cincinnati",
    phone: "513-555-0142",
  };
  res.json(shelter);
});

/*
 * GET /api/available
 *
 * Sends only the animals that aren't adopted.
 *
 * Sends: 200, an array of animals
 */
app.get("/api/available", (req, res) => {
  const animals = db
    .prepare("SELECT * FROM animals WHERE adopted = 0")
    .all();
  res.json(animals);
});

/*
 * GET /api/stats
 *
 * Sends how many animals there are, and how many are adopted.
 *
 * Sends: 200, { total, adopted }
 */
app.get("/api/stats", (req, res) => {
  const total = db
    .prepare("SELECT COUNT(*) AS count FROM animals")
    .get().count;
  const adopted = db
    .prepare("SELECT COUNT(*) AS count FROM animals WHERE adopted = 1")
    .get().count;
  res.json({ total, adopted });
});

/*
 * GET /api/species/:species
 *
 * Sends the animals of one species. Capitalization doesn't matter.
 *
 * Example: GET /api/species/dog
 *
 * Sends: 200, an array of animals. [] if none match.
 */
app.get("/api/species/:species", (req, res) => {
  const animals = db
    .prepare("SELECT * FROM animals WHERE lower(species) = lower(?)")
    .all(req.params.species);
  res.json(animals);
});

// Start the server.
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
