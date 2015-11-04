var async = require("async");
var request = require("request");

var pages = {
  king: "http://your.kingcounty.gov/elections/2015/nov-general/results/pi.txt",
  sos: "http://results.vote.wa.gov/results/current/export/MediaResults.txt",
  sosCounty: "http://results.vote.wa.gov/results/current/export/MediaResultsByCounty.txt"
};

var results = {};

var check = function() {
  var keys = Object.keys(pages);
  console.log("============\nPolling: %s\n============", new Date());
  async.each(keys, function(key, c) {
    // console.log(key)
    var url = pages[key];
    request({ uri: url }, function(err, body) {
      if (!results[key]) {
        console.log("Adding cache for %s", key);
      } else {
        if (results[key].length !== body.length) {
          console.log("!!!!!!!! UPDATE ON %s !!!!!!!!!", key);
        } else {
          console.log("no change on %s", key)
        }
      }
      results[key] = body;
      c();
    });
  }, function() {
    console.log("============\n");
    setTimeout(check, 1000 * 60 * 1);
  });
};

check();