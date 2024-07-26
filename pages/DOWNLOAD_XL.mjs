// START this backend server FROM PROJECT ROOT WITH command:
// node pages/server.js 

import { writeFile } from 'node:fs/promises'

import { processRiskTable } from "./generateInternalFile.js"

// server responsds to downloadHBook with loading an XLSX file from the server storage
// server will then create a RiskTable format
// and in a next step save this in InternalFile format as per VDE SPEC 90025

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
      "version": "VA01"      
  }
}

const flagRisk=true;
const flagMitigations=true;

const SLS = ';';

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
        
        writeTable('c:/temp/InternalFile.json',processRiskTable(jFile))

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
      // VDE SPEC 90025 convention for riskTable
      let managedRisks={ 'name':risk.HazardousSituation };
      let mari={ 'id':risk.itemNumber, 'name':"DomainSpecificHazard", 'function':{'name':risk.Function }}
      try {
          // Siemens Healthineers combine Harm and Generic Hazards with GHx#
          let hazards = risk.Hazard
          let hazardsHarm=hazards.split("Generic Hazards");
          let harmName = hazardsHarm.shift();
          mari.harm={ 'name': harmName }
          mari.genericHazards=hazardsHarm[0].split('GH');

          // riskTable generator GH20240725
          mari.dosh = { 'name':risk.Function+' '+harmName }

          managedRisks.subjectGroups=risk.Target.split(SLS);
          
          if(flagRisk) try {
              // risk vectors are combined with dash -
              let initial = risk.Initial.split('-');
              managedRisks.preRiskEvaluation = { 'severity':initial[0],'probability':initial[1],'riskRegion':initial[2]}
          } catch(e) { console.log("createItem managedRisk INITIAL failed: "+e) }

          if(flagRisk) try {

              let residual = risk.Residual.split('-');
              managedRisks.postRiskEvaluation = { 'severity':residual[0],'probability':residual[1],'riskRegion':residual[2]}
          } catch(e) { console.log("createItem managedRisk RESIDUAL failed: "+e) }
          
          if(flagMitigations) try { managedRisks.mitigations = risk.Measures.split(SLS); } catch(e) {}

          mari.managedRisks=[managedRisks]
              
      } catch(e) { console.log("createItem main failed: "+e) }
      
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

