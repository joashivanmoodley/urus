/**
 * This is a helper function to sort a JSON Data on a particular field.
 * @param Jdata : JSON Data
 * @param sortKey: Sorting Key
 * @param sortDirection: Sorting Direction (asc or desc)
 * @param sortingFunction: optional sorting function
 */

function sortJSON (Jdata, sortKey, sortDirection, sortingFunction) {
    // create a temporary associative array. This array will be used for sorting the JSON Data. The first element of this
    // array will be the key on which the JSON data will be sorted.
    var tempArray = new Array();
    for (var i=0,len=Jdata.length;i < len; i++) {
        // create the associative array.
        tempArray.push([Jdata[i][sortKey],Jdata[i]]);
    }
    // Default Sorting function.
    if (!sortingFunction)
    	tempArray.sort(function(c, d) {
            // if the function toLowerCase does not exist then the object is not a String
            var x = (c[0] ? c[0].toLowerCase ? c[0].toLowerCase() : c[0] : "");
	        var y = (d[0] ? d[0].toLowerCase ? d[0].toLowerCase() : d[0] : "");
	        if (sortDirection ==  "asc") return x === y ? 0 : (x < y ? -1 : 1);
	        else return x === y ? 0 : (x > y ? -1 : 1);
    	});
    else tempArray.sort(sortingFunction);
    return extractJSONFromArray(tempArray);
}

/**
 * This function sorts a JSON structure containing JUIC objects
 * @param Jdata: JSON data
 * @param sortKey: sortung key
 * @param sortDirection: optional sorting direction, by default "desc", other possible value "asc"
 * @param sortingFunction: optional sorting function
 */
function sortJData (Jdata, sortKey, sortDirection, sortingFunction) {
    var tempArray = new Array();
    if (sortKey.indexOf(".") == -1) {
      for (var i=0,len=Jdata.length;i < len; i++) {
          tempArray.push([Jdata[i].getValue()[sortKey],Jdata[i]]);
      }
    } else {
      var sortKeys = sortKey.split(".");
      for (var i=0,len=Jdata.length;i < len; i++) {
          tempArray.push([Jdata[i].getValue()[sortKeys[0]][sortKeys[1]],Jdata[i]]);
      }
    }
    if (!sortingFunction)
    	tempArray.sort(function(c, d) {
           // if the function toLowerCase does not exist then the object is not a String
           var x = (c[0] ? c[0].toLowerCase ? c[0].toLowerCase() : c[0] : "");
	        var y = (d[0] ? d[0].toLowerCase ? d[0].toLowerCase() : d[0] : "");
           if (sortDirection ===  "asc") return x === y ? 0 : (x < y ? -1 : 1);
	       else return x === y ? 0 : (x > y ? -1 : 1);
	    });
    else tempArray.sort(sortingFunction);
    return extractJSONFromArray(tempArray);
}

/**
 * Extracts the JSON object from the associative array.
 * @param JSONArray
 */
function extractJSONFromArray(JSONArray) {
	assert(JSONArray, "JSONArray must exist");
    var JArray = new Array();
    for (var i=0,len=JSONArray.length;i < len; i++) {
        JArray.push(JSONArray[i][1])
    }
    return JArray;
}

/**
 * A helper method to find a unique JSON object from an array of JSONs
 * @param JArray: JSON Array
 * @param key: Searching Key
 * @param value: Searching Value.
 */
function searchUniqueJSONinArrayByKey (JArray,key,value) {
    var searchResult = "";
    for (var index = 0,len = JArray.length; index < len; index++) {
        if (JArray[index][key] && JArray[index][key] === value) {
            searchResult = JArray[index];
            break;
        }
    }
    return searchResult;
}

/**
 * Helper method to create an array of the JSON Objects
 * @param J: JSON object
 */
function JSONToArray (J) {
    var JArray = [];
    for (n in J){
        JArray.push(J[n]);
    }
    return JArray;
}

/**
 * Searches an array of json object and returns true if the property exists in the array.
 *
 * @param JArray .
 * @param value  .
 */
function contains(JArray, property, value) {
  for (var idx = 0; idx < JArray.length; idx++) {
    if (JArray[idx][property] && JArray[idx][property] === value)
      return true;
  }
  return false;
}

/**
 * This function returns the last child of a node. We cannot use directly the DOM attribute lastChild as this IE can
 * return a text node as last child.
 * @param n
 */
function EXPgetLastNodechild(n) {
    x=n.lastChild;
    while (x.nodeType!=1)
      {
      x=x.previousSibling;
      }
    return x;
}




