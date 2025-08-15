// 获取并显示预约列表
async function loadAppointments() {
    try {
        const response = await fetch('/api/my-appointments');
        const result = await response.json();
        
        if (result.success && result.appointments.length > 0) {
            renderAppointments(result.appointments);
            document.getElementById('appointmentsList').classList.remove('hidden');
            document.getElementById('emptyState').classList.add('hidden');
        } else {
            document.getElementById('appointmentsList').classList.add('hidden');
            document.getElementById('emptyState').classList.remove('hidden');
        }
    } catch (error) {
        console.error('获取预约列表失败:', error);
        alert('获取预约信息失败，请刷新页面重试');
    }
}

// 渲染预约列表
function renderAppointments(appointments) {
    const listContainer = document.getElementById('appointmentsList');
    listContainer.innerHTML = '';
    
    appointments.forEach(appointment => {
        // 格式化创建时间
        const createdAt = new Date(appointment.createdAt);
        const formattedCreatedAt = `${createdAt.getFullYear()}-${(createdAt.getMonth() + 1).toString().padStart(2, '0')}-${createdAt.getDate().toString().padStart(2, '0')} ${createdAt.getHours().toString().padStart(2, '0')}:${createdAt.getMinutes().toString().padStart(2, '0')}`;
        
        // 根据状态设置样式和按钮
        let statusClass = '';
        let statusText = '';
        let actionButtons = '';
        
        switch (appointment.status) {
            case 'pending':
                statusClass = 'text-pending bg-pending';
                statusText = '待办理';
                actionButtons = `
                    <div class="flex gap-2 mt-3">
                        <button class="cancel-btn text-red-500 hover:text-red-700 text-sm" data-id="${appointment.id}">
                            <i class="fa fa-times-circle mr-1"></i>取消预约
                        </button>
                        <a href="/" class="text-primary hover:text-primary/80 text-sm">
                            <i class="fa fa-pencil mr-1"></i>修改预约
                        </a>
                    </div>
                `;
                break;
            case 'completed':
                statusClass = 'text-completed bg-completed';
                statusText = '已办理';
                break;
            case 'cancelled':
                statusClass = 'text-cancelled bg-cancelled';
                statusText = '已取消';
                break;
        }
        
        // 创建预约项元素
        const appointmentItem = document.createElement('div');
        appointmentItem.className = 'appointment-item border rounded-lg p-4 hover:shadow-sm transition-custom';
        appointmentItem.setAttribute('data-status', appointment.status);
        
        appointmentItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-medium text-lg">${appointment.serviceTypeName}</h3>
                    <div class="text-sm text-gray-500 mt-1">预约时间: ${formattedCreatedAt}</div>
                </div>
                <span class="${statusClass} px-2 py-1 rounded-full text-xs">${statusText}</span>
            </div>
            
            <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                    <span class="text-gray-500">日期:</span> ${appointment.date}
                </div>
                <div>
                    <span class="text-gray-500">时间:</span> ${appointment.time}
                </div>
                <div>
                    <span class="text-gray-500">地点:</span> ${appointment.location}
                </div>
                <div>
                    <span class="text-gray-500">预约号:</span> ${appointment.id}
                </div>
            </div>
            
            ${actionButtons}
        `;
        
        listContainer.appendChild(appointmentItem);
    });
    
    // 绑定取消预约按钮事件
    bindCancelEvents();
}

// 绑定取消预约事件
function bindCancelEvents() {
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const appointmentId = this.getAttribute('data-id');
            
            if (confirm('确定要取消这个预约吗？')) {
                try {
                    const response = await fetch('/api/cancel-appointment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ appointmentId })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // 重新加载预约列表
                        loadAppointments();
                    }
                } catch (error) {
                    console.error('取消预约失败:', error);
                    alert('取消预约失败，请重试');
                }
            }
        });
    });
}

// 绑定筛选按钮事件
function bindFilterEvents() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // 更新筛选按钮样式
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('bg-gray-100', 'hover:bg-gray-200');
            });
            this.classList.remove('bg-gray-100', 'hover:bg-gray-200');
            this.classList.add('bg-primary', 'text-white');
            
            // 筛选预约项
            document.querySelectorAll('.appointment-item').forEach(item => {
                if (filter === 'all' || item.getAttribute('data-status') === filter) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
            
            // 检查筛选后是否有显示的预约项
            const visibleItems = document.querySelectorAll('.appointment-item:not(.hidden)');
            if (visibleItems.length === 0) {
                document.getElementById('emptyState').classList.remove('hidden');
            } else {
                document.getElementById('emptyState').classList.add('hidden');
            }
        });
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadAppointments();
    bindFilterEvents();
});
