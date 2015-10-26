var alias = require("./aliases");
var fs = require("fs");
var request = require("request");
var project = require("../../project.json");

var url = "http://your.kingcounty.gov/elections/2015/nov-general/results/pi.txt";

var hyphenate = function(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
};

var getRaceID = function(title) {
  //horrible, horrible regex conversion steps to follow
  if (title.match(/^City of.*Prop/)) {
    //find the city and proposition number
    //handle weird Seattle Prop 1A/B first
    if (title.match(/1A and 1B/)) {
      if (title.match(/cont/)) {
        return "seattle-prop-1b";
      }
      return "seattle-prop-1a";
    } else {
      var matches = title.match(/City of (.*?) Proposition No\. (\w+)/);
      if (!matches) throw "Couldn't identify race: " + title;
      return [hyphenate(matches[1]), "prop", matches[2].toLowerCase()].join("-");
    }
  } else if (title.match(/^district court/i)) {
    //district court positions
    var matches = title.match(/^District Court (\w+).*?Position No\. (\d+)/);
    if (!matches) throw "Couldn't identify race: " + title;
    return [matches[1].toLowerCase(), "judge", matches[2]].join("-");
  } else if (title.match(/^highline/i)) {
    //one highline school district proposition
    return "highline-prop-1";
  } else if (title.match(/king.*prosecuting.*attorney/i)) {
    //King County prosecutor
    return "king-prosecutor";
  } else if (title.match(/monorail|citizen petition/i)) {
    //Monorail! Monorail! Monorail!
    return "monorail";
  } else if (title.match(/^seattle municipal court/i)) {
    var matches = title.match(/\d+/);
    if (!matches) throw "Couldn't identify race: " + title;
    return "seattle-judge-" + matches[0];
  } else if (title.match(/^seattle transportation/i)) {
    //Seattle Transportation Benefit (buses)
    return "seattle-transport-1";
  } else if (title.match(/si view/i)) {
    //Si View parks
    return "si-view-prop-1";
  }
  //console.log("[king] Ignoring race:", title.substr(0, 40) + "...");
  return "redundant";
};

var parser = {
  index: 0,
  mode: "init",
  buffer: null,
  parsed: [],
  regex: {
    nameRow: null,
    result: /([\s\S]+?)\s{2,}\w+\s+([\d.]+)\s+([\d.]+)%/
  },
  findNonBlank: function(index) {
    while (index < this.lines.length) {
      var line = this.lines[index];
      if (line.trim()) {
        return line;
      }
      index++;
    }
  },
  parseLine: function(line) {
    switch (this.mode) {

    case "search":
      if (line.match(this.regex.nameRow)) {
        //matched the start of a race
        if (this.buffer) {
          console.error("Buffer not cleared!", this.buffer);
        }
        var trimmed = line.trim();
        var id = getRaceID(trimmed);

        //jump out on races we already get from SoS
        if (id == "redundant") return;

        this.buffer = {
          name: trimmed,
          race: id,
          results: []
        };

        this.mode = "race";
      }
      break;

    case "race":
      //indentation changes reset the buffer, but blank lines do not
      if (!line.trim()) return;
      if (line.match(this.regex.nameRow)) {
        this.mode = "search";
        this.parsed.push(this.buffer);
        this.buffer = null;
        return true;
      } else if (line.match(/\d\%$/)) { //result lines end with percentages
        line = line.trim();
        var matches = line.match(this.regex.result);
        if (!matches) {
          //precinct counting lines or other garbage
          return;
        }
        var name = matches[1];
        name = alias.antialias(name);
        if (name.match(/write-in/i)) return;
        var candidateInfo = alias.getCandidateInfo(name);
        var result = {
          candidate: candidateInfo.name,
          party: candidateInfo.party,
          incumbent: candidateInfo.incumbent,
          votes: matches[2] * 1,
          percent: Math.round(matches[3] * 10) / 10,
          source: "King County",
          location: "King"
        };
        this.buffer.results.push(result);
      }
      break;

    //start by looking for the first race name
    case "init":
      if (line.match(/nov.*4, 2014/i)) {
        var next = this.findNonBlank(this.index + 1);
        var padding = next.match(/^\s+/)[0];
        //we build a custom regex to handle it in case they change their indentation scheme
        this.regex.nameRow = new RegExp("^" + padding + "\\w");
        this.mode = "search";
      }

    }
  },
  parse: function(doc) {
    var lines = this.lines = doc.replace(/\r/g, "").split("\n");
    while (this.index < lines.length) {
      var line = lines[this.index];
      var result = this.parseLine(line);
      if (!result) {
        this.index++;
      }
    }
    //push remaining races in the buffer over to the parsed list
    if (this.buffer) {
      this.parsed.push(this.buffer);
    }
    return this.parsed;
  }
};

var getData = function(c) {
  var cache = "./temp/king.json";
  if (project.caching && fs.existsSync(cache)) {
    if (fs.statSync(cache).mtime > (new Date(Date.now() - 5 * 60 * 1000))) {
      console.log("Using cached:", url);
      var data = JSON.parse(fs.readFileSync(cache));
      return c(null, data);
    }
  }
  request(url, function(err, response, body) {
    var result = parser.parse(body);
    // result.forEach(function(row) {
    //   console.log(row.name, row.results.map(function(result) { return result.candidate }));
    // });
    if (project.caching) {
      if (!fs.existsSync("./temp")) {
        fs.mkdirSync("./temp");
      }
      fs.writeFileSync(cache.replace("json", "txt"), body);
      fs.writeFileSync(cache, JSON.stringify(result, null, 2));
    }
    c(null, result);
  });
};

module.exports = getData;