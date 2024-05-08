// START FROM PROJECT ROOT WITH
// node --env-file .\pages\.env  .\pages\server.mjs 
// Needs env constant DOMAINROOT as the root of all domains

import express from "express";

const SERVER_PORT= 8080;

import { downloadHBook } from './DOWNLOAD_XL.mjs';
import { updateDomain } from './UPDATE.js';
import { storeFile } from './fs_client.js'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get('/DOWNLOAD', downloadHBook );

app.post('/UPDATE', updateDomain );
app.post('/STORE', storeFile );

app.listen(SERVER_PORT, () => {
  console.log(`Domain server app listening on port ${SERVER_PORT}`)
})



