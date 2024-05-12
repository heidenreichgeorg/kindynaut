import { BASE_FILE, getURLParams, dateSymbol, FILE_SLASH, timeSymbol } from './node_utils.js'

import { readFileSync } from "fs"

// READA base.txt in <domain> specified in URL and blat it down to the clalling client

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

        console.log("0606 reading " +  domainData);
    
        try {
            let jDomainList = JSON.parse(domainData); 
            let arrDOSH=[];

            // not quite...
            Object.keys(jDomainList).forEach((key)=>{
                arrDOSH.push(jDomainList[key]);

                console.log("  610 "+key+" "+arrDOSH.length+
                    arrDOSH.map((dosh)=>("\n      "+dosh.hazard+"/"+dosh.harm+"/"+dosh.hazardousSituation)).join(' '))
            })
           
        } catch (err) { 
            console.error(err); 
        } 
              
           
    } catch (err) { 
        console.error(err); 
    } 

    console.log(" 0620 reading completed.");

    
    
    if(arrDOSH.length) {

        res.writeHead(HTTP_OK, {"Content-Type": "text/plain;charset=utf-8"});

        
        res.write(arrLines.join('\n'));

        /* EXAM-X
        arrLines.forEach((line,n)=>{
          num++;
          if(num<60) console.log(line); // EXAM-X
        });      
        */
        console.dir ( "0632 INIT FILE with "+arrLines.length+" lines.");

    } else {
      console.dir ( "0631 INIT EMPTY FILE "+file);
      res.writeHead(HTTP_WRONG, {"Content-Type": "text/html"});
    }

    res.write('\n\n');
    res.write('\n\n');
    res.end(); 
}
