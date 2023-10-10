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
    const { data, totalPokemons } = db;
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
    let pokemonList = result.slice(offset, offset + limit);
    //then select number of result by offset
    result = { data: pokemonList, count: pokemonList.length, totalPokemons };

    //----------------------send response----------------------
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/* GET single pokemon info. */
router.get("/:pokemonId", (req, res, next) => {
  //----------------------input validation----------------------
  try {
    const { pokemonId } = req.params;
    //----------------------processing logic----------------------
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    let result = {};

    if (parseInt(pokemonId) < 0) {
      const exception = new Error(`Pokemon ID is not found`);
      exception.statusCode = 401;
      throw exception;
    }

    const targetIndex = data.findIndex((pokemon) => pokemon.id === pokemonId);
    if (targetIndex === -1) {
      result = {};
    } else if (targetIndex === 0) {
      result = {
        data: {
          previousPokemon: data[data.length - 1],
          pokemon: data[targetIndex],
          nextPokemon: data[targetIndex + 1],
        },
      };
    } else if (targetIndex === data.length - 1) {
      result = {
        data: {
          previousPokemon: data[targetIndex - 1],
          pokemon: data[targetIndex],
          nextPokemon: data[0],
        },
      };
    } else {
      result = {
        data: {
          previousPokemon: data[targetIndex - 1],
          pokemon: data[targetIndex],
          nextPokemon: data[targetIndex + 1],
        },
      };
    }

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
    const { name, id, url, types } = req.body;
    if (!name || !id || !url || !types) {
      const exception = new Error(`Missing body info`);
      exception.statusCode = 401;
      throw exception;
    }

    //check type length > 2
    if (types.length > 2) {
      const exception = new Error(`Length of type is smaller than 3`);
      exception.statusCode = 401;
      throw exception;
    }

    //check invalid type
    for (let i = 0; i < types.length; i++) {
      if (!pokemonTypes.includes(types[i])) {
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
      (pokemon) => pokemon.id === id || pokemon.name === "name"
    );
    if (duplicatePokemon.length > 0) {
      const exception = new Error(`Id or Name exists in the database`);
      exception.statusCode = 401;
      throw exception;
    }
    let result = { id: id, name, types, url };
    data.push(result);
    db.data = data.sort((a, b) => a.id - b.id);
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
/* PUT a pokemon */
router.put("/:pokemonId", (req, res, next) => {
  //----------------------put input validation----------------------
  try {
    const allowUpdate = ["name", "id", "types", "url"];

    const { pokemonId } = req.params;

    const updates = req.body;
    const updateKeys = Object.keys(updates);
    //find update request that not allow
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));

    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }
    //----------------------put processing----------------------
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    //find book by id
    const targetIndex = data.findIndex((pokemon) => pokemon.id === pokemonId);
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    //Update new content to db book JS object
    const updatedPokemon = { ...db.data[targetIndex], ...updates };
    db.data[targetIndex] = updatedPokemon;

    //db JSobject to JSON string

    db = JSON.stringify(db);
    //write and save to db.json
    fs.writeFileSync("db.json", db);
    //----------------------put send response----------------------
    res.status(200).send(updatedPokemon);
  } catch (error) {
    next(error);
  }
});
/* DEL a pokemon */
router.delete("/:pokemonId", (req, res, next) => {
  //----------------------delete input validation----------------------
  try {
    const { pokemonId } = req.params;
    //delete processing
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    //find pokemon by id
    const targetIndex = data.findIndex((pokemon) => pokemon.id === pokemonId);

    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    //filter db data object
    db.data = data.filter((pokemon) => pokemon.id !== pokemonId);
    db.totalPokemons = db.data.length;
    //db JSobject to JSON string
    db = JSON.stringify(db);

    //write and save to db.json
    fs.writeFileSync("db.json", db);
    //----------------------delete send response----------------------
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});
module.exports = router;
