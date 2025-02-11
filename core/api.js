/* eslint-disable no-undef */
const win = BrowserWindow.fromId(process.env.window * 1);
const replay = 0;
const replayT = 0;
const PostAddressIP = "https://exptech.com.tw/api/v1/trem/replay";

let report_data = {};

function Now() {
	return new Date(ServerTime + (Date.now() - ServerT));
}

function int_to_intensity(int) {
	const list = ["0", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"];
	return list[int];
}

function fetch_eew() {
	const controller = new AbortController();
	setTimeout(() => {
		controller.abort();
	}, 2500);
	fetch("https://exptech.com.tw/api/v1/earthquake/eew?type=earthquake", { signal: controller.signal })
		.then((ans) => ans.json())
		.then((ans) => {
			get_data(ans, "http");
		})
		.catch((err) => {
			console.log(err);
			setTimeout(() => fetch_eew(), 3000);
		});
}

async function fetch_report() {
	return await new Promise((c) => {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, 2500);
		fetch("https://exptech.com.tw/api/v1/earthquake/reports?limit=50", { signal: controller.signal })
			.then((ans) => ans.json())
			.then((ans) => {
				report_data = ans;
				c(true);
			})
			.catch((err) => {
				console.log(err);
				c(false);
			});
	});
}

async function refresh_report_list(_fetch = false, data = {}) {
	if (_fetch) {
		const ans = await fetch_report();
		if (!ans) {
			setTimeout(() => refresh_report_list(true), 3000);
			return;
		}
	}
	if (data.type == "report") {
		report_data.unshift(data.raw);
		if (TREM.report_time != 0) {
			const epicenterIcon = L.icon({
				iconUrl  : "../resource/images/cross.png",
				iconSize : [30, 30],
			});
			const intensity = data.raw.data[0]?.areaIntensity ?? 0;
			const intensity_level = (intensity == 0) ? "--" : int_to_intensity(intensity);
			if (TREM.report_epicenterIcon) TREM.report_epicenterIcon.remove();
			TREM.report_epicenterIcon = L.marker([data.lat, data.lon],
				{ icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
			document.getElementById("report_title_text").innerHTML = `${get_lang_string("report.title").replace("${type}", (data.location.startsWith("TREM 人工定位")) ? get_lang_string("report.title.Local") : ((data.raw.earthquakeNo % 1000) ? data.raw.earthquakeNo : get_lang_string("report.title.Small")))}`;
			document.getElementById("report_box").style.backgroundColor = (data.cancel) ? "#333439" : (data.Test) ? "#0080FF" : (intensity > 4) ? "red" : "#FF9224";
			document.getElementById("report_body").style.backgroundColor = "#514339";
			document.getElementById("report_max_intensity").innerHTML = (data.location.startsWith("TREM 人工定位")) ? `${data.raw.location.substring(data.raw.location.indexOf("(") + 1, data.raw.location.indexOf(")")).replace("位於", "")}` : `${data.raw.data[0].areaName} ${data.raw.data[0].eqStation[0].stationName}`;
			const eew_intensity = document.getElementById("report_intensity");
			eew_intensity.className = `intensity_${intensity_level} intensity_center`;
			eew_intensity.innerHTML = intensity_level;
			document.getElementById("report_location").innerHTML = `${data.raw.location.substring(data.raw.location.indexOf("(") + 1, data.raw.location.indexOf(")")).replace("位於", "")}`;
			document.getElementById("report_time").innerHTML = get_lang_string("eew.time").replace("${time}", data.raw.originTime);

			let report_scale = data.scale.toString();
			if (report_scale.length == 1)
				report_scale = report_scale + ".0";


			document.getElementById("report_scale").innerHTML = `M ${report_scale}`;
			document.getElementById("report_args").innerHTML = `${get_lang_string("word.depth")}:&nbsp;<b>${data.depth}</b>&nbsp;km`;
			$(".eew_box").css("display", "none");
			$(".report_box").css("display", "inline");
			$(".report_hide").css("display", "inline");
		}
	}
	const report_list = document.getElementById("report_list");
	report_list.innerHTML = "";
	const IsPalert = (data.type == "palert") ? true : false;
	for (let i = (IsPalert) ? -1 : 0; i < report_data.length; i++) {
		if (replay != 0 && new Date(report_data[i].originTime).getTime() > new Date(replay + (NOW.getTime() - replayT)).getTime()) return;
		const report = document.createElement("div");
		report.className = "report";
		report.id = i;
		if (i == -1) {
			const report_text_intensity = document.createElement("div");
			report_text_intensity.className = `report_text report_intensity intensity_${data.intensity[0].intensity}`;
			report_text_intensity.style = `font-size: ${(data.intensity[0].intensity > 4 && data.intensity[0].intensity != 7) ? "50" : "60"}px;`;
			report_text_intensity.innerHTML = `${data.intensity[0].intensity}`;
			const report_text_box = document.createElement("div");
			report_text_box.className = "report_text_box";
			const report_text = document.createElement("div");
			report_text.className = "report_text";
			report_text.style = "font-size: 22px;";
			report_text.innerHTML = "<b>震源 調查中</b>";
			const report_text_time = document.createElement("div");
			report_text_time.className = "report_text";
			report_text_time.style = "font-size: 15px;";
			report_text_time.innerHTML = `${data.time}`;
			report_text_box.append(report_text, report_text_time);
			report.append(report_text_intensity, report_text_box);
		} else {
			const originTime = new Date((new Date(`${report_data[i].originTime} GMT+08:00`)).toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
			const intensity = report_data[i].data[0]?.areaIntensity ?? 0;
			const time = report_data[i].originTime.substring(0, 16);
			const cwb_code = "EQ"
				+ report_data[i].earthquakeNo
				+ "-"
				+ (originTime.getMonth() + 1 < 10 ? "0" : "") + (originTime.getMonth() + 1)
				+ (originTime.getDate() < 10 ? "0" : "") + originTime.getDate()
				+ "-"
				+ (originTime.getHours() < 10 ? "0" : "") + originTime.getHours()
				+ (originTime.getMinutes() < 10 ? "0" : "") + originTime.getMinutes()
				+ (originTime.getSeconds() < 10 ? "0" : "") + originTime.getSeconds();
			let loc = report_data[i].location;
			loc = loc.substring(loc.indexOf("(") + 3, loc.indexOf(")"));
			const resize = (intensity > 4 && intensity != 7) ? true : false;
			const intensity_level = (intensity == 0) ? "--" : int_to_intensity(intensity);
			if (i == 0 && !IsPalert) {
				const report_info = document.createElement("div");
				report_info.className = "report_item";
				report_info.id = `${originTime.getTime()}_info`;
				const report_text = document.createElement("div");
				report_text.className = `report_text report_intensity intensity_${intensity}`;
				report_text.style = `font-size: ${(resize) ? "50" : "60"}px;`;
				report_text.innerHTML = `${intensity_level}`;
				const report_text_box = document.createElement("div");
				report_text_box.className = "report_text_box";
				const report_text_loc = document.createElement("div");
				report_text_loc.className = "report_text";
				report_text_loc.style = "font-size: 22px;";
				report_text_loc.innerHTML = `<b>${loc}</b>`;
				const report_text_time = document.createElement("div");
				report_text_time.className = "report_text";
				report_text_time.style = "font-size: 15px;";
				report_text_time.innerHTML = `${time}`;
				const report_text_magnitudeValue_depth = document.createElement("div");
				report_text_magnitudeValue_depth.style = "display: flex;";
				const report_text_magnitudeValue = document.createElement("div");
				report_text_magnitudeValue.className = "report_text";
				report_text_magnitudeValue.innerHTML = `<b>M&nbsp;${report_data[i].magnitudeValue.toFixed(1)}</b>`;
				const report_text_depth = document.createElement("div");
				report_text_depth.className = "report_text report_scale";
				report_text_depth.style = "width: 100%;text-align: right;";
				report_text_depth.innerHTML = `${get_lang_string("word.depth")}:&nbsp;<b>${report_data[i].depth}</b>&nbsp;km`;
				report_text_magnitudeValue_depth.append(report_text_magnitudeValue, report_text_depth);
				report_text_box.append(report_text_loc, report_text_time, report_text_magnitudeValue_depth);
				report_info.append(report_text, report_text_box);
				const report_click_box = document.createElement("div");
				report_click_box.className = "report_click hide";
				report_click_box.id = `${originTime.getTime()}_click_box`;
				const report_click_report = document.createElement("i");
				report_click_report.className = "report_click_text fa fa-info fa-2x";
				report_click_report.id = `${originTime.getTime()}_click_report`;
				report_click_report.addEventListener("click", () => {
					report_report(i);
				});
				const report_click_replay = document.createElement("i");
				report_click_replay.className = "report_click_text fa-regular fa-circle-play fa-2x";
				report_click_replay.id = `${originTime.getTime()}_click_replay`;
				report_click_replay.style = "color: red;";
				const report_click_web = document.createElement("i");
				report_click_web.className = "report_click_text fa fa-globe fa-2x";
				report_click_web.id = `${originTime.getTime()}_click_web`;
				if (!report_data[i].location.startsWith("TREM 人工定位"))
					report_click_web.addEventListener("click", () => {
						shell.openExternal(`https://www.cwb.gov.tw/V8/C/E/EQ/${cwb_code}.html`);
					});
				else report_click_web.style = "color: red;";
				report_click_box.append(report_click_report, report_click_replay, report_click_web);
				report.append(report_info, report_click_box);
			} else {
				const report_info = document.createElement("div");
				report_info.className = "report_item";
				report_info.id = `${originTime.getTime()}_info`;
				const report_text = document.createElement("div");
				report_text.className = `report_text report_intensity intensity_${intensity}`;
				report_text.style = `font-size: ${(resize) ? "35" : "40"}px;max-width: 55px;`;
				report_text.innerHTML = `${intensity_level}`;
				const report_text_box = document.createElement("div");
				report_text_box.className = "report_text_box";
				const report_text_loc = document.createElement("div");
				report_text_loc.className = "report_text";
				report_text_loc.innerHTML = `<b>${loc}</b>`;
				const report_text_time = document.createElement("div");
				report_text_time.className = "report_text";
				report_text_time.style = "font-size: 15px;";
				report_text_time.innerHTML = `${time}`;
				const report_text_magnitudeValue = document.createElement("div");
				report_text_magnitudeValue.className = "report_text report_scale";
				report_text_magnitudeValue.innerHTML = `<b>M&nbsp;${report_data[i].magnitudeValue.toFixed(1)}</b>`;
				report_text_box.append(report_text_loc, report_text_time);
				report_info.append(report_text, report_text_box, report_text_magnitudeValue);
				const report_click_box = document.createElement("div");
				report_click_box.className = "report_click hide";
				report_click_box.id = `${originTime.getTime()}_click_box`;
				const report_click_report = document.createElement("i");
				report_click_report.className = "report_click_text fa fa-info fa-2x";
				report_click_report.id = `${originTime.getTime()}_click_report`;
				report_click_report.addEventListener("click", () => {
					report_report(i);
				});
				const report_click_replay = document.createElement("i");
				report_click_replay.className = "report_click_text fa-regular fa-circle-play fa-2x";
				report_click_replay.id = `${originTime.getTime()}_click_replay`;
				if (report_data[i].ID.length != 0)
					report_click_replay.addEventListener("click", () => {
						localStorage.TestID = report_data[i].ID;
						testEEW();
					});
				else report_click_replay.style = "color: red;";
				const report_click_web = document.createElement("i");
				report_click_web.className = "report_click_text fa fa-globe fa-2x";
				report_click_web.id = `${originTime.getTime()}_click_web`;
				if (!report_data[i].location.startsWith("TREM 人工定位"))
					report_click_web.addEventListener("click", () => {
						shell.openExternal(`https://www.cwb.gov.tw/V8/C/E/EQ/${cwb_code}.html`);
					});
				else report_click_web.style = "color: red;";
				report_click_box.append(report_click_report, report_click_replay, report_click_web);
				report.append(report_info, report_click_box);
			}
			report.addEventListener("mouseenter", () => {
				document.getElementById(`${originTime.getTime()}_click_box`).style.height = $(`#${originTime.getTime()}_info`).height();
				document.getElementById(`${originTime.getTime()}_info`).className = "hide";
				document.getElementById(`${originTime.getTime()}_click_box`).className = "report_click";
			});
			report.addEventListener("mouseleave", () => {
				document.getElementById(`${originTime.getTime()}_info`).className = "report_item";
				document.getElementById(`${originTime.getTime()}_click_box`).className = "report_click hide";
			});
		}
		report_list.appendChild(report);
	}
}

function testEEW() {
	if (localStorage.TestID != undefined) {
		const list = localStorage.TestID.split(",");
		for (let index = 0; index < list.length; index++)
			setTimeout(() => {
				const data = {
					method  : "POST",
					headers : { "content-type": "application/json" },
					body    : JSON.stringify({
						UUID : localStorage.UUID,
						ID   : list[index],
					}),
				};
				fetch(PostAddressIP, data)
					.then((ans) => console.log(ans))
					.catch((err) => {
						console.error(err);
					});
			}, 100);
		delete localStorage.TestID;
		console.log("testEEW OK");
	} else {
		const data = {
			method  : "POST",
			headers : { "content-type": "application/json" },
			body    : JSON.stringify({
				UUID: localStorage.UUID,
			}),
		};
		fetch(PostAddressIP, data)
			.catch((err) => {
				console.error(err);
			});
	}
}

function eew_location_intensity(data) {
	const json = {};
	let eew_max_pga = 0;
	for (let i = 0; i < Object.keys(region).length; i++) {
		const city = Object.keys(region)[i];
		for (let index = 0; index < Object.keys(region[city]).length; index++) {
			const town = Object.keys(region[city])[index];
			const info = region[city][town];
			const dist_surface = Math.sqrt(pow((data.lat - info.lat) * 111) + pow((data.lon - info.lon) * 101));
			const dist = Math.sqrt(pow(dist_surface) + pow(data.depth));
			const pga = 12.44 * Math.exp(1.33 * data.scale) * Math.pow(dist, -1.837) * info.site;
			if (pga > eew_max_pga) eew_max_pga = pga;
			json[`${city} ${town}`] = {
				dist,
				pga,
			};
		}
	}
	json.max_pga = eew_max_pga;
	return json;
}

function pga_to_intensity(pga) {
	return (pga > 800) ? 9 : (pga > 440) ? 8 : (pga > 250) ? 7 : (pga > 140) ? 6 : (pga > 80) ? 5 : (pga > 25) ? 4 : (pga > 8) ? 3 : (pga > 2.5) ? 2 : (pga > 0.8) ? 1 : 0;
}

function pow(int) {
	return Math.pow(int, 2);
}

function int_to_color(int) {
	const list = ["#A6ADAD", "#6B7878", "#1E6EE6", "#32B464", "#FFE05D", "#FFAA13", "#EF700F", "#E60000", "#A00000", "#5D0090"];
	return list[int];
}

function report_report(i) {
	TREM.report_time = Date.now();
	const epicenterIcon = L.icon({
		iconUrl  : "../resource/images/cross.png",
		iconSize : [30, 30],
	});
	const intensity = report_data[i].data[0]?.areaIntensity ?? 0;
	const intensity_level = (intensity == 0) ? "--" : int_to_intensity(intensity);
	if (TREM.report_epicenterIcon) TREM.report_epicenterIcon.remove();
	TREM.report_epicenterIcon = L.marker([report_data[i].epicenterLat, report_data[i].epicenterLon],
		{ icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
	document.getElementById("report_title_text").innerHTML = `${get_lang_string("report.title").replace("${type}", (report_data[i].location.startsWith("TREM 人工定位")) ? get_lang_string("report.title.Local") : ((report_data[i].earthquakeNo % 1000) ? report_data[i].earthquakeNo : get_lang_string("report.title.Small")))}`;
	document.getElementById("report_box").style.backgroundColor = (intensity > 4) ? "red" : "#FF9224";
	document.getElementById("report_body").style.backgroundColor = "#514339";
	document.getElementById("report_max_intensity").innerHTML = (report_data[i].location.startsWith("TREM 人工定位")) ? `${report_data[i].location.substring(report_data[i].location.indexOf("(") + 1, report_data[i].location.indexOf(")")).replace("位於", "")}` : `${report_data[i].data[0].areaName} ${report_data[i].data[0].eqStation[0].stationName}`;
	const eew_intensity = document.getElementById("report_intensity");
	eew_intensity.className = `intensity_${intensity_level} intensity_center`;
	eew_intensity.innerHTML = intensity_level;
	document.getElementById("report_location").innerHTML = `${report_data[i].location.substring(report_data[i].location.indexOf("(") + 1, report_data[i].location.indexOf(")")).replace("位於", "")}`;
	document.getElementById("report_time").innerHTML = get_lang_string("eew.time").replace("${time}", report_data[i].originTime);

	let report_magnitudeValue = report_data[i].magnitudeValue.toString();
	if (report_magnitudeValue.length == 1)
		report_magnitudeValue = report_magnitudeValue + ".0";

	document.getElementById("report_scale").innerHTML = `M ${report_magnitudeValue}`;
	document.getElementById("report_args").innerHTML = `${get_lang_string("word.depth")}:&nbsp;<b>${report_data[i].depth}</b>&nbsp;km`;

	// if (TREM.Report._markers.length) {
	// 	for (const marker of TREM.Report._markers)
	// 		marker.remove();
	// 	TREM.Report._markers = [];
	// }
	// if (TREM.Report._markersGroup) TREM.Report._markersGroup.remove();
	// if (report_data[i].data.length)
	// 	for (const data of report_data[i].data)
	// 		for (const eqStation of data.eqStation)
	// 			TREM.Report._markers.push(L.marker(
	// 				[eqStation.stationLat, eqStation.stationLon],
	// 				{
	// 					icon: L.divIcon({
	// 						iconSize  : [16, 16],
	// 						className : `map-intensity-icon ${IntensityToClassString(eqStation.stationIntensity)}`,
	// 					}),
	// 					zIndexOffset: 100 + IntensityToClassString(eqStation.stationIntensity),
	// 				}));
	// TREM.Report._markersGroup = L.featureGroup(TREM.Report._markers).addTo(TREM.Maps.main);

	$(".eew_box").css("display", "none");
	$(".report_box").css("display", "inline");
	$(".report_hide").css("display", "inline");
}

function IntensityToClassString(level) {
	const classname = (level == 9) ? "seven"
		: (level == 8) ? "six strong"
			: (level == 7) ? "six"
				: (level == 6) ? "five strong"
					: (level == 5) ? "five"
						: (level == 4) ? "four"
							: (level == 3) ? "three"
								: (level == 2) ? "two"
									: (level == 1) ? "one"
										: "zero";

	// if (tinycolor(setting["theme.customColor"] ? setting[`theme.int.${level}`] : [
	// 	"#757575",
	// 	"#757575",
	// 	"#2774C2",
	// 	"#7BA822",
	// 	"#E8D630",
	// 	"#E68439",
	// 	"#DB641F",
	// 	"#F55647",
	// 	"#DB1F1F",
	// 	"#862DB3",
	// ][level]).getLuminance() > 0.575)
	// 	classname += " darkText";

	return classname;
}