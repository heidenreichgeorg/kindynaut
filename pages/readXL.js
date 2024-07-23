    // NODE ONLY

import { writeFile } from 'node:fs/promises'

import { sane } from './node_utils.js'

/* in NODE.JS it looks like that: */
import pkg from 'xlsx'; // CommonJS
const { readFile,utils } = pkg;

/* EXAMPLE output

0406 READ workbook line1/(162) 

    {"Evaluation of Functions, Hazards, Risks and Measures":"F#",
     "__EMPTY":"Function",
     "__EMPTY_1":"",
     "__EMPTY_2":"H#",
     "__EMPTY_3":"Hazard", // prefix of Hazardous
     "__EMPTY_4":"C#",
     "__EMPTY_5":"Effect",
     "__EMPTY_6":"Hazardous",
     "Denali, VA1XX":"",
     "__EMPTY_7":"Pre/Post",
     "__EMPTY_8":"Initial",
     "__EMPTY_9":"M#",
     "__EMPTY_10":"",
     "__EMPTY_11":"Measures",
     "__EMPTY_12":"Residual",
     "__EMPTY_13":""}

*/

// ISSUE page-break within the same risk crashes the column assignment


const SLS = ';';
const SEP = ',';
let tableMap={};

let cor=[];


export function openHBook(fileName) {

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
            let definedColumns=false;
            const jTable = utils.sheet_to_json(workbook.Sheets[name],s2j_options);  
            // each sheet in jTable is an array of line objects with markup defined in the first line
            if(jTable){
                if(sheetNumber>=0) { 
                    jTable.forEach((jLine,row)=>{
                        const keyNames = Object.keys(jLine);
                        //console.log("0406 READ workbook line"+row+"/("+sheetNumber+") ["+keyNames.join(' ')+"] "+JSON.stringify(jLine));
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
                }

                // (B) else other text line
                // comps0 is text--> don't use this


            } else {
                // (C) new risk line
                // comps[0] is numeric
                // get rid of previous risk data, save existing colBuffer, count new risk, initialize colBuffer with value of columnsHBook 
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
            let headers = Object.keys(tableMap);
            let check=[];
            // sort each line into colBuffer	   
            headers.forEach((key,index)=>{
                let col=tableMap[key];
                let prev = colBuffer[index]+' ';
                colBuffer[index]=comps[col]?prev+comps[col]:prev;
                check[index]=comps[col]
            })

            // show each risk
            if(check[0] && check[1]) {  // check[0] can be numeric
                cor.forEach((cell,index)=>console.log(index+":"+headers[index]+"  "+cell))
                console.log('-');
                cor=[];
            }

            check.forEach((cell,index)=>{
                if(cell && cell.length>0) {
                    cor[index]=(cor[index] && cor[index].length>0)  ? (cor[index]+SLS+cell)
                                                                    : cell
                }
            })



            // show each Excel row
            // table view - console.log("0424 "+grid(check))
            console.log("0424 "+JSON.stringify(comps))
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
        console.log("0471 writeTable to "+filePath+":"+err);
  }
}

function grid(arrStr) {
    return arrStr.map((col)=>((col+'                ').substring(0,15))).join('|').substring(0,255);
}

// OLD
    // return one list of CSV-strings (one string per data line, CSV breaks columns for commas)
    // CSV support for ca 120 columns
