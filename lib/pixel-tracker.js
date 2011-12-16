
/* 
 * Analytics Machine
 *
 * Copyright(c) Thomas Blobaum
 * http://analyticsmachine.com/license
 *
 */


var fs = require('fs')
  , pixel = fs.readFileSync(__dirname + '/pixel.gif')
  , _ = require('underscore')
  
module.exports = {
  pixel: pixel,
  middleware: middleware
}

function middleware (callback) {

  return function (req, res, next) {

    if (!res.cookie('_tracker')) {
      res.cookie('_tracker', makeUserToken(), { 
        expires: new Date(Date.now() + 900000), 
        httpOnly: true 
      })
    }

    res.header('x-pixel-tracker', 'Tracking ::'+req.cookies['_tracker']
      +':: on '+req.headers.host+'. That came from '+req.headers.referrer
      +' at the time, '+new Date().getDate())

    res.end(pixel, 'binary')
    callback(null, _.extend({
          'decay': makeDecay(req.query.decay)
          'agent': identifyBrowser(req.headers['user-agent'])
        }
        , req.query
        , req.cookie
        , req.headers
      )
    )
    
  }
}

function makeUserToken (val) {
  var md5sum = crypto.createHash('md5')
  val = val || String(Math.random())
  md5sum.update(val)
  return md5sum.digest('hex')
}

function makeDecay (decay) {
  decay = return decay || +new Date()
  return decay + (1000 * 60 * 5)
}

function identifyBrowser (userAgent, elements) {
  var regexps = {
    'Chrome': [ /Chrome\/(\S+)/ ],
    'Firefox': [ /Firefox\/(\S+)/ ],
    'MSIE': [ /MSIE (\S+);/ ],
    'Opera': [
      /Opera\/.*?Version\/(\S+)/,     /* Opera 10 */
      /Opera\/(\S+)/                  /* Opera 9 and older */
    ],
      'Safari': [ /Version\/(\S+).*?Safari\// ]
    }
    , re
    , m
    , browser
    , version
  if (elements === undefined) {
    elements = 2
  }
  else if (elements === 0) {
    elements = 1337
  }
  for (browser in regexps) {
    while (re = regexps[browser].shift()) {
      if (m = userAgent.match(re)) {
        version = (m[1].match(new RegExp('[^.]+(?:\.[^.]+){0,' + --elements + '}')))[0];
        return browser + ' ' + version
      }
    }
  }
  return null
}

function extend(object) {
    var other = slice.call(arguments, 1);
    other.forEach(copyProperties);
    return object;

    function copyProperties(source) {
        Object.getOwnPropertyNames(source).forEach(copyProperty);

        function copyProperty(name) {
            object[name] = source[name];
        }
    }
}


