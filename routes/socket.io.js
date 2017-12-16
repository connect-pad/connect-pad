const md5 = require('md5');

global.GAME_MAXIMUM_USER_COUNT = 4;
global.GAME_USER_JOIN_TIMEOUT_MILLI_SECOND = 30 * 1000;


module.exports = (io) => {

	global.isGamePlaying = false;
	global.waitingQueue = [];
	global.currentGameUserQueue = [];

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

		io.emit('sendUid', uid);

		global.waitingQueue.push(currentUser);

		socket.on('initialization', (data) => {
			console.log(data);
			currentUser.userName = data.name;

			checkAndStartGroupJoin();
		});

		socket.on('userJoin', (data) => {
			currentUser.isJoined = True;

			if(isAllGroupUserJoined){
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
			global.waitingQueue = global.waitingQueue.filter(usr => usr.connected);
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
		
		function getConnectedUserList(){
			return global.waitingQueue.filter(user => user.socket.connected);
		}

		function checkAndStartGroupJoin(){
			if(isGamePlaying == false && isGroupHasEnoughUsers()){
				startGroupJoin();
			}
		}

		function isGroupHasEnoughUsers(){
			return getConnectedUserList().length >= global.GAME_MAXIMUM_USER_COUNT;
		}

		function startGroupJoin(){
			global.currentGameUserQueue = global.waitingQueue.splice(0, global.GAME_MAXIMUM_USER_COUNT);

			readyUserList.forEach((element, index) => {
				element.send(
					'userGroupReady',
					{
						'class':index
					}
				)
			});
		}

		function isAllGroupUserJoined(){
			return global.currentGameUserQueue.filter(user => user.isJoined == false).length == 0;
		}

		function getReadyUserListWithoutSocket(){
			return global.currentGameUserQueue
				.filter(user => user.socket.connected)
				.filter(user => user.isJoined)
				.map(user => {
					delete user.socket;
					return user
				});
		}

		function rejectUnreadyUserAfterJoinTimeout(){
			setTimeout(() => {
					var additionalUserCount = global.currentGameUserQueue
						.filter(user => user.socket.connected == false || user.isJoined == false)
						.length;

					if(additionalUserCount != 0){
						global.waitingQueue.unshift(currentGameUserQueue.filter(user => user.isJoined));
						checkAndStartGroupJoin();
					}
					},
				global.GAME_USER_JOIN_TIMEOUT_MILLI_SECOND
			);
		}
	});


};