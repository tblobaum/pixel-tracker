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
  , Sequence = require('sequence')
  , fns = []
 
function use (fn) {
  if (typeof fn === 'function') {
    fns.push(fn)
  }
  return module.exports
}

function middleware (req, res, next) {

  if (!req.cookies || !req.cookies._tracker) {
    _getUserToken(function (e, token) {
      req.cookies._tracker = token
      res.cookie('_tracker', req.cookies._tracker, { 
        expires: new Date(Date.now() + 900000), 
        httpOnly: true 
      })
      res.end(pixel, 'binary')
    })
  }
  
  else {
    res.end(pixel, 'binary')
  }

  var response = { 
    cookies: req.cookies
    , host: req.headers.host
    , cache: qs.parse(req.headers['cache-control']) || {}
    , referer: (req.headers.referer || req.headers.referrer || '')
    , params: (req.params || {})
  }

  _getDecay(req.query.decay, function (e, decay) {
    response.decay = decay
    
    _getAgent(req.headers['user-agent'], 2, function (e, useragent) {
      response.useragent = useragent
      
      _getLanguage(function (e, language) {
        response.language = language
        
        _getRemoteAddress(function (e, remoteAddress) {
          response.geo = { ip: remoteAddress }
          
          _fixHref(req.headers.host, function (e, href) {
            response.domain = url.parse(href).hostname
            
            _flush(_.extend(response, req.query))
            
          })
        })
      })
    })
  })
  
  function _flush (res) {
    forEachAsync(fns, function (next, item, i, arr) {
      item(null, res)
      next()
    })
  }
  
  function _getLanguage (callback) {
    var lang = req.headers['accept-language'] || ''
    lang = lang.split(';') || ''
      , format = lang[0].split(',')
    format.push(qs.parse(lang[1]))
    callback(null, format)
  }
  
  function _getRemoteAddress (callback) {
    var rc = req.connection
      , ra = 'remoteAddress'
    if (req.socket && req.socket[ra]) {
      callback(null, req.socket[ra])
    }
    else if (rc && rc[ra]) {
      callback(null, rc[ra])
    }
    else if (rc && rc.socket && rc.socket[ra]) {
      callback(null, rc.socket[ra])
    }
    else {
      callback(null, '0.0.0.0')
    }
  }

  function _getUserToken (callback) {
    var md5sum = crypto.createHash('md5')
    var val = String(Math.random())
    md5sum.update(val)
    callback(null, md5sum.digest('hex'))
  }

  function _getDecay (decay, callback) {
    if (typeof decay == 'undefined') {
      callback(null, +new Date() + (1000 * 60 * 5))
    }
    else {
      callback(null, decay)
    }
  }

  function _getAgent (userAgent, elements, callback) {
  
    // If userAgent is undefined return browser: false
    if(typeof userAgent === 'undefined')
      return callback({browser: false, version: ''})
      

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
          callback(null, {browser:browser, version:version})
        }
      }
    }
  }
  
  function _fixHref (str, callback) {
    if (!str) {
      callback(new Error('fixHref requires a string as the first parameter'))
    }
    else {
    if (str.match(/^http:\/\//) ) str = str.substring(7)
    if (str.match(/^https:\/\//) ) str = str.substring(8)
    if (str.match(/^www\./)) str = str.substring(4)
    if (!/http:/.test(str) && !/https:/.test(str)) str = 'http://' + str
      callback(false, str)
    }
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

