pixel-tracker  [![Build Status](https://secure.travis-ci.org/analytics-machine/pixel-tracker.png)](http://travis-ci.org/analytics-machine/pixel-tracker)
=============
A simple pixel-tracker for node.js


Example
-------

Collect any data with parameters, along with some defaults

```javascript

var tracker = require('pixel-tracker')

tracker.use(function (e, res) {
  console.log(res)
  
  /*
    { 
      host: 'localhost:3000',
      domain: 'localhost',
      path: '/pixel',
      geo: { ip: '127.0.0.1' } 
      ua: { browser: 'Chrome', version: '13.0' },
      cookies: { _tracker: '0rc8ba4t9fgjp9hz' },
      language: 'en-US,en;q=0.8',
      cache: 'max-age=0',
    }
  */

})

// ..

app.all('/pixel', tracker.middleware)

app.listen()

````

Install
-------

`npm install pixel-tracker`


License
-------

MIT

