var tracker = require('../')

tracker
  .use(function (error, result) {
    console.log(result)
    // ...

  })
  .configure({ disable_cookies : true })

require('http').createServer(tracker.middleware).listen(3000)
