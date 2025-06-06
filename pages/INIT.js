import { arrDOSH, BASE_FILE, clearDOSH, dateSymbol, dosh, getURLParams, HTTP_OK, HTTP_WRONG, FILE_SLASH, MINTEXT, sane, timeSymbol } from './node_utils.js'

import { readFileSync } from "fs"

// READ base.txt in <domain> folder specified in URL and respond it down to the calling client

// sane() to sanitize external strings

export async function initDomainServer(
    req, //: NextApiRequest,
    res//: NextApiResponse<any>
  ) {
    let strTimeSymbol = timeSymbol();
    let strDateSymbol = dateSymbol();
    console.log("\n\n0530 INIT at "+strTimeSymbol+" on "+strDateSymbol);

    let domainRoot = sane(process.env.GCP_DOMAINROOT);
    if(domainRoot.slice(-1)===FILE_SLASH) {} else domainRoot=domainRoot+FILE_SLASH;

    const params = getURLParams(req);
    console.log("0532 app.post INIT with "+JSON.stringify(params));
    let domainPath = "?";
    const domain = params.domain;
    if(domain && domain.length>MINTEXT) {
        console.log("0534 app.post INIT for "+domain);
        
        domainPath = domainRoot + domain + BASE_FILE;
        try {    
            let domainData = readFileSync(domainPath); 
            console.log("0536 reading #" +  Object.keys(domainData).length+ " from "+domainPath);
            try {
                let jDomainList = JSON.parse(domainData); 

                // CLEAR THE SERVER'S DOSH LIST
                clearDOSH();
                Object.keys(jDomainList).forEach((key)=>{
                    
                    let localList=jDomainList[key];
                    //console.log(" 0538 "+key+" "+JSON.stringify(localList));
                    localList.forEach((jDosh)=>{arrDOSH.push(dosh(jDosh));})
                })
            } catch (err) { 
                console.error(" 0535 initDomainServer "+err); 
            } 
        } catch (err) { 
            console.error(" 0533 initDomainServer "+err); 
        } 
        console.log(" 0540 reading "+arrDOSH.length+" completed.");
    } // if domain
    else console.error(" 0531 initDomainServer NO DOMAIN in URL request"); 


    if(arrDOSH.length>0) {
        let arrLines = arrDOSH.map((dosh)=>(JSON.stringify(dosh)));
        let body = JSON.stringify(arrLines)
        res.writeHead(HTTP_OK,{
            "Content-Type": "application/json;charset=utf-8",
            "Content-Length":Buffer.byteLength(body),
            "Access-Control-Allow-Origin": "*"
        });
        res.end(body); // JSON
        console.dir ( "0542 initDomainServer INIT FILE with "+arrLines.length+" lines.");

    } else if(domainPath && domainPath.length>MINTEXT && domain && domain.length>MINTEXT) {
      console.dir ( "0541 initDomainServer INIT EMPTY FILE (domain "+domain+") FROM domainPath "+domainPath);
      res.writeHead(HTTP_WRONG, {"Content-Type": "text/html"});
      res.end("EMPTY FILE"); 

    } else {
      console.dir ( "0541 initDomainServer INIT NO DOMAIN");
      res.writeHead(HTTP_WRONG, {"Content-Type": "text/html"});
      res.end("NO DOMAIN"); 
    }

   
}
