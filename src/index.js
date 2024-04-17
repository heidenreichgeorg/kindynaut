import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { Portal } from './Portal.js'


function getURLParams(query) {
    let result={};
    console.log("0000 index.js getURLParams from q="+query);
    let url = JSON.stringify(query).replace(/[\",;]/g, '');
    console.log("0010 index.js getURLParams from u="+url);
    if(url && url.length>0) (url.split('?')[1]).split('&').forEach((entry,i)=>{let aE=entry.split('=');result[aE[0]]=aE[1]});
    return result;
}

const params =  getURLParams(window.location.search);

const root = ReactDOM.createRoot(document.getElementById('root'));

// file parameter only used for FILES windows


root.render(    <Portal portalFileName={params.file} view={params.view} />   );

