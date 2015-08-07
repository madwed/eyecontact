var liveConn = false;

var smoother = new Smoother([0.9999999, 0.9999999, 0.999, 0.999], [0, 0, 0, 0]),
	localVideo = document.getElementById("localVideo"),
	remoteVideo = document.getElementById("remoteVideo"),
	localCanvas = document.getElementById("localCanvas"),
	remoteCanvas = document.getElementById("remoteCanvas"),
	localCtx = localCanvas.getContext("2d"),
	remoteCtx = remoteCanvas.getContext("2d"),
	detector, localStream;

var socket = io();  
var peer, conn, myId;

function httpRequest (url, cb) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
			cb();
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}




socket.on('env', function (env) {  
			if (env === 'production'){
				peer = new Peer({
					host:'/', 
					secure:true, 
					port:443, 
					key: 'peerjs', 
					path: '/api', 
					config: {
						'iceServers': [{ url: 'stun:stun.l.google.com:19302' }]
					}
				});
			} else {
				peer = new Peer({host: 'localhost', port: 3000, path: '/api', debug: 2});
			}
			peer.on("open", function (id) {
				console.log("my id: ", id)
				myId = id;
			});
			peer.on("connection", function (pconn) {
				connectionLogic(pconn);
			})

			socket.on("hold", function(){
				console.log("Waiting for a new friend");
			});
			socket.on("meet", function (peerid) {
				console.log(peerid, localStream)
				var call = peer.call(peerid, localStream);
				// connectionLogic(peer.connect(peerid));
				console.log(call);
					call.on('stream', function(remoteStream) {
					// `stream` is the MediaStream of the remote peer.
					// Here you'd add it to an HTML video/canvas element.
						initiateEyeHole(remoteCanvas, remoteCtx, remoteVideo, remoteStream);
					});
				
			});

			peer.on('call', function(call) {
				// Answer the call, providing our mediaStream
				call.answer(localStream);

				call.on('stream', function(remoteStream) {
				// `stream` is the MediaStream of the remote peer.
				// Here you'd add it to an HTML video/canvas element.
					initiateEyeHole(remoteCanvas, remoteCtx, remoteVideo, remoteStream);
				});
			});
			
		});


try {
	compatibility.getUserMedia({video: true}, function(stream) {
		localStream = stream;
		socket.emit("connectme", myId);
		initiateEyeHole(localCanvas, localCtx, localVideo, localStream);
	}, function (error) {
		console.log(error);
		alert("WebRTC not available");
	});
} catch (error) {
	alert(error);
}

function initiateEyeHole (canvas, context, video, stream) {
	try {
		video.src = compatibility.URL.createObjectURL(stream);
	} catch (error) {
		video.src = stream;
	}

	compatibility.requestAnimationFrame(play.bind(null, canvas, context, video));
}

function play (canvas, context, video) {
	compatibility.requestAnimationFrame(play.bind(null, canvas, context, video));
	if (video.paused) video.play();

	if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {

		// Prepare the detector once the video dimensions are known:
		if (!detector) {
			var width = ~~(60 * video.videoWidth / video.videoHeight);
			var height = 60;
			detector = new objectdetect.detector(width, height, 1.1, objectdetect.frontalface);
			canvas.width = video.videoWidth;
			canvas.style.width = video.videoWidth;
			canvas.height = video.videoHeight;
			canvas.style.height = video.videoHeight;
		}

		// Perform the actual detection:
		var coords = detector.detect(video, 1);
		if (coords[0]) {
			context.clearRect(0, 0, canvas.width, canvas.height);
			var coord = coords[0];
			coord = smoother.smooth(coord);

			// Rescale coordinates from detector to video coordinate space:
			coord[0] *= video.videoWidth / detector.canvas.width;
			coord[1] *= video.videoHeight / detector.canvas.height;
			coord[2] *= video.videoWidth / detector.canvas.width;
			coord[3] *= video.videoHeight / detector.canvas.height;

			// context.fillRect(coord[0], coord[1], coord[2], ~~(coord[3] * 6/8));
			var eyePosX = coord[0] + coord[2] / 8;
			var eyePosY = coord[1] + coord[3] / 4;
			var eyeWidth = coord[2] * 3 / 4;
			var eyeHeight = coord[3] / 5; 
			var middle = canvas.width / 2 - eyeWidth / 2;
			context.drawImage(video, eyePosX, eyePosY, eyeWidth, eyeHeight, middle, 0, eyeWidth, eyeHeight);
			// vvv sending less data than video
			// if(liveConn){
			// 	// console.log(typeof context.getImageData(middle, 0, eyeWidth, eyeHeight));
			// 	conn.send(canvas.toDataURL());
			// }
		}
	}
}

// function connectionLogic (pconn) {
// 	liveConn = true;
// 	conn = pconn;
// 	pconn.on('open', function() {
// 		// Receive messages
// 		pconn.on('data', function(data) {
// 			// console.log(data);
// 			if(typeof data === "string") {
// 				var image = new Image();
// 				image.onload = function() {
// 				    remoteCtx.drawImage(image, 0, 0);
// 				};
// 				image.src = data;
// 				// remoteCtx.putImageData(data, 0, 0);
// 			}
// 		});
// 	});
// }


function connectionLogic(pconn){

}









