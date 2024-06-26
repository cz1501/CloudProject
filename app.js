require('dotenv').config();

const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path'); // Import the path module
const url = require('url');
const serveIndex = require('serve-index');
const app = express();
const PORT = process.env.PORT || 80;
const AWS = require('aws-sdk'); // Import AWS SDK
const bodyParser = require('body-parser'); // Import bodyParser middleware
const jwt = require('jsonwebtoken'); // Import jsonwebtoken library

// Create DynamoDB DocumentClient
const docClient = new AWS.DynamoDB.DocumentClient();

const region = process.env.AWS_REGION;
const ClientId = process.env.COGNITO_CLIENT_ID;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

AWS.config.update({
  region: region, // Specify the AWS region
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  }
});

const cognito = new AWS.CognitoIdentityServiceProvider();

app.use(session({
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files
app.use(express.static('public'));
app.use(express.static('scripts'));
app.use(express.static('styles'));


// Example API endpoint for getting actor's details from TMDb
const tmdbActorIdList = [
    1373737, 192, 1136406, 224513, 56734, 6161, 31, 12835, 2524, 9780, 73457, 1245, 2231, 517, 1190668, 3293, 1620, 16828, 37625, 71580, 287, 934, 8784, 3223, 18918, 115440, 10859, 74568, 543261, 3896, 1269, 118545, 5292, 6193, 2037, 6885
];
const tmdbApiKey = 'b4e019928e2da90fea8d583ca41bdd30';
let actorId = tmdbActorIdList[0] ; // Replace with the ID of the actor you want to get details for
let actorUrl = `https://api.themoviedb.org/3/person/${actorId}?api_key=${tmdbApiKey}`;
// Example API endpoint for getting actor's movie credits from TMDb
let creditsUrl = `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${tmdbApiKey}`;


// Details for the refreshing the chosen actor for the day
function periodicCheck() {

    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - periodicCheck.lastDate.getTime();

    if (timeDifference / (1000 * 60 * 60) >= 24) {
        periodicCheck.lastDate = currentDate;
        periodicCheck.index =  Math.floor(((periodicCheck.lastDate.getTime() - periodicCheck.firstDate.getTime()) / (1000 * 60 * 60 * 24)) % tmdbActorIdList.length);
        console.log("new index:"+ periodicCheck.index);
        // periodicCheck.lastDate.setHours(12, 0, 0, 0);
        updateActor();
    }
}

function updateActor() {
    let listIndex = Math.floor(((periodicCheck.lastDate.getTime() - periodicCheck.firstDate.getTime()) / (1000 * 60 * 60 * 24)) % tmdbActorIdList.length);
    console.log("list index:"+ listIndex);
    actorId = tmdbActorIdList[listIndex];
    console.log("new actor id:"+ actorId);
    console.log(periodicCheck.lastDate.getTime());
    console.log(periodicCheck.firstDate.getTime());
    actorUrl = `https://api.themoviedb.org/3/person/${actorId}?api_key=${tmdbApiKey}`;
    creditsUrl = `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${tmdbApiKey}`;
}

periodicCheck.firstDate = new Date(2024, 3, 7, 10, 30, 0);
periodicCheck.lastDate = new Date();
periodicCheck();
updateActor();

const interval = setInterval(periodicCheck, 1000 * 60 * 60);

const navLinks = [
    {name: "Game", link: "/index"},
    {name: "Login", link: "/login"},
    {name: "Register", link: "/register"},
    {name: "Leaderboard", link: "/leaderboard"}
]

// Function to decode the ID token and extract user information
function decodeIdToken(idToken) {
  try {
    const decoded = jwt.decode(idToken, { complete: true });
    if (decoded && decoded.payload) {
      const { sub: userSub, email: userEmail } = decoded.payload;
      return { userSub, userEmail };
    } else {
      return null; // Invalid token or missing payload
    }
  } catch (error) {
    console.error('Error decoding ID token:', error);
    return null;
  }
}

app.use((req, res, next) => {
    app.locals.navLinks = navLinks;
    app.locals.currentURL = url.parse(req.url).pathname;
    next();
});

app.get('/ejsPage', (req, res) => {
    res.render('login.ejs'); // This will render ejsPage.ejs
});

// User authentication route
app.post('/loggingin', async (req,res) => {
  var username = req.body.username;
  var password = req.body.password;

  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: ClientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    }
  };

  try {
    // Initiate authentication with AWS Cognito
    const authResult = await cognito.initiateAuth(params).promise();

    // Check if authentication was successful
    if (authResult.AuthenticationResult) {
      // Authentication successful, redirect the user to main.html
      console.log('Successfully authenticated!')
      // Save ID token in session
      req.session.idToken = authResult.AuthenticationResult.IdToken;
      // Decode the ID token and extract user information
      const accessToken = jwt.decode(authResult.AuthenticationResult.AccessToken);
      req.session.username = accessToken.username;

      res.redirect('/index');
    }
  } catch (error) {
    // Handle authentication errors
    if (error.code === 'NotAuthorizedException') {
      res.send('Incorrect username or password')
    } else if (error.code === 'UserNotConfirmedException') {
      res.redirect('/confirm-registration');
    } else {
      console.error('Authentication error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// User confirmation route
app.post('/confirmation', async (req,res) => {
  var username = req.body.username;
  var confirmationCode = req.body.confirmation;

  const params = {
    // AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: ClientId,
    ConfirmationCode: confirmationCode,
    Username: username
  };

  try {
    // Call the ConfirmSignUp operation
    const confirmResults = await cognito.confirmSignUp(params, function(err, data) {
      if (err) {
        console.log('Error confirming sign-up:', err);

      } else {
        res.redirect('/login');
      }
    });

  } catch (error) {
    // Handle errors
    console.error('Confirmation error:', error);
    res.status(500).json({ message: 'Failed to confirm user' });
  }
});

app.post('/register', async (req,res) => {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  console.log(ClientId)
  const params = {
    ClientId: ClientId,
    Username: username,
    Password: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: email
      }
    ]
  };

  try {
    // Call the signUp function
    const data = await cognito.signUp(params).promise();
    console.log('User registered successfully:', data);

    // Send a success response back to the client
    res.redirect('/confirm-registration');
  } catch (error) {
    // Handle errors
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});


// Route handler for rendering the EJS template
app.get('/index', async (req, res) => {
    try {
        // Fetch actor's details from TMDb
        const actorResponse = await axios.get(actorUrl);
        const actorName = actorResponse.data.name;

        // Fetch actor's movie credits from TMDb
        const creditsResponse = await axios.get(creditsUrl);
        const movies = creditsResponse.data.cast;

        // Calculate combined score for each movie and sort by score
        movies.forEach(movie => {
            // Adjust popularity to a scale between 0 and 1
            const normalizedPopularity = movie.popularity / 100;
            // Calculate score by multiplying place in cast list by adjusted popularity
            movie.score = (10 - movie.order) * (normalizedPopularity ** 2);
            // Extract release year from release_date
            movie.release_year = new Date(movie.release_date).getFullYear();
        });
        movies.sort((a, b) => b.score - a.score);

        // Get the top 5 movies based on combined score
        const top5Movies = movies.slice(0, 5);

        // Render the EJS template and pass the top 5 movies and actor's name
        res.render('index', { movies: top5Movies, actorName: actorName });
    } catch (error) {
        console.error('Error fetching data from TMDb:', error);
        res.status(500).send('Error fetching data from TMDb');
    }
});

// GET request for register page
app.get('/register', (req, res) => {
    res.render('register.ejs')
});

// GET request for confirmation page
app.get('/confirm-registration', (req, res) => {
  res.render('confirmation.ejs');
});

// GET request for login page
app.get('/login', (req, res) => {
    res.render('login.ejs')
});

// GET request for login page
app.get('/index', (req, res) => {
    res.render('index.ejs')
});

// GET request for leaderboard page
app.get('/leaderboard', (req, res) => {
    res.render('leaderboard.ejs')
});

// GET request for leaderboard page
app.get('/get-leaderboard', (req, res) => {
  // Get the start date of the current week
  const currentDateTime = new Date();
  const startOfWeek = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate() - currentDateTime.getDay());
  // Format the start date of the week
  const formattedDate = startOfWeek.toISOString().split('T')[0];

  // DynamoDB params with FilterExpression
  const params = {
    TableName: 'comp3962-actor-match-weekly-score',
    FilterExpression: 'WeekStartDate = :date',
    ExpressionAttributeValues: {
      ':date': formattedDate
    }
  };

  // Scan DynamoDB table to get items with the specified sort key
  docClient.scan(params, (err, data) => {
    if (err) {
      console.error('Unable to get leaderboard data. Error JSON:', JSON.stringify(err, null, 2));
      res.status(500).send('Error getting leaderboard data');
    } else {
      res.status(200).json(data.Items); // Return items as JSON response
    }
  });
});

// POST request for recording score to DynamoDB
app.post('/record-score', async (req, res) => {
  if (req.session.idToken) {
    const userInfo = decodeIdToken(req.session.idToken);
    const score = req.body.score;
    const username = req.session.username;
    const userID = userInfo.userSub;

    // Get the current date in ISO format
    const currentDateTime = new Date();
    const currentDate = currentDateTime.toISOString().split('T')[0];

    const params = {
      TableName: 'comp3962-actor-match-scores',
      Key: {
        'userID': userID,
        'Date': currentDate // Check if an entry with this date exists
      }
    };

    // Check if an entry with today's date exists in the other table
    docClient.get(params, async (err, data) => {
      if (err) {
        console.error('Error retrieving entry from actor-match-scores:', err);
        res.sendStatus(500); // Send error response
      } else {
        // Only proceed if there's no existing entry for today's date
        if (!data.Item) {
          // If no entry exists, record the score and update weekly score
          const dayScoreParams = {
            TableName: 'comp3962-actor-match-scores',
            Item: {
              'userID': userID,
              'Username': username,
              'Score': score,
              'Date': currentDate
            }
          };

          // // Logic to write data to DynamoDB using AWS SDK
          docClient.put(dayScoreParams, (err, data) => {
            if (err) {
              console.error('Unable to write to actor-match-scores:', err);
              res.sendStatus(500); // Send error response
            } else {
              console.log('Successfully wrote to actor-match-scores');
            }
          });

          // Once individual score is recorded, update weekly score
          const startOfWeek = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate() - currentDateTime.getDay());
          // Format the start date of the week
          const formattedDate = startOfWeek.toISOString().split('T')[0];

          // Check if the user already has an entry in the weekly score table
          const getParams = {
            TableName: 'comp3962-actor-match-weekly-score',
            Key: {
              'userID': userID,
              'WeekStartDate': formattedDate
            }
          };

          docClient.get(getParams, async (err, data) => {
            if (err) {
              console.error('Error retrieving weekly score:', err);
              res.sendStatus(500); // Send error response
            } else {
              if (data.Item) {
                // User entry exists, update the total score
                const currentTotalScore = data.Item['total-score'] || 0;
                const updatedTotalScore = currentTotalScore + score;
                const updateParams = {
                  TableName: 'comp3962-actor-match-weekly-score',
                  Key: {
                    'userID': userID,
                    'WeekStartDate': formattedDate
                  },
                  UpdateExpression: 'set #ts = :s', // Update total score only
                  ExpressionAttributeNames: {
                    '#ts': 'total-score'
                  },
                  ExpressionAttributeValues: {
                    ':s': updatedTotalScore
                  },
                  ReturnValues: 'UPDATED_NEW'
                };

                docClient.update(updateParams, (err, data) => {
                  if (err) {
                    console.error('Error updating weekly score:', err);
                    res.sendStatus(500); // Send error response
                  } else {
                    console.log('Successfully updated weekly score');
                    res.sendStatus(200); // Send success response
                  }
                });
              } else {
                // User entry doesn't exist, create a new entry
                const putParams = {
                  TableName: 'comp3962-actor-match-weekly-score',
                  Item: {
                    'userID': userID,
                    'WeekStartDate': formattedDate,
                    'total-score': score,
                    'username': username,
                  }
                };

                docClient.put(putParams, (err, data) => {
                  if (err) {
                    console.error('Error creating weekly score entry:', err);
                    res.sendStatus(500); // Send error response
                  } else {
                    console.log('Successfully created weekly score entry:', data);
                    res.sendStatus(200); // Send success response
                  }
                });
              }
            }
          });
        } else {
          // If entry already exists, send a response indicating no update needed
          console.log('Score for today already recorded')
          res.send("Score for today already recorded");
          res.end();
        }
      }
    });
  }
});

app.get('/', (req, res) => {
    res.render('login.ejs');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
