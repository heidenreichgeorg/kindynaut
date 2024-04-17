
import { PORT,timeSymbol, strSymbol } from '../src/util'
import type { NextApiRequest, NextApiResponse } from 'next'

//import * as os from 'os';
//const os = require('os');
// had to nmp install --save-dev @types/node

var nets;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
  ) {
    let strTimeSymbol = timeSymbol();
    console.log("\n\n0900 UPLOAD at "+strTimeSymbol);


    // client sends yearclient.JSON file
    // this json has to be stored in heap
    //var signup = "NO SESSION";

    //let remote = JSON.stringify(req);
    //console.log("0908 app.post UPLOAD from "+remote);


    let socket = req.socket;
    console.dir("0908 app.post UPLOAD with "+JSON.stringify(socket));

    let rawData = req.body;
    console.dir("0910 app.post UPLOAD with "+rawData);

    //nets = os.networkInterfaces();

    if(rawData && rawData.client && rawData.year) {

       
        let clientFunction=rawData.clientFunction.split('_')[0];    
        
        let computed = timeSymbol();

        if(clientFunction) {
            console.dir("0914 app.post UPLOAD with function="+clientFunction+" ---> "+computed);
         
            let sessionData = rawData;

                        

            console.dir("0920 app.post UPLOAD starts offline");
            

            
            let cmdLogin = "http://localhost:"+PORT;
            // should not set a sesssion.id because id not known while async save2bucket is not finished       

            console.dir("0922 app.post UPLOAD rendering QR code");
            res.write('<DIV class="attrRow"><H1>KindyNaut&nbsp;&nbsp;</H1>'
                +'<DIV class="KNLINE"><DIV class="FIELD C100"><A HREF="'+cmdLogin+'"><BUTTON class="largeKey">LOGIN</BUTTON></A></DIV></DIV>'
                +'</DIV>'
                );
            res.end();
            

        } else console.log ( "0913 UPLOAD VOID");

        return;
    } else {
        console.error ( "0909 UPLOAD EMPTY JSON "+JSON.stringify(Object.keys(rawData)));

    }
    // send back sessionId to client browser or file
    //res.writeHead(HTTP_WRONG, {"Content-Type": "text/html"});
    res.write("\n<HTML><HEAD><link rel='stylesheet' href='./src/index.css'/></HEAD><TITLE>UPLOAD</TITLE>INVALID SESSION FILE 'aris' MISSING</HTML>\n\n"); 
    res.end();
}
