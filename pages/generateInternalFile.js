

// generates json according to VDE SPEC 90025 Abstract File format from json RISK TABLE

// for full console access, run in Chrome

// VERSION 2024-02

// with DSH use Component instead of Context

// with DSH specifying harm and hazard, rather than hazardous situation

const DELIM = ";";

var jRiskFile = { 
   "device": {
        "entity":"entity", 
        "project":"project", 
        "udi":"udi", 
        "version":"0"
    },

  "regComponent":[], 
  "regContext":[],  // 20230708
  "regFunction":[], 
  "regHazard":[],  // 20230708
  "regEncodedHazard":[],  // 20240128
  "regHarm":[],
  "regHazard":[],
  "regHazardousSituation":[ ],
  "regControlledRisk":[ ],
  "relSDA":[]
}



var filename=null;

var instanceCount = 0;

function init() {
  instanceCount = 0;
}

function next() { return ++instanceCount; }

function findByKey(list,key,name) {
  let result=null;
  if(list && key && name) list.forEach((item)=>{if(item && item[key] && item[key]==name) result=item;})
  return result;
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

function symbolic(pat) {
    const alpha = [
        "5","7",
        "11","13","17","19",
        "23","29",
		"31","37","39",
        "41","43","47",
        "51","53","57","59",
        "61","67",
        "71","73","79",
        "81","83","87","89"
    ];
    var res = 0n;
    if (pat && pat.length > 2) {
        let tap = pat.split().reverse().join();
        var sequence = tap + pat + tap + pat + tap + pat + tap;
        let len = sequence.length;
        for(let i = 0; i < len && i < 60; i+=7){
			let p=i%60;
            let a = sequence.charCodeAt(p);
            let z = sequence.charCodeAt(len - 1 - p);
            let iNext = BigInt(alpha[(a + z) % 26]);
            res = 7n * res + iNext;
        }
    }
    return res.toString();
}

function saveString(strFile,strOut) {

 let downloadlink='downloadlink';  
  console.log("SAVE to file="+strFile);
  console.log(strOut);

  var textFile=null,makeTextFile = function (text) {
    var data = new Blob([text], {type: 'text/plain'});
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }
    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
  };
  
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  let url=makeTextFile(strOut);
  a.href = url;
  a.download = strFile;
  a.click();
  window.URL.revokeObjectURL(url);
  return textFile;
}


//--------------- startup

let regFunction = null;


function start() {
  document.getElementById('filechoice').addEventListener('change', function () {
    var fr = new FileReader();
	  csvLines=[];
    fr.onload = function () {
        
        
        let strSnippet = splitLines(this.result+" \n").join('');
        console.log("RISK FILE CONTENT as a string");
        console.log();

        jSnippetDRMF = JSON.parse(strSnippet);
        console.log("RISK FILE CONTENT from JSON");
        console.log();

        let strInternalFile = processRiskTable(jSnippetDRMF);

        saveString("./InternalFile.json",strInternalFile);
      };

      filename=this.files[0].name;
      console.log("reading from file="+filename);
      document.getElementById('filechoice').innerHTML=filename;
      fr.readAsText(this.files[0]);
    });   
}


export function processRiskTable(jSnippetDRMF) {
    init();

    // strip header
    if(jSnippetDRMF.justification) jSnippetDRMF=jSnippetDRMF.justification;


    // DEVICE INFO
    if(jSnippetDRMF.manufacturer) jRiskFile.device.entity=jSnippetDRMF.manufacturer;
    if(jSnippetDRMF.project)      jRiskFile.device.project=jSnippetDRMF.project;
    if(jSnippetDRMF.version)      jRiskFile.device.version=jSnippetDRMF.version;
    
    if(jSnippetDRMF && jSnippetDRMF.justification) 
      jSnippetDRMF.justification.forEach((jRIT) => {addRawRIT2InternalFile(jRIT);})

    let strInternalFile = JSON.stringify(jRiskFile);

    console.log("RISK FILE CONTENT as Internal file");
    console.log();
    console.log("string file is "+strInternalFile.length+" characters long."); 

    return strInternalFile;
}



function internComponent(strComponent) {
  let entry=null;
    if(entry=findByKey(jRiskFile.regComponent,"name",strComponent)) {} else  {
      entry = {'id':'COM'+next(), 'title':'Component',  'name':strComponent};
      jRiskFile.regComponent.push(entry);
    }
    return entry;
}


function internGenericHazard(genHazardName) {
  let entry=null;
    if(entry=findByKey(jRiskFile.regHazard,"name",genHazardName)) {} else  {
      entry = {"id":"GEN"+next(), 'title':'GenericHazard',  "name":genHazardName};
      jRiskFile.regHazard.push(entry);
    }
    return entry;
}

function internDosh(doshName) {
  let entry=null;
    if(entry=findByKey(jRiskFile.regHazard,"name",doshName)) {} else  {
      entry = {"id":"DSH"+next(),  'title':'Hazard',  "name":doshName};
      jRiskFile.regHazard.push(entry);
    }
    return entry;
}

function internFunction(strFunction,strNotes) {
  let entry=null;
    if(entry=findByKey(jRiskFile.regFunction,"name",strFunction)) {} else  {
      entry = {"id":"FUN"+next(),  'title':'Function', "name":strFunction, "notes":strNotes};
      jRiskFile.regFunction.push(entry);
    }
    return entry;
 }


 function internHarm(strHarm) {
  // 20230803 strHarm = name;code;code;code;code
  // only name is relevant identifier
  let entry=null;
  let arrHarm=strHarm.split(';');
  let harmName=arrHarm.shift();
    if(entry=findByKey(jRiskFile.regHarm,"name",harmName)) {} else  {
      entry = {
		 'id':'HRM'+next(), 
		 'title':'Harm',	
		 'name':harmName,
      'imdrf_aete':arrHarm.join(';')};
      jRiskFile.regHarm.push(entry);
    }
    return entry;
 }



 function internHazSit(strHazSit) {
   console.log("HazardousSituation: "+strHazSit); // CSV string
   let arrHazSit = strHazSit.split(DELIM);
   let strHazSitName=arrHazSit.shift();
   let strCause=arrHazSit.shift();
   let strHazSitCode=arrHazSit.shift();
   let strIMDRF_AETA=arrHazSit.shift();

   let jHazSit = findByKey(jRiskFile.regHazardousSituation,'name',strHazSitName);
   if(!jHazSit) {
      jHazSit={ 'id':"HAS"+next(), 
        'title':'HazardousSituation',
        'name':strHazSitName,
        'cause':strCause,
        'code':strHazSitCode,
        'imdrf_aeta':strIMDRF_AETA // device problem
      };
      jRiskFile.regHazardousSituation.push(jHazSit);
   }
   return jHazSit;
 }
 

function addRawRIT2InternalFile(jCORI) {

  let docu = "";
  Object.keys(jCORI).map((key)=>{docu=docu+" "+key;});
  // integrate snippet into risk management Internal file

  console.log();
  console.log(JSON.stringify(jCORI.id)+"=>"+docu);


  // extract all genericHazards from DSH and intern them
  console.log("hazards: "+JSON.stringify(jCORI.genericHazards)); // array
  // 20340706 use href for references
  let relGenericHazards = [];
  jCORI.genericHazards.forEach((genHazardName) =>{ 
    if(genHazardName && genHazardName.length>0) {
        let gHaz=internGenericHazard(genHazardName); 
        if (gHaz) relGenericHazards.push({"href":gHaz.id, "name":gHaz.name}); 
      }
    });
  // 20230803 fixed empty GenHaz issue


  // extract all encodedHazards from DSH 
  console.log("encoded hazards: "+JSON.stringify(jCORI.encodedHazards)); // array
  let regEncodedHazards = [];
  jCORI.encodedHazards.forEach((encHazardName) =>{ 
    if(encHazardName && encHazardName.length>0) {
        let parts=encHazardName.split('#');
        if(parts[0]=='C1' && parts.length>1) {
          regEncodedHazards.push( {"name":encHazardName, "href":encHazardName}); 
        }
      }
  });
  
  // extract Function, internalize and store id 
  console.log("function: "+JSON.stringify(jCORI.function)); // CSV string
  let arrFunction = jCORI.function.name.split(DELIM);
  let strFunction=arrFunction[0];
  arrFunction.shift();
  let strNotes=arrFunction.join(DELIM);
  let jFunction = internFunction(strFunction,strNotes);
  console.log("Function: "+JSON.stringify(jFunction)); 
  


  // 20230708
  // extract DomainSpecificHazard identification, internalize and store id 
  let strDosh = jCORI.dosh.name;
  let jDosh = internDosh(strDosh);
  console.log("DSH: "+JSON.stringify(jDosh)); // { id name }
  

  // 20240123
  let strHarm = jCORI.harm.name;
  let jHarm = internHarm(strHarm);



  // 20230731
  // extract Hazard, internalize and store id 
  let strComponent = jCORI.component;
  let jComponent = internComponent(strComponent);
  console.log("Component: "+JSON.stringify(jComponent)); // { id name }
  



  


  // internalize DomainSpecificHazard by harm id HRM...
  let targetRisk =findByKey(jRiskFile.regControlledRisk,"hazard",jDosh.name);
  // 20230708 let targetRisk =findByKey(jRiskFile.relDomainSpecificHazard,"harm",jHarm.name);
  if(targetRisk) {
    console.log("DSH found:  "+JSON.stringify(jHarm.name)+"   "+JSON.stringify(jDosh.name));
  }
  else {
    targetRisk = { 
        'id':'RIT'+next(), 
		    'title':'ControlledRisk',
        'refComponent':jComponent.id,
        'refFunction':jFunction.id, 
        'harm':jHarm, // 20240124 v3 harm is at DSH-level
        'refHazard':jDosh.id , // GH20240725 was hazard, should be refDOSH
        'regHazard':relGenericHazards, 
        'regEncodedHazard':regEncodedHazards, 
        'regAnalyzedRisk':[]
      };
	  
	  
    jRiskFile.regControlledRisk.push(targetRisk);
    console.log("DSH built: "+JSON.stringify(targetRisk)); 
  }
  


  // extract HazardousSituation, internalize and store id 
  if(jCORI && jCORI.managedRisks) {
	  let panic=jCORI.managedRisks.length;
	  console.log(" ManagedRisks #"+panic);
	  jCORI.managedRisks.forEach((jMAR)=>{console.log("ManagedRisk "+JSON.stringify(jMAR))});
  }
  else console.log("no ManagedRisks");



  // add AnalyzedRisks
  var refHS;

  

  let managedRisks = jCORI.managedRisks.map((jMAR)=>( 
     (refHS = internHazSit(jMAR.name).id)
     ?
      { 'id':"ARI"+next(),
		    'title':'AnalyzedRisk',
        'refCOR':targetRisk.id,
        'refHS':refHS,  // ManagedRisk / AnalyzedRisk are more fine-grained containers for different HazSits
		    'refHarm':jHarm.id, // v4 refHarm is at AnalyzedRisk-level
        'regTarget':jMAR.subjectGroups,
        'risk':jMAR.preRiskEvaluation,
        'refRiskSDA':createPreventiveSDA(jRiskFile,jHarm,refHS,jMAR.name,jMAR.mitigations), // 240124 jHarm was intHarm
        'residualRisk':jMAR.postRiskEvaluation,
      } : {}
    ));

  managedRisks.forEach((jMAR)=>{targetRisk.regAnalyzedRisk.push(jMAR)});

}

function createPreventiveSDA(jRiskFile,jHarm,refHS,strHazSit,regAssurance) {
  let analysis = strHazSit.split(';');
  let strCause=analysis.shift();
  let imdrfAETA = analysis.pop();
  let solution=""
  if(analysis.length>1) solution=analysis.pop();

  let result={
    'id':symbolic(jHarm.id+refHS),
    'goal':(jHarm.name),
    'cause':strCause+"/"+imdrfAETA,
    'problem':analysis.join(' '),
    'argument':"PREVENT",
    'solution':solution,
    'regAssurance':regAssurance
	// capture whether the mitigation is preventive or alleviating
	// by addressing a point in the chain of events
  };
  jRiskFile.relSDA.push(result);
  return result.id;
}

