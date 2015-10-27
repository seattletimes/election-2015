/* global $ */
require("./lib/social");
require("./lib/ads");
require("./components/svg-map/svg-map");
var $ = require("jquery");

var yes = ["yes", "approved", "maintained"];

//enable county maps
$("svg-map.county").each(function(i, map) {
  var raceID = map.getAttribute("data-race");
  var data = window.mapData[raceID];
  if (Object.keys(data).length) {
    map.eachPath(".county", function(shape) {
      var id = shape.id.replace(/_/g, " ");
      var result = data[id];
      if (!result) return console.log(`Missing data: ${id}`);
      if (!result.winner) {
        map.savage.addClass(shape, "tie");
      } else if (result.winner.party) {
        map.savage.addClass(shape, result.winner.party == "D" ? "dem" : "rep");
      } else {
        var option = result.winner.candidate.toLowerCase();
        map.savage.addClass(shape, yes.indexOf(option) > -1 ? "yes" : "no");
      }
    });
    var mapState = map.getState();
    mapState.onhover = function(county) {
      county = county.replace(/_/g, " ");
      var c = data[county];
      if (!c) return;
      c.county = county;
      return c || {};
    };
    mapState.hoverClass = "county";
  }
});

$("svg-map.district").each(function(i, map) {
  var districtID = map.getAttribute("data-district");
  map.eachPath(".district", function(shape) {
    map.savage.addClass(shape, shape.id == districtID ? "district" : "null");
  });
});

$(document.body).on("click", "a.tab", function(e) {
  e.preventDefault();
  var href = this.getAttribute("href");
  $(".tab.active").removeClass("active");
  $(this).addClass("active");
  $("section.category").hide();
  var section = $(href);
  section.show();
  if (window.history && window.history.replaceState) {
    window.history.replaceState(href, "", href);
  } else {
    window.location.hash = href.replace("#", "section-");
  }
});

var hash = window.location.hash.replace("section-", "");
if (hash) {
  //restore place from the URL hash
  var selector = "a.tab[href=%]".replace("%", hash);
  $(selector).click();
} else {
  $("a.tab:first").click();
}

$("select.subnav").on("change", function() {
  var val = this.value;
  var section = $(this).closest(".category");
  var selector = '[data-subcat="' + val + '"]';
  section.find(".subcategory").hide();
  section.find(selector).show();
}).trigger("change");

document.body.className = "";