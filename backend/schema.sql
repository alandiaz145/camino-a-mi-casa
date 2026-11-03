CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS movements (id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('in','out')), amount INTEGER NOT NULL CHECK(amount>0), concept TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0 CHECK(price>=0), cost INTEGER NOT NULL DEFAULT 0 CHECK(cost>=0), visible INTEGER NOT NULL DEFAULT 1 CHECK(visible IN (0,1)), sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS missions (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'General', status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','doing','done')), due_date TEXT, public INTEGER NOT NULL DEFAULT 0 CHECK(public IN (0,1)), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO settings(key,value) VALUES ('goal','80000000'),('months','36');
INSERT OR IGNORE INTO products(id,name,price,cost,visible,sort_order) VALUES
('flyer','Flyer',50000,0,1,1),('web','Página web',350000,0,1,2),
('class','Clase de producción',0,0,1,3),('stickers','Stickers / vinilo',0,0,1,4),
('music','Producción musical',0,0,1,5),('flp','Proyecto Dubstep (FLP / stems)',0,0,1,6),
('samples','Sample Pack Dubstep',0,0,1,7);
