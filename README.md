## parse-cloud

Express middleware and utilities for Parse.com Cloud Code functionality in Node.js

### Getting started

Add parse-cloud as a dependency to your `package.json` file:

```
  ...
  "dependencies": {
    "parse-cloud": "~1.0"
  }
  ...
```

From any file that uses Cloud Code, require the module:

```
var Parse = require('parse-cloud').Parse;
```

From your main Node app, require the root parse-cloud module, require your cloud code file(s), and mount the provided Express app on some path:

```
// ...

var ParseCloud = require('parse-cloud');
require('./cloud/main.js');  // After this, ParseCloud.app will be a configured Express app.

// Mount the cloud code webhook routes on your main Express app:
app.use('/webhooks', ParseCloud.app);

// ...
```

