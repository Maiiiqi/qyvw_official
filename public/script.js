// 生成未来7天的日期选项
function generateDateOptions() {
    const dateSelector = document.getElementById('dateSelector');
    dateSelector.innerHTML = '';
    
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // 格式化日期
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
        
        // 创建日期选项元素
        const dateOption = document.createElement('div');
        dateOption.className = `date-option border rounded-lg p-3 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-custom ${i === 0 ? 'border-primary bg-primary/5' : ''}`;
        dateOption.setAttribute('data-date', `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
        
        dateOption.innerHTML = `
            <div class="text-sm text-gray-500">${month}月${day}日</div>
            <div class="font-medium">${weekday}</div>
            ${i === 0 ? '<div class="text-xs text-primary mt-1">今天</div>' : ''}
        `;
        
        // 添加点击事件
        dateOption.addEventListener('click', () => {
            // 移除其他日期的选中状态
            document.querySelectorAll('.date-option').forEach(option => {
                option.classList.remove('border-primary', 'bg-primary/5');
            });
            // 设置当前日期为选中状态
            dateOption.classList.add('border-primary', 'bg-primary/5');
            
            // 更新选中的日期
            updateSelectedDateTime('date', dateOption.getAttribute('data-date'));
        });
        
        dateSelector.appendChild(dateOption);
        
        // 默认选中今天
        if (i === 0) {
            updateSelectedDateTime('date', dateOption.getAttribute('data-date'));
        }
    }
}

// 生成时间段选项
function generateTimeSlots() {
    const timeSlots = document.getElementById('timeSlots');
    timeSlots.innerHTML = '';
    
    // 定义可预约的时间段
    const slots = [
        '09:00 - 10:00',
        '10:00 - 11:00',
        '11:00 - 12:00',
        '13:30 - 14:30',
        '14:30 - 15:30',
        '15:30 - 16:30',
        '16:30 - 17:30'
    ];
    
    slots.forEach((slot, index) => {
        const timeOption = document.createElement('div');
        timeOption.className = `time-option border rounded-lg p-3 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-custom ${index === 0 ? 'border-primary bg-primary/5' : ''}`;
        timeOption.setAttribute('data-time', slot);
        
        timeOption.textContent = slot;
        
        // 添加点击事件
        timeOption.addEventListener('click', () => {
            // 移除其他时间段的选中状态
            document.querySelectorAll('.time-option').forEach(option => {
                option.classList.remove('border-primary', 'bg-primary/5');
            });
            // 设置当前时间段为选中状态
            timeOption.classList.add('border-primary', 'bg-primary/5');
            
            // 更新选中的时间
            updateSelectedDateTime('time', timeOption.getAttribute('data-time'));
        });
        
        timeSlots.appendChild(timeOption);
        
        // 默认选中第一个时间段
        if (index === 0) {
            updateSelectedDateTime('time', timeOption.getAttribute('data-time'));
        }
    });
}

// 从OAuth2的跳转URI中获取code参数
function getCodeFromUri() {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    // 获取code字段的参数
    const code = params.get('code');
    return code;
}

// 获取access_token
function getAccessToken() {
    const coorpId = 'wwe44bdd7846fceb52'; // 替换为你的企业ID
    const appSecret = 'FP7j216jFs4MELVx_23c-ay65wh84UqpqN1Ef90eAlY'; // 替换为你的应用密钥
    // GET方法
    return fetch(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${coorpId}&corpsecret=${appSecret}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Access Token:', data.access_token);
            return data.access_token;
        }
    });
}

// 从企微获取用户姓名
function getUserName() {
    const code = getCodeFromUri();
    if (code) {
        // 获取access_token
        getAccessToken().then(token => {
            if (token) {
                // 调用后端API获取用户信id
                fetch(`https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${token}&code=${code}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // 存储用户ID
                        localStorage.setItem('User Id', data.UserId);
                        console.log('User Id:', data.UserId);   
                        // 调用后端接口获取用户姓名
                        fetch(`https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${token}&userid=${data.UserId}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // 存储用户姓名 
                                localStorage.setItem('userName', data.name);
                                console.log('User Name:', data.name);
                            }
                        });
                    }
                });
            }
        });
    }
}

// 存储选中的日期和时间
const selectedData = {
    serviceType: '',
    date: '',
    time: ''
};

// 更新选中的日期或时间
function updateSelectedDateTime(type, value) {
    selectedData[type] = value;
    
    // 检查是否可以启用提交按钮
    checkSubmitAvailability();
}

// 检查是否可以启用提交按钮
function checkSubmitAvailability() {
    const submitBtn = document.getElementById('submitBtn');
    if (selectedData.serviceType && selectedData.date && selectedData.time) {
        submitBtn.removeAttribute('disabled');
    } else {
        submitBtn.setAttribute('disabled', 'true');
    }
}

// 业务类型选择变化处理
document.getElementById('serviceType').addEventListener('change', function() {
    const serviceType = this.value;
    const datetimeSection = document.getElementById('datetimeSection');
    
    selectedData.serviceType = serviceType;
    
    if (serviceType) {
        // 显示日期时间选择区域并添加动画
        datetimeSection.classList.remove('hidden');
        setTimeout(() => {
            datetimeSection.classList.remove('opacity-0');
        }, 10);
        
        // 生成日期和时间段选项
        generateDateOptions();
        generateTimeSlots();
    } else {
        // 隐藏日期时间选择区域
        datetimeSection.classList.add('opacity-0');
        setTimeout(() => {
            datetimeSection.classList.add('hidden');
        }, 300);
    }
    
    // 检查是否可以启用提交按钮
    checkSubmitAvailability();
});

// 表单提交处理
document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 获取选中的业务类型文本
    const serviceTypeSelect = document.getElementById('serviceType');
    const serviceTypeName = serviceTypeSelect.options[serviceTypeSelect.selectedIndex].text;
    
    // 准备提交的数据
    const formData = {
        serviceType: selectedData.serviceType,
        serviceTypeName: serviceTypeName,
        date: selectedData.date,
        time: selectedData.time,
        timestamp: new Date().toISOString()
    };
    
    try {
        // 模拟提交到后端
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 显示成功消息
            document.getElementById('appointmentForm').classList.add('hidden');
            document.getElementById('successDetails').innerHTML = `
                <p>您已成功预约 <strong>${serviceTypeName}</strong></p>
                <p>日期：${selectedData.date}</p>
                <p>时间：${selectedData.time}</p>
            `;
            document.getElementById('successMessage').classList.remove('hidden');
        }
    } catch (error) {
        console.error('提交预约失败:', error);
        alert('提交预约失败，请重试');
    }
});

// 重新预约按钮点击事件
document.getElementById('resetBtn').addEventListener('click', function() {
    // 重置表单
    document.getElementById('appointmentForm').reset();
    document.getElementById('datetimeSection').classList.add('hidden', 'opacity-0');
    document.getElementById('successMessage').classList.add('hidden');
    document.getElementById('appointmentForm').classList.remove('hidden');
    
    // 重置选中的数据
    selectedData.serviceType = '';
    selectedData.date = '';
    selectedData.time = '';
    
    // 禁用提交按钮
    document.getElementById('submitBtn').setAttribute('disabled', 'true');
});
    