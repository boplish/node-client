require('./js/boplish.min.js');
require('./adapter.js'); // include after boplish min to overwrite RTCPeerConnection

var BopPingProto = require('./js/protocols.ping.js');

var bootstrapNode = process.argv[2];

var bopclient = new BOPlishClient(bootstrapNode, function(msg) {
    process.send({type: 'system', error: null, id: bopclient.id});
    // Register protocols
	new BopPingProto(bopclient);
}, function(err) {
    process.send({error: err, id: null});
});

bopclient.setMonitorCallback(function(from, payload) {
	process.send({type: 'boplishMessage', from: from, payload: payload});
});
