const functions = require('firebase-functions');
const admin = require('firebase-admin');
const rp = require('request-promise');
const REQUEST = require('request');

admin.initializeApp(functions.config().firebase);


exports.description = functions.https.onRequest((request, response) => {

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

// exports.slack = function.https.onRequest((request, response) => {
//
// });


/**
 * Post a message to Slack about the new GitHub commit.
 */
function postToSlack(msg) {
  return rp({
    method: 'POST',
    // TODO: Configure the `slack.webhook_url` Google Cloud environment variables.
    uri: functions.config().slack.webhook_url,
    body: {
      text: `Dan is a ${msg}`,
    },
    headers: {
        'User-Agent': 'Request-Promise',
        'Access-Control-Allow-Origin': "*",
        'Access-Control-Allow-Methods': 'POST'
    },
    json: true,
  });
}
