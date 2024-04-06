
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path'); // Import the path module

const url = require('url');
const serveIndex = require('serve-index');
const app = express();
const PORT = process.env.PORT || 8080;
const AWS = require('aws-sdk'); // Import AWS SDK
const bodyParser = require('body-parser'); // Import bodyParser middleware

const region = process.env.AWS_REGION;
// const ClientId =
process.env.COGNITO_CLIENT_ID;
const ClientId = process.env.COGNITO_CLIENT_ID;

AWS.config.update({
  region: region, // Specify the AWS region
});

const cognito = new AWS.CognitoIdentityServiceProvider();

// Set the view engine to EJS
app.set('view engine', 'ejs');

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

// app.get('/', (req, res) => {
//     res.redirect('/login');
// });

// Example API endpoint for getting actor's details from TMDb
const tmdbApiKey = 'b4e019928e2da90fea8d583ca41bdd30';
const actorId = '287'; // Replace with the ID of the actor you want to get details for
const actorUrl = `https://api.themoviedb.org/3/person/${actorId}?api_key=${tmdbApiKey}`;

// Example API endpoint for getting actor's movie credits from TMDb
const creditsUrl = `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${tmdbApiKey}`;

const navLinks = [
    {name: "Game", link: "/index"},
    {name: "Login", link: "/login"},
    {name: "Register", link: "/register"},
    {name: "Leaderboard", link: "/leaderboard"}
]

app.use((req, res, next) => {
    app.locals.navLinks = navLinks;
    app.locals.currentURL = url.parse(req.url).pathname;
    next();
});

app.get('/ejsPage', (req, res) => {
    res.render('login.ejs'); // This will render ejsPage.ejs
});


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
      res.redirect('/index');
    }
  } catch (error) {
    // Handle authentication errors
    if (error.code === 'NotAuthorizedException') {
      res.send('Incorrect username or password')
    } else {
      console.error('Authentication error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }


});

app.post('/register', async (req,res) => {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
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
    // res.redirect('/main.html');
    res.send('User registered successfully');
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
