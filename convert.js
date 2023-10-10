const fs = require("fs");
const csv = require("csvtojson");
const convertData = async () => {
  let newData = await csv().fromFile("pokemon.csv"); //return array of JSON
  newData = new Set(newData.map((e) => e));
  newData = Array.from(newData);
  let data = JSON.parse(fs.readFileSync("db.json"));
  newData = newData
    .map((e, index) => ({
      id: (index + 1).toString(),
      name: e.Name,
      types: e.Type2
        ? [e.Type1.toLowerCase(), e.Type2.toLowerCase()]
        : [e.Type1.toLowerCase()],
      url: `http://localhost:5500/images/pokemon/${index + 1}.png`,
    }))
    .filter((p) => p.id < 722);
  //   console.log(newData);
  data.data = newData;
  data.totalPokemons = newData.length;
  fs.writeFileSync("db.json", JSON.stringify(data));
};
convertData();
