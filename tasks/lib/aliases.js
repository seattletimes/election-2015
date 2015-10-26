var fs = require("fs");
var getJSON = require("./getJSON");

var candidates = {};
var cSheet;
var aSheet;
var aliases = {};

module.exports = {
  antialias: function(name) {
    if (!aSheet) {
      aSheet = getJSON("Aliases");
      aSheet.forEach(function(row) {
        aliases[row.alias] = row.name;
      });
    }
    return aliases[name] || name;
  },
  getCandidateInfo: function(name) {
    if (!cSheet) {
      cSheet = getJSON("Candidates");
      cSheet.forEach(function(person) {
        candidates[person.name] = person;
      });
    }
    return candidates[name] || {};
  }
};