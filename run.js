#!/usr/bin/env node

/**
 * Module dependencies
 */
var logger = require('winston');
var program = require('commander');
var fork = require('child_process').fork;
var restify = require('restify');

/** 
 * Module configuration
 */
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {'timestamp': true, 'colorize': true});
program
    .version('0.0.2')
    .option('-b, --bootstrap <URI>', 'Bootstrap Host information', String, 'wss://127.0.0.1/')
    .option('-l, --listen <IP:port>', 'Listener IP', String, '127.0.0.1:8080')
    .parse(process.argv);

var bootstrapNode = program.bootstrap;
var listen = program.listen;
var listenIP = listen.substring(0,listen.indexOf(':'));
var listenPort = listen.substring(listen.indexOf(':') + 1);
var server = restify.createServer();
server.use(restify.CORS());

var peers = {};

var Mediator = function() {};
Mediator.prototype = {
    websocket: null,
    send: function(msg) {
        try {
            this.websocket.send(msg);
        } catch(e) {
            // WS not ready yet
        }
    }
}
var mediator = new Mediator();

server.post('/peer', rest_startPeer);
server.del('/peer/:id', rest_abortPeer);
server.get('/peer/:id', rest_getStatusOfPeer);
server.get('/listAllIds', rest_listAllIds);
server.get('/killAll', rest_killAll);
server.get('/getLogHandler', rest_registerLogHandler);

function killPeer(peerId) {
    if (typeof(peers[peerId]) !== 'undefined') {
        var peer = peers[peerId];
        peer.process.kill();no
        delete peers[peerId];
        return peer;
    } else {
        return Error('invalid id: ' + peerId);
    }
}

function rest_startPeer(req, res, next) {
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
            mediator.send(msg);
        }
    });
}

function rest_abortPeer(req, res, next) {
    var peer = killPeer(req.params.id);
    var response = {
        id: peer.id,
        status: 'killed'
    }
    res.send(response);
    next();
}

function rest_getStatusOfPeer(req, res, next) {
    if (typeof(peers[req.params.id]) === 'undefined') {
        res.send('invalid id ' + req.params.id);
        return next();
    }
    var peer = peers[req.params.id];
    var response = {
        id: req.params.id,
        started: peer.started,
        boostrapNode: peer.bootstrapNode
    }
    res.send(response);
    next();
}

function rest_listAllIds(req, res, next) {
    var keys = [];
    for(var k in peers) {
        keys.push(k);
    }
    res.send(keys);
    next();
}

function rest_killAll(req, res, next) {
    for(var k in peers) {
        killPeer(k);
    }
    res.send({status: 'All Peers killed'});
    next();
}

function rest_registerLogHandler(req, res, next) {
    if (!res.claimUpgrade) {
        next(new Error('Connection Must Upgrade For WebSockets'));
        return;
    }

    var upgrade = res.claimUpgrade();
    mediator.websocket = ws.accept(req, upgrade.socket, upgrade.head);
    next(false);
}

server.listen(listenPort, function() {
    logger.info('BOPlish host listening on ' + listenIP + ':' + listenPort);
});
