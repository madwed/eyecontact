window.onload = function() {
    
        var isInitiator;

        room = prompt('Enter room name:');

        var socket = io.connect();

        if (room !== '') {
          console.log('Joining room ' + room);
          socket.emit('create or join', room);
        }

        socket.on('full', function (room){
          console.log('Room ' + room + ' is full');
        });

        socket.on('empty', function (room){
          isInitiator = true;
          console.log('Room ' + room + ' is empty');
        });

        socket.on('join', function (room){
          console.log('Making request to join room ' + room);
          console.log('You are the initiator!');
        });

        socket.on('log', function (array){
          console.log.apply(console, array);
        });







        // var smoother = new Smoother([0.9999999, 0.9999999, 0.999, 0.999], [0, 0, 0, 0]),
        //     video = document.getElementById("video"),
        //     canvas = document.getElementById("canvas"),
        //     context = canvas.getContext("2d"),
        //     detector;
                
        // try {
        //     compatibility.getUserMedia({video: true}, function(stream) {
        //         try {
        //             video.src = compatibility.URL.createObjectURL(stream);
        //         } catch (error) {
        //             video.src = stream;
        //         }
        //         compatibility.requestAnimationFrame(play);
        //     }, function (error) {
        //         console.log(error);
        //         alert('WebRTC not available');
        //     });
        // } catch (error) {
        //     alert(error);
        // }
        
        // function play() {
        //     compatibility.requestAnimationFrame(play);
        //     if (video.paused) video.play();
            
        //     if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
                
        //         // Prepare the detector once the video dimensions are known:
        //         if (!detector) {
        //             var width = ~~(60 * video.videoWidth / video.videoHeight);
        //             var height = 60;
        //             detector = new objectdetect.detector(width, height, 1.1, objectdetect.frontalface);
        //             canvas.width = video.videoWidth;
        //             canvas.style.width = video.videoWidth;
        //             canvas.height = video.videoHeight;
        //             canvas.style.height = video.videoHeight;
        //         }
                
        //         // Perform the actual detection:
        //         var coords = detector.detect(video, 1);
        //         if (coords[0]) {
        //             context.clearRect(0, 0, canvas.width, canvas.height);
        //             var coord = coords[0];
        //             coord = smoother.smooth(coord);
                    
        //             // Rescale coordinates from detector to video coordinate space:
        //             coord[0] *= video.videoWidth / detector.canvas.width;
        //             coord[1] *= video.videoHeight / detector.canvas.height;
        //             coord[2] *= video.videoWidth / detector.canvas.width;
        //             coord[3] *= video.videoHeight / detector.canvas.height;
                    
        //             // context.fillRect(coord[0], coord[1], coord[2], ~~(coord[3] * 6/8));
        //             var eyePosX = coord[0] + coord[2] / 8;
        //             var eyePosY = coord[1] + coord[3] / 4;
        //             var eyeWidth = coord[2] * 3 / 4;
        //             var eyeHeight = coord[3] / 5; 
        //             var middle = canvas.width / 2 - eyeWidth / 2;

        //             context.drawImage(video, eyePosX, eyePosY, eyeWidth, eyeHeight, middle, 0, eyeWidth, eyeHeight);
                       
        //         }
        //     }
        // }
        
    };