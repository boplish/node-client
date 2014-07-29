#!/usr/bin/env node

/**
 * Module dependencies
 */
var logger = require('winston');
var program = require('commander');
var fork = require('child_process').fork;

/** 
 * Module configuration
 */
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {'timestamp': true, 'colorize': true});
program
    .version('0.0.2')
    .option('-b, --bootstrap <URI>', 'Bootstrap Host information', String, 'wss://127.0.0.1/')
    .option('-c, --count <count>', 'Number of clients to spawn', Number, 1)
    .parse(process.argv);

var bootstrapNode = program.bootstrap;

function spawnBopClients(quantity, onsuccess, onerror) {
    if (quantity <= 0) {
        if (typeof(onsuccess) === 'function') {
            onsuccess();
        }
        return;
    }

    var client = fork('./node-client.js', [bootstrapNode]);
    client.on('message', function(msg) {
    	if (msg.error) {
    		onerror(msg.error);
    	} else {
    		logger.info(msg.id, 'spawned');
                spawnBopClients(--quantity, onsuccess, onerror);
    	}
    });
}

logger.info('Spawning ' + program.count + ' BOPlish client(s) using ' + bootstrapNode + ' as bootstrap server');
spawnBopClients(
    program.count,
    function(msg){
        logger.info('All BOPlish clients spawned');
    }, function(err){
        logger.error('Could not spawn all BOPlish clients');
});
