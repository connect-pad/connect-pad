"use strict";
// Port where we'll run the websocket server
var webSocketsServerPort = 1337;
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
/**
 * Global variables
 */
// latest 100 messages
var history = [];
// list of currently connected clients (users)
var clients = [];
/**
 * Helper function for escaping input strings
 */
/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
	// Not important for us. We're writing WebSocket server,
	// not HTTP server
});
server.listen(webSocketsServerPort, function () {
	console.log((new Date()) + " Server is listening on port "
		+ webSocketsServerPort);
});
/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. WebSocket
	// request is just an enhanced HTTP request. For more info 
	// http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server
});
// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
	console.log((new Date()) + ' Connection from origin '
		+ request.origin + '.');
	// accept connection - you should check 'request.origin' to
	// make sure that client is connecting from your website
	// (http://en.wikipedia.org/wiki/Same_origin_policy)
	global.connection = request.accept(null, request.origin);
	// we need to know client index to remove them on 'close' event
	console.log((new Date()) + ' Connection accepted.');
	// send back chat history
	// if (history.length > 0) {
	// 	global.connection.sendUTF(
	// 		JSON.stringify({ type: 'history', data: history }));
	// }
	// user sent some message
	global.connection.on('message', function (message) {
		if (message.type === 'utf8') { // accept only text
			// first message sent by user is their name

			// message.utf8Data
			var data = JSON.parse(message.utf8Data);
			switch (data.event) {
				case "gameEnd":
					global.gameEnd();					
					break;
				case "vibration":
				case "soundEffect":
				default:
					break;
			}

			// global.connection.sendUTF(
			// 	JSON.stringify({ type: 'color', data: userColor }));
			// console.log((new Date()) + ' User is known as: ' + userName
			// 	+ ' with ' + userColor + ' color.');
		}
	});
	// user disconnected
	global.connection.on('close', function (connection) {
		// if (userName !== false && userColor !== false) {
		// 	console.log((new Date()) + " Peer "
		// 		+ connection.remoteAddress + " disconnected.");
		// 	// remove user from the list of connected clients
		// 	clients.splice(index, 1);
		// 	// push back user's color to be reused by another user
		// 	colors.push(userColor);
		// }
	});
});