var fps, fpsInterval, startTime, now, then, elapsed;
fps = 30;

var smoother = new Smoother([0.9999999, 0.9999999, 0.999, 0.999], [0, 0, 0, 0]),
	localVideo = document.getElementById("localVideo"),
	localCanvas = document.getElementById("localCanvas"),
	remoteCanvas = document.getElementById("remoteCanvas"),
	localCtx = localCanvas.getContext("2d"),
	remoteCtx = remoteCanvas.getContext("2d"),
	detector, localStream, middle;

function play () {
	compatibility.requestAnimationFrame(play);

	now = Date.now();
    elapsed = now - then;
	if (elapsed > fpsInterval && localVideo.readyState === localVideo.HAVE_ENOUGH_DATA && localVideo.videoWidth > 0) {
		then = now - (elapsed % fpsInterval);
		// Prepare the detector once the localVideo dimensions are known:
		if (!detector) {
			var width = ~~(60 * localVideo.videoWidth / localVideo.videoHeight);
			var height = 60;
			detector = new objectdetect.detector(width, height, 1.1, objectdetect.frontalface);
			localCanvas.width = remoteCanvas.width = localVideo.videoWidth;
			localCanvas.style.width = remoteCanvas.style.width = localVideo.videoWidth;
			localCanvas.height = remoteCanvas.height = localVideo.videoHeight / 2;
			localCanvas.style.height = remoteCanvas.style.height = localVideo.videoHeight / 2,
			middle = localCanvas.width / 2;
		}

		// Perform the actual detection:
		var coords = detector.detect(localVideo, 1);
		if (coords[0]) {
			localCtx.clearRect(0, 0, localCanvas.width, localCanvas.height);
			var coord = coords[0];
			coord = smoother.smooth(coord);

			// Rescale coordinates from detector to localVideo coordinate space:
			coord[0] *= localVideo.videoWidth / detector.canvas.width;
			coord[1] *= localVideo.videoHeight / detector.canvas.height;
			coord[2] *= localVideo.videoWidth / detector.canvas.width;
			coord[3] *= localVideo.videoHeight / detector.canvas.height;

			var eyePosX = Math.floor(coord[0] + coord[2] / 8);
			var eyePosY = Math.floor(coord[1] + coord[3] / 4);
			var eyeWidth = Math.floor(coord[2] * 3 / 4);
			var eyeHeight = Math.floor(coord[3] / 4); 
			var middleoffset = Math.floor(middle - eyeWidth / 2);
			localCtx.drawImage(localVideo, eyePosX, eyePosY, eyeWidth, eyeHeight, middleoffset, 0, eyeWidth, eyeHeight);
			
			if(liveConn){
				identity.conn.send({data: localCtx.getImageData(middleoffset, 0, eyeWidth, eyeHeight).data, height: eyeHeight, width: eyeWidth});
			}
		}
	}
}

function initiateEyeHole (stream) {
	try {
		localVideo.src = compatibility.URL.createObjectURL(stream);
	} catch (error) {
		localVideo.src = stream;
	}
	fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
	compatibility.requestAnimationFrame(play);
}

var liveConn = false;

var identity = {myId: undefined, peer: undefined, conn: undefined}

function httpGet (url, cb) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
			cb(JSON.parse(this.response));
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function peerDataCommunication (peerconn) {
	liveConn = true;
	identity.conn = peerconn;
	peerconn.on("open", function() {
		// Receive messages
		peerconn.on('data', function(data) {
			if(data.height > 0){
				remoteCtx.clearRect(0, 0, remoteCanvas.width, remoteCanvas.height);
				var remoteIData = remoteCtx.createImageData(data.width, data.height),
					incomingData = new Uint8Array(data.data);
				for(var i = 0; i < remoteIData.data.length; i++){
					remoteIData.data[i] = incomingData[i];
				}
				var middleoffset = Math.floor(middle - data.width / 2);
				remoteCtx.putImageData(remoteIData, middleoffset, 0);
				remoteIData = null;
				incomingData = null;
			}
		});
	});

	peerconn.on("close", function(){
		console.log("closing connection");
		peerconn.close();
		liveConn = false;
		httpGet("/" + identity.myId, meetFriend);
	});

}

function meetFriend (res){
		if(res.meet === "hold"){
			console.log("Waiting for a new friend");
		}else{
			console.log("Meet ", res.meet);
			peerDataCommunication(identity.peer.connect(res.meet));
		}
	}
 
function enterTheEye (env) {
	console.log("env", env);
	if (env === "production"){
		identity.peer = new Peer({
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
		identity.peer = new Peer({host: "192.168.2.132", port: 3000, path: "/api", debug: 2});
	}

	identity.peer.on("open", function (id) {
		console.log("my id: ", id);
		identity.myId = id;
		httpGet("/" + id, meetFriend);
	});
	identity.peer.on("connection", function (peerconn) {
		peerDataCommunication(peerconn);
	})

}
		
try {
	compatibility.getUserMedia({
		video: {
			mandatory: {
				maxFrameRate: 20,
				maxWidth: 640
			}
		}
	}, function(stream) {
		localStream = stream;
		httpGet("/env", enterTheEye);
		initiateEyeHole(localStream);
	}, function (error) {
		console.log(error);
		alert("WebRTC not available");
	});
} catch (error) {
	alert(error);
}














