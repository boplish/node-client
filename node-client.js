require('./js/boplish.min.js');
require('./adapter.js'); // include after boplish min to overwrite RTCPeerConnection

var BopPingProto = require('./js/protocols.ping.js');

var bootstrapNode = process.argv[2];

var bopclient = new BOPlishClient(bootstrapNode, function(msg) {
    process.send({type: 'system', error: null, id: bopclient.bopid});
    // Register protocols
	new BopPingProto(bopclient);
}, function(err) {
    process.send({type: 'system', error: err, id: null});
});

bopclient.setMonitorCallback(function(payload) {
	process.send({type: 'boplishMessage', payload: payload});
});
