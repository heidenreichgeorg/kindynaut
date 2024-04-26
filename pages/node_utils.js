

export function getURLParams(req) {
    let result={};
    let url = JSON.stringify(req.url).replace(/[\",;]/g, '');
    console.log("0210 getURLParams from "+url);
    if(url && url.length>0) (url.split('?')[1]).split('&').forEach((entry)=>{let aE=entry.split('=');result[aE[0]]=aE[1]});
    return result;
}


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
  