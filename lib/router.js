/**
 * Created by Nicu Pavel on 19.11.2016.
 */
let staticHandlers = {};
let parametrizedHandlers = {};
let aliases = {};
let httpCodeSuccess = 200;
let prefix;

exports.setPrefix = function(_prefix) {
	prefix = _prefix;
};

exports.registerAliases = function(pathMap) {
	for (let path in pathMap) {
		aliases[path] = pathMap[path];
	}
};

exports.registerAlias = function(path, existingPath) {
	aliases[path] = existingPath;
};

exports.registerAll = function(staticRoutes, parametrizedRoutes, customResponsesMap) {

	for (let uri in parametrizedRoutes) {
		parametrizedHandlers[uri] = routeHandler(uri, true);
		console.log("Registered parametrized: %s", uri);
	}

	for (let uri in staticRoutes) {
		staticHandlers[uri] = routeHandler(uri, false);
		console.log("Registered: %s", uri);
	}

	function routeHandler(uri, parametrized) {
		let routes;
		let url;

		if (parametrized) {
			routes = parametrizedRoutes;
			url = getPathWithoutParams(uri);
		} else {
			routes = staticRoutes;
			url = uri;
		}

		return function(req, res) {
			let method = req.method;
			let headers = [];
			let body = {};

			try {
				headers = routes[url][method].responses[httpCodeSuccess].headers;
				body = routes[url][method].responses[httpCodeSuccess].body;
			} catch(e) {
				console.error("No headers/body for %s %s", url, method);				
			}			

			function writeData(body, code) {

				if (typeof code === "undefined" || !code) {
					code = httpCodeSuccess;
				}

				let header = {};
				for (let i = 0; i < headers.length; i++) {
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
	let url = req.url;

	//We ignore options passed with ?name=value for routing
	let ignoreFrom = url.lastIndexOf('?');
	if (ignoreFrom < 0) {
		ignoreFrom = url.length;
	}
	url = url.substr(0, ignoreFrom);

	if (url in aliases) {
		url = aliases[url];
	}

	let apiroot = getPathWithoutParams(url);
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
	let parts = url.substr(prefix.length, url.length).match(/\/(\d+)/);
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

