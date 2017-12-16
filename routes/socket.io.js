const md5 = require('md5');

global.GAME_MAXIMUM_USER_COUNT = 4;
global.GAME_USER_JOIN_TIMEOUT_MILLI_SECOND = 20 * 1000;


module.exports = (io) => {
	console.log("socket.io.js has been exported");
	io.isGamePlaying = false;
	io.waitingQueue = [];
	io.currentGameUserQueue = [];
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
			console.log("init::: io.waitingQueue");
			console.log(io.waitingQueue);
			io.waitingQueue.push(currentUser);
			socket.emit('vibration', { time: 500 });
			
			checkAndStartGroupJoin();
		});

		socket.on('userJoin', (data) => {
			currentUser.isJoined = True;

			if (isAllGroupUserJoined()) {
				sendJsonToCorona(
					{
						event: "gameStart",
						userList: getReadyUserListWithoutSocket()
					}
				)
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
			io.waitingQueue = io.waitingQueue.filter(usr => usr.connected);
			console.log(uid + " disconnected");
			sendJsonToCorona(
				{
					event: "userDisconnected",
					uid: uid
				}
			);
		});

		function sendJsonToCorona(jsonData) {

			global.connection.sendBytes(
				Buffer.from(
					JSON.stringify(jsonData),
					'utf8'
				)
			);
		}

		function getConnectedUserList() {
			console.log("waiting que");
			console.log(io.waitingQueue);
			console.log("getConnectedUserList");
			console.log(io.waitingQueue.filter(user => user.socket.connected));
			return io.waitingQueue.filter(user => user.socket.connected);
		}

		function checkAndStartGroupJoin() {
			console.log("checkAndStartGroupJoin");
			console.log(io.isGamePlaying == false && isGroupHasEnoughUsers());
			if (io.isGamePlaying == false && isGroupHasEnoughUsers()) {
				startGroupJoin();
			}
		}

		function isGroupHasEnoughUsers() {
			console.log("isGroupHasEnoughUsers");
			console.log(getConnectedUserList().length >= global.GAME_MAXIMUM_USER_COUNT);
			return getConnectedUserList().length >= global.GAME_MAXIMUM_USER_COUNT;
		}

		function startGroupJoin() {
			io.currentGameUserQueue = io.waitingQueue.splice(0, global.GAME_MAXIMUM_USER_COUNT);

			io.currentGameUserQueue.forEach((element, index) => {
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
			return io.currentGameUserQueue.filter(user => user.isJoined == false).length == 0;
		}

		function getReadyUserListWithoutSocket() {
			return io.currentGameUserQueue
				.filter(user => user.socket.connected)
				.filter(user => user.isJoined)
				.map(user => {
					delete user.socket;
					return user
				});
		}

		function rejectUnreadyUserAfterJoinTimeout() {
			setTimeout(() => {
				var additionalUserCount = io.currentGameUserQueue
					.filter(user => user.socket.connected == false || user.isJoined == false)
					.length;

				if (additionalUserCount != 0) {
					io.waitingQueue.unshift(io.currentGameUserQueue.filter(user => user.isJoined));
					checkAndStartGroupJoin();
				}
			},
				global.GAME_USER_JOIN_TIMEOUT_MILLI_SECOND
			);

		}

		global.gameEnd = function () {
			var dd = [];

			io.currentGameUserQueue.map(data => {
				data.socket.emit('gameEnd', {});
				data.isJoined = false;
			});

			io.waitingQueue.push(io.currentGameUserQueue);
			io.currentGameUserQueue = [];
			io.isGamePlaying = false;
			checkAndStartGroupJoin();

		}

		global.emitToUserSocket = function (uid, event, content) {
			io.to('/#' + uid).emit(event, content);
		}



	});


};