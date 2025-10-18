// settings.js

// Load saved settings
window.addEventListener('DOMContentLoaded', () => {
  const savedUsername = localStorage.getItem('username') || '';
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  const savedEmailNotifications = localStorage.getItem('emailNotifications') === 'true';

  document.getElementById('username').value = savedUsername;
  document.getElementById('darkMode').checked = savedDarkMode;
  document.getElementById('emailNotifications').checked = savedEmailNotifications;

  if (savedDarkMode) {
    document.body.classList.add('dark');
  }
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const darkMode = document.getElementById('darkMode').checked;
  const emailNotifications = document.getElementById('emailNotifications').checked;

  localStorage.setItem('username', username);
  localStorage.setItem('darkMode', darkMode);
  localStorage.setItem('emailNotifications', emailNotifications);

  if (darkMode) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  alert('Settings saved!');
});
