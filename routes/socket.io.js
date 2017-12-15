module.exports = (io) => {
	io.on('connection', (socket) => { // 웹소켓 연결 시
		var uid  = Math.random();

		console.log('Socket initiated!');
		socket.on('newScoreToServer', (data) => {
			console.log('Socket: newScore');
			io.emit('newScoreToClient', { message: "반가워" });
		});
		socket.on('init', function(data){
			//
		});
	});

};