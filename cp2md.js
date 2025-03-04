// ==UserScript==
// @name         网页内容转Markdown
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  将网页选中内容转换为Markdown格式
// @author       Your name
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    // 添加样式
    GM_addStyle(`
        .cp2md-highlight {
            outline: 2px solid #4CAF50 !important;
            outline-offset: 2px !important;
            cursor: pointer !important;
        }

        .cp2md-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            pointer-events: none;
        }

        .cp2md-toast.show {
            opacity: 1;
        }
    `);

    // 显示Toast提示
    function showToast(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.className = 'cp2md-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 强制重绘
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    let isSelecting = false;

    // 添加右键菜单
    document.addEventListener('contextmenu', function(e) {
        if (isSelecting) return;
        const menuItem = document.createElement('div');
        menuItem.textContent = '转换为Markdown';
        
        // 计算菜单尺寸（用于定位）
        const tempMenu = menuItem.cloneNode(true);
        tempMenu.style.cssText = `
            position: fixed;
            visibility: hidden;
            padding: 5px 10px;
        `;
        document.body.appendChild(tempMenu);
        const menuWidth = tempMenu.offsetWidth;
        const menuHeight = tempMenu.offsetHeight;
        tempMenu.remove();

        menuItem.style.cssText = `
            position: fixed;
            left: ${e.clientX - menuWidth}px;
            top: ${e.clientY - menuHeight}px;
            background: white;
            border: 1px solid #ccc;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        menuItem.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            startSelecting();
            menuItem.remove();
        };
        
        document.body.appendChild(menuItem);
        
        // 点击其他地方关闭菜单
        const closeMenu = function() {
            menuItem.remove();
            document.removeEventListener('click', closeMenu);
        };
        document.addEventListener('click', closeMenu);
    });

    function startSelecting() {
        isSelecting = true;
        showToast('请点击要转换的区域，按ESC取消选择');
        
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);
    }

    // 处理鼠标悬停
    function handleMouseOver(e) {
        if (!isSelecting) return;
        e.stopPropagation();
        const target = e.target;
        if (target !== document.body) {
            target.classList.add('cp2md-highlight');
        }
    }

    // 处理鼠标移出
    function handleMouseOut(e) {
        if (!isSelecting) return;
        e.stopPropagation();
        const target = e.target;
        if (target !== document.body) {
            target.classList.remove('cp2md-highlight');
        }
    }

    // 处理点击
    function handleClick(e) {
        if (!isSelecting) return;
        e.preventDefault();
        e.stopPropagation();
        
        try {
            console.group('处理点击事件');
            const target = e.target;
            if (!target || target === document.body) {
                console.log('无效的目标元素');
                console.groupEnd();
                return;
            }

            // 移除所有高亮
            document.querySelectorAll('.cp2md-highlight').forEach(el => {
                el.classList.remove('cp2md-highlight');
            });

            // 直接获取目标元素的HTML
            const originalHtml = target.outerHTML;
            console.log('原始HTML：', originalHtml);
            
            // 转换为Markdown
            const markdown = convertHtmlToMarkdown(originalHtml);
            
            if (markdown) {
                console.log('最终转换结果：', markdown);
                // 确保markdown文本中的特殊字符被正确保留
                const processedMarkdown = markdown
                    .replace(/\r\n/g, '\n')  // 统一换行符
                    .replace(/\n/g, '\r\n'); // 转换为Windows风格换行符
                
                // 使用text/plain格式设置剪贴板
                GM_setClipboard(processedMarkdown, 'text/plain');
                showToast('已复制到剪贴板！');
            } else {
                console.log('转换结果为空');
                showToast('没有找到可转换的内容');
            }
            
            console.groupEnd();
            // 清理事件监听
            cleanup();
        } catch (error) {
            console.error('处理点击事件时出错：', error);
            console.groupEnd();
            showToast('转换过程中出现错误');
            cleanup();
        }
    }

    // 直接从HTML字符串转换为Markdown
    function convertHtmlToMarkdown(html) {
        if (!html) return '';
        
        const container = document.createElement('div');
        container.innerHTML = html;
        
        // 判断是否为标题
        function isHeading(node) {
            if (!node) return 0;
            
            // 1. 检查标签名
            const tagName = node.tagName.toLowerCase();
            if (tagName.match(/^h[1-6]$/)) {
                return parseInt(tagName.charAt(1));
            }
            
            // 2. 检查class名称中的提示
            const className = node.className || '';
            if (className.toLowerCase().includes('title') || 
                className.toLowerCase().includes('heading') ||
                className.toLowerCase().includes('header')) {
                return 1;  // 假定为h1
            }
            
            // 3. 检查计算样式
            const computedStyle = window.getComputedStyle(node);
            const fontSize = parseFloat(computedStyle.fontSize);
            const fontWeight = computedStyle.fontWeight;
            const display = computedStyle.display;
            
            // 4. 检查行内样式
            const style = node.getAttribute('style') || '';
            const inlineFontSize = style.match(/font-size:\s*(\d+)px/);
            if (inlineFontSize) {
                fontSize = parseFloat(inlineFontSize[1]);
            }
            
            // 根据字体大小和粗细判断标题级别
            if (fontSize >= 24 || fontWeight >= 700) return 1;  // h1
            if (fontSize >= 20) return 2;  // h2
            if (fontSize >= 16 && fontWeight >= 600) return 3;  // h3
            
            return 0;  // 不是标题
        }
        
        function processNode(node) {
            if (!node) return '';
            
            try {
                // 处理文本节点
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent || '';
                    return text.trim()
                        .replace(/#+\s+/g, '') // 移除连续的#和空格
                        .replace(/^#+/g, ''); // 移除开头的连续#
                }
                
                // 处理元素节点
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName.toLowerCase();
                    const style = node.getAttribute('style') || '';
                    
                    // 收集所有子节点的内容
                    let content = '';
                    try {
                        content = Array.from(node.childNodes)
                            .map(child => processNode(child))
                            .filter(text => text) // 过滤空文本
                            .join('');
                    } catch (childError) {
                        console.warn('处理子节点时出错：', childError);
                        content = node.innerText || node.textContent || '';
                    }
                    
                    if (!content) return '';
                    
                    // 检查是否为标题
                    const headingLevel = isHeading(node);
                    if (headingLevel > 0) {
                        // 先清理content中可能存在的#号
                        content = content.replace(/^#+\s*/g, '').trim();
                        return `${'#'.repeat(headingLevel)} ${content}\n\n`;
                    }
                    
                    // 处理表格
                    if (tagName === 'table') {
                        let tableContent = '';
                        const rows = Array.from(node.rows);
                        
                        // 处理表头
                        if (rows.length > 0) {
                            const headerRow = rows[0];
                            const headerCells = Array.from(headerRow.cells);
                            const headerContent = headerCells.map(cell => {
                                // 处理单元格内容，将换行符替换为<br>
                                const cellContent = processNode(cell).trim().replace(/\n/g, '<br>');
                                return ` ${cellContent} `;
                            }).join('|');
                            tableContent += '|' + headerContent + '|\n';
                            
                            // 添加分隔行
                            tableContent += '|' + headerCells.map(() => ' --- ').join('|') + '|\n';
                            
                            // 处理数据行
                            for (let i = 1; i < rows.length; i++) {
                                const row = rows[i];
                                const cells = Array.from(row.cells);
                                const rowContent = cells.map(cell => {
                                    // 处理单元格内容，将换行符替换为<br>
                                    const cellContent = processNode(cell).trim().replace(/\n/g, '<br>');
                                    return ` ${cellContent} `;
                                }).join('|');
                                tableContent += '|' + rowContent + '|\n';
                            }
                        }
                        
                        return '\n' + tableContent + '\n';
                    }
                    
                    const isBold = style.includes('font-weight: bold') || 
                                 style.includes('font-weight: 700') || 
                                 tagName === 'strong' || 
                                 tagName === 'b';
                                 
                    const isItalic = style.includes('font-style: italic') || 
                                    tagName === 'em' || 
                                    tagName === 'i';
                                    
                    const isUnderline = style.includes('text-decoration: underline') ||
                                       style.includes('text-decoration-line: underline');
                    
                    if (isBold) content = `**${content}**`;
                    if (isItalic) content = `*${content}*`;
                    if (isUnderline) content = `__${content}__`;
                    
                    if (tagName === 'a' && node.hasAttribute('href')) {
                        const href = node.getAttribute('href');
                        if (href) content = `[${content}](${href})`;
                    }
                    
                    if (tagName === 'code') content = `\`${content}\``;
                    if (tagName === 'pre') content = `\`\`\`\n${content}\n\`\`\``;
                    
                    if (tagName === 'ul' || tagName === 'ol') {
                        return '\n' + content + '\n';
                    }
                    if (tagName === 'li') {
                        const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : 'ul';
                        const listType = parentTag === 'ol' ? '1.' : '-';
                        return `${listType} ${content}\n`;
                    }
                    
                    if (tagName === 'p' || tagName === 'div') {
                        return content + '\n\n';
                    }
                    if (tagName === 'br') {
                        return '\n';
                    }
                    
                    return content;
                }
            } catch (nodeError) {
                console.warn('处理节点时出错：', nodeError);
                return node.innerText || node.textContent || '';
            }
            
            return '';
        }
        
        try {
            let markdown = '';
            for (const child of container.childNodes) {
                markdown += processNode(child);
            }
            
            // 清理和格式化
            markdown = markdown
                .replace(/\n{3,}/g, '\n\n')
                .replace(/\|\n\n/g, '|\n')
                .replace(/\n\n\n+/g, '\n\n')
                .replace(/<br>\s*<br>\s*(<br>\s*)+/g, '<br>') // 合并多个连续的br标签
                .replace(/<br>\s*<br>/g, '<br>') // 合并两个连续的br标签
                .trim();
            
            return markdown;
        } catch (error) {
            console.error('转换Markdown时出错：', error);
            return '';
        }
    }

    // 处理ESC键
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            cleanup();
            showToast('已取消选择');
        }
    }

    // 清理事件监听
    function cleanup() {
        isSelecting = false;
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('mouseout', handleMouseOut);
        document.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeyDown);
        document.querySelectorAll('.cp2md-highlight').forEach(el => {
            el.classList.remove('cp2md-highlight');
        });
    }
})();
