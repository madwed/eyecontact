import AdapterJS from 'adapterjs';
import ClientPeer from './peer';
import DataSource from './data-source';
import debounceVideo from './debounce';

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
  detector, middle;

function loadingOn() {
  waiting.style.display = "block";
  connected.style.display = "none";
}

function loadingOff() {
  waiting.style.display = "none";
  connected.style.display = "block";
}

function Eyecontact () {
  this.client = new ClientPeer({
    onDial: this.dial.bind(this),
    onIncomingCall: this.setupConnection.bind(this),
    onError: this.dropDataSource.bind(this),
  });

  this.sendData = debounceVideo(() => {
    requestAnimationFrame(this.sendData);
    // Prepare the detector once the localVideo dimensions are known:
    if (!detector) {
      var width = Math.floor(60 * localVideo.videoWidth / localVideo.videoHeight);
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
      if (this.dataSource && this.dataSource.connection.open) {
        this.dataSource.connection.send({
          data: localCtx.getImageData(middleoffset, 8, eyeWidth, eyeHeight + 8).data,
          height: eyeHeight,
          width: eyeWidth
        });
      }
    }
  }, localVideo);
}

Eyecontact.prototype.setupConnection = function (connection) {
  this.dataSource = new DataSource({
    connection,
    onOpen: loadingOff,
    onData: (data) => {
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
    },
    onClose: () => {
      loadingOn();
      this.client.askForConnection();
    },
    onError: this.dropDataSource.bind(this),
  });
}

Eyecontact.prototype.dial = function (res) {
  onlineUsers.innerHTML = res.users + " user(s) online";
  if (res.meet === "hold") {
    console.log("Waiting for a new friend");
  } else {
    console.log("Meet ", res.meet);
    this.setupConnection(this.client.peer.connect(res.meet));
  }
}

Eyecontact.prototype.dropDataSource = function (error) {
  console.warn(error);
  if (this.dataSource) {
    this.dataSource.connection.close();
    this.dataSource = undefined;
  }
  loadingOn();
  this.client.askForConnection();
}

let eyecontact;

try {
  AdapterJS.webRTCReady(() => {
    const constraints = {
      video: { mandatory: { maxFrameRate: 30, maxWidth: 640 } },
    };

    getUserMedia(constraints, (stream) => {
      eyecontact = new Eyecontact();

      try {
        localVideo.src = URL.createObjectURL(stream);
      } catch (error) {
        localVideo.src = stream;
      }
      requestAnimationFrame(eyecontact.sendData);
    }, (error) => {
      console.warn(error);
      alert('WebRTC is unavailable');
    });
  });
} catch (error) {
  console.warn(error);
  alert('There was a problem setting up the WebRTC connection');
}

nextButton.onclick = () => {
  if (eyecontact) { eyecontact.dropDataSource; }
};
