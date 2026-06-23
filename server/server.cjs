const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());
app.use(cors());

const db = new Database(':memory:');
const JWT_SECRET = 'promptcraft_jwt_secret_2026_secure_key';

// 邮箱脱敏函数
const hideEmail = (email) => {
  if (!email) return '';
  return email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
};

// 提示词数据脱敏：隐藏作者邮箱
const maskPrompt = (p) => {
  if (!p) return p;
  return { ...p, author_email: hideEmail(p.author_email) };
};
const maskPrompts = (list) => list.map(maskPrompt);

// JWT 验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// 初始化表结构和测试数据
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    category TEXT,
    tags TEXT,
    author_id INTEGER,
    author_name TEXT,
    author_email TEXT,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE user_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    prompt_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, prompt_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (prompt_id) REFERENCES prompts(id)
  );
`);

// 插入测试用户
const insertUser = db.prepare(`INSERT INTO users (username, password, email) VALUES (?, ?, ?)`);
insertUser.run('admin', '123456', 'admin@promptcraft.com');
insertUser.run('user1', '123456', 'user1@promptcraft.com');

// 插入测试提示词
const insertPrompt = db.prepare(`INSERT INTO prompts (title, content, category, tags, author_id, author_name, author_email, likes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
insertPrompt.run('高效写作助手', '你是一位专业的写作助手，请帮我润色以下文字，使其更加流畅、专业，同时保持原意。', '写作', '写作,润色,助手', 1, 'admin', 'admin@promptcraft.com', 15);
insertPrompt.run('代码审查专家', '你是一位资深的代码审查专家，请仔细审查以下代码，找出潜在的bug、安全漏洞和性能问题，并给出改进建议。', '编程', '代码,审查,安全', 1, 'admin', 'admin@promptcraft.com', 23);
insertPrompt.run('Midjourney提示词生成器', '请根据我描述的场景，生成一段适合Midjourney的英文提示词，包含风格、光线、构图等细节描述。', '绘画', 'AI绘画,Midjourney,提示词', 2, 'user1', 'user1@promptcraft.com', 42);
insertPrompt.run('学术论文翻译', '你是一位学术翻译专家，请将以下中文翻译成英文，保持学术用语的准确性和专业性。', '翻译', '翻译,学术,论文', 2, 'user1', 'user1@promptcraft.com', 8);

// 预编译 SQL 语句
const stmts = {
  findUser: db.prepare(`SELECT id, username, email FROM users WHERE username = ? AND password = ?`),
  getUserEmail: db.prepare(`SELECT email FROM users WHERE id = ?`),
  getAllPrompts: db.prepare(`SELECT * FROM prompts ORDER BY created_at DESC`),
  getPromptById: db.prepare(`SELECT * FROM prompts WHERE id = ?`),
  getPromptsByAuthor: db.prepare(`SELECT * FROM prompts WHERE author_id = ? ORDER BY created_at DESC`),
  getLikedPrompts: db.prepare(`SELECT p.* FROM prompts p INNER JOIN user_likes ul ON p.id = ul.prompt_id WHERE ul.user_id = ? ORDER BY ul.created_at DESC`),
  insertPrompt: db.prepare(`INSERT INTO prompts (title, content, category, tags, author_id, author_name, author_email) VALUES (?, ?, ?, ?, ?, ?, ?)`),
  updatePrompt: db.prepare(`UPDATE prompts SET title = ?, content = ?, category = ?, tags = ? WHERE id = ?`),
  deletePrompt: db.prepare(`DELETE FROM prompts WHERE id = ?`),
  findLike: db.prepare(`SELECT id FROM user_likes WHERE user_id = ? AND prompt_id = ?`),
  addLike: db.prepare(`INSERT INTO user_likes (user_id, prompt_id) VALUES (?, ?)`),
  removeLike: db.prepare(`DELETE FROM user_likes WHERE user_id = ? AND prompt_id = ?`),
  incrementLikes: db.prepare(`UPDATE prompts SET likes = likes + 1 WHERE id = ?`),
  decrementLikes: db.prepare(`UPDATE prompts SET likes = likes - 1 WHERE id = ?`),
  getSuggestions: db.prepare(`SELECT id, title FROM prompts WHERE title LIKE ? LIMIT 5`)
};

// 登录防爆破：IP 速率限制
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

// 用户登录 - 返回 JWT Token
app.post('/api/login', (req, res) => {
  const ip = req.ip;
  const record = loginAttempts.get(ip) || { count: 0, firstAt: Date.now() };
  if (Date.now() - record.firstAt > WINDOW_MS) {
    record.count = 0;
    record.firstAt = Date.now();
  }
  if (record.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: '尝试次数过多，请5分钟后重试' });
  }

  const { username, password } = req.body;
  try {
    const row = stmts.findUser.get(username, password);
    if (row) {
      loginAttempts.delete(ip);
      const tokenPayload = {
        id: row.id,
        username: row.username,
        email: hideEmail(row.email)
      };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
      res.json({
        success: true,
        user: {
          id: row.id,
          username: row.username,
          email: hideEmail(row.email)
        },
        token
      });
    } else {
      record.count++;
      loginAttempts.set(ip, record);
      res.json({ success: false, message: '用户名或密码错误' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有提示词
app.get('/api/prompts', (req, res) => {
  try {
    res.json(maskPrompts(stmts.getAllPrompts.all()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取用户发布的提示词 - 需要 JWT 认证（必须在 :id 路由之前）
app.get('/api/prompts/mine', authenticateToken, (req, res) => {
  try {
    res.json(maskPrompts(stmts.getPromptsByAuthor.all(req.user.id)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取用户点赞的所有提示词 - 需要 JWT 认证（必须在 :id 路由之前）
app.get('/api/prompts/liked', authenticateToken, (req, res) => {
  try {
    res.json(maskPrompts(stmts.getLikedPrompts.all(req.user.id)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个提示词
app.get('/api/prompts/:id', (req, res) => {
  try {
    const row = stmts.getPromptById.get(req.params.id);
    res.json(maskPrompt(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 搜索提示词（故意留下 SQL 注入漏洞，供学习演示）
app.get('/api/search', (req, res) => {
  const q = req.query.q;
  // 故意使用字符串拼接，存在 SQL 注入漏洞
  const sql = `SELECT * FROM prompts WHERE title LIKE '%${q}%' OR content LIKE '%${q}%' OR tags LIKE '%${q}%'`;
  try {
    res.json(maskPrompts(db.prepare(sql).all()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 发布新提示词 - 需要 JWT 认证
app.post('/api/prompts', authenticateToken, (req, res) => {
  const { title, content, category, tags } = req.body;
  const { id: author_id, username: author_name } = req.user;

  try {
    const user = stmts.getUserEmail.get(author_id);
    const author_email = user ? user.email : '';
    const result = stmts.insertPrompt.run(title, content, category, tags, author_id, author_name, author_email);
    res.json({ id: result.lastInsertRowid, message: '发布成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 点赞/取消点赞 - 需要 JWT 认证
app.put('/api/prompts/:id/like', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const promptId = req.params.id;

  try {
    const existing = stmts.findLike.get(userId, promptId);
    if (existing) {
      stmts.removeLike.run(userId, promptId);
      stmts.decrementLikes.run(promptId);
      res.json({ message: '取消点赞', liked: false });
    } else {
      stmts.addLike.run(userId, promptId);
      stmts.incrementLikes.run(promptId);
      res.json({ message: '点赞成功', liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取用户点赞状态
app.get('/api/prompts/:id/like-status', authenticateToken, (req, res) => {
  try {
    const row = stmts.findLike.get(req.user.id, req.params.id);
    res.json({ liked: !!row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 编辑提示词 - 需要 JWT 认证
app.put('/api/prompts/:id', authenticateToken, (req, res) => {
  const { title, content, category, tags } = req.body;
  const promptId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.username === 'admin';

  try {
    const row = stmts.getPromptById.get(promptId);
    if (!row) {
      return res.status(404).json({ error: '提示词不存在' });
    }
    if (row.author_id !== userId && !isAdmin) {
      return res.status(403).json({ error: '无权编辑此提示词' });
    }
    stmts.updatePrompt.run(title, content, category, tags, promptId);
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除提示词 - 需要 JWT 认证
app.delete('/api/prompts/:id', authenticateToken, (req, res) => {
  const promptId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.username === 'admin';

  try {
    const row = stmts.getPromptById.get(promptId);
    if (!row) {
      return res.status(404).json({ error: '提示词不存在' });
    }
    if (row.author_id !== userId && !isAdmin) {
      return res.status(403).json({ error: '无权删除此提示词' });
    }
    stmts.deletePrompt.run(promptId);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 搜索联想 - 返回匹配的标题和 id
app.get('/api/suggestions', (req, res) => {
  const q = req.query.q;
  if (!q || q.trim().length === 0) {
    return res.json([]);
  }
  try {
    res.json(stmts.getSuggestions.all(`%${q}%`));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 托管前端静态文件（Vite 构建产物）
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));
app.get('/*path', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
