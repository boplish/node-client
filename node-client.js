#!/usr/bin/env node

/**
 * Module dependencies
 */
require('./js/boplish.min.js');
var BopPingProto = require('./js/protocols.ping.js');
var logger = require('winston');
var program = require('commander');

/** 
 * Module configuration
 */
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {'timestamp': true, 'colorize': true});
program
    .version('0.0.1')
    .option('-h, --host <ip>', 'Bootstrap Host address', String, '127.0.0.1')
    .option('-p, --port <port>', 'Bootstrap Host port', Number, 5000)
    .option('-c, --count <count>', 'Number of clients to spawn', Number, 1)
    .parse(process.argv);

var bootstrapNode = program.host + ':' + program.port;

function spawnBopClients(quantity, onsuccess, onerror) {
    if (quantity <= 0) {
        if (typeof(onsuccess) === 'function') {
            onsuccess();
        }
        return;
    }

    var bopclient = new BOPlishClient(bootstrapNode, function(msg) {
        logger.info(bopclient.id, 'spawned');
        process.nextTick(function() {
            spawnBopClients(--quantity, onsuccess, onerror);
        });
    }, function(err){
        if (typeof(onerror) === 'function') {
            onerror(err);
        }
    });

    // Register protocols
    new BopPingProto(bopclient);
}

logger.info('Spawning ' + program.count + ' BOPlish client(s) using ' + bootstrapNode + ' as bootstrap server');
spawnBopClients(
    program.count,
    function(msg){
        logger.info('All BOPlish clients spawned');
    }, function(err){
        logger.error('Could not spawn all BOPlish clients');
});
