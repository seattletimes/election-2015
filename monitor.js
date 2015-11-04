var async = require("async");
var request = require("request");
var crypto = require("crypto");
var chalk = require("chalk");

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
    request({ uri: url }, function(err, response, body) {
      var md5 = crypto.createHash("md5").update(body, "utf8");
      var hash = md5.digest("hex");
      // console.log(key, hash);
      if (!results[key]) {
        console.log("Adding cache for %s - %s", key, hash);
      } else {
        if (results[key] !== hash) {
          console.log(chalk.red("!!!!!!!! UPDATE ON %s !!!!!!!!!"), key);
          process.exit();
        } else {
          console.log(chalk.green("no change on %s - %s"), key, hash)
        }
      }
      results[key] = hash;
      c();
    });
  }, function() {
    console.log("============\n");
    setTimeout(check, 1000 * 60 * 10);
  });
};

check();