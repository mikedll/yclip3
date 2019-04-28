// https://stackoverflow.com/questions/1714786/query-string-encoding-of-a-javascript-object
var serializeObj = function serializeObj(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");  
};

// https://stackoverflow.com/questions/8648892/convert-url-parameters-to-a-javascript-object
var getUrlQueryAsObj = function getUrlQueryAsObj() {
  if(typeof(window) === "undefined") return null;
  
  var search = window.location.search.substring(1).replace(/^\s+|\s+$/g, '');

  if(search === '') return {};

  return search.split("&").reduce(function(prev, curr, i, arr) {
    var p = curr.split("=");
    prev[decodeURIComponent(p[0])] = p[1] === undefined ? true : decodeURIComponent(p[1]);
    return prev;
  }, {});
};

// https://stackoverflow.com/questions/19491336/get-url-parameter-jquery-or-how-to-get-query-string-values-in-js
var getUrlParameter = function getUrlParameter(sParam) {

  if(typeof(window) === "undefined") return null;
  
  var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }

  return null;
};

export { getUrlParameter, getUrlQueryAsObj, serializeObj };
