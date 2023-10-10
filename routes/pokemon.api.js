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

module.exports = router;
