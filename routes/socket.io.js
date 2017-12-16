const md5 = require('md5');

global.GAME_MAXIMUM_USER_COUNT = 3;
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
			waitingQueue = waitingQueue.filter(usr => usr.connected);
			console.log(uid + " disconnected");
			sendJsonToCorona(
				{
					event: "userDisconnected",
					uid: uid
				}
			);
		});

		function sendJsonToCorona(jsonData) {

			/*
			global.connection.sendBytes(
				Buffer.from(
					JSON.stringify(jsonData),
					'utf8'
				)
			);*/
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
					delete user.socket;
					return user
				});
		}

		function rejectUnreadyUserAfterJoinTimeout() {
			setTimeout(() => {
				console.log("rejectUnreadyUserAfterJoinTimeout");
				console.log(currentGameUserQueue);
				var additionalUserCount = currentGameUserQueue
					.filter(user => user.socket.connected == false || user.isJoined == false)
					.length;

				console.log("additionalUserCount : " + additionalUserCount);
				if (additionalUserCount != 0) {
					var joinedUserList = currentGameUserQueue.filter(user => user.isJoined);
					if(joinedUserList != 0)	waitingQueue.unshift(joinedUserList);
					checkAndStartGroupJoin();
				}
			},
				global.GAME_USER_JOIN_TIMEOUT_MILLI_SECOND
			);

		}

		global.gameEnd = function () {
			var dd = [];

			currentGameUserQueue.map(data => {
				data.socket.emit('gameEnd', {});
				data.isJoined = false;
			});

			waitingQueue.push(currentGameUserQueue);
			currentGameUserQueue = [];
			isGamePlaying = false;
			checkAndStartGroupJoin();

		}


	});


};