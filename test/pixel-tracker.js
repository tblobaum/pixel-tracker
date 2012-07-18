var express = require('express')
  , test = require('tap').test
  , tracker = require('../')
  , server
  , app

test('testing pixel tracker', function (t) {

  app = express.createServer()

  app.configure(function () {
    app.use(express.cookieParser())
  })

  tracker
    .use(function (e, res) {
      t.type(res.decay, 'number', 'Decay is a number')
      t.type(res.cookies._tracker, 'string','_tracker should be created for all request')
      t.notOk(res.ua, 'For testing, user agent browser should be false')
      t.type(res.host, 'string', 'host should valid')
      t.type(res.domain, 'string', 'domain should valid')
      t.type(res.geo.ip, 'string', 'ip should valid')
    })
    .use(function (e, res) {
      t.type(res.decay, 'number', 'Decay is a number')
      t.type(res.cookies._tracker, 'string', '_tracker should be created for all request')
      t.notOk(res.ua, 'For testing, user agent browser should be false')
      t.type(res.host, 'string', 'host should valid')
      t.type(res.domain, 'string', 'domain should valid')
      t.type(res.geo.ip, 'string', 'ip should valid')
      t.end()
    })

  app.all('/pixel', tracker.middleware)
  server = app.listen(3000)

  require('http').get({ 
      host : 'localhost'
    , port : 3000
    , path : '/pixel'
    , agent : false
  }, function () {
    server.close()
  })

})
