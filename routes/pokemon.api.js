var express = require("express");
var router = express.Router();
const fs = require("fs");

const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];

/* GET pokemons listing. */
router.get("/", (req, res, next) => {
  //----------------------input validation----------------------
  const allowedFilter = ["name", "type", "page", "limit"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    //allow name, type,limit and page query string only
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });
    //----------------------processing logic----------------------
    //Number of items skip for selection
    let offset = limit * (page - 1);

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");

    db = JSON.parse(db);
    const { data } = db;
    //Filter data by title
    let result = [];
    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        if (condition === "type") {
          result = result.length
            ? result.filter((pokemon) =>
                pokemon[condition].includes(filterQuery[condition])
              )
            : data.filter((pokemon) =>
                pokemon[condition].includes(filterQuery[condition])
              );
        } else {
          result = result.length
            ? result.filter(
                (pokemon) => pokemon[condition] === filterQuery[condition]
              )
            : data.filter(
                (pokemon) => pokemon[condition] === filterQuery[condition]
              );
        }
      });
    } else {
      result = data;
    }
    //then select number of result by offset
    result = result.slice(offset, offset + limit);
    //----------------------send response----------------------
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/* GET single pokemon info. */
router.get("/:id", (req, res, next) => {
  //----------------------input validation----------------------
  try {
    const { id } = req.params;
    //----------------------processing logic----------------------
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    let result = [];

    if (parseInt(id) > data.length || parseInt(id) < 0) {
      const exception = new Error(`Pokemon ID is not found`);
      exception.statusCode = 401;
      throw exception;
    }

    let pokemon;
    pokemon = data.filter(
      (p) =>
        p.id === parseInt(id) ||
        p.id - 1 === parseInt(id) ||
        p.id + 1 === parseInt(id)
    );

    if (pokemon.length < 3) {
      if (pokemon[0].id <= 2) {
        pokemon.push(data[data.length - 1]);
      } else if (pokemon[0].id > data.length - 2) {
        pokemon.push(data[0]);
      }
    }

    result = {
      previousPokemon: pokemon[0],
      pokemon: pokemon[1],
      nextPokemon: pokemon[2],
    };
    //----------------------send response----------------------
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/* POST a new pokemon */
router.post("/", (req, res, next) => {
  //----------------------input validation----------------------

  //----------------------processing logic----------------------
  //check missing required data
  try {
    const { name, id, url, type } = req.body;
    if (!name || !id || !url || !type) {
      const exception = new Error(`Missing body info`);
      exception.statusCode = 401;
      throw exception;
    }

    //check type length > 2
    if (type.length > 2) {
      const exception = new Error(`Length of type is smaller than 3`);
      exception.statusCode = 401;
      throw exception;
    }

    //check invalid type
    for (let i = 0; i < type.length; i++) {
      if (!pokemonTypes.includes(type[i])) {
        const exception = new Error(`Type is invalid`);
        exception.statusCode = 401;
        throw exception;
      }
    }

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    //The Pokémon already exists.” (if id or name exists in the database)
    let duplicatePokemon;
    duplicatePokemon = data.filter(
      (pokemon) => pokemon.id === parseInt(id) || pokemon.name === "name"
    );
    if (duplicatePokemon.length > 0) {
      const exception = new Error(`Id or Name exists in the database`);
      exception.statusCode = 401;
      throw exception;
    }
    let result = { id: parseInt(id), name, type, url };
    data.push(result);
    db.data = data;
    db.totalPokemons = data.length;
    //db JSobject to JSON string
    db = JSON.stringify(db);
    //write and save to db.json
    fs.writeFileSync("db.json", db);
    //----------------------send response----------------------
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
