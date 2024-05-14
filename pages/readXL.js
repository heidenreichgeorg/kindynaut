    // NODE ONLY
    // node pages/server.js

// const fs = require('node:fs/promises');
import { writeFile } from 'node:fs/promises'

/* in NODE.JS it looks like that: */
import pkg from 'xlsx'; // CommonJS
const { readFile,utils } = pkg;

/* in REACT it looks like that: */
//import { readFile,utils } from 'xlsx'

const SEP = ',';
let tableMap={};

export function openHBook(fileName) {

    // does not sanitize XLSX file content

    let saneFileName=sane(fileName);

    // colBuffer is the list of columns of the current RISK
    const columnsHBook=['','','','','','','','','','','','','','','','','','']
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
            let definedColumns=false;
            const jTable = utils.sheet_to_json(workbook.Sheets[name],s2j_options);  
            // each sheet in jTable is an array of line objects with markup defined in the first line
            if(jTable){
                if(sheetNumber>=0) { 
                    jTable.forEach((jLine,row)=>{
                        //console.log("0406 READ workbook line"+row+" in ("+sheetNumber+")  "+JSON.stringify(jLine).substring(0,100));
                        const keyNames = Object.keys(jLine);
                        const comps=keyNames.map((key)=>(((typeof jLine[key]) === 'string')?jLine[key].replaceAll('\n',' '):(jLine[key]?jLine[key]:'')))    
                        //console.log("0408 READ workbook line"+row+" in ("+sheetNumber+")  "+JSON.stringify(comps));
                        definedColumns=transferLine(comps,definedColumns);
                    });
                }
            } //else console.log("0403 READ workbook sheet("+i+")"");
        })            
    } catch(err) {
        console.log("0401 READ workbook from  "+saneFileName+ "  "+err)
       
    }
    //console.log(result.join('\n\n'))
    writeTable('c:/temp/csvTable.csv',result.join('\n'));
    return result; // previous risk only







    function transferLine(comps,definedColumns) {
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
                        if(column.startsWith('Hazard')) tableMap.Hazard=col;
                        if(column.startsWith('C#')) tableMap.CauseNum=col;
                        if(column.startsWith('Hazardou')) tableMap.HazardousSituation=col;
                        if(column.startsWith('Effect')) tableMap.Target=col;
                        if(column.startsWith('Pre/Post')) tableMap.PrePost=col;
                        if(column.startsWith('Initial')) tableMap.Initial=col;
                        if(column.startsWith('M#')) tableMap.MeasNum=col;
                        if(column.startsWith('Measure')) tableMap.Measures=col;
                        if(column.startsWith('Residual')) tableMap.Residual=col;
                    });
                    // console.log("0480 NEXT PAGE with map="+JSON.stringify(tableMap));
                }

                // (B) else other text line
                // comps0 is text--> don't use this


            } else {
                // (C) new risk line
                // numeric comps0
                // get rid of previous risk data            
                //console.log("0430 "+colBuffer.map((col)=>((col+'             ').substring(0,12))).join('|').substring(0,230));            
                result.push(colBuffer.join(';')); // GH20240514 sane() function ??
                
                riskNumber++;
                colBuffer=JSON.parse(JSON.stringify(columnsHBook))
                
                definedColumns=true;
                store(comps)
            }
        }


        if(first.length==0 && (comps.join('').length>0) && definedColumns) {
            // empty comps0
            // other text    
            store(comps);
        }
    



        function store(comps) {
            if(!definedColumns) return;

            let check=[];
            // sort each line into colBuffer	   
            Object.keys(tableMap).forEach((key,index)=>{
                let col=tableMap[key];
                let prev = colBuffer[index]+' ';
                colBuffer[index]=comps[col]?prev+comps[col]:prev;
                check[index]=comps[col]
            })
            console.log("0424 "+grid(check))
        }


        return definedColumns;
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


async function writeTable(filePath,csvTable) {
  try {
    console.log("0470 writeTable to "+filePath);
    await writeFile(filePath, csvTable);
  } catch (err) {
        console.log("0471 writeTable "+err);
  }
}

function grid(arrStr) {
    return arrStr.map((col)=>((col+'             ').substring(0,12))).join('|').substring(0,230);
}

// OLD
    // return one list of CSV-strings (one string per data line, CSV breaks columns for commas)
    // CSV support for ca 120 columns
