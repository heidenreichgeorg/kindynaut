
import {initializeApp} from "firebase/app";
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { getURLParams, timeSymbol } from './node_utils.js'


export async function storeFile(request,response) {

  let strTimeSymbol = timeSymbol();

  const params = getURLParams(request);
  console.log("0650 app.post PUT with "+JSON.stringify(params))
   
  const firestoreConfig = {
      "apiKey": process.env.GCP_APIKEY,
      "authDomain": process.env.GCP_AUTHDOMAIN,
      "projectId": process.env.GCP_PROJECTID,
      "storageBucket": process.env.GCP_STORAGEBUCKET,
      "messagingSenderId": process.env.GCP_MESSAGINGSENDERID,
      "appId": process.env.APPID
  }

  console.log("0652 app.post PUT defined config "+JSON.stringify(firestoreConfig));

  try {
  
    //firestoreConfig.credential=fs.credential.cert(serviceAccountKey);
    //console.log("0656 app.post PUT fs.credential.cert OK")

    try {
      // Initialize Firebase
      const app = initializeApp(firestoreConfig,"kindynaut");
      if(app) console.log("0656 app.post PUT initializeApp OK")
      else console.log("0657 app.post PUT initializeApp FAILED.")
      
      try {
        
        // Initialize Cloud Firestore and get a reference to the service
        const db = getFirestore(app);
        if(db) console.log("0658 app.post PUT getFirestore(app) OK")
        else console.log("0659 app.post PUT getFirestore(app) FAILED")


        let physical_system_crash={
          comp: 'Static System',
          func: 'General',
          hazard: 'Suspending parts',
          cause: 'Wear, aging, deterioration',
          code: 'HK_1',
          hazardousSituation:'Parts may fall onto the user',
          harm:'Physical injury'
        }

        
        // DOMAIN-PORTAL ID external to the concept itself
        var dosh_id = '01';

        collection(db,'DiagnosticImaging').add({    
              domainHazards: [{
                id: dosh_id, info: physical_system_crash 
              }]
        })



        // first argument needs to be a CollectionReference
        // Add a new document in collection "DiagnosticImaging"
        // await addDoc(db,  physical_system_crash  );


      } catch(err) { console.log("0655 cannot getFirestore "+err) }
    } catch(err) { console.log("0653 cannot initializeApp "+err) }
  } catch(err) { console.log("0651 cannot get credentials "+err) }
}


/*------------
  const admin = require('firebase-admin');
  const serviceAccount = require('../path/to/service-account.json');

  const firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "dB_URL"
  });





  // Enter new data into the document.
  await document.set({
    title: 'Welcome to Firestore',
    body: 'Hello World',
  });
  console.log('Entered new data into the document');
}

function fs_update() {
  // Update an existing document.
  // Obtain a document reference.
  const document = firestore.doc('posts/intro-to-firestore');
  await document.update({
    body: 'My first Firestore app',
  });
  console.log('Updated an existing document');
}

function fs_read() {
  // Read the document.
  // Obtain a document reference.
  const document = firestore.doc('posts/intro-to-firestore');
  const doc = await document.get();
  console.log('Read the document');
}
function fs_delete() {
  // Delete the document.
  // Obtain a document reference.
  const document = firestore.doc('posts/intro-to-firestore');
  await document.delete();
  console.log('Deleted the document');
}

*/


/*

function handleJSONSave(jContent) {
        
  const  b64encoded= Buffer.from(strJustification,"utf8").toString('base64');

  let anchor = document.getElementById('table0');
  if(anchor) {
      const newDiv = document.createElement('div');
      newDiv.innerText = b64encoded;
      newDiv.className = "FIELD MOAM";

      anchor.appendChild(newDiv);
  }
  
  const manufacturer="manufacturer";
  const product="product";
  const version="version"

  const rqHeaders = {  'Accept': 'application/octet-stream',
                          'Access-Control-Allow-Origin':'*',
                          'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept, Authorization' };

  
  const rqOptions = { method: 'GET', headers: rqHeaders, mode:'cors'};
  try {                
      fetch(`${REACT_APP_API_HOST}/RISKTABLE?manufacturer=${manufacturer}&product=${product}&version=${version}`, rqOptions)
      .then((response) => response.blob())
      .then((blob) => URL.createObjectURL(blob))
      .then((url) => console.log("0766 handleJSONSave URL= "+ makeURLButton(url,manufacturer,product,version)))
      .catch((err) => console.error("0765 handleJSONSave fetch ERR "+err));           
  } catch(err) { console.log("0767 GET /EXCEL handleJSONSave:"+err);}
  console.log("0878 handleJSONSave EXIT");
}
*/