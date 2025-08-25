// Background animation
function createParticles() {
    const container = document.getElementById('bgAnimation');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
        container.appendChild(particle);
    }
}

createParticles();

// Page navigation
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showMainPage() { showPage('mainPage'); }
function showHidePage() { showPage('hidePage'); }
function showExtractPage() { showPage('extractPage'); }

// File handling
function handleImageUpload(input, previewId) {
    const file = input.files[0];
    const display = input.nextElementSibling;
    const preview = document.getElementById(previewId);
    
    if (file) {
        display.classList.add('has-file');
        display.innerHTML = `
            <div class="upload-icon" style="color: #00ff00;">✓</div>
            <div>Image selected: ${file.name}</div>
        `;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Steganography functions
function showProgress(progressId, show = true) {
    const progressBar = document.getElementById(progressId);
    const progressFill = progressBar.querySelector('.progress-fill');
    
    if (show) {
        progressBar.style.display = 'block';
        progressFill.style.width = '0%';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressFill.style.width = progress + '%';
        }, 100);
    } else {
        progressBar.style.display = 'none';
    }
}

function showResult(resultId, message, isError = false) {
    const resultDiv = document.getElementById(resultId);
    resultDiv.style.display = 'block';
    resultDiv.className = isError ? 'result-container error' : 'result-container';
    resultDiv.innerHTML = message;
}

async function hideData() {
    const imageInput = document.getElementById('hideImageInput');
    const secretText = document.getElementById('secretText').value;
    const hideBtn = document.getElementById('hideBtn');
    
    if (!imageInput.files[0]) {
        showResult('hideResult', '❌ Please select an image first!', true);
        return;
    }
    
    if (!secretText.trim()) {
        showResult('hideResult', '❌ Please enter some text to hide!', true);
        return;
    }
    
    hideBtn.disabled = true;
    showProgress('hideProgress');
    
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Convert text to binary
            const binaryText = secretText.split('').map(char => 
                char.charCodeAt(0).toString(2).padStart(8, '0')
            ).join('') + '1111111111111110'; // delimiter
            
            let dataIndex = 0;
            
            // Hide data in LSB of RGB channels
            for (let i = 0; i < data.length && dataIndex < binaryText.length; i += 4) {
                for (let j = 0; j < 3 && dataIndex < binaryText.length; j++) {
                    data[i + j] = (data[i + j] & 254) | parseInt(binaryText[dataIndex]);
                    dataIndex++;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Create download link
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'hidden_data_image.png';
                
                setTimeout(() => {
                    showProgress('hideProgress', false);
                    showResult('hideResult', `
                        ✅ Data hidden successfully!<br>
                        <strong>Message length:</strong> ${secretText.length} characters<br>
                        <strong>Download your encoded image:</strong><br>
                        <button class="btn" onclick="this.parentElement.querySelector('a').click()" style="margin-top: 10px;">
                            Download Image
                        </button>
                        <a href="${url}" download="hidden_data_image.png" style="display: none;"></a>
                    `);
                    hideBtn.disabled = false;
                }, 1500);
            });
        };
        
        img.src = URL.createObjectURL(imageInput.files[0]);
        
    } catch (error) {
        showProgress('hideProgress', false);
        showResult('hideResult', '❌ Error processing image. Please try again.', true);
        hideBtn.disabled = false;
    }
}

async function extractData() {
    const imageInput = document.getElementById('extractImageInput');
    const extractBtn = document.getElementById('extractBtn');
    
    if (!imageInput.files[0]) {
        showResult('extractResult', '❌ Please select an image first!', true);
        return;
    }
    
    extractBtn.disabled = true;
    showProgress('extractProgress');
    
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let binaryText = '';
            
            // Extract LSB from RGB channels
            for (let i = 0; i < data.length; i += 4) {
                for (let j = 0; j < 3; j++) {
                    binaryText += (data[i + j] & 1).toString();
                }
            }
            
            // Convert binary to text
            let extractedText = '';
            for (let i = 0; i < binaryText.length; i += 8) {
                const byte = binaryText.substr(i, 8);
                if (byte.length < 8) break;
                
                const charCode = parseInt(byte, 2);
                const char = String.fromCharCode(charCode);
                
                // Check for delimiter
                if (char === '\u000e') break;
                
                extractedText += char;
            }
            
            // Clean up extracted text
            const delimiterIndex = extractedText.indexOf('\u000e');
            if (delimiterIndex !== -1) {
                extractedText = extractedText.substring(0, delimiterIndex);
            }
            
            setTimeout(() => {
                showProgress('extractProgress', false);
                
                if (extractedText.trim()) {
                    showResult('extractResult', `
                        ✅ Hidden data found!<br>
                        <strong>Extracted Message:</strong>
                        <div class="extracted-text">${extractedText}</div>
                        <button class="btn" onclick="copyToClipboard('${extractedText.replace(/'/g, "\\'")}', this)" style="margin-top: 15px;">
                            Copy Text
                        </button>
                    `);
                } else {
                    showResult('extractResult', '⚠️ No hidden data found in this image.', true);
                }
                
                extractBtn.disabled = false;
            }, 1500);
        };
        
        img.src = URL.createObjectURL(imageInput.files[0]);
        
    } catch (error) {
        showProgress('extractProgress', false);
        showResult('extractResult', '❌ Error processing image. Please try again.', true);
        extractBtn.disabled = false;
    }
}

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.background = 'linear-gradient(45deg, #00ff00, #008000)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(45deg, #00ffff, #0080ff)';
        }, 2000);
    });
}