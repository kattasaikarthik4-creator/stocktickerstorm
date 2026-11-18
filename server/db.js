import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'tickerstorm.db');

export const db = new Database(DB_PATH);

// Password hashing using Node built-in crypto (scrypt)
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  // Support default demo user
  if (storedHash.startsWith('pbkdf2$simulated$hashed')) {
    return password === 'password123' || password === 'admin' || password === 'demo';
  }
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

// User database operations
export function findUserByEmail(email) {
  return db.prepare('SELECT id, name, email, password_hash, created_at FROM users WHERE lower(email) = lower(?)').get(email);
}

export function findUserById(id) {
  return db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(id);
}

export function createUser({ name, email, password }) {
  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const passwordHash = hashPassword(password);
  const displayName = name || email.split('@')[0];

  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, password_hash)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(userId, displayName, email.toLowerCase().trim(), passwordHash);

  // Initialize initial starter portfolio and watchlist for new user
  const insertPortfolio = db.prepare(`
    INSERT INTO portfolios (id, user_id, name, total_value, invested_amount, roi_percent, target_amount, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPortfolio.run(`port_${userId}_core`, userId, `${displayName}'s Portfolio`, 10000.00, 8000.00, 25.00, 15000.00, 'core');
  insertPortfolio.run(`port_${userId}_house`, userId, 'Dream House', 545569.00, 532262.00, 2.50, 700000.00, 'target');
  insertPortfolio.run(`port_${userId}_travel`, userId, 'My Travel', 345155.00, 330291.00, 4.50, 500000.00, 'target');

  const insertWatchlist = db.prepare(`
    INSERT INTO watchlists (id, user_id, symbol)
    VALUES (?, ?, ?)
  `);
  ['NVDA', 'AAPL', 'MSFT', 'BTC', 'SPY'].forEach((sym) => {
    insertWatchlist.run(`wl_${userId}_${sym.toLowerCase()}`, userId, sym);
  });

  return { id: userId, name: displayName, email: email.toLowerCase().trim() };
}

// Initialize schema as specified in Architecture & DB Requirements
export function initDatabase() {
  db.pragma('journal_mode = WAL');

  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT 'Alex Morgan',
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate 'name' column if not existing in pre-created DB
  try {
    db.exec("ALTER TABLE users ADD COLUMN name TEXT DEFAULT 'Alex Morgan'");
  } catch (e) {
    // Column already exists
  }

  // Portfolios Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      total_value REAL NOT NULL,
      invested_amount REAL NOT NULL,
      roi_percent REAL DEFAULT 0,
      target_amount REAL DEFAULT 0,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Watchlists Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, symbol)
    );
  `);

  // Alerts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      target_price REAL NOT NULL,
      condition TEXT CHECK(condition IN ('ABOVE', 'BELOW')) NOT NULL,
      is_triggered INTEGER DEFAULT 0,
      triggered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Fund Holdings Tables for Durable Fund Intelligence
  db.exec(`
    CREATE TABLE IF NOT EXISTS fund_sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      allocation_percent REAL NOT NULL,
      holding_value REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fund_companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      ticker TEXT NOT NULL,
      allocation_percent REAL NOT NULL,
      holding_value REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fund_managers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT NOT NULL,
      scheme_name TEXT NOT NULL,
      aum TEXT NOT NULL,
      rating REAL NOT NULL,
      three_year_return REAL NOT NULL,
      experience TEXT NOT NULL
    );
  `);

  // Seed default data if empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount === 0) {
    const defaultUserId = 'user_alex_morgan_01';
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(defaultUserId, 'Alex Morgan', 'alex.morgan@tickerstorm.io', 'pbkdf2$simulated$hashed');

    // Seed Portfolios matching specifications
    const insertPortfolio = db.prepare(`
      INSERT INTO portfolios (id, user_id, name, total_value, invested_amount, roi_percent, target_amount, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPortfolio.run('port_main_01', defaultUserId, 'Primary Growth Portfolio', 10125.00, 8032.00, 26.06, 15000.00, 'core');
    insertPortfolio.run('port_house_02', defaultUserId, 'Dream House', 545569.00, 532262.00, 2.50, 700000.00, 'target');
    insertPortfolio.run('port_travel_03', defaultUserId, 'My Travel', 345155.00, 330291.00, 4.50, 500000.00, 'target');

    // Seed default watchlists
    const insertWatchlist = db.prepare(`
      INSERT INTO watchlists (id, user_id, symbol)
      VALUES (?, ?, ?)
    `);
    const initialWatchlist = ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'BTC', 'DOGE', 'SPY'];
    initialWatchlist.forEach((sym) => {
      insertWatchlist.run(`wl_${sym.toLowerCase()}`, defaultUserId, sym);
    });

    // Seed default alert
    const insertAlert = db.prepare(`
      INSERT INTO alerts (id, user_id, symbol, target_price, condition, is_triggered)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAlert.run('alert_nvda_150', defaultUserId, 'NVDA', 150.00, 'ABOVE', 0);
    insertAlert.run('alert_btc_68k', defaultUserId, 'BTC', 68000.00, 'ABOVE', 0);

    // Seed Fund Sectors matching reference
    const insertSector = db.prepare(`
      INSERT INTO fund_sectors (symbol, name, allocation_percent, holding_value)
      VALUES (?, ?, ?, ?)
    `);
    insertSector.run('XLK', 'Technology', 38.5, 3898.12);
    insertSector.run('XLF', 'Financial Services', 22.1, 2237.62);
    insertSector.run('XLV', 'Healthcare & Biotech', 16.4, 1660.50);
    insertSector.run('XLE', 'Energy & Clean Tech', 12.2, 1235.25);
    insertSector.run('XLY', 'Consumer Discretionary', 10.8, 1093.51);

    // Seed Fund Companies matching exact reference specification
    const insertCompany = db.prepare(`
      INSERT INTO fund_companies (company_name, ticker, allocation_percent, holding_value)
      VALUES (?, ?, ?, ?)
    `);
    insertCompany.run('Layzoo Ltd.', 'LYZ', 24.2, 1420.50);
    insertCompany.run('NightBlink Ltd.', 'NBL', 20.1, 1180.20);
    insertCompany.run('Lcyflame Ltd.', 'LCY', 16.1, 945.80);
    insertCompany.run('Feelopie Services Ltd.', 'FLP', 13.9, 820.00);
    insertCompany.run('Grofler Ltd.', 'GRF', 11.6, 685.40);

    // Seed Fund Managers matching reference specification
    const insertManager = db.prepare(`
      INSERT INTO fund_managers (id, name, role, avatar, scheme_name, aum, rating, three_year_return, experience)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertManager.run('mgr_1', 'Kevin Black', 'Fund Manager', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Alpha Growth Opportunity Scheme', '$1.2B AUM', 4.9, 24.6, '14 yrs exp');
    insertManager.run('mgr_2', 'Sarah Jenkins', 'Senior Portfolio Manager', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 'Horizon Bluechip Innovation Scheme', '$950M AUM', 4.8, 22.1, '11 yrs exp');
    insertManager.run('mgr_3', 'David Chen', 'Quantitative Lead', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Apex Global Macro Strategies', '$1.8B AUM', 5.0, 28.4, '16 yrs exp');
    insertManager.run('mgr_4', 'Elena Rostova', 'Director of Equities', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Clean Planet & Emerging Tech Scheme', '$740M AUM', 4.7, 19.8, '9 yrs exp');
  } else {
    // Ensure default user has name set if seeded before
    db.prepare("UPDATE users SET name = 'Alex Morgan' WHERE name IS NULL OR name = ''").run();
  }
}
