const functions = require('firebase-functions');
const admin = require('firebase-admin');
const rp = require('request-promise');
const REQUEST = require('request');

admin.initializeApp(functions.config().firebase);

function advancedStackExchangeSearch(text) {
  return rp({
    uri: 'https://api.stackexchange.com/2.2/search/advanced',
    qs: {
      key: functions.config().so.api_key,
      site: 'stackoverflow',
      order: 'desc',
      sort: 'activity',
      q: text
    },
    json: true,
    gzip: true
  });
}

function stackOverflowTagsPageRequestPromise(page) {
  return rp({
    uri: 'https://api.stackexchange.com/2.2/tags',
    qs: {
      key: functions.config().so.api_key,
      site: 'stackoverflow',
      order: 'desc',
      sort: 'popular',
      pagesize: '100',
      page: page
    },
    json: true,
    gzip: true
  });
}

function getStackOverflowPage(page) {
  return stackOverflowTagsPageRequestPromise(page)
    .then( (soResponse) => {
      if(soResponse.items && soResponse.items.length > 0) {
        console.log(`Received a response for page ${page} from SO with ${soResponse.items.length} items.`)
        //Parse the tags - storing them in our own collection.
        var batch = admin.firestore().batch();

        for (let tag of soResponse.items) {
          batch.set(admin.firestore().collection('tags').doc(tag.name), tag);
        }

        return batch.commit()
          .then(function () {
            if( soResponse.has_more ) {
              // Make a request to pull the next page if it is needed.
              page++;
              if( page <= 10 ) {
                return getStackOverflowPage(page);
              } else {
                return page;
              }
            }
          })
          .catch( err => {
            console.error(`Error committing batch: ${err}`);
            return page;
          });

      }
    })
    .catch( err => {
      console.error(`Error Pulling Tags from SO: ${err}`);
      return page;
    });
}

exports.askdan = functions.https.onRequest((request, response) => {
  if (!request.body || request.body.token !== functions.config().slack.verification_token) {
    response.status(401).send("Invalid Token");

    return;
  }

  let response_url = request.body.response_url;

  var question = admin.firestore().collection('questions').add({
    question: request.body.text,
    user_id: request.body.user_id,
    created: new Date()
  }).then(ref => {

  });

  if (question.question === 'help') {
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

    return;
  }

  let ephemeral_response_payload = {
    "response_type": "ephemeral",
    "text": "Asking Dan..."
  };

  response
    .set('Content-type', 'application/json')
    .status(200)
    .send(ephemeral_response_payload);

  let channel_response_payload  = {
    "response_type": "in_channel",
    "text": `You asked: ${question.question} \n Dan Says:`
  };

  advancedStackExchangeSearch(question.question)
    .then( (soResponse) => {
      if(soResponse.items && soResponse.items.length > 0) {
        // for(let item of soResponse.body.items) {
        channel_response_payload['attachments'] = [
          {
            "text": `Lazy sack of bones... Try this: ${soResponse.items[0].link}`
          }
        ]
      } else {
        channel_response_payload['attachments'] = [
          {
            "text": `I don't know what to say... Didn't find anything for you, brah.`
          }
        ]
      }

      REQUEST.post(response_url, { json: channel_response_payload } );
    })
    .catch( err => {
      channel_response_payload['attachments'] = [
        {
          "text": `Error: ${err}`
        }
      ]

      REQUEST.post(response_url, { json: channel_response_payload } );
    });
});

exports.syncTags = functions.https.onRequest((request, response) => {
  getStackOverflowPage(1)
    .then(function (result) {
      // TODO - return some sort of stats about the tag sync? Maybe # of tags synced? (Page - 1) * pagesize + (last page count)
      response.send(`I did a thing - ${result}`)
    })
    .catch( err => {
      console.error(`Error resolving recursive tag process: ${err}`);
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
