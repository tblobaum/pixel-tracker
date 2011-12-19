var express = require('express');
var test = require("tap").test
var pixelTracker = require("../") //Load the parent directory, looks for index.js 
var http = require('http')

test("testing pixel tracker",function(t){

  var app = module.exports = express.createServer();

  app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
  });

  pixelTracker
    .use(function(e,res){
      t.type(res.decay,'number','Decay is a number')
      t.type(res.cookies._tracker,'string','_tracker should be created for all request')
      t.notOk(res.ua,'For testing, user agent browser should be false')
      t.type(res.host,'string','host should valid')
      t.type(res.domain,'string','domain should valid')
      t.type(res.geo.ip,'string','ip should valid')
    })
    .use(function(e,res){
      t.type(res.decay,'number','Decay is a number')
      t.type(res.cookies._tracker,'string','_tracker should be created for all request')
      t.notOk(res.ua,'For testing, user agent browser should be false')
      t.type(res.host,'string','host should valid')
      t.type(res.domain,'string','domain should valid')
      t.type(res.geo.ip,'string','ip should valid')
      t.end()
    })

  app.all('/pixel',pixelTracker.middleware)
  app.listen(3000);

  http.get({host:'localhost',port:3000,path:'/pixel',agent:false},function(res){
    // Stop the server
    process.exit(0)
  })
})
