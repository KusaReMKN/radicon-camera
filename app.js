'use strict';

const fs    = require('fs');
const https = require('https');
const ws    = require('ws');

const port = 8443;

const server = https.createServer(
	{
		cert: fs.readFileSync('./server_crt.pem'),
		key : fs.readFileSync('./server_key.pem'),
	},
	(req, res) => {
		const path = req.url === '/' ? '/index.html' : req.url;
		let content;
		try {
			content = fs.readFileSync('.' + path);
		} catch (e) {
			res.writeHead(404);
			res.end('NOT FOUND');
			return;
		}
		res.end(content);
	}
);

const wss = new ws.WebSocketServer({ server });

wss.on('connection', ws => {
	ws.on('message', (data, isBin) => {
		for (const client of wss.clients) {
			client.send(data, { binary: isBin });
		}
	});
});

console.log(`Listen on port ${port}`);
server.listen(port);
