// nodeJS JSON.parse is a bit careful 
// so we have an issue with [ ] in pay load

import { Buffer } from 'buffer';

const KIMEDS_CORI='riskman:ControlledRisk';
const DISPLAY_ERR = 300;

let rdfaUsage={};
let report = null;

export function getFrom90025() {
    console.log("0500 StartAPI entered");
    report = { 'header':[], 'syntax':[], 'elements':{}, 'inst':[], 'html':[], 'tree':[], 'htmlusage':[], 'rdfausage':[] };
}

export function processHTML(aLines) {

    let jQueue = processLines(aLines);

    let summary='[\n{"comp":"Portal", "func":"drop HTML file", "hazard":"complex computation", "harm":"data not processed", "cause":"strange data", "hazardousSituation":"throws exception" }\n]\n';
    let top = locAll(jQueue,'DIV')[0];

    let device = top;

    let risktable = locAll(top,'DIV')[0];
    console.log('DRF device '+JSON.stringify(device));
    console.log('DRF risk table '+JSON.stringify(Object.keys(risktable)));

     derive(risktable,'RISKMANAGEMENT',{'children':{}},'FILE','ROOT');

    // convert object back to HTML
    let hNode = makeHTML(jQueue,'','ROOT',null,null);
    // side-effect of this is the rule usage information

    let aCollection=null;
    let jInstances=null;

    let strInstances='{ "type":"'+KIMEDS_CORI+'"  '+report.inst.join(' ')+'}\n';
    // report.inst has a comma as a prefix before each item, therefore we have to have a first dummy tag/element pair

    try {
          try {               
               jInstances=JSON.parse(strInstances);

          } catch(e) {
               console.log("0511 reading error\n"+e); 
               console.log(report.inst.join('\n'));
               console.log("0511 ************************");              
          }

         aCollection=[];
         Object.keys(jInstances).forEach((key)=>{
               if(key.startsWith('RIT')) {

                    try {

                         let jCOR = jInstances[key];
                         let strCOR=jCOR?jCOR.title:"HazSit";

                         let jAREL = jCOR?jCOR['riskman:hasAnalyzedRisk']:null;
                         //let strAREL=jAREL?jAREL.title:"ARel?";

                         let jARIS = jAREL?jAREL['riskman:AnalyzedRisk']:null;
                         let strARIS=jAREL?jAREL.title:"ARisk?";

                         let jARID = jARIS?jARIS['riskman:id']:null;
                         let strARID=jARID?jARID.title:"Id?";

                         let jHarm=jARID?jARID['riskman:hasHarm']:"H";
                         let strHarm=jHarm?jHarm.cMDNodeValue:"Harm?";

                         // GH20240719
                         let jSDA = jCOR?jCOR['riskman:hasSDA']:"S";
                         let arrSDA = []; Object.keys(jSDA).forEach((key)=>{if(key.startsWith('SDA')) { let sda=jSDA[key].has.has.has; arrSDA.push(sda['riskman:cause'])}})
                         let strCaus=arrSDA[0].cMDNodeValue;

                         let jHASDOSH=jARID?jARID['riskman:hasDomainSpecificHazard']:null;
                         //list of DOSH



                         Object.keys(jHASDOSH).forEach((doshKey)=>{

                              if(doshKey.startsWith(key)) {
                                   let jDOSH=jHASDOSH[doshKey];

                                   let jCOMP=jDOSH['riskman:hasDeviceComponent'];
                                   let strComp=jCOMP?jCOMP.cMDNodeValue:"Comp?";

                                   let jFUNC=jDOSH['riskman:hasDeviceFunction'];
                                   let strFunc=jFUNC?jFUNC.cMDNodeValue:"Func?";

                                   let jHAZD=jDOSH['riskman:hasHazard'];
                                   let strHazd=jHAZD?jHAZD.cMDNodeValue:"Func?";

          
                                   aCollection.push('{ "func":"'+strFunc+
                                                  '", "comp":"'+strComp+
                                                  '", "hazard":"'+strHazd+
                                                  '", "cause":"'+strCaus+
                                                  '", "hazardousSituation":"'+strCOR+
                                                  '", "harm":"'+strHarm+
                                                  '", "ControlledRisk":"'+key.toString()+
                                                  '", "'+strARIS+'":"'+strARID+
                                                  '"}');
                              }
                         })

                    } catch(e) { console.log("0515 process RIT"+e); }
               }
         })


         // save the report file
         summary='[\n'+aCollection.join(',\n')+'\n]\n';
         console.log("0518 json form:\n"+summary);


    } catch(e) {
         console.log("0513 reading error\n"+e); console.log(strInstances);
    }
     return summary;
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


function processLines(aLines) {


     if(aLines[0].indexOf('DOCTYPE')>0) aLines.shift()
    let nLines=aLines.map((line,number)=>insertLineNumber(line,number));

     let root = buildHTML(nLines.join(''));
     return translate(root);


     function insertLineNumber(line,number) {
           var pos;
           let result='';
           while(line && line.length>0 && (pos=line.indexOf('>'))>=0) {
                result=result+line.substring(0,pos)+' cmdline='+number+'>';
                line=line.substring(pos+1);
           }
           if(line && line.length>0) result=result+line;
           return result;
     }

    // integrate HTML text into DOM
     function buildHTML(html) {
           let tmp = document.createElement('DIV');
           tmp.className = "FIELD MOAM";
           tmp.innerHTML = html;
         return tmp;
    }

    // convert DOM object into javascript object
     function translate(object) {

           let cMDElements = [];
           let result={ };
           if(object) {

                result.cMDNodeType=object.tagName;

                if(object.tagName=='svg'|| object.tagName=='SVG') return null;

                if(!object.children || object.children.length==0) result.cMDNodeValue=object.innerHTML;

                //console.log('tag '+object.tagName);
                if(object.attributes) {
                      let attributes=object.attributes;
                      for (let a = 0; a < attributes.length; a++) {
                        result[attributes[a].name]=attributes[a].value;
                      }
                }
                if(object.children) {
                      let cList=object.children;
                      let cLen=cList.length;

                      for(let i=0;i<cLen;i++) {
                           let child=cList[i];

                           cMDElements.push(translate(child));
                      }
                }
           }
           result.cMDElements=cMDElements;
           return result;
     }
}


//************************************************************************************************ */


function findValue(table,value) {
     let result=[];
     Object.keys(table).forEach((key)=>{
           if(table[key].value==value) result.push(key);
     });
     return result;
}


// ARRAY locAll by tag name
function locAll(jNode,tag) {

     if(!tag || !jNode) return null;

     if(!jNode.cMDElements || jNode.cMDElements.length==0) {
           return null;
     }

     let result = [];
     jNode.cMDElements.forEach((page)=>{ if(page.cMDNodeType==tag) {
                      result.push(page);
                }
     });

     if(result && result.length>0)  return result;

    console.log('locAll can not find '+tag+' below '+jNode.cMDNodeType+ ' in '+JSON.stringify(jNode));


     return null;
}


function reportElement(entity, tableName, jElement, constraint) {

     if(entity) entity.cMDElements.forEach((item)=> {
           let pushFlag=false;

           if(item.cMDNodeType=='MD-NAME') {
                jElement.name=item.cMDNodeValue;
                pushFlag=true;
           }

           if(item.cMDNodeType=='MD-LINE') {
                let title=item.title;
                let name=item.cMDNodeValue;
                if(title && title.length>0 && name && name.length>0) {
                      jElement[title]=name;
                      pushFlag=true;
                }
           }

           if(item.href) {
                jElement.href = item.href;
                pushFlag=true;
           }

     })
}


const RELATIONAL = 0;
const FUNCTIONAL = 1;
const INJECTIVE  = 2;


function get(jPage,tag) {
     let found=jPage.cMDNodeType;
     if(found==tag) {
           report.tree.push('0#get('+tag+')');
        console.log('get finds '+found);
           return jPage;
     }
     else {
        console.log('get finds '+found+'instead of '+tag);
        report.syntax.push('0#?get('+tag+')?');
    }
     return null;
}


//--------------- HTML generator method

// line-breaks in scripts missing

function makeHTML(jQueue,strIndent,parentClass,corLine,inDevice) {
     let currentType = jQueue.cMDNodeType;
     if(!currentType) return '.';
     let closingTag=null;


     let t=currentType.toLowerCase();


     let attributes = [];
     Object.keys(jQueue).
           forEach(attr=>{if(attr=='cMDNodeType' || attr=='cMDElements' || attr=='cMDNodeValue'){} else
                attributes.push(" '"+attr+"'='"+jQueue[attr]+"'")});

     let head = '<'+jQueue.cMDNodeType + attributes.join('');


     // 20231124
     let rdfaClass = jQueue.typeof;
     if(jQueue.property) rdfaClass = jQueue.property;
     if(parentClass) {


           if(rdfaClass) {

                if(!rdfaUsage[parentClass]) rdfaUsage[parentClass]=[rdfaClass]; else {
                     if(!rdfaUsage[parentClass].includes(rdfaClass) && parentClass!=rdfaClass)
                           rdfaUsage[parentClass].push(rdfaClass);
                }
                let conceptRule = conceptGrammar[parentClass];
                if(conceptRule) {
                     if(conceptRule.includes(rdfaClass)) {


                           // inDevice helps skip table headings and footer info
                           if(parentClass=='ROOT' && rdfaClass==conceptRule[0]) { parentClass='DEVICE'; inDevice=rdfaClass; }


                           console.log('DERIVE '+parentClass+' ---> '+rdfaClass);
                           let aParent= parentClass.split(':');
                           let aChild= rdfaClass.split(':');
                           let queue=report.tree;
                           if(queue) queue.push(strIndent+(aParent.length>1 ? aParent[1] : parentClass)+' ----> '+(aChild.length>1 ? aChild[1] : rdfaClass));
                           else eport.syntax.push('DERIVE '+parentClass+'   report.tree EMPTY.')

                      }
                      else if(rdfaClass!=parentClass) report.syntax.push('DERIVE '+parentClass+' !!! '+rdfaClass+ ': NO CONCEPT RULE.')

                      parentClass = rdfaClass;
                }
                else  report.syntax.push('DERIVE '+parentClass+'   CONCEPT UNKNOWN.')


                // controlling report.inst
                // inDevice indicates that the DEVICE content is being accessed - rather than any decorative headers or footers
                // corLine indicates that instance extraction is active
                if(inDevice && rdfaClass === KIMEDS_CORI) {
                      corLine=jQueue.cmdline;
                }
           }


           // extract JSON from original
           if(corLine) {
               // remove HTML tag and nested structures
               let arrAttributes=[];
               Object.keys(jQueue).forEach((key)=>{
                    let b64encoded= Buffer.from(jQueue[key],"utf8").toString('base64');
                    if(key!='cMDNodeType' && key!='cMDElements') arrAttributes.push('"'+key+'":"'+b64encoded+'"');
               });


                // write to report.inst
               let nodeType=jQueue.id; // only structures with an id need to be unique
               if(!nodeType || nodeType.length==0) { nodeType=jQueue.property;  }
               if(!nodeType || nodeType.length==0) { nodeType=jQueue.typeof;  }
               if(!nodeType || nodeType.length==0) { nodeType=jQueue.title;  }
               if(!nodeType || nodeType.length==0) { nodeType="has";  }
               report.inst.push(strIndent+',"'+nodeType+'":{'+arrAttributes.join(','));
               closingTag='}';
           }
     }


     // without elements && no inner value -> short form
     let result = head + ' />';

     if(jQueue.cMDElements && jQueue.cMDElements.length>0)  {

           // with inner value -> no elements
           if(jQueue.cMDNodeValue && jQueue.cMDNodeValue.length>0) return head+ ' >' + jQueue.cMDNodeValue + '</' + jQueue.cMDNodeType + '>';


           // elements and no inner value: recursion
           // smart grammar defines rules for each current node on what might follow as a sub-node
           let elements = jQueue.cMDElements;

           result =  head + ' >' + elements.map((e,i)=>(checkSyntax(jQueue, t ,e.cMDNodeType,parentClass) ?
                makeHTML(e,
                           strIndent+"  ",
                           parentClass,
                           corLine,
                           inDevice)
                : ( currentType +'->'+e.cMDNodeType+'?')
           )).join('') + '\n</' + jQueue.cMDNodeType + '>';

     }
     if(closingTag) report.inst.push(strIndent+closingTag);
     return result;
}


function checkSyntax(jNode,currentType,son,rdfaClass) {

     if(!son) return true; // temporary
     let curr = currentType.toLowerCase();
     let desc = son.toLowerCase();


     // ignore genuine HTML
     if( desc=='a' || desc=='b' || desc=='div' || desc=='html' || desc=='meta' || desc=='p' || desc=='script' || desc=='title' || desc=='h5'
     || desc=='style'|| desc=='input' || desc=='label' || desc=='select'|| desc=='option' || desc=='button'|| desc=='span' ) return true;

     // ignore md-name tag
     if(desc=='md-name') return true;


     if(!htmlGrammar[curr]) {
     report.syntax.push(''+jNode.cmdline+'#UNKNOWN('+curr+')=>'+desc+' syntax  [htmlGrammar]');
           return false;
     }


     let arrRules = htmlGrammar[curr]
     let allKeys = arrRules.map((rule)=>rule.symbol);
     if(allKeys.indexOf(desc)>=0) {

           let match = findRule(curr,desc,rdfaClass);
           if(!match || match.length==0) {

                if(LEARN) {
                     htmlGrammar[curr].push({'void':desc});
                      return true;
                }
             report.syntax.push(''+jNode.cmdline+'#checkSyntax '+curr+' !! '+desc+'/'+rdfaClass+' NO MATCH IN RULE');
                return false;
           }
           return true;

     } else report.syntax.push(''+jNode.cmdline+'/'+rdfaClass+'#checkSyntax '+curr+' ! '+desc+' NO RULE ['+allKeys+'] '+JSON.stringify(jNode).slice(0,DISPLAY_ERR));

     return false;
}


function findRule(curr,desc,rdfaClass) {
     let entry = htmlGrammar[curr];

    if(!entry) {
           console.log('Could not find htmlGrammar for '+curr+'.'+desc+'/'+rdfaClass);
           return null;
     }

     let match = entry.filter((right)=>{ return (desc && right && right.symbol && (desc==right.symbol)
   //    && findProperty(rdfaClass,right)
    )});

     if(match && match.length>0) match[0].count = match[0].count+1;
     return match;
}


function findProperty(rdfaClass,right) {
     return  (!(right.property) || (prop && (rdfaClass.toLowerCase()==right.property.toLowerCase())))
}


function derive(jRoot,strId,jElement,title) {
     if(jRoot) {
          // symbols in uppercase
          // assume multiplicity always *
          let strLeftSymbol = jRoot.cMDNodeType;
          console.log('0520 derive from '+strLeftSymbol);

          try {
               // determine applicable derivations rule
               let arrRightHand = htmlGrammar[strLeftSymbol.toLowerCase()];
               if(arrRightHand && arrRightHand.length>0) {

               arrRightHand.forEach((rule)=>{
                    let strRightSymbol=rule.symbol.toUpperCase();
                    let occurs=rule.occurs;
                    let embedding = locAll(jRoot,strRightSymbol);
                    if(embedding || occurs=='?' || occurs=='*') {

                         if(embedding) {
                              // assume multiplicity always *
                              embedding.forEach((match)=>{

                                   console.log('derive('+strLeftSymbol+') embedded to '+JSON.stringify(embedding[0]).substring(0,DISPLAY_ERR));

                                   let localTitle=title;
                                   let localId=strId;
                                   let localElement=jElement;

                                   if(match.title) {
                                        localTitle=match.title;
                                   } else {
                                        if(match.cMDNodeValue) localTitle=match.cMDNodeValue;
                                        else if(match.cMDElements[0]) {
                                             let eldest=match.cMDElements[0];
                                             localTitle=eldest.cMDNodeValue;
                                        }
                                   }

                                   if(match.id) {
                                        localId=match.id;

                                        // GH20231026
                                        if(!(report.elements[localId])) report.elements[localId]={'id': localId, 'children':{}};
                                        jElement.children[localId]=localTitle;
                                        localElement = report.elements[localId];
                                   }


                                   reportElement( match, localId, localElement, INJECTIVE+FUNCTIONAL);
                                   derive(match, localId, localElement, localTitle);

                              });
                         }

                    } else {
                         if(rule.use && (rule.use=='1' || rule.use=='+')) {
                                report.syntax.push(strLeftSymbol+' does not contain '+rule.symbol.toUpperCase()+ ' in '+JSON.stringify(jRoot).substring(0,DISPLAY_ERR));
                           }
                    }
               });
               } // else console.log('derived TERMINAL '+strLeftSymbol);
          } catch(e) { console.log("0523 HTML parsing "+e); }

     } else console.log('0521 derive?? no jRoot');
}

function cleanSplit(x) { return x.replace(/\u00a0/g,' ').split(';'); }


// symbol = right side, index in sequence of right side, count = usage count in a given device file
const htmlGrammar = {
'div':[{'symbol':'object','count':0,'index':0},{'symbol':'br','count':0,'index':1},{'symbol':'div','count':0,'index':1}],
     'br':[]
}


// NOTATION-1  upperNode:[derivedNode1,...,derivedNodeN]
// NOTATION-2  rule[0][0] = DEVICE's top node !!
const conceptGrammar =
{'ROOT':['riskman:ControlledRisk','riskman:hasAnalyzedRisk','riskman:ControlledRisk','riskman:hasDeviceComponent','riskman:hasDeviceFunction','riskman:hasHarm']
,'DEVICE':['riskman:ControlledRisk']
,'riskman:hasAnalyzedRisk':['riskman:AnalyzedRisk','riskman:hasSDA','riskman:hasResidualRiskLevel']
,'riskman:AnalyzedRisk':['riskman:id']
,'riskman:id':['riskman:hasDomainSpecificHazard','riskman:hasTarget','riskman:hasHazardousSituation','riskman:hasHarm','riskman:hasInitialRiskLevel']
,'riskman:hasDomainSpecificHazard':['riskman:DomainSpecificHazard']
,'riskman:DomainSpecificHazard':['riskman:id','riskman:hasDeviceComponent','riskman:hasDeviceFunction','riskman:hasHazard']
,'riskman:hasTarget':['riskman:Target']
,'riskman:hasInitialRiskLevel':['riskman:RiskLevel']
,'riskman:RiskLevel':['riskman:severity','riskman:probability']
,'riskman:RiskSDA':['riskman:problem','riskman:goal','riskman:cause','riskman:hasSubSDA','riskman:hasImplementationManifest']
,'riskman:hasSubSDA':['riskman:SDA']
,'riskman:hasImplementationManifest':['riskman:ImplementationManifest']
,'riskman:ResidualRiskLevel':['riskman:severity','riskman:probability']
,'riskman:ControlledRisk':['riskman:hasAnalyzedRisk','riskman:hasSDA','riskman:hasResidualRiskLevel']
,'riskman:SDA':['riskman:id']
,'riskman:ImplementationManifest':['riskman:external','riskman:proof']
,'riskman:ControlledRisk':['riskman:hasAnalyzedRisk','riskman:hasSDA','riskman:hasResidualRiskLevel']
,'riskman:ImplementationManifest':['riskman:external','riskman:proof']
,'riskman:Target':[]
,'riskman:hasSDA':['riskman:RiskSDA','riskman:problem','riskman:goal','riskman:cause','riskman:hasSubSDA','riskman:SDA','riskman:hasImplementationManifest','riskman:ImplementationManifest','riskman:id','riskman:external','riskman:proof']
,'riskman:hasResidualRiskLevel':['riskman:ResidualRiskLevel','riskman:severity','riskman:probability']
,'riskman:external':[]
,'riskman:problem':[]
,'riskman:goal':[]
,'riskman:cause':[]
,'riskman:probability':[]
,'riskman:severity':[]
,'riskman:id':['riskman:hasDomainSpecificHazard','riskman:DomainSpecificHazard','riskman:hasDeviceComponent','riskman:hasDeviceFunction','riskman:hasHazard','riskman:hasTarget','riskman:Target','riskman:hasHazardousSituation','riskman:hasHarm','riskman:hasInitialRiskLevel','riskman:RiskLevel','riskman:severity','riskman:probability']
}