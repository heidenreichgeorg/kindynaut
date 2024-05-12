export const FILE_SLASH = '/';

export const BASE_FILE = "/base.txt"



export function getURLParams(req) {
    let result={};
    let url = JSON.stringify(req.url).replace(/[\",;]/g, '');
    console.log("0210 getURLParams from "+url);
    if(url && url.length>0) (url.split('?')[1]).split('&').forEach((entry)=>{let aE=entry.split('=');result[aE[0]]=aE[1]});
    return result;
}


export function dateSymbol() { 
    var u = new Date(Date.now()); 
    return ''+ u.getUTCFullYear()+
      ('0' + (1+u.getUTCMonth())).slice(-2) +
      ('0' + u.getUTCDate()).slice(-2) 
  }
  
  
export function timeSymbol() { 
    var u = new Date(Date.now()); 
    return ''+
      ('0' + u.getUTCHours()).slice(-2) +
      ('0' + u.getUTCMinutes()).slice(-2) +
      ('0' + u.getUTCSeconds()).slice(-2) +
      (u.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
  }
  
  
export function simpleKey(pat) {

    const cypher = "192837465091827364529630741857";

    let base=cypher.length;
    var res = 0;
    var out = [];
    if(pat)
    {
        let tap = pat.split('').reverse().join('');        
        var sequence = tap+pat+tap+pat+tap+pat;

        let factor = 33;
        for(let p=0;p<sequence.length && p<128;p++) {
            res = ((res + (sequence.charCodeAt((p*7)%base))*factor) & 0x1FFFFFFF);
            let index = res % base;
            out.push(cypher.charAt(index))
        }
        return out.join('');
    }
    else return "defaultKey";    
}

export function makeKey(pat) {
    let net=simpleKey(pat);
    let simple=net+(net.split('').reverse().join(''));
    let len = simple.length;
    let key = len;

    if(len> 5) key+=  3*parseInt(simple.slice( 0, 5));
    if(len> 6) key+=101*parseInt(simple.slice( -6));        
    if(len>21) key+= 11*parseInt(simple.slice(18,21));
    if(len>39) key+= 37*parseInt(simple.slice(36,39));
    
    return key;
}

