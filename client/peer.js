import Peer from 'peerjs';
import { attemptMeet } from './api';

export default function ClientPeer ({ onDial, onIncomingCall, onError }) {
  this.onDial = onDial;

  let config;
  if (process.env.NODE_ENV === 'production') {
    config = { host: 'eye-contact.herokuapp.com', port: '', wsport: '', path: '/api' };
  } else {
    config = { host: 'localhost', port: 3000, path: '/api', debug: 3 };
  }

  const peer = new Peer(config);
  peer.on('open', (id) => {
    this.id = id;
    this.askForConnection();
  });
  peer.on('connection', onIncomingCall);
  peer.on('error', onError);
  this.peer = peer;
}

ClientPeer.prototype.askForConnection = function () {
  attemptMeet({ id: this.id }).then(this.onDial);
}
