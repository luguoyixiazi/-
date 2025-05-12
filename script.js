// ==UserScript==
// @name         牧运通自动答题助手
// @namespace    none
// @version      0.0.1
// @description  自动检测题目容器并答题
// @author      none
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    // 全局变量存储已处理题目
    window.processedQuestions = new Set();

    // 创建观察器配置
    const observerConfig = { childList: true, subtree: true };

    // 处理函数
    function handlePaperContentMutation(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const paperContent = document.querySelector('.paper-content');
                if (paperContent && !window.paperContentProcessed) {
                    window.paperContentProcessed = true;

                    // 停止观察器
                    observer.disconnect();

                    // 处理题目逻辑
                    processQuestions(paperContent);
                }
            }
        }
    }

    // 初始化观察器
    const observer = new MutationObserver(handlePaperContentMutation);
    observer.observe(document.body, observerConfig);

    function processQuestions(container) {
        // 获取所有subject容器
        const subjects = container.querySelectorAll('.subject');

        subjects.forEach(subject => {
            // 在每个subject中查找el-card元素
            const questionAndAnswers = subject.querySelectorAll('.el-card.box-card.is-always-shadow');

            questionAndAnswers.forEach(qaContainer => {
                // 提取问题文本（定位到span[style*="word-break: break-all"]）
                const questionSpan = qaContainer.querySelector('span[style*="word-break: break-all"]');
                if (!questionSpan) return;

                const questionText = questionSpan.textContent;

                // 跳过已处理过的题目
                if (window.processedQuestions.has(questionText)) return;
                window.processedQuestions.add(questionText);

                console.log(`处理题目: ${questionText}`);

                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `http://127.0.0.1:13687/get_answer?question=${encodeURIComponent(questionText)}`,
                    onload: function(response) {
                        if (response.status === 200) {
                            const answer = response.responseText;
                            if (answer==="") {
                                console.log("无答案");
                            } else {
                                const result = JSON.parse(response.responseText);
                                const optionsContainer = qaContainer.querySelector('.el-card__body');
                                if (!optionsContainer) return;

                                // 获取所有label元素（答案选项）
                                const labelOptions = optionsContainer.querySelectorAll('label');
                                labelOptions.forEach(option => {
                                    // 提取选项文本
                                    const optionText = String(option.textContent.slice(2));
                                    if (result.includes(optionText)){
                                        option.style.backgroundColor = 'yellow';
                                        setTimeout(()=>{option.click();},1000)
                                        console.log(`已高亮答案: ${questionText}--答案为：${result}--本选项为：${optionText}`);
                                    }

                                });

                            }
                        } else {
                            console.error('请求后端失败:', response.status);
                        }
                    },
                    onerror: function(error) {
                        console.error('网络错误:', error);
                    }
                });
            });
        });
    }
})();
