var express = require("express");
var router = express.Router();
const fs = require("fs");

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

module.exports = router;
