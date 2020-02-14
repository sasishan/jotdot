var config = require('./config'), 
  OpsConfig = require('./OperationsConfig'),
  express = require('express'),
  http = require('http'),
  path = require('path'),
  monk = require('monk'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  cognitoExpress = require('cognito-express'),
  //ROUTES
  Operations = require('./routes/Operations'),
  APIs = require('./routes/APIs'),
  Database = require('./Database/Database');

// const { authenticate, authenticationError } = require('aws-cognito-express');
const app = express();
const dbURI = config.dbURI;
const db = monk(dbURI);

const cognito = new cognitoExpress(config.COGNITO_CONFIG);

app.set('port', process.env.PORT || config.port);
app.use(bodyParser({limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.use(function(req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    // Set custom headers for CORS
    res.header("Access-Control-Allow-Headers", "Content-type,Accept,X-Custom-Header,AccessToken,email,Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    return next();
});

app.use (function(req, res, next) 
{
  req.db = db; 
  next(); 
});


var isAuthenticated = function (req, res, next) 
{
  // next();
  // return;  
  var accessTokenFromClient = req.headers.accesstoken;
  // console.log('accesstoken', accessTokenFromClient);

  if (!accessTokenFromClient) 
  {
    return res.status(401).send("Access Token missing from header");
  }

  try
  {
    cognito.validate(accessTokenFromClient, function(err, response) 
    {
        //If API is not authenticated, Return 401 with error message. 
        if (err) 
        {           
          console.log(err);
          return res.status(401).send('Invalid token');
        }

        //Else API has been authenticated. Proceed.
        req.user = response;
        req.eId = response.username;
        // console.log(response);
        next();
    }); 
  }
  catch(err)
  {
      console.log(err);
      return res.status(500).send('Internal error');
  }
}

//API routes
app.post('/api/v1/operations', isAuthenticated, Operations.receiveOperations);
app.get(OpsConfig.APIPaths.GET_OneJotsSections, isAuthenticated, APIs.receiveAPIRequest);
app.get(OpsConfig.APIPaths.GET_AllJots, isAuthenticated, APIs.receiveAPIRequest);
app.get(OpsConfig.APIPaths.GET_OneJot, isAuthenticated, APIs.receiveAPIRequest);
app.post(OpsConfig.APIPaths.POST_NewJot, isAuthenticated, APIs.receiveAPIRequest);
app.delete(OpsConfig.APIPaths.DELETE_OneJot, isAuthenticated, APIs.receiveAPIRequest);
app.get(OpsConfig.APIPaths.GET_AllTags, isAuthenticated, APIs.receiveAPIRequest);
app.get(OpsConfig.APIPaths.GET_TagSections, isAuthenticated, APIs.receiveAPIRequest);

// app.post('/api/v1/documents/:docId/sections/new', isAuthenticated, APIs.receiveNewSection);


http.createServer(app).listen(app.get('port'), function()
{
  console.log('Server started and listening on port ' + app.get('port'));
});