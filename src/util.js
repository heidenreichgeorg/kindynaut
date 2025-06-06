import { Buffer } from 'buffer';
import { getFrom90025,processHTML } from './extract.js';

import { convert2VDE } from "./xml_rdfa2html.js"

// read and write
// https://www.geeksforgeeks.org/how-to-read-and-write-json-file-using-node-js/

//import dotenv from 'dotenv'
//dotenv.config({ path: './.env.local' })
// npm install dotenv

export const HTTP_OK     = 200;
export const HTTP_WRONG  = 400;

export const SOME = 4;
const FILE_SLASH = '/';

export const REACT_APP_API_HOST="/pages"

export function timeSymbol() { 
    var u = new Date(Date.now()); 
    return ''+ u.getUTCFullYear()+
      ('0' + (1+u.getUTCMonth())).slice(-2) +
      ('0' + u.getUTCDate()).slice(-2) + 
      ('0' + u.getUTCHours()).slice(-2) +
      ('0' + u.getUTCMinutes()).slice(-2) +
      ('0' + u.getUTCSeconds()).slice(-2) +
      (u.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
}


export function arisIdentifier(jAris) {
    let c=symbol1(nowandthen(jAris.comp));
    let f=symbol1(nowandthen(jAris.func));
    let a=symbol1(nowandthen(jAris.cause));
    let h=symbol1(nowandthen(jAris.harm));
    let o=symbol1(nowandthen(jAris.code));
    let s=symbol1(nowandthen(jAris.hazardousSituation));
    let result=c+f+a+h+o+s;
    return result;
}



export function corIdentifier(jAris) {
    let c=symbol1(nowandthen(jAris.comp));
    let f=symbol1(nowandthen(jAris.func));
    let h=symbol1(nowandthen(jAris.harm));
    let s=symbol1(nowandthen(jAris.hazardousSituation));
    let result=c+f+h+s;
    return result;
}


export function doshIdentifier(jAris) {
    let c=symbol1(jAris.comp)
    let f=symbol1(jAris.func)
    let h=symbol1(jAris.harm)
    let z=symbol1(jAris.hazard)
    let result=c+f+h+z;
    return result;
}


export function strSymbol(pat) {

    let seed = process.env.REACT_APP_ENCODING_SEED;

    let cypher = seed;
    if(!seed) cypher = "kindynaut8ho1pr0jec72f45wygzmq9dlvbx3s6";

    let base=cypher.length;
    var res = 0;
    var out = [];
    var tim = timeSymbol()
    if(!pat) pat = tim;
    {
        let factor = 23;
        var sequence = ' '+pat+tim+pat;
        for(let p=0;p<sequence.length && p<80;p++) {
            res = ((res*factor + sequence.charCodeAt(p)) & 0x1FFFFFFF);
            let index = res % base;
            out.push(cypher.charAt(index))
        }
    }
    return out.join('');
}



function nowandthen(ins) {
    if(!ins) return "";
    let str=ins+(ins.split('').reverse().join(''))+ins;
    let pos=[1,8,2,9,3,10,4,11,5,12,6,13,7,15];
    let pat=str+str+str+str+str+str+str+str+str;
    let result=''
    for(let index=0;(index<pos.length&&pat.length>pos[index]);index++) {
        let el=pat[pos[index]];
        if(el && el!==' ') result=result+el;
    }
    return result;
}

function symbol1(s) { 

    let sl=s.length
    let result=""+s.charAt(sl/2);

    for(let i=0;i<s.length-4;i+=2) {
        let sum = (s.charCodeAt(i)+s.charCodeAt(i+1)+s.charCodeAt(i+2)+s.charCodeAt(i+3)) & 0x0F;
        result = result + String.fromCharCode(65+sum);
    }

    return result;
}



export  function jGrid(jThing) {
    let arrStr=Object.keys(jThing).map((k)=>(jThing[k]));
    let result = arrStr.map((col)=>((col+'                ').substring(0,16))).join('|').substring(0,300);
    console.log("jGRID="+result);
    return result;
}


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// read and obtain XL file from server
// need to start NODE server first
// node --env-file .\pages\.env  .\pages\server.js 

export function handleHBook(fileName) {        
    // SECURITY fileName may carry markup

    console.log("0692 handleHBook file="+fileName)
    
    const rqHeaders = {  'Accept': 'application/octet-stream',
                        'Access-Control-Allow-Origin':'*',
                        'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept, Authorization' };


    const rqOptions = { method: 'GET', headers: rqHeaders, mode:'no-cors'};
    try {                 
        let server=process.env.REACT_APP_NODE;
        let s_port=process.env.REACT_APP_SERVER;
        let url = `http://${server}:${s_port}/DOWNLOAD?file=`+fileName;
        console.log("0710 handleUpload  url="+url);

        try {
            fetch(url, rqOptions)
            .then((response) => response.text())
            .then((text) => console.log("0712 "+text))
            // arrList.forEach((line)=>{resourceLimits.push(line);console.log(line)})
            //.then((url) => console.log("0712 handleHBook URL= "+ makeArchiveButton(url,client,family)))
            .catch((err) => console.error("0715 handleHBook ERR "+err));           
        } catch(err) { console.log("0713 GET /DOWNLOAD handleHBook:"+err);}

    } catch(err) { console.log("0711 GET /DOWNLOAD handleHBook:"+err);}

    console.log("0730 handleHBook FETCH "+fileName);
}



// need to start NODE server
// node pages/server.js 
export function handleStore(fileName) {        
    // SECURITY fileName may carry markup

    console.log("0692 handleStore "+fileName)
    
    const rqHeaders = {  'Accept': 'application/octet-stream',
                        'Access-Control-Allow-Origin':'*',
                        'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept, Authorization' };


    const rqOptions = { method: 'POST', headers: rqHeaders, mode:'no-cors'};
    try {                 
        let server=process.env.REACT_APP_NODE;
        let s_port=process.env.REACT_APP_SERVER;
        let url = `http://${server}:${s_port}/STORE?file=`+fileName;
        console.log("0710 handleStore  url="+url);

        try {
            fetch(url, rqOptions)
            .then((response) => response.text())
            .then((text) => console.log("0712 "+text))
            // arrList.forEach((line)=>{resourceLimits.push(line);console.log(line)})
            //.then((url) => console.log("0712 handleStore URL= "+ makeArchiveButton(url,client,family)))
            .catch((err) => console.error("0715 handleStore ERR "+err));           
        } catch(err) { console.log("0713 POST /STORE handleStore:"+err);}

    } catch(err) { console.log("0711 POST /STORE handleStore:"+err);}

    console.log("0730 handleStore FETCH "+fileName);
}



export function initDomain(domain,notifyCB) {   


    // GET  DOMAIN from NODE JS GCP_DOMAINROOT/domain
    // SECURITY fileName may carry markup

    console.log("0300 initDomain into server-side domain "+domain); 
    
    console.log("0302 initDomain "+domain);

    const rqOptions = { method: 'GET', 
                        headers: {
                            'content-type':'text/plain;charset=utf-8',
                            'accept':'application/json;charset=utf-8'},                         
                            //'accept':'text/plain;charset=utf-8'}                         
                            'Access-Control-Allow-Origin':'*',
                            'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept, Authorization'
                        };

    try {                 
        let server=process.env.REACT_APP_NODE;
        let s_port=process.env.REACT_APP_SERVER;
        let url = `http://${server}:${s_port}/INIT?domain=`+domain;
        let result=[];

        console.log("0304 initDomain INIT url="+url);

        try {
            fetch(url, rqOptions) 
            .then((response) => response.json())
            .then((json) => {Object.keys(json).forEach((index)=>{ 
                try {   
                        console.log("0308 initDomain:"+index+" "+json[index]); 
                        try {
                            
                            result.push(JSON.parse(json[index]));

                        } catch(e) { console.err("0307 initDomain Cannot parse "+json[index]+ "+err"); }
                } 
                catch(e){console.log("0309 initDomain:"+index+" in "+JSON.stringify(json)+"   "+e); }   });

                // put response into repository
                console.log(" 0310 result #"+result.length)

                notifyCB(result);

            })
            .catch((err) => console.error("0305 initDomain ERR "+err));       
            
            // unreachable

        } catch(err) { console.log("0303 GET /INIT initDomain:"+err);}

    } catch(err) { console.log("0301  GET /INIT initDomain:"+err);}

    // returns before results from server
}


export function updateDomain(jListAris,domain) {   
    
    // from DOMAIN list to NODE JS GCP_DOMAINROOT/domain
    // SECURITY fileName may carry markup

    console.log("0780 updateDomain into server-side domain "+domain); 
    let postBody = JSON.stringify(jListAris)
    console.log("0782 updateDomain with ARIS #"+postBody);

    const rqOptions = { method: 'POST', 
                        headers: { 'content-type':'text/plain',
                            'accept':'application/json'},                         
                            mode:'no-cors', 
                            body:postBody };
    try {                 
        let server=process.env.REACT_APP_NODE;
        let s_port=process.env.REACT_APP_SERVER;
        let url = `http://${server}:${s_port}/UPDATE?domain=`+domain;
        console.log("0784 updateDomain UPDATE url="+url);

        try {
            fetch(url, rqOptions) // AND BLAST jListAris via POST body
            .then((response) => response.text())
            .then((text) => console.log("0712 "+text))
            .catch((err) => console.error("0785 updateDomain ERR "+err));           
        } catch(err) { console.log("0783 POST /UPDATE updateDomain:"+err);}

    } catch(err) { console.log("0781  POST /UPDATE updateDomain:"+err);}

    console.log("0786 updateDomain fetch "+domain);
}

/*
CLIENT FILE DOWNLOAD FUNCTIONS 
will create a download button and attach the file as a blob to it

export function handleArchive(jListAris,domain) {    
    console.log("0780 handleArchive  "+domain);
    const blob = new Blob([JSON.stringify(jListAris, null, 2)], {
        type: "application/json",
    });
    let url = URL.createObjectURL(blob);
    makeArchiveButton(url,domain)
    console.log("0782 handleArchive EXIT");
}


export function makeArchiveButton(url,domain) { 
    console.log("0740 makeArchiveButton "+url);
    if(domain) {

        let a = document.createElement('a');
        a.setAttribute("id", "btnArchive");
        a.href = url;
        a.download = "ARCHIVE_"+domain+".JSON";
        a.style.display = 'none'; // was block
        a.className = "FIELD MOAM";
        a.innerHTML = "Downloading...";

        replaceChild(a,"btnArchive");

        a.click();

        
    } else console.log("0768 makeArchiveButton XLSX NO domain");
    return url;
}




function save(strOut,ext) {

     var sFile='rebuiltFile.'+ext;
     console.log('0590 save() creating file='+sFile);
     //console.log(strOut);

     var textFile=null,makeTextFile = function (text) {
       var data = new Blob([text], {type: 'text/plain'});
       if (textFile !== null) {
           window.URL.revokeObjectURL(textFile);
       }
       textFile = window.URL.createObjectURL(data);

       // returns a URL you can use as a href
       return textFile;
     };

     var a = document.createElement('a');
     document.body.appendChild(a);
     a.style = 'display: none';
     let url=makeTextFile(strOut);
     a.href = url;
     a.className = "FIELD MOAM";
     a.download = sFile;
     a.click();
     window.URL.revokeObjectURL(url);
     return textFile;
}


*/

export function makeDomainJSON(idButton,arrListDoSH,rt_manufacturer,rt_project,rt_version) {
   
    // just pack the DOSHes into a blob for button download
    let fileName="ARCHIVE_"+rt_manufacturer+'_'+rt_project+".JSON";
    
    const strTable  = JSON.stringify(arrListDoSH);
    console.log("0762 makeDomainJSON DOSH as strTable="+strTable)

    // create a link to download that object to some client system
    const blobContent = new Blob([strTable], { type: 'text/plain' });
    const url = URL.createObjectURL(blobContent);

    console.log("0764 makeDomainJSON created URL")

    return makeURLButton(idButton,url,fileName);
}

 export function makeRiskTable(idButton,arrListDoSH,rt_manufacturer,rt_project,rt_version) {
    // create riskTable format
    let functionId=1;
    let harmId=1;
    let idMar=1;


    if(!arrListDoSH || arrListDoSH.length==0) return;

    // separate DomainSpecificHazard from AnalyzedRisk structures
    let jControlled={};
    arrListDoSH.map((jDoSH)=>{jControlled[arisIdentifier(jDoSH)]=[]});
    arrListDoSH.map((jDoSH)=>{jControlled[arisIdentifier(jDoSH)].push(jDoSH)});
    
    console.log("0760 makeRiskTable AnalyzedRisks="+JSON.stringify(jControlled))

    let justification=Object.keys(jControlled).map((key,aris)=>({
        'id':aris,
        'name':'RiskItem',
        'component':jControlled[key][0].comp,
        'function':{
            'id':functionId,
            'name':jControlled[key][0].func
        },
        'harm':{
            'id':harmId++,
            'name':jControlled[key][0].harm
        },
        'genericHazards':jControlled[key].map((dosh)=>(dosh.hazard)),        
        'managedRisks':[{
            'id':(idMar++), 
            'name':(jControlled[key][0].hazardousSituation+';'+jControlled[key][0].cause+';'+jControlled[key][0].code)
        }]
    }))

    let fileName="RISKTABLE"+rt_manufacturer+'_'+rt_project+".JSON";

    let riskTable =  {
        "id":1,
        "name":"DeviceAssurance",
        "claim":
        {   "id":2,
            "name":"Safety",
            "file":fileName,
            "manufacturer":rt_manufacturer,
            "project":rt_project,
            "version":"0.0",
            "justification":justification
        }
    }

    const strTable  = JSON.stringify(riskTable);
    console.log("0762 makeRiskTable riskTable="+strTable)

    // create a link to download that object to some client system
    const blobContent = new Blob([strTable], { type: 'text/plain' });
    const url = URL.createObjectURL(blobContent);

    console.log("0764 makeRiskTable created URL")

    return makeURLButton(idButton,url,fileName);
}

export function makeExportFile(jListCORs,idButton,arrListDoSH,if_manufacturer,if_project,if_version) {
    processInternalFile(jListCORs,idButton,arrListDoSH,if_manufacturer,if_project,if_version,"Convert",convert2VDE);
}

export function makeInternalFile(jListCORs,idButton,arrListDoSH,rt_manufacturer,rt_project,rt_version) {
    processInternalFile(jListCORs,idButton,arrListDoSH,rt_manufacturer,rt_project,rt_version,"Get",keep);
}


function keep(strTable,fileName,idButton) { 
    
    const blobContent = new Blob([strTable], { type: 'text/plain' });

    // create a link to download that object to some client system
    const url = URL.createObjectURL(blobContent);

    console.log("0766 keep created URL")

    return makeURLButton(idButton,url,fileName);
    
    //return strTable; 
}

function processInternalFile(jListCORs,idButton,arrListDoSH,if_manufacturer,if_project,if_version,action,converter) {

    // create string according to VDE SPEC 90025 internal format

    if(!arrListDoSH || arrListDoSH.length==0 || !Array.isArray(arrListDoSH)) return;
   
    console.log("1060 makeInternalFile DoSH=#"+arrListDoSH.length)


    let jComponent={}
    let comp=0;
    arrListDoSH.map((jDoSH)=>{jComponent[symbol1(jDoSH.comp)]={"name":jDoSH.comp,"title":"Component","id":"COM"+(comp++)}});

    // create function registry
    let jFunction={}
    let func=0;
    arrListDoSH.map((jDoSH)=>{jFunction[symbol1(jDoSH.func)]={"name":jDoSH.func,"title":"Function","id":"FUN"+(func++)}});
    

    // create hazard registry
    let jHazard={}
    let hazd=0;
    arrListDoSH.map((jDoSH)=>{jHazard[symbol1(jDoSH.hazard)]={"name":jDoSH.hazard,"title":"Hazard","id":"HAZ"+(hazd++)}});
    

    // create harm registry
    let jHarm={}
    let harm=0;
    arrListDoSH.map((jDoSH)=>{jHarm[symbol1(jDoSH.harm)]={"name":jDoSH.harm,"title":"Harm","id":"HRM"+(harm++)}});
    

    // create hazardous situation registry
    let jSituation={}
    let hasi=0;
    arrListDoSH.map((jDoSH)=>{jSituation[symbol1(jDoSH.hazardousSituation)]={"name":jDoSH.hazardousSituation,"title":"HazardousSituation","id":"HAS"+(hasi++)}});

    let cori=0;
    


    let aWitness={}
    arrListDoSH.map((aris)=>(aWitness[aris.arisID]=aris));
    console.log("1070 makeInternalFile with aris keys and one matching ARIS "+JSON.stringify(aWitness));   


    let cWitness={}
    arrListDoSH.map((aris)=>(cWitness[aris.corID]=aris));
    console.log("1072 makeInternalFile with CoR keys and one matching CoR "+JSON.stringify(cWitness));   

    //for each ARIS witness, generate one COR
    let rit_id=0;
    let arrCORI = Object.keys(cWitness).map((corID)=>( initCOR(cWitness[corID],rit_id++,corID,jComponent,jFunction,jHarm)))
    let jListCor = {};
    Object.keys(cWitness).forEach((corID,i)=>{

        
        let jCOR = arrCORI[i]
        let jRisk=jListCORs[corID] // from editor , repository[SCR_COR]
        console.log("1074 makeInternalFile fills COR "+corID + " repository has "+JSON.stringify(jRisk));   

        jListCor[corID]=jCOR;
        // jListCor assigns corID to COR's internal file structure

        // then fill each COR with all related aris instances
        let aris=0;
        Object.keys(aWitness).forEach((did)=>{            
            let jDoSH = aWitness[did];
            if(jDoSH.corID===jCOR.refHazard)  {
                // key(C * F * Hm)
                addARIS(jCOR,jRisk,jDoSH,jSituation,jHarm,aris++) 
                console.log("1076 makeInternalFile add "+JSON.stringify(jDoSH)+" to COR "+jCOR.id);   
            }
        })    



        // then fill each COR with all related hazards
        let dosh=0;
        arrListDoSH.forEach((jDoSH)=>{            
            if(jDoSH.corID===jCOR.refHazard)  {
                // key(C * F * Hm)
                addHazard(jCOR,jDoSH,dosh++) 
                console.log("1078 makeInternalFile add "+JSON.stringify(jDoSH)+" to COR "+jCOR.id);   
            }
        })        });





    let fileName="INTERNALFILE"+if_manufacturer+'_'+if_project+".JSON";

    let internalFile =  {
        "id":1,
        "name":"DeviceAssurance",
        "device":
        {   "entity":if_manufacturer,
            "project":if_project,
            "version":if_version,
            "udi":123
        },
        "regComponent":Object.keys(jComponent).map((x)=>(jComponent[x])),
        "regContext":[],
        "regFunction":Object.keys(jFunction).map((x)=>(jFunction[x])),
        "regHazard":Object.keys(jHazard).map((x)=>(jHazard[x])),
        "regEncodedHazard": [],
        "regHarm": Object.keys(jHarm).map((x)=>(jHarm[x])),
        "regHazardousSituation":Object.keys(jSituation).map((x)=>(jSituation[x])),      
        "regControlledRisk": arrCORI,
        "relSDA": []
    }

    const strTable  = JSON.stringify(internalFile);
    console.log("0762 makeInternalFile strTable="+strTable)

    return  functionButton(idButton,strTable,fileName,action,(strTable)=>{  converter(strTable,fileName,idButton) }) 
}

// refHazard in reality is the key made of F * Hm * C

function initCOR(jAris,rit_id,idCOR,jComponent,jFunction,jHarm) {

    return {
        "id":rit_id,
        "title": "ControlledRisk",
        "refComponent": jComponent[symbol1(jAris.comp)].id,
        "refFunction":  jFunction[symbol1(jAris.func)].id,
        "harm":  jHarm[symbol1(jAris.harm)],
        "refHazard":  idCOR,
        "regHazard":  JSON.parse('[]'),  
        "regAnalyzedRisk":JSON.parse('[]')
    }
}

function addHazard(jCor,jAris,iDoSH) {
    jCor.regHazard.push({'id':iDoSH, 'name':jAris.hazard})
    console.log("1080 addHazard add "+jAris.hazard+" to COR "+JSON.stringify(jCor.regHazard));   
}

function addARIS(jCor,jRisk,jAris,jSituation,jHarm,iAris) {
    if(jCor && jRisk) console.log("1062 addARIS add COR="+jCor.id+" "+jRisk.id);   
    else console.log("1063 addARIS add COR="+jCor.id+" "+jRisk.id); 

    try {
        jCor.regAnalyzedRisk.push({
            "id": "ARI"+iAris,
            "title": "AnalyzedRisk",
            "refCOR": jCor.id,
            "refHS": jSituation[symbol1(jAris.hazardousSituation)],
            "refHarm": jHarm[symbol1(jAris.harm)],
            "risk": JSON.parse(JSON.stringify({
                "severity": jRisk && jRisk.URS ? jRisk.URS : "0"  ,
                "probability": jRisk && jRisk.URL ? jRisk.URL : "-",
                "riskRegion": jRisk && jRisk.URA ? jRisk.URA :"-"
            })),
            "regTarget": jRisk && jRisk.TGT ? [jRisk.TGT] : ["Patient"],
            "refRiskSDA": "0",
            "residualRisk": {
                "severity": jRisk && jRisk.MRS ? jRisk.MRS : "0"  ,
                "probability": jRisk && jRisk.MRL ? jRisk.MRL : "-",
                "riskRegion": jRisk && jRisk.MRA ? jRisk.MRA :"-"
            }
        })
    } catch(e) { console.log("1065 addARIS failed");   }
    console.log("1064 addARIS add "+jAris.hazardousSituation+" to COR "+JSON.stringify(jCor.regHazard));   

}

function functionButton(idButton,strTable,fileName,functionName,functionCode) { 
    
    try {
        const functionButton=document.getElementById(idButton);
        if(functionButton) {
            let a = document.createElement('div');
            a.style.display = 'block'; // was none
            a.className = "FIELD MOAM" ; // was "key";
            a.innerHTML = functionName;
            a.onclick = (e) => { functionCode(strTable); }
            functionButton.replaceChild(a, functionButton.childNodes[0])
            console.log("0768 functionButton  "+functionName);
        } else console.log("0767 functionButton ("+functionName+") file("+fileName+"), NO button control");
    } catch(err) { console.log("0765 functionButton ("+functionName+") file("+fileName+"): "+err);}
    return functionName;
}



function makeURLButton(idButton,url,fileName) { 
    console.log("0766 makeURLButton "+url);
    try {
        const downloadButton=document.getElementById(idButton);
        if(downloadButton) {
            let a = document.createElement('a');
            a.href = url
            // file name security
            a.download = fileName;
            a.style.display = 'block'; // was none
            a.className = "FIELD MOAM" ; // was "key";
            a.innerHTML = "Download";
            downloadButton.replaceChild(a, downloadButton.childNodes[0]);(a); 
            console.log("0768 makeURLButton");
        } else console.log("0767 makeURLButton file("+fileName+"), NO button control");
    } catch(err) { console.log("0765 makeURLButton:"+err);}
    return url;
}





export function showLetter(file,addTicket,clientDir) {   
    
    // security file.name
    //let strMessage="upload from "+file.name;    
    const fileName = file.name;
    console.log("0636 getFile from "+fileName);                  
    var strFile=fileName.toLowerCase();
    if(strFile.endsWith(".json")) {

        let ticket=strSymbol(fileName);
        console.log("0638 showLetter ONLOAD NEW WINDOW FOR TICKET "+ticket);                                                    

        const fr = new FileReader();
        fr.addEventListener("load", () => {

            try {
                let strDOSH='[{"comp":"Portal", "func":"Import", "hazard":"External data format", "harm":"Server crash", "cause":"Malformed input", "hazardous situation":"Formatting error" }]';
                // strDOSH security
                
                // store file content as letter
                let jlistDOSH=JSON.parse(fr.result);
                console.log("0640 LOAD: READ FILE CONTENT "+strDOSH);                          
                
                if(Array.isArray(jlistDOSH)) 
                    strDOSH=JSON.stringify(jlistDOSH);
                else 
                    strDOSH="["+JSON.stringify(jlistDOSH)+"]";

                let b64DOSH = Buffer.from(strDOSH).toString('base64');

                addTicket(b64DOSH,ticket,fileName);
            } catch(err) {
                console.log("0641 LOAD: ADD TICKET FAILED:malformed payload "+err);
            }

            console.log("0644 LOAD: ADD TICKET TO NEW WINDOW "+ticket);                                                    
        }, false);
    
        if (file) {
            fr.readAsText(file);
        }
        console.log("0640 showLetter READS FILE "+fileName);   

    } else if(strFile.endsWith(".xlsx")) {
        console.log('0648 IMPORT-2-X from XLSX file <'+fileName+'> FROM SERVER');
        let filePath=clientDir+FILE_SLASH+fileName;
        handleHBook(filePath);     
        
        
    }  else if(strFile.endsWith(".html")) {
        console.log('0680 IMPORT-2-X from HTML file <'+fileName+'> FROM SERVER');

        let ticket=strSymbol(fileName);
        console.log("0682 showLetter ONLOAD NEW WINDOW FOR TICKET "+ticket);                                                    

        const fr = new FileReader();
        fr.addEventListener("load", () => {

            try {
                // process HTML file content as array of text lines
                let aLines=fr.result.split('\n');
                console.log("0684-LOAD: READ FILE CONTENT WITH "+aLines.length+ " LINES.");                          
                
                getFrom90025();

                let summary=processHTML(fr.result.split('\n'));
                console.log("0686 LOAD: PROCESSED HTML FILE CONTENT ");  
                
                let b64DOSH = Buffer.from(summary).toString('base64');
                console.log("0688 LOAD: ENCODED HTML FILE CONTENT ");  

                addTicket(b64DOSH,ticket,fileName);


            } catch(err) {
                console.log("0681 LOAD: ADD TICKET FAILED:malformed payload "+err);
            }

            console.log("0690 LOAD: ADDING TICKET TO NEW WINDOW "+ticket);                                                    
        }, false);
    
        if (file) {
            fr.readAsText(file);
        }
        console.log("0684-MAIN showLetter READS HTML FILE "+fileName);                     
    }
    return strFile;
}



export function receiveLetter() {
    let env=document.getElementById('envelope');
    if(env) {
        console.log('0602 receiveLetter found env.');
        let inbox=env.children;
        if(inbox.length) {
            let l=inbox.length;
            console.log('0604 receiveLetter from "+l+" letters.')
            for(let c=0;c<l;c++) {
                let letter=inbox[c];
                if(letter) console.log('0606 receiveLetter letter #'+c);
                if(letter.getAttribute('id')!=null) {
                    let ticket = letter.getAttribute('id');
                    console.log('0608 receiveLetter FOUND letter #"+c+" with ticket '+ticket);                
                    let fileName = letter.getAttribute('key');
                    let content = letter.innerHTML;
                    console.log('0610 receiveLetter FOUND letter #"+c+" with content length '+content.length);
                    envelope.removeChild(letter);
                    return { 'ticket':ticket, 'content':content, 'fileName':fileName };
                }
            }
        }
    }
    return null;

}


export function replaceChild(control,name) {

    let child = document.getElementById(name);
    if(child) {
        child.style.display = 'none';
        document.body.removeChild(child);
    }
    else console.log("0763 makeArchiveButton DID NOT replaceChild");

    document.body.appendChild(control); 
    console.log("0764 makeArchiveButton replaceChild");
}

// when am element is draggable, this handler reacts to onDrag events
export function dragARIS(ev,jAris) {
    let strAris=JSON.stringify(jAris);
    ev.dataTransfer.setData("text/plain", strAris);
}




export function dragOverHandler(ev) {
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
    console.log('0616 File(s) in drop zone'); //+JSON.stringify(ev.dataTransfer.items[0]));
}


export function dropHandler(ev,addTicket,addRiskTicket,showLetter,clientDir) {
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
    console.log('0670 File(s) dropped');        

    if (ev.dataTransfer) {
        // is there a dataTransfer element in this event            
        console.log("0674 dataTransfer"+JSON.stringify(ev.dataTransfer.types));

        if (ev.dataTransfer.getData('text/uri-list')) {
            console.log('0676 Target  JSON '+ev.dataTransfer.getData("text/uri-list")+'  dropped' );
            let strURI = ev.dataTransfer.getData("text/uri-list");
            console.log('0678  URI=\n'+strURI);
        }

        // Use text/json in DataTransferItemList interface to obtain DosH from payload
        if (ev.dataTransfer.getData('application/json')) {
            
            let strDOSH= ev.dataTransfer.getData("application/json");                
            console.log('0618 Target  JSON '+strDOSH+'  dropped' );
            try {
                let jDOSH = JSON.parse(strDOSH);
                if(jDOSH.hazard) {
                    console.log('0620 JSON DOSH=\n'+strDOSH);
                    addRiskTicket(jDOSH,"drag application/JSON from event");

                } else {
                    console.log('0621 JSON OTHER=\n'+strDOSH);
                    if(jDOSH.env) {
                        console.log('0619 FILE ENV=\n'+jDOSH.env);                        
                    }
                }
            } catch(e) {
            }
        } 
        
        if (ev.dataTransfer.getData('text/plain')) {
            console.log('0622 Target  BASE '+ev.dataTransfer.getData("text/plain")+'  dropped' );
            let strBASE = ev.dataTransfer.getData("text/plain");
            try {
                let strPLAIN= atob(strBASE);
                console.log('0624 atob(BASE)=PLAIN\n'+strPLAIN);
                try {
                    addRiskTicket(JSON.parse(strPLAIN),"drag text/plain from event as base64");
                    console.log('0626 drag text/plain from event as base64')
                } catch(e) {                    
                    try {
                        addRiskTicket(JSON.parse(strBASE),"drag text/plain from event in clear text");
                        console.log('0628 drag text/plain from event in clear text')
                    } catch(e) {
                        console.log('0623 JSON ('+e+') BASE=\n'+strBASE);
                    }
                }        

            } catch(e) {
                try {
                    addRiskTicket(JSON.parse(strBASE),"drag text/plain from event in clear text");
                    console.log('0626 drag text/plain from event in clear text')
                } catch(e) {
                    console.log('0625 JSON ('+e+') BASE=\n'+strBASE);
                }
            }                        
        } else {

            let nItems=ev.dataTransfer.items.length;
            console.log("0630 "+ev.dataTransfer.items.length);

            for(let i=0;i<nItems;i++) {
                let data = ev.dataTransfer.items[i];

                data.getAsString((s) => {
                    console.log('0632 item# '+i+' = '+s);
                });

                if (data ) {                        
                    if(data.kind === 'file') {

                        // open new BASE window, which then loads the file on its own
                        let file = ev.dataTransfer.files[i];
                        console.log('0634 IMPORT-2 from file '+file.name );                            
                        
                        showLetter(file,addTicket,clientDir); // load file into base window's envelope
                        // new letter will be identified by ticket

                    } else if (data.kind === "string" && data.type.match("^text/plain")) {
                        // This item is the target node
                        data.getAsString((s) => {
                            console.log("0652 text item("+i+") "+s);
                            if(s.endsWith(".xlsx")) {
                                console.log("0654 XLSX file type "+s);
                            }
                        });

                    } else if (data.kind === "string") {
                        // Drag data item is HTML
                        console.log("… Drop: other string");
                        // unknown event
                        // transferring data object
                        let len = data.length;
                        console.log("0661 "+len+" Data items #");
                        
                        let dItems=data.length;
                        for(let j=0;j<dItems;j++) {
                            let line=data[j];
                            line.getAsString((s)=>{
                                console.log("0662 Data item("+i+") "+s);
                                var base=new String(s);
                                let jEntry=JSON.parse(base);
                                console.log("0664 Data item("+i+") "+JSON.stringify(jEntry));
                            });
                        }
                    }
                }
            }
        }
    }
}


export function load(view) {
    
    let server=process.env.REACT_APP_NODE;
    let s_port=process.env.REACT_APP_UI;
    
    if(server && server.length > SOME && s_port && s_port.length> SOME)
        window.location.href = 'http://'+server+':'+s_port+'/?view='+view;
}


