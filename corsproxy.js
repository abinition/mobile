var http = require('http');
var httpProxy = require('http-proxy') ;
var express = require('express') ;
var connect = require('connect') ;
	
var proxy = httpProxy.createServer();

var proxyOptions = {
	target: 'http://localhost:8080'
};

var app = express();

var allowCrossDomain = function(req, res, next) {

    res.header('Access-Control-Expose-Headers','X-AUTH-TOKEN');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization, X-Mindflash-SessionID, X-Auth-Token');
	  
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {

      res.sendStatus(200);

    }
    else {
      next();
    }
};

app.use(allowCrossDomain);

app.all('/*',  function (req, res) {
    return proxy.web(req, res, proxyOptions);
});

app.listen(8081,'192.168.11.104');