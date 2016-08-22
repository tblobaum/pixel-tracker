var fs = require('fs')
  , crypto = require('crypto')
  , qs = require('querystring')
  , url = require('url')
  , pixel = fs.readFileSync(__dirname + '/pixel.gif')
  , fns = []
  , conf = { disable_cookies : false, maxAge: 2592000000, cookieName: '_tracker', ip: false,
  noRefreshPath: ''}
 
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
  if (!conf.disable_cookies && (!req.cookies || !req.cookies[conf.cookieName])
      && req.path !== conf.noRefreshPath) {
    _getUserToken(function (e, token) {
      req.cookies[conf.cookieName] = token
      res.cookie(conf.cookieName, req.cookies[conf.cookieName], {
          maxAge : conf.maxAge
        , httpOnly : true 
      })
      res.end(pixel, 'binary')
    })
  }
  else {
    res.end(pixel, 'binary')
  }
  
  var response = { 
      cookies : req.cookies || req.headers.cookies || {}
    , host : req.headers.host
    , path : req.path
    , cache : qs.parse(req.headers['cache-control']) || {}
    , referer : (req.headers.referer || req.headers.referrer || 'direct')
    , params : (req.params || {})
  }

  if(conf.ip === true){
    response.ip = req.ip
  }
  req.query = req.query || {}

  _getDecay(req.query.decay, function (e, decay) {
    response.decay = decay
    
    _getAgent(req.headers['user-agent'], 2, function (e, useragent) {
      response.useragent = useragent
      
      _getLanguage(function (e, language) {
        response.language = language
        
        _getRemoteAddress(function (remoteAddress) {
          response.geo = { ip : remoteAddress }
          
          _fixHref(req.headers.host, function (e, href) {
            response.domain = url.parse(href).hostname

            _flush(extend(response, req.query))
            
          })
        })
      })
    })
  })

  function _flush (res) {
    each(fns, function (fn, i, done) { 
      fn(null, res)
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
      console.log('ERR: no remoteAddress')
      callback(null)
    }
  }

  function _getUserToken (callback) {
    var md5sum = crypto.createHash('md5')
    var val = String(Math.random())
    md5sum.update(val)
    callback(null, md5sum.digest('hex'))
  }

  function _getDecay (decay, callback) {
    if (typeof decay === 'undefined') {
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
    if (typeof elements === 'undefined') {
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

// each(array, function (item, i, done) { }, function () { })
function each (array, iterator, cb) {
  var len = array.length
  array.forEach(function (item, i) {
    iterator.call(null, item, i, done)
  })
  function done () {
    if (!--len) {
      return cb && cb()
    }
  }
}

module.exports = {
    use : use
  , configure : configure
  , middleware : middleware
}
