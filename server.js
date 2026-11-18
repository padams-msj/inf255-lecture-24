import express from "express";
import { DatabaseSync } from "node:sqlite";

const app = express();
const port = 3000;
const db = new DatabaseSync("shelter.db");

app.use(express.json());

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

app.get("/", (req, res) => {
  console.log(req.method, req.url);
  res.send("Hello from the server!");
});

app.get("/api/animals", (req, res) => {
  const animals = db.prepare("SELECT * FROM animals").all();
  res.json(animals);
});

app.get("/api/animals/:id", (req, res) => {
  const id = Number(req.params.id);
  const animal = db.prepare("SELECT * FROM animals WHERE id = ?").get(id);
  if (!animal) {
    res.status(404).json({ error: "Animal not found" });
    return;
  }
  res.json(animal);
});

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

app.get("/api/shelter", (req, res) => {
  const shelter = {
    name: process.env.SHELTER_NAME,
    city: "Cincinnati",
    phone: "513-555-0142",
  };
  res.json(shelter);
});

app.get("/api/available", (req, res) => {
  const animals = db
    .prepare("SELECT * FROM animals WHERE adopted = 0")
    .all();
  res.json(animals);
});

app.get("/api/stats", (req, res) => {
  const total = db
    .prepare("SELECT COUNT(*) AS count FROM animals")
    .get().count;
  const adopted = db
    .prepare("SELECT COUNT(*) AS count FROM animals WHERE adopted = 1")
    .get().count;
  res.json({ total, adopted });
});

app.get("/api/species/:species", (req, res) => {
  const animals = db
    .prepare("SELECT * FROM animals WHERE lower(species) = lower(?)")
    .all(req.params.species);
  res.json(animals);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
