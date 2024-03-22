const express = require('express');
const axios = require('axios');

const url = require('url');
const app = express();
const PORT = process.env.PORT || 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));
app.use(express.static('scripts'));
app.use(express.static('styles'));

// Example API endpoint for getting actor's details from TMDb
const tmdbApiKey = 'b4e019928e2da90fea8d583ca41bdd30';
const actorId = '287'; // Replace with the ID of the actor you want to get details for
const actorUrl = `https://api.themoviedb.org/3/person/${actorId}?api_key=${tmdbApiKey}`;

// Example API endpoint for getting actor's movie credits from TMDb
const creditsUrl = `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${tmdbApiKey}`;

const navLinks = [
    {name: "Game", link: "/"},
    {name: "Login", link: "/login"},
    {name: "Register", link: "/register"},
    {name: "Leaderboard", link: "/leaderboard"}
]

app.use("/", (req, res, next) => {
    app.locals.navLinks = navLinks;
    app.locals.currentURL = url.parse(req.url).pathname;
    next();
});

// Route handler for rendering the EJS template
app.get('/', async (req, res) => {
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

// GET request for leaderboard page
app.get('/leaderboard', (req, res) => {
    res.render('leaderboard.ejs')
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
