
/* 
 * Analytics Machine
 *
 * Copyright(c) Thomas Blobaum
 * http://analyticsmachine.com/license
 *
 */


var fs = require('fs')

var pixeltracker = {
  pixel: fs.readFileSync('./pixel.gif'),
  middleware: function middleware (req, res, next) {
    res.header('x-pixel-tracker', 
      'Tracking user '
      +req.cookies['_tracker']
      +' on '
      +req.connection.host
      +'. That came from '
      +request.referer
      +' at the time, '
      +new Date(request.time).getDate()
      +'. /'
      )
    res.end(pixel, 'binary')
  }
}

module.exports = pixeltracker
