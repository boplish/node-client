var util = require('util');
var webrtc = require('wrtc');
var WebSocketClient = require('websocket').client;

RTCPeerConnection = function() {
    webrtc.RTCPeerConnection.call(this);
    var that = this;
    (function checkIceState() {
        setTimeout(function() {
            if (that.iceGatheringState === 'complete') {
                var nullCandidate = new RTCIceCandidate();
                nullCandidate.candidate = null;
                that.onicecandidate(nullCandidate);
            } else {
                checkIceState();
            }
        }, 1000).unref();
    })(); // miserable hack, waiting for https://github.com/js-platform/node-webrtc/issues/44
};
util.inherits(RTCPeerConnection, webrtc.RTCPeerConnection);

RTCIceCandidate = webrtc.RTCIceCandidate;
RTCSessionDescription = webrtc.RTCSessionDescription;
DataChannel = webrtc.DataChannel;

var CustomWebSocket = function(url) {
    if (!(this instanceof WebSocket)) {
        return new CustomWebSocket(url);
    }
    var websocketClient = new WebSocketClient();
    var that = this;
    websocketClient.on('connect', function(connection) {
        connection.on('message', function(msg) {
            msg.data = msg.utf8Data;
            that.onmessage(msg);
        });
        that.send = function(msg) {
            connection.send(msg);
        };
    });
    websocketClient.on('connect', function(msg) {
        that.onopen(msg);
    });
    websocketClient.on('error', function(err) {
        that.onerror(err);
    });
    websocketClient.on('connectFailed', function(err) {
        that.onerror(err);
    });
    websocketClient.on('close', function(err) {
        that.onclose(msg);
    });
    setTimeout(function() { // break event loop to set callbacks
        websocketClient.connect(url);
    }, 0);

    return this;
};

CustomWebSocket.prototype = {
    onopen: function() {},
    onerror: function(err) {},
    onmessage: function(msg) {},
    onclose: function(msg) {},
    send: function(msg) {},
    close: function() {}
};

WebSocket = CustomWebSocket;
