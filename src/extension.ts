    import * as vscode from 'vscode';
    import axios from 'axios';

    export function activate(context: vscode.ExtensionContext) {
        console.log('AI Chatbot extension is now active!');

        let panel: vscode.WebviewPanel | undefined = undefined;
        let chatHistory: string[] = [];

        let disposable = vscode.commands.registerCommand('temen-ngoding-kamu.chattime', async () => {
            if (!panel) {
                panel = vscode.window.createWebviewPanel(
                    'chatbotResponse',
                    'AI Chatbot Response',
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );

                panel.onDidDispose(() => {
                    panel = undefined;
                }, null, context.subscriptions);

                panel.webview.onDidReceiveMessage(handleWebviewMessage, undefined, context.subscriptions);
            }

            panel.reveal(vscode.ViewColumn.One);
            updateWebviewContent();
        });

        context.subscriptions.push(disposable);

        async function handleWebviewMessage(message: any) {
            if (message.command === 'newPrompt') {
                await processUserMessage(message.text);
            }
        }

        async function processUserMessage(userMessage: string) {
            const userMessageHtml = createMessageHTML('user', userMessage);
            chatHistory.push(userMessageHtml);
            updateWebviewContent();
        
            const model = 'yeoji-3';
            const apiUrl = 'https://eanyariapiyeh.com';
        
            try {
                panel?.webview.postMessage({ command: 'showTypingIndicator' });
        
                // Gabungkan semua pesan sebelumnya dan pesan baru
                const fullContext = chatHistory
                    .map(msg => {
                        const match = msg.match(/<div class="message-content">(.*?)<\/div>/s);
                        return match ? match[1] : '';
                    })
                    .filter(content => content.trim() !== '')
                    .join('\n\n') + '\n\n' + userMessage;
        
                const response = await axios.get(apiUrl, {
                    params: {
                        model: model,
                        q: fullContext
                    }
                });
        
                if (response.data.status === 'success' && response.data.code === 200) {
                    const aiResponse = response.data.data.response;
                    const aiMessageHtml = createMessageHTML('ai', aiResponse);
                    chatHistory.push(aiMessageHtml);
                    panel?.webview.postMessage({ command: 'animateNewMessage', message: aiResponse, sender: 'ai' });
                } else {
                    vscode.window.showErrorMessage('Error: Chatbot gagal merespon.');
                }
            } catch (error) {
                vscode.window.showErrorMessage('Gagal terhubung ke API chatbot.');
            } finally {
                panel?.webview.postMessage({ command: 'hideTypingIndicator' });
                updateWebviewContent();
            }
        }
        

        function createMessageHTML(sender: 'user' | 'ai', content: string): string {
            const avatarUrl = `https://ui-avatars.com/api/?name=${sender === 'user' ? 'User' : 'AI'}&background=random`;
            const messageClass = sender === 'user' ? 'user-message' : 'ai-message';
            
            const formattedContent = sender === 'ai' && content.includes('```')
                ? formatCodeSnippet(content)
                : content;

            return `
                <div class="message ${messageClass}" style="opacity: 0;">
                    <img src="${avatarUrl}" alt="${sender} Avatar" class="avatar">
                    <div class="message-content">${formattedContent}</div>
                </div>
            `;
        }

        function formatCodeSnippet(content: string): string {
            return content.replace(/```([\s\S]*?)```/g, (match, code) => {
                return `<pre><code>${code.trim()}</code><button class="copy-button">Copy</button></pre>`;
            });
        }

        function updateWebviewContent() {
            if (panel) {
                panel.webview.html = getWebviewContent(chatHistory);
            }
        }

        function getWebviewContent(chatHistory: string[]): string {
            const chatMessages = chatHistory.join('');
            return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Chatbot Response</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f0f2f5;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                    }
                    .chat-header {
                        background-color: #ffffff;
                        padding: 15px;
                        text-align: center;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        animation: slideDown 0.5s ease-out;
                    }
                    @keyframes slideDown {
                        from { transform: translateY(-100%); }
                        to { transform: translateY(0); }
                    }
                    .chat-header h1 {
                        margin: 0;
                        color: #00695c;
                        font-size: 1.5em;
                    }
                    #chat-container {
                        flex-grow: 1;
                        display: flex;
                        flex-direction: column;
                        padding: 20px;
                        overflow-y: auto;
                        background-color: #e0f7fa;
                    }
                    .message {
                        display: flex;
                        margin-bottom: 15px;
                        align-items: flex-start;
                        animation: fadeIn 0.5s ease-out;
                        opacity: 1;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .message-content {
                        max-width: 60%;
                        padding: 10px 15px;
                        border-radius: 18px;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                        font-size: 0.9em;
                        line-height: 1.4;
                    }
                    .ai-message .message-content {
                        background-color: #ffffff;
                        color: #1a1a1a;
                        border-top-left-radius: 0;
                    }
                    .user-message {
                        flex-direction: row-reverse;
                    }
                    .user-message .message-content {
                        background-color: #b2dfdb;
                        color: #004d40;
                        border-top-right-radius: 0;
                    }
                    .avatar {
                        width: 35px;
                        height: 35px;
                        border-radius: 50%;
                        margin: 0 10px;
                        animation: bounceIn 0.5s;
                    }
                    @keyframes bounceIn {
                        0% { transform: scale(0); }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(1); }
                    }
                    pre {
                        background-color: #333;
                        color: #eee;
                        padding: 10px;
                        border-radius: 8px;
                        white-space: pre-wrap;
                        position: relative;
                    }
                    .copy-button {
                        position: absolute;
                        top: 5px;
                        right: 10px;
                        background-color: #555;
                        color: #fff;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 5px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }
                    .copy-button:hover {
                        background-color: #777;
                    }
                    #input-section {
                        display: flex;
                        padding: 15px;
                        background-color: #f0f0f0;
                        border-top: 1px solid #ddd;
                        animation: slideUp 0.5s ease-out;
                    }
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                    #input-box {
                        flex-grow: 1;
                        padding: 12px;
                        border: none;
                        border-radius: 20px;
                        font-size: 1em;
                        outline: none;
                        background-color: #e0f2f1;
                        transition: box-shadow 0.3s ease;
                    }
                    #input-box:focus {
                        box-shadow: 0 0 0 2px #26a69a;
                    }
                    #send-button {
                        background-color: #26a69a;
                        color: white;
                        border: none;
                        padding: 0 20px;
                        margin-left: 10px;
                        border-radius: 20px;
                        font-size: 1em;
                        cursor: pointer;
                        transition: transform 0.1s ease;
                    }
                    #send-button:active {
                        transform: scale(0.95);
                    }
                    .typing-indicator {
                        display: none;
                        padding: 10px;
                        background-color: #f0f0f0;
                        border-radius: 18px;
                        margin-bottom: 15px;
                        animation: fadeIn 0.5s;
                    }
                    .typing-indicator span {
                        height: 10px;
                        width: 10px;
                        float: left;
                        margin: 0 1px;
                        background-color: #9E9EA1;
                        display: block;
                        border-radius: 50%;
                        opacity: 0.4;
                    }
                    .typing-indicator span:nth-of-type(1) {
                        animation: 1s blink infinite 0.3333s;
                    }
                    .typing-indicator span:nth-of-type(2) {
                        animation: 1s blink infinite 0.6666s;
                    }
                    .typing-indicator span:nth-of-type(3) {
                        animation: 1s blink infinite 0.9999s;
                    }
                    @keyframes blink {
                        50% {
                            opacity: 1;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="chat-header">
                    <h1>TNK</h1>
                </div>
                <div id="chat-container">
                    ${chatMessages}
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <div id="input-section">
                    <input type="text" id="input-box" placeholder="Coba tanyain ig nya dia deh kali aja tau..." />
                    <button id="send-button">Kirim</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function sendMessage() {
                        const inputBox = document.getElementById('input-box');
                        const userMessage = inputBox.value.trim();
                        if (userMessage === '') return;

                        vscode.postMessage({ command: 'newPrompt', text: userMessage });

                        inputBox.value = '';
                    }

                    document.getElementById('send-button').addEventListener('click', sendMessage);
                    document.getElementById('input-box').addEventListener('keydown', function(event) {
                        if (event.key === 'Enter') {
                            sendMessage();
                        }
                    });

                    document.addEventListener('click', function(event) {
                        if (event.target.classList.contains('copy-button')) {
                            const codeBlock = event.target.previousElementSibling.textContent;
                            navigator.clipboard.writeText(codeBlock).then(() => {
                                event.target.textContent = 'Copied!';
                                setTimeout(() => {
                                    event.target.textContent = 'Copy';
                                }, 2000);
                            }).catch(err => {
                                console.error('Failed to copy: ', err);
                            });
                        }
                    });

                    function scrollToBottom() {
                        const chatContainer = document.getElementById('chat-container');
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }

                    scrollToBottom();

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'showTypingIndicator':
                                document.querySelector('.typing-indicator').style.display = 'block';
                                scrollToBottom();
                                break;
                            case 'hideTypingIndicator':
                                document.querySelector('.typing-indicator').style.display = 'none';
                                scrollToBottom();
                                break;
                            case 'animateNewMessage':
                                if (message.sender === 'ai') {
                                    const lastMessage = document.querySelector('.message:last-child');
                                    if (lastMessage) {
                                        const content = lastMessage.querySelector('.message-content');
                                        content.innerHTML = '';
                                        let i = 0;
                                        const intervalId = setInterval(() => {
                                            if (i < message.message.length) {
                                                content.innerHTML += message.message[i];
                                                scrollToBottom();
                                                i++;
                                            } else {
                                                clearInterval(intervalId);
                                            }
                                        }, 20);
                                    }
                                }
                                break;
                        }
                    });

                    document.querySelectorAll('.message').forEach(msg => {
                        msg.style.opacity = '1';
                    });
                </script>
            </body>
            </html>
            `;
        }
    }

    export function deactivate() {} 
