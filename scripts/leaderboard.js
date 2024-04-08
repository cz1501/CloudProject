getLeaderboard(); // Load tasks on page load

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent default form submission behavior
    const taskInput = document.getElementById('taskInput');
    const task = taskInput.value.trim(); // Get the value from the input field
    if (task !== '') {
      // Execute code to add the task (e.g., send request to server)
      addTask(task);
    }
  }
}
  
  function getLeaderboard() {
    // Send GET request to server to get tasks
    fetch('/get-leaderboard')
    .then(response => {
      if (!response.ok) {
        console.log(response);
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayLeaderboard(data); // Display scores
    })
    .catch(error => {
      console.error('Error getting tasks:', error);
    });
  }
  
  function displayLeaderboard(scores) {
    const scoreList = document.getElementById('scoreList');
    scoreList.innerHTML = ''; // Clear previous tasks

    // Sort scores in descending order based on score
    scores.sort((a, b) => b['total-score'] - a['total-score']);

    // Create table element with Bootstrap table classes
    const table = document.createElement('table');
    table.classList.add('table', 'table-striped');

    // Create table header row
    const headerRow = table.createTHead().insertRow();
    const headers = ['Rank', 'Name', 'Score'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.setAttribute('scope', 'col');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    // Populate table body with score data
    const tbody = document.createElement('tbody');
    scores.forEach((score, index) => {
        const row = tbody.insertRow();
        const rankCell = row.insertCell();
        rankCell.setAttribute('scope', 'row');
        rankCell.textContent = index + 1; // Rank (1-indexed)
        const nameCell = row.insertCell();
        nameCell.textContent = score.username; // Use username from JSON data
        const scoreCell = row.insertCell();
        scoreCell.textContent = score['total-score']; // Use score from JSON data
    });

    // Append table body to table
    table.appendChild(tbody);

    // Append table to scoreList div
    scoreList.appendChild(table);
}
