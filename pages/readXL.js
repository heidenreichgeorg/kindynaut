    // NODE ONLY


import { sane } from './node_utils.js'

/* in NODE.JS it looks like that: */
import pkg from 'xlsx'; // CommonJS
const { readFile,utils } = pkg;


// consumes and HBOOK.xlsx

// generates a Risk Table as of CRAFTS-MD



const SYS_ROWS=3; // lines in table headers


const SLS = ';';
const SEP = ',';
let tableMap={};

let cor=[];
let headers=null;


export function readHBook(fileName,createItem) {

    // does not sanitize XLSX file content

    let saneFileName=sane(fileName);

    // colBuffer represents the current logical line, may span across pages
    // colBuffer is the list of columns of the current RISK
    //const columnsHBook=['','','','','','','','','','','','','','','','','','','']
    //let colBuffer=columnsHBook;

    // list of consolidated colBuffer values
    let result = []; 
    let itemNumber=0;

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
                        //if(definedRows<=SYS_ROWS) console.log("0408 READ workbook line"+row+" in ("+sheetNumber+")  "+JSON.stringify(comps));

                        definedRows=transferLine(comps,definedRows);
                        
                        comps.unshift("P"+sheetNumber+"L"+row+"#"+itemNumber);
                        console.log(grid(14,comps));
                        comps.shift();
                    });
                }
                transferLine(["","","",""],SYS_ROWS+1)
            } //else console.log("0403 READ workbook sheet("+i+")"");
        })            
        transferLine([9999999,"EndOfFile",666666,"RestOfRisk"],SYS_ROWS+1)

    } catch(err) {
        console.log("0401 READ workbook from  "+saneFileName+ "  "+err)
       
    }
    
    //writeTable('c:/temp/csvTable.json',result.join('\n'));
    return result; 



    



    function transferLine(comps,definedRows) {        
        let first = comps[0];
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
                     //console.log("0480 NEXT PAGE with map="+JSON.stringify(tableMap));
                     definedRows=0;
                }

                // (B) else other text line
                // comps0 is text--> don't use this


            } else {
                // comps[0] exists AND is numeric
                // (C) new risk line
                
                itemNumber++;
                //colBuffer=JSON.parse(JSON.stringify(columnsHBook))
                
                definedRows++;

                store(comps,itemNumber)
            }
        }

        definedRows++

        if(first.length==0 && (comps.join('').length>0)) {
            // empty comps0
            // other text    
            if(definedRows>SYS_ROWS) store(comps);
        }
    

        function store(comps,itemNumber) {
            let check=[];

            headers = Object.keys(tableMap);
            // sort each line into colBuffer	   
            headers.forEach((key,index)=>{
                let col=tableMap[key];
                //let prev = colBuffer[index]+' ';
                //colBuffer[index]=comps[col]?prev+comps[col]:prev;
                check[index]=comps[col]
            })


            documentItem(check,itemNumber);

            check.forEach((cell,index)=>{
                if(cell && cell.length>0) {
                    cor[index]=(cor[index] && cor[index].length>0)  ? (cor[index]+SLS+cell)
                                                                    : cell
                }
            })
        }

        function documentItem(check,itemNumber) {

            // show each risk
            if(!isNaN(check[0]) && check[1] && !isNaN(check[2])) {  // check[0,2] numeric 
                console.log("0423 "+check[0]+check[1]+check[2])
                // this indicates beginning of a new risk
                let item={ 'itemNumber':itemNumber };
                cor.forEach((cell,index)=>{ item[headers[index]]=cell })      

                cor.forEach((attribute)=>console.log(JSON.stringify(attribute)))
                console.log();
      
                cor=[];
                
                result.push(createItem(item));
                //result.push(grid(40,Object.keys(item).map((key)=>(item[key]))))
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


function grid(width,arrStr) {
    if(width>150) width=150;
let base="                                                                                                                                                             ".substring(0,width)
    return arrStr.map(((col)=>(((col&&col.replace)?col.replace(/[\r\n]/g,""):"")+base).substring(0,width))).join('|')
}

// OLD
    // return one list of CSV-strings (one string per data line, CSV breaks columns for commas)
    // CSV support for ca 120 columns
