const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5002;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and image files are allowed.'));
    }
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database setup
const db = new sqlite3.Database('./inventory.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      initial_stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Invoices table
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('purchase', 'sale')),
      buyer_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Staff notes table
    db.run(`CREATE TABLE IF NOT EXISTS staff_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity_sold INTEGER NOT NULL,
      buyer_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Stock counts table
    db.run(`CREATE TABLE IF NOT EXISTS stock_counts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      warehouse TEXT NOT NULL CHECK(warehouse IN ('Warehouse 1', 'Warehouse 2')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    console.log('Database initialized');
    insertSampleData();
  });
}

function insertSampleData() {
  db.serialize(() => {
    // Check if products already exist
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
      if (row.count > 0) return;

      console.log('Inserting sample data...');

      // Insert sample products (15 products across categories)
      const products = [
        { name: 'Laptop Dell XPS 15', category: 'Electronics', initial_stock: 45 },
        { name: 'Wireless Mouse Logitech', category: 'Electronics', initial_stock: 150 },
        { name: 'Mechanical Keyboard RGB', category: 'Electronics', initial_stock: 80 },
        { name: '27" 4K Monitor', category: 'Electronics', initial_stock: 35 },
        { name: 'USB-C Hub Pro', category: 'Office Supplies', initial_stock: 200 },
        { name: 'Laptop Stand Aluminum', category: 'Office Supplies', initial_stock: 65 },
        { name: 'LED Desk Lamp', category: 'Office Supplies', initial_stock: 50 },
        { name: 'Ergonomic Office Chair', category: 'Furniture', initial_stock: 20 },
        { name: 'HD Webcam 1080p', category: 'Electronics', initial_stock: 45 },
        { name: 'Gaming Headset 7.1', category: 'Electronics', initial_stock: 60 },
        { name: 'iPad Pro 12.9"', category: 'Electronics', initial_stock: 40 },
        { name: 'iPhone 15 Case', category: 'Accessories', initial_stock: 320 },
        { name: 'Screen Protector Set', category: 'Accessories', initial_stock: 280 },
        { name: 'Wireless Charger 15W', category: 'Electronics', initial_stock: 110 },
        { name: 'Bluetooth Speaker', category: 'Electronics', initial_stock: 75 }
      ];

      const stmt = db.prepare('INSERT INTO products (name, category, initial_stock) VALUES (?, ?, ?)');
      products.forEach(p => stmt.run(p.name, p.category, p.initial_stock));
      stmt.finalize();

      // Insert sample invoices (35+ records, Oct-Dec 2024)
      const invoices = [
        // October 2024
        { date: '2024-10-02', product_id: 1, quantity: 10, type: 'purchase', buyer_name: 'Tech Corp' },
        { date: '2024-10-05', product_id: 2, quantity: 50, type: 'purchase', buyer_name: 'Tech Corp' },
        { date: '2024-10-08', product_id: 1, quantity: 5, type: 'sale', buyer_name: 'John Doe' },
        { date: '2024-10-10', product_id: 3, quantity: 30, type: 'purchase', buyer_name: 'Electronics Ltd' },
        { date: '2024-10-12', product_id: 2, quantity: 12, type: 'sale', buyer_name: 'ABC Corp' },
        { date: '2024-10-15', product_id: 4, quantity: 15, type: 'purchase', buyer_name: 'Tech Corp' },
        { date: '2024-10-18', product_id: 5, quantity: 80, type: 'purchase', buyer_name: 'Office Supply Co' },
        { date: '2024-10-20', product_id: 3, quantity: 8, type: 'sale', buyer_name: 'Jane Smith' },
        { date: '2024-10-22', product_id: 1, quantity: 3, type: 'sale', buyer_name: 'Retail Customer' },
        { date: '2024-10-25', product_id: 11, quantity: 20, type: 'purchase', buyer_name: 'Apple Distributor' },
        { date: '2024-10-28', product_id: 12, quantity: 100, type: 'purchase', buyer_name: 'Accessories Plus' },
        
        // November 2024
        { date: '2024-11-01', product_id: 6, quantity: 40, type: 'purchase', buyer_name: 'Furniture Direct' },
        { date: '2024-11-04', product_id: 7, quantity: 30, type: 'purchase', buyer_name: 'Office Supply Co' },
        { date: '2024-11-07', product_id: 2, quantity: 8, type: 'sale', buyer_name: 'Michael Brown' },
        { date: '2024-11-10', product_id: 13, quantity: 50, type: 'purchase', buyer_name: 'Tech Accessories' },
        { date: '2024-11-12', product_id: 4, quantity: 6, type: 'sale', buyer_name: 'Emily Davis' },
        { date: '2024-11-15', product_id: 8, quantity: 10, type: 'purchase', buyer_name: 'Furniture Direct' },
        { date: '2024-11-18', product_id: 9, quantity: 25, type: 'purchase', buyer_name: 'Electronics Ltd' },
        { date: '2024-11-20', product_id: 14, quantity: 60, type: 'purchase', buyer_name: 'Tech Corp' },
        { date: '2024-11-22', product_id: 10, quantity: 35, type: 'purchase', buyer_name: 'Gaming Store' },
        { date: '2024-11-25', product_id: 3, quantity: 5, type: 'sale', buyer_name: 'Sarah Wilson' },
        { date: '2024-11-28', product_id: 15, quantity: 45, type: 'purchase', buyer_name: 'Audio Systems Inc' },
        { date: '2024-11-30', product_id: 5, quantity: 15, type: 'sale', buyer_name: 'XYZ Company' },
        
        // December 2024
        { date: '2024-12-02', product_id: 11, quantity: 7, type: 'sale', buyer_name: 'Retail Customer' },
        { date: '2024-12-05', product_id: 12, quantity: 25, type: 'sale', buyer_name: 'ABC Corp' },
        { date: '2024-12-08', product_id: 1, quantity: 8, type: 'sale', buyer_name: 'Tech Solutions' },
        { date: '2024-12-10', product_id: 13, quantity: 40, type: 'sale', buyer_name: 'Mobile Shop' },
        { date: '2024-12-12', product_id: 14, quantity: 20, type: 'sale', buyer_name: 'Wireless World' },
        { date: '2024-12-15', product_id: 2, quantity: 18, type: 'sale', buyer_name: 'Computer Store' },
        { date: '2024-12-18', product_id: 15, quantity: 12, type: 'sale', buyer_name: 'Audio Shop' },
        { date: '2024-12-20', product_id: 4, quantity: 4, type: 'sale', buyer_name: 'Display Center' },
        { date: '2024-12-22', product_id: 6, quantity: 10, type: 'sale', buyer_name: 'Office Depot' },
        { date: '2024-12-25', product_id: 9, quantity: 9, type: 'sale', buyer_name: 'Video Chat Co' },
        { date: '2024-12-28', product_id: 10, quantity: 14, type: 'sale', buyer_name: 'Gamer Zone' }
      ];

      const invoiceStmt = db.prepare('INSERT INTO invoices (date, product_id, quantity, type, buyer_name) VALUES (?, ?, ?, ?, ?)');
      invoices.forEach(i => invoiceStmt.run(i.date, i.product_id, i.quantity, i.type, i.buyer_name));
      invoiceStmt.finalize();

      // Insert sample staff notes (45+ records, Oct-Dec 2024)
      const staffNotes = [
        // October 2024
        { date: '2024-10-01', product_id: 1, quantity_sold: 2, buyer_name: 'Walk-in' },
        { date: '2024-10-02', product_id: 2, quantity_sold: 5, buyer_name: 'Walk-in' },
        { date: '2024-10-03', product_id: 3, quantity_sold: 3, buyer_name: 'Customer A' },
        { date: '2024-10-04', product_id: 5, quantity_sold: 8, buyer_name: 'Walk-in' },
        { date: '2024-10-07', product_id: 1, quantity_sold: 1, buyer_name: 'Customer B' },
        { date: '2024-10-08', product_id: 2, quantity_sold: 6, buyer_name: 'Walk-in' },
        { date: '2024-10-09', product_id: 4, quantity_sold: 2, buyer_name: 'Customer C' },
        { date: '2024-10-11', product_id: 3, quantity_sold: 4, buyer_name: 'Walk-in' },
        { date: '2024-10-14', product_id: 5, quantity_sold: 10, buyer_name: 'Customer D' },
        { date: '2024-10-16', product_id: 1, quantity_sold: 2, buyer_name: 'Walk-in' },
        { date: '2024-10-17', product_id: 2, quantity_sold: 7, buyer_name: 'Customer E' },
        { date: '2024-10-19', product_id: 4, quantity_sold: 3, buyer_name: 'Walk-in' },
        { date: '2024-10-21', product_id: 3, quantity_sold: 5, buyer_name: 'Customer F' },
        { date: '2024-10-23', product_id: 5, quantity_sold: 12, buyer_name: 'Walk-in' },
        { date: '2024-10-24', product_id: 1, quantity_sold: 1, buyer_name: 'Customer G' },
        { date: '2024-10-26', product_id: 2, quantity_sold: 4, buyer_name: 'Walk-in' },
        { date: '2024-10-28', product_id: 4, quantity_sold: 2, buyer_name: 'Customer H' },
        { date: '2024-10-30', product_id: 3, quantity_sold: 3, buyer_name: 'Walk-in' },
        
        // November 2024
        { date: '2024-11-01', product_id: 5, quantity_sold: 6, buyer_name: 'Customer I' },
        { date: '2024-11-03', product_id: 6, quantity_sold: 2, buyer_name: 'Walk-in' },
        { date: '2024-11-05', product_id: 7, quantity_sold: 4, buyer_name: 'Customer J' },
        { date: '2024-11-07', product_id: 1, quantity_sold: 3, buyer_name: 'Walk-in' },
        { date: '2024-11-09', product_id: 2, quantity_sold: 8, buyer_name: 'Customer K' },
        { date: '2024-11-11', product_id: 4, quantity_sold: 1, buyer_name: 'Walk-in' },
        { date: '2024-11-13', product_id: 3, quantity_sold: 6, buyer_name: 'Customer L' },
        { date: '2024-11-15', product_id: 5, quantity_sold: 9, buyer_name: 'Walk-in' },
        { date: '2024-11-17', product_id: 8, quantity_sold: 2, buyer_name: 'Customer M' },
        { date: '2024-11-19', product_id: 9, quantity_sold: 5, buyer_name: 'Walk-in' },
        { date: '2024-11-21', product_id: 1, quantity_sold: 2, buyer_name: 'Customer N' },
        { date: '2024-11-23', product_id: 10, quantity_sold: 4, buyer_name: 'Walk-in' },
        { date: '2024-11-25', product_id: 2, quantity_sold: 7, buyer_name: 'Customer O' },
        { date: '2024-11-27', product_id: 4, quantity_sold: 2, buyer_name: 'Walk-in' },
        { date: '2024-11-29', product_id: 3, quantity_sold: 5, buyer_name: 'Customer P' },
        
        // December 2024
        { date: '2024-12-01', product_id: 5, quantity_sold: 11, buyer_name: 'Walk-in' },
        { date: '2024-12-03', product_id: 11, quantity_sold: 3, buyer_name: 'Customer Q' },
        { date: '2024-12-05', product_id: 12, quantity_sold: 15, buyer_name: 'Walk-in' },
        { date: '2024-12-07', product_id: 13, quantity_sold: 8, buyer_name: 'Customer R' },
        { date: '2024-12-09', product_id: 14, quantity_sold: 6, buyer_name: 'Walk-in' },
        { date: '2024-12-11', product_id: 15, quantity_sold: 4, buyer_name: 'Customer S' },
        { date: '2024-12-13', product_id: 1, quantity_sold: 5, buyer_name: 'Walk-in' },
        { date: '2024-12-15', product_id: 2, quantity_sold: 12, buyer_name: 'Customer T' },
        { date: '2024-12-17', product_id: 4, quantity_sold: 3, buyer_name: 'Walk-in' },
        { date: '2024-12-19', product_id: 3, quantity_sold: 7, buyer_name: 'Customer U' },
        { date: '2024-12-21', product_id: 6, quantity_sold: 2, buyer_name: 'Walk-in' },
        { date: '2024-12-23', product_id: 7, quantity_sold: 5, buyer_name: 'Customer V' },
        { date: '2024-12-25', product_id: 9, quantity_sold: 4, buyer_name: 'Walk-in' },
        { date: '2024-12-27', product_id: 10, quantity_sold: 8, buyer_name: 'Customer W' },
        { date: '2024-12-29', product_id: 5, quantity_sold: 10, buyer_name: 'Customer X' }
      ];

      const noteStmt = db.prepare('INSERT INTO staff_notes (date, product_id, quantity_sold, buyer_name) VALUES (?, ?, ?, ?)');
      staffNotes.forEach(n => noteStmt.run(n.date, n.product_id, n.quantity_sold, n.buyer_name));
      noteStmt.finalize();

      // Insert sample stock counts (25+ records across both warehouses, recent dates)
      const stockCounts = [
        // Warehouse 1 - October
        { date: '2024-10-31', product_id: 1, quantity: 38, warehouse: 'Warehouse 1' },
        { date: '2024-10-31', product_id: 2, quantity: 115, warehouse: 'Warehouse 1' },
        { date: '2024-10-31', product_id: 3, quantity: 64, warehouse: 'Warehouse 1' },
        { date: '2024-10-31', product_id: 4, quantity: 27, warehouse: 'Warehouse 1' },
        { date: '2024-10-31', product_id: 5, quantity: 145, warehouse: 'Warehouse 1' },
        { date: '2024-10-31', product_id: 6, quantity: 50, warehouse: 'Warehouse 1' },
        { date: '2024-10-31', product_id: 7, quantity: 35, warehouse: 'Warehouse 1' },
        { date: '2024-10-31', product_id: 8, quantity: 12, warehouse: 'Warehouse 1' },
        
        // Warehouse 1 - November
        { date: '2024-11-30', product_id: 1, quantity: 28, warehouse: 'Warehouse 1' },
        { date: '2024-11-30', product_id: 2, quantity: 95, warehouse: 'Warehouse 1' },
        { date: '2024-11-30', product_id: 3, quantity: 55, warehouse: 'Warehouse 1' },
        { date: '2024-11-30', product_id: 4, quantity: 21, warehouse: 'Warehouse 1' },
        { date: '2024-11-30', product_id: 5, quantity: 115, warehouse: 'Warehouse 1' },
        { date: '2024-11-30', product_id: 9, quantity: 35, warehouse: 'Warehouse 1' },
        
        // Warehouse 1 - December
        { date: '2024-12-31', product_id: 1, quantity: 18, warehouse: 'Warehouse 1' },
        { date: '2024-12-31', product_id: 2, quantity: 65, warehouse: 'Warehouse 1' },
        { date: '2024-12-31', product_id: 3, quantity: 42, warehouse: 'Warehouse 1' },
        { date: '2024-12-31', product_id: 4, quantity: 15, warehouse: 'Warehouse 1' },
        { date: '2024-12-31', product_id: 5, quantity: 85, warehouse: 'Warehouse 1' },
        { date: '2024-12-31', product_id: 9, quantity: 20, warehouse: 'Warehouse 1' },
        { date: '2024-12-31', product_id: 10, quantity: 28, warehouse: 'Warehouse 1' },
        
        // Warehouse 2 - October
        { date: '2024-10-31', product_id: 11, quantity: 38, warehouse: 'Warehouse 2' },
        { date: '2024-10-31', product_id: 12, quantity: 310, warehouse: 'Warehouse 2' },
        { date: '2024-10-31', product_id: 13, quantity: 270, warehouse: 'Warehouse 2' },
        { date: '2024-10-31', product_id: 14, quantity: 105, warehouse: 'Warehouse 2' },
        { date: '2024-10-31', product_id: 15, quantity: 70, warehouse: 'Warehouse 2' },
        
        // Warehouse 2 - November
        { date: '2024-11-30', product_id: 11, quantity: 33, warehouse: 'Warehouse 2' },
        { date: '2024-11-30', product_id: 12, quantity: 275, warehouse: 'Warehouse 2' },
        { date: '2024-11-30', product_id: 13, quantity: 220, warehouse: 'Warehouse 2' },
        { date: '2024-11-30', product_id: 14, quantity: 95, warehouse: 'Warehouse 2' },
        
        // Warehouse 2 - December
        { date: '2024-12-31', product_id: 11, quantity: 23, warehouse: 'Warehouse 2' },
        { date: '2024-12-31', product_id: 12, quantity: 235, warehouse: 'Warehouse 2' },
        { date: '2024-12-31', product_id: 13, quantity: 172, warehouse: 'Warehouse 2' },
        { date: '2024-12-31', product_id: 14, quantity: 59, warehouse: 'Warehouse 2' },
        { date: '2024-12-31', product_id: 15, quantity: 54, warehouse: 'Warehouse 2' }
      ];

      const countStmt = db.prepare('INSERT INTO stock_counts (date, product_id, quantity, warehouse) VALUES (?, ?, ?, ?)');
      stockCounts.forEach(s => countStmt.run(s.date, s.product_id, s.quantity, s.warehouse));
      countStmt.finalize();

      console.log('Sample data inserted successfully');
    });
  });
}

// API Routes

// Products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/products/batch', (req, res) => {
  const products = req.body;
  const results = [];
  let completed = 0;

  products.forEach(product => {
    db.run(
      'INSERT INTO products (name, category, initial_stock) VALUES (?, ?, ?)',
      [product.name, product.category, product.initial_stock || 0],
      function(err) {
        if (err) {
          results.push({ ...product, error: err.message });
        } else {
          results.push({ ...product, id: this.lastID, success: true });
        }
        completed++;
        if (completed === products.length) {
          res.json(results);
        }
      }
    );
  });
});

app.post('/api/products/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: req.file.path
  });
});

app.post('/api/products', (req, res) => {
  const { name, category, initial_stock } = req.body;
  db.run(
    'INSERT INTO products (name, category, initial_stock) VALUES (?, ?, ?)',
    [name, category, initial_stock || 0],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, category, initial_stock });
    }
  );
});

app.put('/api/products/:id', (req, res) => {
  const { name, category, initial_stock } = req.body;
  db.run(
    'UPDATE products SET name = ?, category = ?, initial_stock = ? WHERE id = ?',
    [name, category, initial_stock, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: req.params.id, name, category, initial_stock });
    }
  );
});

app.delete('/api/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Product deleted' });
  });
});

// Invoices
app.get('/api/invoices', (req, res) => {
  const { start_date, end_date, product_id } = req.query;
  let query = `
    SELECT i.*, p.name as product_name
    FROM invoices i
    JOIN products p ON i.product_id = p.id
    WHERE 1=1
  `;
  let params = [];

  if (start_date) {
    query += ' AND i.date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND i.date <= ?';
    params.push(end_date);
  }
  if (product_id) {
    query += ' AND i.product_id = ?';
    params.push(product_id);
  }

  query += ' ORDER BY i.date DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/invoices', (req, res) => {
  const { date, product_id, quantity, type, buyer_name } = req.body;
  db.run(
    'INSERT INTO invoices (date, product_id, quantity, type, buyer_name) VALUES (?, ?, ?, ?, ?)',
    [date, product_id, quantity, type, buyer_name],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, date, product_id, quantity, type, buyer_name });
    }
  );
});

app.post('/api/invoices/batch', (req, res) => {
  const invoices = req.body;
  const results = [];
  let completed = 0;

  invoices.forEach(invoice => {
    db.run(
      'INSERT INTO invoices (date, product_id, quantity, type, buyer_name) VALUES (?, ?, ?, ?, ?)',
      [invoice.date, invoice.product_id, invoice.quantity, invoice.type, invoice.buyer_name],
      function(err) {
        if (err) {
          results.push({ ...invoice, error: err.message });
        } else {
          results.push({ ...invoice, id: this.lastID, success: true });
        }
        completed++;
        if (completed === invoices.length) {
          res.json(results);
        }
      }
    );
  });
});

// File upload for invoices (Excel)
app.post('/api/invoices/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: req.file.path
  });
});

// Staff Notes
app.get('/api/staff-notes', (req, res) => {
  const { start_date, end_date, product_id } = req.query;
  let query = `
    SELECT sn.*, p.name as product_name
    FROM staff_notes sn
    JOIN products p ON sn.product_id = p.id
    WHERE 1=1
  `;
  let params = [];

  if (start_date) {
    query += ' AND sn.date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND sn.date <= ?';
    params.push(end_date);
  }
  if (product_id) {
    query += ' AND sn.product_id = ?';
    params.push(product_id);
  }

  query += ' ORDER BY sn.date DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/staff-notes', (req, res) => {
  const { date, product_id, quantity_sold, buyer_name } = req.body;
  db.run(
    'INSERT INTO staff_notes (date, product_id, quantity_sold, buyer_name) VALUES (?, ?, ?, ?)',
    [date, product_id, quantity_sold, buyer_name],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, date, product_id, quantity_sold, buyer_name });
    }
  );
});

app.post('/api/staff-notes/batch', (req, res) => {
  const notes = req.body;
  const results = [];
  let completed = 0;

  notes.forEach(note => {
    db.run(
      'INSERT INTO staff_notes (date, product_id, quantity_sold, buyer_name) VALUES (?, ?, ?, ?)',
      [note.date, note.product_id, note.quantity_sold, note.buyer_name],
      function(err) {
        if (err) {
          results.push({ ...note, error: err.message });
        } else {
          results.push({ ...note, id: this.lastID, success: true });
        }
        completed++;
        if (completed === notes.length) {
          res.json(results);
        }
      }
    );
  });
});

// File upload for staff notes (OCR - image)
app.post('/api/staff-notes/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: req.file.path
  });
});

// Stock Counts
app.get('/api/stock-counts', (req, res) => {
  const { start_date, end_date, product_id, warehouse } = req.query;
  let query = `
    SELECT sc.*, p.name as product_name
    FROM stock_counts sc
    JOIN products p ON sc.product_id = p.id
    WHERE 1=1
  `;
  let params = [];

  if (start_date) {
    query += ' AND sc.date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND sc.date <= ?';
    params.push(end_date);
  }
  if (product_id) {
    query += ' AND sc.product_id = ?';
    params.push(product_id);
  }
  if (warehouse) {
    query += ' AND sc.warehouse = ?';
    params.push(warehouse);
  }

  query += ' ORDER BY sc.date DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/stock-counts', (req, res) => {
  const { date, product_id, quantity, warehouse } = req.body;
  db.run(
    'INSERT INTO stock_counts (date, product_id, quantity, warehouse) VALUES (?, ?, ?, ?)',
    [date, product_id, quantity, warehouse],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, date, product_id, quantity, warehouse });
    }
  );
});

// Batch insert for stock counts (Excel upload)
app.post('/api/stock-counts/batch', (req, res) => {
  const stockCounts = req.body;
  const results = [];
  let completed = 0;

  stockCounts.forEach(stockCount => {
    db.run(
      'INSERT INTO stock_counts (date, product_id, quantity, warehouse) VALUES (?, ?, ?, ?)',
      [stockCount.date, stockCount.product_id, stockCount.quantity, stockCount.warehouse],
      function(err) {
        if (err) {
          results.push({ ...stockCount, error: err.message });
        } else {
          results.push({ ...stockCount, id: this.lastID, success: true });
        }
        completed++;
        if (completed === stockCounts.length) {
          res.json(results);
        }
      }
    );
  });
});

// File upload for stock counts (Excel)
app.post('/api/stock-counts/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: req.file.path
  });
});

// Dashboard Analytics
app.get('/api/dashboard/analytics', (req, res) => {
  const { month, year } = req.query;
  
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;

  // Get all products
  db.all(
    `SELECT * FROM products`,
    [],
    (err, products) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const analytics = [];
      let completed = 0;

      const processProduct = (product) => {
        // Calculate stock from invoices
        db.all(
          `SELECT type, SUM(quantity) as total FROM invoices 
           WHERE product_id = ${product.id} 
           AND date >= '${startDate}' AND date <= '${endDate}' 
           GROUP BY type`,
          [],
          (err, invoiceRows) => {
            let purchases = 0;
            let sales = 0;
            if (invoiceRows) {
              invoiceRows.forEach(row => {
                if (row.type === 'purchase') purchases = row.total || 0;
                if (row.type === 'sale') sales = row.total || 0;
              });
            }
            const invoiceStock = purchases - sales;

            // Calculate stock from staff notes
            db.get(
              `SELECT SUM(quantity_sold) as total FROM staff_notes 
               WHERE product_id = ${product.id} 
               AND date >= '${startDate}' AND date <= '${endDate}'`,
              [],
              (err, staffRow) => {
                const staffStock = staffRow ? staffRow.total || 0 : 0;

                // Get latest stock counts for each warehouse
                db.all(
                  `SELECT warehouse, quantity FROM stock_counts 
                   WHERE product_id = ${product.id} 
                   AND date >= '${startDate}' AND date <= '${endDate}' 
                   ORDER BY date DESC, warehouse ASC`,
                  [],
                  (err, stockRows) => {
                    let warehouse1Stock = 0;
                    let warehouse2Stock = 0;
                    let totalRealStock = 0;

                    if (stockRows && stockRows.length > 0) {
                      const w1 = stockRows.find(r => r.warehouse === 'Warehouse 1');
                      const w2 = stockRows.find(r => r.warehouse === 'Warehouse 2');
                      warehouse1Stock = w1 ? w1.quantity : 0;
                      warehouse2Stock = w2 ? w2.quantity : 0;
                      totalRealStock = warehouse1Stock + warehouse2Stock;
                    }

                    // Calculate discrepancy
                    const discrepancyInvoice = totalRealStock - (product.initial_stock + invoiceStock);
                    const discrepancyStaff = totalRealStock - (product.initial_stock - staffStock);
                    
                    const discrepancyPctInvoice = totalRealStock > 0 ? 
                      ((discrepancyInvoice / totalRealStock) * 100).toFixed(2) : 0;
                    const discrepancyPctStaff = totalRealStock > 0 ? 
                      ((discrepancyStaff / totalRealStock) * 100).toFixed(2) : 0;

                    analytics.push({
                      product_id: product.id,
                      product_name: product.name,
                      invoice_stock: invoiceStock,
                      staff_stock: staffStock,
                      warehouse1_stock: warehouse1Stock,
                      warehouse2_stock: warehouse2Stock,
                      total_real_stock: totalRealStock,
                      discrepancy_invoice: discrepancyInvoice,
                      discrepancy_staff: discrepancyStaff,
                      discrepancy_invoice_pct: discrepancyPctInvoice,
                      discrepancy_staff_pct: discrepancyPctStaff
                    });

                    completed++;
                    if (completed === products.length) {
                      res.json(analytics);
                    }
                  }
                );
              }
            );
          }
        );
      };

      products.forEach(processProduct);
    }
  );
});

// Product History
app.get('/api/products/:id/history', (req, res) => {
  const { start_date, end_date } = req.query;
  const productId = req.params.id;

  const startDate = start_date || '2000-01-01';
  const endDate = end_date || '2030-12-31';

  const query = `
    SELECT 'invoice' as type, date, type as transaction_type, quantity, buyer_name, NULL as warehouse, created_at 
    FROM invoices 
    WHERE product_id = ? AND date >= ? AND date <= ?
    
    UNION ALL
    
    SELECT 'staff_note' as type, date, 'sale' as transaction_type, quantity_sold as quantity, buyer_name, NULL as warehouse, created_at 
    FROM staff_notes 
    WHERE product_id = ? AND date >= ? AND date <= ?
    
    UNION ALL
    
    SELECT 'stock_count' as type, date, 'count' as transaction_type, quantity, NULL as buyer_name, warehouse, created_at 
    FROM stock_counts 
    WHERE product_id = ? AND date >= ? AND date <= ?
    
    ORDER BY date ASC
  `;

  db.all(query, [productId, startDate, endDate, productId, startDate, endDate, productId, startDate, endDate], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
