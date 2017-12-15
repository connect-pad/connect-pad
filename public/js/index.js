$(document).ready(function () {
	var socket = io.connect(location.protocol + '//' + location.hostname + ':' + location.port);

	socket.on('newScoreToClient', function (data) {
		console.log("fdsafdsafdsafdsafdsa'");
	});

	socket.on('sendUid', function (data) {
		$("body").append("session: " + data);
	})

	$("body>div, body>form").addClass('inactive');
	$(".setUserName").removeClass('inactive');


	$("body").on("submit", ".setUserName", function (e) {
		e.preventDefault();
		socket.emit('initialization', { name: $(this).find('input').val() });
		$(".setUserName").addClass('inactive');
		$(".gamePlay").removeClass('inactive');
	});


	var padLeft = nipplejs.create({
		zone: document.getElementById('gamePlay-pad-left'),
		mode: 'static',
		position: { left: '100px', bottom: '100px' },
		color: '#fcfcfc'
	});
	var padRight = nipplejs.create({
		zone: document.getElementById('gamePlay-pad-right'),
		mode: 'static',
		position: { right: '100px', bottom: '100px' },
		color: '#fcfcfc'
	});

	padLeft.on('move', function (e, data) {
		console.log(data);
		if (data.distance >= 18) {
			var dir = "";
			if (data.angle.degree >= 22.5 && data.angle.degree <= 67.5) {
				dir = "NE"
			}
			else if (data.angle.degree >= 67.5 && data.angle.degree <= 112.5) {
				dir = "N"
			}
			else if (data.angle.degree >= 112.5 && data.angle.degree <= 157.5) {
				dir = "NW"
			}
			else if (data.angle.degree >= 157.5 && data.angle.degree <= 202.5) {
				dir = "W"
			}
			else if (data.angle.degree >= 202.5 && data.angle.degree <= 247.5) {
				dir = "SW"
			}
			else if (data.angle.degree >= 247.5 && data.angle.degree <= 292.5) {
				dir = "S"
			}
			else if (data.angle.degree >= 292.5 && data.angle.degree <= 337.5) {
				dir = "SE"
			}
			else {
				dir = "E"
			}
			socket.emit('arrowKeyDown', { arrow: dir });

		}
	});

	padLeft.on('end', function (e) {
		socket.emit('arrowKeyUp', {});
	});



});
