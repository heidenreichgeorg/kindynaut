const projectId = 'praxis-practice-368022'

import {fs}  from 'firebase-admin'

import { timeSymbol } from './node_utils'

async function put(request,response) {

  let strTimeSymbol = timeSymbol();
  console.log("\n\n0650 PUT at "+strTimeSymbol);

  const params = getURLParams(req);
  console.log("0652 app.post PUT with "+JSON.stringify(params));
   
  const serviceAccount = process.env.GCP_FS_KEY;
  
  // TODO: Replace the following with your app's Firebase project configuration
  // See: https://support.google.com/firebase/answer/7015592
   const firebaseConfig = {
    database:'kindynaut',
    dbId:'praxis-practice',
    credential: fs.credential.cert(serviceAccount)
  }

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  
  
  // Initialize Cloud Firestore and get a reference to the service
  const db = getFirestore(app);
  


  // open a collection
  const dosh = db.collection('/DiagnosticImaging/DomainSpecificHazard/dosh'); 

  const physical_system_crash = dosh.doc('physical_system_crash'); 

  await physical_system_crash.set({
    comp: 'Static System',
    func: 'General',
    hazard: 'Suspending parts',
    cause: 'Wear, aging, deterioration',
    code: 'HK_1',
    hazardousSituation:'Parts may fall onto the user',
    harm:'Physical injury'
  });
}
/*------------

const {Firestore} = require('@google-cloud/firestore');
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firestore = new Firestore();

  // Create a new client
  //const db = fs.firestore(); 

async function fs_create() {
  // Obtain a document reference.
  const document = firestore.doc('posts/intro-to-firestore');

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