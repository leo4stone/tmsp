// ==UserScript==
// @name         teacherin样式增强
// @namespace    https://flowin.cn/
// @version      2024-02-29
// @description  try to take over the world!
// @author       You
// @match        https://www.teacherin.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function pageStyleUpdate(){
        let styleName="myTeacherin";
        let styleDomId=`_${styleName}SuperStyle`
        let styleDom=document.head.querySelector(`#`+styleDomId);
        if(!styleDom){
            styleDom=document.createElement('style');
            styleDom.id=styleDomId;
            document.head.appendChild(styleDom);
        }
        styleDom.innerHTML=`
/*teacherin容器*/
.course-file-header{ max-width:9999px !important;}
#courseReadContainer>.mx-auto>.mx-auto{width:100% !important; max-width:9999px !important;}
`

    }
    pageStyleUpdate();
    // Your code here...
})();
