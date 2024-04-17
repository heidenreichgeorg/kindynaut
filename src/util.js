import { Buffer } from 'buffer';
import { processHTML,startAPI } from './extract.js';

//import dotenv from 'dotenv'
//dotenv.config({ path: './.env.local' })
// npm install dotenv

export const HTTP_OK     = 200;
export const HTTP_WRONG  = 400;

export const SOME = 4;

export const Slash = '/';
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

export function load(view) {
    
        let server=process.env.REACT_APP_NODE;
        let s_port=process.env.REACT_APP_PORT;
        
        if(server && server.length > SOME && s_port && s_port.length> SOME)
            window.location.href = 'http://'+server+':'+s_port+'/?view='+view;
}
    

export function strSymbol(pat) {

    let seed = process.env.REACT_APP_ENCODING_SEED;

    let cypher = seed;
    if(!seed) cypher = "kindynautahotprojectforviewingzoomingquickdigitaldeviceboxes";

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

export function symbol(temp) {
    let p=strSymbol(temp);
    return p[13]+p[17]+p[2]+p[5]+p[11]+p[3]+p[7]+p[19];
}

export function handleHBook(fileName) {        
    let client="MFR";
    let family="IMAGING";

    console.log("0710 handleWorkbook  "+fileName);
    
    const rqHeaders = {  'Accept': 'application/octet-stream',
                        'Access-Control-Allow-Origin':'*',
                        'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept, Authorization' };


                        // SECURITY fileName may carry markup
    const rqOptions = { method: 'GET', headers: rqHeaders, mode:'no-cors'};
    try {                 
        let server=process.env.REACT_APP_NODE;
        let s_port=process.env.REACT_APP_PORT;

        let url = `http://${server}:${s_port}/DOWNLOAD?file=`+fileName;
        fetch(url, rqOptions)
        .then((response) => response.text())
        .then((text) => console.log("0712 "+text))
        // arrList.forEach((line)=>{resourceLimits.push(line);console.log(line)})
        //.then((url) => console.log("0712 handleHBook URL= "+ makeArchiveButton(url,client,family)))
        .catch((err) => console.error("0711 handleHBook ERR "+err));           
    } catch(err) { console.log("0713 GET /DOWNLOAD handleHBook:"+err);}
    console.log("0730 handleHBook FETCH <HTML><A href='"+url+"'>"+fileName+"</A></HTML>");
}


export function handleArchive() {    
    console.log("0780 handleArchive  "+client+"/"+family);
    const blob = new Blob([JSON.stringify(listAris, null, 2)], {
        type: "application/json",
    });
    let url = URL.createObjectURL(blob);
    makeArchiveButton(url,client,family)
    console.log("0782 handleArchive EXIT");
}


export function makeArchiveButton(url,client,family) { 
    console.log("0740 makeArchiveButton "+url);
    if(client) {
        if(family) {

            let a = document.createElement('a');
            a.setAttribute("id", "btnArchive");
            a.href = url;
            a.download = "ARCHIVE_"+client+'_'+family+".JSON";
            a.style.display = 'none'; // was block
            a.className = "key";
            a.innerHTML = "Downloading...";
    
            replaceChild(a,"btnArchive");

            a.click();

        } else console.log("0766 makeArchiveButton XLSX client("+client+"), NO year");
    } else console.log("0768 makeArchiveButton XLSX NO client");
    return url;
}


export function showLetter(file,addTicket) {   
    
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
        let filePath=clientDir+'/'+fileName;
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
                
                startAPI();

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
    console.log('0610 File(s) in drop zone'); //+JSON.stringify(ev.dataTransfer.items[0]));
}


export function dropHandler(ev,addTicket,addProjAris,showLetter) {
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
            console.log('0620 Target  JSON '+strDOSH+'  dropped' );
            try {
                let jDOSH = JSON.parse(strDOSH);
                if(jDOSH.hazard) {
                    console.log('0620 JSON DOSH=\n'+strDOSH);
                    addProjAris(jDOSH,"drag application/JSON from event");

                } else {
                    console.log('0621 JSON OTHER=\n'+strDOSH);
                    if(jDOSH.env) {
                        console.log('0626 FILE ENV=\n'+jDOSH.env);
                        //setClientDir(jDOSH.env);
                    }
                }
            } catch(e) {
            }
        } 
        
        if (ev.dataTransfer.getData('text/plain')) {
            console.log('0622 Target  PLAIN '+ev.dataTransfer.getData("text/plain")+'  dropped' );

            let strBASE = ev.dataTransfer.getData("text/plain");

            try {
                let strPLAIN= atob(strBASE);
                console.log('0622 JSON PLAIN=\n'+strPLAIN);
                addProjAris(JSON.parse(strPLAIN),"drag text/plain from event as base64");

            } catch(e) {
                console.log('0623 CODE ('+e+') BASE=\n'+strBASE);
                try {
                    addProjAris(JSON.parse(strBASE),"drag text/plain from event in clear text");
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
                        
                        showLetter(file,addTicket); // load file into base window's envelope
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



