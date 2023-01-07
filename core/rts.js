/* eslint-disable no-undef */
const station = {};
const station_icon = {};
const detection_box = {};
const detection_list = {};

const detection_data = JSON.parse(fs.readFileSync("./resource/data/detection.json").toString());

get_station_info();
async function get_station_info() {
	try {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, 1500);
		let ans = await fetch("https://exptech.com.tw/api/v1/file?path=/resource/station.json", { signal: controller.signal })
			.catch((err) => void 0);
		if (controller.signal.aborted || ans == undefined) {
			setTimeout(() => get_station_info(), 500);
			return;
		}
		ans = await ans.json();
		for (let i = 0; i < Object.keys(ans).length; i++) {
			const uuid = Object.keys(ans)[i];
			station[uuid.split("-")[2]] = ans[uuid];
		}
	} catch (err) {
		console.log(err);
		setTimeout(() => get_station_info(), 500);
	}
}

function on_rts_data(data) {
	data = data.Data;

	data.I = [
		{
			"uuid"      : "H-541-11370676-10",
			"intensity" : 0,
			"pga"       : 0.19,
			"pgv"       : 0.19,
		},
	];

	let max_pga = 0;
	let max_intensity = 0;
	const detection_location = [];

	for (let i = 0; i < Object.keys(data).length; i++) {
		const uuid = Object.keys(data)[i];
		if (!station[uuid]) continue;
		const info = station[uuid];
		const station_data = data[uuid];
		if (station_data.v > max_pga) max_pga = station_data.v;

		// data.Alert = true;
		// station.alert = true;
		// station_data.i = 1;

		const intensity = (station_data.i < 0) ? 0 : Math.round(station_data.i);
		if (intensity > max_intensity) max_intensity = intensity;
		let icon;
		if (data.Alert && station.alert) {
			if (!detection_location.includes(info.area)) detection_location.push(info.area);
			icon = L.divIcon({
				className : `dot intensity_${intensity}`,
				html      : `<span>${int_to_intensity(intensity)}</span>`,
				iconSize  : [20, 20],
			});
		} else icon = L.divIcon({
			className : `pga_dot pga_${station_data.i.toString().replace(".", "-")} rts_hide`,
			html      : "<span></span>",
			iconSize  : [10, 10],
		});
		if (!station_icon[uuid])
			station_icon[uuid] = L.marker([info.Lat, info.Long], { icon: icon }).addTo(TREM.Maps.main);
		else station_icon[uuid].setIcon(icon);
		station_icon[uuid].setZIndexOffset(Math.round(station_data.v * 10));
		if ((data.Alert && station.alert) && (!detection_list[info.PGA] || intensity > detection_list[info.PGA])) detection_list[info.PGA] = intensity;
		if (TREM.setting.rts_station.includes(uuid)) {
			document.getElementById("rts_location").innerHTML = info.Loc;
			document.getElementById("rts_pga").innerHTML = `加速度 ${station_data.v}`;
			document.getElementById("rts_intensity").innerHTML = `震度 ${station_data.i}`;
			const rts_intensity_level = document.getElementById("rts_intensity_level");
			rts_intensity_level.innerHTML = int_to_intensity(intensity);
			rts_intensity_level.className = `intensity_center intensity_${max_intensity}`;
		}
	}

	for (let i = 0; i < Object.keys(detection_list).length; i++) {
		const key = Object.keys(detection_list)[i];
		if (!detection_data[key]) continue;
		if (!detection_box[key])
			detection_box[key] = L.polygon(detection_data[key], {
				color     : "transparent",
				fillColor : "transparent",
				_color    : (detection_list[key] >= 4) ? "#FF0000" : (detection_list[key] >= 2) ? "#F9F900" : "#28FF28",
			}).addTo(TREM.Maps.main);
	}

	const max_pga_text = document.getElementById("max_pga");
	const max_intensity_text = document.getElementById("max_intensity");
	if (data.Alert) {
		if (max_intensity > TREM.rts_audio.intensity && TREM.rts_audio.intensity != 10)
			if (max_intensity > 4) {
				TREM.rts_audio.intensity = 10;
				TREM.audio.minor.push("Shindo2");
			} else if (max_intensity > 1) {
				TREM.rts_audio.intensity = 4;
				TREM.audio.minor.push("Shindo1");
			} else {
				TREM.rts_audio.intensity = 1;
				TREM.audio.minor.push("Shindo0");
			}
		if (max_pga > TREM.rts_audio.pga && TREM.rts_audio.pga <= 8)
			if (max_pga > 8) {
				TREM.rts_audio.pga = max_pga;
				TREM.audio.minor.push("PGA2");
			} else if (max_pga > 2) {
				TREM.rts_audio.pga = 8;
				TREM.audio.minor.push("PGA1");
			}
		const detection_location_1 = document.getElementById("detection_location_1");
		const detection_location_2 = document.getElementById("detection_location_2");
		if (!Object.keys(TREM.EQ_list).length) {
			document.getElementById("eew_title_text").innerHTML = (max_intensity >= 4) ? "強震檢測" : (max_intensity >= 2) ? "震動檢測" : "弱反應";
			document.getElementById("eew_box").style.backgroundColor = (max_intensity >= 4) ? "#E80002" : (max_intensity >= 2) ? "#C79A00" : "#149A4C";
			let _text_1 = "";
			let _text_2 = "";
			for (let i = 0; i < detection_location.length; i++) {
				if (i > 7) break;
				if (i < 4) _text_1 += `${detection_location[i]}<br>`;
				else _text_2 += `${detection_location[i]}<br>`;
			}
			detection_location_1.innerHTML = _text_1;
			detection_location_2.innerHTML = _text_2;
			detection_location_1.className = "detection_location_text";
			detection_location_2.className = "detection_location_text";
		} else {
			detection_location_1.innerHTML = "";
			detection_location_2.innerHTML = "";
			detection_location_1.className = "";
			detection_location_2.className = "";
		}
		max_intensity_text.innerHTML = int_to_intensity(max_intensity);
		max_intensity_text.className = `intensity_center intensity_${max_intensity}`;
	} else {
		TREM.rts_audio.intensity = 0;
		TREM.rts_audio.pga = 0;
		if (!Object.keys(TREM.EQ_list).length) document.getElementById("eew_title_text").innerHTML = "地震預警未發布";
		max_intensity_text.innerHTML = "";
		max_intensity_text.className = "";
	}
	max_pga_text.innerHTML = `${max_pga} gal`;
	max_pga_text.className = `intensity_center intensity_${max_intensity}`;

	const intensity_list = document.getElementById("intensity_list");
	if (data.I.length) {
		intensity_list.innerHTML = "";
		intensity_list.style.visibility = "visible";
		for (let i = 0; i < data.I.length; i++) {
			if (i > 7) break;
			const intensity_list_item = document.createElement("intensity_list_item");
			intensity_list_item.className = "intensity_list_item";
			let loc = "";
			for (let index = 0; index < Object.keys(station).length; index++) {
				const uuid = Object.keys(station)[index];
				if (data.I[i].uuid.includes(uuid)) {
					loc = station[uuid].Loc;
					break;
				}
			}
			intensity_list_item.innerHTML = `<div class="intensity_${data.I[i].intensity} intensity_center" style="font-size: 14px;border-radius: 3px;width: 20%;">${int_to_intensity(data.I[i].intensity)}</div><div style="font-size: 14px;display: grid;align-items: center;padding-left: 2px;width: 80%;">${loc}</div>`;
			intensity_list.appendChild(intensity_list_item);
		}
	} else intensity_list.style.visibility = "hidden";
}