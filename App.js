/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var filename = './myData.json'
var myData = require(filename)
var fs = require('fs')
var tools = require("./tools.js")
var morgan = require('morgan')
var bodyParser = require('body-parser')
var https = require('https')
var axios = require('axios')

var client_id = myData.client_id; // Your client id
var client_secret = myData.client_secret; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var options = {inflate: true}

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser())
   .use(bodyParser.json(options))
   .use(morgan("combined"));

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-library-read user-library-modify playlist-modify-private playlist-modify-public';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // Hiding private data from Spotify Web API and writing it to myData.json
        request.get(options, function(error, response, body) {
          myData.user_id = body['id'];
          myData.access_token = access_token
          myData.refresh_token = refresh_token
          fs.writeFile(filename, JSON.stringify(myData, null, 2), (err) => {
            if(err) 
                throw err;
          })
        });

        // Finished!
        res.send('Tudo certo!');

        

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/playlists', (req, res) =>{
  var access_token = myData.access_token
  var OAuth = {
    url: 'https://api.spotify.com/v1/me/playlists',
    headers: { 'Authorization': 'Bearer ' + access_token }
  }
   request.get(OAuth, (err, response, body) =>{
    res.send(response["statusMessage"])
    fs.writeFile("pl.json", body, err =>{
      if(err) throw err
    })    
  })  
})

app.get('/playlist', (req, res)=>{
 
  var playlist = tools.get_pl_info("./pl.json", 3)
  
  var access_token = myData.access_token

  var OAuth = {
    url: 'https://api.spotify.com/v1/playlists/' + playlist["id"] + '/tracks',
    headers: { 'Authorization': 'Bearer ' + access_token }
  }
  
  request.get(OAuth, (err, response, body)=>{
    res.send(body)
    var filename = "playlists\\"
    filename += playlist["name"]
    filename += ".json"

    fs.writeFile(filename, body, err=>{
      if (err) throw err
    })    
  })
})

app.delete('/playlist', (req, res) =>{
  var access_token = myData.access_token

  var playlist = tools.get_pl_info("./pl.json", 3)

  var tracks = tools.repeatedFilesFinder(".//playlists//Blue Pumpkins.json", ".//playlists//Yellow Pumpkins.json")
  
  
  //res.send(tracks)

  var OAuth = {
    method: 'DELETE',
    url: 'https://api.spotify.com/v1/playlists/5itlyacAwd45riHjZxJz78/tracks',
    headers: { 'Authorization': 'Bearer ' + access_token, "Content-Type": "application/json"},
    
    json: true,
    body: {
     tracks: tracks
    } 
  }
//   curl -X DELETE -i -H "Authorization: Bearer BQDSBAWyClP_fucilm7LWnY4x_lX1FFXF50KML2J_w7NFw4HK1ycmlIdruolDfRxucHkFR5LOq5C_m9oZdcZcZHA0yElNzxjSA_jDBSa0q0CBfZBwvwhCK2Nlaa9_Epifinl7TBI2I4Hvef-ZkntMs73hAuy47VeCwTgfbpkhnWpgj1lT6UYjmrG7T1Ip_AhDPtF-O8KRIbBzr03y4XQcrCng42-Qi0mAGH59aOLyPimlB4rzA"  -H "Content-Type: application/json" "https://api.spotify.com/v1/playlists/5itlyacAwd45riHjZxJz78/tracks" --data "{\"tracks\":[{\"uri\": \"spotify:track:6ZzWX5PGg5yoJUAWGPW5gN\"}]}"

  request(OAuth, (err, response, body)=>{
    if(err) {
      console.log("deu erro")
      res.send(err)
    }
    res.send(body)
  })

})


app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});




app.listen(8888, console.log('Listening on 8888'));

