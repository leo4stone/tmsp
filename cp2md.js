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
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
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
            const target = e.target;
            if (!target || target === document.body) {
                return;
            }

            // 移除所有高亮
            document.querySelectorAll('.cp2md-highlight').forEach(el => {
                el.classList.remove('cp2md-highlight');
            });

            // 直接获取目标元素的HTML
            const originalHtml = target.outerHTML;
            
            // 转换为Markdown
            const markdown = convertHtmlToMarkdown(originalHtml);
            
            if (markdown) {
                // 确保markdown文本中的特殊字符被正确保留
                const processedMarkdown = markdown
                    .replace(/\r\n/g, '\n')  // 统一换行符
                    .replace(/\n/g, '\r\n'); // 转换为Windows风格换行符
                
                // 使用text/plain格式设置剪贴板
                GM_setClipboard(processedMarkdown, 'text/plain');
                showToast('已复制到剪贴板！');
            } else {
                showToast('没有找到可转换的内容');
            }
            
            // 清理事件监听
            cleanup();
        } catch (error) {
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
            
            let result = 0;
            
            // 1. 检查标签名 (最高优先级)
            const tagName = node.tagName.toLowerCase();
            
            if (tagName.match(/^h[1-6]$/)) {
                const level = parseInt(tagName.charAt(1));
                return level;
            }
            
            // 2. 检查class名称中的提示
            const className = node.className || '';
            
            let classNameLevel = 0;
            if (className.toLowerCase().includes('title') || 
                className.toLowerCase().includes('heading') ||
                className.toLowerCase().includes('header')) {
                
                // 尝试从类名中提取更精确的标题级别
                const headingMatch = className.match(/heading-h(\d)/i) || className.match(/h(\d)-heading/i) || className.match(/h(\d)/i);
                if (headingMatch && headingMatch[1]) {
                    classNameLevel = parseInt(headingMatch[1]);
                    if (classNameLevel >= 1 && classNameLevel <= 6) {
                        // 有效的标题级别
                    } else {
                        classNameLevel = 1; // 默认为h1
                    }
                } else {
                    classNameLevel = 1; // 默认为h1
                }
            }
            
            // 3. 检查计算样式和行内样式 (最高优先级)
            let fontSize = 0;
            let fontWeight = 'normal';
            try {
                // 如果节点不在文档中，临时将其添加到文档中以获取正确的计算样式
                let needsToBeAdded = !document.contains(node);
                let tempParent;
                if (needsToBeAdded) {
                    tempParent = document.createElement('div');
                    tempParent.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
                    tempParent.appendChild(node.cloneNode(true));
                    document.body.appendChild(tempParent);
                }

                const computedStyle = window.getComputedStyle(needsToBeAdded ? tempParent.firstChild : node);
                fontSize = parseFloat(computedStyle.fontSize) || 16; // 如果获取失败，使用默认值16px
                fontWeight = computedStyle.fontWeight || 'normal';

                if (needsToBeAdded && tempParent) {
                    document.body.removeChild(tempParent);
                }
            } catch (error) {
                fontSize = 16; // 发生错误时使用默认值
            }
            
            // 4. 检查行内样式
            const style = node.getAttribute('style') || '';
            const inlineFontSize = style.match(/font-size:\s*(\d+)px/);
            
            if (inlineFontSize) {
                fontSize = parseFloat(inlineFontSize[1]);
            }
            
            // 根据字体大小判断标题级别
            let fontSizeLevel = 0;
            if (fontSize >= 30) {
                fontSizeLevel = 1;
            }
            else if (fontSize >= 20) {
                fontSizeLevel = 2;
            }
            else if (fontSize >= 16 && (fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight) >= 600)) {
                fontSizeLevel = 3;
            }
            
            // 优先使用字体大小判断的结果
            if (fontSizeLevel > 0) {
                result = fontSizeLevel;
            } 
            // 如果字体大小判断不出结果，但类名判断有结果，则使用类名判断的结果
            else if (classNameLevel > 0) {
                result = classNameLevel;
            }
            
            return result;
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
