/**
 * Created by Nicu Pavel on 19.11.2016.
 */

const http = require('http');
const parser = require('./lib/parser.js');
const router = require('./lib/router.js');
const customResponses = require('./user/responses.js');

var server = http.createServer();
var port = 19090;

function registerRoutes(err, prefix, staticRoutes, parametrizedRoutes) {
	if (err) {
		console.log("Error parsing markdown: %o", err);
	} else {
		router.setPrefix(prefix);
		router.registerAll(staticRoutes, parametrizedRoutes, customResponses);
		router.registerAlias("/apiVer", "/api/4/apiVer");

		//console.log(JSON.stringify(staticRoutes, null, 4));
		//console.log(JSON.stringify(parametrizedRoutes, null, 4));

		server.on('request', function(req, res) {
			var handler = router.route(req);
			handler(req, res);
		});

		server.listen(port);
	}
}
parser('./rainmachine-api/apiary.apib', registerRoutes);








