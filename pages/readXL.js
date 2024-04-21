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

    // colBuffer is the list of columns of the current RISK
    const columnsHBook=['','','','','','','','','','','','','','','','','','']
    let colBuffer=columnsHBook;

    // list of consolidated colBuffer values
    let result = []; 
    let riskNumber=0;

    console.log("0400 READ openHBook "+fileName)
    try { 
        const workbook = readFile(fileName);
        console.log("0402 READ workbook from  "+fileName)
        const sheetNames = workbook.SheetNames;
        console.log("0404 READ workbook with sheets:  "+sheetNames.join(','))


        // digest one sheet, continue existing colBuffer

        // show empty cells as empty string
        const s2j_options={ 'blankrows':true, 'defval':'', 'skipHidden':false };
        sheetNames.forEach((name,sheetNumber)=>{ 
            const jTable = utils.sheet_to_json(workbook.Sheets[name],s2j_options);  
            // each sheet in jTable is an array of line objects with markup defined in the first line
            if(jTable){
                if(sheetNumber<8) { 
                    jTable.forEach((jLine,row)=>{
                        //console.log("0406 READ workbook line"+row+" in ("+sheetNumber+")  "+JSON.stringify(jLine).substring(0,100));
                        const keyNames = Object.keys(jLine);
                        const comps=keyNames.map((key)=>(jLine[key]))    
                        //console.log("0408 READ workbook line"+row+" in ("+sheetNumber+")  "+JSON.stringify(comps));
                        transferLine(comps);
                    });
                }
            } //else console.log("0403 READ workbook sheet("+i+")"");
        })            
    } catch(err) {
        console.log("0401 READ workbook from  "+fileName+ "  "+err)
       
    }
    //console.log(result.join('\n\n'))
//    writeTable('c:/temp/csvTable.csv',result.join('\n'));
    return result; // previous risk only







    function transferLine(comps) {
        //console.log("  0420 RISK "+line)
        //const comps=line.split(SEP);
        let type= '*';
        let first = comps[0];

        console.log("0422 "+comps.map((col)=>((col+'             ').substring(0,12))).join('|').substring(0,230));

        if(first  && first.length>0) {
            

            try { type=parseInt(first); } catch(e) {}
            if(isNaN(type)) {
                // (A) sheet title line
                type=(first.startsWith('F#') ? "#" : "T");
            }
            else {
                riskNumber++;
                // get rid of previous risk data
                
               // console.log("    0430 RISK "+riskNumber+"\n"+colBuffer.map((str)=>((str+'           ').substring(0,9))).join('|'))
                
                
                result.push(colBuffer.join(';'));




                // (B) numeric line - meaning new risk
                type='*';
                colBuffer=JSON.parse(JSON.stringify(columnsHBook))
            }
        }

        if(type=='#') {
        

            tableMap={};
            comps.forEach((strColumn,col) => {
                let column=strColumn.trim();
// remember column index for defined columns
                if(column==='F#') tableMap.FuncNum=col;
                if(column==='Function') tableMap.Function=col;
                if(column==='H#') tableMap.HarmNum=col;
                if(column==='Hazard') tableMap.Hazard=col;
                if(column==='C#') tableMap.CauseNum=col;
                if(column.startsWith('Hazardou')) tableMap.HazardousSituation=col;
                if(column==='Effect') tableMap.Target=col;
                if(column==='Pre/Post') tableMap.PrePost=col;
                if(column==='Initial') tableMap.Initial=col;
                if(column==='M#') tableMap.MeasNum=col;
                if(column==='Measures') tableMap.Measures=col;
                if(column==='Residual') tableMap.Residual=col;
            });

        //    console.log("0480 NEXT PAGE with map="+JSON.stringify(tableMap));
        }
        


        // sort line into colBuffer	   
        Object.keys(tableMap).forEach((key,index)=>{
            let col=tableMap[key];
            let prev = colBuffer[index];
            colBuffer[index]=comps[col]?prev+' '+comps[col]:prev+'#';
        })
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



// OLD
    // return one list of CSV-strings (one string per data line, CSV breaks columns for commas)
    // CSV support for ca 120 columns
