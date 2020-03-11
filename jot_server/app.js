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

app.use(function(req, res, next) 
{
    // CORS headers
    //https://jotdot.honchohq.com/
    res.header("Access-Control-Allow-Origin", "http://localhost:8080"); // restrict it to the required domain
    res.header("Access-Control-Allow-Credentials", true); // restrict it to the required domain
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

  validateToken(accessTokenFromClient, function(err, response)
  {
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

var isNotAuthenticated = function (req, res, next) 
{
  // next();
  // return;  
  // var accessTokenFromClient = req.headers.accesstoken;
  // console.log('accesstoken', accessTokenFromClient);

  // if (!accessTokenFromClient) 
  // {
  //   return res.status(401).send("Access Token missing from header");
  // }

  // validateToken(accessTokenFromClient, function(err, response)
  // {
  //   if (err) 
  //   {           
  //     console.log(err);
  //     return res.status(401).send('Invalid token');
  //   }

    //Else API has been authenticated. Proceed.
    req.user = {};
    req.eId = 'anonymous'+ new Date().toString();
    // console.log(response);
    next();

  // });
}

validateToken = function(accessTokenFromClient, callback)
{
  try
  {
    cognito.validate(accessTokenFromClient, function(err, response) 
    {
        //If API is not authenticated, Return 401 with error message. 
        if (err) 
        {           
          console.log(err);
          callback(err, null);
          // return res.status(401).send('Invalid token');
        }

        callback(null, response);
    }); 
  }
  catch(err)
  {
      console.log(err);
      callback(err, null);
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

app.get(OpsConfig.APIPaths.GET_ANONYMOUS_AllJots, isNotAuthenticated, APIs.receiveAPIRequest);
app.get(OpsConfig.APIPaths.GET_ANONYMOUS_OneJotsSections, isNotAuthenticated, APIs.receiveAPIRequest);
app.get(OpsConfig.APIPaths.GET_ANONYMOUS_OneJot, isNotAuthenticated, APIs.receiveAPIRequest);
//HTTP SERVER
var server = http.createServer(app);

server.listen(app.get('port'), function()
{
  console.log('JotDot server started and listening on port ' + app.get('port'));
});

//WebSocket Server
var io  = require('socket.io').listen(server);

WSConnection = function(socketId, socket, eId, user)
{
  this.socketId = socketId;
  this.socket = socket;
  this.eId = eId;
  this.user = user;
};
var wsConnections=[];
var activeJots=[];

emitToConnections = function(connections, fromSocketId, eventType, data)
{
  for (var id in connections) 
  {
    var connection = connections[id];
    if (connection && connection.socketId!=fromSocketId)
    {
      if (connectionExists(connection.socketId)==false)
      {
        // console.log('stale connection found');
        delete connections[connection.socketId];
        return;
      }
      try
      {
        // console.log(eventType + ' emitting to ' + connection.socketId);
        connection.socket.emit(eventType, data);  
      }
      catch (e)
      {
        console.log(e);
      }
    }
  }
}

connectionExists=function(socketId)
{
  if (wsConnections[socketId])
  {
    return true;  
  }
  return false;
}

setActiveJot=function(socketId, jotId)
{
  connection = wsConnections[socketId];
  if (!activeJots[jotId])
  {
    activeJots[jotId]={};
  }

  if (activeJots[jotId][socketId])
  {
    // console.log('already in jot');
    return;
  }
  activeJots[jotId][socketId] = connection;
}

sendToAllActiveJotConnections = function(fromSocketId, jotId, eventType, data)
{
  if (activeJots[jotId]==null || activeJots[jotId]==undefined)
  {
    console.log('!found '+ jotId);
    return;
  }

  var connections =activeJots[jotId];
  emitToConnections(connections, fromSocketId, eventType, data);
  return;
}

removeActiveJotConnection=function(sockedId, jotId)
{
  if (activeJots[jotId]==null || activeJots[jotId]==undefined)
  {
    return;
  }

  delete activeJots[jotId][socketId];
}

//returns if authenticated
handshake=function(accessTokenFromClient, socket, callback)
{
  if (connectionExists(socket.id))
  {
    return callback(null, true);
  }

  var req={};
  validateToken(accessTokenFromClient, function(err, response)
  {
    if (err) 
    {           
      console.log(err);
      return callback(null, false);
    }
    //Else API has been authenticated. Proceed.
    req.user = response;
    req.eId = response.username;
    var newConnection= new WSConnection(socket.id, socket, req.eId, req.user);
    wsConnections[socket.id] = newConnection;
    // console.log('authenticated connection ' + socket.id); 

    return callback(null, true);
  });
}

io.on('connection', (socket) => 
{
  // console.log('ws received', socket.id); 

  socket.on('operation', function (data) 
  {
    handshake(data.header.AccessToken, socket, function(error, isAuthenticated)
    {
      if (isAuthenticated==false) 
      {           
        return;
      }

      // console.log('operation')
      setActiveJot(socket.id, data.data.documentId);
      sendToAllActiveJotConnections(socket.id, data.data.documentId, data.data.type, data.data.data);
    });
  });

  socket.on('sectionFocus', function (data) 
  {
    handshake(data.header.AccessToken, socket, function(error, isAuthenticated)
    {
      if (isAuthenticated==false) 
      {           
        return;
      }

      setActiveJot(socket.id, data.data.jotId);
      var user = (wsConnections[socket.id]).user.username;
      sendToAllActiveJotConnections(socket.id, data.data.jotId, 'SectionInFocus', { 'sectionId': data.data.sectionId, 'lockedBy':user });
    });
    // io.emit('SectionInFocus', {'sectionId':data.data.sectionId} ); // emit an event to all connected sockets
  });

  socket.on('sectionBlur', function (data) 
  {
    handshake(data.header.AccessToken, socket, function(error, isAuthenticated)
    {
      if (isAuthenticated==false) 
      {           
        return;
      }

      setActiveJot(socket.id, data.data.jotId);
      sendToAllActiveJotConnections(socket.id, data.data.jotId, 'SectionBlur', {'sectionId':data.data.sectionId});
    });
  });

  socket.on('ping', function (data) 
  {
    console.log('ws-ping', socket.id);
  });

  socket.on('disconnect', function () {
    console.log('disconnected', socket.id);
    if (wsConnections[socket.id])
    {
      delete wsConnections[socket.id];
    }
  });

  socket.on('handshake', function(data)
  {
    console.log('connecting');
    if (connectionExists(socket.id))
    {
      console.log('already connected');
      return;
    }

    var accessTokenFromClient = data.header.AccessToken;
    handshake(accessTokenFromClient, socket, function(error, isAuthenticated)
    {
      if (error) 
      {           
        console.log(err);
        return;
      }
    });
  });

  socket.on('activeJot', function (data) 
  {
    var jotId = data.data.jotId;

    setActiveJot(socket.id, jotId);
  });  
});
