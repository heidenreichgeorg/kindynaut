import { getURLParams, dateSymbol, FILE_SLASH, makeKey,  timeSymbol } from './node_utils.js'

import fs from "node:fs"

export async function updateDomain(req,res) {
    let strTimeSymbol = timeSymbol();
    let strDateSymbol = dateSymbol();
    console.log("\n\n0900 UPDATE at "+strTimeSymbol+" on "+strDateSymbol);

    let rawData=req.body;
    if(rawData) {
        
        console.log("0912 app.post UPDATE receives req.body #"+rawData.length);

        const params = getURLParams(req);
        console.log("0914 app.post DOWNLOAD with "+JSON.stringify(params));
        const domain = params.domain;
                   
        // server must be exclusive owner of DOMAINROOT content
        // BODY IS INTEGRATED into what the server already had loaded
        try {
            // assume this is an array of dosh
            // must create keys like simpleKey harm x simpleKey hazard 
            let domainData = JSON.parse(rawData)

            let total = domainData.length;
            console.log("0916 domainData= #"+total)

            let domainObject={};
            domainData.forEach((dosh,i)=>{
                let key = makeKey(dosh.harm)+"0"+makeKey(dosh.hazard)+"0"+makeKey(dosh.hazardousSituation);
                if(domainObject[key]==null) domainObject[key]=[];
                domainObject[key].push(dosh);
            })

            let domainPath = process.env.GCP_DOMAINROOT + FILE_SLASH + domain + FILE_SLASH + "base.json";

            console.log("0918 domainData#-domainObject#="+(total-Object.keys(domainObject).length))

            Object.keys(domainObject).forEach((key)=>{
                let arrDOSH=domainObject[key];
                console.log("  0920 "+key+" "+arrDOSH.length+
                    arrDOSH.map((dosh)=>("\n      "+dosh.hazard+"/"+dosh.harm+"/"+dosh.hazardousSituation)).join(' '))
            })
          
           
            const content = JSON.stringify(domainObject);
            fs.writeFile(domainPath, content, err => {
              if (err) {
                console.error("  0921 writing file "+domainPath+":"+err);
              } else {
                console.log("  0922 file "+domainPath+" written successfully.");
              }
            });

            res.write('<DIV class="attrRow"><H1>KindyNaut&nbsp;&nbsp;</H1>'
                +'<DIV class="KNLINE">'
                    +'<DIV class="FIELD LNAM">'+domainData.length+'</DIV></DIV>'
                    +'<DIV class="FIELD LNAM">'+domainPath+'</DIV></DIV>'
                    +'<DIV class="FIELD LNAM">'+domain+'</DIV></DIV>'
                    +'<DIV class="FIELD LNAM">'+Object.keys(domainObject).length+'</DIV></DIV>'
                +'</DIV>'
                );
            res.end();
            
        } catch(err) { console.log ( "0913 UPDATE VOID "+err); }

        return;
    } else {
        console.error ( "0909 UPDATE RECEIVES EMPTY BODY " );
    }
    // send back sessionId to client browser or file
    //res.writeHead(HTTP_WRONG, {"Content-Type": "text/html"});
    res.write("\n<HTML><HEAD><link rel='stylesheet' href='./src/index.css'/></HEAD><TITLE>UPDATE</TITLE>INVALID SESSION FILE 'aris' MISSING</HTML>\n\n"); 
    res.end();
}
