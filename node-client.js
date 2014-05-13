require('./js/boplish.min.js');
var BopPingProto = require('./js/protocols.ping.js');

var bootstrapNode = process.argv[2];

var bopclient = new BOPlishClient(bootstrapNode, function(msg) {
    process.send({error: null, id: bopclient.id});
}, function(err) {
    process.send({error: err, id: null});
});

// Register protocols
new BopPingProto(bopclient);
