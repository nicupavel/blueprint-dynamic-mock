/**
 * Created by Nicu Pavel on 19.11.2016.
 */
var staticHandlers = {};
var parametrizedHandlers = {};
var aliases = {};
var httpCodeSuccess = 200;
var prefix;

exports.setPrefix = function(_prefix) {
	prefix = _prefix;
};

exports.registerAliases = function(pathMap) {
	for (var path in pathMap) {
		aliases[path] = pathMap[path];
	}
};

exports.registerAlias = function(path, existingPath) {
	aliases[path] = existingPath;
};

exports.registerAll = function(staticRoutes, parametrizedRoutes, customResponsesMap) {

	for (var uri in parametrizedRoutes) {
		parametrizedHandlers[uri] = routeHandler(uri, true);
		console.log("Registered parametrized: %s", uri);
	}

	for (uri in staticRoutes) {
		staticHandlers[uri] = routeHandler(uri, false);
		console.log("Registered: %s", uri);
	}

	function routeHandler(uri, parametrized) {
		var routes;
		var url;

		if (parametrized) {
			routes = parametrizedRoutes;
			url = getPathWithoutParams(uri);
		} else {
			routes = staticRoutes;
			url = uri;
		}

		return function(req, res) {
			var method = req.method;

			var headers = routes[url][method].responses[httpCodeSuccess].headers;
			var body = routes[url][method].responses[httpCodeSuccess].body;

			function writeData(body, code) {

				if (typeof code === "undefined" || !code) {
					code = httpCodeSuccess;
				}

				var header = {};
				for (var i = 0; i < headers.length; i++) {
					header[headers[i].name] = headers[i].value;
				}

				res.writeHead(code, header);
				res.write(body);
				res.end();
			}

			if (url in customResponsesMap[method]) {
				//console.log("Calling custom function for %s", req.url);
				try {
					customResponsesMap[method][url](req, body, writeData);
				} catch (e) {
					console.error(e)
				}
			} else {
				writeData(body);
			}
		}
	}

};

exports.route = function(req) {
	var url = req.url;

	//We ignore optins passed with ?name=value for routing
	var ignoreFrom = url.lastIndexOf('?');
	if (ignoreFrom < 0) {
		ignoreFrom = url.length;
	}
	url = url.substr(0, ignoreFrom);

	if (url in aliases) {
		url = aliases[url];
	}

	var apiroot = getPathWithoutParams(url);
	//console.log("%s: %s (%s)", req.method, url, apiroot);

	if (url in staticHandlers) {
		return staticHandlers[url];
	} else if (apiroot in parametrizedHandlers) {
		return parametrizedHandlers[apiroot];
	} else {
		return missing;
	}
};

//Get the part of the url without params (which are being considered starting with numbers)
function getPathWithoutParams(url) {
	var parts = url.substr(prefix.length, url.length).match(/\/(\d+)/);
	if (parts !== null) {
		return url.substr(0, url.lastIndexOf(parts[0]));
	}
	return url;
}

function missing(req, res) {
	res.writeHead(404, {'Content-Type': 'text/plain'});
	res.write("No route registered for " + req.url);
	res.end();
}

