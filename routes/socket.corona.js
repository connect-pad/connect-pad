"use strict";
var webSocketsServerPort = 1337;
var webSocketServer = require('websocket').server;
var http = require('http');

var history = [];
var clients = [];

var server = http.createServer(function (request, response) {

});
server.listen(webSocketsServerPort, function () {
	console.log((new Date()) + " Server is listening on port "
		+ webSocketsServerPort);
});

var wsServer = new webSocketServer({
	httpServer: server
});

wsServer.on('request', function (request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

	var connection = request.accept(null, request.origin);

	var index = clients.push(connection) - 1;
	var userName = false;
	var userColor = false;
	
	console.log((new Date()) + ' Connection accepted.');

	if (history.length > 0) {
		connection.sendUTF(
			JSON.stringify({ type: 'history', data: history }));
	}
	connection.on('message', function (message) {
		if (message.type === 'utf8') { 
			
		}
	});


	connection.on('close', function (connection) {
		if (userName !== false && userColor !== false) {
			console.log((new Date()) + " Peer "
				+ connection.remoteAddress + " disconnected.");
			clients.splice(index, 1);
			colors.push(userColor);
		}
	});
});