/**
 * Custom handling of specified URLs
 *
 * Created by Nicu Pavel on 19.11.2016.
 */

module.exports =  {
	GET: {
		"/api/4/machine/time": getDateTime
	},
	POST: {}
};

/*
 *  GET method functions
 */

function getDateTime(req, body, callback) {
	var today = nowTimestamp();
	var json = {
		appDate :  new Date(today * 1000).toISOString().replace("T", " ").split(".")[0]
	};

	return callback(JSON.stringify(json));
}


/*
 * Helper function
 */

function nowTimestamp() {
	return Date.now() / 1000 >> 0
}

//returns YYYY-MM-DD
function timestampToDateStr(timestamp) {
	return new Date(timestamp * 1000).toISOString().split('T')[0]
}