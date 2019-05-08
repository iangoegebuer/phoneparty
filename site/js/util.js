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

function createGithubURL(repoStr) {
  // format: Username::Repository Name::(optional)Version or commit or branch::Filename.js
  var split = repoStr.split("::");
  if (split.length === 3) {
    return "https://cdn.jsdelivr.net/gh/" + split[0] + "/" + split[1] + "/" + split[2];
  } else if (split.length === 4) {
    return "https://cdn.jsdelivr.net/gh/" + split[0] + "/" + split[1] + "@" + split[2] + "/" + split[3];
  } else {
    console.log("Couldn't parse github url")
    return "";
  }
}

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
