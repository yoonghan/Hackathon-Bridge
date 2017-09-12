# Bridge for Mobile Vehicle Assistance.

## 1. Installation.

1. *(OPTIONAL)* Setup a MSSQL database, table must contain:
  * User -> ContactNo, Name
  * SpeechText -> UserId, Question, Answer, CreatedDate

2. *(OPTIONAL)* Change app.js's for connecting into the database:
```javascript
var sqlConfig = {
    user: <<DB USERNAME>>,
    password: <<DB PASSWORD>>,
    port: '1433',
    server: <<DB HOSTNAME>>,
    database: <<DATABASE NAME>>
}
```

3. *(OPTIONAL)* Setup AWS SDK (Optional only if SMS is used)

4. Create an AWS Elastic Beanstalk.

5. Execute the command (LINUX)
```
./zipcommand.sh
```

6. Deploy squash.zip into the server

## 2. Testing if it works.

1. Browse the url http://..../ and see if the page loads with a heart attack simulator.

2. The basic REST api can be test via POSTMAN or curl commands
--GET -- /api/user

## 3. Running on local machine.

1. Run the command.

```
npm install
```

2. Run the command

```
npm start
```

3. Check for http://localhost:5000/
