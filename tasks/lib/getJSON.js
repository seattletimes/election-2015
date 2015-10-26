var fs = require("fs");

var cache = {};

module.exports = function(sheetName) {
  if (cache[sheetName]) return cache[sheetName];
  var data = JSON.parse(fs.readFileSync("./data/Election2015_" + sheetName + ".sheet.json", "utf8"));
  cache[sheetName] = data;
  return data;
}