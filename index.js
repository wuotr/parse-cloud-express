/*
parse-cloud - This module adds the Parse.Cloud namespace to the Parse JS SDK,
  allowing some code previously written for Cloud Code to run in a Node environment.

Database triggers and cloud functions defined with Parse.Cloud methods will be wrapped 
  into an Express app, which can then be mounted on your main Express app.  These
  routes can then be registered with Parse via the Webhooks API.

See our example project

*/
var express = require('express');
var bodyParser = require('body-parser');
var Parse = require('parse/node').Parse;

var Routes = {
  'beforeSave': [],
  'afterSave': [],
  'function': []
};

// Make sure to set your Webhook key via heroku config set
var webhookKey = process.env.PARSE_WEBHOOK_KEY;

// Express middleware to enforce security using the Webhook Key
function validateWebhookRequest(req, res, next) {
  if (req.get('X-Parse-Webhook-Key') !== webhookKey) return errorResponse(res, 'Unauthorized Request.');
  next();
}

// Express middleware to inflate a beforeSave object to a Parse.Object
function inflateParseObject(req, res, next) {
  var object = req.body.object;
  var className = object.className;
  var parseObject = new Parse.Object(className);
  parseObject._finishFetch(object);
  req.body.object = parseObject;
  req.object = req.body.object;
  next();
}

function addParseResponseMethods(req, res, next) {
  res.success = function(data) {
    successResponse(res, data);
  };
  res.error = function(data) {
    errorResponse(res, data);
  };
  next();
}

// Express middleware to promote the cloud function params to the request object
function updateRequestFunctionParams(req, res, next) {
  req.params = req.body.params;
  next();
}

// Express middleware to inflate a Parse.User if one is passed to the webhook via the 'user' key
function inflateParseUser(req, res, next) {
  if (req.body.user) {
    console.log(req.body);
    var parseObject = new Parse.User();
    parseObject._finishFetch(req.body.user);
    req.user = parseObject;
  }
  req.master = req.body.master;
  next();
}


var successResponse = function(res, data) {
  data = data || true;
  res.status(200).send({ "success" : data });
}

var errorResponse = function(res, message) {
  message = message || true;
  res.status(200).send({ "error" : message });
}

var afterSaveResponse = function(req, res, next) {
  res.status(200).send({});
  next();
};

var app = express();
var jsonParser = bodyParser.json();

app.use(validateWebhookRequest);
app.use(jsonParser);

var beforeSave = function(className, handler) {
  app.post('/beforeSave_' + className, addParseResponseMethods, inflateParseObject, inflateParseUser, handler);
  Routes['beforeSave'].push(className);
};

var afterSave = function(className, handler) {
  app.post('/afterSave_' + className, addParseResponseMethods, inflateParseObject, inflateParseUser, afterSaveResponse, handler);
  Routes['afterSave'].push(className);
};

var define = function(functionName, handler) {
  app.post('/function_' + functionName, updateRequestFunctionParams, addParseResponseMethods, inflateParseUser, handler);
  Routes['function'].push(functionName);
};

Parse.Cloud.beforeSave = beforeSave;
Parse.Cloud.afterSave = afterSave;
Parse.Cloud.define = define;

module.exports = {
  Parse: Parse,
  successResponse: successResponse,
  errorResponse: errorResponse,
  app: app,
  Routes: Routes
};
