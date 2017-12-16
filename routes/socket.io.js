const md5 = require('md5');

module.exports = (io) => {

	io.on('connection', (socket) => { // 웹소켓 연결 시
		var uid = socket.id;
		console.log(uid + " connected");
		io.emit('sendUid', uid);
		global.userList.push(socket);
		global.userList = global.userList.filter(usr => usr.connected);

		socket.on('initialization', function (data) {
			console.log(data);
			socket.userName = data.name;
			console.log(global.userList.map(user => user.userName).join(", "));
		});

		socket.on('arrowKeyDown', (data) => {
			console.log(uid + " " + JSON.stringify(data));
			global.connection.sendBytes(
				Buffer.from(
					JSON.stringify({
						event: "arrowKeyDown",
						uid: uid,
						arrow: data.arrow
					}), 'utf8')
			);
		});
		socket.on('arrowKeyUp', (data) => {
			console.log(uid + " " + JSON.stringify(data));
			global.connection.sendBytes(
				Buffer.from(
					JSON.stringify({
						event: "arrowKeyUp",
						uid: uid
					}), 'utf8')
			);
		});

		socket.on('rotationKeyDown', (data) => {
			console.log(uid + " " + JSON.stringify(data));
			global.connection.sendBytes(
				Buffer.from(
					JSON.stringify({
						event: "rotationKeyDown",
						uid: uid,
						angle: data.angle
					}), 'utf8')
			);
		});
		socket.on('rotationKeyUp', (data) => {
			console.log(uid + " " + JSON.stringify(data));
			global.connection.sendBytes(
				Buffer.from(
					JSON.stringify({
						event: "rotationKeyUp",
						uid: uid
					}), 'utf8')
			);
		});

		socket.on('disconnect', function () {
			global.userList = global.userList.filter(usr => usr.connected);
			console.log(uid + " disconnected");
			global.connection.sendBytes(
				Buffer.from(
					JSON.stringify({
						event: "userDisconnected",
						uid: uid
					}), 'utf8')
			);
		});
	});


};