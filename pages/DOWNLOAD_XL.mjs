// load an XLSX file from the server storage

const HTTP_OK     = 200;
const HTTP_WRONG  = 400;

import { openHBook } from "../src/readXL.js/index.js"


function getURLParams(req) {
  let result={};
  let url = JSON.stringify(req.url).replace(/[\",;]/g, '');
  console.log("0210 DOWNLOAD getParams from "+url);
  if(url && url.length>0) (url.split('?')[1]).split('&').forEach((entry,i)=>{let aE=entry.split('=');result[aE[0]]=aE[1]});
  return result;
}


function timeSymbol() { 
  var u = new Date(Date.now()); 
  return ''+ u.getUTCFullYear()+
    ('0' + (1+u.getUTCMonth())).slice(-2) +
    ('0' + u.getUTCDate()).slice(-2) + 
    ('0' + u.getUTCHours()).slice(-2) +
    ('0' + u.getUTCMinutes()).slice(-2) +
    ('0' + u.getUTCSeconds()).slice(-2) +
    (u.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
}


export async function handler(
    req, //: NextApiRequest,
    res//: NextApiResponse<any>
  ) {
    let strTimeSymbol = timeSymbol();
    console.log("\n\n0600 DOWNLOAD at "+strTimeSymbol);

    const params = getURLParams(req);
    console.log("0620 app.post DOWNLOAD with "+JSON.stringify(params));
    const file = params.file;
    

    console.log("0630 app.post DOWNLOAD with "+file);
    
    let num=0;
    if(file && file.length>3) {

        res.writeHead(HTTP_OK, {"Content-Type": "text/plain;charset=utf-8"});

        let arrLines = openHBook(file);
        res.write(arrLines.join('\n'));

        /* EXAM-X
        arrLines.forEach((line,n)=>{
          num++;
          if(num<60) console.log(line); // EXAM-X
        });      
        */
        console.dir ( "0632 DOWNLOAD FILE with "+arrLines.length+" lines.");

    } else {
      console.dir ( "0631 DOWNLOAD EMPTY FILE "+file);
      res.writeHead(HTTP_WRONG, {"Content-Type": "text/html"});
    }

    res.write('\n\n');
    res.write('\n\n');
    res.end(); 
}

//module.exports = { handler };

function handleJSONSave(jContent) {
        
  /*
  const  b64encoded= Buffer.from(strJustification,"utf8").toString('base64');

  let anchor = document.getElementById('table0');
  if(anchor) {
      const newDiv = document.createElement('div');
      newDiv.innerText = b64encoded;
      anchor.appendChild(newDiv);
  }
  */
  const manufacturer="manufacturer";
  const product="peoduct";
  const version="version"

  const rqHeaders = {  'Accept': 'application/octet-stream',
                          'Access-Control-Allow-Origin':'*',
                          'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept, Authorization' };

  
  const rqOptions = { method: 'GET', headers: rqHeaders, mode:'cors'};
  try {                
      fetch(`${REACT_APP_API_HOST}/RISKTABLE?manufacturer=${manufacturer}&product=${product}&version=${version}`, rqOptions)
      .then((response) => response.blob())
      .then((blob) => URL.createObjectURL(blob))
      .then((url) => console.log("0766 handleJSONSave URL= "+ makeJSONButton(url,manufacturer,product,version)))
      .catch((err) => console.error("0765 handleJSONSave fetch ERR "+err));           
  } catch(err) { console.log("0767 GET /EXCEL handleJSONSave:"+err);}
  console.log("0878 handleJSONSave EXIT");
}
