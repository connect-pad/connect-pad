const md5 = require('md5');

global.GAME_MAXIMUM_USER_COUNT = 4;
global.GAME_USER_JOIN_TIMEOUT_MILLI_SECOND = 20 * 1000;


module.exports = (io) => {
	console.log("socket.io.js has been exported");
	var isGamePlaying = false;
	var waitingQueue = [];
	var currentGameUserQueue = [];
	io.on('connection', (socket) => {
		var uid = socket.id;
		console.log(uid + " connected");
		var currentUser = {
			'uid': uid,
			'socket': socket,
			'userName': null,
			'class': null,
			'isJoined': false
		}

		socket.emit('sendUid', uid);


		socket.on('initialization', (data) => {
			console.log(data);
			currentUser.userName = data.name;
			console.log("init::: waitingQueue");
			console.log(waitingQueue);
			waitingQueue.push(currentUser);

			checkAndStartGroupJoin();
		});

		socket.on('userJoin', (data) => {
			currentUser.isJoined = true;
			currentUser.class = data.class;
			if (isAllGroupUserJoined()) {
				sendJsonToCorona(
					{
						event: "gameStart",
						userList: getReadyUserListWithoutSocket()
					}
				);
				// currentGameUserQueue.map(user => {
				// 	user.socket.emit('gameStart', {});
				// });
				console.log(currentGameUserQueue);
				currentGameUserQueue.forEach((element, index) => {
					element.socket.emit(
						'gameStart',
						{
						}
					)

				});
				timeoutTimer && clearTimeout(timeoutTimer);
				isGamePlaying = true;

			}
		});

		socket.on('arrowKeyDown', (data) => {
			console.log(uid + " " + JSON.stringify(data));
			sendJsonToCorona(
				{
					event: "arrowKeyDown",
					uid: uid,
					arrow: data.arrow
				}
			);
		});
		socket.on('arrowKeyUp', (data) => {
			console.log(uid + " " + JSON.stringify(data));
			sendJsonToCorona(
				{
					event: "arrowKeyUp",
					uid: uid
				}
			);
		});

		socket.on('rotationKeyDown', (data) => {
			console.log(uid + " " + JSON.stringify(data));
			sendJsonToCorona(
				{
					event: "rotationKeyDown",
					uid: uid,
					angle: data.angle
				}
			);
		});
		socket.on('rotationKeyUp', (data) => {
			console.log(uid + " " + JSON.stringify(data));
			sendJsonToCorona(
				{
					event: "rotationKeyUp",
					uid: uid
				}
			);
		});

		socket.on('disconnect', function () {
			// waitingQueue = waitingQueue.filter(usr => usr.connected);
			console.log(uid + " disconnected");
			sendJsonToCorona(
				{
					event: "userDisconnected",
					uid: uid
				}
			);
		});





	});

	function sendJsonToCorona(jsonData) {

		global.connection && global.connection.send(JSON.stringify(jsonData));
	}

	function getConnectedUserList() {
		console.log("waiting que");
		console.log(waitingQueue);
		console.log("getConnectedUserList");
		return waitingQueue.filter(user => user.socket.connected);
	}

	function checkAndStartGroupJoin() {
		console.log("checkAndStartGroupJoin");
		if (isGamePlaying == false && isGroupHasEnoughUsers()) {
			startGroupJoin();
		}
	}

	function isGroupHasEnoughUsers() {
		console.log("isGroupHasEnoughUsers");
		console.log(getConnectedUserList().length >= global.GAME_MAXIMUM_USER_COUNT);
		return getConnectedUserList().length >= global.GAME_MAXIMUM_USER_COUNT;
	}

	function startGroupJoin() {
		console.log("startGroupJoin")
		console.log(waitingQueue)
		currentGameUserQueue = waitingQueue.splice(0, global.GAME_MAXIMUM_USER_COUNT);
		console.log("splitted")
		console.log(waitingQueue)

		currentGameUserQueue.forEach((element, index) => {
			element.socket.emit(
				'userGroupReady',
				{
					'class': index
				}
			)

		});

		rejectUnreadyUserAfterJoinTimeout();

	}

	function isAllGroupUserJoined() {
		return currentGameUserQueue.filter(user => user.isJoined == false).length == 0;
	}

	function getReadyUserListWithoutSocket() {
		return currentGameUserQueue
			.filter(user => user.socket.connected)
			.filter(user => user.isJoined)
			.map(user => {
				return {

					'uid': user.uid,
					'userName': user.userName,
					'class': user.class,
					'isJoined': user.isJoined
				}
			});
	}

	var timeoutTimer;
	function rejectUnreadyUserAfterJoinTimeout() {
		timeoutTimer && clearTimeout(timeoutTimer);
		timeoutTimer = setTimeout(() => {
			console.log("rejectUnreadyUserAfterJoinTimeout");
			console.log(currentGameUserQueue);
			var additionalUserCount = currentGameUserQueue
				.filter(user => user.socket.connected == false || user.isJoined == false)
				.length;

			console.log("additionalUserCount : " + additionalUserCount);
			if (additionalUserCount != 0) {
				currentGameUserQueue.map(user => {
					if (user.isJoined) {
						waitingQueue.splice(0, 0, user);
					}
					else {
						user.socket.disconnect(true);
					}
				});
				checkAndStartGroupJoin();
			}
		},
			global.GAME_USER_JOIN_TIMEOUT_MILLI_SECOND
		);

	}

	global.gameEnd = function () {
		console.log("gameEnd called")
		console.log(currentGameUserQueue)
		currentGameUserQueue.map(data => {
			data.socket.emit('gameEnd', {});
			data.isJoined = false;
			waitingQueue.push(data);
		});

		currentGameUserQueue = [];
		isGamePlaying = false;
		checkAndStartGroupJoin();

	}

	global.emitToUserSocket = function (uid, event, content) {
		console.log(uid);
		console.log(event);
		console.log(content);
		try {

			io.sockets.connected(uid).emit.emit(event, content);
		}
		catch (e) {

		}
	}

	global.serverRestarted = function () {
		console.log("serverRestarted1!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
		try {


			Object.keys(io.sockets.sockets).forEach(function (s) {
				io.sockets.sockets[s].emit('serverRestarted', {});
				io.sockets.sockets[s].disconnect(true);
			});

			isGamePlaying = false;
			waitingQueue = [];
			currentGameUserQueue = [];

		}
		catch (e) {
			console.log(e);
		}
	}

	global.serverRestarted();

};