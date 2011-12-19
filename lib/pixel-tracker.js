/* 
 * Analytics Machine
 *
 * Copyright(c) Thomas Blobaum
 * http://analyticsmachine.com/license
 *
 */


var fs = require('fs')
  , crypto = require('crypto')
  , qs = require('querystring')
  , url = require('url')
  , pixel = fs.readFileSync(__dirname + '/pixel.gif')
  , _ = require('underscore')
  , fns = []
 
function use (fn) {
  if (typeof fn === 'function') {
    fns.push(fn)
  }
  return module.exports
}

function middleware (req, res, next) {

  if (!req.cookies && !req.cookies._tracker) {
    res.cookie('_tracker', _getUserToken(), { 
      expires: new Date(Date.now() + 900000), 
      httpOnly: true 
    })
    req.cookies._tracker = res.cookie('_tracker')
  }

  res.header('x-pixel-tracker', 'Tracking ::'+req.cookies['_tracker']
    +':: on '+req.headers.host+'. That came from '+req.headers.referrer
    +' at the time, '+ (+new Date()) )

  var response = {
    decay: _getDecay(req.query.decay)
    , useragent: _getAgent(req.headers['user-agent'])
    , cookies: req.cookies || {}
    , language: _getLanguage()
    , cache: qs.parse(req.headers['cache-control']) || {}
    , host: req.headers.host
    , domain: url.parse(fixHref(req.headers.host)).hostname
    , geo: { ip: _getRemoteAddress() }
    , referer: (req.headers.referer || req.headers.referrer || '')
  }
  
  res.end(pixel, 'binary')
  
  forEachAsync(fns, function (next, item, i, arr) {
    item(null, _.extend(response, req.query))
    next()
  })
  
  function _getLanguage () {
    var lang = req.headers['accept-language'].split(';') || ''
      , format = lang[0].split(',')
    format.push(qs.parse(lang[1]))
    return format    
  }
  
  function _getRemoteAddress () {
    var rc = req.connection
      , ra = 'remoteAddress'
    if (req.socket && req.socket[ra]) {
      return req.socket[ra]
    }
    else if (rc && rc[ra]) {
      return rc[ra]
    }
    else if (rc && rc.socket && rc.socket[ra]) {
      return rc.socket[ra]
    }
    else {
      return '0.0.0.0'
    }
  }

  function _getUserToken () {
    var md5sum = crypto.createHash('md5')
    var val = String(Math.random())
    md5sum.update(val)
    return md5sum.digest('hex')
  }

  function _getDecay (decay) {
    if (typeof decay !== undefined) {
      return +new Date() + (1000 * 60 * 5)
    }
    else {
      return decay
    }
  }

  function _getAgent (userAgent, elements) {
  
    // If userAgent is undefined return browser: false
    if(typeof userAgent === 'undefined')
      return {browser: false, version: ''}


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
          return {browser:browser, version:version}
        }
      }
    }
    return null
  }
  
  function fixHref (str, callback) {
    if (!str) {
      callback && callback(false, '')
      return ''
    }
    if (str.match(/^http:\/\//) ) str = str.substring(7)
    if (str.match(/^https:\/\//) ) str = str.substring(8)
    if (str.match(/^www\./)) str = str.substring(4)
    if (!/http:/.test(str) && !/https:/.test(str)) str = 'http://' + str
    callback && callback(false, str)
    return str
  }
  

}

function forEachAsync (arr, callback) {
  var sequence = Sequence()
  function handleItem(item, i, arr) {
    sequence.then(function (next) {
      callback(next, item, i, arr)
    })
  }
  arr.forEach(handleItem)
  return sequence
}

module.exports = {
  use: use,
  middleware: middleware
}

