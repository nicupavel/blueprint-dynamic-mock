/**
 * Created by Nicu Pavel on 19.11.2016.
 */

const http = require('http');
const parser = require('./lib/parser.js');
const router = require('./lib/router.js');

const config = require('./config.json');

const customAliases = require('./user/aliases.json') || {};
const customResponses = require('./user/responses.js') || {};

let server = http.createServer();

function registerRoutes(err, prefix, staticRoutes, parametrizedRoutes) {
	if (err) {
		console.log("Error parsing markdown: %o", err);
	} else {
		router.setPrefix(prefix);
		router.registerAll(staticRoutes, parametrizedRoutes, customResponses);
		router.registerAliases(customAliases);

		server.on('request', function(req, res) {
			let handler = router.route(req);
			handler(req, res);
		});

		server.listen(config.httpPort);
		console.log("Server listening on port %s", config.httpPort);
	}
}

parser(config.apiPath, registerRoutes);








