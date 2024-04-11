// ==UserScript==
// @name         Claude AI 中文符合批量替换
// @namespace    http://tampermonkey.net/
// @version      2024-04-11
// @description  try to take over the world!
// @author       You
// @match        https://claude.ai/chat/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=claude.ai
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // 定义符号替换函数
    function replacePunctuation(text) {
        const punctuationMap = {
            ',': '，',
            '.': '。',
            ';': '；',
            ':': '：',
            '?': '？',
            '!': '！',
            '"': '"',
            "'": "'",
            '(': '（',
            ')': '）',
            '[': '【',
            ']': '】',
            '{': '｛',
            '}': '｝',
            '<': '《',
            '>': '》',
            '~': '～'
        };

        return text.replace(/[,.;:?!"'()\[\]{}<>~]/g, function(match) {
            return punctuationMap[match];
        });
    }

    // 创建toast元素
    function createToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.padding = '10px';
        toast.style.borderRadius = '5px';
        document.body.appendChild(toast);
        return toast;
    }
    document.addEventListener('click', function(event) {
        const target = event.target;
        if (target && typeof target.innerHTML === 'string' && target.innerHTML.toLowerCase().includes('copy')) {
            // 延迟执行,等待剪贴板更新
            setTimeout(function() {
                navigator.clipboard.readText().then(function(text) {
                    const toast = createToast('复制了新内容,按下c将复制的内容中的符号替换为中文符号');

                    // 监听窗口按键事件
                    const handleKeyPress = function(event) {
                        if (event.key === 'c') {
                            const processedText = replacePunctuation(text);
                            navigator.clipboard.writeText(processedText).then(function() {
                                toast.textContent = '剪贴板已更新';
                                setTimeout(function() {
                                    toast.remove();
                                }, 1000);
                            });
                            window.removeEventListener('keypress', handleKeyPress);
                        }
                    };

                    window.addEventListener('keypress', handleKeyPress);

                    // 如果用户没有按下c,两秒后移除监听事件和toast
                    setTimeout(function() {
                        window.removeEventListener('keypress', handleKeyPress);
                        toast.remove();
                    }, 2000);
                });
            }, 100);
        }
    });

    // Your code here...
})();
