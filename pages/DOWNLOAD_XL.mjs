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
  "claim": {
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
import { stringify } from 'node:querystring';

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

        let jArrManagedRisk = readHBook(file,mapCaption,createItem);

        let safetyClaim = jFile.claim;
        safetyClaim.justification = jArrManagedRisk;
        writeTable('c:/temp/riskTable.json',JSON.stringify(jFile))
        
        writeTable('c:/temp/InternalFile.json',processRiskTable(jFile))

        res.write(""+Object.keys(jArrManagedRisk).length+"\n"); // better put it all in req.end in one go 
     
        console.dir ( "0632 DOWNLOAD FILE with"+(jArrManagedRisk ? (" "+Object.keys(jArrManagedRisk).length) : "out any")+" risks.");

    } else {
      console.dir ( "0631 DOWNLOAD EMPTY FILE "+file);
      res.writeHead(HTTP_WRONG, {"Content-Type": "text/html"});
    }

    res.write('\n\n');
    res.write('\n\n');
    res.end(); 

    
    function mapCaption(comps)  {
        let tableMap=null;
        // isNaN comps[0]

        // (A) sheet caption - F# H# C# M# are of numeric data type and need careful handling
        if(comps[0].startsWith('F#')) {            
          tableMap={};
          comps.forEach((strColumn,col) => {
                  let column=strColumn.trim();
                  // remember column index for each defined columns
                  if(column.startsWith('F#')) { tableMap.FuncNum={'from':col,'to':col}; //console.log("0480F NEXT COLUMN("+col+") with tableMap="+JSON.stringify(tableMap)); 
                }
                  if(column.startsWith('Function')) tableMap.Function={'from':col,'to':col};
                  if(column.startsWith('H#')) { tableMap.HarmNum={'from':col,'to':col}; //console.log("0480H NEXT COLUMN("+col+") with tableMap="+JSON.stringify(tableMap)); 
                  }
                  if(column.startsWith('C#')) { tableMap.CauseNum={'from':col,'to':col}; //console.log("0480C NEXT COLUMN("+col+") with tableMap="+JSON.stringify(tableMap)); 
                  }
                  if(column.startsWith('Hazardous')) tableMap.HazardousSituation={'from':col,'to':col};
                  else // prefix
                      if(column.startsWith('Hazard')) tableMap.Hazard={'from':col,'to':col}; 

                  if(column.startsWith('Effect')) tableMap.Target={'from':col,'to':col};
                  if(column.startsWith('Pre/Post')) tableMap.PrePost={'from':col,'to':col};
                  if(column.startsWith('Initial')) tableMap.Initial={'from':col,'to':col};
                  if(column.startsWith('M#')) { tableMap.MeasNum={'from':col,'to':col}; //console.log("0480M NEXT COLUMN("+col+") with tableMap="+JSON.stringify(tableMap)); 
                  }
                  if(column.startsWith('Measure')) tableMap.Measure={'from':col-1,'to':col};
                  if(column.startsWith('Residual')) tableMap.Residual={'from':col,'to':col};

                  
            });

            
            return tableMap;
        }

        return null;
        // (B) else other text line
       // comps0 is text--> don't use this
    }


    function createItem(risk) {    
      // VDE SPEC 90025 convention for riskTable

      //console.log("createItem ENTER risk: "+JSON.stringify(risk)) 
      let managedRisks={ 'name':risk.HazardousSituation };
      let mari={ 'id':risk.itemNumber, 
                'name':"DomainSpecificHazard", 
                'function':{'name':risk.Function },
                'funcNum': risk.FuncNum,
                'harmNum': risk.HarmNum,
                'causeNum': risk.CauseNum
              }
      //console.log("createItem ENTER mari: "+JSON.stringify(mari)) 
      try {
          // Siemens Healthineers combine Harm and Generic Hazards with GHx#
          let hazards = risk.Hazard
          let hazardsHarm=hazards.split("Generic Hazards");
          let harmName = hazardsHarm.shift();
          mari.harm={ 'name': harmName }
          mari.genericHazards=hazardsHarm[0].split('GH');

          // see riskTable generator GH20240725
          mari.risk = { 'name':risk.Function+' '+harmName+' '+ managedRisks.name,   'id':"F"+risk.FuncNum+"H"+risk.HarmNum+"C"+risk.CauseNum   } 
          

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
          
          if(flagMitigations)  { 
            managedRisks.mitigations = risk.Measure
            let leftCol = []; try { leftCol=risk.lMeasure.split(SEP); } catch(e) {}
             let rightCol =[]; try { rightCol=risk.rMeasure.split(SEP) } catch(e) {}
             let delta=leftCol.length-rightCol.length;
             try {
                if(delta>0)  rightCol.concat(Array(delta).fill(""))
                if(delta<0)  leftCol.concat(Array(-delta).fill(""))
             } catch(e) {}
             //managedRisks.mitigations = []
             //leftCol.forEach((leftCell,i)=>managedRisks.mitigations.push(leftCell))
          }

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

