// 全局存储用户信息和access_token
const globalData = {
    userId: null,
    userName: null,
    accessToken: null
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 1. 从URL提取code（企业微信授权后带回）
    const code = getCodeFromUri();
    if (code) {
        // 2. 通过后端接口获取用户信息（避免前端暴露敏感信息）
        initUserInfo(code);
    } else {
        // 无code时提示需要在企业微信中打开（跳转授权流程）
        document.getElementById('userStatus').textContent = '请在企业微信客户端中打开';
        document.getElementById('userLoading').classList.add('hidden');
    }
});

// 1. 从URL中提取code参数（企业微信授权回调带回）
function getCodeFromUri() {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    return params.get('code'); // 返回code或null
}

// 2. 初始化用户信息（通过后端接口中转，安全获取）
function initUserInfo(code) {
    // 调用后端接口获取用户信息（后端负责调用企业微信API）
    fetch(`/api/get-user-info?code=${code}`)
        .then(response => {
            if (!response.ok) throw new Error('获取用户信息失败');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // 存储用户信息
                globalData.userId = data.userId;
                globalData.userName = data.userName;
                globalData.accessToken = data.accessToken; // 可选：存储token用于后续接口调用
                
                // 显示用户信息
                document.getElementById('userStatus').textContent = `当前登录：${data.userName}`;
                document.getElementById('userLoading').classList.add('hidden');
            } else {
                throw new Error(data.message || '用户信息解析失败');
            }
        })
        .catch(error => {
            console.error('用户信息初始化失败：', error);
            document.getElementById('userStatus').textContent = '登录失败，请重试';
            document.getElementById('userLoading').classList.add('hidden');
        });
}

// 3. 生成未来7天的日期选项
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
            document.querySelectorAll('.date-option').forEach(option => {
                option.classList.remove('border-primary', 'bg-primary/5');
            });
            dateOption.classList.add('border-primary', 'bg-primary/5');
            updateSelectedDateTime('date', dateOption.getAttribute('data-date'));
        });
        
        dateSelector.appendChild(dateOption);
        
        // 默认选中今天
        if (i === 0) {
            updateSelectedDateTime('date', dateOption.getAttribute('data-date'));
        }
    }
}

// 4. 生成时间段选项
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
            document.querySelectorAll('.time-option').forEach(option => {
                option.classList.remove('border-primary', 'bg-primary/5');
            });
            timeOption.classList.add('border-primary', 'bg-primary/5');
            updateSelectedDateTime('time', timeOption.getAttribute('data-time'));
        });
        
        timeSlots.appendChild(timeOption);
        
        // 默认选中第一个时间段
        if (index === 0) {
            updateSelectedDateTime('time', timeOption.getAttribute('data-time'));
        }
    });
}

// 5. 存储选中的日期和时间
const selectedData = {
    serviceType: '',
    date: '',
    time: ''
};

// 6. 更新选中的日期或时间
function updateSelectedDateTime(type, value) {
    selectedData[type] = value;
    checkSubmitAvailability();
}

// 7. 检查是否可以启用提交按钮
function checkSubmitAvailability() {
    const submitBtn = document.getElementById('submitBtn');
    // 必须选择业务类型、日期、时间，且已获取用户信息
    if (selectedData.serviceType && selectedData.date && selectedData.time && globalData.userId) {
        submitBtn.removeAttribute('disabled');
    } else {
        submitBtn.setAttribute('disabled', 'true');
    }
}

// 8. 业务类型选择变化处理
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
    
    checkSubmitAvailability();
});

// 9. 表单提交处理（包含用户信息）
document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 获取选中的业务类型文本
    const serviceTypeSelect = document.getElementById('serviceType');
    const serviceTypeName = serviceTypeSelect.options[serviceTypeSelect.selectedIndex].text;
    
    // 准备提交的数据（包含用户ID，关联预约人）
    const formData = {
        ...selectedData,
        serviceTypeName,
        userId: globalData.userId,
        userName: globalData.userName,
        timestamp: new Date().toISOString()
    };
    
    try {
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
                <p>预约人：${globalData.userName}</p>
                <p>您已成功预约 <strong>${serviceTypeName}</strong></p>
                <p>日期：${selectedData.date}</p>
                <p>时间：${selectedData.time}</p>
                <p>预约ID：${result.appointmentId}</p>
            `;
            document.getElementById('successMessage').classList.remove('hidden');
        } else {
            throw new Error(result.message || '提交失败');
        }
    } catch (error) {
        console.error('提交预约失败:', error);
        alert('提交预约失败：' + error.message);
    }
});

// 10. 重新预约按钮点击事件
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
