var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send("Hello from Chloe");
});
/* Pokemons router */
const pokemonRouter = require("./pokemon.api.js");
router.use("/api/pokemons", pokemonRouter);
module.exports = router;
