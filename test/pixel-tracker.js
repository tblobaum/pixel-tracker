var test = require("tap").test
var pixelTracker = require("../") //Load the parent directory, looks for index.js 
var connect = require("connect")
var http = require('http')

test("testing pixel tracker",function(t){

  var server = connect.createServer(connect.cookieParser())

  server.use(
    connect.router(function(app){
      app.get('/pixel',pixelTracker.middleware)
    })
  )

  server.listen(3000)

  pixelTracker.use(function(e,res){
    console.log(res)
  })


  http.get({host:'localhost',port:3000,path:'/pixel',agent:false},function(res){
    console.log("response from the pixel tracker...")
  })

  t.end()
})
