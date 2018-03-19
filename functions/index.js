const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


exports.adjective = functions.https.onRequest((request, response) => {
  response.set('Access-Control-Allow-Origin', "*")
  response.set('Access-Control-Allow-Methods', 'GET, POST')
  response.set('Access-Control-Allow-Headers', 'content-type')
    admin.firestore().collection('adjectives').get()
      .then(snapshot => {
        if(snapshot.docs.length > 1) {
          let index = Math.floor(Math.random() * snapshot.docs.length)
          return response.status(200).json(snapshot.docs[index].data());
        } else {
          return response.status(200).json({adjective: "error-prone"});
        }
      }).catch((err) => {
        return response.json({adjective: err});
      });
});

exports.noun = functions.https.onRequest((request, response) => {
  response.set('Access-Control-Allow-Origin', "*")
  response.set('Access-Control-Allow-Methods', 'GET, POST')
  response.set('Access-Control-Allow-Headers', 'content-type')
    admin.firestore().collection('nouns').get()
      .then(snapshot => {
        if(snapshot.docs.length > 1) {
          let index = Math.floor(Math.random() * snapshot.docs.length)
          return response.status(200).json(snapshot.docs[index].data());
        } else {
          return response.status(200).json({adjective: "error"});
        }
      }).catch((err) => {
        return response.json({adjective: err});
      });
});
