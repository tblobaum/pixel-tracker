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
  , Sequence = require('sequence')
  , fns = []
  , conf = {
      disable_cookies: false  
    }
 
function use (fn) {
  if (typeof fn === 'function') {
    fns.push(fn)
  }
  return module.exports
}

function configure (obj) {
  if (typeof obj === 'object') {
    extend(conf, obj)
  } 
  return module.exports
}

function middleware (req, res, next) {

  if (!conf.disable_cookies && (!req.cookies || !req.cookies._tid)) {
    _getUserToken(function (e, token) {
      req.cookies._tid = token
      res.cookie('_tid', req.cookies._tid, { 
        expires: new Date(Date.now() + 315569259747), 
        httpOnly: true 
      })
      console.log('info: pixel')
      res.end(pixel, 'binary')
    })
  }
  
  else {
    console.log('info: pixel')
    res.end(pixel, 'binary')
  }

  var response = { 
    _tid: req.cookies._tid
//    , host: req.headers.host
    , cache: qs.parse(req.headers['cache-control']) || {}
    , domain: (req.headers.referer || req.headers.referrer || null)
    , params: (req.params || {})
  }

  if (response.domain === null) 
    response.domain = req.query.domain || 'unknown'

  _getExpires(req.query.expires, function (e, expires) {
    response.expires = expires
    
    //_getAgent(req.headers['user-agent'], 2, function (e, useragent) {
      //response.useragent = useragent
      
      _getLanguage(function (e, language) {
        response.language = language
      console.log('info: ???')
        
        _getRemoteAddress(function (ip) {
          response.ip = ip
          
          _fixHref(response.domain, function (e, href) {
            response.domain = url.parse(href).hostname
            _flush(extend(response, req.query))
            
          })
        })
      })
    //})
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
    if (req.socket && req.socket.remoteAddress) 
      callback(req.socket.remoteAddress)
    else if (rc) 
      if (rc.remoteAddress)
        callback(rc.remoteAddress)
      else if (rc.socket && rc.socket.remoteAddress) 
        callback(rc.socket.remoteAddress)
    else {
      console.log('erro: no ip')
      callback(null)
    }
  }

  function _getUserToken (callback) {
    var md5sum = crypto.createHash('md5')
    var val = String(Math.random())
    md5sum.update(val)
    callback(null, md5sum.digest('hex'))
  }

  function _getExpires (expires, callback) {
    if (typeof expires == 'undefined') {
      expires = +new Date() + (1000 * 60 * 5)
      callback(null, expires)
    }
    else 
      callback(null, expires)
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

function extend (d) {
  var callback = Array.prototype.slice.call(arguments).pop()
    , b = arguments, c, i = 1
  for (var len = b.length; i < len; i++) for (var e in c = b[i]) d[e] = c[e]
  if (typeof callback == 'function') callback(null, d) 
  else return d
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
  configure: configure,
  middleware: middleware
}

