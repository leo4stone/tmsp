// ==UserScript==
// @name         flowin样式增强
// @namespace    https://flowin.cn/
// @version      2024-02-29
// @description  try to take over the world!
// @author       You
// @match        https://flowin.cn/*
// @match        https://www.teacherin.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let pageWrapFullWidth={
        status:true,
        style:`.page-body .page-wrap{width:100% !important; max-width:9999px !important;}`
    }
    function pageStyleUpdate(){
        let styleName="myFlowin";
        let styleDomId=`_${styleName}SuperStyle`
        let styleDom=document.head.querySelector(`#`+styleDomId);
        if(!styleDom){
            styleDom=document.createElement('style');
            styleDom.id=styleDomId;
            document.head.appendChild(styleDom);
        }
        styleDom.innerHTML=`
/*着重组件内的段落间距*/
.eeo-tree-outer-box[data-type="e-callout"] p + p{margin:0.8em 0 0 0 !important;}

/*字体修复*/
.ql-container{
font-family:"微软雅黑" !important;
}
body{
font-family:"微软雅黑" !important;
}


/*文档容器最大宽度*/
${pageWrapFullWidth.status?pageWrapFullWidth.style:''}
/*画布最大宽度*/
.eeo-tree-outer-box[data-type="e-board"]{max-width:1280px !important; margin-left:auto !important;margin-right:auto !important;}

/*列表数字强调*/
.serial_number{ font-weight: bold !important; opacity:1 !important; text-shadow:
0px -1px 0px rgba(255,255,255,1),
1px -1px 0px rgba(255,255,255,1),
1px 0px 0px rgba(255,255,255,1),
1px 1px 0px rgba(255,255,255,1),
0px 1px 0px rgba(255,255,255,1),
-1px 1px 0px rgba(255,255,255,1),
-1px 0px 0px rgba(255,255,255,1),
-1px -1px 0px rgba(255,255,255,1),
0px 0px 3px rgba(0,0,0,0.5);
transform: scale(1.2);
}
`
console.log("flowIn样式已增强",pageWrapFullWidth);
    }
    function fullWidthBtnInit(){
        var parentPath='#toolbar-component .toolbar-content .toolbar-list-box'
        var btnParent=document.body.querySelector(parentPath);
        if(!btnParent){
            return false;
        };
        let btnDom=btnParent.querySelector('#myFullWidthSwitch');
        if(btnDom){
            return false;
        }
        btnDom=document.createElement('div');
        btnDom.id='myFullWidthSwitch';
        btnDom.className="toolbar-list-item toolbar-button";
        function btnHtmlUpdate(){
            let btnDomHTML={
                onTrue:{
                    icon:'💻',
                    content:'全宽度已开启'
                },
                onFalse:{
                    icon:'📱',
                    content:'全宽度已关闭'
                }
            }
            btnDom.innerHTML=`
<div class="item-icon">${pageWrapFullWidth.status?btnDomHTML.onTrue.icon:btnDomHTML.onFalse.icon}</div>
<div class="item-content">${pageWrapFullWidth.status?btnDomHTML.onTrue.content:btnDomHTML.onFalse.content}</div>
`
        }
        btnHtmlUpdate();
        btnDom.addEventListener("click",function(){
            pageWrapFullWidth.status = !pageWrapFullWidth.status;
            btnHtmlUpdate();
            pageStyleUpdate();
        },false);
        btnParent.appendChild(btnDom);
        console.log("flowIn全宽度按钮已注入",pageWrapFullWidth);
    }
    setInterval(fullWidthBtnInit,500);
    pageStyleUpdate();
    // Your code here...
})();
