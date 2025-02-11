/* eslint-disable no-undef */
const audioDOM_1 = new Audio();
const audioDOM_2 = new Audio();
let player_1 = false;
let player_2 = false;
audioDOM_1.addEventListener("ended", () => {
	player_1 = false;
});
audioDOM_2.addEventListener("ended", () => {
	player_2 = false;
});

let drawer_lock = false;
let focus_lock = false;
let Zoom = false;
let Zoom_timestamp = 0;
const _map = document.getElementById("map");
_map.addEventListener("mousedown", () => {
	Zoom = false;
	focus_lock = true;
	document.getElementById("location_button").style.color = "white";
});

setInterval(() => {
	setTimeout(() => {
		const now = Now();
		const time = document.getElementById("time");
		let _Now = now.getFullYear().toString();
		_Now += "/";
		if ((now.getMonth() + 1) < 10) _Now += "0" + (now.getMonth() + 1).toString();
		else _Now += (now.getMonth() + 1).toString();
		_Now += "/";
		if (now.getDate() < 10) _Now += "0" + now.getDate().toString();
		else _Now += now.getDate().toString();
		_Now += " ";
		if (now.getHours() < 10) _Now += "0" + now.getHours().toString();
		else _Now += now.getHours().toString();
		_Now += ":";
		if (now.getMinutes() < 10) _Now += "0" + now.getMinutes().toString();
		else _Now += now.getMinutes().toString();
		_Now += ":";
		if (now.getSeconds() < 10) _Now += "0" + now.getSeconds().toString();
		else _Now += now.getSeconds().toString();
		if (WS) time.innerHTML = `<b>${_Now}</b>`;
		else if (replay) time.innerText = `${new Date(replay + (NOW.getTime() - replayT)).format("YYYY/MM/DD HH:mm:ss")}`;

		if (Object.keys(TREM.EQ_list).length) {
			$(".flash").css("visibility", "hidden");
			setTimeout(() => $(".flash").css("visibility", "visible"), 500);
		}

		if (Object.keys(detection_box).length) {
			for (let i = 0; i < Object.keys(detection_box).length; i++) {
				const key = Object.keys(detection_box)[i];
				detection_box[key].options.color = "transparent";
				detection_box[key].redraw();
			}
			setTimeout(() => {
				for (let i = 0; i < Object.keys(detection_box).length; i++) {
					const key = Object.keys(detection_box)[i];
					detection_box[key].options.color = detection_box[key].options._color;
					detection_box[key].redraw();
				}
			}, 500);
		}

		if (Date.now() - TREM.palert_report_time > 600_000 && TREM.palert_report_time != 0) {
			TREM.palert_report_time = 0;
			refresh_report_list();
		}

		if (Date.now() - TREM.report_time > 30_000 && TREM.report_time != 0)
			report_off();

	}, 1000 - Now().getMilliseconds());
}, 1_000);

setInterval(() => {
	get_station_info();
	refresh_report_list();
}, 600_000);

setInterval(() => {
	if (TREM.audio.main.length) {
		if (player_1) return;
		player_1 = true;
		const nextAudioPath = TREM.audio.main.shift();
		audioDOM_1.src = `../resource/audios/${nextAudioPath}.wav`;
		audioDOM_1.play();
	}
	if (TREM.audio.minor.length) {
		if (player_2) return;
		player_2 = true;
		const nextAudioPath = TREM.audio.minor.shift();
		audioDOM_2.src = `../resource/audios/${nextAudioPath}.wav`;
		audioDOM_2.play();
	}
}, 0);

setInterval(() => {
	if (drawer_lock) return;
	drawer_lock = true;
	if (!Object.keys(TREM.EQ_list).length) {
		eew(false);
		if (TREM.geojson) {
			TREM.geojson.remove();
			$(".eew_hide").css("display", "none");
			document.getElementById("eew_title_text").innerHTML = "";
			document.getElementById("eew_title_text_number").innerHTML = "";
			document.getElementById("eew_box").style.backgroundColor = "#333439";
			document.getElementById("eew_body").style.backgroundColor = "#333439";
			delete TREM.geojson;
		}
		TREM.alert = false;
		drawer_lock = false;
		TREM.dist = 0;
		return;
	} else eew(true);
	for (let i = 0; i < Object.keys(TREM.EQ_list).length; i++) {
		const key = Object.keys(TREM.EQ_list)[i];
		const data = TREM.EQ_list[key].data;
		if (Now().getTime() - data._time > 240_000) {
			if (TREM.EQ_list[key].p_wave) TREM.EQ_list[key].p_wave.remove();
			if (TREM.EQ_list[key].s_wave) TREM.EQ_list[key].s_wave.remove();
			if (TREM.EQ_list[key].epicenterIcon) TREM.EQ_list[key].epicenterIcon.remove();
			delete TREM.EQ_list[key];
			draw_intensity();
			break;
		}
		if (data.cancel) continue;
		const wave = { p: 7, s: 4 };
		let p_dist = Math.floor(Math.sqrt(pow((Now().getTime() - data.time) * wave.p) - pow(data.depth * 1000)));
		let s_dist = Math.floor(Math.sqrt(pow((Now().getTime() - data.time) * wave.s) - pow(data.depth * 1000)));
		for (let _i = 1; _i < TREM.EQ_list[key].wave.length; _i++)
			if (TREM.EQ_list[key].wave[_i].Ptime > (Now().getTime() - data.time) / 1000) {
				p_dist = (_i - 1) * 1000;
				if ((_i - 1) / TREM.EQ_list[key].wave[_i - 1].Ptime > wave.p) p_dist = Math.round(Math.sqrt(pow((Now().getTime() - data.time) * wave.p) - pow(data.depth * 1000)));
				break;
			}
		for (let _i = 1; _i < TREM.EQ_list[key].wave.length; _i++)
			if (TREM.EQ_list[key].wave[_i].Stime > (Now().getTime() - data.time) / 1000) {
				s_dist = (_i - 1) * 1000;
				if ((_i - 1) / TREM.EQ_list[key].wave[_i - 1].Stime > wave.s) s_dist = Math.round(Math.sqrt(pow((Now().getTime() - data.time) * wave.s) - pow(data.depth * 1000)));
				break;
			}
		TREM.EQ_list[key].dist = s_dist;
		if (!TREM.EQ_list[key].p_wave)
			TREM.EQ_list[key].p_wave = L.circle([data.lat, data.lon], {
				color     : "#00FFFF",
				fillColor : "transparent",
				radius    : p_dist,
				renderer  : L.svg(),
				className : "p_wave",
				weight    : 0.5,
			}).addTo(TREM.Maps.main);
		else
			TREM.EQ_list[key].p_wave.setRadius(p_dist);
		if (!TREM.EQ_list[key].s_wave)
			TREM.EQ_list[key].s_wave = L.circle([data.lat, data.lon], {
				color     : "#FF8000",
				fillColor : "transparent",
				radius    : s_dist,
				renderer  : L.svg(),
				className : "s_wave",
				weight    : 2,
			}).addTo(TREM.Maps.main);
		else
			TREM.EQ_list[key].s_wave.setRadius(s_dist);
		if (key == show_eew_id) TREM.eew_bounds.extend(TREM.EQ_list[key].s_wave.getBounds());
		TREM.all_bounds.extend(TREM.EQ_list[key].s_wave.getBounds());
	}
	drawer_lock = false;
}, 0);

setInterval(() => {
	if (focus_lock) return;
	// if (true)
	if (!Object.keys(TREM.EQ_list).length) {
		if (TREM.rts_bounds._northEast == undefined) {
			if (Zoom && Date.now() - Zoom_timestamp > 2_000) {
				Zoom = false;
				TREM.Maps.main.setView([23.7, 120.4], 7.8);
			}
			return;
		}
		Zoom_timestamp = Date.now();
		Zoom = true;
		TREM.Maps.main.setView(TREM.rts_bounds.getCenter(), TREM.Maps.main.getBoundsZoom(TREM.rts_bounds) - 1);
		TREM.rts_bounds = L.latLngBounds();
	} else {
		TREM.rts_bounds = L.latLngBounds();
		if (TREM.eew_bounds._northEast == undefined) {
			if (Zoom && Date.now() - Zoom_timestamp > 2_000) {
				Zoom = false;
				TREM.Maps.main.setView([23.7, 120.4], 7.8);
			}
			return;
		}
		const dist_list = [];
		for (let i = 0; i < Object.keys(TREM.EQ_list).length; i++) {
			const key = Object.keys(TREM.EQ_list)[i];
			dist_list.push(TREM.EQ_list[key].dist ?? 0);
		}
		Zoom_timestamp = Date.now();
		Zoom = true;
		const zoom_now = TREM.Maps.main.getZoom();
		const center_now = TREM.Maps.main.getCenter();
		const center = TREM.eew_bounds.getCenter();
		let zoom = TREM.Maps.main.getBoundsZoom(TREM.eew_bounds) - 1;
		if (Math.abs(zoom - zoom_now) < 0.6 || Math.min(dist_list) / 1000 - TREM.dist > -35) zoom = zoom_now;
		if (zoom > 9.5) zoom = 9.5;
		const set_center = Math.sqrt(pow((center.lat - center_now.lat) * 111) + pow((center.lng - center_now.lng) * 101));
		TREM.Maps.main.setView((set_center > 5) ? center : center_now, (zoom > 7.5) ? zoom : 7.5);
		TREM.eew_bounds = L.latLngBounds();
	}
	// else {
	// 	if (TREM.all_bounds._northEast == undefined) {
	// 		if (Zoom && Date.now() - Zoom_timestamp > 2_000) {
	// 			Zoom = false;
	// 			TREM.Maps.main.setView([23.7, 120.4], 7.8);
	// 		}
	// 		return;
	// 	}
	// 	const dist_list = [];
	// 	for (let i = 0; i < Object.keys(TREM.EQ_list).length; i++) {
	// 		const key = Object.keys(TREM.EQ_list)[i];
	// 		dist_list.push(TREM.EQ_list[key].dist ?? 0);
	// 	}
	// 	Zoom_timestamp = Date.now();
	// 	Zoom = true;
	// 	const zoom_now = TREM.Maps.main.getZoom();
	// 	const center_now = TREM.Maps.main.getCenter();
	// 	const center = TREM.all_bounds.getCenter();
	// 	let zoom = TREM.Maps.main.getBoundsZoom(TREM.all_bounds) - 1;
	// 	if (Math.abs(zoom - zoom_now) < 0.6 || Math.min(dist_list) / 1000 - TREM.dist > -35) zoom = zoom_now;
	// 	if (zoom > 9.5) zoom = 9.5;
	// 	const set_center = Math.sqrt(pow((center.lat - center_now.lat) * 111) + pow((center.lng - center_now.lng) * 101));
	// 	TREM.Maps.main.setView((set_center > 5) ? center : center_now, (zoom > 7.5) ? zoom : 7.5);
	// 	TREM.all_bounds = L.latLngBounds();
	// }
}, 100);