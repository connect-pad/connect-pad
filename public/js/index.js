$(document).ready(function () {


	var soundList = [
		{ filename: "131660__bertrof__game-sound-correct.wav", name: "button" },
		{ filename: "gun1.ogg", name: "sound1" }
		// { filename: "1. Dead Inside.mp3", name: "button1" }
	];
	var nowLoadingSoundIndex = 0;
	var loadSound = function (index) {
		createjs.Sound.registerSound("/se/" + soundList[nowLoadingSoundIndex].filename, soundList[nowLoadingSoundIndex].name);
	}
	createjs.Sound.on("fileload", function (e) {
		console.log(nowLoadingSoundIndex)
		console.log(soundList.length);
		if (nowLoadingSoundIndex >= soundList.length - 1) {

			$("body>div, body>form").addClass('inactive');
			$(".setUserName").removeClass('inactive');
		}
		else {
			loadSound(++nowLoadingSoundIndex)
		}
	});

	loadSound(0);



	// createjs.Sound.registerSound("/se/131660__bertrof__game-sound-correct.wav", "button");
	createjs.Sound.play("button");

	$(".joinGame-selectCharacter").slick({
		slidesToShow: 1.5,
		slidesToScroll: 1,
		autoplay: false,
		speed: 500
	});
	$("body").on('click','.joinGame-selectCharacter .slick-slide', function(){
		// slickGoTo
		console.log($(this).attr('data-slick-index'));
		$(".joinGame-selectCharacter").slick("slickGoTo", $(this).attr('data-slick-index'));

	});

	

	// $(".joinGame-selectCharacter").on('beforeChange', function (event, slick, currentSlide, nextSlide) {
	// 	$(".joinGame-selectCharacter div").removeClass("selected");
	// 	$(".joinGame-selectCharacter div:eq("+nextSlide+")").addClass('selected');
	// 	console.log(nextSlide);
	// });



	var socket = io.connect(location.protocol + '//' + location.hostname + ':' + location.port);

	socket.on('sendUid', function (data) {
		$("body .sessionInfo").remove();
		$("body").append("<span class='sessionInfo' style='display: block; position: absolute; z-index: 0; left: 0; bottom: 0;'>" + data + "</span>");
	})

	socket.on('userGroupReady', function (data) {
		$("body>div, body>form").addClass('inactive');
		$(".joinGame").removeClass('inactive');
	});

	socket.on('vibration', function (data) {
		console.log(data);
		navigator.vibrate(parseInt(data.time));
	});

	socket.on('soundEffect', function (data) {
		console.log(data.file);
		createjs.Sound.play(data.file);
	});

	socket.on('gameStart', function (data) {
		$("body>div, body>form").addClass('inactive');
		$(".gamePlay").removeClass('inactive');
	});

	socket.on('gameEnd', function (data) {
		$("body>div, body>form").addClass('inactive');
		$(".waitForReady").removeClass('inactive');

	});


	socket.on('serverRestarted', function (data) {
		location.reload();
	});

	socket.on('disconnected', function (data) {
		location.reload();
	});

	$("body>div, body>form").addClass('inactive');
	$(".splashScreen").removeClass('inactive');


	$("body").on("submit", ".setUserName", function (e) {
		e.preventDefault();
		socket.emit('initialization', { name: $(this).find('input').val() });
		$("body>div, body>form").addClass('inactive');
		$(".waitForReady").removeClass('inactive');
		createjs.Sound.play("button");
		navigator.vibrate(100);
		document.activeElement.blur();
	});

	$("body").on("submit", ".joinGame", function (e) {
		e.preventDefault();
		socket.emit('userJoin', {
			class: $(".joinGame-selectCharacter").slick('slickCurrentSlide') + 1
		});
		$("body>div, body>form").addClass('inactive');
		$(".waitForReady").removeClass('inactive');
		createjs.Sound.play("button");
		navigator.vibrate(100);
		document.activeElement.blur();
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

	padRight.on('move', function (e, data) {
		socket.emit('rotationKeyDown', { angle: data.angle.radian });
	});

	padRight.on('end', function (e) {
		socket.emit('rotationKeyUp', {});
	});

	var timeoutTimer;
	document.addEventListener("visibilitychange", function (e) {
		console.log(document.hidden, document.visibilityState);
		timeoutTimer && clearTimeout(timeoutTimer);
		if (document.hidden || document.visibilityState == "hidden") {
			timeoutTimer = setTimeout(function () {
				socket.disconnect();
				location.reload();
			}, 3000);
		}
	}, false);

});
