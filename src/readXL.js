
// const fs = require('node:fs/promises');
//import { writeFile } from 'node:fs/promises'

import pkg from 'xlsx'; // CommonJS
const { readFile,utils } = pkg;

const SEP = ',';
let tableMap={};

export function openHBook(fileName) {

    let result=[];

    function transferLine(line) {

        const comps=line.split(SEP);

        let type= ' ';
        let first = comps[0];
        if(first  && first.length>0) {

            type='*';
            try { type=parseInt(first); } catch(e) {}

            if(isNaN(type)) {
                type=(first.startsWith('F#') ? "#" : "T");
            }
            else {
                // number might be part of a longer text
                type='*';
            }
        }

        if(type=='#') {
            tableMap={};
            comps.forEach((column,col) => {

                if(column==='F#') tableMap.FuncNum=col;
                if(column==='Function') tableMap.Function=col;
                if(column==='H#') tableMap.HarmNum=col;
                if(column==='Hazard') tableMap.Hazard=col;
                if(column==='Effect') tableMap.Target=col;
                if(column==='Pre/Post') tableMap.PrePost=col;
                if(column==='Initial') tableMap.Initial=col;
                if(column==='M#') tableMap.MeasNum=col;
                if(column==='Measures') tableMap.Measures=col;
                if(column==='Residual') tableMap.Residual=col;
            });

            console.log("0480 NEXT PAGE with map="+JSON.stringify(tableMap));
        }
        
	    let jLine=[];
        Object.keys(tableMap).forEach((key)=>{
            let col=tableMap[key];

            // FLAT NUMERIC FIRST COLUMN
            if(col==0 && isNaN(first)) comps[0]=" ";

            comps[col] ? jLine.push(comps[col]) : jLine.push('');
        })


        

        result.push(jLine.join(';'));

    }


    // return one list of CSV-strings (one string per data line)
    // CSV support for ca 120 columns
    console.log("0400 READ openHBook "+fileName)
    try { 
        const workbook = readFile(fileName);
        console.log("0410 READ workbook from  "+fileName)
        const sheetNames = workbook.SheetNames;
        sheetNames.forEach((name,i)=>{ 
            console.log("0420 sheet #"+i+" = "+name)


// direct CSV works nicely,  
// but randomly inserts columns over the whole tab
// and also randomly inserts cells within the same column
// meaning that per tab the columns are trustworthy
// and the page headers represent the column use over the whole tab
//
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


            // EXAM-X
            const cTable = utils.sheet_to_csv(workbook.Sheets[name]);          
            if(cTable) {
                cTable.split('\n').forEach((line)=>{transferLine(line)}); 
            } else console.log("0461 READ workbook from  "+fileName);
        })            
    } catch(err) {
        console.log("0401 READ workbook from  "+fileName)
        result.push("0401 Error opening "+fileName)
    }
    console.log();
    writeTable('c:/temp/csvTable.csv',result.join('\n'));
    console.log();
    return result;
}
  
async function writeTable(filePath,csvTable) {
  try {
    console.log("0470 writeTable to "+filePath);
    await writeFile(filePath, csvTable);
  } catch (err) {
        console.log("0471 writeTable "+err);
  }
}

