// generates VDE SPEC 90025 Export File format from json risk file 

// VERSION 20240220 v7b with 
// v4 IMDRF AET codes and DomainSpecificHazard,AnalyzedRisk with HazSit and Harm
// v5 multiple DomainSpecificHazards per AnalyzedRisk
// v6 ResidualRiskLevel part of ControlledRisk
// v7 aligned with global riskman ontology
// v8 multiplicity only with typeof (instances), unique id attribute

// CHECK ?? 'signature' needs to switch on all elements "display:block" to ensure repeatable SHA-256 digest

const PREFIX_RISKMAN = 'riskman: https://w3id.org/riskman/ontology#';

const DELIM = ';';

const TAG_CONTENT = 'Content';
const TAG_DEVICE  = 'Device';
const TAG_ENVELOPE ='Envelope';


// --------------- LINK to device repository
const URI_DEVICE = 'http://medical-device-manufacturer.com';


// --------------- LINK to conceptual model in RDF/A


// v4
// typeof
const RISKMAN_HAZARD    = 'riskman:Hazard';
const RISKMAN_TARGET    = 'riskman:Target';
const RISKMAN_DOSH      = 'riskman:DomainSpecificHazard';
const RISKMAN_RISKLEVEL = 'riskman:RiskLevel';
const RISKMAN_ARI       = 'riskman:AnalyzedRisk';
const RISKMAN_RESI      = 'riskman:ResidualRiskLevel';
const RISKMAN_CORI      = 'riskman:ControlledRisk';
const RISKMAN_RISK_SDA  = 'riskman:RiskSDA';
const RISKMAN_SDA       = 'riskman:SDA';
const RISKMAN_IMPL      = 'riskman:ImplementationManifest';

// property
const RISKMAN_HASCOMPONENT = 'riskman:hasDeviceComponent';
const RISKMAN_HASFUNCTION  = 'riskman:hasDeviceFunction';
const RISKMAN_HASHARM      = 'riskman:hasHarm';
const RISKMAN_HASHAZARD    = 'riskman:hasHazard';
const RISKMAN_HASHAZSIT    = 'riskman:hasHazardousSituation';
const RISKMAN_HASPRERISK   = 'riskman:hasInitialRiskLevel';
const RISKMAN_HASRESI      = 'riskman:hasResidualRiskLevel';
const RISKMAN_HASTARGET    = 'riskman:hasTarget';
const RISKMAN_HAS_DOSH     = 'riskman:hasDomainSpecificHazard';
const RISKMAN_HAS_ARIS     = 'riskman:hasAnalyzedRisk'; 
const RISKMAN_HAS_SDA      = 'riskman:hasSDA';
const RISKMAN_HAS_SUB_SDA  = 'riskman:hasSubSDA';
const RISKMAN_HAS_IMPL     = 'riskman:hasImplementationManifest';

const RISKMAN_ID         = 'riskman:id';
const RISKMAN_NAME       = 'riskman:name';
const RISKMAN_SEVERITY   = 'riskman:hasSeverity';
const RISKMAN_PROBABILITY= 'riskman:hasProbability';
const RISKMAN_TEXT       = 'riskman:text';
const RISKMAN_CODE       = 'riskman:code';
const RISKMAN_EXTERNAL   = 'riskman:external';
const RISKMAN_PROOF      = 'riskman:proof';

const RISKMAN_PROBLEM    = 'riskman:problem';
const RISKMAN_CAUSE      = 'riskman:cause';
const RISKMAN_GOAL       = 'riskman:goal';


var jRiskFile = {};

var tables='Terms';

var filename=null;
const prefix = 'CRAFTS-MD from ';

var iCon=0;
function nextCon() { return ++iCon; }

var iCom=0;
function nextCom() { return ++iCom; }

var iFun=0;
function nextFun() { return ++iFun; }

var iHrm=0;
function nextHrm() { return ++iHrm; }

var iHaz=0;
function nextHaz() { return ++iHaz; }

var iHas=0;
function nextHas() { return ++iHas; }

var iGen=0;
function nextGen() { return ++iGen; }

var iDSH=0;
function nextDSH() { return ++iDSH; }

var iRIT=0;
function nextRIT() { return ++iRIT; }

var iRsk=0;
function nextRsk() { return ++iRsk; }

var iSDA=0;
function nextSDA() { return ++iSDA; }

var iASU=0;
function nextASU() { return ++iASU; }


function init() { 
  // init counters and read control values

  iCon=0; 
  iCom=0; 
  iFun=0; 
  iHrm=0; 
  iHaz=0; 
  iHas=0; 
  iGen=0; 
  iDSH=0; 
  iRIT=0; 
  iSDA=0; 
  
  let ctlXComp = document.getElementById('exComp');  xComp=ctlXComp?ctlXComp.checked:null;
  let ctlXFunc = document.getElementById('exComp');  xFunc=ctlXFunc?ctlXFunc.checked:null;
  let ctlXCaus = document.getElementById('exCaus');  xCaus=ctlXCaus?ctlXCaus.checked:null;
  let ctlXHaSi = document.getElementById('exHaSi');  xHaSi=ctlXHaSi?ctlXHaSi.checked:null;
  let ctlXHKey = document.getElementById('exHKey');  xHKey=ctlXHKey?ctlXHKey.checked:null;
  let ctlXHarm = document.getElementById('exHarm');  xHarm=ctlXHarm?ctlXHarm.checked:null;


  console.log("DRAGGABLE INFO FOR HAZARD and "
      +(xComp?"Comp ":" ")
      +(xFunc?"Func ":" ")
      +(xCaus?"Caus ":" ")
      +(xHaSi?"HaSi ":" ")
      +(xHKey?"HKey ":" ")
      +(xHarm?"Harm ":" "));

}



function findByKey(list,key,name) {
  let result=null;
  if(list && key && name) list.forEach((item)=>{if(item && item[key] && item[key]==name) result=item;})
  return result;
}

// OLD id from Internal file jRIT.refCOR compared to OLD id from Internal file
function findDSH(jRiskFile,id) {
  let dsh=findByKey(getAllRisks(jRiskFile),'id',id);
  return dsh?dsh:{'id':id, 'refHazard':'Hazard' };
}

function splitLines(str) { 
  // FUNCTION
  // split according to LF,CR
  let flat = str.replace(/(\n|\r)/g,'$');
  while(flat.includes('$$')) flat = flat.replace('$$','$');
  return flat.replace('$$','$').split('$');
}

function sName(str) {
	 let temp = str.trim().split(' ')[0];
	 return temp.replace(/[^a-z]/gi,'x');
}

function getDate() { var d = new Date();
  return d.getFullYear()+('0'+(1+d.getMonth())).slice(-2)+('0'+d.getDay()).slice(-2)+'T'+d.getHours();
}
//--------------- startup


let xComp=null;
let xFunc=null;
let xCaus=null;
let xHaSi=null;
let xHKey=null;
let xHarm=null;


function start() {


  document.getElementById('filechoice').addEventListener('change', function () {
    var fr = new FileReader();
	  csvLines=[];
    fr.onload = function () {
        init();
        
        let strRiskFile = splitLines(this.result+' \n').join('');
        console.log('RISK FILE CONTENT as a string');
        console.log();
        //console.log(strRiskFile);

        let jRiskFile = JSON.parse(strRiskFile);
        console.log('RISK FILE CONTENT from JSON');
        console.log();
        //console.log(JSON.stringify(jRiskFile));

        let strBody = prepareBODY(jRiskFile);

        console.log('RISK FILE CONTENT as exchange file');
        console.log();
        //console.log(strExportFile); 

        save(jRiskFile,prefix+filename,'./'+getDate()+'_exchangeFile.html',strBody);
      };

      filename=this.files[0].name;
      console.log('reading from file='+filename);
      document.getElementById('filename').innerHTML=filename;
      fr.readAsText(this.files[0]);
    });
}

export function convert(strTable,filename) {

        let jRiskFile = JSON.parse(strTable);
        console.log('convert RISK FILE CONTENT from JSON');
        console.log();
        //console.log(JSON.stringify(jRiskFile));

        let strBody = prepareBODY(jRiskFile);

        console.log('convert RISK FILE CONTENT as exchange file');
        console.log();
        //console.log(strExportFile); 

        save(jRiskFile,prefix+filename,'./'+getDate()+'_exchangeFile.html',strBody);
}

function saveCB(digest,strOutFile,strOut) { 

  let domStats=document.getElementById('Stats');
  let strStats=generateStats();
  if(domStats) {
    domStats.innerHTML=strStats;
  }

  
  console.log('saveCB(1) DIGEST='+digest)


  let filesig=document.getElementById('filesig');
  if(filesig) {
    filesig.innerHTML = digest;
    console.log('saveCB(2) FILESIG='+digest)
  }

  console.log('saveCB(3) FILE='+strOutFile);

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
  a.download = strOutFile;
  a.click();
  console.log('saveCB(2) CLICK')

  window.URL.revokeObjectURL(url);
  return textFile;
}


// GH20231109 self-signing when saving the file
function putElement(strContent) {
  var d = document.createElement('d');
  document.body.appendChild(d);
  d.style = 'display:none';
  d.innerHTML=strContent;
  return d; 
}


function getPayload() { 
// GH20240612 fixed
  const allObjects=document.getElementsByTagName('div');
  for(let i=allObjects.length-1;i>=0;i--) {
    if(allObjects.item(i).getAttribute('typeof')===RISKMAN_CORI) {
      allObjects.item(i).style.display="table-row"; 
    }
  }
  return document.getElementById(TAG_CONTENT).innerHTML;
}




function getEnvelope() { return document.getElementById(TAG_ENVELOPE); }

function save(jRiskFile,strInFile,strOutFile,strBody) { 

  let element = putElement(strBody);
  let strContent = getPayload();
  let envelope = getEnvelope();

  digest({'algorithm':'SHA-256','message': strContent}).then((x)=>{
      var sig = document.createElement("H5");  
      envelope.appendChild(sig);
      sig.innerHTML = x +' &nbsp;&nbsp; '+(new Date()).toISOString()+': VDE SPEC 90025 ';

      let strOut = generateExportFile(jRiskFile,strInFile,element.innerHTML);

      saveCB(x,strOutFile,strOut);
  }); 
}
const digest = async ({ algorithm, message }) => Array.prototype.map.call(
		new Uint8Array(await crypto.subtle.digest(algorithm, new TextEncoder().encode(message))),
        (x) => ('0' + x.toString(16)).slice(-2)).join('');

        


//----------------------- PHASE I   preparation step 

// prepareBODY modifies the jRiskFile argument

function prepareBODY(jRiskFile) {

  prepareDSHIdentifiers(jRiskFile); 

  // must do prepareXXX in order to assign craftsMDId

  tables = '<div class="object"><div class="value"><DIV class="prop">\n'+ 

        '<div class="object"  property="'+RISKMAN_HASCOMPONENT+'" id="regComponent">'+ 
                prepareAllCOMPONENTS(jRiskFile)+
				'</div>\n'+
/*        
        '<div class="object"  property="'+RISKMAN_HASCONTEXT+'" id="regContext">'+ 
                prepareAllCONTEXTS(jRiskFile)+
				'</div>\n'+
*/
        '<div class="object"  property="'+RISKMAN_HASFUNCTION+'" id="regFunction">'+ 
                prepareAllFUNCTIONS(jRiskFile)+
				'</div>\n'+

        '<div class="object"  property="'+RISKMAN_HASHARM+'" id="regHarm">'+ 
                prepareAllHARMS(jRiskFile)+
				'</div>\n'+
        '\n'; 

        '<div class="object"  property="'+RISKMAN_HASHAZARD+'" id="regHazard">'+ 
                prepareAllHAZARDS(jRiskFile)+
				'</div>\n'+

        '<div class="object"  property="'+RISKMAN_HASHAZSIT+'" id="regHazardousSituation">'+ 
                prepareAllHAZARDOUSSITUATIONS(jRiskFile)+
				'</div>\n'+

	'</DIV></DIV></DIV>\n';
	



  let strRIT  = prepareAllDOMAIN_SPECIFIC_HAZARDS(jRiskFile);

  
  
  console.log();
  console.log(strRIT);
  console.log();

  

  return '<body>\n'+
	'   <div  class="container">\n'+
	generateDevice(jRiskFile)+
'<div class="object" title="Table Headings">\n'+
'	 <div class="value" typeoff="'+RISKMAN_ARI+'" title="AnalyzedRisk" id="RIT">\n'+
'    <div class="value" property="'+RISKMAN_HAS_ARIS+'" title="controls">\n'+
'      <div class="cell aris" typeof="'+RISKMAN_ARI+'" title="Risk Analysis">\n'+
'        <div class="value" property="'+RISKMAN_ID+'" title="id">#\n'+
'          <div class="value" property="'+RISKMAN_HAS_DOSH+'" title="protects">\n\n'+
'			       <div class="value dosh" typeof="'+RISKMAN_DOSH+'" title="Domain-Specific Hazard">\n'+
'              <div class="prop" property="'+RISKMAN_ID+'" title="id">0</div>\n'+
'              <div class="prop" property="'+RISKMAN_HASCOMPONENT+'" title="component" ref="COM5">Component.</div>\n'+
'              <div class="prop" property="'+RISKMAN_HASFUNCTION+'" title="function" ref="FUN2">Function.</div>\n'+
'              <div class="clos" property="'+RISKMAN_HASHAZARD+'" title="hazard" ref="HAZ">Domain-Specific Hazard</div>\n'+
'              </div>\n'+
'            </div>\n'+
'            <div class="prop" property="'+RISKMAN_HASTARGET+'" title="target"><div class="object" typeof="'+RISKMAN_TARGET+'"><div class="value"><div class="prop">Target</div></div></div></div>\n'+
'            <div class="prop" property="'+RISKMAN_HASHAZSIT+'" title="hazardous situation">Hazardous Situation</div>\n'+
'            <div class="prop" property="'+RISKMAN_HASHARM+'" title="harm" ref="0">Harm</div>\n'+
'            <div class="clos" property="'+RISKMAN_HASPRERISK+'" title="pre-risk"><div class="object" typeof="'+RISKMAN_RISKLEVEL+'" title="RiskLevel" id="RSK">\n'+
'                    <div class="value" property="'+RISKMAN_SEVERITY+'" title="severity"><div class="prop">Severity</div></div>\n'+
'                    <div class="value" property="'+RISKMAN_PROBABILITY+'" title="probability"><div class="prop">Probability</div></div>\n'+
'                    <div class="value" title="risk region"><div class="prop">Risk Region</div></div>\n'+
'              </div>\n'+
'            </div>\n'+
'          </div>\n'+
'        </div>\n'+

'        <div class="clos miti" property="'+RISKMAN_HAS_SDA+'" title="Risk Control">\n'+
'          <div class="value" typeof="'+RISKMAN_RISK_SDA+'" id="SDA#">\n'+
'     		 <div class="prop"><div class="object case"><div class="value">\n'+
' 			         <div class="clos" property="'+RISKMAN_PROBLEM+'" title="problem">Problem</div>\n'+
'                <div class="clos" property="'+RISKMAN_GOAL+'" title="goal">Goal</div>\n'+
'	  		         <div class="clos" property="'+RISKMAN_CAUSE+'" title="cause">Cause</div>\n'+
'		       </div></div></div>\n'+
'		       <div class="clos" property="'+RISKMAN_HAS_SUB_SDA+'">\n'+

'            <div class="object rsda" typeof="'+RISKMAN_SDA+'" id="ASU#">\n'+
'  			  	   <div class="prop" title="id">ASU#</div>\n'+
'	  			     <div class="prop" title="measureId">Assurance</div>\n'+
'		  		     <div class="prop" title="sdaName">Name</div>\n'+
'			  	     <div class="prop" title="sdaText">Text</div>\n'+
'				       <div class="prop" title="requirementCode">Requirement</div>\n'+
'			      </div>\n'+ // SUB SDA

'		      </div>\n'+ // hasSubSDA
'		      <div class="object" property="'+RISKMAN_HAS_IMPL+'" title="Implementation">\n'+
'           <div class="value" typeof="'+RISKMAN_IMPL+'">\n'+
'		          <div class="prop" title="external">External Measure</div>\n'+
'             <div class="prop" title="solution">Evidence</div>\n'+
'           </div>\n'+ // IMPL
' 	      </div>\n'+ // hasIMPL
'       </div>\n'+ // RiskSDA
' 	  </div>\n'+ // isMitigatedBy

'     <div class="prop" property="'+RISKMAN_HASRESI+'" title="post-risk"><div class="object" typeof="'+RISKMAN_RESI+'" title="Residual Risk" id="RSK">\n'+
'         <div class="value" property="'+RISKMAN_SEVERITY+'" title="severity"><div class="prop">Severity</div></div>\n'+
'         <div class="value" property="'+RISKMAN_PROBABILITY+'" title="probability"><div class="prop">Probability</div></div>\n'+
'         <div class="value" title="risk region"><div class="prop">Risk Region</div></div>\n'+
'       </div>\n'+
'     </div>          <div class="clos">&nbsp;</div>\n\n'+
'   </div>\n'+
'</div>\n'+


  '        </div>\n\n'+
  
  '        <div class="object" title="Risk Table"  id="'+TAG_CONTENT+'">\n'+
	strRIT+
	'        </div>\n'+ // 20240209 format
	'      </div>\n'+
  '      <BR>'+tables+'</BR>\n'+ // GH20240118 add global term tables
  '    </div>\n'+
  '  </div>\n'+ // 20240131 format
  '</div>\n'+ // 20240209 format


// Envelope and signature dialogue
    '   <DIV>Name<input type="edit" id="signName"></input>\n'+
    '      <label for="signature">Reason:</label>\n'+
    '      <select name="reason" id="reason">\n'+
    '         <option value="modified">Modified</option>\n'+
    '         <option value="reviewed">Reviewed</option>\n'+
    '         <option value="submitted">Submitted</option>\n'+
    '         <option value="approved">Approved</option>\n'+
    '      </select><button id="signButton" onClick="sign()">SIGN</button></DIV>\n'+
    '   <p id="Envelope">\nEditor\n</p>'+
    '</body>\n';
}


function prepareAllDOMAIN_SPECIFIC_HAZARDS(jRiskFile) {
  let aRIT = getAllRisks(jRiskFile);
  return aRIT.map((jRIT)=>(prepareCOR(jRiskFile,jRIT))).join('\n');
}



function prepareCOR(jRiskFile,jRIT) {

  console.log("prepareCOR with "+JSON.stringify(jRIT));
  
  let componentId = jRIT.refComponent;
  let componentName = "Component";
  let jComponent = findByKey(getComponents(jRiskFile),'id',componentId);
  if(jComponent) {
	  componentName = jComponent.name;
  } 
  

  let funcId = jRIT.refFunction; 
  let jFunc = findByKey(getFuncs(jRiskFile),'id',funcId);
  let funcName = "Function";
  let fRef = null; 
  if(jFunc) {
    funcName = jFunc?jFunc.name:null;
    fRef = jFunc?jFunc.craftsMDid:null;
  }


  let hazardId = jRIT.refHazard; 
  
  

  // 20240118
  // annotate with properties for finding the tables 
	let hazTerm = '<div class="object" property="'+RISKMAN_HAZARD+'"><div class="value" property="'+RISKMAN_HAZARD+'">'+
      (jRIT.regEncodedHazard?jRIT.regEncodedHazard.map((encHazTerm)=>encHazTerm.name).join('</div><div class="value">'):"")+
      '</div></div>';
  


  let regHazards = jRIT.regHazard?jRIT.regHazard.map((haz)=>(haz.name)):[];

  return prepareRISKITEMfromDSH(jRiskFile,jRIT,hazardId,hazTerm,regHazards,componentId,componentName,funcId,funcName);  


}


function prepareRISKITEMfromDSH(jRiskFile,jRIT,hazardId,hazTerm,arrHazard,componentId,componentName,funcId,funcName) {  


  let result="";
  let aRIT = getARIbyRIT(jRIT);
  
  if(aRIT) aRIT.forEach((jARI)=>{if(jARI) result+=prepareRIT(jRiskFile,jRIT,jARI,hazardId,hazTerm,arrHazard,componentId,componentName,funcId,funcName);});
  return result;	
}

const lim="'";

function prepareRIT(jRiskFile,jRIT,jARI,hazardId,hazTerm,arrHazard,componentId,componentName,funcId,funcName) {

  console.log("prepareRIT with "+JSON.stringify(jARI));
  console.log("prepareRIT comp="+componentName+"  func="+funcName+ "  harm="+jRIT.harm.name)


  let hsRef = jARI.refHS; // VALUE for hazardous situation
  let jHazSit = findByKey(getHAZARDOUSSITUATIONS(jRiskFile),'id',hsRef.id);
  let hazsitName = jHazSit ? jHazSit.name : "Hazardous S";
  let hasi_code = jHazSit ? jHazSit.code : "Cause code";
  let hasi_cause = jHazSit ? jHazSit.cause : "Cause text";

  let harmId="?";
  let harmName=jRIT.harm.name;
  let jHarm = findByKey(getHarms(jRiskFile),'name',harmName);
  if(jHarm && jHarm.id) harmId = jHarm.craftsMDid;


  jARI.craftsMDid = nextRIT();
  let rit= jARI.craftsMDid;
  let ritID='RIT'+rit;

  // generate a DOSH for each generic Hazard...

  let strSDA = formatSDAValues(jRiskFile,jARI.refRiskSDA,componentName,funcName,hazsitName);

  
  // v8
  let arrDOSH = [];
  
  arrHazard.forEach((dosh,dsh_id)=>{ 

    let eDOSH={"hazard":dosh };
    if(xCaus) eDOSH.comp=componentName;
    if(xFunc) eDOSH.func=funcName;
    if(xCaus) eDOSH.cause=hasi_cause;
    if(xHKey) eDOSH.code=hasi_code;
    if(xHaSi) eDOSH.hazardousSituation=hazsitName;
    if(xHarm) eDOSH.harm=harmName;
    let dosh64=lim+btoa(JSON.stringify(eDOSH))+lim;

    arrDOSH.push(''+  // now comes a Domain-Specific Hazard
    '                 <div class="value dosh" typeof = "'+RISKMAN_DOSH+'"      title="Domain-Specific Hazard" draggable="true" onDragStart="dragDOSH(event,'+dosh64+')" id="'+(ritID+'D'+dsh_id)+'" >\n'+ 
    '                   <div class="prop"  property="'+RISKMAN_ID+'"           title="id">'+(ritID+'D'+dsh_id)+'</div>\n'+
    '                   <div class="prop"  property="'+RISKMAN_HASCOMPONENT+'" title="component" ref="'+componentId+'">'+componentName+'.</div>\n'+
    '                   <div class="prop"  property="'+RISKMAN_HASFUNCTION+'"  title="function" ref="'+funcId+'">'+funcName+'.</div>\n'+
    '                   <div class="clos"  property="'+RISKMAN_HASHAZARD+'"    title="hazard" ref="'+hazardId+'">'+dosh+'</div>\n'+				// + encoded hazTerm   // v5
    '                 </div>\n') 
    });
  
    console.log("prepareRIT produces arrDOSH= "+arrDOSH.join('\n'))

    return ''+
  '        <div class="value"         typeof="'+RISKMAN_CORI+'"            title="'+hazsitName+'"  id="'+ritID+'"  onclick="toggleDSH('+ritID+')">\n'+
  '          <div class="value"       property="'+RISKMAN_HAS_ARIS+'"      title="controls">\n\n'+  // v4

  '          <div class="cell aris"   typeof="'+RISKMAN_ARI+'"             title="Risk Analysis">\n'+  // v4
  '            <div class="value"    property="'+RISKMAN_ID+'"  title="id" >'+ritID+ // risk id v8
  '              <div class="value"     property="'+RISKMAN_HAS_DOSH+'"        title="protects" >\n'+arrDOSH.join('\n')+'</div>\n'+  
  '              <div class="prop"  property="'+RISKMAN_HASTARGET+'"     title="target"><div class="object" typeof="'+RISKMAN_TARGET+'"><div class="value" ><div class="prop" >'+(jARI.regTarget?(jARI.regTarget.join('</div></div><div class="value" ><div class="prop" >')):"?")+'</div></div></div></div>\n'+
  
    // Analyzed Risk
  '              <div class="prop"   property="'+RISKMAN_HASHAZSIT+'"        title="hazardous situation">'+hazsitName+'</div>\n'+	
  '              <div class="prop"  property="'+RISKMAN_HASHARM+'"           title="harm" ref="'+harmId+'">'+harmName+'</div>\n'+
  '              <div class="clos"   property="'+RISKMAN_HASPRERISK+'"       title="pre-risk">'+(jARI.risk?formatRiskValues(RISKMAN_RISKLEVEL, jARI.risk):"")+'</div>'+
	'            </div>\n'+ // ARI id v5
  '          </div>\n'+  // ARI
  '        </div>\n'+ // CONTROLS
    // Controlled Risk    G6 was class="cell miti"
  '          <div class="clos miti" property="'+RISKMAN_HAS_SDA+'" title="Risk Control">\n'+ // Controlled Risk
                     ((jRIT.refRiskSDA && strSDA)?
                        strSDA:
                        '            <div class="prop">&nbsp;</div><div class="prop"></div><div class="hedr"></div><div class="hedr">No SDA, because risk is low.</div><div class="hedr"></div><div class="prop"></div><div class="prop"></div>'
                     )+
//  '                <div class="clos">&nbsp;</div>\n\n'+ // spacer

'          </div>\n'+ // IS_MITIGATED_BY G6

  '          <div class="prop"  property="'+RISKMAN_HASRESI+'" title="post-risk">'+(jARI.residualRisk?formatRiskValues(RISKMAN_RESI, jARI.residualRisk):"")+'</div>'+
  '            <div class="clos">&nbsp;</div>\n\n'+ // spacer
  '        </div>\n'; // CONTROLLED_RISK

	
}

let jRiskTitles = { 'severity':'Severity', 'probability':'Probability', 'riskregion':'Risk Region' }

function formatRiskValues(prop, jRisk) {
  
  let attributes="";
  if(prop) attributes =  ' typeOf="'+prop+'" title="'+prop+'" id="RSK'+nextRsk()+'"';

  return '<div class="object"  '+attributes+'>\n'+
      ((jRisk.severity) ? ('<div class="value"  property="'+RISKMAN_SEVERITY+'" title="severity"><div class="prop" >' + jRisk.severity+'</div></div>\n'):"\n")+
      ((jRisk.probability) ? ('<div class="value"  property="'+RISKMAN_PROBABILITY+'" title="probability"><div class="prop" >' + jRisk.probability+'</div></div>\n'):"\n")+
      ((jRisk.riskRegion) ? ('<div class="value"  title="risk region"><div class="prop" >' + jRisk.riskRegion+'</div></div>\n'):"\n")+
       '</div>\n';
}


//----------------------- PHASE II   generator

// line-break in generated HTML output must be added explicitly








function generateMeta(jRiskFile) {
  return '<meta name="viewport" content="width=device-width, initial-scale=1">\n';
}
    
	
function generateSTYLE(jRiskFile) {
	return '  .container { font-size:10pt; }\n\n'+
  
	'  .object {\n'+
	'    display: table;\n'+
	'    border: 1px solid black;\n'+
	'    border-collapse: collapse;\n'+
	'  }\n\n'+

	'  .value {\n'+
	'    display: table-row;\n'+
  '       overflow:auto;\n'+
	'  }\n\n'+

'  .hedr {\n'+
'      display: table-cell;\n'+
'      min-width: 45px;\n'+
'      border-top: 1px solid black;\n'+
'      padding: 0px;\n'+
'  }\n\n'+

'  .prop {\n'+
'       display: table-cell;\n'+
'       min-width: 45px;\n'+
'       border: 1px solid black;\n'+
'       border-collapse: collapse;\n'+
'       padding: 4px;\n'+
'       overflow:auto;\n'+
'  }\n\n'+

'  .cell { display: table-cell; overflow:auto; }\n'+

'  .dosh { min-width: 380px; max-width: 380px; }\n\n'+

'  .aris { min-width: 640px; max-width: 640px;  }\n\n'+
  //border:1px solid black;


'  .case { min-width: 360px; max-width: 360px; }\n\n'+

'  .rsda { min-width: 590px; max-width: 590px; }\n\n'+

'  .miti { min-width:1080px; max-width:1080px; }\n\n'+


'  .fill {\n'+
'      display: table-cell;\n'+
'      width: 100%;\n'+
'      border-top: 1px solid black;\n'+
'      border-bottom: 1px solid black;\n'+
'  }\n\n'+

'  .clos {\n'+
'      display: table-cell;\n'+
'      width: 100%;\n'+
'      border-top: 1px solid black;\n'+
'      border-right: 1px solid black;\n'+
'      border-bottom: 1px solid black;\n'+

'  }\n\n'+
	
'  .sep {\n'+
'    display: table-cell;\n'+
'    border-top: 1px solid black;\n'+
'    border-left: 1px solid black;\n'+
'    border-bottom: 1px solid black;\n'+
'    padding: 4px;\n'+
'  }\n\n';
}
 
 
function generateExportFile(jRiskFile,strRiskFile,strContent) {
	return '<!DOCTYPE html><html prefix="'+PREFIX_RISKMAN+'" lang="en-GB">\n<head>\n<title>'+strRiskFile+'</title>'+
//    generateMeta(jRiskFile)+
    '<style>\n'+
    generateSTYLE(jRiskFile)+
    '</style>\n'+
    '</head><body prefix="'+PREFIX_RISKMAN+'">'+
    '<h5>This file is for demonstration purposes only and is not intended to, and does not, create any right or benefit, enforceable at law or in equity by any party against a manufacturer.\n'+
    'This content shows an example and is not intended to, and does not, create any claim or assertion, in any jurisdiction, regarding any kind of product or service.</h5>\n'+
    strContent+
'\n   <script>\n'+
/*

'function toggleDSH(ritID) {\n'+
'	  const allObjects = document.getElementsByTagName("div");\n'+
'	  for(let i=allObjects.length-1;i>=0;i--) if(allObjects.item(i).getAttribute("typeOf")=="'+RISKMAN_CORI+'") {\n'+
'      let cori = allObjects.item(i);\n'+
'      if(cori) cori.style.display="none";\n   }\n'+
'	  let cori=document.getElementById(ritID);\n'+
'   if(cori) cori.style.display="table-row";\n'+
'   window.location.href ="#"ritID;\n'+
'   console.log("goto #"+ritID);\n'+
'}\n\n'+


}

*/
'function dragDOSH(ev,dosh64) { ev.dataTransfer.setData("text/plain", dosh64); }\n'+

'function dragLOCATION(ev) { \n'+
'  let aPath=new String(location).split("/");\n'+
'  aPath.pop();\n'+
'  aPath.shift();\n'+
'  aPath.shift();\n'+
'  aPath.shift();\n'+
'  let filePath=aPath.join("/");\n'+
'  let jLOC =  { "env": btoa(filePath)};\n'+
'  ev.dataTransfer.setData("application/json", filePath);\n}\n'+

'function getPayload() { \n'+
'   const allObjects=document.getElementsByTagName("div");\n'+
'   for(let i=allObjects.length-1;i>=0;i--) if(allObjects.item(i).getAttribute("typeOf")=="'+RISKMAN_CORI+'") allObjects.item(i).style.display="table-row";\n'+
'   return document.getElementById("'+TAG_CONTENT+'").innerHTML;\n'+
'}\n'+

"const digest = async ({ algorithm, message }) => Array.prototype.map.call(\n"+
"   new Uint8Array(\n"+
"      await crypto.subtle.digest(algorithm, new TextEncoder().encode(message))),\n"+
"      (x) => ('0' + x.toString(16)).slice(-2)).join('');\n"+


"function sign() {\n"+
"   digest({'algorithm':'SHA-256','message': getPayload()}).then(show);\n}\n"+

"function show(digest) {\n"+
"   console.log('digest='+digest);"+
"   const env=document.getElementById('Envelope');\n"+
"   const node = document.createElement('H5');\n"+
"   env.appendChild(node);\n"+
"   const name = document.getElementById('signName').value;\n"+
"   node.innerHTML= digest+' &rarr; '+(new Date()).toISOString()+': '+name; \n}\n"+

"function loadName() {\n"+
"   var wshShell= window.ActiveXObject('wscript.shell');\n"+
"   var userName=wshShell.ExpandEnvironmentStrings('%username%');\n"+
"   console.log(userName);\n}\n"+

" loadName();\n"+

"</script>\n</body>\n</html>\n\n";
}

		

function generateStats() {
  return '&nbsp;&nbsp;CON:'+iCon+'\n'+
  '&nbsp;&nbsp;COM:'+iCom+'\n'+
  '&nbsp;&nbsp;FUN:'+iFun+'\n'+
  '&nbsp;&nbsp;HRM:'+iHrm+'\n'+
  '&nbsp;&nbsp;HAZ:'+iHaz+'\n'+
  '&nbsp;&nbsp;HAS:'+iHas+'\n'+
  '&nbsp;&nbsp;DSH:'+iDSH+'\n'+
  '&nbsp;&nbsp;RIT:'+iRIT;
}


function generateDevice(jRiskFile) {
  let entity =  jRiskFile.device.entity;
  let project = jRiskFile.device.project;
  let version = jRiskFile.device.version;
  return '<div class="cell aris" id="'+TAG_DEVICE+'">\n'+
  '   <div class="object" ><div class="value" ><div class="prop" >Project</div><div class="prop" >UDI</div><div class="prop" >Version</div><div class="sep" ></div><div class="clos" >Entity</div></div>\n\n'+
  '      <div class="value" draggable="true" ondragstart="dragLOCATION(event)">\n'+
  '         <div class="prop"  title="Project">'+project+'</div>\n'+
  '         <div class="prop"  title="UDI">123.67.789.952</div>\n'+
  '         <div class="prop"  title="Version">'  +  (version?version:"version?")+'</div>\n'+
  '         <div class="sep" ></div>\n'+
  '         <div class="clos"  title="Entity">'   +  (entity?entity:"entity?")  + '</div>\n'+
  '      </div>\n'+
  '   </div>\n'+
  '</div>\n'+
  '<BR> </BR>\n';
  

}   
 



// GH20240122 Component table

function prepareAllCOMPONENTS(jRiskFile) {
  let result="";
  let aComps = getComps(jRiskFile);
  aComps.forEach((jComp)=>{result+=prepareComp(jComp);});
  return '<div class="value">'+result+'</div>';	
}

function getComps(jRiskFile) { return jRiskFile.regComponent; }

function prepareComp(jComp) {
  jComp.craftsMDid=nextCom();
  return '<div class="prop"> COM'+jComp.craftsMDid+'</div>';
}


function getComponents(jRiskFile) { return jRiskFile.regComponent; }

/*

function prepareAllCONTEXTS(jRiskFile) {
  let result="";
  let aComponents = getComponents(jRiskFile);
  aComponents.forEach((jComponent)=>{result+=prepareComponent(jRiskFile,jComponent);});
  return result;	
}

*/



// GH20240122 DeviceFunction table


function prepareAllFUNCTIONS(jRiskFile) {
  let result="";
  let aFuncs = getFuncs(jRiskFile);
  aFuncs.forEach((jFunc)=>{jFunc.relDSH=[]; result+=prepareFunc(jRiskFile,jFunc);});
  return '<div class="value">'+result+'</div>';	
}

function getFuncs(jRiskFile) { return jRiskFile.regFunction; }

function prepareFunc(jRiskFile,jFunc) {
  jFunc.craftsMDid=nextFun();

  // link back all DSH for this function
  getAllRisks(jRiskFile).forEach((jDSH)=>{if(jDSH && jFunc && jDSH.refFunction==jFunc.id) jFunc.relDSH.push(jDSH.craftsMDid)});

  return '<div class="prop"> FUN'+jFunc.craftsMDid+'</div>';
}





// GH20240122 Harm table

function getHarms(jRiskFile) { return jRiskFile.regHarm; }
function prepareHarm(jRiskFile,jHarm) {
  let regRIT = linkHarm2RIT(jRiskFile,jHarm);
  
  jHarm.craftsMDid=nextHrm();

  return '<div class="prop">HRM'+jHarm.craftsMDid+' &nbsp;'+generateREL("RIT",regRIT.map((jRIT)=>(jRIT.craftsMDid)))+'</div>';
}


function prepareAllHARMS(jRiskFile) {
  let result="";
  let aHarms = getHarms(jRiskFile);
  aHarms.forEach((jHarm)=>{result+=prepareHarm(jRiskFile,jHarm);});

  return '<div class="value">'+result+'</div>';	
}






function getHazards(jRiskFile) { return jRiskFile.regHazard; }

function prepareHazard(jRiskFile,jHaz) {
  if(!jHaz.craftsMDid) jHaz.craftsMDid="__"+nextHaz();

  let dshRefList = linkHazard2DSH(jRiskFile,jHaz);
  
  return dshRefList;
}
function prepareAllHAZARDS(jRiskFile) {

  let result="";
  let aHaz = getHazards(jRiskFile);
  aHaz.forEach((jHaz)=>{result+=prepareHazard(jRiskFile,jHaz);});
  return result;	
}

function getHAZARDOUSSITUATIONS(jRiskFile) { return jRiskFile.regHazardousSituation; }

function prepareHazardousSituation(jRiskFile,jHazSit) {
  jHazSit.craftsMDid=nextHas();

  let hsId=jHazSit.id;
  let refMRforHS = [];
  getAllRisks(jRiskFile).forEach((jDSH)=>{ 
    getARIbyRIT(jDSH).forEach((jRIT) =>{ 
      if(hsId!=jRIT.refHS) {} else refMRforHS.push("RIT"+jRIT.craftsMDid) })});
  jHazSit.relMR = refMRforHS;

  return jHazSit.craftsMDid;
}

function prepareAllHAZARDOUSSITUATIONS(jRiskFile) {
  let result="";
  let aHas = getHAZARDOUSSITUATIONS(jRiskFile);
  aHas.forEach((jHas)=>{result+=prepareHazardousSituation(jRiskFile,jHas);});
  return result;	
}




function getAllRisks(jRiskFile) { return jRiskFile ? jRiskFile.regControlledRisk: []; }
function prepareDSHIdentifiers(jRiskFile) {
  let allDSH=getAllRisks(jRiskFile);

  if(allDSH && allDSH.length>0) 
    allDSH.forEach((jDSH)=>{jDSH.craftsMDid=nextDSH(); 
       // if(getARIbyRIT(jDSH)) getARIbyRIT(jDSH).forEach((jRIT)=>{jRIT.craftsMDid=nextRIT();  })
    });
  return "";
}


function getComponent(jDSH) { return jDSH.regComponent; }
// reuse  prepareComp(jComp) from main overview
function prepareAllDSH_Components(jDSH) {
  let result="";
  let aComps = getComponent(jDSH);
  if(aComps) aComps.forEach((jComp)=>{result+=prepareComp(jComp);});
  else {
    console.log();
    console.log("No/wrong Component in "+JSON.stringify(jDSH));
    console.log();
  }
  return result;	
}


function getHazardsByDSH(jDSH) { return jDSH.relHazard }
function generateHazardRef(jRiskFile,jHazardRef) {
  let jHaz = findByKey(getHazards(jRiskFile),'id',jHazardRef);  
  return jHaz ? jHaz.craftsMDid : "Haz#";
}

function prepareAllHAZARD_REFSfromDSH(jRiskFile,jDSH) {  
  return generateHazardRef(jRiskFile,jDSH.refHazard);	
}

function getARIbyRIT(jRIT) { return jRIT.regAnalyzedRisk; }


function linkHarm2RIT(jRiskFile,jHarm) {
  let result = [];
  let id = jHarm.id;
  let allRisks=getAllRisks(jRiskFile);
  allRisks.forEach((jRIT)=>{  jRIT.regAnalyzedRisk.forEach((jARI)=>{ if(jARI.regHarm && jARI.regHarm.href==id) result.push(jARI); } )});

  // 20230715 remember related RIT of Harm
  jHarm.relRIT=result;

  return result;
}


// 20230715
function linkHarmHazard(jRiskFile) { return jRiskFile.regHarm.map((jHarm)=>(linkHarmToHazard(jRiskFile,jHarm))); }
function linkHarmToHazard(jRiskFile,jHarm) {
  let relHazard={};
  let id = jHarm.id;
  let allRisks=getAllRisks(jRiskFile);
  allRisks.forEach((jRIT)=>{ 
      jRIT.regAnalyzedRisk.forEach((jARI)=> // GH20240130
                        { if(jARI.regHarm && jARI.regHarm.href==id) {
                          let refCOR=jARI.refCOR;
                          if(refCOR) {
                            let refHaz=jRIT.refHazard;
                            if(refHaz) relHazard[refHaz]="DSH"+jRIT.craftsMDid;
                          }
                        }}
        )});

  // 20230715 remember related RIT of Harm
  jHarm.relHazard=relHazard;

  return relHazard;
}


function linkHazard2DSH(jRiskFile,jHaz) {
  let result = [];
  let id = jHaz.id;
  let allDSH=getAllRisks(jRiskFile); 

  // 20230708 use refHazard for references
  allDSH.forEach((jDSH)=>{
            if(jDSH.refHazard==id) {
               result.push(jDSH.craftsMDid);
             } }) ;

  return generateREL("DSH",result);
}


function generateREL(typ,hList) { return hList.map((hPrimKey)=>('<a href="#'+typ+hPrimKey+'">'+typ+hPrimKey+'\n</a>')).join(''); }




function formatSDAValues(jRiskFile,refSDA,strComponent,strFunction) { 
  let riskSDA = findByKey(jRiskFile.relSDA,"id",refSDA);
  let result="%";
  if(riskSDA) { 

    riskSDA.craftsMDid = nextSDA();
    let sdaId=riskSDA.craftsMDid;

    console.log("formatSDAValues("+refSDA+")="+JSON.stringify(riskSDA));

    result = '   <div class="value"  typeof="'+RISKMAN_RISK_SDA+'" id="SDA'+sdaId+'">'+ 
    
      '      <div class="prop"><div class="object case"><div class="value">\n'+ // v4_1
      '          <div class="clos"  property="'+RISKMAN_PROBLEM+'"title="problem">In case of '+riskSDA.problem+'\n</div>'+  
      '          <div class="clos"  property="'+RISKMAN_GOAL+'"title="goal">risk of '+riskSDA.goal+' due to </div>\n'+  
      '          <div class="clos"  property="'+RISKMAN_CAUSE+'"title="cause">'+riskSDA.cause+' is lowered.</div>\n'+  // was prop
      '      </div></div></div>\n'+ // v4_1


      '      <div class="clos"  property="'+RISKMAN_HAS_SUB_SDA+'">\n'+         

              //any SDA
              riskSDA.regAssurance.map((mitigation,asu)=>(
      '         <div class="object rsda" typeof="'+RISKMAN_SDA+'" id="'+sdaId+'ASU'+asu+'">\n'+
      '               <div class="prop" property="'+RISKMAN_ID+'" title="id">'+sdaId+'ASU'+asu+'</div>\n'+
      '               <div class="prop" title="measureId">'+mitigation.id+'</div>\n'+
      '               <div class="prop" title="sdaName">'+mitigation.sdaAssurance.name+'</div>\n'+
      '               <div class="prop" title="sdaText">'+mitigation.sdaAssurance.text+'</div>\n'+
      '               <div class="prop" title="requirementCode">'+mitigation.sdaAssurance.requirementCode+'</div>\n'+
      '             </div>\n'
              )).join('\n')+


      '      </div>\n'+
  // v6 </div>
      '		   <div class="object" property="'+RISKMAN_HAS_IMPL+'" title="Implementation">\n'+
      '		     <div class="value" typeof="'+RISKMAN_IMPL+'">\n'+
      '          <div class="prop"  property="'+RISKMAN_EXTERNAL+'" title="external">Device instructions for '+strComponent+' explain the handling of '+strFunction+'</div>\n'+
      '          <div class="prop"  property="'+RISKMAN_PROOF+'" title="solution">Proof: '+riskSDA.solution+' had been verified.</div>\n'+
      '   </div></div></div>\n';


    // return null in case of missing mitigation
    riskSDA.regAssurance.forEach((mitigation)=>{ if(mitigation && mitigation.sdaAssurance && mitigation.sdaAssurance.name && mitigation.sdaAssurance.name.trim().slice(0,4)=='None') result = null; });
  
  } 

  return result;
  
}

