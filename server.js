const express = require('express');
const path = require('path');
const app = express();
const port = 3001;

// 解析JSON请求体
app.use(express.json());

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 路由配置
// 新增预约页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
  console.log('request info: ' ,req)
});

// 我的预约页面
app.get('/my-appointments', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'my-appointments.html'));
});

// 后端API接口 - 提交预约
app.post('/api/submit', (req, res) => {
  const appointmentData = req.body;
  
  // 这里可以添加保存到数据库的逻辑
  console.log('收到新预约:', appointmentData);
  
  // 返回成功响应
  res.json({
    success: true,
    message: '预约成功',
    appointmentId: 'APT' + Date.now() // 生成一个简单的预约ID
  });
});

// 后端API接口 - 获取用户预约列表
app.get('/api/my-appointments', (req, res) => {
  // 模拟从数据库获取的用户预约数据
  const mockAppointments = [
    {
      id: 'APT1620000000001',
      serviceType: '落户',
      serviceTypeName: '办理落户',
      date: '2023-06-15',
      time: '10:00 - 11:00',
      status: 'pending', // pending:待办理, completed:已办理, cancelled:已取消
      location: '人力资源大厅 1号窗口',
      createdAt: '2023-06-10T14:30:00Z'
    },
    {
      id: 'APT1620000000002',
      serviceType: 'entry',
      serviceTypeName: '办理入职',
      date: '2023-06-10',
      time: '09:00 - 10:00',
      status: 'completed',
      location: '人力资源大厅 3号窗口',
      createdAt: '2023-06-05T09:15:00Z'
    }
  ];
  
  res.json({
    success: true,
    appointments: mockAppointments
  });
});

// 后端API接口 - 取消预约
app.post('/api/cancel-appointment', (req, res) => {
  const { appointmentId } = req.body;
  
  // 这里可以添加数据库中取消预约的逻辑
  console.log('取消预约:', appointmentId);
  
  res.json({
    success: true,
    message: '预约已取消'
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
