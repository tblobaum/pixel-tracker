
var express = require('express')
  , tracker = require('../')
  , app = express.createServer()

app.configure(function () {
  app.use(express.cookieParser())
})

tracker
  .use(function (error, result) {
    console.log(JSON.stringify(result, null, 2))
  })
    .configure({
    cookieName: '_myCookies', ip: true,
    noRefreshPath: '/norefresh'
});

app.all('/pixel', tracker.middleware)
app.all('/norefresh', tracker.middleware)

app.listen(process.argv[2] || 3000)
