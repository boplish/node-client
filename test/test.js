var assert = require("should");
var exec = require('child_process').exec;
var restify = require('restify');
var boplishHost = exec(__dirname + '/../run.js --bootstrap ws://chris.ac:5000 --port 10000',
  function (error, stdout, stderr) {
	console.log('stdout: ' + stdout);
	console.log('stderr: ' + stderr);
	if (error !== null) {
	 console.log('exec error: ' + error);
    }
});


describe('BOPlish Emulation Host test', function() {
	this.timeout(5000);
	var restClient;
	it('should create client', function() {
		restClient = restify.createJsonClient({
			url: 'http://localhost:10000',
			version: '*'
		});
	});
	var peerId;
	it('should start Peer', function(done) {
		restClient.post('/peer', function(err, req, res, obj) {
			assert.ifError(err);
			peerId = obj.id;
			peerId.should.not.be.empty;
			done();
		});
	});
	it('should list Peer Ids Peer', function(done) {
		restClient.get('/peers', function(err, req, res, obj) {
			assert.ifError(err);
			obj.should.containEql(peerId);
			done();
		});
	});
	it('should get Peer status', function(done) {
		restClient.get('/peer' + '/' + peerId, function(err, req, res, obj) {
			assert.ifError(err);
			obj.id.should.not.be.empty;
			obj.started.should.not.be.empty;
			obj.bootstrapNode.should.not.be.empty;
			done();
		});
	});
	it('should stop Peer', function(done) {
		restClient.del('/peer' + '/' + peerId, function(err, req, res, obj) {
			assert.ifError(err);
			obj.id.should.not.be.empty;
			obj.status.should.equal('killed');
			done();
		});
	});
	it('should stop all Peers', function(done) {
		var peerId1, peerId2;
		restClient.post('/peer', function(err, req, res, obj) {
			assert.ifError(err);
			peerId1 = obj.id;
			restClient.post('/peer', function(err, req, res, obj) {
				assert.ifError(err);
				peerId2 = obj.id;
				restClient.del('/killAll', function(err, req, res, obj) {
					restClient.get('/listAllIds', function(err, req, res, obj) {
						assert.ifError(err);
						obj.should.be.empty;
						done();
					});
				});
			});
		});
	});
	it('should get Host status', function(done) {
		restClient.get('/status', function(err, req, res, obj) {
			assert.ifError(err);
			obj.startDate.should.not.be.empty;
			obj.bootstrapNode.should.not.be.empty;
			obj.numberOfPeers.should.equal(0);
			done();
		});
	});
	it('should request log handler');
	after(function() {
		boplishHost.kill();
	});
});