'use strict';

const ws = new WebSocket(`wss://${location.host}`);

ws.addEventListener('open', e => {
	output.textContent += 'しぐなるさーばにつながったよ\n';
});
ws.addEventListener('error', e => {
	output.textContent += 'しぐなるさーばえらー\n';
});

async function camera()
{
	radiconOK.textContent = 'かめらになったよ';
	radiconOK.disabled = passwd.disabled = true;

	const videoTag = document.createElement('video');
	videoTag.autoplay = true;
	videoTag.controls = true;
	document.body.appendChild(videoTag);

	const stream = await navigator.mediaDevices.getUserMedia({
		video: {
			width: 1280,
			height: 720,
			frameRate: { ideal: 60 },
			facingMode: 'environment',
		},
	});
	videoTag.srcObject = stream;

	const camConn = new RTCPeerConnection({ iceServers: [] });
	for (const track of stream.getTracks()) {
		console.log('track', track);
		camConn.addTrack(track, stream);
	}
	const camDesc = await camConn.createOffer();
	console.log('camDesc', camDesc);
	await camConn.setLocalDescription(camDesc);
	ws.send(JSON.stringify({
		role: 'camera',
		passwd: passwd.value,
		desc: camDesc,
	}));
	output.textContent += 'がめんにせつぞくしているよ ... ';

	const vidDesc = await new Promise(res => {
		function handler(e) {
			if (JSON.parse(e.data).passwd === passwd.value
					&& JSON.parse(e.data).role !== 'camera') {
				output.textContent += 'OK\n';
				ws.removeEventListener('message', handler);
				res(JSON.parse(e.data).desc);
			}
		}
		ws.addEventListener('message', handler);
	});
	console.log('vidDesc', vidDesc);
	await camConn.setRemoteDescription(vidDesc);
	camConn.addEventListener('icecandidate', e => {
		if (e.candidate)
			ws.send(JSON.stringify({
				role: 'camera',
				passwd: passwd.value,
				candidate: e.candidate,
			}));
	});

	output.textContent += 'もういちど ... ';
	ws.addEventListener('message', e => {
		if (JSON.parse(e.data).passwd === passwd.value
				&& JSON.parse(e.data).role !== 'camera') {
			output.textContent += 'OK ';
			console.log(JSON.parse(e.data).candidate);
			camConn.addIceCandidate(JSON.parse(e.data).candidate);
		}
	});
}

async function screen()
{
	radiconOK.textContent = 'がめんになったよ';
	radiconOK.disabled = passwd.disabled = true;

	const videoTag = document.createElement('video');
	videoTag.autoplay = true;
	videoTag.controls = true;
	document.body.appendChild(videoTag);

	const vidConn = new RTCPeerConnection({ iceServers: [] });
	vidConn.addEventListener('track', e => {
		console.log('track', e);
		videoTag.srcObject = e.streams[0];
	});

	output.textContent += 'かめらのせつぞくをまっているよ ... ';
	const camDesc = await new Promise(res => {
		function handler(e) {
			if (JSON.parse(e.data).passwd === passwd.value
					&& JSON.parse(e.data).role !== 'screen') {
				output.textContent += 'OK\n';
				ws.removeEventListener('message', handler);
				res(JSON.parse(e.data).desc);
			}
		}
		ws.addEventListener('message', handler);
	});
	console.log('camDesc', camDesc);

	output.textContent += 'もういちど ... ';
	await vidConn.setRemoteDescription(camDesc);
	vidConn.addEventListener('icecandidate', e => {
		if (e.candidate) {
			ws.send(JSON.stringify({
				role: 'screen',
				passwd: passwd.value,
				candidate: e.candidate,
			}));
		}
	});
	const vidDesc = await vidConn.createAnswer();
	console.log('vidDesc', vidDesc);
	await vidConn.setLocalDescription(vidDesc);
	ws.send(JSON.stringify({
		role: 'screen',
		passwd: passwd.value,
		desc: vidDesc,
	}));

	ws.addEventListener('message', e => {
		if (JSON.parse(e.data).passwd === passwd.value
			&& JSON.parse(e.data).role !== 'screen') {
			output.textContent += 'OK ';
			vidConn.addIceCandidate(JSON.parse(e.data).candidate);
		}
	});
}

async function retry()
{
	radiconOK.textContent = 'ちゃんとえらんで';
}

radiconOK.addEventListener('click', e => {
	const procTab = { camera, screen };
	(procTab[document.forms.radicon.role.value] || retry)();
});
