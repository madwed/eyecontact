/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var defaultConfig = {'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]};
var dataCount = 1;

var BinaryPack = __webpack_require__(3);
var RTCPeerConnection = __webpack_require__(2).RTCPeerConnection;

var util = {
  noop: function() {},

  CLOUD_HOST: '0.peerjs.com',
  CLOUD_PORT: 9000,

  // Browsers that need chunking:
  chunkedBrowsers: {'Chrome': 1},
  chunkedMTU: 16300, // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.

  // Logging logic
  logLevel: 0,
  setLogLevel: function(level) {
    var debugLevel = parseInt(level, 10);
    if (!isNaN(parseInt(level, 10))) {
      util.logLevel = debugLevel;
    } else {
      // If they are using truthy/falsy values for debug
      util.logLevel = level ? 3 : 0;
    }
    util.log = util.warn = util.error = util.noop;
    if (util.logLevel > 0) {
      util.error = util._printWith('ERROR');
    }
    if (util.logLevel > 1) {
      util.warn = util._printWith('WARNING');
    }
    if (util.logLevel > 2) {
      util.log = util._print;
    }
  },
  setLogFunction: function(fn) {
    if (fn.constructor !== Function) {
      util.warn('The log function you passed in is not a function. Defaulting to regular logs.');
    } else {
      util._print = fn;
    }
  },

  _printWith: function(prefix) {
    return function() {
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift(prefix);
      util._print.apply(util, copy);
    };
  },
  _print: function () {
    var err = false;
    var copy = Array.prototype.slice.call(arguments);
    copy.unshift('PeerJS: ');
    for (var i = 0, l = copy.length; i < l; i++){
      if (copy[i] instanceof Error) {
        copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
        err = true;
      }
    }
    err ? console.error.apply(console, copy) : console.log.apply(console, copy);
  },
  //

  // Returns browser-agnostic default config
  defaultConfig: defaultConfig,
  //

  // Returns the current browser.
  browser: (function() {
    if (window.mozRTCPeerConnection) {
      return 'Firefox';
    } else if (window.webkitRTCPeerConnection) {
      return 'Chrome';
    } else if (window.RTCPeerConnection) {
      return 'Supported';
    } else {
      return 'Unsupported';
    }
  })(),
  //

  // Lists which features are supported
  supports: (function() {
    if (typeof RTCPeerConnection === 'undefined') {
      return {};
    }

    var data = true;
    var audioVideo = true;

    var binaryBlob = false;
    var sctp = false;
    var onnegotiationneeded = !!window.webkitRTCPeerConnection;

    var pc, dc;
    try {
      pc = new RTCPeerConnection(defaultConfig, {optional: [{RtpDataChannels: true}]});
    } catch (e) {
      data = false;
      audioVideo = false;
    }

    if (data) {
      try {
        dc = pc.createDataChannel('_PEERJSTEST');
      } catch (e) {
        data = false;
      }
    }

    if (data) {
      // Binary test
      try {
        dc.binaryType = 'blob';
        binaryBlob = true;
      } catch (e) {
      }

      // Reliable test.
      // Unfortunately Chrome is a bit unreliable about whether or not they
      // support reliable.
      var reliablePC = new RTCPeerConnection(defaultConfig, {});
      try {
        var reliableDC = reliablePC.createDataChannel('_PEERJSRELIABLETEST', {});
        sctp = reliableDC.reliable;
      } catch (e) {
      }
      reliablePC.close();
    }

    // FIXME: not really the best check...
    if (audioVideo) {
      audioVideo = !!pc.addStream;
    }

    // FIXME: this is not great because in theory it doesn't work for
    // av-only browsers (?).
    if (!onnegotiationneeded && data) {
      // sync default check.
      var negotiationPC = new RTCPeerConnection(defaultConfig, {optional: [{RtpDataChannels: true}]});
      negotiationPC.onnegotiationneeded = function() {
        onnegotiationneeded = true;
        // async check.
        if (util && util.supports) {
          util.supports.onnegotiationneeded = true;
        }
      };
      negotiationPC.createDataChannel('_PEERJSNEGOTIATIONTEST');

      setTimeout(function() {
        negotiationPC.close();
      }, 1000);
    }

    if (pc) {
      pc.close();
    }

    return {
      audioVideo: audioVideo,
      data: data,
      binaryBlob: binaryBlob,
      binary: sctp, // deprecated; sctp implies binary support.
      reliable: sctp, // deprecated; sctp implies reliable data.
      sctp: sctp,
      onnegotiationneeded: onnegotiationneeded
    };
  }()),
  //

  // Ensure alphanumeric ids
  validateId: function(id) {
    // Allow empty ids
    return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(id);
  },

  validateKey: function(key) {
    // Allow empty keys
    return !key || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(key);
  },


  debug: false,

  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  pack: BinaryPack.pack,
  unpack: BinaryPack.unpack,

  log: function () {
    if (util.debug) {
      var err = false;
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift('PeerJS: ');
      for (var i = 0, l = copy.length; i < l; i++){
        if (copy[i] instanceof Error) {
          copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
          err = true;
        }
      }
      err ? console.error.apply(console, copy) : console.log.apply(console, copy);
    }
  },

  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    // Like setTimeout, but only takes a function argument.	 There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(window)),

  // Binary stuff

  // chunks a blob.
  chunk: function(bl) {
    var chunks = [];
    var size = bl.size;
    var start = index = 0;
    var total = Math.ceil(size / util.chunkedMTU);
    while (start < size) {
      var end = Math.min(size, start + util.chunkedMTU);
      var b = bl.slice(start, end);

      var chunk = {
        __peerData: dataCount,
        n: index,
        data: b,
        total: total
      };

      chunks.push(chunk);

      start = end;
      index += 1;
    }
    dataCount += 1;
    return chunks;
  },

  blobToArrayBuffer: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
  },
  blobToBinaryString: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsBinaryString(blob);
  },
  binaryStringToArrayBuffer: function(binary) {
    var byteArray = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  },
  randomToken: function () {
    return Math.random().toString(36).substr(2);
  },
  //

  isSecure: function() {
    return location.protocol === 'https:';
  }
};

module.exports = util;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  if (!this._events || !this._events[event]) return [];
  if (this._events[event].fn) return [this._events[event].fn];

  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
    ee[i] = this._events[event][i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  if (fn) {
    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
      events.push(listeners);
    }
    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
        events.push(listeners[i]);
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[event] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[event];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[event];
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the module.
//
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.EventEmitter2 = EventEmitter;
EventEmitter.EventEmitter3 = EventEmitter;

//
// Expose the module.
//
module.exports = EventEmitter;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports.RTCSessionDescription = window.RTCSessionDescription ||
	window.mozRTCSessionDescription;
module.exports.RTCPeerConnection = window.RTCPeerConnection ||
	window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
module.exports.RTCIceCandidate = window.RTCIceCandidate ||
	window.mozRTCIceCandidate;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var BufferBuilder = __webpack_require__(4).BufferBuilder;
var binaryFeatures = __webpack_require__(4).binaryFeatures;

var BinaryPack = {
  unpack: function(data){
    var unpacker = new Unpacker(data);
    return unpacker.unpack();
  },
  pack: function(data){
    var packer = new Packer();
    packer.pack(data);
    var buffer = packer.getBuffer();
    return buffer;
  }
};

module.exports = BinaryPack;

function Unpacker (data){
  // Data is ArrayBuffer
  this.index = 0;
  this.dataBuffer = data;
  this.dataView = new Uint8Array(this.dataBuffer);
  this.length = this.dataBuffer.byteLength;
}

Unpacker.prototype.unpack = function(){
  var type = this.unpack_uint8();
  if (type < 0x80){
    var positive_fixnum = type;
    return positive_fixnum;
  } else if ((type ^ 0xe0) < 0x20){
    var negative_fixnum = (type ^ 0xe0) - 0x20;
    return negative_fixnum;
  }
  var size;
  if ((size = type ^ 0xa0) <= 0x0f){
    return this.unpack_raw(size);
  } else if ((size = type ^ 0xb0) <= 0x0f){
    return this.unpack_string(size);
  } else if ((size = type ^ 0x90) <= 0x0f){
    return this.unpack_array(size);
  } else if ((size = type ^ 0x80) <= 0x0f){
    return this.unpack_map(size);
  }
  switch(type){
    case 0xc0:
      return null;
    case 0xc1:
      return undefined;
    case 0xc2:
      return false;
    case 0xc3:
      return true;
    case 0xca:
      return this.unpack_float();
    case 0xcb:
      return this.unpack_double();
    case 0xcc:
      return this.unpack_uint8();
    case 0xcd:
      return this.unpack_uint16();
    case 0xce:
      return this.unpack_uint32();
    case 0xcf:
      return this.unpack_uint64();
    case 0xd0:
      return this.unpack_int8();
    case 0xd1:
      return this.unpack_int16();
    case 0xd2:
      return this.unpack_int32();
    case 0xd3:
      return this.unpack_int64();
    case 0xd4:
      return undefined;
    case 0xd5:
      return undefined;
    case 0xd6:
      return undefined;
    case 0xd7:
      return undefined;
    case 0xd8:
      size = this.unpack_uint16();
      return this.unpack_string(size);
    case 0xd9:
      size = this.unpack_uint32();
      return this.unpack_string(size);
    case 0xda:
      size = this.unpack_uint16();
      return this.unpack_raw(size);
    case 0xdb:
      size = this.unpack_uint32();
      return this.unpack_raw(size);
    case 0xdc:
      size = this.unpack_uint16();
      return this.unpack_array(size);
    case 0xdd:
      size = this.unpack_uint32();
      return this.unpack_array(size);
    case 0xde:
      size = this.unpack_uint16();
      return this.unpack_map(size);
    case 0xdf:
      size = this.unpack_uint32();
      return this.unpack_map(size);
  }
}

Unpacker.prototype.unpack_uint8 = function(){
  var byte = this.dataView[this.index] & 0xff;
  this.index++;
  return byte;
};

Unpacker.prototype.unpack_uint16 = function(){
  var bytes = this.read(2);
  var uint16 =
    ((bytes[0] & 0xff) * 256) + (bytes[1] & 0xff);
  this.index += 2;
  return uint16;
}

Unpacker.prototype.unpack_uint32 = function(){
  var bytes = this.read(4);
  var uint32 =
     ((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3];
  this.index += 4;
  return uint32;
}

Unpacker.prototype.unpack_uint64 = function(){
  var bytes = this.read(8);
  var uint64 =
   ((((((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3]) * 256 +
       bytes[4]) * 256 +
       bytes[5]) * 256 +
       bytes[6]) * 256 +
       bytes[7];
  this.index += 8;
  return uint64;
}


Unpacker.prototype.unpack_int8 = function(){
  var uint8 = this.unpack_uint8();
  return (uint8 < 0x80 ) ? uint8 : uint8 - (1 << 8);
};

Unpacker.prototype.unpack_int16 = function(){
  var uint16 = this.unpack_uint16();
  return (uint16 < 0x8000 ) ? uint16 : uint16 - (1 << 16);
}

Unpacker.prototype.unpack_int32 = function(){
  var uint32 = this.unpack_uint32();
  return (uint32 < Math.pow(2, 31) ) ? uint32 :
    uint32 - Math.pow(2, 32);
}

Unpacker.prototype.unpack_int64 = function(){
  var uint64 = this.unpack_uint64();
  return (uint64 < Math.pow(2, 63) ) ? uint64 :
    uint64 - Math.pow(2, 64);
}

Unpacker.prototype.unpack_raw = function(size){
  if ( this.length < this.index + size){
    throw new Error('BinaryPackFailure: index is out of range'
      + ' ' + this.index + ' ' + size + ' ' + this.length);
  }
  var buf = this.dataBuffer.slice(this.index, this.index + size);
  this.index += size;

    //buf = util.bufferToString(buf);

  return buf;
}

Unpacker.prototype.unpack_string = function(size){
  var bytes = this.read(size);
  var i = 0, str = '', c, code;
  while(i < size){
    c = bytes[i];
    if ( c < 128){
      str += String.fromCharCode(c);
      i++;
    } else if ((c ^ 0xc0) < 32){
      code = ((c ^ 0xc0) << 6) | (bytes[i+1] & 63);
      str += String.fromCharCode(code);
      i += 2;
    } else {
      code = ((c & 15) << 12) | ((bytes[i+1] & 63) << 6) |
        (bytes[i+2] & 63);
      str += String.fromCharCode(code);
      i += 3;
    }
  }
  this.index += size;
  return str;
}

Unpacker.prototype.unpack_array = function(size){
  var objects = new Array(size);
  for(var i = 0; i < size ; i++){
    objects[i] = this.unpack();
  }
  return objects;
}

Unpacker.prototype.unpack_map = function(size){
  var map = {};
  for(var i = 0; i < size ; i++){
    var key  = this.unpack();
    var value = this.unpack();
    map[key] = value;
  }
  return map;
}

Unpacker.prototype.unpack_float = function(){
  var uint32 = this.unpack_uint32();
  var sign = uint32 >> 31;
  var exp  = ((uint32 >> 23) & 0xff) - 127;
  var fraction = ( uint32 & 0x7fffff ) | 0x800000;
  return (sign == 0 ? 1 : -1) *
    fraction * Math.pow(2, exp - 23);
}

Unpacker.prototype.unpack_double = function(){
  var h32 = this.unpack_uint32();
  var l32 = this.unpack_uint32();
  var sign = h32 >> 31;
  var exp  = ((h32 >> 20) & 0x7ff) - 1023;
  var hfrac = ( h32 & 0xfffff ) | 0x100000;
  var frac = hfrac * Math.pow(2, exp - 20) +
    l32   * Math.pow(2, exp - 52);
  return (sign == 0 ? 1 : -1) * frac;
}

Unpacker.prototype.read = function(length){
  var j = this.index;
  if (j + length <= this.length) {
    return this.dataView.subarray(j, j + length);
  } else {
    throw new Error('BinaryPackFailure: read index out of range');
  }
}

function Packer(){
  this.bufferBuilder = new BufferBuilder();
}

Packer.prototype.getBuffer = function(){
  return this.bufferBuilder.getBuffer();
}

Packer.prototype.pack = function(value){
  var type = typeof(value);
  if (type == 'string'){
    this.pack_string(value);
  } else if (type == 'number'){
    if (Math.floor(value) === value){
      this.pack_integer(value);
    } else{
      this.pack_double(value);
    }
  } else if (type == 'boolean'){
    if (value === true){
      this.bufferBuilder.append(0xc3);
    } else if (value === false){
      this.bufferBuilder.append(0xc2);
    }
  } else if (type == 'undefined'){
    this.bufferBuilder.append(0xc0);
  } else if (type == 'object'){
    if (value === null){
      this.bufferBuilder.append(0xc0);
    } else {
      var constructor = value.constructor;
      if (constructor == Array){
        this.pack_array(value);
      } else if (constructor == Blob || constructor == File) {
        this.pack_bin(value);
      } else if (constructor == ArrayBuffer) {
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value));
        } else {
          this.pack_bin(value);
        }
      } else if ('BYTES_PER_ELEMENT' in value){
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value.buffer));
        } else {
          this.pack_bin(value.buffer);
        }
      } else if (constructor == Object){
        this.pack_object(value);
      } else if (constructor == Date){
        this.pack_string(value.toString());
      } else if (typeof value.toBinaryPack == 'function'){
        this.bufferBuilder.append(value.toBinaryPack());
      } else {
        throw new Error('Type "' + constructor.toString() + '" not yet supported');
      }
    }
  } else {
    throw new Error('Type "' + type + '" not yet supported');
  }
  this.bufferBuilder.flush();
}


Packer.prototype.pack_bin = function(blob){
  var length = blob.length || blob.byteLength || blob.size;
  if (length <= 0x0f){
    this.pack_uint8(0xa0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xda) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdb);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(blob);
}

Packer.prototype.pack_string = function(str){
  var length = utf8Length(str);

  if (length <= 0x0f){
    this.pack_uint8(0xb0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xd8) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xd9);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(str);
}

Packer.prototype.pack_array = function(ary){
  var length = ary.length;
  if (length <= 0x0f){
    this.pack_uint8(0x90 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xdc)
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdd);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var i = 0; i < length ; i++){
    this.pack(ary[i]);
  }
}

Packer.prototype.pack_integer = function(num){
  if ( -0x20 <= num && num <= 0x7f){
    this.bufferBuilder.append(num & 0xff);
  } else if (0x00 <= num && num <= 0xff){
    this.bufferBuilder.append(0xcc);
    this.pack_uint8(num);
  } else if (-0x80 <= num && num <= 0x7f){
    this.bufferBuilder.append(0xd0);
    this.pack_int8(num);
  } else if ( 0x0000 <= num && num <= 0xffff){
    this.bufferBuilder.append(0xcd);
    this.pack_uint16(num);
  } else if (-0x8000 <= num && num <= 0x7fff){
    this.bufferBuilder.append(0xd1);
    this.pack_int16(num);
  } else if ( 0x00000000 <= num && num <= 0xffffffff){
    this.bufferBuilder.append(0xce);
    this.pack_uint32(num);
  } else if (-0x80000000 <= num && num <= 0x7fffffff){
    this.bufferBuilder.append(0xd2);
    this.pack_int32(num);
  } else if (-0x8000000000000000 <= num && num <= 0x7FFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xd3);
    this.pack_int64(num);
  } else if (0x0000000000000000 <= num && num <= 0xFFFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xcf);
    this.pack_uint64(num);
  } else{
    throw new Error('Invalid integer');
  }
}

Packer.prototype.pack_double = function(num){
  var sign = 0;
  if (num < 0){
    sign = 1;
    num = -num;
  }
  var exp  = Math.floor(Math.log(num) / Math.LN2);
  var frac0 = num / Math.pow(2, exp) - 1;
  var frac1 = Math.floor(frac0 * Math.pow(2, 52));
  var b32   = Math.pow(2, 32);
  var h32 = (sign << 31) | ((exp+1023) << 20) |
      (frac1 / b32) & 0x0fffff;
  var l32 = frac1 % b32;
  this.bufferBuilder.append(0xcb);
  this.pack_int32(h32);
  this.pack_int32(l32);
}

Packer.prototype.pack_object = function(obj){
  var keys = Object.keys(obj);
  var length = keys.length;
  if (length <= 0x0f){
    this.pack_uint8(0x80 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xde);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdf);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var prop in obj){
    if (obj.hasOwnProperty(prop)){
      this.pack(prop);
      this.pack(obj[prop]);
    }
  }
}

Packer.prototype.pack_uint8 = function(num){
  this.bufferBuilder.append(num);
}

Packer.prototype.pack_uint16 = function(num){
  this.bufferBuilder.append(num >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_uint32 = function(num){
  var n = num & 0xffffffff;
  this.bufferBuilder.append((n & 0xff000000) >>> 24);
  this.bufferBuilder.append((n & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((n & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((n & 0x000000ff));
}

Packer.prototype.pack_uint64 = function(num){
  var high = num / Math.pow(2, 32);
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}

Packer.prototype.pack_int8 = function(num){
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int16 = function(num){
  this.bufferBuilder.append((num & 0xff00) >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int32 = function(num){
  this.bufferBuilder.append((num >>> 24) & 0xff);
  this.bufferBuilder.append((num & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((num & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((num & 0x000000ff));
}

Packer.prototype.pack_int64 = function(num){
  var high = Math.floor(num / Math.pow(2, 32));
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}

function _utf8Replace(m){
  var code = m.charCodeAt(0);

  if(code <= 0x7ff) return '00';
  if(code <= 0xffff) return '000';
  if(code <= 0x1fffff) return '0000';
  if(code <= 0x3ffffff) return '00000';
  return '000000';
}

function utf8Length(str){
  if (str.length > 600) {
    // Blob method faster for large strings
    return (new Blob([str])).size;
  } else {
    return str.replace(/[^\u0000-\u007F]/g, _utf8Replace).length;
  }
}


/***/ }),
/* 4 */
/***/ (function(module, exports) {

var binaryFeatures = {};
binaryFeatures.useBlobBuilder = (function(){
  try {
    new Blob([]);
    return false;
  } catch (e) {
    return true;
  }
})();

binaryFeatures.useArrayBufferView = !binaryFeatures.useBlobBuilder && (function(){
  try {
    return (new Blob([new Uint8Array([])])).size === 0;
  } catch (e) {
    return true;
  }
})();

module.exports.binaryFeatures = binaryFeatures;
var BlobBuilder = module.exports.BlobBuilder;
if (typeof window != 'undefined') {
  BlobBuilder = module.exports.BlobBuilder = window.WebKitBlobBuilder ||
    window.MozBlobBuilder || window.MSBlobBuilder || window.BlobBuilder;
}

function BufferBuilder(){
  this._pieces = [];
  this._parts = [];
}

BufferBuilder.prototype.append = function(data) {
  if(typeof data === 'number') {
    this._pieces.push(data);
  } else {
    this.flush();
    this._parts.push(data);
  }
};

BufferBuilder.prototype.flush = function() {
  if (this._pieces.length > 0) {
    var buf = new Uint8Array(this._pieces);
    if(!binaryFeatures.useArrayBufferView) {
      buf = buf.buffer;
    }
    this._parts.push(buf);
    this._pieces = [];
  }
};

BufferBuilder.prototype.getBuffer = function() {
  this.flush();
  if(binaryFeatures.useBlobBuilder) {
    var builder = new BlobBuilder();
    for(var i = 0, ii = this._parts.length; i < ii; i++) {
      builder.append(this._parts[i]);
    }
    return builder.getBlob();
  } else {
    return new Blob(this._parts);
  }
};

module.exports.BufferBuilder = BufferBuilder;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var util = __webpack_require__(0);
var RTCPeerConnection = __webpack_require__(2).RTCPeerConnection;
var RTCSessionDescription = __webpack_require__(2).RTCSessionDescription;
var RTCIceCandidate = __webpack_require__(2).RTCIceCandidate;

/**
 * Manages all negotiations between Peers.
 */
var Negotiator = {
  pcs: {
    data: {},
    media: {}
  }, // type => {peerId: {pc_id: pc}}.
  //providers: {}, // provider's id => providers (there may be multiple providers/client.
  queue: [] // connections that are delayed due to a PC being in use.
}

Negotiator._idPrefix = 'pc_';

/** Returns a PeerConnection object set up correctly (for data, media). */
Negotiator.startConnection = function(connection, options) {
  var pc = Negotiator._getPeerConnection(connection, options);

  if (connection.type === 'media' && options._stream) {
    // Add the stream.
    pc.addStream(options._stream);
  }

  // Set the connection's PC.
  connection.pc = connection.peerConnection = pc;
  // What do we need to do now?
  if (options.originator) {
    if (connection.type === 'data') {
      // Create the datachannel.
      var config = {};
      // Dropping reliable:false support, since it seems to be crashing
      // Chrome.
      /*if (util.supports.sctp && !options.reliable) {
        // If we have canonical reliable support...
        config = {maxRetransmits: 0};
      }*/
      // Fallback to ensure older browsers don't crash.
      if (!util.supports.sctp) {
        config = {reliable: options.reliable};
      }
      var dc = pc.createDataChannel(connection.label, config);
      connection.initialize(dc);
    }

    if (!util.supports.onnegotiationneeded) {
      Negotiator._makeOffer(connection);
    }
  } else {
    Negotiator.handleSDP('OFFER', connection, options.sdp);
  }
}

Negotiator._getPeerConnection = function(connection, options) {
  if (!Negotiator.pcs[connection.type]) {
    util.error(connection.type + ' is not a valid connection type. Maybe you overrode the `type` property somewhere.');
  }

  if (!Negotiator.pcs[connection.type][connection.peer]) {
    Negotiator.pcs[connection.type][connection.peer] = {};
  }
  var peerConnections = Negotiator.pcs[connection.type][connection.peer];

  var pc;
  // Not multiplexing while FF and Chrome have not-great support for it.
  /*if (options.multiplex) {
    ids = Object.keys(peerConnections);
    for (var i = 0, ii = ids.length; i < ii; i += 1) {
      pc = peerConnections[ids[i]];
      if (pc.signalingState === 'stable') {
        break; // We can go ahead and use this PC.
      }
    }
  } else */
  if (options.pc) { // Simplest case: PC id already provided for us.
    pc = Negotiator.pcs[connection.type][connection.peer][options.pc];
  }

  if (!pc || pc.signalingState !== 'stable') {
    pc = Negotiator._startPeerConnection(connection);
  }
  return pc;
}

/*
Negotiator._addProvider = function(provider) {
  if ((!provider.id && !provider.disconnected) || !provider.socket.open) {
    // Wait for provider to obtain an ID.
    provider.on('open', function(id) {
      Negotiator._addProvider(provider);
    });
  } else {
    Negotiator.providers[provider.id] = provider;
  }
}*/


/** Start a PC. */
Negotiator._startPeerConnection = function(connection) {
  util.log('Creating RTCPeerConnection.');

  var id = Negotiator._idPrefix + util.randomToken();
  var optional = {};

  if (connection.type === 'data' && !util.supports.sctp) {
    optional = {optional: [{RtpDataChannels: true}]};
  } else if (connection.type === 'media') {
    // Interop req for chrome.
    optional = {optional: [{DtlsSrtpKeyAgreement: true}]};
  }

  var pc = new RTCPeerConnection(connection.provider.options.config, optional);
  Negotiator.pcs[connection.type][connection.peer][id] = pc;

  Negotiator._setupListeners(connection, pc, id);

  return pc;
}

/** Set up various WebRTC listeners. */
Negotiator._setupListeners = function(connection, pc, pc_id) {
  var peerId = connection.peer;
  var connectionId = connection.id;
  var provider = connection.provider;

  // ICE CANDIDATES.
  util.log('Listening for ICE candidates.');
  pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log('Received ICE candidates for:', connection.peer);
      provider.socket.send({
        type: 'CANDIDATE',
        payload: {
          candidate: evt.candidate,
          type: connection.type,
          connectionId: connection.id
        },
        dst: peerId
      });
    }
  };

  pc.oniceconnectionstatechange = function() {
    switch (pc.iceConnectionState) {
      case 'failed':
        util.log('iceConnectionState is disconnected, closing connections to ' + peerId);
        connection.emit('error', new Error('Negotiation of connection to ' + peerId + ' failed.'));
        connection.close();
        break;
      case 'disconnected':
        util.log('iceConnectionState is disconnected, closing connections to ' + peerId);
        connection.close();
        break;
      case 'completed':
        pc.onicecandidate = util.noop;
        break;
    }
  };

  // Fallback for older Chrome impls.
  pc.onicechange = pc.oniceconnectionstatechange;

  // ONNEGOTIATIONNEEDED (Chrome)
  util.log('Listening for `negotiationneeded`');
  pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    if (pc.signalingState == 'stable') {
      Negotiator._makeOffer(connection);
    } else {
      util.log('onnegotiationneeded triggered when not stable. Is another connection being established?');
    }
  };

  // DATACONNECTION.
  util.log('Listening for data channel');
  // Fired between offer and answer, so options should already be saved
  // in the options hash.
  pc.ondatachannel = function(evt) {
    util.log('Received data channel');
    var dc = evt.channel;
    var connection = provider.getConnection(peerId, connectionId);
    connection.initialize(dc);
  };

  // MEDIACONNECTION.
  util.log('Listening for remote stream');
  pc.onaddstream = function(evt) {
    util.log('Received remote stream');
    var stream = evt.stream;
    var connection = provider.getConnection(peerId, connectionId);
    // 10/10/2014: looks like in Chrome 38, onaddstream is triggered after
    // setting the remote description. Our connection object in these cases
    // is actually a DATA connection, so addStream fails.
    // TODO: This is hopefully just a temporary fix. We should try to
    // understand why this is happening.
    if (connection.type === 'media') {
      connection.addStream(stream);
    }
  };
}

Negotiator.cleanup = function(connection) {
  util.log('Cleaning up PeerConnection to ' + connection.peer);

  var pc = connection.pc;

  if (!!pc && (pc.readyState !== 'closed' || pc.signalingState !== 'closed')) {
    pc.close();
    connection.pc = null;
  }
}

Negotiator._makeOffer = function(connection) {
  var pc = connection.pc;
  pc.createOffer(function(offer) {
    util.log('Created offer.');

    if (!util.supports.sctp && connection.type === 'data' && connection.reliable) {
      offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
    }

    pc.setLocalDescription(offer, function() {
      util.log('Set localDescription: offer', 'for:', connection.peer);
      connection.provider.socket.send({
        type: 'OFFER',
        payload: {
          sdp: offer,
          type: connection.type,
          label: connection.label,
          connectionId: connection.id,
          reliable: connection.reliable,
          serialization: connection.serialization,
          metadata: connection.metadata,
          browser: util.browser
        },
        dst: connection.peer
      });
    }, function(err) {
      connection.provider.emitError('webrtc', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  }, function(err) {
    connection.provider.emitError('webrtc', err);
    util.log('Failed to createOffer, ', err);
  }, connection.options.constraints);
}

Negotiator._makeAnswer = function(connection) {
  var pc = connection.pc;

  pc.createAnswer(function(answer) {
    util.log('Created answer.');

    if (!util.supports.sctp && connection.type === 'data' && connection.reliable) {
      answer.sdp = Reliable.higherBandwidthSDP(answer.sdp);
    }

    pc.setLocalDescription(answer, function() {
      util.log('Set localDescription: answer', 'for:', connection.peer);
      connection.provider.socket.send({
        type: 'ANSWER',
        payload: {
          sdp: answer,
          type: connection.type,
          connectionId: connection.id,
          browser: util.browser
        },
        dst: connection.peer
      });
    }, function(err) {
      connection.provider.emitError('webrtc', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  }, function(err) {
    connection.provider.emitError('webrtc', err);
    util.log('Failed to create answer, ', err);
  });
}

/** Handle an SDP. */
Negotiator.handleSDP = function(type, connection, sdp) {
  sdp = new RTCSessionDescription(sdp);
  var pc = connection.pc;

  util.log('Setting remote description', sdp);
  pc.setRemoteDescription(sdp, function() {
    util.log('Set remoteDescription:', type, 'for:', connection.peer);

    if (type === 'OFFER') {
      Negotiator._makeAnswer(connection);
    }
  }, function(err) {
    connection.provider.emitError('webrtc', err);
    util.log('Failed to setRemoteDescription, ', err);
  });
}

/** Handle a candidate. */
Negotiator.handleCandidate = function(connection, ice) {
  var candidate = ice.candidate;
  var sdpMLineIndex = ice.sdpMLineIndex;
  connection.pc.addIceCandidate(new RTCIceCandidate({
    sdpMLineIndex: sdpMLineIndex,
    candidate: candidate
  }));
  util.log('Added ICE candidate for:', connection.peer);
}

module.exports = Negotiator;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var require;var require;/*! adapterjs - v0.14.1-6d236da - 2017-02-28 */
var AdapterJS=AdapterJS||{};AdapterJS.options=AdapterJS.options||{},AdapterJS.VERSION="0.14.1-6d236da",AdapterJS.onwebrtcready=AdapterJS.onwebrtcready||function(isUsingPlugin){},AdapterJS._onwebrtcreadies=[],AdapterJS.webRTCReady=function(baseCallback){if("function"!=typeof baseCallback)throw new Error("Callback provided is not a function");var callback=function(){"function"==typeof window.require&&"function"==typeof AdapterJS.defineMediaSourcePolyfill&&AdapterJS.defineMediaSourcePolyfill(),baseCallback(null!==AdapterJS.WebRTCPlugin.plugin)};!0===AdapterJS.onwebrtcreadyDone?callback():AdapterJS._onwebrtcreadies.push(callback)},AdapterJS.WebRTCPlugin=AdapterJS.WebRTCPlugin||{},AdapterJS.WebRTCPlugin.pluginInfo=AdapterJS.WebRTCPlugin.pluginInfo||{prefix:"Tem",plugName:"TemWebRTCPlugin",pluginId:"plugin0",type:"application/x-temwebrtcplugin",onload:"__TemWebRTCReady0",portalLink:"https://skylink.io/plugin/",downloadLink:null,companyName:"Temasys",downloadLinks:{mac:"https://bit.ly/webrtcpluginpkg",win:"https://bit.ly/webrtcpluginmsi"}},"undefined"!=typeof AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks&&null!==AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks&&(navigator.platform.match(/^Mac/i)?AdapterJS.WebRTCPlugin.pluginInfo.downloadLink=AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks.mac:navigator.platform.match(/^Win/i)&&(AdapterJS.WebRTCPlugin.pluginInfo.downloadLink=AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks.win)),AdapterJS.WebRTCPlugin.TAGS={NONE:"none",AUDIO:"audio",VIDEO:"video"},AdapterJS.WebRTCPlugin.pageId=Math.random().toString(36).slice(2),AdapterJS.WebRTCPlugin.plugin=null,AdapterJS.WebRTCPlugin.setLogLevel=null,AdapterJS.WebRTCPlugin.defineWebRTCInterface=null,AdapterJS.WebRTCPlugin.isPluginInstalled=null,AdapterJS.WebRTCPlugin.pluginInjectionInterval=null,AdapterJS.WebRTCPlugin.injectPlugin=null,AdapterJS.WebRTCPlugin.PLUGIN_STATES={NONE:0,INITIALIZING:1,INJECTING:2,INJECTED:3,READY:4},AdapterJS.WebRTCPlugin.pluginState=AdapterJS.WebRTCPlugin.PLUGIN_STATES.NONE,AdapterJS.onwebrtcreadyDone=!1,AdapterJS.WebRTCPlugin.PLUGIN_LOG_LEVELS={NONE:"NONE",ERROR:"ERROR",WARNING:"WARNING",INFO:"INFO",VERBOSE:"VERBOSE",SENSITIVE:"SENSITIVE"},AdapterJS.WebRTCPlugin.WaitForPluginReady=null,AdapterJS.WebRTCPlugin.callWhenPluginReady=null,__TemWebRTCReady0=function(){if("complete"===document.readyState)AdapterJS.WebRTCPlugin.pluginState=AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY,AdapterJS.maybeThroughWebRTCReady();else var timer=setInterval(function(){"complete"===document.readyState&&(clearInterval(timer),AdapterJS.WebRTCPlugin.pluginState=AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY,AdapterJS.maybeThroughWebRTCReady())},100)},AdapterJS.maybeThroughWebRTCReady=function(){AdapterJS.onwebrtcreadyDone||(AdapterJS.onwebrtcreadyDone=!0,AdapterJS._onwebrtcreadies.length?AdapterJS._onwebrtcreadies.forEach(function(callback){"function"==typeof callback&&callback(null!==AdapterJS.WebRTCPlugin.plugin)}):"function"==typeof AdapterJS.onwebrtcready&&AdapterJS.onwebrtcready(null!==AdapterJS.WebRTCPlugin.plugin))},AdapterJS.TEXT={PLUGIN:{REQUIRE_INSTALLATION:"This website requires you to install a WebRTC-enabling plugin to work on this browser.",NOT_SUPPORTED:"Your browser does not support WebRTC.",BUTTON:"Install Now"},REFRESH:{REQUIRE_REFRESH:"Please refresh page",BUTTON:"Refresh Page"}},AdapterJS._iceConnectionStates={starting:"starting",checking:"checking",connected:"connected",completed:"connected",done:"completed",disconnected:"disconnected",failed:"failed",closed:"closed"},AdapterJS._iceConnectionFiredStates=[],AdapterJS.isDefined=null,AdapterJS.parseWebrtcDetectedBrowser=function(){var hasMatch=null;if(window.opr&&opr.addons||window.opera||navigator.userAgent.indexOf(" OPR/")>=0)hasMatch=navigator.userAgent.match(/OPR\/(\d+)/i)||[],webrtcDetectedBrowser="opera",webrtcDetectedVersion=parseInt(hasMatch[1]||"0",10),webrtcMinimumVersion=26,webrtcDetectedType="webkit",webrtcDetectedDCSupport="SCTP";else if(navigator.userAgent.match(/Bowser\/[0-9.]*/g)){hasMatch=navigator.userAgent.match(/Bowser\/[0-9.]*/g)||[];var chromiumVersion=parseInt((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./i)||[])[2]||"0",10);webrtcDetectedBrowser="bowser",webrtcDetectedVersion=parseFloat((hasMatch[0]||"0/0").split("/")[1],10),webrtcMinimumVersion=0,webrtcDetectedType="webkit",webrtcDetectedDCSupport=chromiumVersion>30?"SCTP":"RTP"}else if(navigator.userAgent.indexOf("OPiOS")>0)hasMatch=navigator.userAgent.match(/OPiOS\/([0-9]+)\./),webrtcDetectedBrowser="opera",webrtcDetectedVersion=parseInt(hasMatch[1]||"0",10),webrtcMinimumVersion=0,webrtcDetectedType=null,webrtcDetectedDCSupport=null;else if(navigator.userAgent.indexOf("CriOS")>0)hasMatch=navigator.userAgent.match(/CriOS\/([0-9]+)\./)||[],webrtcDetectedBrowser="chrome",webrtcDetectedVersion=parseInt(hasMatch[1]||"0",10),webrtcMinimumVersion=0,webrtcDetectedType=null,webrtcDetectedDCSupport=null;else if(navigator.userAgent.indexOf("FxiOS")>0)hasMatch=navigator.userAgent.match(/FxiOS\/([0-9]+)\./)||[],webrtcDetectedBrowser="firefox",webrtcDetectedVersion=parseInt(hasMatch[1]||"0",10),webrtcMinimumVersion=0,webrtcDetectedType=null,webrtcDetectedDCSupport=null;else if(document.documentMode)hasMatch=/\brv[ :]+(\d+)/g.exec(navigator.userAgent)||[],webrtcDetectedBrowser="IE",webrtcDetectedVersion=parseInt(hasMatch[1],10),webrtcMinimumVersion=9,webrtcDetectedType="plugin",webrtcDetectedDCSupport="SCTP",webrtcDetectedVersion||(hasMatch=/\bMSIE[ :]+(\d+)/g.exec(navigator.userAgent)||[],webrtcDetectedVersion=parseInt(hasMatch[1]||"0",10));else if(window.StyleMedia||navigator.userAgent.match(/Edge\/(\d+).(\d+)$/))hasMatch=navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)||[],webrtcDetectedBrowser="edge",webrtcDetectedVersion=parseFloat((hasMatch[0]||"0/0").split("/")[1],10),webrtcMinimumVersion=13.10547,webrtcDetectedType="ms",webrtcDetectedDCSupport=null;else if("undefined"!=typeof InstallTrigger||navigator.userAgent.indexOf("irefox")>0)hasMatch=navigator.userAgent.match(/Firefox\/([0-9]+)\./)||[],webrtcDetectedBrowser="firefox",webrtcDetectedVersion=parseInt(hasMatch[1]||"0",10),webrtcMinimumVersion=33,webrtcDetectedType="moz",webrtcDetectedDCSupport="SCTP";else if(window.chrome&&window.chrome.webstore||navigator.userAgent.indexOf("Chrom")>0)hasMatch=navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./i)||[],webrtcDetectedBrowser="chrome",webrtcDetectedVersion=parseInt(hasMatch[2]||"0",10),webrtcMinimumVersion=38,webrtcDetectedType="webkit",webrtcDetectedDCSupport=webrtcDetectedVersion>30?"SCTP":"RTP";else if(/^((?!chrome|android).)*safari/i.test(navigator.userAgent)){hasMatch=navigator.userAgent.match(/version\/(\d+)/i)||[];var isMobile=navigator.userAgent.match(/(iPhone|iPad)/gi)||[];webrtcDetectedBrowser="safari",webrtcDetectedVersion=parseInt(hasMatch[1]||"0",10),webrtcMinimumVersion=7,webrtcDetectedType=0===isMobile.length?"plugin":null,webrtcDetectedDCSupport=0===isMobile.length?"SCTP":null}window.webrtcDetectedBrowser=webrtcDetectedBrowser,window.webrtcDetectedVersion=webrtcDetectedVersion,window.webrtcMinimumVersion=webrtcMinimumVersion,window.webrtcDetectedType=webrtcDetectedType,window.webrtcDetectedDCSupport=webrtcDetectedDCSupport},AdapterJS.addEvent=function(elem,evnt,func){elem.addEventListener?elem.addEventListener(evnt,func,!1):elem.attachEvent?elem.attachEvent("on"+evnt,func):elem[evnt]=func},AdapterJS.renderNotificationBar=function(message,buttonText,buttonCallback){if("complete"===document.readyState){var w=window,i=document.createElement("iframe");i.name="adapterjs-alert",i.style.position="fixed",i.style.top="-41px",i.style.left=0,i.style.right=0,i.style.width="100%",i.style.height="40px",i.style.backgroundColor="#ffffe1",i.style.border="none",i.style.borderBottom="1px solid #888888",i.style.zIndex="9999999","string"==typeof i.style.webkitTransition?i.style.webkitTransition="all .5s ease-out":"string"==typeof i.style.transition&&(i.style.transition="all .5s ease-out"),document.body.appendChild(i);var c=i.contentWindow?i.contentWindow:i.contentDocument.document?i.contentDocument.document:i.contentDocument;c.document.open(),c.document.write('<span style="display: inline-block; font-family: Helvetica, Arial,sans-serif; font-size: .9rem; padding: 4px; vertical-align: middle; cursor: default;">'+message+"</span>"),buttonText&&"function"==typeof buttonCallback?(c.document.write('<button id="okay">'+buttonText+'</button><button id="cancel">Cancel</button>'),c.document.close(),AdapterJS.addEvent(c.document.getElementById("okay"),"click",function(e){e.preventDefault();try{e.cancelBubble=!0}catch(error){}buttonCallback(e)}),AdapterJS.addEvent(c.document.getElementById("cancel"),"click",function(e){w.document.body.removeChild(i)})):c.document.close(),setTimeout(function(){"string"==typeof i.style.webkitTransform?i.style.webkitTransform="translateY(40px)":"string"==typeof i.style.transform?i.style.transform="translateY(40px)":i.style.top="0px"},300)}},webrtcDetectedType=null,checkMediaDataChannelSettings=function(peerBrowserAgent,peerBrowserVersion,callback,constraints){if("function"==typeof callback){var beOfferer=!0,isLocalFirefox="firefox"===webrtcDetectedBrowser,isLocalFirefoxInterop="moz"===webrtcDetectedType&&webrtcDetectedVersion>30,isPeerFirefox="firefox"===peerBrowserAgent;if(isLocalFirefox&&isPeerFirefox||isLocalFirefoxInterop)try{delete constraints.mandatory.MozDontOfferDataChannel}catch(error){}else isLocalFirefox&&!isPeerFirefox&&(constraints.mandatory.MozDontOfferDataChannel=!0);if(!isLocalFirefox)for(var prop in constraints.mandatory)constraints.mandatory.hasOwnProperty(prop)&&prop.indexOf("Moz")!==-1&&delete constraints.mandatory[prop];!isLocalFirefox||isPeerFirefox||isLocalFirefoxInterop||(beOfferer=!1),callback(beOfferer,constraints)}},checkIceConnectionState=function(peerId,iceConnectionState,callback){"function"==typeof callback&&(peerId=peerId?peerId:"peer",AdapterJS._iceConnectionFiredStates[peerId]&&iceConnectionState!==AdapterJS._iceConnectionStates.disconnected&&iceConnectionState!==AdapterJS._iceConnectionStates.failed&&iceConnectionState!==AdapterJS._iceConnectionStates.closed||(AdapterJS._iceConnectionFiredStates[peerId]=[]),iceConnectionState=AdapterJS._iceConnectionStates[iceConnectionState],AdapterJS._iceConnectionFiredStates[peerId].indexOf(iceConnectionState)<0&&(AdapterJS._iceConnectionFiredStates[peerId].push(iceConnectionState),iceConnectionState===AdapterJS._iceConnectionStates.connected&&setTimeout(function(){AdapterJS._iceConnectionFiredStates[peerId].push(AdapterJS._iceConnectionStates.done),callback(AdapterJS._iceConnectionStates.done)},1e3),callback(iceConnectionState)))},createIceServer=null,createIceServers=null,RTCPeerConnection="function"==typeof RTCPeerConnection?RTCPeerConnection:null,RTCSessionDescription="function"==typeof RTCSessionDescription?RTCSessionDescription:null,RTCIceCandidate="function"==typeof RTCIceCandidate?RTCIceCandidate:null,getUserMedia=null,attachMediaStream=null,reattachMediaStream=null,webrtcDetectedBrowser=null,webrtcDetectedVersion=null,webrtcMinimumVersion=null,!(navigator.mozGetUserMedia||navigator.webkitGetUserMedia||navigator.mediaDevices&&navigator.userAgent.match(/Edge\/(\d+).(\d+)$/))||0===(navigator.userAgent.match(/android/gi)||[]).length&&0===(navigator.userAgent.match(/chrome/gi)||[]).length&&navigator.userAgent.indexOf("Safari/")>0?("object"==typeof console&&"function"==typeof console.log||(console={}||console,console.log=function(arg){},console.info=function(arg){},console.error=function(arg){},console.dir=function(arg){},console.exception=function(arg){},console.trace=function(arg){},console.warn=function(arg){},console.count=function(arg){},console.debug=function(arg){},console.count=function(arg){},console.time=function(arg){},console.timeEnd=function(arg){},console.group=function(arg){},console.groupCollapsed=function(arg){},console.groupEnd=function(arg){}),AdapterJS.parseWebrtcDetectedBrowser(),isIE="IE"===webrtcDetectedBrowser,AdapterJS.WebRTCPlugin.WaitForPluginReady=function(){for(;AdapterJS.WebRTCPlugin.pluginState!==AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY;);},AdapterJS.WebRTCPlugin.callWhenPluginReady=function(callback){if(AdapterJS.WebRTCPlugin.pluginState===AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY)callback();else var checkPluginReadyState=setInterval(function(){AdapterJS.WebRTCPlugin.pluginState===AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY&&(clearInterval(checkPluginReadyState),callback())},100)},AdapterJS.WebRTCPlugin.setLogLevel=function(logLevel){AdapterJS.WebRTCPlugin.callWhenPluginReady(function(){AdapterJS.WebRTCPlugin.plugin.setLogLevel(logLevel)})},AdapterJS.WebRTCPlugin.injectPlugin=function(){if("complete"===document.readyState&&AdapterJS.WebRTCPlugin.pluginState===AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING){if(AdapterJS.WebRTCPlugin.pluginState=AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTING,"IE"===webrtcDetectedBrowser&&webrtcDetectedVersion<=10){var frag=document.createDocumentFragment();for(AdapterJS.WebRTCPlugin.plugin=document.createElement("div"),AdapterJS.WebRTCPlugin.plugin.innerHTML='<object id="'+AdapterJS.WebRTCPlugin.pluginInfo.pluginId+'" type="'+AdapterJS.WebRTCPlugin.pluginInfo.type+'" width="1" height="1"><param name="pluginId" value="'+AdapterJS.WebRTCPlugin.pluginInfo.pluginId+'" /> <param name="windowless" value="false" /> <param name="pageId" value="'+AdapterJS.WebRTCPlugin.pageId+'" /> <param name="onload" value="'+AdapterJS.WebRTCPlugin.pluginInfo.onload+'" /><param name="tag" value="'+AdapterJS.WebRTCPlugin.TAGS.NONE+'" />'+(AdapterJS.options.getAllCams?'<param name="forceGetAllCams" value="True" />':"")+"</object>";AdapterJS.WebRTCPlugin.plugin.firstChild;)frag.appendChild(AdapterJS.WebRTCPlugin.plugin.firstChild);document.body.appendChild(frag),AdapterJS.WebRTCPlugin.plugin=document.getElementById(AdapterJS.WebRTCPlugin.pluginInfo.pluginId)}else AdapterJS.WebRTCPlugin.plugin=document.createElement("object"),AdapterJS.WebRTCPlugin.plugin.id=AdapterJS.WebRTCPlugin.pluginInfo.pluginId,isIE?(AdapterJS.WebRTCPlugin.plugin.width="1px",AdapterJS.WebRTCPlugin.plugin.height="1px"):(AdapterJS.WebRTCPlugin.plugin.width="0px",AdapterJS.WebRTCPlugin.plugin.height="0px"),AdapterJS.WebRTCPlugin.plugin.type=AdapterJS.WebRTCPlugin.pluginInfo.type,AdapterJS.WebRTCPlugin.plugin.innerHTML='<param name="onload" value="'+AdapterJS.WebRTCPlugin.pluginInfo.onload+'"><param name="pluginId" value="'+AdapterJS.WebRTCPlugin.pluginInfo.pluginId+'"><param name="windowless" value="false" /> '+(AdapterJS.options.getAllCams?'<param name="forceGetAllCams" value="True" />':"")+'<param name="pageId" value="'+AdapterJS.WebRTCPlugin.pageId+'"><param name="tag" value="'+AdapterJS.WebRTCPlugin.TAGS.NONE+'" />',document.body.appendChild(AdapterJS.WebRTCPlugin.plugin);AdapterJS.WebRTCPlugin.pluginState=AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTED}},AdapterJS.WebRTCPlugin.isPluginInstalled=function(comName,plugName,plugType,installedCb,notInstalledCb){if(isIE){try{new ActiveXObject(comName+"."+plugName)}catch(e){return void notInstalledCb()}installedCb()}else{for(var pluginArray=navigator.mimeTypes,i=0;i<pluginArray.length;i++)if(pluginArray[i].type.indexOf(plugType)>=0)return void installedCb();notInstalledCb()}},AdapterJS.WebRTCPlugin.defineWebRTCInterface=function(){if(AdapterJS.WebRTCPlugin.pluginState!==AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY){AdapterJS.WebRTCPlugin.pluginState=AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING,AdapterJS.isDefined=function(variable){return null!==variable&&void 0!==variable},createIceServer=function(url,username,password){var iceServer=null,urlParts=url.split(":");return 0===urlParts[0].indexOf("stun")?iceServer={url:url,hasCredentials:!1}:0===urlParts[0].indexOf("turn")&&(iceServer={url:url,hasCredentials:!0,credential:password,username:username}),iceServer},createIceServers=function(urls,username,password){for(var iceServers=[],i=0;i<urls.length;++i)iceServers.push(createIceServer(urls[i],username,password));return iceServers},RTCSessionDescription=function(info){return AdapterJS.WebRTCPlugin.WaitForPluginReady(),AdapterJS.WebRTCPlugin.plugin.ConstructSessionDescription(info.type,info.sdp)},RTCPeerConnection=function(servers,constraints){if(void 0!==servers&&null!==servers&&!Array.isArray(servers.iceServers))throw new Error("Failed to construct 'RTCPeerConnection': Malformed RTCConfiguration");if("undefined"!=typeof constraints&&null!==constraints){var invalidConstraits=!1;if(invalidConstraits|="object"!=typeof constraints,invalidConstraits|=constraints.hasOwnProperty("mandatory")&&void 0!==constraints.mandatory&&null!==constraints.mandatory&&constraints.mandatory.constructor!==Object,invalidConstraits|=constraints.hasOwnProperty("optional")&&void 0!==constraints.optional&&null!==constraints.optional&&!Array.isArray(constraints.optional))throw new Error("Failed to construct 'RTCPeerConnection': Malformed constraints object")}AdapterJS.WebRTCPlugin.WaitForPluginReady();var iceServers=null;if(servers&&Array.isArray(servers.iceServers)){iceServers=servers.iceServers;for(var i=0;i<iceServers.length;i++)iceServers[i].urls&&!iceServers[i].url&&(iceServers[i].url=iceServers[i].urls),iceServers[i].hasCredentials=AdapterJS.isDefined(iceServers[i].username)&&AdapterJS.isDefined(iceServers[i].credential)}if(AdapterJS.WebRTCPlugin.plugin.PEER_CONNECTION_VERSION&&AdapterJS.WebRTCPlugin.plugin.PEER_CONNECTION_VERSION>1)return iceServers&&(servers.iceServers=iceServers),AdapterJS.WebRTCPlugin.plugin.PeerConnection(servers);var mandatory=constraints&&constraints.mandatory?constraints.mandatory:null,optional=constraints&&constraints.optional?constraints.optional:null;return AdapterJS.WebRTCPlugin.plugin.PeerConnection(AdapterJS.WebRTCPlugin.pageId,iceServers,mandatory,optional)},MediaStreamTrack=function(){},MediaStreamTrack.getSources=function(callback){AdapterJS.WebRTCPlugin.callWhenPluginReady(function(){AdapterJS.WebRTCPlugin.plugin.GetSources(callback)})};var constraintsToPlugin=function(c){if("object"!=typeof c||c.mandatory||c.optional)return c;var cc={};return Object.keys(c).forEach(function(key){if("require"!==key&&"advanced"!==key&&"mediaSource"!==key){var r="object"==typeof c[key]?c[key]:{ideal:c[key]};void 0!==r.exact&&"number"==typeof r.exact&&(r.min=r.max=r.exact);var oldname=function(prefix,name){return prefix?prefix+name.charAt(0).toUpperCase()+name.slice(1):"deviceId"===name?"sourceId":name};if(void 0!==r.ideal){cc.optional=cc.optional||[];var oc={};"number"==typeof r.ideal?(oc[oldname("min",key)]=r.ideal,cc.optional.push(oc),oc={},oc[oldname("max",key)]=r.ideal,cc.optional.push(oc)):(oc[oldname("",key)]=r.ideal,cc.optional.push(oc))}void 0!==r.exact&&"number"!=typeof r.exact?(cc.mandatory=cc.mandatory||{},cc.mandatory[oldname("",key)]=r.exact):["min","max"].forEach(function(mix){void 0!==r[mix]&&(cc.mandatory=cc.mandatory||{},cc.mandatory[oldname(mix,key)]=r[mix])})}}),c.advanced&&(cc.optional=(cc.optional||[]).concat(c.advanced)),cc};getUserMedia=function(constraints,successCallback,failureCallback){var cc={};cc.audio=!!constraints.audio&&constraintsToPlugin(constraints.audio),cc.video=!!constraints.video&&constraintsToPlugin(constraints.video),AdapterJS.WebRTCPlugin.callWhenPluginReady(function(){AdapterJS.WebRTCPlugin.plugin.getUserMedia(cc,successCallback,failureCallback)})},window.navigator.getUserMedia=getUserMedia,navigator.mediaDevices||"undefined"==typeof Promise||(requestUserMedia=function(constraints){return new Promise(function(resolve,reject){getUserMedia(constraints,resolve,reject)})},navigator.mediaDevices={getUserMedia:requestUserMedia,enumerateDevices:function(){return new Promise(function(resolve){var kinds={audio:"audioinput",video:"videoinput"};return MediaStreamTrack.getSources(function(devices){resolve(devices.map(function(device){return{label:device.label,kind:kinds[device.kind],id:device.id,deviceId:device.id,groupId:""}}))})})}}),attachMediaStream=function(element,stream){if(element&&element.parentNode){var streamId;null===stream?streamId="":("undefined"!=typeof stream.enableSoundTracks&&stream.enableSoundTracks(!0),streamId=stream.id);var elementId=0===element.id.length?Math.random().toString(36).slice(2):element.id,nodeName=element.nodeName.toLowerCase();if("object"!==nodeName){var tag;switch(nodeName){case"audio":tag=AdapterJS.WebRTCPlugin.TAGS.AUDIO;break;case"video":tag=AdapterJS.WebRTCPlugin.TAGS.VIDEO;break;default:tag=AdapterJS.WebRTCPlugin.TAGS.NONE}var frag=document.createDocumentFragment(),temp=document.createElement("div"),classHTML="";for(element.className?classHTML='class="'+element.className+'" ':element.attributes&&element.attributes.class&&(classHTML='class="'+element.attributes.class.value+'" '),temp.innerHTML='<object id="'+elementId+'" '+classHTML+'type="'+AdapterJS.WebRTCPlugin.pluginInfo.type+'"><param name="pluginId" value="'+elementId+'" /> <param name="pageId" value="'+AdapterJS.WebRTCPlugin.pageId+'" /> <param name="windowless" value="true" /> <param name="streamId" value="'+streamId+'" /> <param name="tag" value="'+tag+'" /> </object>';temp.firstChild;)frag.appendChild(temp.firstChild);var height="",width="";element.clientWidth||element.clientHeight?(width=element.clientWidth,height=element.clientHeight):(element.width||element.height)&&(width=element.width,height=element.height),element.parentNode.insertBefore(frag,element),frag=document.getElementById(elementId),frag.width=width,frag.height=height,element.parentNode.removeChild(element)}else{for(var children=element.children,i=0;i!==children.length;++i)if("streamId"===children[i].name){children[i].value=streamId;break}element.setStreamId(streamId)}var newElement=document.getElementById(elementId);return AdapterJS.forwardEventHandlers(newElement,element,Object.getPrototypeOf(element)),newElement}},reattachMediaStream=function(to,from){for(var stream=null,children=from.children,i=0;i!==children.length;++i)if("streamId"===children[i].name){AdapterJS.WebRTCPlugin.WaitForPluginReady(),stream=AdapterJS.WebRTCPlugin.plugin.getStreamWithId(AdapterJS.WebRTCPlugin.pageId,children[i].value);break}if(null!==stream)return attachMediaStream(to,stream)},window.attachMediaStream=attachMediaStream,window.reattachMediaStream=reattachMediaStream,window.getUserMedia=getUserMedia,AdapterJS.attachMediaStream=attachMediaStream,AdapterJS.reattachMediaStream=reattachMediaStream,AdapterJS.getUserMedia=getUserMedia,AdapterJS.forwardEventHandlers=function(destElem,srcElem,prototype){var properties=Object.getOwnPropertyNames(prototype);for(var prop in properties)if(prop){var propName=properties[prop];"function"==typeof propName.slice&&"on"===propName.slice(0,2)&&"function"==typeof srcElem[propName]&&AdapterJS.addEvent(destElem,propName.slice(2),srcElem[propName])}var subPrototype=Object.getPrototypeOf(prototype);subPrototype&&AdapterJS.forwardEventHandlers(destElem,srcElem,subPrototype)},RTCIceCandidate=function(candidate){return candidate.sdpMid||(candidate.sdpMid=""),AdapterJS.WebRTCPlugin.WaitForPluginReady(),AdapterJS.WebRTCPlugin.plugin.ConstructIceCandidate(candidate.sdpMid,candidate.sdpMLineIndex,candidate.candidate)},AdapterJS.addEvent(document,"readystatechange",AdapterJS.WebRTCPlugin.injectPlugin),AdapterJS.WebRTCPlugin.injectPlugin()}},AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb=AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb||function(){AdapterJS.addEvent(document,"readystatechange",AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv),AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv()},AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv=function(){if(!AdapterJS.options.hidePluginInstallPrompt){var downloadLink=AdapterJS.WebRTCPlugin.pluginInfo.downloadLink;if(downloadLink){var popupString;popupString=AdapterJS.WebRTCPlugin.pluginInfo.portalLink?'This website requires you to install the  <a href="'+AdapterJS.WebRTCPlugin.pluginInfo.portalLink+'" target="_blank">'+AdapterJS.WebRTCPlugin.pluginInfo.companyName+" WebRTC Plugin</a> to work on this browser.":AdapterJS.TEXT.PLUGIN.REQUIRE_INSTALLATION,AdapterJS.renderNotificationBar(popupString,AdapterJS.TEXT.PLUGIN.BUTTON,function(){window.open(downloadLink,"_top");var pluginInstallInterval=setInterval(function(){isIE||navigator.plugins.refresh(!1),AdapterJS.WebRTCPlugin.isPluginInstalled(AdapterJS.WebRTCPlugin.pluginInfo.prefix,AdapterJS.WebRTCPlugin.pluginInfo.plugName,AdapterJS.WebRTCPlugin.pluginInfo.type,function(){clearInterval(pluginInstallInterval),AdapterJS.WebRTCPlugin.defineWebRTCInterface()},function(){})},500)})}else AdapterJS.renderNotificationBar(AdapterJS.TEXT.PLUGIN.NOT_SUPPORTED)}},AdapterJS.WebRTCPlugin.isPluginInstalled(AdapterJS.WebRTCPlugin.pluginInfo.prefix,AdapterJS.WebRTCPlugin.pluginInfo.plugName,AdapterJS.WebRTCPlugin.pluginInfo.type,AdapterJS.WebRTCPlugin.defineWebRTCInterface,AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb)):(!function(f){if(true)module.exports=f();else if("function"==typeof define&&define.amd)define([],f);else{var g;g="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,g.adapter=f()}}(function(){return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof require&&require;if(!u&&a)return require(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(requirecopy,module,exports){"use strict";var SDPUtils={};SDPUtils.generateIdentifier=function(){return Math.random().toString(36).substr(2,10)},SDPUtils.localCName=SDPUtils.generateIdentifier(),SDPUtils.splitLines=function(blob){return blob.trim().split("\n").map(function(line){return line.trim()})},SDPUtils.splitSections=function(blob){var parts=blob.split("\nm=");return parts.map(function(part,index){return(index>0?"m="+part:part).trim()+"\r\n"})},SDPUtils.matchPrefix=function(blob,prefix){return SDPUtils.splitLines(blob).filter(function(line){return 0===line.indexOf(prefix)})},SDPUtils.parseCandidate=function(line){var parts;parts=0===line.indexOf("a=candidate:")?line.substring(12).split(" "):line.substring(10).split(" ");for(var candidate={foundation:parts[0],component:parts[1],protocol:parts[2].toLowerCase(),priority:parseInt(parts[3],10),ip:parts[4],port:parseInt(parts[5],10),type:parts[7]},i=8;i<parts.length;i+=2)switch(parts[i]){case"raddr":candidate.relatedAddress=parts[i+1];break;case"rport":candidate.relatedPort=parseInt(parts[i+1],10);break;case"tcptype":candidate.tcpType=parts[i+1]}return candidate},SDPUtils.writeCandidate=function(candidate){var sdp=[];sdp.push(candidate.foundation),sdp.push(candidate.component),sdp.push(candidate.protocol.toUpperCase()),sdp.push(candidate.priority),sdp.push(candidate.ip),sdp.push(candidate.port);var type=candidate.type;return sdp.push("typ"),sdp.push(type),"host"!==type&&candidate.relatedAddress&&candidate.relatedPort&&(sdp.push("raddr"),sdp.push(candidate.relatedAddress),sdp.push("rport"),sdp.push(candidate.relatedPort)),candidate.tcpType&&"tcp"===candidate.protocol.toLowerCase()&&(sdp.push("tcptype"),sdp.push(candidate.tcpType)),"candidate:"+sdp.join(" ")},SDPUtils.parseRtpMap=function(line){var parts=line.substr(9).split(" "),parsed={payloadType:parseInt(parts.shift(),10)};return parts=parts[0].split("/"),parsed.name=parts[0],parsed.clockRate=parseInt(parts[1],10),parsed.numChannels=3===parts.length?parseInt(parts[2],10):1,parsed},SDPUtils.writeRtpMap=function(codec){var pt=codec.payloadType;return void 0!==codec.preferredPayloadType&&(pt=codec.preferredPayloadType),"a=rtpmap:"+pt+" "+codec.name+"/"+codec.clockRate+(1!==codec.numChannels?"/"+codec.numChannels:"")+"\r\n"},SDPUtils.parseExtmap=function(line){var parts=line.substr(9).split(" ");return{id:parseInt(parts[0],10),uri:parts[1]}},SDPUtils.writeExtmap=function(headerExtension){return"a=extmap:"+(headerExtension.id||headerExtension.preferredId)+" "+headerExtension.uri+"\r\n"},SDPUtils.parseFmtp=function(line){for(var kv,parsed={},parts=line.substr(line.indexOf(" ")+1).split(";"),j=0;j<parts.length;j++)kv=parts[j].trim().split("="),parsed[kv[0].trim()]=kv[1];return parsed},SDPUtils.writeFmtp=function(codec){var line="",pt=codec.payloadType;if(void 0!==codec.preferredPayloadType&&(pt=codec.preferredPayloadType),codec.parameters&&Object.keys(codec.parameters).length){var params=[];Object.keys(codec.parameters).forEach(function(param){params.push(param+"="+codec.parameters[param])}),line+="a=fmtp:"+pt+" "+params.join(";")+"\r\n"}return line},SDPUtils.parseRtcpFb=function(line){var parts=line.substr(line.indexOf(" ")+1).split(" ");return{type:parts.shift(),parameter:parts.join(" ")}},SDPUtils.writeRtcpFb=function(codec){var lines="",pt=codec.payloadType;return void 0!==codec.preferredPayloadType&&(pt=codec.preferredPayloadType),codec.rtcpFeedback&&codec.rtcpFeedback.length&&codec.rtcpFeedback.forEach(function(fb){lines+="a=rtcp-fb:"+pt+" "+fb.type+(fb.parameter&&fb.parameter.length?" "+fb.parameter:"")+"\r\n"}),lines},SDPUtils.parseSsrcMedia=function(line){var sp=line.indexOf(" "),parts={ssrc:parseInt(line.substr(7,sp-7),10)},colon=line.indexOf(":",sp);return colon>-1?(parts.attribute=line.substr(sp+1,colon-sp-1),parts.value=line.substr(colon+1)):parts.attribute=line.substr(sp+1),parts},SDPUtils.getDtlsParameters=function(mediaSection,sessionpart){var lines=SDPUtils.splitLines(mediaSection);lines=lines.concat(SDPUtils.splitLines(sessionpart));var fpLine=lines.filter(function(line){return 0===line.indexOf("a=fingerprint:")})[0].substr(14),dtlsParameters={role:"auto",fingerprints:[{algorithm:fpLine.split(" ")[0],value:fpLine.split(" ")[1]}]};return dtlsParameters},SDPUtils.writeDtlsParameters=function(params,setupType){var sdp="a=setup:"+setupType+"\r\n";return params.fingerprints.forEach(function(fp){sdp+="a=fingerprint:"+fp.algorithm+" "+fp.value+"\r\n"}),sdp},SDPUtils.getIceParameters=function(mediaSection,sessionpart){var lines=SDPUtils.splitLines(mediaSection);lines=lines.concat(SDPUtils.splitLines(sessionpart));var iceParameters={usernameFragment:lines.filter(function(line){return 0===line.indexOf("a=ice-ufrag:")})[0].substr(12),password:lines.filter(function(line){return 0===line.indexOf("a=ice-pwd:")})[0].substr(10)};return iceParameters},SDPUtils.writeIceParameters=function(params){return"a=ice-ufrag:"+params.usernameFragment+"\r\na=ice-pwd:"+params.password+"\r\n"},SDPUtils.parseRtpParameters=function(mediaSection){for(var description={codecs:[],headerExtensions:[],fecMechanisms:[],rtcp:[]},lines=SDPUtils.splitLines(mediaSection),mline=lines[0].split(" "),i=3;i<mline.length;i++){var pt=mline[i],rtpmapline=SDPUtils.matchPrefix(mediaSection,"a=rtpmap:"+pt+" ")[0];if(rtpmapline){var codec=SDPUtils.parseRtpMap(rtpmapline),fmtps=SDPUtils.matchPrefix(mediaSection,"a=fmtp:"+pt+" ");switch(codec.parameters=fmtps.length?SDPUtils.parseFmtp(fmtps[0]):{},codec.rtcpFeedback=SDPUtils.matchPrefix(mediaSection,"a=rtcp-fb:"+pt+" ").map(SDPUtils.parseRtcpFb),description.codecs.push(codec),codec.name.toUpperCase()){case"RED":case"ULPFEC":description.fecMechanisms.push(codec.name.toUpperCase())}}}return SDPUtils.matchPrefix(mediaSection,"a=extmap:").forEach(function(line){description.headerExtensions.push(SDPUtils.parseExtmap(line))}),description},SDPUtils.writeRtpDescription=function(kind,caps){var sdp="";sdp+="m="+kind+" ",sdp+=caps.codecs.length>0?"9":"0",sdp+=" UDP/TLS/RTP/SAVPF ",sdp+=caps.codecs.map(function(codec){return void 0!==codec.preferredPayloadType?codec.preferredPayloadType:codec.payloadType}).join(" ")+"\r\n",sdp+="c=IN IP4 0.0.0.0\r\n",sdp+="a=rtcp:9 IN IP4 0.0.0.0\r\n",caps.codecs.forEach(function(codec){sdp+=SDPUtils.writeRtpMap(codec),sdp+=SDPUtils.writeFmtp(codec),sdp+=SDPUtils.writeRtcpFb(codec)});var maxptime=0;return caps.codecs.forEach(function(codec){
codec.maxptime>maxptime&&(maxptime=codec.maxptime)}),maxptime>0&&(sdp+="a=maxptime:"+maxptime+"\r\n"),sdp+="a=rtcp-mux\r\n",caps.headerExtensions.forEach(function(extension){sdp+=SDPUtils.writeExtmap(extension)}),sdp},SDPUtils.parseRtpEncodingParameters=function(mediaSection){var secondarySsrc,encodingParameters=[],description=SDPUtils.parseRtpParameters(mediaSection),hasRed=description.fecMechanisms.indexOf("RED")!==-1,hasUlpfec=description.fecMechanisms.indexOf("ULPFEC")!==-1,ssrcs=SDPUtils.matchPrefix(mediaSection,"a=ssrc:").map(function(line){return SDPUtils.parseSsrcMedia(line)}).filter(function(parts){return"cname"===parts.attribute}),primarySsrc=ssrcs.length>0&&ssrcs[0].ssrc,flows=SDPUtils.matchPrefix(mediaSection,"a=ssrc-group:FID").map(function(line){var parts=line.split(" ");return parts.shift(),parts.map(function(part){return parseInt(part,10)})});flows.length>0&&flows[0].length>1&&flows[0][0]===primarySsrc&&(secondarySsrc=flows[0][1]),description.codecs.forEach(function(codec){if("RTX"===codec.name.toUpperCase()&&codec.parameters.apt){var encParam={ssrc:primarySsrc,codecPayloadType:parseInt(codec.parameters.apt,10),rtx:{ssrc:secondarySsrc}};encodingParameters.push(encParam),hasRed&&(encParam=JSON.parse(JSON.stringify(encParam)),encParam.fec={ssrc:secondarySsrc,mechanism:hasUlpfec?"red+ulpfec":"red"},encodingParameters.push(encParam))}}),0===encodingParameters.length&&primarySsrc&&encodingParameters.push({ssrc:primarySsrc});var bandwidth=SDPUtils.matchPrefix(mediaSection,"b=");return bandwidth.length&&(0===bandwidth[0].indexOf("b=TIAS:")?bandwidth=parseInt(bandwidth[0].substr(7),10):0===bandwidth[0].indexOf("b=AS:")&&(bandwidth=parseInt(bandwidth[0].substr(5),10)),encodingParameters.forEach(function(params){params.maxBitrate=bandwidth})),encodingParameters},SDPUtils.writeSessionBoilerplate=function(){return"v=0\r\no=thisisadapterortc 8169639915646943137 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"},SDPUtils.writeMediaSection=function(transceiver,caps,type,stream){var sdp=SDPUtils.writeRtpDescription(transceiver.kind,caps);if(sdp+=SDPUtils.writeIceParameters(transceiver.iceGatherer.getLocalParameters()),sdp+=SDPUtils.writeDtlsParameters(transceiver.dtlsTransport.getLocalParameters(),"offer"===type?"actpass":"active"),sdp+="a=mid:"+transceiver.mid+"\r\n",sdp+=transceiver.rtpSender&&transceiver.rtpReceiver?"a=sendrecv\r\n":transceiver.rtpSender?"a=sendonly\r\n":transceiver.rtpReceiver?"a=recvonly\r\n":"a=inactive\r\n",transceiver.rtpSender){var msid="msid:"+stream.id+" "+transceiver.rtpSender.track.id+"\r\n";sdp+="a="+msid,sdp+="a=ssrc:"+transceiver.sendEncodingParameters[0].ssrc+" "+msid,transceiver.sendEncodingParameters[0].rtx&&(sdp+="a=ssrc:"+transceiver.sendEncodingParameters[0].rtx.ssrc+" "+msid,sdp+="a=ssrc-group:FID "+transceiver.sendEncodingParameters[0].ssrc+" "+transceiver.sendEncodingParameters[0].rtx.ssrc+"\r\n")}return sdp+="a=ssrc:"+transceiver.sendEncodingParameters[0].ssrc+" cname:"+SDPUtils.localCName+"\r\n",transceiver.rtpSender&&transceiver.sendEncodingParameters[0].rtx&&(sdp+="a=ssrc:"+transceiver.sendEncodingParameters[0].rtx.ssrc+" cname:"+SDPUtils.localCName+"\r\n"),sdp},SDPUtils.getDirection=function(mediaSection,sessionpart){for(var lines=SDPUtils.splitLines(mediaSection),i=0;i<lines.length;i++)switch(lines[i]){case"a=sendrecv":case"a=sendonly":case"a=recvonly":case"a=inactive":return lines[i].substr(2)}return sessionpart?SDPUtils.getDirection(sessionpart):"sendrecv"},module.exports=SDPUtils},{}],2:[function(requirecopy,module,exports){"use strict";!function(){var logging=requirecopy("./utils").log,browserDetails=requirecopy("./utils").browserDetails;module.exports.browserDetails=browserDetails,module.exports.extractVersion=requirecopy("./utils").extractVersion,module.exports.disableLog=requirecopy("./utils").disableLog;var chromeShim=requirecopy("./chrome/chrome_shim")||null,edgeShim=requirecopy("./edge/edge_shim")||null,firefoxShim=requirecopy("./firefox/firefox_shim")||null,safariShim=requirecopy("./safari/safari_shim")||null;switch(browserDetails.browser){case"opera":case"chrome":if(!chromeShim||!chromeShim.shimPeerConnection)return void logging("Chrome shim is not included in this adapter release.");logging("adapter.js shimming chrome."),module.exports.browserShim=chromeShim,chromeShim.shimGetUserMedia(),chromeShim.shimMediaStream(),chromeShim.shimSourceObject(),chromeShim.shimPeerConnection(),chromeShim.shimOnTrack();break;case"firefox":if(!firefoxShim||!firefoxShim.shimPeerConnection)return void logging("Firefox shim is not included in this adapter release.");logging("adapter.js shimming firefox."),module.exports.browserShim=firefoxShim,firefoxShim.shimGetUserMedia(),firefoxShim.shimSourceObject(),firefoxShim.shimPeerConnection(),firefoxShim.shimOnTrack();break;case"edge":if(!edgeShim||!edgeShim.shimPeerConnection)return void logging("MS edge shim is not included in this adapter release.");logging("adapter.js shimming edge."),module.exports.browserShim=edgeShim,edgeShim.shimGetUserMedia(),edgeShim.shimPeerConnection();break;case"safari":if(!safariShim)return void logging("Safari shim is not included in this adapter release.");logging("adapter.js shimming safari."),module.exports.browserShim=safariShim,safariShim.shimGetUserMedia();break;default:logging("Unsupported browser!")}}()},{"./chrome/chrome_shim":3,"./edge/edge_shim":5,"./firefox/firefox_shim":7,"./safari/safari_shim":9,"./utils":10}],3:[function(requirecopy,module,exports){"use strict";var logging=requirecopy("../utils.js").log,browserDetails=requirecopy("../utils.js").browserDetails,chromeShim={shimMediaStream:function(){window.MediaStream=window.MediaStream||window.webkitMediaStream},shimOnTrack:function(){"object"!=typeof window||!window.RTCPeerConnection||"ontrack"in window.RTCPeerConnection.prototype||Object.defineProperty(window.RTCPeerConnection.prototype,"ontrack",{get:function(){return this._ontrack},set:function(f){var self=this;this._ontrack&&(this.removeEventListener("track",this._ontrack),this.removeEventListener("addstream",this._ontrackpoly)),this.addEventListener("track",this._ontrack=f),this.addEventListener("addstream",this._ontrackpoly=function(e){e.stream.addEventListener("addtrack",function(te){var event=new Event("track");event.track=te.track,event.receiver={track:te.track},event.streams=[e.stream],self.dispatchEvent(event)}),e.stream.getTracks().forEach(function(track){var event=new Event("track");event.track=track,event.receiver={track:track},event.streams=[e.stream],this.dispatchEvent(event)}.bind(this))}.bind(this))}})},shimSourceObject:function(){"object"==typeof window&&(!window.HTMLMediaElement||"srcObject"in window.HTMLMediaElement.prototype||Object.defineProperty(window.HTMLMediaElement.prototype,"srcObject",{get:function(){return this._srcObject},set:function(stream){var self=this;return this._srcObject=stream,this.src&&URL.revokeObjectURL(this.src),stream?(this.src=URL.createObjectURL(stream),stream.addEventListener("addtrack",function(){self.src&&URL.revokeObjectURL(self.src),self.src=URL.createObjectURL(stream)}),void stream.addEventListener("removetrack",function(){self.src&&URL.revokeObjectURL(self.src),self.src=URL.createObjectURL(stream)})):void(this.src="")}}))},shimPeerConnection:function(){window.RTCPeerConnection=function(pcConfig,pcConstraints){logging("PeerConnection"),pcConfig&&pcConfig.iceTransportPolicy&&(pcConfig.iceTransports=pcConfig.iceTransportPolicy);var pc=new webkitRTCPeerConnection(pcConfig,pcConstraints),origGetStats=pc.getStats.bind(pc);return pc.getStats=function(selector,successCallback,errorCallback){var self=this,args=arguments;if(arguments.length>0&&"function"==typeof selector)return origGetStats(selector,successCallback);var fixChromeStats_=function(response){var standardReport={},reports=response.result();return reports.forEach(function(report){var standardStats={id:report.id,timestamp:report.timestamp,type:report.type};report.names().forEach(function(name){standardStats[name]=report.stat(name)}),standardReport[standardStats.id]=standardStats}),standardReport},makeMapStats=function(stats,legacyStats){var map=new Map(Object.keys(stats).map(function(key){return[key,stats[key]]}));return legacyStats=legacyStats||stats,Object.keys(legacyStats).forEach(function(key){map[key]=legacyStats[key]}),map};if(arguments.length>=2){var successCallbackWrapper_=function(response){args[1](makeMapStats(fixChromeStats_(response)))};return origGetStats.apply(this,[successCallbackWrapper_,arguments[0]])}return new Promise(function(resolve,reject){1===args.length&&"object"==typeof selector?origGetStats.apply(self,[function(response){resolve(makeMapStats(fixChromeStats_(response)))},reject]):origGetStats.apply(self,[function(response){resolve(makeMapStats(fixChromeStats_(response),response.result()))},reject])}).then(successCallback,errorCallback)},pc},window.RTCPeerConnection.prototype=webkitRTCPeerConnection.prototype,webkitRTCPeerConnection.generateCertificate&&Object.defineProperty(window.RTCPeerConnection,"generateCertificate",{get:function(){return webkitRTCPeerConnection.generateCertificate}}),["createOffer","createAnswer"].forEach(function(method){var nativeMethod=webkitRTCPeerConnection.prototype[method];webkitRTCPeerConnection.prototype[method]=function(){var self=this;if(arguments.length<1||1===arguments.length&&"object"==typeof arguments[0]){var opts=1===arguments.length?arguments[0]:void 0;return new Promise(function(resolve,reject){nativeMethod.apply(self,[resolve,reject,opts])})}return nativeMethod.apply(this,arguments)}}),browserDetails.version<51&&["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(method){var nativeMethod=webkitRTCPeerConnection.prototype[method];webkitRTCPeerConnection.prototype[method]=function(){var args=arguments,self=this,promise=new Promise(function(resolve,reject){nativeMethod.apply(self,[args[0],resolve,reject])});return args.length<2?promise:promise.then(function(){args[1].apply(null,[])},function(err){args.length>=3&&args[2].apply(null,[err])})}}),["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(method){var nativeMethod=webkitRTCPeerConnection.prototype[method];webkitRTCPeerConnection.prototype[method]=function(){return arguments[0]=new("addIceCandidate"===method?RTCIceCandidate:RTCSessionDescription)(arguments[0]),nativeMethod.apply(this,arguments)}});var nativeAddIceCandidate=RTCPeerConnection.prototype.addIceCandidate;RTCPeerConnection.prototype.addIceCandidate=function(){return null===arguments[0]?Promise.resolve():nativeAddIceCandidate.apply(this,arguments)}}};module.exports={shimMediaStream:chromeShim.shimMediaStream,shimOnTrack:chromeShim.shimOnTrack,shimSourceObject:chromeShim.shimSourceObject,shimPeerConnection:chromeShim.shimPeerConnection,shimGetUserMedia:requirecopy("./getusermedia")}},{"../utils.js":10,"./getusermedia":4}],4:[function(requirecopy,module,exports){"use strict";var logging=requirecopy("../utils.js").log;module.exports=function(){var constraintsToChrome_=function(c){if("object"!=typeof c||c.mandatory||c.optional)return c;var cc={};return Object.keys(c).forEach(function(key){if("require"!==key&&"advanced"!==key&&"mediaSource"!==key){var r="object"==typeof c[key]?c[key]:{ideal:c[key]};void 0!==r.exact&&"number"==typeof r.exact&&(r.min=r.max=r.exact);var oldname_=function(prefix,name){return prefix?prefix+name.charAt(0).toUpperCase()+name.slice(1):"deviceId"===name?"sourceId":name};if(void 0!==r.ideal){cc.optional=cc.optional||[];var oc={};"number"==typeof r.ideal?(oc[oldname_("min",key)]=r.ideal,cc.optional.push(oc),oc={},oc[oldname_("max",key)]=r.ideal,cc.optional.push(oc)):(oc[oldname_("",key)]=r.ideal,cc.optional.push(oc))}void 0!==r.exact&&"number"!=typeof r.exact?(cc.mandatory=cc.mandatory||{},cc.mandatory[oldname_("",key)]=r.exact):["min","max"].forEach(function(mix){void 0!==r[mix]&&(cc.mandatory=cc.mandatory||{},cc.mandatory[oldname_(mix,key)]=r[mix])})}}),c.advanced&&(cc.optional=(cc.optional||[]).concat(c.advanced)),cc},shimConstraints_=function(constraints,func){if(constraints=JSON.parse(JSON.stringify(constraints)),constraints&&constraints.audio&&(constraints.audio=constraintsToChrome_(constraints.audio)),constraints&&"object"==typeof constraints.video){var face=constraints.video.facingMode;if(face=face&&("object"==typeof face?face:{ideal:face}),face&&("user"===face.exact||"environment"===face.exact||"user"===face.ideal||"environment"===face.ideal)&&(!navigator.mediaDevices.getSupportedConstraints||!navigator.mediaDevices.getSupportedConstraints().facingMode)&&(delete constraints.video.facingMode,"environment"===face.exact||"environment"===face.ideal))return navigator.mediaDevices.enumerateDevices().then(function(devices){devices=devices.filter(function(d){return"videoinput"===d.kind});var back=devices.find(function(d){return d.label.toLowerCase().indexOf("back")!==-1})||devices.length&&devices[devices.length-1];return back&&(constraints.video.deviceId=face.exact?{exact:back.deviceId}:{ideal:back.deviceId}),constraints.video=constraintsToChrome_(constraints.video),logging("chrome: "+JSON.stringify(constraints)),func(constraints)});constraints.video=constraintsToChrome_(constraints.video)}return logging("chrome: "+JSON.stringify(constraints)),func(constraints)},shimError_=function(e){return{name:{PermissionDeniedError:"NotAllowedError",ConstraintNotSatisfiedError:"OverconstrainedError"}[e.name]||e.name,message:e.message,constraint:e.constraintName,toString:function(){return this.name+(this.message&&": ")+this.message}}},getUserMedia_=function(constraints,onSuccess,onError){shimConstraints_(constraints,function(c){navigator.webkitGetUserMedia(c,onSuccess,function(e){onError(shimError_(e))})})};navigator.getUserMedia=getUserMedia_;var getUserMediaPromise_=function(constraints){return new Promise(function(resolve,reject){navigator.getUserMedia(constraints,resolve,reject)})};if(navigator.mediaDevices||(navigator.mediaDevices={getUserMedia:getUserMediaPromise_,enumerateDevices:function(){return new Promise(function(resolve){var kinds={audio:"audioinput",video:"videoinput"};return MediaStreamTrack.getSources(function(devices){resolve(devices.map(function(device){return{label:device.label,kind:kinds[device.kind],deviceId:device.id,groupId:""}}))})})}}),navigator.mediaDevices.getUserMedia){var origGetUserMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=function(cs){return shimConstraints_(cs,function(c){return origGetUserMedia(c).catch(function(e){return Promise.reject(shimError_(e))})})}}else navigator.mediaDevices.getUserMedia=function(constraints){return getUserMediaPromise_(constraints)};"undefined"==typeof navigator.mediaDevices.addEventListener&&(navigator.mediaDevices.addEventListener=function(){logging("Dummy mediaDevices.addEventListener called.")}),"undefined"==typeof navigator.mediaDevices.removeEventListener&&(navigator.mediaDevices.removeEventListener=function(){logging("Dummy mediaDevices.removeEventListener called.")})}},{"../utils.js":10}],5:[function(requirecopy,module,exports){"use strict";var SDPUtils=requirecopy("sdp"),browserDetails=requirecopy("../utils").browserDetails,edgeShim={shimPeerConnection:function(){window.RTCIceGatherer&&(window.RTCIceCandidate||(window.RTCIceCandidate=function(args){return args}),window.RTCSessionDescription||(window.RTCSessionDescription=function(args){return args})),window.RTCPeerConnection=function(config){var self=this,_eventTarget=document.createDocumentFragment();if(["addEventListener","removeEventListener","dispatchEvent"].forEach(function(method){self[method]=_eventTarget[method].bind(_eventTarget)}),this.onicecandidate=null,this.onaddstream=null,this.ontrack=null,this.onremovestream=null,this.onsignalingstatechange=null,this.oniceconnectionstatechange=null,this.onnegotiationneeded=null,this.ondatachannel=null,this.localStreams=[],this.remoteStreams=[],this.getLocalStreams=function(){return self.localStreams},this.getRemoteStreams=function(){return self.remoteStreams},this.localDescription=new RTCSessionDescription({type:"",sdp:""}),this.remoteDescription=new RTCSessionDescription({type:"",sdp:""}),this.signalingState="stable",this.iceConnectionState="new",this.iceGatheringState="new",this.iceOptions={gatherPolicy:"all",iceServers:[]},config&&config.iceTransportPolicy)switch(config.iceTransportPolicy){case"all":case"relay":this.iceOptions.gatherPolicy=config.iceTransportPolicy;break;case"none":throw new TypeError('iceTransportPolicy "none" not supported')}if(this.usingBundle=config&&"max-bundle"===config.bundlePolicy,config&&config.iceServers){var iceServers=JSON.parse(JSON.stringify(config.iceServers));this.iceOptions.iceServers=iceServers.filter(function(server){if(server&&server.urls){var urls=server.urls;return"string"==typeof urls&&(urls=[urls]),urls=urls.filter(function(url){return 0===url.indexOf("turn:")&&url.indexOf("transport=udp")!==-1&&url.indexOf("turn:[")===-1||0===url.indexOf("stun:")&&browserDetails.version>=14393})[0],!!urls}return!1})}this.transceivers=[],this._localIceCandidatesBuffer=[]},window.RTCPeerConnection.prototype._emitBufferedCandidates=function(){var self=this,sections=SDPUtils.splitSections(self.localDescription.sdp);this._localIceCandidatesBuffer.forEach(function(event){var end=!event.candidate||0===Object.keys(event.candidate).length;if(end)for(var j=1;j<sections.length;j++)sections[j].indexOf("\r\na=end-of-candidates\r\n")===-1&&(sections[j]+="a=end-of-candidates\r\n");else event.candidate.candidate.indexOf("typ endOfCandidates")===-1&&(sections[event.candidate.sdpMLineIndex+1]+="a="+event.candidate.candidate+"\r\n");if(self.localDescription.sdp=sections.join(""),self.dispatchEvent(event),null!==self.onicecandidate&&self.onicecandidate(event),!event.candidate&&"complete"!==self.iceGatheringState){var complete=self.transceivers.every(function(transceiver){return transceiver.iceGatherer&&"completed"===transceiver.iceGatherer.state});complete&&(self.iceGatheringState="complete")}}),this._localIceCandidatesBuffer=[]},window.RTCPeerConnection.prototype.addStream=function(stream){this.localStreams.push(stream.clone()),this._maybeFireNegotiationNeeded()},window.RTCPeerConnection.prototype.removeStream=function(stream){var idx=this.localStreams.indexOf(stream);idx>-1&&(this.localStreams.splice(idx,1),this._maybeFireNegotiationNeeded())},window.RTCPeerConnection.prototype.getSenders=function(){return this.transceivers.filter(function(transceiver){return!!transceiver.rtpSender}).map(function(transceiver){return transceiver.rtpSender})},window.RTCPeerConnection.prototype.getReceivers=function(){return this.transceivers.filter(function(transceiver){return!!transceiver.rtpReceiver}).map(function(transceiver){return transceiver.rtpReceiver})},window.RTCPeerConnection.prototype._getCommonCapabilities=function(localCapabilities,remoteCapabilities){var commonCapabilities={codecs:[],headerExtensions:[],fecMechanisms:[]};return localCapabilities.codecs.forEach(function(lCodec){for(var i=0;i<remoteCapabilities.codecs.length;i++){var rCodec=remoteCapabilities.codecs[i];if(lCodec.name.toLowerCase()===rCodec.name.toLowerCase()&&lCodec.clockRate===rCodec.clockRate&&lCodec.numChannels===rCodec.numChannels){commonCapabilities.codecs.push(rCodec),rCodec.rtcpFeedback=rCodec.rtcpFeedback.filter(function(fb){for(var j=0;j<lCodec.rtcpFeedback.length;j++)if(lCodec.rtcpFeedback[j].type===fb.type&&lCodec.rtcpFeedback[j].parameter===fb.parameter)return!0;return!1});break}}}),localCapabilities.headerExtensions.forEach(function(lHeaderExtension){for(var i=0;i<remoteCapabilities.headerExtensions.length;i++){var rHeaderExtension=remoteCapabilities.headerExtensions[i];if(lHeaderExtension.uri===rHeaderExtension.uri){commonCapabilities.headerExtensions.push(rHeaderExtension);break}}}),commonCapabilities},window.RTCPeerConnection.prototype._createIceAndDtlsTransports=function(mid,sdpMLineIndex){var self=this,iceGatherer=new RTCIceGatherer(self.iceOptions),iceTransport=new RTCIceTransport(iceGatherer);iceGatherer.onlocalcandidate=function(evt){var event=new Event("icecandidate");event.candidate={sdpMid:mid,sdpMLineIndex:sdpMLineIndex};var cand=evt.candidate,end=!cand||0===Object.keys(cand).length;end?(void 0===iceGatherer.state&&(iceGatherer.state="completed"),event.candidate.candidate="candidate:1 1 udp 1 0.0.0.0 9 typ endOfCandidates"):(cand.component="RTCP"===iceTransport.component?2:1,event.candidate.candidate=SDPUtils.writeCandidate(cand));var sections=SDPUtils.splitSections(self.localDescription.sdp);event.candidate.candidate.indexOf("typ endOfCandidates")===-1?sections[event.candidate.sdpMLineIndex+1]+="a="+event.candidate.candidate+"\r\n":sections[event.candidate.sdpMLineIndex+1]+="a=end-of-candidates\r\n",self.localDescription.sdp=sections.join("");var complete=self.transceivers.every(function(transceiver){return transceiver.iceGatherer&&"completed"===transceiver.iceGatherer.state});switch(self.iceGatheringState){case"new":self._localIceCandidatesBuffer.push(event),end&&complete&&self._localIceCandidatesBuffer.push(new Event("icecandidate"));break;case"gathering":self._emitBufferedCandidates(),self.dispatchEvent(event),null!==self.onicecandidate&&self.onicecandidate(event),complete&&(self.dispatchEvent(new Event("icecandidate")),null!==self.onicecandidate&&self.onicecandidate(new Event("icecandidate")),self.iceGatheringState="complete");break;case"complete":}},iceTransport.onicestatechange=function(){self._updateConnectionState()};var dtlsTransport=new RTCDtlsTransport(iceTransport);return dtlsTransport.ondtlsstatechange=function(){self._updateConnectionState()},dtlsTransport.onerror=function(){dtlsTransport.state="failed",self._updateConnectionState()},{iceGatherer:iceGatherer,iceTransport:iceTransport,dtlsTransport:dtlsTransport}},window.RTCPeerConnection.prototype._transceive=function(transceiver,send,recv){var params=this._getCommonCapabilities(transceiver.localCapabilities,transceiver.remoteCapabilities);send&&transceiver.rtpSender&&(params.encodings=transceiver.sendEncodingParameters,params.rtcp={cname:SDPUtils.localCName},transceiver.recvEncodingParameters.length&&(params.rtcp.ssrc=transceiver.recvEncodingParameters[0].ssrc),transceiver.rtpSender.send(params)),recv&&transceiver.rtpReceiver&&(params.encodings=transceiver.recvEncodingParameters,params.rtcp={cname:transceiver.cname},transceiver.sendEncodingParameters.length&&(params.rtcp.ssrc=transceiver.sendEncodingParameters[0].ssrc),transceiver.rtpReceiver.receive(params))},window.RTCPeerConnection.prototype.setLocalDescription=function(description){var sections,sessionpart,self=this;if("offer"===description.type)this._pendingOffer&&(sections=SDPUtils.splitSections(description.sdp),sessionpart=sections.shift(),sections.forEach(function(mediaSection,sdpMLineIndex){var caps=SDPUtils.parseRtpParameters(mediaSection);self._pendingOffer[sdpMLineIndex].localCapabilities=caps}),this.transceivers=this._pendingOffer,delete this._pendingOffer);else if("answer"===description.type){sections=SDPUtils.splitSections(self.remoteDescription.sdp),sessionpart=sections.shift();var isIceLite=SDPUtils.matchPrefix(sessionpart,"a=ice-lite").length>0;sections.forEach(function(mediaSection,sdpMLineIndex){var transceiver=self.transceivers[sdpMLineIndex],iceGatherer=transceiver.iceGatherer,iceTransport=transceiver.iceTransport,dtlsTransport=transceiver.dtlsTransport,localCapabilities=transceiver.localCapabilities,remoteCapabilities=transceiver.remoteCapabilities,rejected="0"===mediaSection.split("\n",1)[0].split(" ",2)[1];if(!rejected&&!transceiver.isDatachannel){var remoteIceParameters=SDPUtils.getIceParameters(mediaSection,sessionpart);if(isIceLite){var cands=SDPUtils.matchPrefix(mediaSection,"a=candidate:").map(function(cand){return SDPUtils.parseCandidate(cand)}).filter(function(cand){return"1"===cand.component});cands.length&&iceTransport.setRemoteCandidates(cands)}var remoteDtlsParameters=SDPUtils.getDtlsParameters(mediaSection,sessionpart);isIceLite&&(remoteDtlsParameters.role="server"),self.usingBundle&&0!==sdpMLineIndex||(iceTransport.start(iceGatherer,remoteIceParameters,isIceLite?"controlling":"controlled"),dtlsTransport.start(remoteDtlsParameters));var params=self._getCommonCapabilities(localCapabilities,remoteCapabilities);self._transceive(transceiver,params.codecs.length>0,!1)}})}switch(this.localDescription={type:description.type,sdp:description.sdp},description.type){case"offer":this._updateSignalingState("have-local-offer");break;case"answer":this._updateSignalingState("stable");break;default:throw new TypeError('unsupported type "'+description.type+'"')}var hasCallback=arguments.length>1&&"function"==typeof arguments[1];if(hasCallback){var cb=arguments[1];window.setTimeout(function(){cb(),"new"===self.iceGatheringState&&(self.iceGatheringState="gathering"),self._emitBufferedCandidates()},0)}var p=Promise.resolve();return p.then(function(){hasCallback||("new"===self.iceGatheringState&&(self.iceGatheringState="gathering"),window.setTimeout(self._emitBufferedCandidates.bind(self),500))}),p},window.RTCPeerConnection.prototype.setRemoteDescription=function(description){var self=this,stream=new MediaStream,receiverList=[],sections=SDPUtils.splitSections(description.sdp),sessionpart=sections.shift(),isIceLite=SDPUtils.matchPrefix(sessionpart,"a=ice-lite").length>0;switch(this.usingBundle=SDPUtils.matchPrefix(sessionpart,"a=group:BUNDLE ").length>0,sections.forEach(function(mediaSection,sdpMLineIndex){var lines=SDPUtils.splitLines(mediaSection),mline=lines[0].substr(2).split(" "),kind=mline[0],rejected="0"===mline[1],direction=SDPUtils.getDirection(mediaSection,sessionpart),mid=SDPUtils.matchPrefix(mediaSection,"a=mid:");if(mid=mid.length?mid[0].substr(6):SDPUtils.generateIdentifier(),"application"===kind&&"DTLS/SCTP"===mline[2])return void(self.transceivers[sdpMLineIndex]={mid:mid,isDatachannel:!0});var transceiver,iceGatherer,iceTransport,dtlsTransport,rtpSender,rtpReceiver,sendEncodingParameters,recvEncodingParameters,localCapabilities,track,remoteIceParameters,remoteDtlsParameters,remoteCapabilities=SDPUtils.parseRtpParameters(mediaSection);rejected||(remoteIceParameters=SDPUtils.getIceParameters(mediaSection,sessionpart),remoteDtlsParameters=SDPUtils.getDtlsParameters(mediaSection,sessionpart),remoteDtlsParameters.role="client"),recvEncodingParameters=SDPUtils.parseRtpEncodingParameters(mediaSection);var cname,remoteSsrc=SDPUtils.matchPrefix(mediaSection,"a=ssrc:").map(function(line){return SDPUtils.parseSsrcMedia(line)}).filter(function(obj){return"cname"===obj.attribute})[0];remoteSsrc&&(cname=remoteSsrc.value);var isComplete=SDPUtils.matchPrefix(mediaSection,"a=end-of-candidates",sessionpart).length>0,cands=SDPUtils.matchPrefix(mediaSection,"a=candidate:").map(function(cand){return SDPUtils.parseCandidate(cand)}).filter(function(cand){return"1"===cand.component});if("offer"!==description.type||rejected)"answer"!==description.type||rejected||(transceiver=self.transceivers[sdpMLineIndex],iceGatherer=transceiver.iceGatherer,iceTransport=transceiver.iceTransport,dtlsTransport=transceiver.dtlsTransport,rtpSender=transceiver.rtpSender,rtpReceiver=transceiver.rtpReceiver,sendEncodingParameters=transceiver.sendEncodingParameters,localCapabilities=transceiver.localCapabilities,self.transceivers[sdpMLineIndex].recvEncodingParameters=recvEncodingParameters,self.transceivers[sdpMLineIndex].remoteCapabilities=remoteCapabilities,self.transceivers[sdpMLineIndex].cname=cname,(isIceLite||isComplete)&&cands.length&&iceTransport.setRemoteCandidates(cands),self.usingBundle&&0!==sdpMLineIndex||(iceTransport.start(iceGatherer,remoteIceParameters,"controlling"),dtlsTransport.start(remoteDtlsParameters)),self._transceive(transceiver,"sendrecv"===direction||"recvonly"===direction,"sendrecv"===direction||"sendonly"===direction),!rtpReceiver||"sendrecv"!==direction&&"sendonly"!==direction?delete transceiver.rtpReceiver:(track=rtpReceiver.track,receiverList.push([track,rtpReceiver]),stream.addTrack(track)));else{var transports=self.usingBundle&&sdpMLineIndex>0?{iceGatherer:self.transceivers[0].iceGatherer,iceTransport:self.transceivers[0].iceTransport,dtlsTransport:self.transceivers[0].dtlsTransport}:self._createIceAndDtlsTransports(mid,sdpMLineIndex);if(isComplete&&transports.iceTransport.setRemoteCandidates(cands),localCapabilities=RTCRtpReceiver.getCapabilities(kind),sendEncodingParameters=[{ssrc:1001*(2*sdpMLineIndex+2)}],rtpReceiver=new RTCRtpReceiver(transports.dtlsTransport,kind),track=rtpReceiver.track,receiverList.push([track,rtpReceiver]),stream.addTrack(track),self.localStreams.length>0&&self.localStreams[0].getTracks().length>=sdpMLineIndex){var localTrack;"audio"===kind?localTrack=self.localStreams[0].getAudioTracks()[0]:"video"===kind&&(localTrack=self.localStreams[0].getVideoTracks()[0]),localTrack&&(rtpSender=new RTCRtpSender(localTrack,transports.dtlsTransport))}self.transceivers[sdpMLineIndex]={iceGatherer:transports.iceGatherer,iceTransport:transports.iceTransport,dtlsTransport:transports.dtlsTransport,localCapabilities:localCapabilities,remoteCapabilities:remoteCapabilities,rtpSender:rtpSender,rtpReceiver:rtpReceiver,kind:kind,mid:mid,cname:cname,sendEncodingParameters:sendEncodingParameters,recvEncodingParameters:recvEncodingParameters},self._transceive(self.transceivers[sdpMLineIndex],!1,"sendrecv"===direction||"sendonly"===direction)}}),this.remoteDescription={type:description.type,sdp:description.sdp},description.type){case"offer":this._updateSignalingState("have-remote-offer");break;case"answer":this._updateSignalingState("stable");break;default:throw new TypeError('unsupported type "'+description.type+'"')}return stream.getTracks().length&&(self.remoteStreams.push(stream),window.setTimeout(function(){var event=new Event("addstream");event.stream=stream,self.dispatchEvent(event),null!==self.onaddstream&&window.setTimeout(function(){self.onaddstream(event)},0),receiverList.forEach(function(item){var track=item[0],receiver=item[1],trackEvent=new Event("track");trackEvent.track=track,trackEvent.receiver=receiver,trackEvent.streams=[stream],self.dispatchEvent(event),null!==self.ontrack&&window.setTimeout(function(){self.ontrack(trackEvent)},0)})},0)),arguments.length>1&&"function"==typeof arguments[1]&&window.setTimeout(arguments[1],0),Promise.resolve()},window.RTCPeerConnection.prototype.close=function(){this.transceivers.forEach(function(transceiver){transceiver.iceTransport&&transceiver.iceTransport.stop(),transceiver.dtlsTransport&&transceiver.dtlsTransport.stop(),transceiver.rtpSender&&transceiver.rtpSender.stop(),transceiver.rtpReceiver&&transceiver.rtpReceiver.stop()}),this._updateSignalingState("closed")},window.RTCPeerConnection.prototype._updateSignalingState=function(newState){this.signalingState=newState;var event=new Event("signalingstatechange");this.dispatchEvent(event),null!==this.onsignalingstatechange&&this.onsignalingstatechange(event)},window.RTCPeerConnection.prototype._maybeFireNegotiationNeeded=function(){var event=new Event("negotiationneeded");this.dispatchEvent(event),null!==this.onnegotiationneeded&&this.onnegotiationneeded(event)},window.RTCPeerConnection.prototype._updateConnectionState=function(){var newState,self=this,states={new:0,closed:0,connecting:0,checking:0,connected:0,completed:0,failed:0};if(this.transceivers.forEach(function(transceiver){states[transceiver.iceTransport.state]++,states[transceiver.dtlsTransport.state]++}),states.connected+=states.completed,newState="new",states.failed>0?newState="failed":states.connecting>0||states.checking>0?newState="connecting":states.disconnected>0?newState="disconnected":states.new>0?newState="new":(states.connected>0||states.completed>0)&&(newState="connected"),newState!==self.iceConnectionState){self.iceConnectionState=newState;var event=new Event("iceconnectionstatechange");this.dispatchEvent(event),null!==this.oniceconnectionstatechange&&this.oniceconnectionstatechange(event);
}},window.RTCPeerConnection.prototype.createOffer=function(){var self=this;if(this._pendingOffer)throw new Error("createOffer called while there is a pending offer.");var offerOptions;1===arguments.length&&"function"!=typeof arguments[0]?offerOptions=arguments[0]:3===arguments.length&&(offerOptions=arguments[2]);var tracks=[],numAudioTracks=0,numVideoTracks=0;if(this.localStreams.length&&(numAudioTracks=this.localStreams[0].getAudioTracks().length,numVideoTracks=this.localStreams[0].getVideoTracks().length),offerOptions){if(offerOptions.mandatory||offerOptions.optional)throw new TypeError("Legacy mandatory/optional constraints not supported.");void 0!==offerOptions.offerToReceiveAudio&&(numAudioTracks=offerOptions.offerToReceiveAudio),void 0!==offerOptions.offerToReceiveVideo&&(numVideoTracks=offerOptions.offerToReceiveVideo)}for(this.localStreams.length&&this.localStreams[0].getTracks().forEach(function(track){tracks.push({kind:track.kind,track:track,wantReceive:"audio"===track.kind?numAudioTracks>0:numVideoTracks>0}),"audio"===track.kind?numAudioTracks--:"video"===track.kind&&numVideoTracks--});numAudioTracks>0||numVideoTracks>0;)numAudioTracks>0&&(tracks.push({kind:"audio",wantReceive:!0}),numAudioTracks--),numVideoTracks>0&&(tracks.push({kind:"video",wantReceive:!0}),numVideoTracks--);var sdp=SDPUtils.writeSessionBoilerplate(),transceivers=[];tracks.forEach(function(mline,sdpMLineIndex){var rtpSender,rtpReceiver,track=mline.track,kind=mline.kind,mid=SDPUtils.generateIdentifier(),transports=self.usingBundle&&sdpMLineIndex>0?{iceGatherer:transceivers[0].iceGatherer,iceTransport:transceivers[0].iceTransport,dtlsTransport:transceivers[0].dtlsTransport}:self._createIceAndDtlsTransports(mid,sdpMLineIndex),localCapabilities=RTCRtpSender.getCapabilities(kind),sendEncodingParameters=[{ssrc:1001*(2*sdpMLineIndex+1)}];track&&(rtpSender=new RTCRtpSender(track,transports.dtlsTransport)),mline.wantReceive&&(rtpReceiver=new RTCRtpReceiver(transports.dtlsTransport,kind)),transceivers[sdpMLineIndex]={iceGatherer:transports.iceGatherer,iceTransport:transports.iceTransport,dtlsTransport:transports.dtlsTransport,localCapabilities:localCapabilities,remoteCapabilities:null,rtpSender:rtpSender,rtpReceiver:rtpReceiver,kind:kind,mid:mid,sendEncodingParameters:sendEncodingParameters,recvEncodingParameters:null}}),this.usingBundle&&(sdp+="a=group:BUNDLE "+transceivers.map(function(t){return t.mid}).join(" ")+"\r\n"),tracks.forEach(function(mline,sdpMLineIndex){var transceiver=transceivers[sdpMLineIndex];sdp+=SDPUtils.writeMediaSection(transceiver,transceiver.localCapabilities,"offer",self.localStreams[0])}),this._pendingOffer=transceivers;var desc=new RTCSessionDescription({type:"offer",sdp:sdp});return arguments.length&&"function"==typeof arguments[0]&&window.setTimeout(arguments[0],0,desc),Promise.resolve(desc)},window.RTCPeerConnection.prototype.createAnswer=function(){var self=this,sdp=SDPUtils.writeSessionBoilerplate();this.usingBundle&&(sdp+="a=group:BUNDLE "+this.transceivers.map(function(t){return t.mid}).join(" ")+"\r\n"),this.transceivers.forEach(function(transceiver){if(transceiver.isDatachannel)return void(sdp+="m=application 0 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=mid:"+transceiver.mid+"\r\n");var commonCapabilities=self._getCommonCapabilities(transceiver.localCapabilities,transceiver.remoteCapabilities);sdp+=SDPUtils.writeMediaSection(transceiver,commonCapabilities,"answer",self.localStreams[0])});var desc=new RTCSessionDescription({type:"answer",sdp:sdp});return arguments.length&&"function"==typeof arguments[0]&&window.setTimeout(arguments[0],0,desc),Promise.resolve(desc)},window.RTCPeerConnection.prototype.addIceCandidate=function(candidate){if(null===candidate)this.transceivers.forEach(function(transceiver){transceiver.iceTransport.addRemoteCandidate({})});else{var mLineIndex=candidate.sdpMLineIndex;if(candidate.sdpMid)for(var i=0;i<this.transceivers.length;i++)if(this.transceivers[i].mid===candidate.sdpMid){mLineIndex=i;break}var transceiver=this.transceivers[mLineIndex];if(transceiver){var cand=Object.keys(candidate.candidate).length>0?SDPUtils.parseCandidate(candidate.candidate):{};if("tcp"===cand.protocol&&(0===cand.port||9===cand.port))return;if("1"!==cand.component)return;"endOfCandidates"===cand.type&&(cand={}),transceiver.iceTransport.addRemoteCandidate(cand);var sections=SDPUtils.splitSections(this.remoteDescription.sdp);sections[mLineIndex+1]+=(cand.type?candidate.candidate.trim():"a=end-of-candidates")+"\r\n",this.remoteDescription.sdp=sections.join("")}}return arguments.length>1&&"function"==typeof arguments[1]&&window.setTimeout(arguments[1],0),Promise.resolve()},window.RTCPeerConnection.prototype.getStats=function(){var promises=[];this.transceivers.forEach(function(transceiver){["rtpSender","rtpReceiver","iceGatherer","iceTransport","dtlsTransport"].forEach(function(method){transceiver[method]&&promises.push(transceiver[method].getStats())})});var cb=arguments.length>1&&"function"==typeof arguments[1]&&arguments[1];return new Promise(function(resolve){var results=new Map;Promise.all(promises).then(function(res){res.forEach(function(result){Object.keys(result).forEach(function(id){results.set(id,result[id]),results[id]=result[id]})}),cb&&window.setTimeout(cb,0,results),resolve(results)})})}}};module.exports={shimPeerConnection:edgeShim.shimPeerConnection,shimGetUserMedia:requirecopy("./getusermedia")}},{"../utils":10,"./getusermedia":6,sdp:1}],6:[function(requirecopy,module,exports){"use strict";module.exports=function(){var shimError_=function(e){return{name:{PermissionDeniedError:"NotAllowedError"}[e.name]||e.name,message:e.message,constraint:e.constraint,toString:function(){return this.name}}},origGetUserMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=function(c){return origGetUserMedia(c).catch(function(e){return Promise.reject(shimError_(e))})}}},{}],7:[function(requirecopy,module,exports){"use strict";var browserDetails=requirecopy("../utils").browserDetails,firefoxShim={shimOnTrack:function(){"object"!=typeof window||!window.RTCPeerConnection||"ontrack"in window.RTCPeerConnection.prototype||Object.defineProperty(window.RTCPeerConnection.prototype,"ontrack",{get:function(){return this._ontrack},set:function(f){this._ontrack&&(this.removeEventListener("track",this._ontrack),this.removeEventListener("addstream",this._ontrackpoly)),this.addEventListener("track",this._ontrack=f),this.addEventListener("addstream",this._ontrackpoly=function(e){e.stream.getTracks().forEach(function(track){var event=new Event("track");event.track=track,event.receiver={track:track},event.streams=[e.stream],this.dispatchEvent(event)}.bind(this))}.bind(this))}})},shimSourceObject:function(){"object"==typeof window&&(!window.HTMLMediaElement||"srcObject"in window.HTMLMediaElement.prototype||Object.defineProperty(window.HTMLMediaElement.prototype,"srcObject",{get:function(){return this.mozSrcObject},set:function(stream){this.mozSrcObject=stream}}))},shimPeerConnection:function(){if("object"==typeof window&&(window.RTCPeerConnection||window.mozRTCPeerConnection)){window.RTCPeerConnection||(window.RTCPeerConnection=function(pcConfig,pcConstraints){if(browserDetails.version<38&&pcConfig&&pcConfig.iceServers){for(var newIceServers=[],i=0;i<pcConfig.iceServers.length;i++){var server=pcConfig.iceServers[i];if(server.hasOwnProperty("urls"))for(var j=0;j<server.urls.length;j++){var newServer={url:server.urls[j]};0===server.urls[j].indexOf("turn")&&(newServer.username=server.username,newServer.credential=server.credential),newIceServers.push(newServer)}else newIceServers.push(pcConfig.iceServers[i])}pcConfig.iceServers=newIceServers}return new mozRTCPeerConnection(pcConfig,pcConstraints)},window.RTCPeerConnection.prototype=mozRTCPeerConnection.prototype,mozRTCPeerConnection.generateCertificate&&Object.defineProperty(window.RTCPeerConnection,"generateCertificate",{get:function(){return mozRTCPeerConnection.generateCertificate}}),window.RTCSessionDescription=mozRTCSessionDescription,window.RTCIceCandidate=mozRTCIceCandidate),["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(method){var nativeMethod=RTCPeerConnection.prototype[method];RTCPeerConnection.prototype[method]=function(){return arguments[0]=new("addIceCandidate"===method?RTCIceCandidate:RTCSessionDescription)(arguments[0]),nativeMethod.apply(this,arguments)}});var nativeAddIceCandidate=RTCPeerConnection.prototype.addIceCandidate;RTCPeerConnection.prototype.addIceCandidate=function(){return null===arguments[0]?Promise.resolve():nativeAddIceCandidate.apply(this,arguments)};var makeMapStats=function(stats){var map=new Map;return Object.keys(stats).forEach(function(key){map.set(key,stats[key]),map[key]=stats[key]}),map},nativeGetStats=RTCPeerConnection.prototype.getStats;RTCPeerConnection.prototype.getStats=function(selector,onSucc,onErr){return nativeGetStats.apply(this,[selector||null]).then(function(stats){return makeMapStats(stats)}).then(onSucc,onErr)}}}};module.exports={shimOnTrack:firefoxShim.shimOnTrack,shimSourceObject:firefoxShim.shimSourceObject,shimPeerConnection:firefoxShim.shimPeerConnection,shimGetUserMedia:requirecopy("./getusermedia")}},{"../utils":10,"./getusermedia":8}],8:[function(requirecopy,module,exports){"use strict";var logging=requirecopy("../utils").log,browserDetails=requirecopy("../utils").browserDetails;module.exports=function(){var shimError_=function(e){return{name:{SecurityError:"NotAllowedError",PermissionDeniedError:"NotAllowedError"}[e.name]||e.name,message:{"The operation is insecure.":"The request is not allowed by the user agent or the platform in the current context."}[e.message]||e.message,constraint:e.constraint,toString:function(){return this.name+(this.message&&": ")+this.message}}},getUserMedia_=function(constraints,onSuccess,onError){var constraintsToFF37_=function(c){if("object"!=typeof c||c.require)return c;var require=[];return Object.keys(c).forEach(function(key){if("require"!==key&&"advanced"!==key&&"mediaSource"!==key){var r=c[key]="object"==typeof c[key]?c[key]:{ideal:c[key]};if(void 0===r.min&&void 0===r.max&&void 0===r.exact||require.push(key),void 0!==r.exact&&("number"==typeof r.exact?r.min=r.max=r.exact:c[key]=r.exact,delete r.exact),void 0!==r.ideal){c.advanced=c.advanced||[];var oc={};"number"==typeof r.ideal?oc[key]={min:r.ideal,max:r.ideal}:oc[key]=r.ideal,c.advanced.push(oc),delete r.ideal,Object.keys(r).length||delete c[key]}}}),require.length&&(c.require=require),c};return constraints=JSON.parse(JSON.stringify(constraints)),browserDetails.version<38&&(logging("spec: "+JSON.stringify(constraints)),constraints.audio&&(constraints.audio=constraintsToFF37_(constraints.audio)),constraints.video&&(constraints.video=constraintsToFF37_(constraints.video)),logging("ff37: "+JSON.stringify(constraints))),navigator.mozGetUserMedia(constraints,onSuccess,function(e){onError(shimError_(e))})},getUserMediaPromise_=function(constraints){return new Promise(function(resolve,reject){getUserMedia_(constraints,resolve,reject)})};if(navigator.mediaDevices||(navigator.mediaDevices={getUserMedia:getUserMediaPromise_,addEventListener:function(){},removeEventListener:function(){}}),navigator.mediaDevices.enumerateDevices=navigator.mediaDevices.enumerateDevices||function(){return new Promise(function(resolve){var infos=[{kind:"audioinput",deviceId:"default",label:"",groupId:""},{kind:"videoinput",deviceId:"default",label:"",groupId:""}];resolve(infos)})},browserDetails.version<41){var orgEnumerateDevices=navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);navigator.mediaDevices.enumerateDevices=function(){return orgEnumerateDevices().then(void 0,function(e){if("NotFoundError"===e.name)return[];throw e})}}if(browserDetails.version<49){var origGetUserMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=function(c){return origGetUserMedia(c).catch(function(e){return Promise.reject(shimError_(e))})}}navigator.getUserMedia=function(constraints,onSuccess,onError){return browserDetails.version<44?getUserMedia_(constraints,onSuccess,onError):void navigator.mediaDevices.getUserMedia(constraints).then(onSuccess,onError)}}},{"../utils":10}],9:[function(requirecopy,module,exports){"use strict";var safariShim={shimGetUserMedia:function(){navigator.getUserMedia=navigator.webkitGetUserMedia}};module.exports={shimGetUserMedia:safariShim.shimGetUserMedia}},{}],10:[function(requirecopy,module,exports){"use strict";var logDisabled_=!0,utils={disableLog:function(bool){return"boolean"!=typeof bool?new Error("Argument type: "+typeof bool+". Please use a boolean."):(logDisabled_=bool,bool?"adapter.js logging disabled":"adapter.js logging enabled")},log:function(){if("object"==typeof window){if(logDisabled_)return;"undefined"!=typeof console&&"function"==typeof console.log}},extractVersion:function(uastring,expr,pos){var match=uastring.match(expr);return match&&match.length>=pos&&parseInt(match[pos],10)},detectBrowser:function(){var result={};if(result.browser=null,result.version=null,"undefined"==typeof window||!window.navigator)return result.browser="Not a browser.",result;if(navigator.mozGetUserMedia)result.browser="firefox",result.version=this.extractVersion(navigator.userAgent,/Firefox\/([0-9]+)\./,1);else if(navigator.webkitGetUserMedia)if(window.webkitRTCPeerConnection)result.browser="chrome",result.version=this.extractVersion(navigator.userAgent,/Chrom(e|ium)\/([0-9]+)\./,2);else{if(!navigator.userAgent.match(/Version\/(\d+).(\d+)/))return result.browser="Unsupported webkit-based browser with GUM support but no WebRTC support.",result;result.browser="safari",result.version=this.extractVersion(navigator.userAgent,/AppleWebKit\/([0-9]+)\./,1)}else{if(!navigator.mediaDevices||!navigator.userAgent.match(/Edge\/(\d+).(\d+)$/))return result.browser="Not a supported browser.",result;result.browser="edge",result.version=this.extractVersion(navigator.userAgent,/Edge\/(\d+).(\d+)$/,2)}return result}};module.exports={log:utils.log,disableLog:utils.disableLog,browserDetails:utils.detectBrowser(),extractVersion:utils.extractVersion}},{}]},{},[2])(2)}),AdapterJS.parseWebrtcDetectedBrowser(),navigator.mozGetUserMedia?(MediaStreamTrack.getSources=function(successCb){setTimeout(function(){var infos=[{kind:"audio",id:"default",label:"",facing:""},{kind:"video",id:"default",label:"",facing:""}];successCb(infos)},0)},attachMediaStream=function(element,stream){return element.srcObject=stream,element},reattachMediaStream=function(to,from){return to.srcObject=from.srcObject,to},createIceServer=function(url,username,password){var iceServer=null,urlParts=url.split(":");if(0===urlParts[0].indexOf("stun"))iceServer={urls:[url]};else if(0===urlParts[0].indexOf("turn"))if(webrtcDetectedVersion<27){var turnUrlParts=url.split("?");1!==turnUrlParts.length&&0!==turnUrlParts[1].indexOf("transport=udp")||(iceServer={urls:[turnUrlParts[0]],credential:password,username:username})}else iceServer={urls:[url],credential:password,username:username};return iceServer},createIceServers=function(urls,username,password){var iceServers=[];for(i=0;i<urls.length;i++){var iceServer=createIceServer(urls[i],username,password);null!==iceServer&&iceServers.push(iceServer)}return iceServers}):navigator.webkitGetUserMedia?(attachMediaStream=function(element,stream){return webrtcDetectedVersion>=43?element.srcObject=stream:"undefined"!=typeof element.src&&(element.src=URL.createObjectURL(stream)),element},reattachMediaStream=function(to,from){return webrtcDetectedVersion>=43?to.srcObject=from.srcObject:to.src=from.src,to},createIceServer=function(url,username,password){var iceServer=null,urlParts=url.split(":");return 0===urlParts[0].indexOf("stun")?iceServer={url:url}:0===urlParts[0].indexOf("turn")&&(iceServer={url:url,credential:password,username:username}),iceServer},createIceServers=function(urls,username,password){var iceServers=[];if(webrtcDetectedVersion>=34)iceServers={urls:urls,credential:password,username:username};else for(i=0;i<urls.length;i++){var iceServer=createIceServer(urls[i],username,password);null!==iceServer&&iceServers.push(iceServer)}return iceServers}):navigator.mediaDevices&&navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)&&(attachMediaStream=function(element,stream){return element.srcObject=stream,element},reattachMediaStream=function(to,from){return to.srcObject=from.srcObject,to}),attachMediaStream_base=attachMediaStream,"opera"===webrtcDetectedBrowser&&(attachMediaStream_base=function(element,stream){webrtcDetectedVersion>38?element.srcObject=stream:"undefined"!=typeof element.src&&(element.src=URL.createObjectURL(stream))}),attachMediaStream=function(element,stream){return"chrome"!==webrtcDetectedBrowser&&"opera"!==webrtcDetectedBrowser||stream?attachMediaStream_base(element,stream):element.src="",element},reattachMediaStream_base=reattachMediaStream,reattachMediaStream=function(to,from){return reattachMediaStream_base(to,from),to},window.attachMediaStream=attachMediaStream,window.reattachMediaStream=reattachMediaStream,window.getUserMedia=function(constraints,onSuccess,onFailure){navigator.getUserMedia(constraints,onSuccess,onFailure)},AdapterJS.attachMediaStream=attachMediaStream,AdapterJS.reattachMediaStream=reattachMediaStream,AdapterJS.getUserMedia=getUserMedia,"undefined"==typeof Promise&&(requestUserMedia=null),AdapterJS.maybeThroughWebRTCReady()),"undefined"!=typeof exports&&(module.exports=AdapterJS);

/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = attemptMeet;
function fetchJson(url) {
  return fetch(url).then(response => {
    return response.json();
  }).catch(e => console.warn(e));
}

function attemptMeet({ id }) {
  return fetchJson(`/meet/${id}`);
}

/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = debounceVideo;
const fps = 30;
const interval = 1000 / fps;

function debounceVideo(cb, videoElement) {
  const ENOUGH_DATA = videoElement.HAVE_ENOUGH_DATA;
  let start = Date.now() - interval;
  let now;

  const debounced = () => {
    now = Date.now();
    const elapsed = now - start;

    if (elapsed > interval) {
      const isVideoReady = videoElement.readyState === ENOUGH_DATA;
      const videoHasWidth = videoElement.videoWidth > 0;

      if (isVideoReady && videoHasWidth) {
        start = now;
        setTimeout(cb, interval);
      } else {
        setTimeout(debounced, interval);
      }
    }
  };

  return debounced;
}

/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_peerjs__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_peerjs___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_peerjs__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__api__ = __webpack_require__(7);
/* harmony export (immutable) */ __webpack_exports__["a"] = ClientPeer;



function ClientPeer({ onDial, onIncomingCall, onError }) {
  this.onDial = onDial;

  let config;
  if (undefined === 'production') {
    config = { host: 'eye-contact.herokuapp.com', port: '', wsport: '', path: '/api' };
  } else {
    config = { host: 'localhost', port: 3000, path: '/api', debug: 3 };
  }

  const peer = new __WEBPACK_IMPORTED_MODULE_0_peerjs___default.a(config);
  peer.on('open', id => {
    this.id = id;
    this.askForConnection();
  });
  peer.on('connection', onIncomingCall);
  peer.on('error', onError);
  this.peer = peer;
}

ClientPeer.prototype.askForConnection = function () {
  __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__api__["a" /* attemptMeet */])({ id: this.id }).then(this.onDial);
};

/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_adapterjs__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_adapterjs___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_adapterjs__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__peer__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__data_source__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__debounce__ = __webpack_require__(8);





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
    detector,
    middle;

function loadingOn() {
  waiting.style.display = "block";
  connected.style.display = "none";
}

function loadingOff() {
  waiting.style.display = "none";
  connected.style.display = "block";
}

function Eyecontact() {
  this.client = new __WEBPACK_IMPORTED_MODULE_1__peer__["a" /* default */]({
    onDial: this.dial.bind(this),
    onIncomingCall: this.setupConnection.bind(this),
    onError: this.dropDataSource.bind(this)
  });

  this.sendData = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__debounce__["a" /* default */])(() => {
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
  this.dataSource = new __WEBPACK_IMPORTED_MODULE_2__data_source__["a" /* default */]({
    connection,
    onOpen: loadingOff,
    onData: data => {
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
    onError: this.dropDataSource.bind(this)
  });
};

Eyecontact.prototype.dial = function (res) {
  onlineUsers.innerHTML = res.users + " user(s) online";
  if (res.meet === "hold") {
    console.log("Waiting for a new friend");
  } else {
    console.log("Meet ", res.meet);
    this.setupConnection(this.client.peer.connect(res.meet));
  }
};

Eyecontact.prototype.dropDataSource = function (error) {
  console.warn(error);
  if (this.dataSource) {
    this.dataSource.connection.close();
    this.dataSource = undefined;
  }
  loadingOn();
  this.client.askForConnection();
};

let eyecontact;

try {
  __WEBPACK_IMPORTED_MODULE_0_adapterjs___default.a.webRTCReady(() => {
    const constraints = {
      video: { mandatory: { maxFrameRate: 30, maxWidth: 640 } }
    };

    getUserMedia(constraints, stream => {
      eyecontact = new Eyecontact();

      try {
        localVideo.src = URL.createObjectURL(stream);
      } catch (error) {
        localVideo.src = stream;
      }
      requestAnimationFrame(eyecontact.sendData);
    }, error => {
      console.warn(error);
      alert('WebRTC is unavailable');
    });
  });
} catch (error) {
  console.warn(error);
  alert('There was a problem setting up the WebRTC connection');
}

nextButton.onclick = () => {
  if (eyecontact) {
    eyecontact.dropDataSource;
  }
};

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

var util = __webpack_require__(0);
var EventEmitter = __webpack_require__(1);
var Negotiator = __webpack_require__(5);
var Reliable = __webpack_require__(15);

/**
 * Wraps a DataChannel between two Peers.
 */
function DataConnection(peer, provider, options) {
  if (!(this instanceof DataConnection)) return new DataConnection(peer, provider, options);
  EventEmitter.call(this);

  this.options = util.extend({
    serialization: 'binary',
    reliable: false
  }, options);

  // Connection is not open yet.
  this.open = false;
  this.type = 'data';
  this.peer = peer;
  this.provider = provider;

  this.id = this.options.connectionId || DataConnection._idPrefix + util.randomToken();

  this.label = this.options.label || this.id;
  this.metadata = this.options.metadata;
  this.serialization = this.options.serialization;
  this.reliable = this.options.reliable;

  // Data channel buffering.
  this._buffer = [];
  this._buffering = false;
  this.bufferSize = 0;

  // For storing large data.
  this._chunkedData = {};

  if (this.options._payload) {
    this._peerBrowser = this.options._payload.browser;
  }

  Negotiator.startConnection(
    this,
    this.options._payload || {
      originator: true
    }
  );
}

util.inherits(DataConnection, EventEmitter);

DataConnection._idPrefix = 'dc_';

/** Called by the Negotiator when the DataChannel is ready. */
DataConnection.prototype.initialize = function(dc) {
  this._dc = this.dataChannel = dc;
  this._configureDataChannel();
}

DataConnection.prototype._configureDataChannel = function() {
  var self = this;
  if (util.supports.sctp) {
    this._dc.binaryType = 'arraybuffer';
  }
  this._dc.onopen = function() {
    util.log('Data channel connection success');
    self.open = true;
    self.emit('open');
  }

  // Use the Reliable shim for non Firefox browsers
  if (!util.supports.sctp && this.reliable) {
    this._reliable = new Reliable(this._dc, util.debug);
  }

  if (this._reliable) {
    this._reliable.onmessage = function(msg) {
      self.emit('data', msg);
    };
  } else {
    this._dc.onmessage = function(e) {
      self._handleDataMessage(e);
    };
  }
  this._dc.onclose = function(e) {
    util.log('DataChannel closed for:', self.peer);
    self.close();
  };
}

// Handles a DataChannel message.
DataConnection.prototype._handleDataMessage = function(e) {
  var self = this;
  var data = e.data;
  var datatype = data.constructor;
  if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
    if (datatype === Blob) {
      // Datatype should never be blob
      util.blobToArrayBuffer(data, function(ab) {
        data = util.unpack(ab);
        self.emit('data', data);
      });
      return;
    } else if (datatype === ArrayBuffer) {
      data = util.unpack(data);
    } else if (datatype === String) {
      // String fallback for binary data for browsers that don't support binary yet
      var ab = util.binaryStringToArrayBuffer(data);
      data = util.unpack(ab);
    }
  } else if (this.serialization === 'json') {
    data = JSON.parse(data);
  }

  // Check if we've chunked--if so, piece things back together.
  // We're guaranteed that this isn't 0.
  if (data.__peerData) {
    var id = data.__peerData;
    var chunkInfo = this._chunkedData[id] || {data: [], count: 0, total: data.total};

    chunkInfo.data[data.n] = data.data;
    chunkInfo.count += 1;

    if (chunkInfo.total === chunkInfo.count) {
      // Clean up before making the recursive call to `_handleDataMessage`.
      delete this._chunkedData[id];

      // We've received all the chunks--time to construct the complete data.
      data = new Blob(chunkInfo.data);
      this._handleDataMessage({data: data});
    }

    this._chunkedData[id] = chunkInfo;
    return;
  }

  this.emit('data', data);
}

/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
DataConnection.prototype.close = function() {
  if (!this.open) {
    return;
  }
  this.open = false;
  Negotiator.cleanup(this);
  this.emit('close');
}

/** Allows user to send data. */
DataConnection.prototype.send = function(data, chunked) {
  if (!this.open) {
    this.emit('error', new Error('Connection is not open. You should listen for the `open` event before sending messages.'));
    return;
  }
  if (this._reliable) {
    // Note: reliable shim sending will make it so that you cannot customize
    // serialization.
    this._reliable.send(data);
    return;
  }
  var self = this;
  if (this.serialization === 'json') {
    this._bufferedSend(JSON.stringify(data));
  } else if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
    var blob = util.pack(data);

    // For Chrome-Firefox interoperability, we need to make Firefox "chunk"
    // the data it sends out.
    var needsChunking = util.chunkedBrowsers[this._peerBrowser] || util.chunkedBrowsers[util.browser];
    if (needsChunking && !chunked && blob.size > util.chunkedMTU) {
      this._sendChunks(blob);
      return;
    }

    // DataChannel currently only supports strings.
    if (!util.supports.sctp) {
      util.blobToBinaryString(blob, function(str) {
        self._bufferedSend(str);
      });
    } else if (!util.supports.binaryBlob) {
      // We only do this if we really need to (e.g. blobs are not supported),
      // because this conversion is costly.
      util.blobToArrayBuffer(blob, function(ab) {
        self._bufferedSend(ab);
      });
    } else {
      this._bufferedSend(blob);
    }
  } else {
    this._bufferedSend(data);
  }
}

DataConnection.prototype._bufferedSend = function(msg) {
  if (this._buffering || !this._trySend(msg)) {
    this._buffer.push(msg);
    this.bufferSize = this._buffer.length;
  }
}

// Returns true if the send succeeds.
DataConnection.prototype._trySend = function(msg) {
  try {
    this._dc.send(msg);
  } catch (e) {
    this._buffering = true;

    var self = this;
    setTimeout(function() {
      // Try again.
      self._buffering = false;
      self._tryBuffer();
    }, 100);
    return false;
  }
  return true;
}

// Try to send the first message in the buffer.
DataConnection.prototype._tryBuffer = function() {
  if (this._buffer.length === 0) {
    return;
  }

  var msg = this._buffer[0];

  if (this._trySend(msg)) {
    this._buffer.shift();
    this.bufferSize = this._buffer.length;
    this._tryBuffer();
  }
}

DataConnection.prototype._sendChunks = function(blob) {
  var blobs = util.chunk(blob);
  for (var i = 0, ii = blobs.length; i < ii; i += 1) {
    var blob = blobs[i];
    this.send(blob, true);
  }
}

DataConnection.prototype.handleMessage = function(message) {
  var payload = message.payload;

  switch (message.type) {
    case 'ANSWER':
      this._peerBrowser = payload.browser;

      // Forward to negotiator
      Negotiator.handleSDP(message.type, this, payload.sdp);
      break;
    case 'CANDIDATE':
      Negotiator.handleCandidate(this, payload.candidate);
      break;
    default:
      util.warn('Unrecognized message type:', message.type, 'from peer:', this.peer);
      break;
  }
}

module.exports = DataConnection;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

var util = __webpack_require__(0);
var EventEmitter = __webpack_require__(1);
var Negotiator = __webpack_require__(5);

/**
 * Wraps the streaming interface between two Peers.
 */
function MediaConnection(peer, provider, options) {
  if (!(this instanceof MediaConnection)) return new MediaConnection(peer, provider, options);
  EventEmitter.call(this);

  this.options = util.extend({}, options);

  this.open = false;
  this.type = 'media';
  this.peer = peer;
  this.provider = provider;
  this.metadata = this.options.metadata;
  this.localStream = this.options._stream;

  this.id = this.options.connectionId || MediaConnection._idPrefix + util.randomToken();
  if (this.localStream) {
    Negotiator.startConnection(
      this,
      {_stream: this.localStream, originator: true}
    );
  }
};

util.inherits(MediaConnection, EventEmitter);

MediaConnection._idPrefix = 'mc_';

MediaConnection.prototype.addStream = function(remoteStream) {
  util.log('Receiving stream', remoteStream);

  this.remoteStream = remoteStream;
  this.emit('stream', remoteStream); // Should we call this `open`?

};

MediaConnection.prototype.handleMessage = function(message) {
  var payload = message.payload;

  switch (message.type) {
    case 'ANSWER':
      // Forward to negotiator
      Negotiator.handleSDP(message.type, this, payload.sdp);
      this.open = true;
      break;
    case 'CANDIDATE':
      Negotiator.handleCandidate(this, payload.candidate);
      break;
    default:
      util.warn('Unrecognized message type:', message.type, 'from peer:', this.peer);
      break;
  }
}

MediaConnection.prototype.answer = function(stream) {
  if (this.localStream) {
    util.warn('Local stream already exists on this MediaConnection. Are you answering a call twice?');
    return;
  }

  this.options._payload._stream = stream;

  this.localStream = stream;
  Negotiator.startConnection(
    this,
    this.options._payload
  )
  // Retrieve lost messages stored because PeerConnection not set up.
  var messages = this.provider._getMessages(this.id);
  for (var i = 0, ii = messages.length; i < ii; i += 1) {
    this.handleMessage(messages[i]);
  }
  this.open = true;
};

/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
MediaConnection.prototype.close = function() {
  if (!this.open) {
    return;
  }
  this.open = false;
  Negotiator.cleanup(this);
  this.emit('close')
};

module.exports = MediaConnection;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

var util = __webpack_require__(0);
var EventEmitter = __webpack_require__(1);
var Socket = __webpack_require__(14);
var MediaConnection = __webpack_require__(12);
var DataConnection = __webpack_require__(11);

/**
 * A peer who can initiate connections with other peers.
 */
function Peer(id, options) {
  if (!(this instanceof Peer)) return new Peer(id, options);
  EventEmitter.call(this);

  // Deal with overloading
  if (id && id.constructor == Object) {
    options = id;
    id = undefined;
  } else if (id) {
    // Ensure id is a string
    id = id.toString();
  }
  //

  // Configurize options
  options = util.extend({
    debug: 0, // 1: Errors, 2: Warnings, 3: All logs
    host: util.CLOUD_HOST,
    port: util.CLOUD_PORT,
    key: 'peerjs',
    path: '/',
    token: util.randomToken(),
    config: util.defaultConfig
  }, options);
  this.options = options;
  // Detect relative URL host.
  if (options.host === '/') {
    options.host = window.location.hostname;
  }
  // Set path correctly.
  if (options.path[0] !== '/') {
    options.path = '/' + options.path;
  }
  if (options.path[options.path.length - 1] !== '/') {
    options.path += '/';
  }

  // Set whether we use SSL to same as current host
  if (options.secure === undefined && options.host !== util.CLOUD_HOST) {
    options.secure = util.isSecure();
  }
  // Set a custom log function if present
  if (options.logFunction) {
    util.setLogFunction(options.logFunction);
  }
  util.setLogLevel(options.debug);
  //

  // Sanity checks
  // Ensure WebRTC supported
  if (!util.supports.audioVideo && !util.supports.data ) {
    this._delayedAbort('browser-incompatible', 'The current browser does not support WebRTC');
    return;
  }
  // Ensure alphanumeric id
  if (!util.validateId(id)) {
    this._delayedAbort('invalid-id', 'ID "' + id + '" is invalid');
    return;
  }
  // Ensure valid key
  if (!util.validateKey(options.key)) {
    this._delayedAbort('invalid-key', 'API KEY "' + options.key + '" is invalid');
    return;
  }
  // Ensure not using unsecure cloud server on SSL page
  if (options.secure && options.host === '0.peerjs.com') {
    this._delayedAbort('ssl-unavailable',
      'The cloud server currently does not support HTTPS. Please run your own PeerServer to use HTTPS.');
    return;
  }
  //

  // States.
  this.destroyed = false; // Connections have been killed
  this.disconnected = false; // Connection to PeerServer killed but P2P connections still active
  this.open = false; // Sockets and such are not yet open.
  //

  // References
  this.connections = {}; // DataConnections for this peer.
  this._lostMessages = {}; // src => [list of messages]
  //

  // Start the server connection
  this._initializeServerConnection();
  if (id) {
    this._initialize(id);
  } else {
    this._retrieveId();
  }
  //
}

util.inherits(Peer, EventEmitter);

// Initialize the 'socket' (which is actually a mix of XHR streaming and
// websockets.)
Peer.prototype._initializeServerConnection = function() {
  var self = this;
  this.socket = new Socket(this.options.secure, this.options.host, this.options.port, this.options.path, this.options.key);
  this.socket.on('message', function(data) {
    self._handleMessage(data);
  });
  this.socket.on('error', function(error) {
    self._abort('socket-error', error);
  });
  this.socket.on('disconnected', function() {
    // If we haven't explicitly disconnected, emit error and disconnect.
    if (!self.disconnected) {
      self.emitError('network', 'Lost connection to server.');
      self.disconnect();
    }
  });
  this.socket.on('close', function() {
    // If we haven't explicitly disconnected, emit error.
    if (!self.disconnected) {
      self._abort('socket-closed', 'Underlying socket is already closed.');
    }
  });
};

/** Get a unique ID from the server via XHR. */
Peer.prototype._retrieveId = function(cb) {
  var self = this;
  var http = new XMLHttpRequest();
  var protocol = this.options.secure ? 'https://' : 'http://';
  var url = protocol + this.options.host + ':' + this.options.port +
    this.options.path + this.options.key + '/id';
  var queryString = '?ts=' + new Date().getTime() + '' + Math.random();
  url += queryString;

  // If there's no ID we need to wait for one before trying to init socket.
  http.open('get', url, true);
  http.onerror = function(e) {
    util.error('Error retrieving ID', e);
    var pathError = '';
    if (self.options.path === '/' && self.options.host !== util.CLOUD_HOST) {
      pathError = ' If you passed in a `path` to your self-hosted PeerServer, ' +
        'you\'ll also need to pass in that same path when creating a new ' +
        'Peer.';
    }
    self._abort('server-error', 'Could not get an ID from the server.' + pathError);
  };
  http.onreadystatechange = function() {
    if (http.readyState !== 4) {
      return;
    }
    if (http.status !== 200) {
      http.onerror();
      return;
    }
    self._initialize(http.responseText);
  };
  http.send(null);
};

/** Initialize a connection with the server. */
Peer.prototype._initialize = function(id) {
  this.id = id;
  this.socket.start(this.id, this.options.token);
};

/** Handles messages from the server. */
Peer.prototype._handleMessage = function(message) {
  var type = message.type;
  var payload = message.payload;
  var peer = message.src;
  var connection;

  switch (type) {
    case 'OPEN': // The connection to the server is open.
      this.emit('open', this.id);
      this.open = true;
      break;
    case 'ERROR': // Server error.
      this._abort('server-error', payload.msg);
      break;
    case 'ID-TAKEN': // The selected ID is taken.
      this._abort('unavailable-id', 'ID `' + this.id + '` is taken');
      break;
    case 'INVALID-KEY': // The given API key cannot be found.
      this._abort('invalid-key', 'API KEY "' + this.options.key + '" is invalid');
      break;

    //
    case 'LEAVE': // Another peer has closed its connection to this peer.
      util.log('Received leave message from', peer);
      this._cleanupPeer(peer);
      break;

    case 'EXPIRE': // The offer sent to a peer has expired without response.
      this.emitError('peer-unavailable', 'Could not connect to peer ' + peer);
      break;
    case 'OFFER': // we should consider switching this to CALL/CONNECT, but this is the least breaking option.
      var connectionId = payload.connectionId;
      connection = this.getConnection(peer, connectionId);

      if (connection) {
        util.warn('Offer received for existing Connection ID:', connectionId);
        //connection.handleMessage(message);
      } else {
        // Create a new connection.
        if (payload.type === 'media') {
          connection = new MediaConnection(peer, this, {
            connectionId: connectionId,
            _payload: payload,
            metadata: payload.metadata
          });
          this._addConnection(peer, connection);
          this.emit('call', connection);
        } else if (payload.type === 'data') {
          connection = new DataConnection(peer, this, {
            connectionId: connectionId,
            _payload: payload,
            metadata: payload.metadata,
            label: payload.label,
            serialization: payload.serialization,
            reliable: payload.reliable
          });
          this._addConnection(peer, connection);
          this.emit('connection', connection);
        } else {
          util.warn('Received malformed connection type:', payload.type);
          return;
        }
        // Find messages.
        var messages = this._getMessages(connectionId);
        for (var i = 0, ii = messages.length; i < ii; i += 1) {
          connection.handleMessage(messages[i]);
        }
      }
      break;
    default:
      if (!payload) {
        util.warn('You received a malformed message from ' + peer + ' of type ' + type);
        return;
      }

      var id = payload.connectionId;
      connection = this.getConnection(peer, id);

      if (connection && connection.pc) {
        // Pass it on.
        connection.handleMessage(message);
      } else if (id) {
        // Store for possible later use
        this._storeMessage(id, message);
      } else {
        util.warn('You received an unrecognized message:', message);
      }
      break;
  }
};

/** Stores messages without a set up connection, to be claimed later. */
Peer.prototype._storeMessage = function(connectionId, message) {
  if (!this._lostMessages[connectionId]) {
    this._lostMessages[connectionId] = [];
  }
  this._lostMessages[connectionId].push(message);
};

/** Retrieve messages from lost message store */
Peer.prototype._getMessages = function(connectionId) {
  var messages = this._lostMessages[connectionId];
  if (messages) {
    delete this._lostMessages[connectionId];
    return messages;
  } else {
    return [];
  }
};

/**
 * Returns a DataConnection to the specified peer. See documentation for a
 * complete list of options.
 */
Peer.prototype.connect = function(peer, options) {
  if (this.disconnected) {
    util.warn('You cannot connect to a new Peer because you called ' +
      '.disconnect() on this Peer and ended your connection with the ' +
      'server. You can create a new Peer to reconnect, or call reconnect ' +
      'on this peer if you believe its ID to still be available.');
    this.emitError('disconnected', 'Cannot connect to new Peer after disconnecting from server.');
    return;
  }
  var connection = new DataConnection(peer, this, options);
  this._addConnection(peer, connection);
  return connection;
};

/**
 * Returns a MediaConnection to the specified peer. See documentation for a
 * complete list of options.
 */
Peer.prototype.call = function(peer, stream, options) {
  if (this.disconnected) {
    util.warn('You cannot connect to a new Peer because you called ' +
      '.disconnect() on this Peer and ended your connection with the ' +
      'server. You can create a new Peer to reconnect.');
    this.emitError('disconnected', 'Cannot connect to new Peer after disconnecting from server.');
    return;
  }
  if (!stream) {
    util.error('To call a peer, you must provide a stream from your browser\'s `getUserMedia`.');
    return;
  }
  options = options || {};
  options._stream = stream;
  var call = new MediaConnection(peer, this, options);
  this._addConnection(peer, call);
  return call;
};

/** Add a data/media connection to this peer. */
Peer.prototype._addConnection = function(peer, connection) {
  if (!this.connections[peer]) {
    this.connections[peer] = [];
  }
  this.connections[peer].push(connection);
};

/** Retrieve a data/media connection for this peer. */
Peer.prototype.getConnection = function(peer, id) {
  var connections = this.connections[peer];
  if (!connections) {
    return null;
  }
  for (var i = 0, ii = connections.length; i < ii; i++) {
    if (connections[i].id === id) {
      return connections[i];
    }
  }
  return null;
};

Peer.prototype._delayedAbort = function(type, message) {
  var self = this;
  util.setZeroTimeout(function(){
    self._abort(type, message);
  });
};

/**
 * Destroys the Peer and emits an error message.
 * The Peer is not destroyed if it's in a disconnected state, in which case
 * it retains its disconnected state and its existing connections.
 */
Peer.prototype._abort = function(type, message) {
  util.error('Aborting!');
  if (!this._lastServerId) {
    this.destroy();
  } else {
    this.disconnect();
  }
  this.emitError(type, message);
};

/** Emits a typed error message. */
Peer.prototype.emitError = function(type, err) {
  util.error('Error:', err);
  if (typeof err === 'string') {
    err = new Error(err);
  }
  err.type = type;
  this.emit('error', err);
};

/**
 * Destroys the Peer: closes all active connections as well as the connection
 *  to the server.
 * Warning: The peer can no longer create or accept connections after being
 *  destroyed.
 */
Peer.prototype.destroy = function() {
  if (!this.destroyed) {
    this._cleanup();
    this.disconnect();
    this.destroyed = true;
  }
};


/** Disconnects every connection on this peer. */
Peer.prototype._cleanup = function() {
  if (this.connections) {
    var peers = Object.keys(this.connections);
    for (var i = 0, ii = peers.length; i < ii; i++) {
      this._cleanupPeer(peers[i]);
    }
  }
  this.emit('close');
};

/** Closes all connections to this peer. */
Peer.prototype._cleanupPeer = function(peer) {
  var connections = this.connections[peer];
  for (var j = 0, jj = connections.length; j < jj; j += 1) {
    connections[j].close();
  }
};

/**
 * Disconnects the Peer's connection to the PeerServer. Does not close any
 *  active connections.
 * Warning: The peer can no longer create or accept connections after being
 *  disconnected. It also cannot reconnect to the server.
 */
Peer.prototype.disconnect = function() {
  var self = this;
  util.setZeroTimeout(function(){
    if (!self.disconnected) {
      self.disconnected = true;
      self.open = false;
      if (self.socket) {
        self.socket.close();
      }
      self.emit('disconnected', self.id);
      self._lastServerId = self.id;
      self.id = null;
    }
  });
};

/** Attempts to reconnect with the same ID. */
Peer.prototype.reconnect = function() {
  if (this.disconnected && !this.destroyed) {
    util.log('Attempting reconnection to server with ID ' + this._lastServerId);
    this.disconnected = false;
    this._initializeServerConnection();
    this._initialize(this._lastServerId);
  } else if (this.destroyed) {
    throw new Error('This peer cannot reconnect to the server. It has already been destroyed.');
  } else if (!this.disconnected && !this.open) {
    // Do nothing. We're still connecting the first time.
    util.error('In a hurry? We\'re still trying to make the initial connection!');
  } else {
    throw new Error('Peer ' + this.id + ' cannot reconnect because it is not disconnected from the server!');
  }
};

/**
 * Get a list of available peer IDs. If you're running your own server, you'll
 * want to set allow_discovery: true in the PeerServer options. If you're using
 * the cloud server, email team@peerjs.com to get the functionality enabled for
 * your key.
 */
Peer.prototype.listAllPeers = function(cb) {
  cb = cb || function() {};
  var self = this;
  var http = new XMLHttpRequest();
  var protocol = this.options.secure ? 'https://' : 'http://';
  var url = protocol + this.options.host + ':' + this.options.port +
    this.options.path + this.options.key + '/peers';
  var queryString = '?ts=' + new Date().getTime() + '' + Math.random();
  url += queryString;

  // If there's no ID we need to wait for one before trying to init socket.
  http.open('get', url, true);
  http.onerror = function(e) {
    self._abort('server-error', 'Could not get peers from the server.');
    cb([]);
  };
  http.onreadystatechange = function() {
    if (http.readyState !== 4) {
      return;
    }
    if (http.status === 401) {
      var helpfulError = '';
      if (self.options.host !== util.CLOUD_HOST) {
        helpfulError = 'It looks like you\'re using the cloud server. You can email ' +
          'team@peerjs.com to enable peer listing for your API key.';
      } else {
        helpfulError = 'You need to enable `allow_discovery` on your self-hosted ' +
          'PeerServer to use this feature.';
      }
      cb([]);
      throw new Error('It doesn\'t look like you have permission to list peers IDs. ' + helpfulError);
    } else if (http.status !== 200) {
      cb([]);
    } else {
      cb(JSON.parse(http.responseText));
    }
  };
  http.send(null);
};

module.exports = Peer;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

var util = __webpack_require__(0);
var EventEmitter = __webpack_require__(1);

/**
 * An abstraction on top of WebSockets and XHR streaming to provide fastest
 * possible connection for peers.
 */
function Socket(secure, host, port, path, key) {
  if (!(this instanceof Socket)) return new Socket(secure, host, port, path, key);

  EventEmitter.call(this);

  // Disconnected manually.
  this.disconnected = false;
  this._queue = [];

  var httpProtocol = secure ? 'https://' : 'http://';
  var wsProtocol = secure ? 'wss://' : 'ws://';
  this._httpUrl = httpProtocol + host + ':' + port + path + key;
  this._wsUrl = wsProtocol + host + ':' + port + path + 'peerjs?key=' + key;
}

util.inherits(Socket, EventEmitter);


/** Check in with ID or get one from server. */
Socket.prototype.start = function(id, token) {
  this.id = id;

  this._httpUrl += '/' + id + '/' + token;
  this._wsUrl += '&id=' + id + '&token=' + token;

  this._startXhrStream();
  this._startWebSocket();
}


/** Start up websocket communications. */
Socket.prototype._startWebSocket = function(id) {
  var self = this;

  if (this._socket) {
    return;
  }

  this._socket = new WebSocket(this._wsUrl);

  this._socket.onmessage = function(event) {
    try {
      var data = JSON.parse(event.data);
    } catch(e) {
      util.log('Invalid server message', event.data);
      return;
    }
    self.emit('message', data);
  };

  this._socket.onclose = function(event) {
    util.log('Socket closed.');
    self.disconnected = true;
    self.emit('disconnected');
  };

  // Take care of the queue of connections if necessary and make sure Peer knows
  // socket is open.
  this._socket.onopen = function() {
    if (self._timeout) {
      clearTimeout(self._timeout);
      setTimeout(function(){
        self._http.abort();
        self._http = null;
      }, 5000);
    }
    self._sendQueuedMessages();
    util.log('Socket open');
  };
}

/** Start XHR streaming. */
Socket.prototype._startXhrStream = function(n) {
  try {
    var self = this;
    this._http = new XMLHttpRequest();
    this._http._index = 1;
    this._http._streamIndex = n || 0;
    this._http.open('post', this._httpUrl + '/id?i=' + this._http._streamIndex, true);
    this._http.onerror = function() {
      // If we get an error, likely something went wrong.
      // Stop streaming.
      clearTimeout(self._timeout);
      self.emit('disconnected');
    }
    this._http.onreadystatechange = function() {
      if (this.readyState == 2 && this.old) {
        this.old.abort();
        delete this.old;
      } else if (this.readyState > 2 && this.status === 200 && this.responseText) {
        self._handleStream(this);
      }
    };
    this._http.send(null);
    this._setHTTPTimeout();
  } catch(e) {
    util.log('XMLHttpRequest not available; defaulting to WebSockets');
  }
}


/** Handles onreadystatechange response as a stream. */
Socket.prototype._handleStream = function(http) {
  // 3 and 4 are loading/done state. All others are not relevant.
  var messages = http.responseText.split('\n');

  // Check to see if anything needs to be processed on buffer.
  if (http._buffer) {
    while (http._buffer.length > 0) {
      var index = http._buffer.shift();
      var bufferedMessage = messages[index];
      try {
        bufferedMessage = JSON.parse(bufferedMessage);
      } catch(e) {
        http._buffer.shift(index);
        break;
      }
      this.emit('message', bufferedMessage);
    }
  }

  var message = messages[http._index];
  if (message) {
    http._index += 1;
    // Buffering--this message is incomplete and we'll get to it next time.
    // This checks if the httpResponse ended in a `\n`, in which case the last
    // element of messages should be the empty string.
    if (http._index === messages.length) {
      if (!http._buffer) {
        http._buffer = [];
      }
      http._buffer.push(http._index - 1);
    } else {
      try {
        message = JSON.parse(message);
      } catch(e) {
        util.log('Invalid server message', message);
        return;
      }
      this.emit('message', message);
    }
  }
}

Socket.prototype._setHTTPTimeout = function() {
  var self = this;
  this._timeout = setTimeout(function() {
    var old = self._http;
    if (!self._wsOpen()) {
      self._startXhrStream(old._streamIndex + 1);
      self._http.old = old;
    } else {
      old.abort();
    }
  }, 25000);
}

/** Is the websocket currently open? */
Socket.prototype._wsOpen = function() {
  return this._socket && this._socket.readyState == 1;
}

/** Send queued messages. */
Socket.prototype._sendQueuedMessages = function() {
  for (var i = 0, ii = this._queue.length; i < ii; i += 1) {
    this.send(this._queue[i]);
  }
}

/** Exposed send for DC & Peer. */
Socket.prototype.send = function(data) {
  if (this.disconnected) {
    return;
  }

  // If we didn't get an ID yet, we can't yet send anything so we should queue
  // up these messages.
  if (!this.id) {
    this._queue.push(data);
    return;
  }

  if (!data.type) {
    this.emit('error', 'Invalid message');
    return;
  }

  var message = JSON.stringify(data);
  if (this._wsOpen()) {
    this._socket.send(message);
  } else {
    var http = new XMLHttpRequest();
    var url = this._httpUrl + '/' + data.type.toLowerCase();
    http.open('post', url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.send(message);
  }
}

Socket.prototype.close = function() {
  if (!this.disconnected && this._wsOpen()) {
    this._socket.close();
    this.disconnected = true;
  }
}

module.exports = Socket;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

var util = __webpack_require__(16);

/**
 * Reliable transfer for Chrome Canary DataChannel impl.
 * Author: @michellebu
 */
function Reliable(dc, debug) {
  if (!(this instanceof Reliable)) return new Reliable(dc);
  this._dc = dc;

  util.debug = debug;

  // Messages sent/received so far.
  // id: { ack: n, chunks: [...] }
  this._outgoing = {};
  // id: { ack: ['ack', id, n], chunks: [...] }
  this._incoming = {};
  this._received = {};

  // Window size.
  this._window = 1000;
  // MTU.
  this._mtu = 500;
  // Interval for setInterval. In ms.
  this._interval = 0;

  // Messages sent.
  this._count = 0;

  // Outgoing message queue.
  this._queue = [];

  this._setupDC();
};

// Send a message reliably.
Reliable.prototype.send = function(msg) {
  // Determine if chunking is necessary.
  var bl = util.pack(msg);
  if (bl.size < this._mtu) {
    this._handleSend(['no', bl]);
    return;
  }

  this._outgoing[this._count] = {
    ack: 0,
    chunks: this._chunk(bl)
  };

  if (util.debug) {
    this._outgoing[this._count].timer = new Date();
  }

  // Send prelim window.
  this._sendWindowedChunks(this._count);
  this._count += 1;
};

// Set up interval for processing queue.
Reliable.prototype._setupInterval = function() {
  // TODO: fail gracefully.

  var self = this;
  this._timeout = setInterval(function() {
    // FIXME: String stuff makes things terribly async.
    var msg = self._queue.shift();
    if (msg._multiple) {
      for (var i = 0, ii = msg.length; i < ii; i += 1) {
        self._intervalSend(msg[i]);
      }
    } else {
      self._intervalSend(msg);
    }
  }, this._interval);
};

Reliable.prototype._intervalSend = function(msg) {
  var self = this;
  msg = util.pack(msg);
  util.blobToBinaryString(msg, function(str) {
    self._dc.send(str);
  });
  if (self._queue.length === 0) {
    clearTimeout(self._timeout);
    self._timeout = null;
    //self._processAcks();
  }
};

// Go through ACKs to send missing pieces.
Reliable.prototype._processAcks = function() {
  for (var id in this._outgoing) {
    if (this._outgoing.hasOwnProperty(id)) {
      this._sendWindowedChunks(id);
    }
  }
};

// Handle sending a message.
// FIXME: Don't wait for interval time for all messages...
Reliable.prototype._handleSend = function(msg) {
  var push = true;
  for (var i = 0, ii = this._queue.length; i < ii; i += 1) {
    var item = this._queue[i];
    if (item === msg) {
      push = false;
    } else if (item._multiple && item.indexOf(msg) !== -1) {
      push = false;
    }
  }
  if (push) {
    this._queue.push(msg);
    if (!this._timeout) {
      this._setupInterval();
    }
  }
};

// Set up DataChannel handlers.
Reliable.prototype._setupDC = function() {
  // Handle various message types.
  var self = this;
  this._dc.onmessage = function(e) {
    var msg = e.data;
    var datatype = msg.constructor;
    // FIXME: msg is String until binary is supported.
    // Once that happens, this will have to be smarter.
    if (datatype === String) {
      var ab = util.binaryStringToArrayBuffer(msg);
      msg = util.unpack(ab);
      self._handleMessage(msg);
    }
  };
};

// Handles an incoming message.
Reliable.prototype._handleMessage = function(msg) {
  var id = msg[1];
  var idata = this._incoming[id];
  var odata = this._outgoing[id];
  var data;
  switch (msg[0]) {
    // No chunking was done.
    case 'no':
      var message = id;
      if (!!message) {
        this.onmessage(util.unpack(message));
      }
      break;
    // Reached the end of the message.
    case 'end':
      data = idata;

      // In case end comes first.
      this._received[id] = msg[2];

      if (!data) {
        break;
      }

      this._ack(id);
      break;
    case 'ack':
      data = odata;
      if (!!data) {
        var ack = msg[2];
        // Take the larger ACK, for out of order messages.
        data.ack = Math.max(ack, data.ack);

        // Clean up when all chunks are ACKed.
        if (data.ack >= data.chunks.length) {
          util.log('Time: ', new Date() - data.timer);
          delete this._outgoing[id];
        } else {
          this._processAcks();
        }
      }
      // If !data, just ignore.
      break;
    // Received a chunk of data.
    case 'chunk':
      // Create a new entry if none exists.
      data = idata;
      if (!data) {
        var end = this._received[id];
        if (end === true) {
          break;
        }
        data = {
          ack: ['ack', id, 0],
          chunks: []
        };
        this._incoming[id] = data;
      }

      var n = msg[2];
      var chunk = msg[3];
      data.chunks[n] = new Uint8Array(chunk);

      // If we get the chunk we're looking for, ACK for next missing.
      // Otherwise, ACK the same N again.
      if (n === data.ack[2]) {
        this._calculateNextAck(id);
      }
      this._ack(id);
      break;
    default:
      // Shouldn't happen, but would make sense for message to just go
      // through as is.
      this._handleSend(msg);
      break;
  }
};

// Chunks BL into smaller messages.
Reliable.prototype._chunk = function(bl) {
  var chunks = [];
  var size = bl.size;
  var start = 0;
  while (start < size) {
    var end = Math.min(size, start + this._mtu);
    var b = bl.slice(start, end);
    var chunk = {
      payload: b
    }
    chunks.push(chunk);
    start = end;
  }
  util.log('Created', chunks.length, 'chunks.');
  return chunks;
};

// Sends ACK N, expecting Nth blob chunk for message ID.
Reliable.prototype._ack = function(id) {
  var ack = this._incoming[id].ack;

  // if ack is the end value, then call _complete.
  if (this._received[id] === ack[2]) {
    this._complete(id);
    this._received[id] = true;
  }

  this._handleSend(ack);
};

// Calculates the next ACK number, given chunks.
Reliable.prototype._calculateNextAck = function(id) {
  var data = this._incoming[id];
  var chunks = data.chunks;
  for (var i = 0, ii = chunks.length; i < ii; i += 1) {
    // This chunk is missing!!! Better ACK for it.
    if (chunks[i] === undefined) {
      data.ack[2] = i;
      return;
    }
  }
  data.ack[2] = chunks.length;
};

// Sends the next window of chunks.
Reliable.prototype._sendWindowedChunks = function(id) {
  util.log('sendWindowedChunks for: ', id);
  var data = this._outgoing[id];
  var ch = data.chunks;
  var chunks = [];
  var limit = Math.min(data.ack + this._window, ch.length);
  for (var i = data.ack; i < limit; i += 1) {
    if (!ch[i].sent || i === data.ack) {
      ch[i].sent = true;
      chunks.push(['chunk', id, i, ch[i].payload]);
    }
  }
  if (data.ack + this._window >= ch.length) {
    chunks.push(['end', id, ch.length])
  }
  chunks._multiple = true;
  this._handleSend(chunks);
};

// Puts together a message from chunks.
Reliable.prototype._complete = function(id) {
  util.log('Completed called for', id);
  var self = this;
  var chunks = this._incoming[id].chunks;
  var bl = new Blob(chunks);
  util.blobToArrayBuffer(bl, function(ab) {
    self.onmessage(util.unpack(ab));
  });
  delete this._incoming[id];
};

// Ups bandwidth limit on SDP. Meant to be called during offer/answer.
Reliable.higherBandwidthSDP = function(sdp) {
  // AS stands for Application-Specific Maximum.
  // Bandwidth number is in kilobits / sec.
  // See RFC for more info: http://www.ietf.org/rfc/rfc2327.txt

  // Chrome 31+ doesn't want us munging the SDP, so we'll let them have their
  // way.
  var version = navigator.appVersion.match(/Chrome\/(.*?) /);
  if (version) {
    version = parseInt(version[1].split('.').shift());
    if (version < 31) {
      var parts = sdp.split('b=AS:30');
      var replace = 'b=AS:102400'; // 100 Mbps
      if (parts.length > 1) {
        return parts[0] + replace + parts[1];
      }
    }
  }

  return sdp;
};

// Overwritten, typically.
Reliable.prototype.onmessage = function(msg) {};

module.exports.Reliable = Reliable;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

var BinaryPack = __webpack_require__(3);

var util = {
  debug: false,
  
  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  pack: BinaryPack.pack,
  unpack: BinaryPack.unpack,
  
  log: function () {
    if (util.debug) {
      var copy = [];
      for (var i = 0; i < arguments.length; i++) {
        copy[i] = arguments[i];
      }
      copy.unshift('Reliable: ');
      console.log.apply(console, copy);
    }
  },

  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    // Like setTimeout, but only takes a function argument.	 There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }		

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(this)),
  
  blobToArrayBuffer: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
  },
  blobToBinaryString: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsBinaryString(blob);
  },
  binaryStringToArrayBuffer: function(binary) {
    var byteArray = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  },
  randomToken: function () {
    return Math.random().toString(36).substr(2);
  }
};

module.exports = util;


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = DataSource;
function DataSource({
  connection,
  onOpen,
  onData,
  onClose,
  onError
}) {
  connection.on('open', () => {
    onOpen();
    connection.on('data', onData);
  });

  connection.on('close', () => {
    connection.close();
    onClose();
  });

  connection.on('error', onError);
  window.onbeforeunload = () => connection.close();

  this.connection = connection;
}

/***/ })
/******/ ]);