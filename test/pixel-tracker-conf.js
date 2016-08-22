var express = require('express')
    , test = require('tap').test
    , tracker = require('../')
    , http = require('http')
    , server
    , app
    , count = 0

test('testing pixel tracker', function (t) {

    app = express.createServer()

    app.configure(function () {
        app.use(express.cookieParser())
    })

    tracker
        .use(function (e, res) {
            count++
            console.log("penis");
            if(res.path !== '/norefresh'){
                t.type(res.cookies._myCookies, 'string', '_myCookies should be created for all request')
            }else{
                t.type(res.cookies._myCookies, 'undefined', '_myCookies should be undefined because its not extended')
            }
            t.type(res.decay, 'number', 'Decay is a number')
            t.notOk(res.ua, 'For testing, user agent browser should be false')
            t.type(res.host, 'string', 'host should valid')
            t.type(res.domain, 'string', 'domain should valid')
            t.type(res.geo.ip, 'string', 'ip should valid')
            if(count === 2){
                t.end()
            }

        })
        .configure({
            cookieName: '_myCookies',
            noRefreshPath: '/norefresh'
        });

    app.all('/pixel', tracker.middleware)
    app.all('/norefresh', tracker.middleware)
    server = app.listen(3000)

    http.get({
        host : 'localhost'
        , port : 3000
        , path : '/norefresh'
        , agent : false
    }, function () {
        http.get( {
            host : 'localhost'
            , port : 3000
            , path : '/pixel'
            , agent : false}, function () {
            server.close()
        })

    })

})
