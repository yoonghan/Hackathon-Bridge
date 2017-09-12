/**
 * Module dependencies.
 */

const WebSocket = require('ws');
var express = require('express');
var app = express();
var sql = require('mssql');
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MSSQL Database Connection string parameters.
var sqlConfig = {
    user: <<DB USERNAME>>,
    password: <<DB PASSWORD>>,
    port: '1433',
    server: <<DB HOSTNAME>>,
    database: <<DATABASE NAME>>
}

//AWS SDK ACCESS
var awsAPIKey = {
    accessKeyId: <<AWS_SDK_ACCESS_KEY>>,
    secretAccessKey: <<AWS_SDK_SECRET_ACCESS_KEY>>,
    region: 'ap-southeast-1'
}

/**
 * Create server
 **/
const server = app.listen(5000, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("app listening at http://%s:%s", host, port)
});

/**
 * Host file
 **/
app.use(express.static('public'))

/**
 * Create websocket
 **/
const wss = new WebSocket.Server({ server });

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});

app.post('/api/sendSms', function (req, res) {
  var message = req.body.message;
  var phoneNumber = req.body.phonenumber;

  AWS.config.region = awsAPIKey.region;
  AWS.config.update({
        accessKeyId: awsAPIKey.accessKeyId,
        secretAccessKey: awsAPIKey.secretAccessKey
  });

  var sns = new AWS.SNS();
  var params = {
      Message: message,
      MessageStructure: 'string',
      PhoneNumber: phoneNumber,
      Subject: 'Emergency!'
  };

  sns.publish(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
  });

  res.end(JSON.stringify({"data":"ok"}));
});

/**
 * Create api for REST
 **/
app.get('/api/speech', function (req, res) {
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();

        request.query('select * from dbo.SpeechText', function(err, recordset) {
            if(err) console.log(err);
            res.end(JSON.stringify(recordset)); // Result in JSON format
            sql.close();
        });
        //sql.close();
    });
});

/**
 * retrieve user
 **/
app.get('/api/user', function (req, res) {
  var userId = req.query.userid;
  var defaultUser = {ContactNo: -1, Name: ''};
  if(/^([a-zA-Z0-9]{1,10})$/.test(userId)) {
    try{
      sql.connect(sqlConfig, function() {
          var request = new sql.Request();

          request.query("select ContactNo, Name from [dbo].[User] where UserID='"+userId+"'", function(err, recordset) {
              if(err) console.log(err);
              res.end(JSON.stringify(recordset)); // Result in JSON format
              sql.close();
          });
          //sql.close();
      });
    }catch(e){
      res.end(JSON.stringify(defaultUser));
      sql.close();
    }
  }
  else {
    res.end(JSON.stringify(defaultUser));
  }
});

/**
 * Add to speech
 **/
app.post('/api/speech', function(req, res) {
  var question = req.body.question;
  var answer = req.body.answer;
  var userId = req.body.userid;
  var createdDate = Date.now();

  try{
    var connection = new sql.connect(sqlConfig, function(err) {
      const ps = new sql.PreparedStatement(connection);
      ps.input('question', sql.VarChar(200));
      ps.input('answer', sql.VarChar(200));
      ps.input('createdDate', sql.BigInt);
      ps.input('userId', sql.VarChar(10));

      ps.prepare("insert into speechtext (UserId, Question, Answer, CreatedDate) values (@userId, @question, @answer, dateadd(s, (@createdDate / 1000), convert(datetime, '1-1-1970 00:00:00')))",
       err => {
        ps.execute({userId: userId, question: question, answer: answer, createdDate: createdDate}, (err, result) => {
          if(err) console.log(err);
          res.end("ok");
          ps.unprepare(err => {
            if(err) console.log(err);
            sql.close();
          });
        });
      });
    });
  }catch(e){
    sql.close();
  }
});
