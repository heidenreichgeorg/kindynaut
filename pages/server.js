
// START FROM PROJECT ROOT WITH
// node pages/server.js 

import * as http from 'http';

import { handler } from './DOWNLOAD_XL.mjs';

import { store } from './fs_client.js'

const SERVER_PORT= 8080;


const server = http.createServer((request, response) => {
  
  if(request.method) console.log("0500 Server Method "+JSON.stringify(request.method));
  
  if(request.url) {
    console.log("0500 Server URL "+JSON.stringify(request.url));
    if(request.method==='GET' && request.url.startsWith('/DOWNLOAD?')) handler(request,response);
    else if(request.method==='POST' && request.url.startsWith('/STORE?')) store(request,response);
    return;
  }
  else {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.write("0510 server does not know "+request.url);
    response.end();
  }
});

server.listen(SERVER_PORT, () => {
  console.log("0510 Server is running on Port "+SERVER_PORT);
});

// node pages/server.js