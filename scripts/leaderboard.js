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

// function addTask() {
//     const taskInput = document.getElementById('taskInput');
//     const task = taskInput.value.trim(); // Get task input value
//     if (!task) return; // Return if task is empty
  
//     // Send POST request to server to add task
//     fetch('/add-task', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ task: task })
//     })
//     .then(response => {
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
//       return response.text();
//     })
//     .then(data => {
//       console.log('Task added successfully:', data);
//       taskInput.value = ''; // Clear task input field
//       getTasks(); // Refresh task list
//     })
//     .catch(error => {
//       console.error('Error adding task:', error);
//     });
//   }
  
  function getLeaderboard() {
    // Send GET request to server to get tasks
    fetch('/get-leaderboard')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Scores:', data);
      displayTasks(data); // Display tasks in UI
    })
    .catch(error => {
      console.error('Error getting tasks:', error);
    });
  }
  
  function displayLeaderboard(scores) {
    const scoreList = document.getElementById('scoreList');
    // scoreList.innerHTML = ''; // Clear previous tasks
    scores.forEach(task => {
      const li = document.createElement('li');
      li.textContent = task.task;
      scoreList.append(li);
    });
  }
  
  // Load tasks on page load
  