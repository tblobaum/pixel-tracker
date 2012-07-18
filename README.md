# pixel-tracker  
A simple pixel-tracker for node.js

[![Build Status](https://secure.travis-ci.org/tblobaum/pixel-tracker.png)](http://travis-ci.org/tblobaum/pixel-tracker)

# Example

Collect some data with parameters, along with the defaults

``` js

var tracker = require('pixel-tracker')

tracker.use(function (error, result) {
  console.log(result)
  
  /*
  {
    "cookies": { "_tracker": "58f911166e6d31041eba8d06e11e3f77" },
    "host": "localhost:3000",
    "cache": { "max-age": "0" },
    "referer": "direct",
    "params": [],
    "decay": 1342597993859,
    "useragent": { "browser": "Chrome", "version": "20.0" },
    "language": [ "en-US", "en", { "q": "0.8" } ],
    "geo": { "ip": "127.0.0.1" },
    "domain": "localhost"
  }
  */

})

// ..

app.all('/pixel', tracker.middleware)

app.listen()

```

# Methods

``` js
var tracker = require('pixel-tracker')
```

## tracker.use(callback)

The `callback` function is called with `error`, `result`. Multiple callbacks can be used.

## tracker.configure(options)

pixel-tracker has a few configurable options.

`disable_cookies` defaults to false
`expires` defaults to 15 minutes, which may not be desirable based on your use case

## tracker.middleware(request, response)
A function to be called for each http request which calls `response.end` with a 1x1 pixel for every request and then calls all the functions provided with `tracker.use`. This works out of the box with express and would also work with any vanilla http server as long as a cookies implementation is provided for the response object (or cookies are disabled)

``` js

var tracker = require('pixel-tracker')

tracker
  .use(function (error, result) {
    // do something with result
    // ...

  })
  .configure({ disable_cookies : true })

require('http').createServer(tracker.middleware).listen(3000)

```

# Install

`npm install pixel-tracker`

# Tests

`npm install -g tap && npm test`

# License

MIT

