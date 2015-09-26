var fps, fpsInterval, now, then, elapsed;
fps = 30;

var smoother = new Smoother([0.9999999, 0.9999999, 0.999, 0.999], [0, 0, 0, 0]),
    lover = document.getElementById("lover"),
    onlineUsers = document.getElementById("onlineUsers"),
    waiting = document.getElementById("waiting"),
    connected = document.getElementById("connected"),
    localVideo = document.getElementById("localVideo"),
    localCanvas = document.getElementById("localCanvas"),
    remoteCanvas = document.getElementById("remoteCanvas"),
    nextButton = document.getElementById("next"),
    localCtx = localCanvas.getContext("2d"),
    remoteCtx = remoteCanvas.getContext("2d"),
    detector, localStream, middle;

function loadingOn() {
    waiting.style.display = "block";
    connected.style.display = "none";
}

function loadingOff() {
    waiting.style.display = "none";
    connected.style.display = "block";
}

function play() {
    requestAnimationFrame(play);
    //Keep on throttling
    now = Date.now();
    elapsed = now - then;
    //Check if the throttle is ready and if the local video element is ready
    if (elapsed > fpsInterval && localVideo.readyState === localVideo.HAVE_ENOUGH_DATA && localVideo.videoWidth > 0) {
        then = now - (elapsed % fpsInterval);
        // Prepare the detector once the localVideo dimensions are known:
        if (!detector) {
            var width = ~~(60 * localVideo.videoWidth / localVideo.videoHeight);
            var height = 60;
            detector = new objectdetect.detector(width, height, 1.1, objectdetect.frontalface);
            // Manually set the size of the local and remote canvases
            localCanvas.width = remoteCanvas.width = localVideo.videoWidth;
            localCanvas.style.width = remoteCanvas.style.width = localVideo.videoWidth;
            localCanvas.height = remoteCanvas.height = localVideo.videoHeight / 2;
            localCanvas.style.height = remoteCanvas.style.height = localVideo.videoHeight / 2;
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

            // Calculate eye positions from frontal face rectangle
            var eyePosX = Math.floor(coord[0] + coord[2] / 8);
            var eyePosY = Math.floor(coord[1] + coord[3] / 4);
            var eyeWidth = Math.floor(coord[2] * 3 / 4);
            var eyeHeight = Math.floor(coord[3] / 4);
            var middleoffset = Math.floor(middle - eyeWidth / 2);
            //Draw the your eyes

            localCtx.lineWidth = 3;
            localCtx.beginPath();
            localCtx.rect(middleoffset - 5, 3, eyeWidth + 10, eyeHeight + 10);
            localCtx.stroke();
            localCtx.closePath();
            localCtx.drawImage(localVideo, eyePosX, eyePosY, eyeWidth, eyeHeight, middleoffset, 8, eyeWidth, eyeHeight);
            //If there's a connection
            if (liveConn) {
                //Send them your eyes
                identity.conn.send({
                    data: localCtx.getImageData(middleoffset, 8, eyeWidth, eyeHeight + 8).data,
                    height: eyeHeight,
                    width: eyeWidth
                });
            }
        }
    }
}

function initiateEyeHole(stream) {
    //Stream the localStream through a video element
    //We will be applying it to the canvas later on
    try {
        localVideo.src = URL.createObjectURL(stream);
    } catch (error) {
        localVideo.src = stream;
    }
    //Set up the throttle on requestAnimationFrame
    fpsInterval = 1000 / fps;
    then = Date.now();
    requestAnimationFrame(play);
}

//Is there a connection?
var liveConn = false;
//Utility object to hold the client's Id, peer reference, and current connection reference
var identity = {myId: undefined, peer: undefined, conn: undefined};

//Utility method for sending http Ajax get requests
function httpGet(url, cb) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            cb(JSON.parse(this.response));
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

//When a peer DataConnection is established
function peerDataCommunication(peerconn) {
    identity.conn = peerconn;

    //When the connection opens...
    peerconn.on("open", function () {
        liveConn = true;
        loadingOff();
        //Listen for data
        peerconn.on('data', function (data) {
            if (data.height > 0 && data.width > 0 && isFinite(data.height) && isFinite(data.width)) {
                //Clear the canvas
                try {
                    remoteCtx.clearRect(0, 0, remoteCanvas.width, remoteCanvas.height);
                    //Apply incoming ArrayBuffer to ImageData.data using a Uint8Array as the view
                    var remoteIData = remoteCtx.createImageData(data.width, data.height),
                        incomingData = new Uint8Array(data.data);
                    for (var i = 0; i < remoteIData.data.length; i++) {
                        remoteIData.data[i] = incomingData[i];
                    }
                    //Figure out where to put the incoming ImageData (centered)
                    var halfImage = data.width / 2;
                    var middleoffset = Math.floor(middle - halfImage);
                    //Draw their eyes
                    lover.style.top = 16 + data.height - remoteCanvas.height + "px";
                    remoteCtx.lineWidth = 3;
                    remoteCtx.beginPath();
                    remoteCtx.rect(middleoffset - 5, 3, data.width + 10, data.height + 10);
                    remoteCtx.stroke();
                    remoteCtx.closePath();
                    remoteCtx.putImageData(remoteIData, middleoffset, 8);
                    remoteIData = null;
                    incomingData = null;
                } catch (e) {
                    console.log(e);
                }
            }
        });
    });

    //If the other user closes the connection, search for another user
    peerconn.on("close", function () {
        console.log("closing connection");
        peerconn.close();
        loadingOn();
        identity.conn = undefined;
        liveConn = false;
        httpGet("/meet/" + identity.myId, meetSomeone);
    });

    peerconn.on("error", function () {
        peerconn.close();
        loadingOn();
        identity.conn = undefined;
        liveConn = false;
        httpGet("/meet/" + identity.myId, meetSomeone);
    });

    //If the user closes the tab, tell the other user
    window.onbeforeunload = function () {
        peerconn.close();
    };
}

//Receive the response from the server, potentially with another user's peer id
function meetSomeone(res) {
    onlineUsers.innerHTML = res.users + " user(s) online";
    if (res.meet === "hold") {
        console.log("Waiting for a new friend");
    } else {
        console.log("Meet ", res.meet);
        peerDataCommunication(identity.peer.connect(res.meet));
    }
}

//Establish peer connection with server
function enterTheEye(res) {
    if (res.env === "production") {
        identity.peer = new Peer({
            host: "eyecontact-friendsforever.rhcloud.com",
            port: 80,
            wsport: 8000,
            path: "/api",
            config: {
                "iceServers": [{url: "stun:stun.l.google.com:19302"}]
            }
        });
    } else {
        identity.peer = new Peer({host: "localhost", port: 3000, path: "/api", debug: 2});
    }
    //When the peer connection is established
    identity.peer.on("open", function (id) {
        console.log("my id: ", id);
        identity.myId = id;
        //Try to meet someone
        httpGet("/meet/" + id, meetSomeone);
    });
    //If someone calls, you answer
    identity.peer.on("connection", function (peerconn) {
        peerDataCommunication(peerconn);
    })

}

nextButton.onclick = function () {
    if (identity.myId) {
        if (liveConn) {
            liveConn = false;
            loadingOn();
            identity.conn.close();
            identity.conn = undefined;
            httpGet("/meet/" + identity.myId, meetSomeone);
        } else {
            httpGet("/meet/" + identity.myId, meetSomeone);
        }
    }
};

try {
    //Set up the web cam
    compatibility.getUserMedia({
        video: {
            mandatory: {
                maxFrameRate: 20,
                maxWidth: 640
            }
        }
    }, function (stream) {
        localStream = stream;
        //When that's ready, enterTheEye and initiateEyeHole
        httpGet("/env", enterTheEye);
        initiateEyeHole(localStream);
    }, function (error) {
        console.log(error);
        alert("WebRTC not available");
    });
} catch (error) {
    alert(error);
}


