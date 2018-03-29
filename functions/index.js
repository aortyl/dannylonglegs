const functions = require('firebase-functions');
const admin = require('firebase-admin');
const rp = require('request-promise');
const REQUEST = require('request');

admin.initializeApp(functions.config().firebase);

function advancedStackExchangeSearch(text) {
  return rp({
    method: 'GET',
    uri: `https://api.stackexchange.com/2.2/search/advanced?site=stackoverflow&order=desc&sort=activity&q=${text}&filter=default`,
    headers: {
        'User-Agent': 'Request-Promise',
        'Access-Control-Allow-Origin': "*",
        'Access-Control-Allow-Methods': 'POST'
    },
    json: true,
  });
}

exports.askdan = functions.https.onRequest((request, response) => {
  if (!request.body || request.body.token !== functions.config().slack.verification_token) {
    response.status(401).send("Invalid Token");

    return;
  }

  let response_url = request.body.response_url;
  let question = request.body.text;

  if (question === 'help') {
    let ephemeral_response_payload = {
      "response_type": "ephemeral",
      "text": "How do use /askdan",
      "attachments": [
        {
          "text": "Just type `/askdan` followed by a question. Doesn't really matter though. He won't answer."
        }
      ]
    };

    response
      .set('Content-type', 'application/json')
      .status(200)
      .send(ephemeral_response_payload);
  }

  let ephemeral_response_payload = {
    "response_type": "ephemeral",
    "text": "Asking Dan..."
  };

  response
    .set('Content-type', 'application/json')
    .status(200)
    .send(ephemeral_response_payload);

  advancedStackExchangeSearch(question)
    .then( soResponse => {
      channel_response_payload  = {
        "response_type": "in_channel",
        "text": `Success`
      };

      REQUEST.post(response_url, { json: channel_response_payload } );
    })
    .catch( err => {
      channel_response_payload  = {
        "response_type": "in_channel",
        "text": `Error: ${err}`
      };

      REQUEST.post(response_url, { json: channel_response_payload } );
    });
});

exports.description = functions.https.onRequest((request, response) => {
  if (request.method === `OPTIONS`) {
  	response
      .set('Access-Control-Allow-Origin', "*")
  	  .set('Access-Control-Allow-Methods', 'GET, POST')
      .set('Access-Control-Allow-Headers', 'content-type')
  	  .status(200).send();
  	  return;
  }

  let p1 = admin.firestore().collection('adjectives').get()
    .then(snapshot => {
      if(snapshot.docs.length > 1) {
        let index = Math.floor(Math.random() * snapshot.docs.length)
        return snapshot.docs[index].data();
      } else {
        return {adjective: "error-prone"};
      }
    }).catch((err) => {
      return {adjective: err};
    });

  let p2 = admin.firestore().collection('nouns').get()
    .then(snapshot => {
      if(snapshot.docs.length > 1) {
        let index = Math.floor(Math.random() * snapshot.docs.length)
        return snapshot.docs[index].data();
      } else {
        return {adjective: "error"};
      }
    }).catch((err) => {
      return {adjective: err};
    });

  Promise.all([p1, p2]).then( results => {
    description = Object.assign({}, results[0], results[1]);

    REQUEST.post(functions.config().slack.webhook_url,
                 {json: { text: `Dan is a ${description.adjective} ${description.noun}`}});

    response.set('Access-Control-Allow-Origin', "*")
    response.set('Access-Control-Allow-Methods', 'GET, POST')
    response.set('Access-Control-Allow-Headers', 'content-type')
    response.status(200).json(description);
  }).catch((err) => {
    response.send(err);
  });
});
