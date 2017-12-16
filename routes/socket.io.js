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
		});
		socket.on('arrowKeyUp', (data) => {
			console.log(uid + " " + JSON.stringify(data));
		});

		socket.on('rotationKeyDown', (data) => {
			console.log(uid + " " + JSON.stringify(data));
		});
		socket.on('rotationKeyUp', (data) => {
			console.log(uid + " " + JSON.stringify(data));
		});

		socket.on('disconnect', function () {
			global.userList = global.userList.filter(usr => usr.connected);
			console.log(uid + " disconnected");
		});
	});


};