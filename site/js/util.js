function getURLVars() {
  var url = location.href.split("?");
  if (url.length < 2) return {};
  var query = url[1];
  var result = {};
  query.split("&").forEach(function(part) {
    var items = part.split("=");
    if (items.length < 2) return {};
    result[decodeURIComponent(items[0])] = decodeURIComponent(items[1]);
  });
  return result;
}

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
