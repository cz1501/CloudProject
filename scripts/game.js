document.addEventListener('DOMContentLoaded', function() {
  const actorName = document.getElementById('actor-name').textContent; // Extract actor's name from the server response

  let revealIndex = 0;
  let score = 500;
  let guessScore = 500;
  let guessesLeft = 5;
  const revealButton = document.getElementById('reveal-movie');

  revealButton.addEventListener('click', function() {
    const characterDetails = document.querySelectorAll('.movie-details');
    const currentScore = document.getElementById('current-score');
    if (revealIndex < characterDetails.length) {
      characterDetails[revealIndex].style.display = 'inline';
      revealIndex++;
      score -= 100;
      if (guessScore > 0) {
        currentScore.textContent = score + guessScore;
        currentScore.style.display = "inline-block";
      } else {
        currentScore.textContent = score;
      }

    } else {
      alert('All movies revealed!');
    }
  });

  document.getElementById('check-guess').addEventListener('click', function() {
    guessesLeft--;
    document.getElementById('guesses-left').textContent = guessesLeft;

    const guess = document.getElementById('actor-guess').value.trim().toLowerCase();
    if (guess === actorName.toLowerCase()) {
      document.getElementById('guess-result').textContent = 'Congratulations! You guessed the correct actor.';
      document.getElementById('guess-result').style.color = 'green';
      document.getElementById('guess-result').style.display = 'block';

      // Display all movie titles and characters
      const movieTitles = document.querySelectorAll('.movie-title');
      movieTitles.forEach((movieTitle) => {
        movieTitle.style.display = 'inline';
      });

      const characterDetails = document.querySelectorAll('.movie-details');
      characterDetails.forEach((characterDetail) => {
        characterDetail.style.display = 'inline';
      });

    } else {
      document.getElementById('guess-result').textContent = 'Incorrect. Try again.';
      document.getElementById('guess-result').style.color = 'red';
      document.getElementById('guess-result').style.display = 'block';
      guessScore -= 100;
      const currentScore = document.getElementById('current-score');
      currentScore.textContent = score + guessScore;
      currentScore.style.display = "inline-block";

      if (guessesLeft === 0) {
        document.getElementById('check-guess').disabled = true;
        document.getElementById('actor-guess').disabled = true;
        // document.getElementById('reveal-character').disabled = true;
        document.getElementById('guess-result').textContent = 'Game Over! You have run out of guesses. The actor is ' + actorName + '.';
        console.log('Game Over! You have run out of guesses. The actor is ' + actorName + '.');
        document.getElementById('guess-result').style.color = 'red';
        document.getElementById('guess-result').style.display = 'block';

        //set the score to 0
        const currentScore = document.getElementById('current-score');
        score = 0;
        currentScore.textContent = 0;
        currentScore.style.display = "inline-block";


          // Display all movie titles and characters
        const movieTitles = document.querySelectorAll('.movie-title');
        movieTitles.forEach((movieTitle) => {
          movieTitle.style.display = 'block';
        });

        const characterDetails = document.querySelectorAll('.movie-details');
        characterDetails.forEach((characterDetail) => {
          characterDetail.style.display = 'block';
        });

      }
    }
  });
});