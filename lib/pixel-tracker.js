
/* 
 * Analytics Machine
 *
 * Copyright(c) Thomas Blobaum
 * http://analyticsmachine.com/license
 *
 */


var fs = require('fs')
  , pixel = fs.readFileSync(__dirname + '/pixel.gif')
  
module.exports = {
  pixel: pixel,
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

