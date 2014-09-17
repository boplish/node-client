#!/usr/bin/env node

/**
 * Module dependencies
 */
var logger = require('winston');
var program = require('commander');
var fork = require('child_process').fork;
var restify = require('restify');
var Watershed = require('watershed').Watershed;

/** 
 * Module configuration
 */
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {'timestamp': true, 'colorize': true});
program
    .version('0.0.2')
    .option('-b, --bootstrap <URI>', 'Bootstrap Host information', String, 'wss://127.0.0.1/')
    .option('-p, --port <port>', 'Listen Port', String, '1337')
    .parse(process.argv);

var bootstrapNode = program.bootstrap;
var listenPort = program.port;
var startDate = new Date();
var server = restify.createServer({
    handleUpgrades: true
});
server.use(restify.CORS());

var peers = {};

var Mediator = function() {};
Mediator.prototype = {
    websocket: null,
    send: function(bopmsg) {
        // measure msg/sec
        try {
            var msg = {
                bopmsg: bopmsg,
                timestamp: new Date()
            };
            this.websocket.send(JSON.stringify(msg));
        } catch(e) {
            // WS not ready yet
        }
    },
    onmessage: function(msg) {
        console.log(msg);
    }
};
var mediator = new Mediator();

server.post('/peer', rest_startPeer);
server.del('/peer/:id', rest_abortPeer);
server.get('/peer/:id', rest_getStatusOfPeer);
server.get('/listAllIds', rest_listAllIds);
server.get('/peers', rest_listAllIds);
server.del('/killAll', rest_killAll);
server.get('/registerLogHandler', rest_registerLogHandler);
// server.get('/status', rest_getHostStatus);

function killPeer(peerId) {
    if (typeof(peers[peerId]) !== 'undefined') {
        var peer = peers[peerId];
        peer.process.kill();
        delete peers[peerId];
        return peer;
    } else {
        return Error('invalid id: ' + peerId);
    }
}

function rest_startPeer(req, res, next) {
    logger.info('rest_startPeer', req.params);
    var client = fork('./node-client.js', [bootstrapNode]);
    client.on('message', function(msg) {
        if (!msg || msg.error) {
            res.send(new Error(msg.error));
            next();
        } else if (msg.type === 'system'){
            logger.info(msg.id, 'spawned');
            peers[msg.id] = {};
            peers[msg.id].id = msg.id;
            peers[msg.id].process = client;
            peers[msg.id].started = new Date();
            peers[msg.id].bootstrapNode = bootstrapNode;
            res.send({id: msg.id});
            next();
        } else if (msg.type === 'boplishMessage') {
            mediator.send(msg.payload);
            //@todo: implement mediator
        }
    });
}

function rest_abortPeer(req, res, next) {
    logger.info('rest_abortPeer', req.params);
    var peer = killPeer(req.params.id);
    var response = {
        id: peer.id,
        status: 'killed'
    };
    res.send(response);
    next();
}

function rest_getStatusOfPeer(req, res, next) {
    logger.info('rest_getStatusOfPeer', req.params);
    if (typeof(peers[req.params.id]) === 'undefined') {
        res.send('invalid id ' + req.params.id);
        return next();
    }
    var peer = peers[req.params.id];
    var response = {
        id: req.params.id,
        started: peer.started,
        bootstrapNode: peer.bootstrapNode
    };
    res.send(response);
    next();
}

function rest_listAllIds(req, res, next) {
    logger.info('rest_listAllIds', req.params);
    var keys = [];
    for(var k in peers) {
        keys.push(k);
    }
    res.send(keys);
    next();
}

function rest_killAll(req, res, next) {
    logger.info('rest_killAll', req.params);
    for(var k in peers) {
        killPeer(k);
    }
    res.send({status: 'All Peers killed'});
    next();
}

function rest_registerLogHandler(req, res, next) {
    logger.info('rest_registerLogHandler', req.params);
    if (!res.claimUpgrade) {
        next(new Error('Connection Must Upgrade For WebSockets'));
        return;
    }

    var upgrade = res.claimUpgrade();
    var ws = new Watershed();
    mediator.websocket = ws.accept(req, upgrade.socket, upgrade.head);
    mediator.websocket.on('text', mediator.onmessage);
    next(false);
}

function rest_getHostStatus(req, res, next) {
    logger.info('rest_getHostStatus', req.params);
    res.send({status:'ok'});
    next();
}

server.listen(listenPort, function() {
    logger.info('BOPlish host listening on port ' + listenPort);
});

process.on('SIGTERM', function() {
    killPeersAndDie();
});

process.on('SIGINT', function() {
    killPeersAndDie();
});

function killPeersAndDie() {
    for(var k in peers) {
        console.log('killing', k);
        killPeer(k);
    }
    process.exit();    
}
