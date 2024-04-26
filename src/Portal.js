import { Buffer } from 'buffer';
import { dragOverHandler, dropHandler, handleArchive, load, makeRiskTable, receiveLetter, showLetter, SOME, strSymbol,symbol } from './util.js'
import { useState } from 'react';


const KN_DOWNLOAD="KN_DOWNLOAD" // DOM button id

const SCR_DOMAIN = "DOMAIN" // ticket name

const MODE_EDIT = 0;
const MODE_SAVE = 1;

const FCS_DOMAIN = "DOMAIN"
const FCS_RISKS  = "RISKS"
const FCS_FILES  = "FILES"

const KN_TICKETS="KN_TICKETS"
const KN_FILES = "KN_FILES"

// envelope is a container for a message queue
// ticket identifies letter
// letter.innerHTML is base64 form of a fixed content collection
// message is any new ticket

const T_DOMAIN = '["DOMAIN"]';


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
    store(SCR_DOMAIN,JSON.parse("[]"));
}


// repository mirrors the json-lists stored in sessionStorage for the domain and also for all files
let repository={};
let repFiles=[];


function store(ticket,arrList)  {
    try {
        console.log("make712 STORE searches "+ticket);
        repository[ticket]=arrList;
        try {
            console.log("0714 STORE finds repository on keys list="+JSON.stringify(Object.keys(arrList)));
            
            let strList = JSON.stringify(arrList);
            console.log("0716 STORE key list="+strList);
            try {
                let b64encoded= Buffer.from(strList,"utf8").toString('base64');
                console.log("0718 STORE keys in base64="+b64encoded);
                window.sessionStorage.setItem(ticket,b64encoded);
            } catch(err) {console.log("715 STORE "+ticket+" ->"+err)}
        } catch(err) {console.log("713 STORE "+ticket+" ->"+err)}
    } catch(err) {console.log("711 STORE "+ticket+" ->"+err)}
}


function addProjAris(jAris,strMessage) {
    let jListAris = [];
    if(Array.isArray(jAris)) jAris.forEach((jElement, i)=>{addProjAris(jElement,"#"+i+" "+strMessage)})
    else {
        if(jAris) {
            if(jAris.hazard) {
                let jListAris = repository[SCR_DOMAIN];
                console.log("0892 addProjAris ENTER element for hazard="+jAris.hazard);
        
                jListAris.push(jAris);
                console.log("0894 addProjAris stored with remaining "+jListAris.length+" entries.");        

                store(SCR_DOMAIN,jListAris);

            } else console.log("0895 addProjAris "+strMessage+" INVALID:"+JSON.stringify(jAris));

            console.log("0896 addProjAris EXIT "+strMessage+" ="+JSON.stringify(jListAris));
        }
        else console.log("0891 addProjAris "+strMessage+" EMPTY");
    }
}



export function Portal({portalFileName, view}) {

    // filters and display/edit mode
    const [strFilter, setStrFilter] = useState("{}") // filter form buffer
    const [jEditor, setJEditor] = useState({}) // editor form buffer
    const [jFile, setJFile] = useState(
            {'project':'product',
            'clientDir':process.env.REACT_APP_CLIENT_DIR,
            'manufacturer':process.env.REACT_APP_MANUFACTURER,
            'domain':process.env.REACT_APP_DOMAIN}) // common file data buffer
    const [mode, setMode ] = useState(MODE_SAVE);
    
    init();

    // DOMAIN view - if no params are given
    // http://localhost:3000/public
    let focus=FCS_DOMAIN;


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
        letter.setAttribute('id',ticket)
        letter.setAttribute('key',fileName)
        envelope.appendChild(letter)
        console.log("addFileTicket "+ticket)

//         load(FCS_FILES);

        setMode(mode+1) // trigger redraw
        return ticket
    }


// DOMAIN display as SETs
    let setComp = {};
    let setFunc = {};
    let setHazd = {};
    let setCaus = {};
    let setCode = {};
    let setSitu = {};
    let setHarm = {};
    
    function testComp(e) { console.log("0720 "+JSON.stringify(setComp)); if(setComp[e.comp]) return false;               return setComp[e.comp]=1;}
    function testFunc(e) { console.log("0722 "+JSON.stringify(setFunc)); if(setFunc[e.func]) return false;               return setFunc[e.func]=1;}
    function testHazd(e) { console.log("0724 "+JSON.stringify(setHazd)); if(setHazd[e.hazard]) return false;             return setHazd[e.hazard]=1;}
    function testCaus(e) { console.log("0726 "+JSON.stringify(setCaus)); if(setCaus[e.cause]) return false;              return setCaus[e.cause]=1;}
    function testCode(e) { console.log("0728 "+JSON.stringify(setCode)); if(setCode[e.code]) return false;               return setCode[e.code]=1;}
    function testSitu(e) { console.log("0730 "+JSON.stringify(setSitu)); if(setSitu[e.hazardousSituation]) return false; return setSitu[e.hazardousSituation]=1;}
    function testHarm(e) { console.log("0732 "+JSON.stringify(setHarm)); if(setHarm[e.harm]) return false;               return setHarm[e.harm]=1;}




    function addDOMAINRisk(ticket,area) {
        // add risk to DOMAIN list    
        console.log("0880 Portal.addDOMAINRisk "+ticket+ "  "+area); 

        let jRawList=filterInstance(ticket,area);

        try {
            console.log("0882 Portal.addDOMAINRisk to transfer filtered FILE risks "+JSON.stringify(jRawList)+" risks.");
            let arrDomain=[];
            try {
                let base64Domain=window.sessionStorage.getItem(SCR_DOMAIN);
                if(base64Domain && base64Domain.length>SOME) {
                    let strDomain = Buffer.from(base64Domain,'base64').toString('utf8');
                    arrDomain=JSON.parse(strDomain);
                }
                console.log("0884 Portal.addDOMAINRisk already in DOMAIN="+JSON.stringify(arrDomain)); 
                
                try { 
                    jRawList.forEach((aris)=>{arrDomain.push(aris)});

                    let strTransfer=JSON.stringify(arrDomain);
                    console.log("0886 Portal.addDOMAINRisk new DOMAIN risks="+strTransfer);

                    let transfer64 = Buffer.from(strTransfer,'utf8').toString('base64');
                    window.sessionStorage.setItem(SCR_DOMAIN,transfer64);

                    setMode(mode+1); // trigger redraw

                } catch(err) { console.log("0881 Portal.addDOMAINRisk DOMAIN push failed "+err);}
            } catch(err) { console.log("0883 Portal.addDOMAINRisk DOMAIN decoding/parsing failed "+err);} 
        } catch(err) { console.log("0885 Portal.addDOMAINRisk new risk parsing failed "+err);}

        return ticket;
    }

    console.log("0800 Portal for "+focus);

    function update() {        
        let message=receiveLetter();
        if(message && message.ticket.length>SOME) {
            console.log("0812 Portal.update: new message.ticket "+message.ticket);  
            let base64encoded=message.content;
            if(base64encoded && base64encoded.length>SOME) {
                console.log("0812 Portal.update checks letter from message.content ["+base64encoded+"]");

                let strTickets = window.sessionStorage.getItem(KN_TICKETS);
                if(!strTickets || strTickets.length<SOME) { 
                    strTickets='[]';
                    console.log("0814 Portal.update finds no strTickets "+strTickets);
                } else {
                    console.log("0814 Portal.update finds strTickets "+strTickets);
                }

                try {                    
                    let jTickets= JSON.parse(strTickets);         
                    jTickets.push(message.ticket);
                    window.sessionStorage.setItem(KN_TICKETS, JSON.stringify(jTickets));
                    console.log("0812 Portal.update sessionStorage with ticket");

                    window.sessionStorage.setItem(message.ticket,base64encoded);
                    console.log("0816 Portal.update sessionStorage with content");

                    let strFiles = window.sessionStorage.getItem(KN_FILES);
                    repFiles= JSON.parse(strFiles);         
                    repFiles.push(message.fileName);                    
                    strFiles=JSON.stringify(repFiles);
                    window.sessionStorage.setItem(KN_FILES,strFiles);
                    console.log("0818 Portal.update sessionStorage with file names "+strFiles);

                    setMode(mode+1) // notify parent for re-paint
      
                } catch(e) { console.log("0815 Cannot parse JSON"); }
            } else console.log("0813 Portal.update gets empty content.");
        }        
    }

    update();


    /* security */
    console.log("0704 Portal finds env with "+Object.keys(process.env).map((key)=>(key+'->'+process.env[key])))
    

    function portalLine(color,comp,func,hazard,code,cause,hazardousSituation,harm,removeLine,editStart,clickH) {
        // line for a DOMAIN-related ARIS: no drag, but edit,delete,copy
        return (
            <div className="KNLINE NONE"  onClick={clickH} key="workbench">                                     
                <div className={color+" FIELD TRASH"} key="sep">&nbsp;</div>
                <div className={color+" FIELD NAME"} key="com">{comp}</div>
                <div className={color+" FIELD NAME"} key="fun">{func}</div>
                <div className={color+" FIELD NAME"} key="haz">{hazard}</div>
                <div className={color+" FIELD NAME"} key="cod">{code}</div>
                <div className={color+" FIELD NAME"} key="cau">{cause}</div>
                <div className={color+" FIELD NAME"} key="hsi">{hazardousSituation}</div>
                <div className={color+" FIELD NAME"} key="har">{harm}</div>
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
        console.log("0774 editStart ENTER element at index="+index)
        let jContent = jListAris[index]
        setJEditor(jContent)

        setMode(MODE_EDIT)
        console.log("0774 editStart BEGIN EDITING for editing element ="+JSON.stringify(jContent))
    }

    function getEditor(attribute) {
        if(jEditor==null) return ''
        let result= jEditor[attribute]
        if(result==null) return ''
        return result;
    }

    function setEditInput(comp,value) {
        // onInput handler for edit controls
        let result=JSON.stringify(jEditor)
        console.log("0780 setEditInput ENTER ("+comp+") set value="+result);

        try {
            let jContent=JSON.parse(result)
            jContent[comp]=value;
            result=JSON.stringify(jContent);
            setJEditor(jContent);
            console.log("0780 setEditInput LOAD editor="+result);

        } catch(e) { console.log("0781 editStart ("+comp+","+value+") BAD FORMAT "+result); }
    }


    function editStop() {
        // copy all edit content into the special editorLine instance
        console.log("0782 editStop EDITOR="+JSON.stringify(jEditor));
        try {
            
            let jListAris = repository[SCR_DOMAIN];
            jListAris.push(jEditor);
            
            store(SCR_DOMAIN,jListAris);

            setMode(MODE_SAVE);

            console.log("0782 editStop STORE "+JSON.stringify(jEditor));

        } catch(e) { console.log("0783 editStop BAD FORMAT "+JSON.stringify(jEditor)); }
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
        console.log("0770 removeLine ENTER remove element at index="+index);        
        if(index>=0)  jListAris.splice(index,1);
        store(SCR_DOMAIN,jListAris);
        console.log("0770 removeLine EXIT with remaining "+jListAris.length+" entries.");        
    }
    
    function filterARIS(tag,value) {
        let pattern=JSON.parse(strFilter);
        pattern[tag]=value;
        let filter=JSON.stringify(pattern);
        setStrFilter(filter);
        console.log("0776 filterARIS:"+filter)    
    }

    function filterInstance(ticket,area) {
        console.log("0820 filterInstance for ticket "+ticket+" entered.")
        let arrInstance=repository[ticket];
        let filteredAris=[];
        let enableFlag=false ;
        if(arrInstance) 
            console.log("0822 filterInstance using filter "+strFilter)
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
        console.log("0826 filterInstance: filtered list for ticket "+ticket+" still has "+filteredAris.length+" risks.")
                
        return filteredAris;
    }

    //fill repository with data from session
    let jTickets=[];
    try { 
        let strTickets=window.sessionStorage.getItem(KN_TICKETS)
        console.log("0802 Portal reads tickets as "+strTickets);
        jTickets=JSON.parse(strTickets);
    } catch(err) { console.log("0801 Portal failed in KN_TICKETS "+err);}

    let jFiles=[];
    try { 
        let strFiles=window.sessionStorage.getItem(KN_FILES);
        console.log("0802 Portal reads files as "+strFiles);
        jFiles=JSON.parse(strFiles);
    } catch(err) { console.log("0803 Portal failed in KN_FILES "+err);}

    function backTrans(jAris) {
        let result={};
        if(jAris) {
                Object.keys(jAris).forEach((key)=>{
                    try {
                        result[key]=Buffer.from(jAris[key],'base64').toString('utf8')
                   } catch(err) { console.log("0752 backTrans["+key+"] base64 decoding failed "+err);}
                })
        }
        return result;
    }

    let fileName="?";
    try { 
        jTickets.forEach((ticket,line)=>{
                console.log("0804 Portal retrieves base64 for ("+ticket+")");
                let base64encoded=window.sessionStorage.getItem(ticket);
                let jList=[{"harm":"no data"}];
                let strList = JSON.stringify(jList);
                if(base64encoded && base64encoded.length>SOME) {

                    try {
                        let jRawList=[];
                        strList = Buffer.from(base64encoded,'base64').toString('utf8');
                        try {
                            jRawList=JSON.parse(strList);
                            console.log("0806 Portal.update finds strList with length=="+jRawList.length);
                        } catch(err) { console.log("0805 Portal parse failed "+err);}
                        jList = jRawList.map((risk,index)=>((risk.key=index)?risk:risk))
                        fileName=jFiles[line];
                    } catch(err) { console.log("0807 Portal base64 decoding failed "+err);}

                    // back-translation of attributes that had been encoded by extract.js
                    if(fileName.endsWith('html')) {
                        try {
                            let jTrans=jList.map((jAris)=>(backTrans(jAris)))
                            jList=jTrans;
                        } catch(err) { console.log("0807-H Portal HTML decoding failed "+err);}
                    }

                    repository[ticket]=jList;
                    console.log("0808-LOOP Portal rebuilds content from "+ticket);
                } else console.log("0808-FAIL Portal finds empty base64encoded ticket");
            });
            console.log("0808-M Portal rebuilds content from tickets");
    } catch(err) { console.log("0809 Portal failed "+err);}

    let arrFileNames=[];
    try {
        arrFileNames=JSON.parse(window.sessionStorage.getItem(KN_FILES))
    } catch(e) {}

    let jListAris = repository[SCR_DOMAIN];
    console.log("0810 DOMAIN shows "+(jListAris ? Object.keys(jListAris):"empty")+"# of risks.")



// common file data
    function getFile(attribute) {
        if(jFile==null) return ''
        let result= jFile[attribute]
        if(result==null) return ''
        return result;
    }

    function setFileInput(comp,value) {
        // onInput handler for edit controls
        let result=JSON.stringify(jFile)
        console.log("0780 setFileInput ENTER ("+comp+") set value="+result);

        try {
            let jContent=JSON.parse(result)
            jContent[comp]=sanitize(value);
            result=JSON.stringify(jContent);
            setJFile(jContent);
            console.log("0780 setFileInput LOAD editor="+result);

        } catch(e) { console.log("0781 setFileInput ("+comp+","+value+") BAD FORMAT "+result); }
    }
/*
DROPZONE=#CED1D3
FILES=#77825E

BUTTONS=#B8C690
RISKS=#333A2D
DOMAIN=#0D0E12

*/
    return (
        <div  key="top" className="BORDER" onLoad={(e)=>{init(e)} }> 

            <div id='caption' className="KNTABLE" key="caption">
            <div className="KNSEP" key="sepcm">&nbsp;</div><div className="FIELD" key="sepcmf">{getFile('manufacturer')}</div>
                <div className="KNSEP" key="sepcd">&nbsp;</div><div className="FIELD" key="sepcdf">{getFile('domain')}</div>
            </div>

            <div id='selector' className="KNTABLE" key="selector">

                <div className="KNSEP" key="sep0">&nbsp;</div>    

                <div id='column1' className={focus===FCS_DOMAIN?"DOMCOLOR KNBUTTON":"KNBUTTON"}  key="column1">
                <a href="?view=DOMAIN">DOMAIN</a></div>    
                
                <div id='column2' className={focus===FCS_RISKS?"RISKCOLOR KNBUTTON":"KNBUTTON"}  key="column2">
                <a href="?view=RISKS">RISKS</a></div>

                <div id='column3' className={focus===FCS_FILES?"FILECOLOR KNBUTTON":"KNBUTTON"}  key="column3">
                <a href="?view=FILES">FILES</a></div>
            </div>

            <div id='table0' className={view===FCS_DOMAIN?"KNMAIN":"NOTABLE"}  key="table0">
                <div id='column0' className="KNSEP0"  key="column0">
                    <div id='header0' className="DOMCOLOR KNBUTTON">Component</div> 
                    <div id='header1' className="DOMCOLOR KNBUTTON">Function</div> 
                    <div id='header2' className="DOMCOLOR KNBUTTON">Hazard</div> 
                    <div id='header3' className="DOMCOLOR KNBUTTON">Code</div> 
                    <div id='header4' className="DOMCOLOR KNBUTTON">Cause</div> 
                    <div id='header6' className="DOMCOLOR KNBUTTON">HazardousSituation</div> 
                    <div id='header7' className="DOMCOLOR KNBUTTON">Harm</div> 
                </div></div>

                { (jListAris && view==FCS_DOMAIN) ? (
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
                        <div className="KNLINE NONE"  key={"sep1row"+area}>
                            <div className="KNLINE"  key={"sep0div"+area}>
                            <div className="FILECOLOR FIELD LTXT">{arrFileNames[area]}</div>
                            { (ticket===SCR_DOMAIN) ? "":
                                (<div className="FILEBACK FIELD BUTTON FONT24" onClick={(e)=>{addDOMAINRisk(ticket,area)}}>&#x21d1;</div>)}
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
                        filterInstance(ticket,area).map((aris,line)=>( 
                            (<div className="KNLINE NONE" key={"domainrisk"+area+line}>    
                                {portalLine( "RISKCOLOR",
                                    aris.comp,
                                    aris.func,
                                    aris.hazard,
                                    aris.code,
                                    aris.cause,
                                    aris.hazardousSituation,
                                    aris.harm,
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


            { (focus===FCS_FILES) ? // show drag-n-dop landing zone only for FILES
            (<div className="KNLINE NONE" key="landingzoneline">        
                <div className="FIELD" key="buttonbox">
                    <div className="FIELD MOAM" key="buttons"></div>
                    {/* LOAD HBOOK Button onClick={(() => { return handleHBook();})} */}
                    
                    <button key="HBook" className="FILEBOX" >Upload from&nbsp;&nbsp;
                        <input key="hidden" className="HIDE"></input>
                        <input type="edit" value={getFile('clientDir')} onInput={e => setFileInput('clientDir',e.target.value)}  id="clientDir" key="clientDir"></input>
                    </button>          
                    &nbsp;&nbsp;
                </div>    
                <div id='mainPage' className="KNTABLE"  key="landingzonetable">
                    <div className="BIGCELL"  key="landingzonecell">
                        <div  key="landingzonebox" className="FLEX DROP" onDragOver={dragOverHandler} onDrop={(e)=>{dropHandler(e,addFileTicket,addProjAris,showLetter,getFile('clientDir'))}} >ADD FILE</div>                                                        
                    </div>            
                </div>                            
            </div>
            ):""}


            { (focus!==FCS_FILES) ? // show SAVE buttons for DOMAIN / RISKS
            (<div className="KNTABLE" key="captionDOM">      
                <div className="FIELD" key="buttonbox">
                    <div className="FIELD MOAM" key="buttons"></div>
                    {/* SAVE Button */}
                    <button key="Archive" className="RISKBACK BUTTON" onClick={(() => { return handleArchive(repository[SCR_DOMAIN],getFile('domain'));})}>Save as archive file
                        <input key="hidden" className="HIDE"></input>
                    </button>          
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <button key="Export" id={KN_DOWNLOAD} className="RISKBACK BUTTON" >
                        <div key="button" className="FIELD" 
                            onClick={(() => { return makeRiskTable(KN_DOWNLOAD,repository[SCR_DOMAIN],getFile('manufacturer'),getFile('project')) })}  >
                                Export as Risk Table for 
                        </div>
                        <input type="edit" value={getFile('project')} onInput={e => setFileInput('project',e.target.value)}  id="project" key="project"></input>
                    </button>          
                    &nbsp;                   
                </div>    
            </div>
            ):""}

        </div>
    )
}


