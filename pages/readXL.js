// NODE ONLY

import { sane } from './node_utils.js'

/* in NODE.JS it looks like that: */
import pkg from 'xlsx'; // CommonJS
const { readFile,utils } = pkg;

// consumes and HBOOK.xlsx
// generates a Risk Table as of CRAFTS-MD

const SYS_ROWS=4; // lines in table headers

const SLS = '|'
const SEP = ';'
const HEAD="--------------"

let jArrManagedRisks=[];
let tableMap={};
let cor=[];

export function readHBook(fileName,mapCaption,createItem) {

    if(!fileName || fileName.length<2) return null;

    // does not sanitize XLSX file content

    let saneFileName=sane(fileName);

    // colBuffer represents the current logical line, may span across pages
    // colBuffer is the list of columns of the current RISK
    //const columnsHBook=['','','','','','','','','','','','','','','','','','','']
    //let colBuffer=columnsHBook;

    // list of consolidated colBuffer values
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

                        let ident="P"+sheetNumber+"#"+itemNumber+"L"+(row-1)
                        definedRows=transferLine(comps,definedRows,ident,createItem);
                        
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
    
    
    // to start making an InternalFile return jArrManagedRisks; 
    return jArrManagedRisks; 



    function transferLine(comps,definedRows,ident,createItem) {    
        let decision='?'
        
        let first = comps[0];
        if(first) {
            if(isNaN(first)) {
                let result=mapCaption(comps);
                if(result) {
                    // learn tableMap
                    tableMap=result;
                    definedRows=0;
                    decision='0'
                }

            } else {
                // comps[0] exists AND is numeric
                // (C) new risk line
                

                // save accumulated risk texts to jArrManagedRisks
                try {
                    let jMR = documentItem(cor,tableMap,ident,createItem);
                    jArrManagedRisks.push( jMR );
                } catch(e) { console.log("0421 save "+JSON.stringify(cor)+" -->"+e) }
                


                cor=[];
                itemNumber++;
                definedRows++;
                decision='>'

                cor = store(cor,comps,tableMap)
            }
        }

        definedRows++

        if(first.length==0 && (comps.join('').length>0)) {
            // empty comps0
            // other text    
            
            if(definedRows>SYS_ROWS) {
                decision='+';
                cor=store(cor,comps,tableMap);
            } else decision='-';
        }
    
        
        comps.unshift(ident+decision);
        grid("1",14,comps);
        comps.shift();





        return definedRows;
    }
}






function store(cor,comps,tableMap) {

    // split item
    let check=[];
    let headers = Object.keys(tableMap);
    // sort each line into colBuffer	   
    headers.forEach((key,index)=>{
        let from=tableMap[key].from;
        let colText=comps[from]; // initialize data type, e.g. numeric 

        let to=tableMap[key].to;
        for(let i=from+1;i<=to;i++) {
            if(comps[i]) colText=colText+comps[i];
        }
  
        check[index]=colText;
    })

    // console.log("0420 STORE ->"+JSON.stringify(check))

    // continue collecting more item input
    check.forEach((cell,index)=>{
        if(cell) { 
            if(isNaN(cell)) { 
                // text cell    
                cor[index]=cor[index] ? (""+cor[index]+SLS+cell)
                                                         : cell
            }
            else {
                // numeric cell
                cor[index]=cor[index] ? (cor[index]+cell)
                                                  : cell
            }
        }
    })

    return cor;
}



function documentItem(cor,tableMap,ident,createItem) {

    let headers = Object.keys(tableMap);
    // this indicates beginning of a new item
    let item={ 'itemNumber':ident };
    cor.forEach((cell,index)=>{ item[headers[index]]=(""+cell) })      


    // log incoming risk structure
    let phase3=Object.keys(item).map((key,num)=>(item[key]))
    for(let i=0;i<42 && phase3;i++) phase3=grid("3",26,phase3)
    console.log();


    let jItem = createItem(item);
    Object.keys(jItem).forEach((key)=>console.log(key+":"+JSON.stringify(jItem[key])))
    // process the item

    console.log();
    console.log();        
    
    return jItem;
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
    console.log(prefix+arrStr.map(((col)=>(((col&&col.replace)?col.replace(/[\r\n]/g,""):(""+col))+base).substring(0,width))).join('|'))
    return flag ? arrRest : null;
}
