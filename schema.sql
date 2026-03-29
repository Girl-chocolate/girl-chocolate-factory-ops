DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS batch_recipes;
DROP TABLE IF EXISTS supplements;
DROP TABLE IF EXISTS suppliers;

CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  website TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE supplements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  supplier_id TEXT REFERENCES suppliers(id),
  unit_price REAL NOT NULL DEFAULT 0,
  on_hand_kg REAL NOT NULL DEFAULT 0,
  incoming_kg REAL NOT NULL DEFAULT 0,
  low_stock_threshold REAL NOT NULL DEFAULT 0.5,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_key TEXT,
  link_url TEXT,
  doc_type TEXT DEFAULT 'file',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE purchase_orders (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES suppliers(id),
  status TEXT NOT NULL DEFAULT 'pending',
  order_date TEXT DEFAULT (datetime('now')),
  expected_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  quantity_kg REAL NOT NULL,
  unit_price REAL NOT NULL,
  received_kg REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE batch_recipes (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  dosage_per_square_g REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO suppliers (id, name, email, website) VALUES
  ('sup_huir', 'HUIR Biological', NULL, NULL),
  ('sup_nutricargo', 'NutriCargo', NULL, NULL),
  ('sup_greenjeeva', 'Green Jeeva LLC', NULL, NULL),
  ('sup_prescribed', 'Prescribed For Life', NULL, NULL);

INSERT INTO supplements (id, name, supplier_id, unit_price, on_hand_kg, incoming_kg) VALUES
  ('wx4n8bfg0', 'DIM (Diindolylmethane)', 'sup_huir', 100.00, 0.510, 0),
  ('sgaq7h7w4', 'Red Raspberry Leaf Extract Powder 4:1', 'sup_nutricargo', 38.00, 0.023, 0),
  ('fpexj8qm5', 'Ashwagandha Root Powder Extract 4:1', 'sup_greenjeeva', 40.00, 0.510, 0),
  ('c0ejkjajq', 'Black pepper extract', 'sup_prescribed', 964.30, 0.034, 0),
  ('9sxozkh7l', 'Vitamin B6 (Pyridoxal-5-phosphate)', 'sup_greenjeeva', 400.00, 0.893, 0),
  ('x5yijtem0', 'Magnesium Glycinate Powder', 'sup_greenjeeva', 28.00, 0.610, 0),
  ('ks87nbhwm', 'Chamomile Flower Extract Powder 10:1', 'sup_greenjeeva', 40.00, 0.000, 0);

INSERT INTO batch_recipes (id, supplement_id, dosage_per_square_g) VALUES
  ('br_1', 'x5yijtem0', 0.300),
  ('br_2', 'ks87nbhwm', 0.200),
  ('br_3', 'fpexj8qm5', 0.100),
  ('br_4', 'sgaq7h7w4', 0.100),
  ('br_5', 'wx4n8bfg0', 0.100),
  ('br_6', '9sxozkh7l', 0.020),
  ('br_7', 'c0ejkjajq', 0.005);
