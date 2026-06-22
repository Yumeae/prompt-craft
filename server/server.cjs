const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database(':memory:');
const JWT_SECRET = 'promptcraft_jwt_secret_2026_secure_key';

// 邮箱脱敏函数
const hideEmail = (email) => {
  if (!email) return '';
  return email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
};

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
db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE prompts (
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
  )`);

  // 点赞记录表
  db.run(`CREATE TABLE user_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    prompt_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, prompt_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (prompt_id) REFERENCES prompts(id)
  )`);

  // 插入测试用户
  db.run(`INSERT INTO users (username, password, email) VALUES ('admin', '123456', 'admin@promptcraft.com')`);
  db.run(`INSERT INTO users (username, password, email) VALUES ('user1', '123456', 'user1@promptcraft.com')`);

  // 插入测试提示词
  db.run(`INSERT INTO prompts (title, content, category, tags, author_id, author_name, author_email, likes) VALUES
    ('高效写作助手', '你是一位专业的写作助手，请帮我润色以下文字，使其更加流畅、专业，同时保持原意。', '写作', '写作,润色,助手', 1, 'admin', 'admin@promptcraft.com', 15)`);
  db.run(`INSERT INTO prompts (title, content, category, tags, author_id, author_name, author_email, likes) VALUES
    ('代码审查专家', '你是一位资深的代码审查专家，请仔细审查以下代码，找出潜在的bug、安全漏洞和性能问题，并给出改进建议。', '编程', '代码,审查,安全', 1, 'admin', 'admin@promptcraft.com', 23)`);
  db.run(`INSERT INTO prompts (title, content, category, tags, author_id, author_name, author_email, likes) VALUES
    ('Midjourney提示词生成器', '请根据我描述的场景，生成一段适合Midjourney的英文提示词，包含风格、光线、构图等细节描述。', '绘画', 'AI绘画,Midjourney,提示词', 2, 'user1', 'user1@promptcraft.com', 42)`);
  db.run(`INSERT INTO prompts (title, content, category, tags, author_id, author_name, author_email, likes) VALUES
    ('学术论文翻译', '你是一位学术翻译专家，请将以下中文翻译成英文，保持学术用语的准确性和专业性。', '翻译', '翻译,学术,论文', 2, 'user1', 'user1@promptcraft.com', 8)`);
});

// 用户登录 - 返回 JWT Token
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT id, username, email FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (row) {
        // 生成 JWT Token（邮箱脱敏后存入 token）
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
        res.json({ success: false, message: '用户名或密码错误' });
      }
    }
  );
});

// 获取所有提示词
app.get('/api/prompts', (req, res) => {
  db.all(`SELECT * FROM prompts ORDER BY created_at DESC`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 获取单个提示词
app.get('/api/prompts/:id', (req, res) => {
  db.get(`SELECT * FROM prompts WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// 搜索提示词（故意留下 SQL 注入漏洞，供学习演示）
app.get('/api/search', (req, res) => {
  const q = req.query.q;
  // 故意使用字符串拼接，存在 SQL 注入漏洞
  const sql = `SELECT * FROM prompts WHERE title LIKE '%${q}%' OR content LIKE '%${q}%' OR tags LIKE '%${q}%'`;
  db.all(sql, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 发布新提示词 - 需要 JWT 认证
app.post('/api/prompts', authenticateToken, (req, res) => {
  const { title, content, category, tags } = req.body;
  const { id: author_id, username: author_name, email: author_email } = req.user;

  db.run(`INSERT INTO prompts (title, content, category, tags, author_id, author_name, author_email) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, content, category, tags, author_id, author_name, author_email],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: '发布成功' });
    }
  );
});

// 点赞/取消点赞 - 需要 JWT 认证
app.put('/api/prompts/:id/like', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const promptId = req.params.id;

  // 检查是否已点赞
  db.get(`SELECT id FROM user_likes WHERE user_id = ? AND prompt_id = ?`,
    [userId, promptId],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (row) {
        // 已点赞，取消点赞
        db.run(`DELETE FROM user_likes WHERE user_id = ? AND prompt_id = ?`,
          [userId, promptId],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            db.run(`UPDATE prompts SET likes = likes - 1 WHERE id = ?`, [promptId]);
            res.json({ message: '取消点赞', liked: false });
          }
        );
      } else {
        // 未点赞，添加点赞
        db.run(`INSERT INTO user_likes (user_id, prompt_id) VALUES (?, ?)`,
          [userId, promptId],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            db.run(`UPDATE prompts SET likes = likes + 1 WHERE id = ?`, [promptId]);
            res.json({ message: '点赞成功', liked: true });
          }
        );
      }
    }
  );
});

// 获取用户点赞状态
app.get('/api/prompts/:id/like-status', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const promptId = req.params.id;

  db.get(`SELECT id FROM user_likes WHERE user_id = ? AND prompt_id = ?`,
    [userId, promptId],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ liked: !!row });
    }
  );
});

// 获取用户点赞的所有提示词 - 需要 JWT 认证
app.get('/api/prompts/liked', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`SELECT p.* FROM prompts p
          INNER JOIN user_likes ul ON p.id = ul.prompt_id
          WHERE ul.user_id = ?
          ORDER BY ul.created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// 获取用户发布的提示词 - 需要 JWT 认证
app.get('/api/prompts/mine', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`SELECT * FROM prompts WHERE author_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// 编辑提示词 - 需要 JWT 认证
app.put('/api/prompts/:id', authenticateToken, (req, res) => {
  const { title, content, category, tags } = req.body;
  const promptId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.username === 'admin';

  // 先检查权限
  db.get(`SELECT author_id FROM prompts WHERE id = ?`, [promptId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      return res.status(404).json({ error: '提示词不存在' });
    }
    if (row.author_id !== userId && !isAdmin) {
      return res.status(403).json({ error: '无权编辑此提示词' });
    }

    db.run(`UPDATE prompts SET title = ?, content = ?, category = ?, tags = ? WHERE id = ?`,
      [title, content, category, tags, promptId],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: '更新成功' });
      }
    );
  });
});

// 删除提示词 - 需要 JWT 认证
app.delete('/api/prompts/:id', authenticateToken, (req, res) => {
  const promptId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.username === 'admin';

  // 先检查权限
  db.get(`SELECT author_id FROM prompts WHERE id = ?`, [promptId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      return res.status(404).json({ error: '提示词不存在' });
    }
    if (row.author_id !== userId && !isAdmin) {
      return res.status(403).json({ error: '无权删除此提示词' });
    }

    db.run(`DELETE FROM prompts WHERE id = ?`, [promptId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: '删除成功' });
    });
  });
});

// 搜索联想 - 返回匹配的标题
app.get('/api/suggestions', (req, res) => {
  const q = req.query.q;
  if (!q || q.trim().length === 0) {
    return res.json([]);
  }

  db.all(`SELECT DISTINCT title FROM prompts WHERE title LIKE ? LIMIT 5`,
    [`%${q}%`],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows.map(r => r.title));
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
