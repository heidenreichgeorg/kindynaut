// START FROM PROJECT ROOT WITH
// node pages/server.js 

import { writeFile } from 'node:fs/promises'


// load an XLSX file from the server storage

const HTTP_OK     = 200;
const HTTP_WRONG  = 400;

var jFile = {
  "id": 1,
  "name": "DeviceAssurance",
  "justification": {
      "id": 2,
      "name": "Safety",
      "file": "risktable.json",
      "manufacturer": "Illuminati",
      "project": "HOROSKOP",
      "version": "VA01",      
  }
}
 

import { readHBook } from "./readXL.js"

import { getURLParams, timeSymbol } from './node_utils.js'

export async function downloadHBook(
    req, //: NextApiRequest,
    res//: NextApiResponse<any>
  ) {
    let strTimeSymbol = timeSymbol();
    console.log("\n\n0600 DOWNLOAD at "+strTimeSymbol);

    const params = getURLParams(req);
    console.log("0620 app.post DOWNLOAD with "+JSON.stringify(params));
    const file = params.file;
    
    console.log("0630 app.post DOWNLOAD with "+file);
    
    if(file && file.length>3) {

        res.writeHead(HTTP_OK, {"Content-Type": "text/plain;charset=utf-8"});

        let rTable = jFile.justification;
        let mari = readHBook(file,createItem);

        rTable.justification = mari
        writeTable('c:/temp/csvTable.json',JSON.stringify(jFile))
        
        res.write(""+mari.length+"\n"); // better put it all in req.end in one go 
     
        console.dir ( "0632 DOWNLOAD FILE with "+mari.length+" lines.");

    } else {
      console.dir ( "0631 DOWNLOAD EMPTY FILE "+file);
      res.writeHead(HTTP_WRONG, {"Content-Type": "text/html"});
    }

    res.write('\n\n');
    res.write('\n\n');
    res.end(); 



      
  function createItem(risk) {
    // VDE SPEC 90025 convention
    let managedRisk={'name':risk.HazardousSituation};
    let mari={ 'id':risk.itemNumber, 'name':"DomainSpecificHazard", 'function':{'name':risk.Function }}
    try {

        // Siemens Healthineers combine Harm and Generic Hazards with GHx#
        let hazards = risk.Hazard
        let hazardsHarm=hazards.split("Generic Hazards");
        let harmName = hazardsHarm.shift();
        mari.harm={ 'name': harmName }
        mari.genericHazards=hazardsHarm[0].split('GH');

        // VDE SPEC 90025 convention
        mari.hazard = { 'name':risk.Function+' '+harmName }

        managedRisk.subjectGroups=risk.Target.split(SLS);

        if(flagRisk) {
            // risk vectors are combined with dash -
            let initial = risk.Initial.split('-');
            managedRisk.preRiskEvaluation = { 'severity':initial[0],'probability':initial[1],'riskRegion':initial[2]}

            let residual = risk.Residual.split('-');
            managedRisk.postRiskEvaluation = { 'severity':residual[0],'probability':residual[1],'riskRegion':residual[2]}
        }
        mari.managedRisks=[managedRisk]

        //mari.source=JSON.stringify(check))
    } catch(e) {}
    
    return mari;
  }

}



async function writeTable(filePath,strRisks) {
  try {
    console.log("0470 writeTable to "+filePath);
    await writeFile(filePath, strRisks);
  } catch (err) {
        console.log("0471 writeTable to "+filePath+":"+err);
  }
}



//module.exports = { handler };

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
