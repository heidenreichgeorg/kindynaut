// NODE ONLY

import { sane } from './node_utils.js'

/* in NODE.JS it looks like that: */
import pkg from 'xlsx'; // CommonJS
const { readFile,utils } = pkg;

// consumes and HBOOK.xlsx
// generates a Risk Table as of CRAFTS-MD

const SYS_ROWS=3; // lines in table headers

const SLS = ';'
const HEAD="--------------"

let tableMap={};

let cor=[];

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
                        grid("1",14,comps);
                        comps.shift();
                    });
                    console.log("1"+Array(16).fill(HEAD).join('|'))
                }
                transferLine(["","","",""],SYS_ROWS+1)
            } //else console.log("0403 READ workbook sheet("+i+")"");
        })            
        transferLine([9999999,"EndOfFile",666666,"RestOfRisk"],SYS_ROWS+1)

    } catch(err) {
        console.log("0401 READ workbook from  "+saneFileName+ "  "+err)
       
    }
    
    //writeTable('c:/temp/csvTable.txt',result.join('\n'));
    return null; // to start making an InternalFile return result; 



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

                cor = store(cor,comps,itemNumber)
            }
        }

        definedRows++

        if(first.length==0 && (comps.join('').length>0)) {
            // empty comps0
            // other text    
            if(definedRows>SYS_ROWS) cor=store(cor,comps,itemNumber);
        }
    

        function store(cor,comps,itemNumber) {

            // split item
            let check=[];
            let headers = Object.keys(tableMap);
            // sort each line into colBuffer	   
            headers.forEach((key,index)=>{
                let col=tableMap[key];
                check[index]=comps[col]
            })


            
            // detect next item
            if((check[0]>0) && check[1] && (check[2]>0)) {  // check[0,2] numeric 
                    documentItem(cor,itemNumber,tableMap);
                    cor=[];
                    console.log("NEXT "+(0+check[0])+"-"+check[1]+"-"+(0+check[2]))

            }


            // continue collecting more item input
            check.forEach((cell,index)=>{
                if(cell && cell.length>0) {
                    cor[index]=(cor[index] && cor[index].length>0)  ? (cor[index]+SLS+cell)
                                                                    : cell
                }
            })

            return cor;
        }

        function documentItem(cor,itemNumber,tableMap) {

            let headers = Object.keys(tableMap);
            //console.log("0423 "+check[0]+check[1]+check[2])
            // this indicates beginning of a new item
            let item={ 'itemNumber':itemNumber };
            cor.forEach((cell,index)=>{ item[headers[index]]=(""+cell) })      

            // logical output
            //cor.forEach((attribute)=>console.log(JSON.stringify(attribute)))
    
        
            // document each item
            console.log();
            //grid("2",14,headers)
            //let phase2=Object.keys(cor).map((key,num)=>(cor[key]))
            //for(let i=0;i<42 && phase2;i++) phase2=grid("2",26,phase2)
            //console.log();

            //let phase3=Object.keys(item).map((key,num)=>(item[key]))
            //for(let i=0;i<42 && phase3;i++) phase3=grid("3",26,phase3)
            //console.log();


            let jItem = createItem(item);
            Object.keys(jItem).forEach((key)=>console.log(key+":"+JSON.stringify(jItem[key])))
            // process the item
            // result.push(jItem);

            console.log();
            console.log();
            
        }



        return definedRows;
    }
}


//
// In column-1 text is only used at the beginning end end of paging (tabs)
// while numerics indicate the begin of an analyzed risk
//
// In PDF2XLSX there are line-breaks within the same term and empty vertical cells 
// i.e. in the same column between words of the same terms
//

// req/res: lines are not being received by the assigned Portal client



// each line in RESULT is a consolidated logical item (risk)  from Excel, starting with a number in column 0
// for multiple lines referring to the same risk


function grid(prefix,width,arrStr) {
    if(width>150) width=150;
    
    let flag=false;
    arrStr.map((col)=>((col && col.length>0 && (flag=true)) ? 1:2))

    let arrRest=arrStr.map((col)=>((col && col.length>width) ? col.substring(width):""))
    let base="                                                                                                                                                             ".substring(0,width)
    console.log(prefix+arrStr.map(((col)=>(((col&&col.replace)?col.replace(/[\r\n]/g,""):"")+base).substring(0,width))).join('|'))
    return flag ? arrRest : null;
}
