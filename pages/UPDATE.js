import { getURLParams, dateSymbol, timeSymbol } from './node_utils.js'


export async function updateDomain(req,res) {
    let strTimeSymbol = timeSymbol();
    let strDateSymbol = dateSymbol();
    console.log("\n\n0900 UPDATE at "+strTimeSymbol+" on "+strDateSymbol);

    let rawData=req.body;
    if(rawData) {
        console.log("0912 app.post UPDATE receives "+rawData);

        const params = getURLParams(req);
        console.log("0914 app.post DOWNLOAD with "+JSON.stringify(params));
        const domain = params.domain;
                   
        // server must be exclusive owner of DOMAINROOT content
        // BODY IS INTEGRATED into what the server already had loaded
        try {
            // assume this is an array of dosh
            // must create keys like simpleKey harm x simpleKey hazard 
            let sessionData = JSON.parse(rawData)

            console.log("0916 sessionData= #"+sessionData.length)

            let domainRoot = process.env.GCP_DOMAINROOT;

            res.write('<DIV class="attrRow"><H1>KindyNaut&nbsp;&nbsp;</H1>'
                +'<DIV class="KNLINE">'
                    +'<DIV class="FIELD LNAM">'+sessionData.length+'</DIV></DIV>'
                    +'<DIV class="FIELD LNAM">'+domainRoot+'</DIV></DIV>'
                    +'<DIV class="FIELD LNAM">'+domain+'</DIV></DIV>'
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
