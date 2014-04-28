BOPlish Node.js client
======================

This repository hosts a Node.js-based BOPlish client. Work in progress!

Installation & Usage
====================

Install deps by running `npm install` in the root folder of this repo. A running bootstrap-server instance is needed. 

    Usage: node-client [options]
    
    Options:
    
      -h, --help           output usage information
      -V, --version        output the version number
      -h, --host <ip>      Bootstrap Host address
      -p, --port <port>    Bootstrap Host port
      -c, --count <count>  Number of clients to spawn

Example
=======

Spawn 2 clients using chris.ac:5000 as bootstrap server.

    ./node-client.js -h chris.ac -p 5000 -c 2
