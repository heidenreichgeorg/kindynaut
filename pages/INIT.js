import { arrDOSH, BASE_FILE, clearDOSH, dosh, getURLParams, HTTP_OK, HTTP_WRONG, dateSymbol, FILE_SLASH, timeSymbol } from './node_utils.js'

import { readFileSync } from "fs"

// READ base.txt in <domain> folder specified in URL and blast it down to the calling client

export async function initDomain(
    req, //: NextApiRequest,
    res//: NextApiResponse<any>
  ) {
    let strTimeSymbol = timeSymbol();
    let strDateSymbol = dateSymbol();
    console.log("\n\n0600 INIT at "+strTimeSymbol+" on "+strDateSymbol);

    let domainRoot = process.env.GCP_DOMAINROOT;
    if(domainRoot.slice(-1)===FILE_SLASH) {} else domainRoot=domainRoot+FILE_SLASH;

    const params = getURLParams(req);
    console.log("0602 app.post INIT with "+JSON.stringify(params));
    const domain = params.domain;
    console.log("0604 app.post INIT for "+domain);
    
    const domainPath = domainRoot + domain + BASE_FILE;
    try {    
        let domainData = readFileSync(domainPath); 
        console.log("0606 reading #" +  Object.keys(domainData).length);
        try {
            let jDomainList = JSON.parse(domainData); 

            // CLEAR THE SERVER'S DOSH LIST
            clearDOSH();
            Object.keys(jDomainList).forEach((key)=>{
                
                let localList=jDomainList[key];
                console.log("  610 "+key+" "+JSON.stringify(localList));
                localList.forEach((jDosh)=>{arrDOSH.push(dosh(jDosh));})
            })
        } catch (err) { 
            console.error(err); 
        } 
    } catch (err) { 
        console.error(err); 
    } 
    console.log(" 0620 reading "+arrDOSH.length+" completed.");
    
    if(arrDOSH.length>0) {
        let arrLines = arrDOSH.map((dosh)=>(JSON.stringify(dosh)));
        let body = JSON.stringify(arrLines)
        res.writeHead(HTTP_OK,{
            "Content-Type": "application/json;charset=utf-8",
            "Content-Length":Buffer.byteLength(body),
            "Access-Control-Allow-Origin": "*"
        });
        res.end(body); // JSON
        console.dir ( "0632 INIT FILE with "+arrLines.length+" lines.");

    } else {
      console.dir ( "0631 INIT EMPTY FILE "+domainPath);
      res.writeHead(HTTP_WRONG, {"Content-Type": "text/html"});
      res.end("EMPTY FILE"); 
    }

   
}
