/**
 * Custom handling of specified URLs
 *
 * Created by Nicu Pavel on 19.11.2016.
 */

module.exports =  {
	GET: {
		"/api/4/provision": getProvision,
		"/api/4/dailystats/details": getDailyStatsDetails,
		"/api/4/zone": getZone,
		"/api/4/mixer": getMixer,
		"/api/4/watering/log/details": getWaterLogDetails,
		"/api/4/watering/available": getAvailableWater,
		"/api/4/machine/time": getDateTime,
		"/api/4/program": getProgram,
		"/api/4/watering/queue": getWateringQueue,
		"/api/4/parser": getParser
	},
	POST: {}
};

/*
 *  GET method functions
 */

function getDateTime(req, body, callback) {
	var today = nowTimestamp();
	var json = JSON.parse(body);
	var dateString  = new Date(today * 1000).toISOString().replace("T", " ").split(".")[0];
	json.appDate = dateString;
	return callback(JSON.stringify(json));
}

function getZone(req, body, callback) {
	var json = JSON.parse(body);
	var data = json.zones;

	var accessToken = getAccessToken(req.url);

	if (!sessionHasQueue(accessToken)) {
		return callback(body);
	}

	performWateringQueueLogic(accessToken);

	//Mock the response body with simulated watering data
	for (var i = 0; i < data.length; i++) {
		var z = data[i];
		var vz = getZoneFromQueue(z.uid, accessToken);
		if (vz) {
			z.userDuration = vz.time;
			z.machineDuration = vz.time;
			z.remaining = vz.remaining;
			z.state = vz.state;
		}
	}

	return callback(JSON.stringify(json));
}

function getProgram(req, body, callback) {

	var accessToken = getAccessToken(req.url);

	if (!sessionHasQueue(accessToken)) {
		return callback(body);
	}

	performWateringQueueLogic(accessToken);
	var z = getZoneFromQueue(3, accessToken);
	if (!z || z.pid !== 32) {
		return callback(body);
	}

	var json = JSON.parse(body);
	var data = json.programs;
	data[0].status = 1;
	return callback(JSON.stringify(json));
}

function getWateringQueue(req, body, callback) {
	//We simulate a real watering by using data set by POST zone/n/start in client cookies
	var accessToken = getAccessToken(req.url);

	if (!sessionHasQueue(accessToken)) {
		return callback(body);
	}

	var queue = [];
	var now = nowTimestamp();
	for(var i = 0; i < sessions[accessToken].queue.length; i++) {
		var z = sessions[accessToken].queue[i];
		if (z.time > 0) {
			queue.push({
				"availableWater": 0,
				"realDuration": 0,
				"running": true,
				"uid": null,
				"restriction": false,
				"manual": true,
				"pid": z.pid || null,
				"flag": 0,
				"machineDuration": z.time,
				"userDuration": z.time,
				"zid": z.uid,
				"userStartTime": z.start,
				"cycles": 1,
				"hwZid": 3,
				"remaining": z.remaining,
				"realStartTime": z.start,
				"cycle": 1
			})
		}
	}

	return callback(JSON.stringify({ queue: queue }));
}


//Get a parser details
function getParser(req, body, callback) {

	var url = req.url;

	try {
		var captures = url.match(/\/parser\/(\d+)\/*(\w*)/);
		var pid = parseInt(captures[1]);
		var op = null;
		if (captures.length > 2) {
			op =  captures[2];
		}
	} catch(e) {
		return callback(body);
	}

	console.log("GET: %s Parser: %d, Op: %s", url, pid, op);

	if (op !== "data") {
		var parser = {
			"lastRun": null,
			"lastKnownError": "",
			"hasForecast": true,
			"uid": 8,
			"hasHistorical": false,
			"description": "North America weather forecast from National Oceanic and Atmospheric Administration",
			"enabled": true,
			"custom": false,
			"isRunning": false,
			"name": "NOAA Parser"
		};
		return callback(JSON.stringify({parser: parser}));
	}

	return callback(body);
}

/*
 *  POST method functions
 */

//Generates a UUID for token. This will be used on further request as a sessionid
function setLogin(req, body, callback) {
	var json = JSON.parse(body);

	var uuid = uuidV4();

	sessions[uuid] = {
		queue: []
	};

	json.access_token = uuid;

	return callback(JSON.stringify(json));
}

//Start/Stop a program
function setProgram(req, body, callback) {

	var url = req.url;

	try {
		var captures = url.match(/\/program\/(\d+)\/(\w+)/);
		var pid = parseInt(captures[1]);
		var op = captures[2];
	} catch(e) {
		return callback(body);
	}

	console.log("POST: %s Program: %d, Op: %s", url, pid, op);

	if (isNaN(pid) || (op !== "start" && op !== "stop")) {
		return callback(body);
	}

	if (op === "start") {
		setZoneInQueue(3, pid, 536, getAccessToken(url));
	} else {
		setZoneInQueue(3, pid, 0, getAccessToken(url));
	}

	return callback(body);
}


//Set zone watering time in virtual watering queue
function setZone(req, body, callback) {

	var url = req.url;

	try {
		var captures = url.match(/\/zone\/(\d+)\/(\w+)/);
		var uid = parseInt(captures[1]);
		var op = captures[2];
	} catch(e) {
		return callback(body);
	}

	console.log("POST: %s Zone: %d Op: %s", url, uid, op);

	if (isNaN(uid) || (op !== "start" && op !== "stop")) {
		return callback(body);
	}

	var accessToken = getAccessToken(url);

	if (op === "stop") {
		setZoneInQueue(uid, 0, 0, accessToken);
		return callback(body);
	}

	//For start op read the body of the call that contains the time amount
	var recvbody = '';

	req.on('data', function (data) {
		recvbody += data;

		if (body.length > 1e3)
			req.connection.destroy();
	});

	req.on('end', function () {
		try {

			var time = JSON.parse(recvbody).time;
			setZoneInQueue(uid, 0, time, accessToken);
			return callback(body);
		} catch(e){
			console.error(e);
			return callback(body);
		}
	});
}


function setStopAll(req, body, callback) {

	var accessToken = getAccessToken(req.url);

	if (accessToken) {
		sessions[accessToken].queue = [];
		sessions[accessToken].lastAction = nowTimestamp();
	}

	return callback(body);
}

/*
 * Helper function
 */

function getAccessToken(url) {
	var params = urlparser.parse(url, true).query;

	if (!("access_token" in params)) {
		return null;
	}

	return params.access_token;
}

function inSession(accessToken) {
	if (accessToken === null || !(accessToken in sessions)) {
		return false;
	}

	return true;
}

function sessionHasQueue(accessToken) {
	if ( !inSession(accessToken) || sessions[accessToken].queue.length == 0) {
		return false;
	}

	return true;
}


function performWateringQueueLogic(accessToken) {
	if (!inSession(accessToken)) {
		return;
	}

	var now = nowTimestamp();

	for (var i = sessions[accessToken].queue.length - 1; i >= 0; i--) {
		var z = sessions[accessToken].queue[i];
		z.remaining = z.start + z.time - now;
		z.state = 2;

		if (isNaN(z.remaining) || z.remaining <= 0) {
			sessions[accessToken].queue.splice(i, 1);
		}
	}

	//first in queue
	z.state = 1;
}

function getZoneFromQueue(uid, accessToken) {
	if (!(accessToken in sessions)) {
		return null;
	}

	for (var i = 0; i < sessions[accessToken].queue.length; i++) {
		var z = sessions[accessToken].queue[i];
		if (z.uid == uid) {
			return z;
		}
	}

	return null;
}

function setZoneInQueue(uid, pid, time, accessToken) {

 	if (accessToken === null) {
		console.error("No session token in URL. Not adding zone.");
		return;
	}

	time = parseInt(time);

	var now = nowTimestamp();

	if (!(accessToken in sessions)) {
		sessions[accessToken] = {
			queue: []
		};
	}

	var found = false;
	var z = getZoneFromQueue(uid, accessToken);

	if (z) {
		if (z.pid !== pid) {
			z.time += time;
		} else {
			z.time = time;
		}

		if (pid > 0) {
			z.pid = pid;
		}
	} else {
		sessions[accessToken].queue.push({
			uid: uid,
			pid: pid,
			time: time,
			remaining: time,
			state: 0,
			start: now
		});
	}

	sessions[accessToken].lastAction = now;
}

//returns YYYY-MM-DD
function timestampToDateStr(timestamp) {
	return new Date(timestamp * 1000).toISOString().split('T')[0]
}