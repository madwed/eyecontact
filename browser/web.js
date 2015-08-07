// window.onload = function() {
    
//         var isInitiator;


//         var socket = io.connect();

//         var room = "irrelevant";
//         socket.emit("feel", room);

//         socket.on("full", function (room){
//           console.log("Room " + room + " is full");
//         });

//         socket.on("empty", function (room){
//           isInitiator = true;
//           console.log("Room " + room + " is empty");
//         });

//         socket.on("join", function (room){
//           console.log("Making request to join room " + room);
//           console.log("You are the initiator!");
//         });

//         socket.on("log", function (array){
//           console.log.apply(console, array);
//         });

//         var iceServers = {
//             "iceServers": [{"url": "stun:stun.l.google.com:19302"}]}
//         }

//         var DtlsSrtpKeyAgreement = {
//            DtlsSrtpKeyAgreement: true
//         };

//         var optional = {
//            optional: [DtlsSrtpKeyAgreement]
//         };

//         var peer = new RTCPeerConnection(iceServers, optional);    
//         peer.createOffer(function(offerSDP) {
//             peer.setLocalDescription(offerSDP);
//             socket.send({
//                 targetUser: 'target-user-id',
//                 offerSDP: offerSDP
//             });
//         }, onfailure, sdpConstraints);


//         peer.onaddstream = function(event) {
//             video.src = webkitURL.createObjectURL(event.stream);
//         };

//         peer.onicecandidate = function(event) {
//             var candidate = event.candidate;
//             if(candidate) {
//                 socket.send({
//                     targetUser: 'target-user-id',
//                     candidate: candidate
//                 });
//             }
//         };




//         // var smoother = new Smoother([0.9999999, 0.9999999, 0.999, 0.999], [0, 0, 0, 0]),
//         //     video = document.getElementById("video"),
//         //     canvas = document.getElementById("canvas"),
//         //     context = canvas.getContext("2d"),
//         //     detector;
                
//         // try {
//         //     compatibility.getUserMedia({video: true}, function(stream) {
//         //         try {
//         //             video.src = compatibility.URL.createObjectURL(stream);
//         //         } catch (error) {
//         //             video.src = stream;
//         //         }
//         //         compatibility.requestAnimationFrame(play);
//         //     }, function (error) {
//         //         console.log(error);
//         //         alert("WebRTC not available");
//         //     });
//         // } catch (error) {
//         //     alert(error);
//         // }
        
//         // function play() {
//         //     compatibility.requestAnimationFrame(play);
//         //     if (video.paused) video.play();
            
//         //     if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
                
//         //         // Prepare the detector once the video dimensions are known:
//         //         if (!detector) {
//         //             var width = ~~(60 * video.videoWidth / video.videoHeight);
//         //             var height = 60;
//         //             detector = new objectdetect.detector(width, height, 1.1, objectdetect.frontalface);
//         //             canvas.width = video.videoWidth;
//         //             canvas.style.width = video.videoWidth;
//         //             canvas.height = video.videoHeight;
//         //             canvas.style.height = video.videoHeight;
//         //         }
                
//         //         // Perform the actual detection:
//         //         var coords = detector.detect(video, 1);
//         //         if (coords[0]) {
//         //             context.clearRect(0, 0, canvas.width, canvas.height);
//         //             var coord = coords[0];
//         //             coord = smoother.smooth(coord);
                    
//         //             // Rescale coordinates from detector to video coordinate space:
//         //             coord[0] *= video.videoWidth / detector.canvas.width;
//         //             coord[1] *= video.videoHeight / detector.canvas.height;
//         //             coord[2] *= video.videoWidth / detector.canvas.width;
//         //             coord[3] *= video.videoHeight / detector.canvas.height;
                    
//         //             // context.fillRect(coord[0], coord[1], coord[2], ~~(coord[3] * 6/8));
//         //             var eyePosX = coord[0] + coord[2] / 8;
//         //             var eyePosY = coord[1] + coord[3] / 4;
//         //             var eyeWidth = coord[2] * 3 / 4;
//         //             var eyeHeight = coord[3] / 5; 
//         //             var middle = canvas.width / 2 - eyeWidth / 2;

//         //             context.drawImage(video, eyePosX, eyePosY, eyeWidth, eyeHeight, middle, 0, eyeWidth, eyeHeight);
                       
//         //         }
//         //     }
//         // }
        
//     };


(function() {






    window.PeerConnection = function(socketURL, socketEvent, userid) {
        this.userid = userid || getToken();
        this.peers = { };

        if (!socketURL) throw 'Socket-URL is mandatory.';
        if (!socketEvent) socketEvent = 'message';
        new Signaler(this, socketURL, socketEvent);
        
        this.addStream = function(stream) { 
            this.MediaStream = stream;
        };
    };

    function Signaler(root, socketURL, socketEvent) {
        var self = this;

        root.startBroadcasting = function() {
            if(!root.MediaStream) throw 'Offerer must have media stream.';
            
            (function transmit() {
                socket.send({
                    userid: root.userid,
                    broadcasting: true
                });
                !self.participantFound &&
                    !self.stopBroadcasting &&
                        setTimeout(transmit, 3000);
            })();
        };

        root.sendParticipationRequest = function(userid) {
            socket.send({
                participationRequest: true,
                userid: root.userid,
                to: userid
            });
        };

        // if someone shared SDP
        this.onsdp = function(message) {
            var sdp = message.sdp;

            if (sdp.type === 'offer') {
                root.peers[message.userid] = Answer.createAnswer(merge(options, {
                    MediaStream: root.MediaStream,
                    sdp: sdp
                }));
            }

            if (sdp.type === 'answer') {
                root.peers[message.userid].setRemoteDescription(sdp);
            }
        };

        root.acceptRequest = function(userid) {
            root.peers[userid] = Offer.createOffer(merge(options, {
                MediaStream: root.MediaStream
            }));
        };

        var candidates = [];
        // if someone shared ICE
        this.onice = function(message) {
            var peer = root.peers[message.userid];
            if (peer) {
                peer.addIceCandidate(message.candidate);
                for (var i = 0; i < candidates.length; i++) {
                    peer.addIceCandidate(candidates[i]);
                }
                candidates = [];
            } else candidates.push(candidates);
        };

        // it is passed over Offer/Answer objects for reusability
        var options = {
            onsdp: function(sdp) {
                socket.send({
                    userid: root.userid,
                    sdp: sdp,
                    to: root.participant
                });
            },
            onicecandidate: function(candidate) {
                socket.send({
                    userid: root.userid,
                    candidate: candidate,
                    to: root.participant
                });
            },
            onStreamAdded: function(stream) {
                console.debug('onStreamAdded', '>>>>>>', stream);

                stream.onended = function() {
                    if (root.onStreamEnded) root.onStreamEnded(streamObject);
                };

                var mediaElement = document.createElement('video');
                mediaElement.id = root.participant;
                mediaElement[isFirefox ? 'mozSrcObject' : 'src'] = isFirefox ? stream : window.webkitURL.createObjectURL(stream);
                mediaElement.autoplay = true;
                mediaElement.controls = true;
                mediaElement.play();

                var streamObject = {
                    mediaElement: mediaElement,
                    stream: stream,
                    participantid: root.participant
                };

                function afterRemoteStreamStartedFlowing() {
                    if (!root.onStreamAdded) return;
                    root.onStreamAdded(streamObject);
                }

                afterRemoteStreamStartedFlowing();
            }
        };

        function closePeerConnections() {
            self.stopBroadcasting = true;
            if (root.MediaStream) root.MediaStream.stop();

            for (var userid in root.peers) {
                root.peers[userid].peer.close();
            }
            root.peers = { };
        }

        root.close = function() {
            socket.send({
                userLeft: true,
                userid: root.userid,
                to: root.participant
            });
            closePeerConnections();
        };

        window.onbeforeunload = function() {
            root.close();
        };

        window.onkeyup = function(e) {
            if (e.keyCode === 116)
                root.close();
        };

        function onmessage(message) {
            if (message.userid === root.userid) return;
            root.participant = message.userid;

            // for pretty logging
            console.debug(JSON.stringify(message, function(key, value) {
                if (value && value.sdp) {
                    console.log(value.sdp.type, '---', value.sdp.sdp);
                    return '';
                } else return value;
            }, '---'));

            // if someone shared SDP
            if (message.sdp && message.to === root.userid) {
                self.onsdp(message);
            }

            // if someone shared ICE
            if (message.candidate && message.to === root.userid) {
                self.onice(message);
            }

            // if someone sent participation request
            if (message.participationRequest && message.to === root.userid) {
                self.participantFound = true;

                if (root.onParticipationRequest) {
                    root.onParticipationRequest(message.userid);
                } else root.acceptRequest(message.userid);
            }

            // if someone is broadcasting himself!
            if (message.broadcasting && root.onUserFound) {
                root.onUserFound(message.userid);
            }

            if (message.userLeft && message.to === root.userid) {
                closePeerConnections();
            }
        }
        
        var socket = socketURL;
        if(typeof socketURL === 'string') {
            var socket = io.connect(socketURL);
            socket.send = function(data) {
                socket.emit(socketEvent, data);
            };
        }
        
        socket.on(socketEvent, onmessage);
    }

    var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
    var RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

    navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
    window.URL = window.webkitURL || window.URL;

    var isFirefox = !!navigator.mozGetUserMedia;
    var isChrome = !!navigator.webkitGetUserMedia;

    var STUN = {
        url: isChrome ? 'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
    };

    var TURN = {
        url: 'turn:homeo@turn.bistri.com:80',
        credential: 'homeo'
    };

    var iceServers = {
        iceServers: [STUN]
    };

    if (isChrome) {
        if (parseInt(navigator.userAgent.match( /Chrom(e|ium)\/([0-9]+)\./ )[2]) >= 28)
            TURN = {
                url: 'turn:turn.bistri.com:80',
                credential: 'homeo',
                username: 'homeo'
            };

        iceServers.iceServers = [STUN, TURN];
    }

    var optionalArgument = {
        optional: [{
            DtlsSrtpKeyAgreement: true
        }]
    };

    var offerAnswerConstraints = {
        optional: [],
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    };

    function getToken() {
        return Math.round(Math.random() * 9999999999) + 9999999999;
    }
    
    function onSdpError() {}

    // var offer = Offer.createOffer(config);
    // offer.setRemoteDescription(sdp);
    // offer.addIceCandidate(candidate);
    var Offer = {
        createOffer: function(config) {
            var peer = new RTCPeerConnection(iceServers, optionalArgument);

            if (config.MediaStream) peer.addStream(config.MediaStream);
            peer.onaddstream = function(event) {
                config.onStreamAdded(event.stream);
            };

            peer.onicecandidate = function(event) {
                if (event.candidate)
                    config.onicecandidate(event.candidate);
            };

            peer.createOffer(function(sdp) {
                peer.setLocalDescription(sdp);
                config.onsdp(sdp);
            }, onSdpError, offerAnswerConstraints);

            this.peer = peer;

            return this;
        },
        setRemoteDescription: function(sdp) {
            this.peer.setRemoteDescription(new RTCSessionDescription(sdp));
        },
        addIceCandidate: function(candidate) {
            this.peer.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            }));
        }
    };

    // var answer = Answer.createAnswer(config);
    // answer.setRemoteDescription(sdp);
    // answer.addIceCandidate(candidate);
    var Answer = {
        createAnswer: function(config) {
            var peer = new RTCPeerConnection(iceServers, optionalArgument);

            if (config.MediaStream) peer.addStream(config.MediaStream);
            peer.onaddstream = function(event) {
                config.onStreamAdded(event.stream);
            };

            peer.onicecandidate = function(event) {
                if (event.candidate)
                    config.onicecandidate(event.candidate);
            };

            peer.setRemoteDescription(new RTCSessionDescription(config.sdp));
            peer.createAnswer(function(sdp) {
                peer.setLocalDescription(sdp);
                config.onsdp(sdp);
            }, onSdpError, offerAnswerConstraints);

            this.peer = peer;

            return this;
        },
        addIceCandidate: function(candidate) {
            this.peer.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            }));
        }
    };

    function merge(mergein, mergeto) {
        for (var t in mergeto) {
            mergein[t] = mergeto[t];
        }
        return mergein;
    }

    window.URL = window.webkitURL || window.URL;
    navigator.getMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    navigator.getUserMedia = function(hints, onsuccess, onfailure) {
        if(!hints) hints = {audio:true,video:true};
        if(!onsuccess) throw 'Second argument is mandatory. navigator.getUserMedia(hints,onsuccess,onfailure)';
        
        navigator.getMedia(hints, _onsuccess, _onfailure);
        
        function _onsuccess(stream) {
            onsuccess(stream);
        }
        
        function _onfailure(e) {
            if(onfailure) onfailure(e);
            else throw Error('getUserMedia failed: ' + JSON.stringify(e, null, '\t'));
        }
    };


    var offerer = new PeerConnection('http://localhost:3000', 'message', 'offerer');
    offerer.onStreamAdded = function(e) {
        console.log(e, "offerer");
        document.body.appendChild(e.mediaElement);
    };
    var answerer = new PeerConnection('http://localhost:3000', 'message', 'answerer');
    answerer.onStreamAdded = function(e) {
        console.log(e, "answerer");
        document.body.appendChild(e.mediaElement);
    };
    answerer.sendParticipationRequest('offerer');

})();



