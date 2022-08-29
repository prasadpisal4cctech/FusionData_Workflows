import MyApp from './app.js'; 
import MyAuth from './auth.js';

// Replace the string literal values with your own client id, client secret, 
// hub name, project name and component name.
const clientId = 'sAGcoK4ILuXQms2WqHh7jUqXMQAGsqTA';
const clientSecret = '0iFXud1trFXr1pyK';
const hubName = 'PIM-Beta-Test';
const projectName = 'Fusion-pim-beta-two'; 
const componentName = 'Chairs';

// Create an instance of auth.js.
let myForgeAuth = new MyAuth(clientId, clientSecret);

// Get an access token from your auth.js instance. 
let accessToken = await myForgeAuth.getAccessToken(); 

// Create an instance of app.js using the variable set above. 
let myForgeApp = new MyApp(
  accessToken
);

const thumbnailPath = await myForgeApp.downloadThumbnail(
  hubName,
  projectName,
  componentName
);

if (thumbnailPath)
  console.log("Open thumbnail saved here: " + thumbnailPath);



