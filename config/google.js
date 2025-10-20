const { google } = require('googleapis');

const getAuth = () => {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ],
    });

    return auth;
  } catch (error) {
    console.error('Error initializing Google Auth:', error.message);
    throw error;
  }
};

const auth = getAuth();
const sheets = google.sheets({ version: 'v4', auth });

auth.getClient().then(() => {
  console.log('Google Sheets authentication successful');
}).catch(error => {
  console.error('Google Sheets authentication failed:', error.message);
});

module.exports = { sheets, auth, google };