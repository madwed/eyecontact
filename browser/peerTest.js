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
			if(liveConn){
				//sending string
				conn.send({data: btoa(String.fromCharCode.apply(null, context.getImageData(middle, 0, eyeWidth, eyeHeight).data)), height: eyeHeight, width: eyeWidth});
			}
		}
	}
}

function initiateEyeHole (canvas, context, video, stream) {
	try {
		video.src = compatibility.URL.createObjectURL(stream);
	} catch (error) {
		video.src = stream;
	}

	compatibility.requestAnimationFrame(play.bind(null, canvas, context, video));
}


var liveConn = false;

var smoother = new Smoother([0.9999999, 0.9999999, 0.999, 0.999], [0, 0, 0, 0]),
	localVideo = document.getElementById("localVideo"),
	remoteVideo = document.getElementById("remoteVideo"),
	localCanvas = document.getElementById("localCanvas"),
	remoteCanvas = document.getElementById("remoteCanvas"),
	localCtx = localCanvas.getContext("2d"),
	remoteCtx = remoteCanvas.getContext("2d"),
	detector, localStream;

var peer, conn, myId;

function httpGet (url, cb) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function (res) {
		if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
			cb(JSON.parse(this.response));
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function peerVideoCommunication (call) {
	call.on("stream", function(remoteStream) {
		initiateEyeHole(remoteCanvas, remoteCtx, remoteVideo, remoteStream);
	});
}	

function peerDataCommunication (peerconn) {
	liveConn = true;
	conn = peerconn;
	peerconn.on("open", function() {
		// Receive messages
		peerconn.on('data', function(data) {
			if(typeof data.data === "string") {
				var remoteIData = remoteCtx.createImageData(data.width, data.height);
				var incomingData = new Uint8ClampedArray(atob(data.data).split('').map(function (e) {return e.charCodeAt(0); }));

				for(var i = 0; i < remoteIData.data.length; i++){
					remoteIData.data[i] = incomingData[i];
					// console.log(remoteIData.data[i], incomingData[i])
				}
				// console.log(remoteIData);
				remoteCtx.putImageData(remoteIData, 0, 0);
			}
		});
	});
}
 
function findFriend (env) {
	console.log("env", env);
	if (env === "production"){
		peer = new Peer({
			host: "/", 
			secure: true, 
			port: 443, 
			key: "peerjs", 
			path: "/api", 
			config: {
				"iceServers": [{ url: "stun:stun.l.google.com:19302" }]
			}
		});
	} else {
		peer = new Peer({host: "192.168.2.132", port: 3000, path: "/api", debug: 2});
	}

	function meetFriend (res){
		if(res.meet === "hold"){
			console.log("Waiting for a new friend");
		}else{
			console.log("Meet ", res.meet);
			// var call = peer.call(res.meet, localStream);
			peerDataCommunication(peer.connect(res.meet));
			// console.log(call);
			// peerVideoCommunication(call);
		}
	}

	peer.on("open", function (id) {
		console.log("my id: ", id)
		myId = id;
		httpGet("/" + id, meetFriend);
	});
	peer.on("connection", function (peerconn) {
		peerDataCommunication(peerconn);
	})

	peer.on("call", function(call) {
		call.answer(localStream);
		peerVideoCommunication(call);
	});
}
		



try {
	compatibility.getUserMedia({video: true}, function(stream) {
		localStream = stream;
		httpGet("/env", findFriend);
		initiateEyeHole(localCanvas, localCtx, localVideo, localStream);
	}, function (error) {
		console.log(error);
		alert("WebRTC not available");
	});
} catch (error) {
	alert(error);
}














