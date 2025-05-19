import { Buffer } from 'buffer';

const MINTEXT = 2 

import { arisIdentifier, corIdentifier, dragOverHandler, dropHandler, initDomain, jGrid, updateDomain, 
     handleHBook, handleStore, makeDomainJSON, makeExportFile, makeInternalFile, makeRiskTable, receiveLetter, showLetter, SOME } from './util.js'

import { useState, useEffect } from 'react';

// UP_ARROW &#x21d1;

const LEARN_DOMAIN = false;

const KN_DOWNLOAD="KN_DOWNLOAD" // DOM button id: download to client as a device risk table, for re-editing
const KN_DHAZARDS="KN_DHAZARDS" // DOM button id: download to client as a dosh list, for re-loading
const KN_EXPORT="KN_EXPORT"     // DOM button id: export as an Internal File as of VDE SPEC 90025 (JSON)
const KN_INTERNAL="KN_INTERNAL" // DOM button id: export as an External File as of VDE SPEC 90025 (HTML)

const SCR_DOMAIN = "DOMAIN" // ticket name for device ARIS
const SCR_COR = "COR"       // ticket name for base COR

const MODE_EDIT = 0;
const MODE_SAVE = 1;

const FCS_DOMAIN = "DOMAIN"
const FCS_RISKS  = "RISKS"
const FCS_FILES  = "FILES"

const KN_TICKETS="KN_TICKETS"
const KN_FILES = "KN_FILES"

// elements of COntrolled Risk
const arrTag = ["URS","URL","URA","TGT","MRS","MRL","MRA"]


// envelope is a container for a message queue
// ticket identifies letter
// letter.innerHTML is base64 form of a fixed content collection
// message is any new ticket

const T_DOMAIN = '["DOMAIN"]';

const EMPTY_ARIS = {'comp':' ','func':' ','hazard':' ','code':' ','cause':' ','hazardousSituation':' ','harm':' '}

function debug(str) {
    console.log(str)
}

function sanitize(str) {
    if(!str) return "0";
    let nocol=str.replaceAll(',','_')
    let nosem=nocol.replaceAll(';','_')
    let nodos=nosem.replaceAll('\\','_')
    let nostr=nodos.replaceAll('"','_')
    str=nostr.replaceAll("'",'_')
    return str;
}

function init() {
    let check=window.sessionStorage.getItem(KN_TICKETS);
    if(check && check.length>SOME) return;
    window.sessionStorage.setItem(KN_TICKETS,  T_DOMAIN );
    window.sessionStorage.setItem(KN_FILES,    T_DOMAIN );
    store(SCR_DOMAIN,[]); 
    store(SCR_COR,{}); 

    debug("0708 init SCR_DOMAIN="+repository[SCR_DOMAIN])
}

// repository mirrors the json-lists stored in sessionStorage for the domain and also for all files
let repository={'DOMAIN':[],'SCR_COR':{}};
let corMap = {}; // list of controlled risk identifiers
let repFiles=[];

function store(ticket,arrList)  {
    try {
        debug("0712 STORE puts "+JSON.stringify(arrList)+" under "+ticket);
        repository[ticket]=arrList;
        try {
            debug("0714 STORE finds repository on keys list #"+Object.keys(arrList).length);
            
            let strList = JSON.stringify(arrList);
            debug("0716 STORE key list="+strList);
            try {
                let b64encoded= Buffer.from(strList,"utf8").toString('base64');
                //debug("0718 STORE keys for ticket ("+ticket+") in base64 as"+b64encoded);
                window.sessionStorage.setItem(ticket,b64encoded);
            } catch(err) {debug("0715 STORE "+ticket+" ->"+err)}
        } catch(err) {debug("0713 STORE "+ticket+" ->"+err)}
    } catch(err) {debug("0711 STORE "+ticket+" ->"+err)}
}


function addProjAris(jAris,strMessage) {
    let jListAris = [];
    if(Array.isArray(jAris)) jAris.forEach((jElement, i)=>{jListAris=addProjAris(jElement,"#"+i+" "+strMessage)})
    else {
        if(jAris) {
            if(jAris.hazard) {
                jListAris = repository[SCR_DOMAIN];
                debug("0892 addProjAris("+strMessage+") ENTER element for hazard="+jAris.hazard+" into #"+Object.keys(jListAris).length);
        
                if(!Array.isArray(jListAris)) jListAris=[]; // GH20240708 help with startup

                jAris.corID = corIdentifier(jAris);
                jAris.arisID = arisIdentifier(jAris);

                jListAris.push(jAris);
                
                let aKeys={}
                jListAris.map((aris)=>(aKeys[aris.arisID]=0));
                jListAris.map((aris)=>(aKeys[aris.arisID]=1+aKeys[aris.arisID]));
                debug("0894 addProjAris stored with now "+jListAris.length+" entries for #"+Object.keys(aKeys).length);   

                let jNewList = [];
                Object.keys(aKeys).map((arisID)=>(jListAris.forEach((aris)=>{if(aris.arisID===arisID) jNewList.push(aris)})))

                //debug("0896 addProjAris sorts new list with remaining "+jListAris.length+" entries.");   
                store(SCR_DOMAIN,jNewList);

            } else debug("0895 addProjAris "+strMessage+" NO HAZARD - INVALID:"+JSON.stringify(jAris));

            debug("0898 addProjAris EXIT "+strMessage+" with these arisIDs: "+JSON.stringify(jListAris.map((aris)=>(aris.arisID))));
        }
        else debug("0891 addProjAris "+strMessage+" EMPTY");
    }
    return jListAris;
}



// MAIN PAGE BUILDER 

export function Portal({portalFileName, view}) {

    const MINUTE_MS = 60000;

    useEffect(() => {
      const interval = setInterval(() => {
        console.log('Logs every minute');


        if(repository[SCR_DOMAIN] && repository[SCR_DOMAIN].length>MINTEXT) {
            console.log('Logs every minute and  finds '+(repository[SCR_DOMAIN].length)+' dosh');            

        } else {
            let domain = getFile('domain');
            console.log("send INIT for domain="+domain);
            initDomain(domain,updateDomainWindow)
        }


      }, MINUTE_MS);
    
      return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    }, [])



    // filters and display/edit mode
    const [strFilter, setStrFilter] = useState("{}") // filter form buffer
    const [jArisEditor, setJArisEditor] = useState({}) // ARIS editor form buffer
    //const [jRiskEditor, setJRiskEditor] = useState({}) // RISK editor form buffer, part of COR

    let jRiskEditor={};

    const [jFile, setJFile] = useState(
            {'project':'product',
            'clientDir':process.env.REACT_APP_CLIENT_DIR,
            'manufacturer':process.env.REACT_APP_MANUFACTURER,
            'device':process.env.REACT_APP_DEVICE_NAME,
            'version':process.env.REACT_APP_DEVICE_VERSION,
            'domain':process.env.REACT_APP_DOMAIN}) // common file data buffer
    const [mode, setMode ] = useState(MODE_SAVE);
    
    init();

    // DOMAIN view - if no params are given
    // http://localhost:3000/public
    let focus= LEARN_DOMAIN ? FCS_DOMAIN : FCS_FILES;


    // FILES view, if no view param is given
    // http://localhost:3000/?file=c:/workspace/kindynaut/res/ARCHIVE_MFR_IMAGING.JSON
    if(portalFileName && portalFileName.length>0)  {
        focus=FCS_FILES;
    }

    if(view && view.length>SOME) {
        if(view===FCS_DOMAIN) focus=FCS_DOMAIN
        if(view===FCS_FILES) focus=FCS_FILES
        if(view===FCS_RISKS) focus=FCS_RISKS
    }

    function addFileTicket(content,ticket,fileName) {
        // add as a new file list
        // for visual cross-check of tickets only
        let envelope = document.getElementById('envelope')
        let letter=document.createElement('div')
        letter.innerHTML=content
        letter.className = "FIELD MOAM";
        letter.setAttribute('id',ticket)
        letter.setAttribute('key',fileName)
        envelope.appendChild(letter)
        debug("0752 addFileTicket("+fileName+") "+ticket)

//         load(FCS_FILES);

        setMode(mode+1) // trigger redraw
        return ticket
    }

    
    function addRiskTicket(jDOSH,message) {

        let arrDomain = addProjAris(jDOSH,message);

        updateDomainWindow(arrDomain)
        return jDOSH;
    }


// DOMAIN display as SETs
    let setComp = {};
    let setFunc = {};
    let setHazd = {};
    let setCaus = {};
    let setCode = {};
    let setSitu = {};
    let setHarm = {};

    // GH20240514 data coming from initDomain -- e is a string already


    function testComp(e) { debug("0720 "+JSON.stringify(setComp)+"+"+JSON.stringify(e)); if(setComp[e.comp]) return false;               return setComp[e.comp]=1;}
    function testFunc(e) { debug("0722 "+JSON.stringify(setFunc)+"+"+JSON.stringify(e)); if(setFunc[e.func]) return false;               return setFunc[e.func]=1;}
    function testHazd(e) { debug("0724 "+JSON.stringify(setHazd)+"+"+JSON.stringify(e)); if(setHazd[e.hazard]) return false;             return setHazd[e.hazard]=1;}
    function testCaus(e) { debug("0726 "+JSON.stringify(setCaus)+"+"+JSON.stringify(e)); if(setCaus[e.cause]) return false;              return setCaus[e.cause]=1;}
    function testCode(e) { debug("0728 "+JSON.stringify(setCode)+"+"+JSON.stringify(e)); if(setCode[e.code]) return false;               return setCode[e.code]=1;}
    function testSitu(e) { debug("0730 "+JSON.stringify(setSitu)+"+"+JSON.stringify(e)); if(setSitu[e.hazardousSituation]) return false; return setSitu[e.hazardousSituation]=1;}
    function testHarm(e) { debug("0732 "+JSON.stringify(setHarm)+"+"+JSON.stringify(e)); if(setHarm[e.harm]) return false;               return setHarm[e.harm]=1;}




    function addDOMAINRisk(ticket,area) {
        // add risk in this FILE to DOMAIN list    
        debug("0880 Portal.addDOMAINRisk "+ticket+ "  "+area); 

        let jRawList=filterInstance(ticket,area);

        try {
            debug("0882 Portal.addDOMAINRisk to transfer filtered FILE risks "+JSON.stringify(jRawList)+" risks.");
            let arrDomain=[];
            try {
                let base64Domain=window.sessionStorage.getItem(SCR_DOMAIN);
                if(base64Domain && base64Domain.length>SOME) {
                    let strDomain = Buffer.from(base64Domain,'base64').toString('utf8');
                    arrDomain=JSON.parse(strDomain);
                }
                debug("0884 Portal.addDOMAINRisk already in DOMAIN="+JSON.stringify(arrDomain)); 
                
                try { 
                    jRawList.forEach((aris)=>{
                        // was arrDomain.push(aris) GH20240719
                        arrDomain=addProjAris(aris,"adDomainRisk into "+ticket)
                        // !! CAN resolve arrays by itself
                        // GH 20240719 aris identifier needs cause,code members
                        // cause,code are not transferred on whole html file transfers
                    });
                    // GH20240719 must sort by ControlledRisk, do not just push into DOSH list...

                    updateDomainWindow(arrDomain);

                } catch(err) { debug("0881 Portal.addDOMAINRisk DOMAIN push failed "+err);}
            } catch(err) { debug("0883 Portal.addDOMAINRisk DOMAIN decoding/parsing failed "+err);} 
        } catch(err) { debug("0885 Portal.addDOMAINRisk new risk parsing failed "+err);}

        return ticket;
    }

    function fLoadRiskInfo(whatever) {
        try {
            let base64Domain=window.sessionStorage.getItem(SCR_COR);
            if(base64Domain && base64Domain.length>SOME) {
                let strRisks = Buffer.from(base64Domain,'base64').toString('utf8');
                repository[SCR_COR]=JSON.parse(strRisks);
            }
            debug("0830 fLoadRiskInfo already in RISKS="+JSON.stringify(repository[SCR_COR]));             
        } catch(err) { debug("0831 fLoadRiskInfo DOMAIN decoding/parsing failed "+err);} 
        return whatever;
    }


    function compare(ticket,area) {
    
        // add risk in FILE to DOMAIN risks    
        debug("0880 Portal.compare "+ticket+ "  "+area); 

    

        // FILE list content for each key
        // fileKeys{} is a list of risks for each key
        // fileIndex is a sorted array of keys into alls risks (pre-arranged by keys in fileKeys)
        let jRawList=filterInstance(ticket,area);
        let fileKeys = {}        
        jRawList.forEach((risk)=>{let id=arisIdentifier(risk); if(fileKeys[id] && fileKeys[id].length>0) fileKeys[id].push(risk); else fileKeys[id]=[risk] })
        let fileIndex = Object.keys(fileKeys).sort();


        debug("0888A\n"+fileIndex.map((key)=>(key+":\n"+(fileKeys[key].map((d)=>(jGrid(d)))).join('\n')   )).join('\n'));


        let jListAris = repository[SCR_DOMAIN];
        let domainKeys = {}        
        jListAris.forEach((risk)=>{let id=arisIdentifier(risk); if(domainKeys[id] && domainKeys[id].length>0) domainKeys[id].push(risk); else domainKeys[id]=[risk] })
            debug("0888B\n"+JSON.stringify(domain));
        let domainIndex = Object.keys(domainKeys).sort();

        debug("0888C\n"+domainIndex.map((key)=>(key+":\n"+(domainIndex[key].map((d)=>(jGrid(d)))).join('\n')   )).join('\n'));
        // DOMAIN list domain content for each key
        // do the same for DOMAIN and merge the sorted key lists.
        // then play the joint index file and tell whats here and whats there




        return ticket;
    }


    function updateDomainWindow(arrDomain) {       
        
        // GH20240722
        // sort aris by COR id
        corMap={};
        let c=0;
        JSON.stringify(arrDomain.forEach((d)=>{if(c=corMap[d.corID]) corMap[d.corID].push(d); else corMap[d.corID]=[d]}))

            // sort array by dosh ids as they are in the map
        let newDomain=[];
        Object.keys(corMap).forEach((corID)=>{let dosh4cor=corMap[corID]; dosh4cor.forEach((dosh)=>{newDomain.push(dosh)})})

        debug("0886 Portal.updateDomainWindow new DOMAIN risks #"+arrDomain.length+ " now #"+newDomain.length+ " with CORs ="+JSON.stringify(corMap));
        
        let strTransfer=JSON.stringify(newDomain);
        
        let transfer64 = Buffer.from(strTransfer,'utf8').toString('base64');
        window.sessionStorage.setItem(SCR_DOMAIN,transfer64);

        setMode(mode+1); // trigger redraw
    }


    debug("0800 Portal for "+focus);

    function update() {        
        let message=receiveLetter();
        if(message && message.ticket.length>SOME) {
            debug("0812 Portal.update: new message.ticket "+message.ticket);  
            let base64encoded=message.content;
            if(base64encoded && base64encoded.length>SOME) {
                debug("0812 Portal.update checks letter from message.content ["+base64encoded+"]");

                let strTickets = window.sessionStorage.getItem(KN_TICKETS);
                if(!strTickets || strTickets.length<SOME) { 
                    strTickets='[]';
                    debug("0814 Portal.update finds no strTickets "+strTickets);
                } else {
                    debug("0814 Portal.update finds strTickets "+strTickets);
                }

                try {                    
                    let jTickets= JSON.parse(strTickets);         
                    jTickets.push(message.ticket);
                    window.sessionStorage.setItem(KN_TICKETS, JSON.stringify(jTickets));
                    debug("0812 Portal.update sessionStorage with ticket");

                    window.sessionStorage.setItem(message.ticket,base64encoded);
                    debug("0816 Portal.update sessionStorage with content");

                    let strFiles = window.sessionStorage.getItem(KN_FILES);
                    repFiles= JSON.parse(strFiles);         
                    repFiles.push(message.fileName);                    
                    strFiles=JSON.stringify(repFiles);
                    window.sessionStorage.setItem(KN_FILES,strFiles);
                    debug("0818 Portal.update sessionStorage with file names "+strFiles);

                    setMode(mode+1) // notify parent for re-paint
      
                } catch(e) { debug("0815 Cannot parse JSON"); }
            } else debug("0813 Portal.update gets empty content.");
        }        
    }

    update();


    /* security */
    debug("0704 Portal finds env with "+Object.keys(process.env).map((key)=>(key+'->'+process.env[key])))
    

    function portalLine(color,comp,func,hazard,code,cause,hazardousSituation,harm,corID,removeLine,editStart,clickH) {
        // line for a DOMAIN-related ARIS: no drag, but edit,delete,copy
        return (
            <div className="KNLINE NONE" corid={corID} onClick={clickH} key="workbench">                                     
                <div className={color+" FIELD TRASH"} key="sep">&nbsp;</div>
                <div className={color+" FIELD NAME"} key="com">{comp}</div>
                <div className={color+" FIELD NAME"} key="fun">{func}</div>
                <div className={color+" FIELD NAME"} key="haz">{hazard}</div>
                <div className={color+" FIELD NAME"} key="cod">{code}</div>
                <div className={color+" FIELD NAME"} key="cau">{cause}</div>
                <div className={color+" FIELD NAME"} key="hsi">{hazardousSituation}</div>
                <div className={color+" FIELD "} key="har">{harm}</div>
                {removeLine ? (<div className={color+" FIELD SEP"} key="kill" onClick={removeLine}>&#128465;</div>) : ""} 
                {editStart ?  (<div className={color+" FIELD SEP"} key="edit" onClick={editStart}>&#9998;</div>) : ""}  
            </div>)
    }
    


    function filterLine(key,color,style,compH,funcH,hazardH,codeH,causeH,situationH,harmH) {
        return (
            <div className={color+" "+style} key={key}>
                <div className={color+" NOTE NAME"} ><input className={color+" FIELD"} type="edit" onChange={compH}  key="com"/></div>
                <div className={color+" NOTE NAME"} ><input className={color+" FIELD"} type="edit" onChange={funcH}  key="fun"/></div>
                <div className={color+" NOTE NAME"} ><input className={color+" FIELD"} type="edit" onChange={hazardH}  key="haz"/></div>
                <div className={color+" NOTE NAME"} ><input className={color+" FIELD"} type="edit" onChange={codeH}  key="cod"/></div>
                <div className={color+" NOTE NAME"} ><input className={color+" FIELD"} type="edit" onChange={causeH}  key="cau"/></div>
                <div className={color+" NOTE NAME"} ><input className={color+" FIELD"} type="edit" onChange={situationH}  key="hsi"/></div>
                <div className={color+" NOTE NAME"} ><input className={color+" FIELD"} type="edit" onChange={harmH}  key="har"/></div>                           
            </div>)
    }
    

    // begin editing at all 
    function editStart(index) {
        let jListAris = repository[SCR_DOMAIN]
        debug("0774 editStart ENTER element at index="+index)
        let jContent = jListAris[index]
        setJArisEditor(jContent)

        setMode(MODE_EDIT)
        debug("0774 editStart BEGIN EDITING for editing element ="+JSON.stringify(jContent))
    }

    function getEditor(attribute) {
        if(jArisEditor==null) return ''
        let result= jArisEditor[attribute]
        if(result==null) return ''
        return result;
    }

    function setEditInput(comp,value) {
        // onInput handler for edit controls
        let result=JSON.stringify(jArisEditor)
        debug("0780 setEditInput ENTER ("+comp+") set value="+result);

        try {
            let jContent=JSON.parse(result)
            jContent[comp]=value;
            result=JSON.stringify(jContent);
            setJArisEditor(jContent);
            debug("0780 setEditInput LOAD editor="+result);
        } catch(e) { debug("0781 editStart ("+comp+","+value+") BAD FORMAT "+result); }
    }


    function editStop() {
        // copy all edit content into the special editorLine instance
        debug("0782 editStop EDITOR="+JSON.stringify(jArisEditor));
        try {            
            let jListAris = repository[SCR_DOMAIN];
            jListAris.push(jArisEditor);            
            store(SCR_DOMAIN,jListAris);
            setMode(MODE_SAVE);
            debug("0782 editStop STORE "+JSON.stringify(jArisEditor));
        } catch(e) { debug("0783 editStop BAD FORMAT "+JSON.stringify(jArisEditor)); }
    }

    function getRisk(corID) {
        let result={}
        let jListCor = repository[SCR_COR]
        // (A) init new SCR_COR
        if(!jListCor) {
            jListCor = JSON.parse("{}");
            repository[SCR_COR]=jListCor;
        }
        // (B) init new corID
        if(corID) {
            if(!jListCor[corID]) jListCor[corID]=JSON.parse("{}");
            result=jListCor[corID];
        }
        return result;
    }

    function getRiskField(attribute,currentCID) {
        let risk = getRisk(currentCID)
        debug("0759 getRiskField("+attribute+")with["+currentCID+"] from "+JSON.stringify(risk)+ " taken from "+JSON.stringify(repository[SCR_COR]))
        return risk[attribute]
    }

    function editRiskStart() {
        debug("0775 editRiskStart ENTER");
        // unmitigated risk severity, likelihood,level, target group, mitigated risk severity likelihood,level
        let jValues = repository[SCR_COR]
        if(jValues) {
            debug("0777 editRiskStart "+JSON.stringify(jValues));
            let arrCOR = Object.keys(repository[SCR_COR])
            arrCOR.forEach((corID) => {
                let assignment = jValues[corID]
                arrTag.forEach((tag) => {
                    let value = assignment[tag]
                    jRiskEditor[tag]=value
                })
            })
            // setJRiskEditor(jRiskEditor)
        }
    }


    function editRisk(target) {
        let parent=target.parentNode
        if(target) {
            let corID = parent.getAttribute('corid');
            let children=parent.children;
            for (const cNode of children) {
                let tag = cNode.getAttribute('tag')
                if(tag) {
                    let value = cNode.value;
                    if(value) {
                        debug("0754 editRisk("+corID+") sets "+value+" to "+tag);
                        jRiskEditor.corID=corID
                        jRiskEditor[tag]=value
                        debug("0756 editRisk("+corID+") keeps risk= "+JSON.stringify(jRiskEditor));
                    } else debug("0755 editRisk("+corID+") empty value "+tag);
                } else debug("0753 editRisk("+corID+") no key in node "+cNode.tagName);
            }
        } else debug("0757 editRisk missing target")
    }

    function riskEditStop(strangeID) {
        const corID = jRiskEditor.corID; // GH20240722

        // copy all risk/COR edit content into the special editorLine instance
        debug("0790 riskEditStop("+corID+") WILL STORE EDITOR ="+JSON.stringify(jRiskEditor));
        let jListCor = repository[SCR_COR]
        // (A) init new SCR_COR
        if(!jListCor) {
            jListCor = JSON.parse("{}");
            repository[SCR_COR]=jListCor;
        }


        // (B) init new corID
        if(!jListCor[corID]) {
            jListCor[corID]=JSON.parse("{}");
            debug("0792 riskEditStop("+corID+") NEW ENTRY FOR "+JSON.stringify(jRiskEditor));
        }

        try {
            // in-place assignment with global variable
            let strRiskEditor=JSON.stringify(jRiskEditor);
            // needs a copy !!
            jListCor[corID]=JSON.parse(strRiskEditor); 
            debug("0794 riskEditStop("+corID+") STORED EDITOR ="+strRiskEditor);
            
            store(SCR_COR,jListCor);
            debug("0796 riskEditStop STORE "+JSON.stringify(jRiskEditor));
        } catch(e) { debug("0793 riskEditStop BAD FORMAT1 "+JSON.stringify(jRiskEditor)); }
        debug("0798 riskEditStop STORE "+JSON.stringify(jListCor));
    }

    function editLine(key,style,stopH) {
        return (
            <div className={style} key={key}>
                <div className="NOTE NAME" ><input className="FIELD" type="edit" value={getEditor('comp')} onInput={e => setEditInput('comp',e.target.value)} id="com" key="com"/></div>
                <div className="NOTE NAME" ><input className="FIELD" type="edit" value={getEditor('func')} onInput={e => setEditInput('func',e.target.value)} id="fun" key="fun"/></div>
                <div className="NOTE NAME" ><input className="FIELD" type="edit" value={getEditor('hazard')} onInput={e => setEditInput('hazard',e.target.value)} id="haz" key="haz"/></div>
                <div className="NOTE NAME" ><input className="FIELD" type="edit" value={getEditor('code')} onInput={e => setEditInput('code',e.target.value)} id="cod" key="cod"/></div>
                <div className="NOTE NAME" ><input className="FIELD" type="edit" value={getEditor('cause')} onInput={e => setEditInput('cause',e.target.value)} id="cau" key="cau"/></div>
                <div className="NOTE NAME" ><input className="FIELD" type="edit" value={getEditor('hazardousSituation')} onInput={e => setEditInput('hazardousSituation',e.target.value)} id="sit" key="sit"/></div>
                <div className="NOTE NAME" ><input className="FIELD" type="edit" value={getEditor('harm')} onInput={e => setEditInput('harm',e.target.value)} id="hrm" key="hrm"/></div>
                <div className="FIELD NOTE DASH" onClick={stopH}>OK</div>
            </div>)
    }

    // jListAris reflects the repository entry  for SCR_DOMAIN, i.e. the work-space     
    function removeLine(index) {
        let jListAris = repository[SCR_DOMAIN];
        debug("0770 removeLine ENTER remove element at index="+index);        
        if(index>=0)  jListAris.splice(index,1);
        store(SCR_DOMAIN,jListAris);
        setMode(mode+1); // trigger redraw
        debug("0770 removeLine EXIT with remaining "+jListAris.length+" entries.");        
    }
    
    function filterARIS(tag,value) {
        let pattern=JSON.parse(strFilter);
        pattern[tag]=value;
        let filter=JSON.stringify(pattern);
        setStrFilter(filter);
        debug("0776 filterARIS:"+filter)    
    }


    function filterInstance(ticket,area) {
        debug("0820 filterInstance for ticket "+ticket+" entered.")
        let arrInstance=repository[ticket];
        let filteredAris=[];
        let enableFlag=false ;
        if(arrInstance && arrInstance.length && Array.isArray(arrInstance)) {
            debug("0822 filterInstance using filter "+strFilter)
            arrInstance.forEach((line)=>{            
                let jFilter=JSON.parse(strFilter.toLowerCase());
                let flag=true;
                if(jFilter.comp && line.comp && jFilter.comp.length>0) {
                    enableFlag=true; 
                    if(line.comp.toLowerCase().indexOf(jFilter.comp)<0) flag=false;}

                if(jFilter.func && line.func && jFilter.func.length>0) {
                    enableFlag=true; 
                    if(line.func.toLowerCase().indexOf(jFilter.func)<0) flag=false;}

                if(jFilter.hazard && line.hazard && jFilter.hazard.length>0) {
                    enableFlag=true; 
                    if(line.hazard.toLowerCase().indexOf(jFilter.hazard)<0) flag=false;}

                if(jFilter.code && line.code && jFilter.code.length>0) {
                    enableFlag=true; 
                    if(line.code.toLowerCase().indexOf(jFilter.code)<0) flag=false;}

                if(jFilter.cause && line.cause && jFilter.cause.length>0) {
                    enableFlag=true; 
                    if(line.cause.toLowerCase().indexOf(jFilter.cause)<0) flag=false;}

                if(jFilter.hazardoussituation && line.hazardousSituation && jFilter.hazardoussituation.length>0) {
                    enableFlag=true; // strFilter was completely set to lowercase
                    if(line.hazardousSituation.toLowerCase().indexOf(jFilter.hazardoussituation)<0) flag=false;}

                if(jFilter.harm && line.harm && jFilter.harm.length>0) {
                    enableFlag=true; 
                    if(line.harm.toLowerCase().indexOf(jFilter.harm)<0) flag=false;}

                if(flag) 
                    filteredAris.push(line);
            });
        }
        debug("0826 filterInstance: filtered list for ticket "+ticket+" still has "+filteredAris.length+" risks.")
                
        return filteredAris;
    }

    //fill repository with data from session
    let jTickets=[];
    try { 
        let strTickets=window.sessionStorage.getItem(KN_TICKETS)
        debug("0802 Portal reads tickets as "+strTickets);
        jTickets=JSON.parse(strTickets);
    } catch(err) { debug("0801 Portal failed in KN_TICKETS "+err);}

    let jFiles=[];
    try { 
        let strFiles=window.sessionStorage.getItem(KN_FILES);
        debug("0802 Portal reads files as "+strFiles);
        jFiles=JSON.parse(strFiles);
    } catch(err) { debug("0803 Portal failed in KN_FILES "+err);}

    
    function backTrans(jAris) {
        let result={};
        if(jAris) {
                Object.keys(jAris).forEach((key)=>{
                    try {
                        result[key]=Buffer.from(jAris[key],'base64').toString('utf8')
                   } catch(err) { debug("0752 backTrans["+key+"] base64 decoding failed "+err);}
                })
        }
        return result;
    }

    let fileName="?";
    try { 
        jTickets.forEach((ticket,line)=>{
                debug("0804 Portal retrieves base64 for ("+ticket+")");
                let base64encoded=window.sessionStorage.getItem(ticket);
                let jList=[{"harm":"no data"}];
                let strList = JSON.stringify(jList);
                if(base64encoded && base64encoded.length>SOME) {

                    try {
                        let jRawList=[];
                        strList = Buffer.from(base64encoded,'base64').toString('utf8');
                        try {
                            jRawList=JSON.parse(strList);
                            debug("0806 Portal.update finds strList with length=="+jRawList.length);
                        } catch(err) { debug("0805 Portal parse failed "+err);}
                        
                        // GH20240514 key with number jList = jRawList.map((risk,index)=>((risk.key=index)?risk:risk))
                        jList=jRawList;

                        fileName=jFiles[line];
                    } catch(err) { debug("0807 Portal base64 decoding failed "+err);}

                    // back-translation of attributes that had been encoded by extract.js
                    if(fileName.endsWith('html')) {
                        try {
                            let jTrans=jList.map((jAris)=>(backTrans(jAris)))
                            jList=jTrans;
                        } catch(err) { debug("0807-H Portal HTML decoding failed "+err);}
                    }

                    repository[ticket]=jList;
                    debug("0808-LOOP Portal rebuilds content from "+ticket);
                } else debug("0808-FAIL Portal finds empty base64encoded ticket for "+ticket);
            });
            debug("0808-M Portal rebuilds content from tickets");
    } catch(err) { debug("0809 Portal failed "+err);}

    let arrFileNames=[];
    try {
        arrFileNames=JSON.parse(window.sessionStorage.getItem(KN_FILES))
    } catch(e) {}

    let jListAris = repository[SCR_DOMAIN];
    debug("0810 DOMAIN("+jListAris+") shows "+(jListAris ? Object.keys(jListAris):"empty")+"# of risks.")



// common file data
    function getFile(attribute) {
        if(jFile==null) return ''
        let result= jFile[attribute]
        if(result==null) return ''
        return result;
    }

    function setFileAttribute(comp,value) {
        // onInput handler for edit controls
        let result=JSON.stringify(jFile)
        debug("0780 setFileAttribute ENTER ("+comp+") set value="+result);

        try {
            let jContent=JSON.parse(result)
            jContent[comp]=sanitize(value);
            result=JSON.stringify(jContent);
            setJFile(jContent);
            debug("0780 setFileAttribute LOAD editor="+result);

        } catch(e) { debug("0781 setFileAttribute ("+comp+","+value+") BAD FORMAT "+result); }
    }

    function fPush(arr,elem) {
        if(arr && elem) arr.push(elem);
        return arr;
    }

    
    var currentCID=""
    var currentRisk={}

    return (
        <div  key="top" className="BORDER" onLoad={(e)=>{init(e)} }> 

            <div id='caption' className="KNTABLE" key="infoCaption">
                <div className="KNSEP" key="sepcd">&nbsp;</div><div className="FIELD" key="sepcdf">{getFile('domain')}</div>
                <div className="KNSEP" key="sepcm">&nbsp;</div><div className="FIELD" key="sepcmf">{getFile('manufacturer')}</div>
                <div className="KNSEP" key="sepcp">&nbsp;</div><div className="FIELD" key="sepcpf">{getFile('device')}</div>
                <div className="KNSEP" key="sepcv">&nbsp;</div><div className="FIELD" key="sepcvf">{getFile('version')}</div>
            </div>

            <div id='selector' className="KNTABLE" key="selector">

                <div className="KNSEP" key="sep0">&nbsp;</div>    

                <div id='column1' className={LEARN_DOMAIN ? (focus===FCS_DOMAIN?"DOMCOLOR KNBUTTON":"KNBUTTON"):"NOTABLE"}  key="column1">
                <a href="?view=DOMAIN">DOMAIN</a></div>    
                
                <div id='column2' className={focus===FCS_RISKS?"RISKCOLOR KNBUTTON":"KNBUTTON"}  key="column2">
                <a href="?view=RISKS">RISKS</a></div>

                <div id='column3' className={focus===FCS_FILES?"FILECOLOR KNBUTTON":"KNBUTTON"}  key="column3">
                <a href="?view=FILES">FILES</a></div>
            </div>

            <div id='table0' className={(view===FCS_DOMAIN) && LEARN_DOMAIN ?"KNMAIN":"NOTABLE"}  key="table0">
                <div id='column0' className="KNSEP0"  key="column0">
                    <div id='header0' className="DOMCOLOR KNBUTTON">Component</div> 
                    <div id='header1' className="DOMCOLOR KNBUTTON">Function</div> 
                    <div id='header2' className="DOMCOLOR KNBUTTON">Hazard</div> 
                    <div id='header3' className="DOMCOLOR KNBUTTON">Code</div> 
                    <div id='header4' className="DOMCOLOR KNBUTTON">Cause</div> 
                    <div id='header6' className="DOMCOLOR KNBUTTON">HazardousSituation</div> 
                    <div id='header7' className="DOMCOLOR KNBUTTON">Harm</div> 
                </div></div>

                { (jListAris && view==FCS_DOMAIN) && LEARN_DOMAIN ? (
                    <div id='table1' className={view===FCS_DOMAIN?"KNMAIN":"NOTABLE"} key="table1">

                        <div id='column1' className="DOMCOLOR KNBUTTON"  key="column1">
                        {jListAris.map((aris,line)=>(testComp(aris)?(<div key={"domain1"+line}>&bull;{aris.comp}</div>):""))}
                        </div>

                        <div id='column2' className="DOMCOLOR KNBUTTON"  key="column2">
                        {jListAris.map((aris,line)=>(testFunc(aris)?(<div  key={"domain2"+line}>&bull;{aris.func}</div>):""))}
                        </div>

                        <div id='column3' className="DOMCOLOR KNBUTTON"  key="column3">
                        {jListAris.map((aris,line)=>(testHazd(aris)?(<div key={"domain3"+line}>&bull;{aris.hazard}</div>):""))}
                        </div>

                        <div id='column4' className="DOMCOLOR KNBUTTON"  key="column4">
                        {jListAris.map((aris,line)=>(testCode(aris)?(<div key={"domain4"+line}>&bull;{aris.code}</div>):""))}
                        </div>

                        <div id='column5' className="DOMCOLOR KNBUTTON"  key="column5">
                        {jListAris.map((aris,line)=>(testCaus(aris)?(<div key={"domain5"+line}>&bull;{aris.cause}</div>):""))}
                        </div>

                        <div id='column6' className="DOMCOLOR KNBUTTON"  key="column6">
                        {jListAris.map((aris,line)=>(testSitu(aris)?(<div key={"domain6"+line}>&bull;{aris.hazardousSituation}</div>):""))}
                        </div>

                        <div id='column7' className="DOMCOLOR KNBUTTON"  key="column7">
                        {jListAris.map((aris,line)=>(testHarm(aris)?(<div key={"domain7"+line}>&bull;{aris.harm}</div>):""))}
                        </div>
                    </div>
                ):""}


            { Object.keys(repository).map((ticket,area)=>( 


                (<div key={"workspace"+area} className={
                    (view===FCS_RISKS)&&(ticket===SCR_DOMAIN)||
                    (view===FCS_FILES)&&(ticket!==SCR_DOMAIN)?"":"NOTABLE"}>        

                    
                   <div className="KNTABLE" key={"header"+area}>                                 
                        <div  key={"sep0"+area} className="FLEX RIM" ></div>                            
                        <div className="{ LEARN_DOMAIN ? 'KNLINE NONE' : 'NOTABLE' }"  key={"sep1row"+area}>
                            <div className="NONE"  key={"sep0div"+area}>
                                <div className="FILECOLOR FIELD LTXT">{arrFileNames[area+1]}</div>
                                { (ticket===SCR_DOMAIN) ? "":
                                        (<div className="FILEBACK FIELD BUTTON FONT24" onClick={(e)=>{addDOMAINRisk(ticket,area)}}>&#x21d1;</div>)}
                                </div>
                            </div>

                            <div className="{ LEARN_DOMAIN ? 'KNLINE NONE' : 'NOTABLE' }"  key={"sep2row"+area}>
                                <div className="NONE"  key={"sep0div"+area}>
                                { (ticket===SCR_DOMAIN) ? "":
                                        (<div className="FILEBACK FIELD BUTTON FONT24" onClick={(e)=>{compare(ticket,area);}}>Compare</div>)}
                            </div>
                        </div>


                    <div className="KNLINE NONE">
                            {portalLine( (area==0)?'RISKCOLOR':'FILECOLOR', 'Component','Function','Hazard','Code','Cause','HazardousSituation','Harm')}
                    </div>


                    
                    { (mode>MODE_EDIT) ?  // also check if (mode==0) for EDITOR &&(focus===FCS_DOMAIN) for DOMAIN view 
                        filterLine('filter', (area==0)?'RISKCOLOR':'FILECOLOR', "KNLINE BRIGHT",
                            (e)=>(filterARIS("comp",e.target.value)),
                            (e)=>(filterARIS("func",e.target.value)),
                            (e)=>(filterARIS("hazard",e.target.value)),
                            (e)=>(filterARIS("code",e.target.value)),
                            (e)=>(filterARIS("cause",e.target.value)),
                            (e)=>(filterARIS("hazardousSituation",e.target.value)),
                            (e)=>(filterARIS("harm",e.target.value))
                    ):""}
                    

                    { (ticket===SCR_DOMAIN)&&(mode==MODE_EDIT) ?  // also check if (mode==0) for EDITOR &&(focus===FCS_DOMAIN) for DOMAIN view
                        editLine('editor',"KNLINE RISKEDIT",editStop):""}


                    { (ticket===SCR_DOMAIN) ? 
                        fLoadRiskInfo(fPush(filterInstance(ticket,area),EMPTY_ARIS)).map((aris,line)=>( 
                            (<div className="KNLINE NONE" key={"domainrisk"+area+line} onLoad={()=>editRiskStart()}>
                                {(currentCID===aris.corID) ?  "" :   (<div className={currentCID.length>0 ? "KNLINE NONE":"NOTABLE"} key={"CORID"+aris.corID} corid={currentCID}>                                    
                                        <div className="RISKCOLOR FIELD DATE">Risk Target:</div>
                                        <input id={"TGT"+currentCID} type="edit" className="RISKCOLOR NOTE DATE" onChange={(e)=>(editRisk(e.target))} defaultValue={getRiskField("TGT",currentCID)} tag="TGT" />
                                        <div className="RISKCOLOR FIELD DATE">Initial SLA</div>
                                        <input id={"URS"+currentCID} type="edit" className="RISKCOLOR NOTE DATE" onChange={(e)=>(editRisk(e.target))} defaultValue={getRiskField("URS",currentCID)} tag="URS"/>
                                        <input id={"URL"+currentCID} type="edit" className="RISKCOLOR NOTE DATE" onChange={(e)=>(editRisk(e.target))} defaultValue={getRiskField("URL",currentCID)} tag="URL"/>
                                        <input id={"URA"+currentCID} type="edit" className="RISKCOLOR NOTE DATE" onChange={(e)=>(editRisk(e.target))} defaultValue={getRiskField("URA",currentCID)} tag="URA"/>
                                        <div className="RISKCOLOR FIELD DATE"></div>
                                        <div className="RISKCOLOR FIELD DATE">Residual SLA</div>
                                        <input id={"MRS"+currentCID} type="edit" className="RISKCOLOR NOTE DATE" onChange={(e)=>(editRisk(e.target))} defaultValue={getRiskField("MRS",currentCID)} tag="MRS"/>
                                        <input id={"MRL"+currentCID} type="edit" className="RISKCOLOR NOTE DATE" onChange={(e)=>(editRisk(e.target))} defaultValue={getRiskField("MRL",currentCID)} tag="MRL"/>
                                        <input id={"MRA"+currentCID} type="edit" className="RISKCOLOR NOTE DATE" onChange={(e)=>(editRisk(e.target))} defaultValue={getRiskField("MRA",currentCID)} tag="MRA"/>
                                        <div className="RISKCOLOR FIELD SEP"></div>
                                        <div className="FIELD NOTE DASH" onClick={(e)=>riskEditStop(e.target)}>OK</div>
                                        <div className="RISKCOLOR NOTABLE TRASH">{ (currentCID=aris.corID) + JSON.stringify(currentRisk=getRisk(currentCID)) }</div>
                                    </div>) }
                                {portalLine( "RISKCOLOR",
                                    aris.comp,
                                    aris.func,
                                    aris.hazard,
                                    aris.code,
                                    aris.cause,
                                    aris.hazardousSituation,
                                    aris.harm,
                                    aris.corID,
                                    ()=>{removeLine(line)},                                    
                                    ()=>{editStart(line)}
                                    )} 
                            </div>)))
                        :
                        filterInstance(ticket,area).map((aris,line)=>( 
                            (<div className="KNLINE NONE" key={"filerisk"+area+line}>    
                                {portalLine( "FILECOLOR",
                                    aris.comp,
                                    aris.func,
                                    aris.hazard,
                                    aris.code,
                                    aris.cause,
                                    aris.hazardousSituation,
                                    aris.harm
                                    )}
                            </div>)))
                        }
                    </div>
                </div>)
            ))}


            { (focus===FCS_FILES) ? // show drag-n-drop landing zone only for FILES
            (<div className="KNLINE NONE" key="landingzoneline">        
                <div key="buttonbox">

                    {/* SET DIRECTORY Button */}
                    <button key="FOLDER" className="FILEBOX">set Directory &nbsp;&nbsp;
                        <input key="hidden" className="HIDE"></input>
                        <input type="edit" value={getFile('clientDir')} onInput={e => setFileAttribute('clientDir',e.target.value)}  id="clientDir" key="clientDir"></input>
                    </button>          


                    {/* STORE Button */}
                    <button key="JSON" className="FILEBOX" onClick={(() => { return handleStore(jFile.clientDir+'/'+jFile.domainFile);})}>Store on client &nbsp;&nbsp;
                        <input key="hidden" className="HIDE"></input>
                        <input type="edit" value={getFile('domainFile')} onInput={e => setFileAttribute('domainFile',e.target.value)}  id="jsonFile" key="jsonFile"></input>
                    </button>          
                   

                    {/* GET HBOOK Button */}
                    <button key="HBook" className="FILEBOX" onClick={(()=>{ handleHBook(jFile.clientDir+'/'+jFile.hBook+'.xlsx')})} >Get HBook &nbsp;&nbsp;
                        <input key="hidden" className="HIDE"></input>
                        <input type="edit" value={getFile('hBook')} onInput={e => setFileAttribute('hBook',e.target.value)}  id="xlsxFile" key="xlsxFile"></input>
                    </button>          
                </div>    


                <div id='mainPage' className="KNTABLE"  key="landingzonetable">
                    <div className="BIGCELL"  key="landingzonecell">
                        <div  key="landingzonebox" className="FLEX DROP" onDragOver={dragOverHandler} onDrop={(e)=>{dropHandler(e,addFileTicket,addRiskTicket,showLetter,getFile('clientDir'))}} >ADD FILE</div>                                                        
                    </div>            
                </div>                            
            </div>
            ):
                <div id='mainPage' className="KNTABLE"  key="landingzonetable">
                <div className="BIGCELL"  key="landingzonecell">
                    <div  key="landingzonebox" className="FLEX DROP" onDragOver={dragOverHandler} onDrop={(e)=>{dropHandler(e,addFileTicket,addRiskTicket,showLetter,getFile('clientDir'))}} >ADD RISK</div>                                                        
                </div>            
            </div>}


            { (focus!==FCS_FILES) ? // show SAVE buttons for DOMAIN / RISKS
            (<div className="KNTABLE" key="buttonCaption">      
                <div key="buttonbox">
                    <div className="FIELD MOAM" key="buttons"></div>




                    {
                    /* ONLY in DOMAIN mode: UPDATE = SAVE To DOMAIN Button */
                    (LEARN_DOMAIN && focus==FCS_DOMAIN) ?
                        (<div>
                        <button key="Archive" className="RISKBACK BUTTON" onClick={(() => { return updateDomain(repository[SCR_DOMAIN],getFile('domain'));})}>Update domain
                            <input key="hidden" className="HIDE"></input>
                        </button>          
                        &nbsp;&nbsp;
                        </div>
                    ):''
                    }

                    &nbsp;&nbsp;

                    { (focus==FCS_RISKS) ?
                    (
                    <div>
                        <button key="Download" id={KN_DOWNLOAD} className="RISKBACK WIDEBUTTON" >
                            <div key="button"  
                                onClick={(() => { return makeRiskTable(KN_DOWNLOAD,repository[SCR_DOMAIN],getFile('manufacturer'),getFile('project'),getFile('version')) })}  >
                                    Get risk table for 
                            </div>
                            <input type="edit" defaultValue={getFile('device')} onInput={e => setFileAttribute('project',e.target.value)}  id="projectRSK" key="projectRSK"></input>                                                                        
                        </button>                                
                          
                        <button key="DHazards" id={KN_DHAZARDS} className="RISKBACK WIDEBUTTON" >
                            <div key="button" 
                                onClick={(() => { return makeDomainJSON(KN_DHAZARDS,repository[SCR_DOMAIN],getFile('manufacturer'),getFile('project'),getFile('version')) })}  >
                                    Get domain hazards
                            </div>
                            <input type="edit" defaultValue={getFile('device')} onInput={e => setFileAttribute('project',e.target.value)}  id="projectDOM" key="projectDOM"></input>                                                                        
                        </button>                                

                        <button key="Internal" id={KN_INTERNAL} className="RISKBACK WIDEBUTTON" >
                            <div key="button" 
                                onClick={(() => { return makeInternalFile(repository[SCR_COR],KN_INTERNAL,repository[SCR_DOMAIN],getFile('manufacturer'),getFile('project'),getFile('version')) })}  >
                                    Get Internal File for 
                            </div>
                            <input type="edit" defaultValue={getFile('device')} onInput={e => setFileAttribute('project',e.target.value)}  id="projectINT" key="projectINT"></input>                                                                        
                        </button>          
                         
                        <button key="Export" id={KN_EXPORT} className="RISKBACK WIDEBUTTON" >
                            <div key="button" 
                                onClick={(() => { return makeExportFile(repository[SCR_COR],KN_EXPORT,repository[SCR_DOMAIN],getFile('manufacturer'),getFile('project'),getFile('version')) })}  >
                                    Export VDE File for 
                            </div>
                            <input type="edit" defaultValue={getFile('device')} onInput={e => setFileAttribute('project',e.target.value)}  id="projectEXP" key="projectEXP"></input>                                                                        
                        </button>          
                     </div>
                    ):''
                    }


                    &nbsp;                   
                </div>    
            </div>
            ):""}

        </div>
    )
}


