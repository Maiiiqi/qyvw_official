// 优先加载环境变量（必须放在最顶部）
require('dotenv').config();
if (!process.env.CORP_ID || !process.env.CORP_SECRET) {
  console.error('错误：请在.env文件中配置CORP_ID和CORP_SECRET');
  process.exit(1); // 缺少关键配置时退出服务
}

// 引入依赖
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios'); // 之前遗漏的依赖引入
const app = express();

// 配置端口和环境变量
const port = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV === 'development';

// 第三方API配置（从环境变量读取，避免硬编码）
const THIRD_PARTY_CONFIG = {
  corpId: process.env.CORP_ID,
  corpSecret: process.env.CORP_SECRET,
  accessTokenUrl: 'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
  userInfoUrl: 'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo',
  // userDetailUrl: 'https://qyapi.weixin.qq.com/cgi-bin/user/get'
};

// 缓存access_token
let accessTokenCache = {
  token: null,
  expiresAt: 0 // 过期时间戳（毫秒）
};

// ==================== 中间件配置 ====================
// 解析JSON请求体（限制大小防止恶意请求）
app.use(express.json({ limit: '10kb' }));

// 静态文件服务
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isDevelopment ? 0 : '1d', // 开发环境不缓存静态文件
    index: false
  })
);

// 跨域配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3001', 'http://localhost:3000'], // 支持前端默认端口
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true // 允许跨域携带cookie（如果需要）
}));

// 日志配置
app.use(morgan(isDevelopment ? 'dev' : 'combined'));

// ==================== 工具函数 ====================
// 封装获取access_token的工具函数（内部使用，不暴露接口）
async function getAccessToken() {
  const now = Date.now();
  
  // 检查缓存
  if (accessTokenCache.token && accessTokenCache.expiresAt > now) {
    console.log('使用缓存的access_token:', accessTokenCache.token);
    return accessTokenCache.token;
  }
  
  // 缓存过期，重新获取
  try {
    const response = await axios.get(THIRD_PARTY_CONFIG.accessTokenUrl, {
      params: {
        corpid: THIRD_PARTY_CONFIG.corpId,
        corpsecret: THIRD_PARTY_CONFIG.corpSecret
      }
    });

    if (response.data.errcode !== 0) {
      throw new Error(`获取access_token失败：${response.data.errmsg}（错误码：${response.data.errcode}）`);
    }

    // 提前200秒过期，避免网络延迟导致的问题
    const expiresIn = Math.max(10, response.data.expires_in - 200); // 确保至少10秒有效期
    accessTokenCache = {
      token: response.data.access_token,
      expiresAt: now + expiresIn * 1000
    };
    console.log('获取新的access_token:', accessTokenCache);

    return accessTokenCache.token;
  } catch (error) {
    console.error('获取access_token失败:', error.message);
    throw error; // 抛出错误让调用方处理
  }
}

// ==================== API接口 ====================
// 1. 获取用户信息接口（核心接口，关联企业微信）
app.get('/api/get-user-info', async (req, res) => {
  const { code } = req.query;
  console.log('前端传过来的code:', code);
  // 参数验证
  if (!code) {
    return res.status(400).json({
      success: false,
      message: '缺少code参数'
    });
  }

  try {
    // 1. 获取access_token
    const accessToken = await getAccessToken();
    console.log('获取到的access_token:', accessToken);
    
    // 2. 用code获取用户ID
    const userRes = await axios.get(THIRD_PARTY_CONFIG.userInfoUrl, {
      params: { access_token: accessToken, code }
    });
    console.log('获取到的用户信息:', userRes.data);

    if (userRes.data.errcode !== 0) {
      throw new Error(`获取用户ID失败：${userRes.data.errmsg}`);
    }

    const userId = userRes.data.UserId;
    if (!userId) {
      throw new Error('未获取到用户ID');
    }

    // 3. 获取用户详细信息（姓名等）
    const detailRes = await axios.get(THIRD_PARTY_CONFIG.userDetailUrl, {
      params: { access_token: accessToken, userid: userId }
    });

    if (detailRes.data.errcode !== 0) {
      throw new Error(`获取用户详情失败：${detailRes.data.errmsg}`);
    }

    // 4. 返回用户信息
    res.json({
      success: true,
      userId,
      userName: detailRes.data.name,
      department: detailRes.data.department || [],
      position: detailRes.data.position || ''
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: isDevelopment ? error.message : undefined // 生产环境不暴露具体错误
    });
  }
});

// 2. 预约系统业务接口
app.post('/api/submit', (req, res) => {
  const { serviceType, serviceTypeName, date, time, userId, userName } = req.body;
  
  // 数据验证
  if (!serviceType || !date || !time || !userId) {
    return res.status(400).json({
      success: false,
      message: '参数不完整，缺少必要信息'
    });
  }
  
  // 模拟保存到数据库
  const appointmentId = 'APT' + Date.now();
  console.log(`[新预约] ID: ${appointmentId}, 用户: ${userName}(${userId})`);
  
  res.json({
    success: true,
    message: '预约成功',
    appointmentId
  });
});

app.get('/api/my-appointments', (req, res) => {
  // 实际项目中应根据userId查询
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少userId参数' });
  }
  
  // 模拟数据
  const mockAppointments = [
    {
      id: 'APT1620000000001',
      serviceType: '落户',
      serviceTypeName: '办理落户',
      date: '2023-06-15',
      time: '10:00 - 11:00',
      status: 'pending',
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

app.post('/api/cancel-appointment', (req, res) => {
  const { appointmentId, userId } = req.body;
  
  if (!appointmentId || !userId) {
    return res.status(400).json({
      success: false,
      message: '缺少appointmentId或userId'
    });
  }
  
  console.log(`[取消预约] ID: ${appointmentId}, 用户: ${userId}`);
  res.json({ success: true, message: '预约已取消' });
});

// ==================== 页面路由 ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      res.status(500).json({ success: false, message: '无法加载首页' });
    }
  });
});

app.get('/my-appointments', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'my-appointments.html'), (err) => {
    if (err) {
      res.status(500).json({ success: false, message: '无法加载预约列表页' });
    }
  });
});

// ==================== 错误处理 ====================
// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `请求的资源 ${req.method} ${req.originalUrl} 不存在`
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    success: false,
    message: isDevelopment ? err.message : '服务器内部错误'
  });
});

// ==================== 启动服务 ====================
app.listen(port, () => {
  console.log(`服务器已启动，环境：${isDevelopment ? '开发' : '生产'}`);
  console.log(`访问地址：http://localhost:${port}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  // 生产环境可添加自动重启逻辑
  if (!isDevelopment) {
    process.exit(1);
  }
});
