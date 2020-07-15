/**
 * Created by Nicu Pavel on 19.11.2016.
 */
const fs = require('fs');
const drafter = require('drafter.js');
const url = require('url');

let prefix = "/";

module.exports = function (file, cb) {
	let staticRoutes = {};
	let parametrizedRoutes = {};
	let fileData;

	let options = {
		generateSourceMap: false,
		type: 'ast'
	};

	try {
		fileData = fs.readFileSync(file, {encoding: 'utf8'});
	} catch (e) {
		console.log("Error reading %s: %s", file, e);
		return cb(e);
	}

	console.log("Parsing markdown from file %s", file);

	drafter.parse(fileData, options, function (err, results) {
		if (err) {
			console.log(err);
			return cb(err);
		}
		
		// Get the API prefix
		prefix = parseAPIPrefix(results.ast.metadata);

		results.ast.resourceGroups.forEach(function (resourceGroup) {
			resourceGroup.resources.forEach(parseResource);
		});

		return cb(null, prefix, staticRoutes, parametrizedRoutes);
	});

	function parseResource(resource) {
		let uri = resource.uriTemplate;
		let routes = null;

		//Check if uri has dynamic params in form of /uri/{param1}/../{paramX}
		let params = uri.match(/\/{(.*?)}/g);

		// Save only the path without params
		if (params !== null) {
			console.log("Found parametrized uri %s", uri);
			uri = uri.substr(0, uri.lastIndexOf(params[0]));
			routes = parametrizedRoutes;
		} else {
			routes = staticRoutes;
		}

		uri = prefix + uri;
		uri = uri.replace(/([^:]\/)\/+/g, "$1"); //replace redundant /

		if (! (uri in routes)) {
			routes[uri] = {};
		}

		for (let i = 0; i < resource.actions.length; i++) {
			let method = resource.actions[i].method;
			routes[uri][method] = {
				requests: null,
				responses: null
			};

			//console.log(resource.actions[i].examples);
			for (let j = 0; j < resource.actions[i].examples.length; j++) {
				let example = resource.actions[i].examples[j];
				if ("responses" in example && example.responses.length > 0) {
					routes[uri][method].responses = parseResponses(example.responses);
				} else {
					console.log("No responses for %s %s", method, uri);
				}
			}
		}
	}

	function parseResponses(responses) {
		let result = {};

		for (let k = 0; k < responses.length; k++) {
			let response = responses[k];
			let isJSON = false;
			let headers = [];
			let body = null;

			for (let h = 0; h < response.headers.length; h++) {
				headers.push(response.headers[h]);
				if (response.headers[h].value == 'application/json') {
					isJSON = true;
				}
			}

			headers.push({name: 'Access-Control-Allow-Origin', value: '*'});

			if (isJSON) {
				//body = JSON.stringify(JSON.parse(response.body), null, 4);
				body = response.body;
			} else {
				body = response.body;
			}

			result[response.name] = {
				body: body,
				headers: headers
			}
		}
		return result;
	}

	function parseAPIPrefix(metadata) {
		if (!metadata || metadata.length == 0) {
			return "";
		}

		for (let i = 0; i < metadata.length; i++) {
			if (metadata[i].name === "HOST") {
				let u = url.parse(metadata[i].value);
				if (u) {
					return u.pathname.substr(0, u.pathname.length);
				}
			}
		}

		return "";
	}
};
