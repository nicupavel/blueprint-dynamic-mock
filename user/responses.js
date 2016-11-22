/**
 * Created by Nicu Pavel on 19.11.2016.
 */

module.exports =  {
	"/api/4/dailystats/details": customDailyStatsDetails,
	"/api/4/mixer": customMixer,
	"/api/4/watering/log/details": customWaterLogDetails
};

function todayTimestamp() {
	return Date.now() / 1000 >> 0
}

//returns YYYY-MM-DD
function timestampToDateStr(timestamp) {
	return new Date(timestamp * 1000).toISOString().split('T')[0]
}

//Mocks dailystats/details with dates starting from today
function customDailyStatsDetails(url, body) {
	var json = JSON.parse(body);
	var data = json.DailyStatsDetails;
	var today = todayTimestamp();

	for (var i = 0; i < data.length; i++) {
		var day = data[i];
		day.dayTimestamp = today;
		day.day = timestampToDateStr(today);
		today += 86400;
	}

	return JSON.stringify(json);
}

function customMixer(url, body) {
	var json = JSON.parse(body);
	console.log("Custom: Mixer URL %s", url);

	if ("mixerData" in json) {
		var data = json.mixerData[0].dailyValues;
	} else if ("mixerDataByDate" in json) {
		var data = json.mixerDataByDate;
	} else {
		console.error("Custom: Mixer: Unknown API format");
		return body;
	}

	var today = todayTimestamp() - 86400;

	for (var i = 0; i < data.length; i++) {
		var day = data[i];
		day.day = timestampToDateStr(today) + " 00:00:00";
		today += 86400;
	}

	return JSON.stringify(json);
}

function customWaterLogDetails(url, body) {
	var json = JSON.parse(body);
	console.log("Custom: WaterLogDetails URL %s", url);

	var data = json.waterLog.days;

	var today = todayTimestamp() - 86400;

	for (var i = 0; i < data.length; i++) {
		var day = data[i];
		day.date = timestampToDateStr(today);
		day.dateTimestamp = today;

		today += 86400;
	}

	return JSON.stringify(json);
}

