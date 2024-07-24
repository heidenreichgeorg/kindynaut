    // NODE ONLY

import { writeFile } from 'node:fs/promises'

import { sane } from './node_utils.js'

/* in NODE.JS it looks like that: */
import pkg from 'xlsx'; // CommonJS
const { readFile,utils } = pkg;


// consumes and HBOOK.xlsx

// generates a Risk Table as of CRAFTS-MD



const SYS_ROWS=4; // top of each new page


const SLS = ';';
const SEP = ',';
let tableMap={};

let cor=[];
let headers=null;

let flagRisk=false;
let flagMeasures=false;

export function openHBook(fileName,allowRisk,allowMeasures) {

    flagRisk=allowRisk;
    flagMeasures=allowMeasures;


    // does not sanitize XLSX file content

    let saneFileName=sane(fileName);

    // colBuffer represents the current logical line, may span across pages
    // colBuffer is the list of columns of the current RISK
    const columnsHBook=['','','','','','','','','','','','','','','','','','','']
    let colBuffer=columnsHBook;

    // list of consolidated colBuffer values
    let result = []; 
    let riskNumber=0;

    console.log("0400 READ openHBook "+saneFileName)
    try { 
        const workbook = readFile(fileName);
        console.log("0402 READ workbook from  "+saneFileName)
        const sheetNames = workbook.SheetNames;
        console.log("0404 READ workbook with sheets:  "+sheetNames.join(','))


        // digest one sheet, continue existing colBuffer

        // show empty cells as empty string
        const s2j_options={ 'blankrows':true, 'defval':'', 'skipHidden':false };
        sheetNames.forEach((name,sheetNumber)=>{ 
            let definedRows=0;

            headers=null;
            const jTable = utils.sheet_to_json(workbook.Sheets[name],s2j_options);  
            // each sheet in jTable is an array of line objects with markup defined in the first line
            if(jTable){
                if(sheetNumber>=0) { 
                    jTable.forEach((jLine,row)=>{
                        const keyNames = Object.keys(jLine);
                        //console.log("0406 READ workbook line"+row+"/("+sheetNumber+") ["+keyNames.join(' ')+"] "+JSON.stringify(jLine));
                        const comps=keyNames.map((key)=>(((typeof jLine[key]) === 'string')?jLine[key].replaceAll('\n',' '):(jLine[key]?jLine[key]:'')))    
                        if(definedRows<=SYS_ROWS) console.log("0408 READ workbook line"+row+" in ("+sheetNumber+")  "+JSON.stringify(comps));
                        definedRows=transferLine(comps,definedRows);
                    });
                }
                transferLine([99999,"RiskManagement","End of File"],SYS_ROWS+1)
            } //else console.log("0403 READ workbook sheet("+i+")"");
        })            
    } catch(err) {
        console.log("0401 READ workbook from  "+saneFileName+ "  "+err)
       
    }
    
    writeTable('c:/temp/csvTable.csv',result.join('\n'));
    return result; // missing previous risk only



    



    function transferLine(comps,definedRows) {
        //console.log("  0420 RISK "+line)
        //const comps=line.split(SEP);

        let first = comps[0];
        //console.log("0422 "+comps.map((col)=>((col+'             ').substring(0,12))).join('|').substring(0,230));

        if(first) {
            if(isNaN(first)) {
                // (A) sheet caption 
                if(first.startsWith('F#')) {            
                    tableMap={};
                    comps.forEach((strColumn,col) => {
                        let column=strColumn.trim();
                        // remember column index for each defined columns
                        if(column.startsWith('F#')) tableMap.FuncNum=col;
                        if(column.startsWith('Function')) tableMap.Function=col;
                        if(column.startsWith('H#')) tableMap.HarmNum=col;                        
                        if(column.startsWith('C#')) tableMap.CauseNum=col;

                        if(column.startsWith('Hazardous')) tableMap.HazardousSituation=col;
                        else // prefix
                            if(column.startsWith('Hazard')) tableMap.Hazard=col; 

                        if(column.startsWith('Effect')) tableMap.Target=col;
                        if(column.startsWith('Pre/Post')) tableMap.PrePost=col;
                        if(column.startsWith('Initial')) tableMap.Initial=col;
                        if(column.startsWith('M#')) tableMap.MeasNum=col;
                        if(column.startsWith('Measure')) tableMap.Measures=col;
                        if(column.startsWith('Residual')) tableMap.Residual=col;
                    });
                     console.log("0480 NEXT PAGE with map="+JSON.stringify(tableMap));
                     definedRows=0;
                }

                // (B) else other text line
                // comps0 is text--> don't use this


            } else {
                // (C) new risk line
                // comps[0] is numeric
                // get rid of previous risk data, save existing colBuffer, count new risk, initialize colBuffer with value of columnsHBook 
                //result.push(colBuffer.join(';')); // GH20240514 sane() function ??
                
                riskNumber++;
                colBuffer=JSON.parse(JSON.stringify(columnsHBook))
                
                definedRows++;
                store(comps)
            }
        }

        definedRows++

        if(first.length==0 && (comps.join('').length>0)) {
            // empty comps0
            // other text    
            if(definedRows>SYS_ROWS) store(comps);
            //else console.log("0424 "+JSON.stringify(comps))
        }
    

        function store(comps) {
            let check=[];

            headers = Object.keys(tableMap);
            // sort each line into colBuffer	   
            headers.forEach((key,index)=>{
                let col=tableMap[key];
                let prev = colBuffer[index]+' ';
                colBuffer[index]=comps[col]?prev+comps[col]:prev;
                check[index]=comps[col]
            })

            documentRisk(check);

            check.forEach((cell,index)=>{
                if(cell && cell.length>0) {
                    cor[index]=(cor[index] && cor[index].length>0)  ? (cor[index]+SLS+cell)
                                                                    : cell
                }
            })
        }

        function documentRisk(check) {

            // show each risk
            if(check[0] && check[1]) {  // check[0] can be numeric
                // this indicates beginning of a new risk
                let risk={};
                cor.forEach((cell,index)=>{ risk[headers[index]]=cell })      

                cor.forEach((attribute)=>console.log(JSON.stringify(attribute)))
                console.log();
      
                cor=[];

                if(risk.Function==='RiskManagement') console.log("0423 REST "+JSON.stringify(check))
                else {
                    // VDE SPEC 90025 convention
                    let managedRisk={'name':risk.HazardousSituation};
                    let dosh={ 'id':riskNumber, 'name':"DomainSpecificHazard", 'function':{'name':risk.Function }}
                    try {

                        // Siemens Healthineers combine Harm and Generic Hazards with GHx#
                        let hazards = risk.Hazard
                        let hazardsHarm=hazards.split("Generic Hazards");
                        let harmName = hazardsHarm.shift();
                        dosh.harm={ 'name': harmName }
                        dosh.genericHazards=hazardsHarm[0].split('GH');

                        // VDE SPEC 90025 convention
                        dosh.hazard = { 'name':risk.Function+' '+harmName }

                        managedRisk.subjectGroups=risk.Target.split(SLS);

                        if(flagRisk) {
                            // risk vectors are combined with dash -
                            let initial = risk.Initial.split('-');
                            managedRisk.preRiskEvaluation = { 'severity':initial[0],'probability':initial[1],'riskRegion':initial[2]}

                            let residual = risk.Residual.split('-');
                            managedRisk.postRiskEvaluation = { 'severity':residual[0],'probability':residual[1],'riskRegion':residual[2]}
                        }
                        dosh.managedRisks=[managedRisk]

                        //dosh.source=JSON.stringify(check))
                    } catch(e) {}

                    result.push(dosh);
                    //console.log(JSON.stringify(dosh));
                }
            }
        }

        return definedRows;
    }

}


// STEP 1 - map concepts to columns
// so for each tab a column map is created and columns are translated
//
// In column-1 text is only used at the beginning end end of paging (tabs)
// while numerics indicate the begin of an analyzed risk
//
// In PDF2XLSX there are line-breaks within the same term and empty vertical cells 
// i.e. in the same column between words of the same terms
//

// lines are not being received by the assigned Portal client



// each line in RESULT is a consolidated block from Excel, 
// for multiple lines referring to the same risk
            // EXAM-X


async function writeTable(filePath,strRisks) {
  try {
    console.log("0470 writeTable to "+filePath);
    await writeFile(filePath, strRisks);
  } catch (err) {
        console.log("0471 writeTable to "+filePath+":"+err);
  }
}

function grid(arrStr) {
    return arrStr.map((col)=>((col+'                ').substring(0,15))).join('|').substring(0,255);
}

// OLD
    // return one list of CSV-strings (one string per data line, CSV breaks columns for commas)
    // CSV support for ca 120 columns
