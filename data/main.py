import os
import glob
import csv
import json
import sqlite3
from pathlib import Path

# === CONFIG ===
FOLDER = "./"  # folder with your CSVs
DB_PATH = "aptitude.db"
TABLE = "questions"
OUTPUT_JSON = "combined_dataset.json"

# Columns we care about, in order
EXPECTED_COLS = ["question", "option_a", "option_b", "option_c", "option_d", "answer"]

def normalize_header(cols):
    norm = []
    for c in cols:
        c = c.strip().lower().replace(" ", "_")
        c = c.replace("-", "_")
        norm.append(c)
    return norm

def coerce_record(rec):
    """Keep only EXPECTED_COLS; fill missing with empty string; tidy values."""
    out = {}
    for col in EXPECTED_COLS:
        v = rec.get(col, "")
        if v is None:
            v = ""
        if isinstance(v, str):
            v = v.strip()
        out[col] = v
    # Normalize answer for MCQs like 'a' -> 'A'
    if out["answer"] and isinstance(out["answer"], str):
        out["answer"] = out["answer"].strip().upper()
    return out

def read_any_csv(path):
    """
    Reads CSV robustly.
    Handles:
      - normal CSV (comma/semicolon/pipe/tab)
      - single-column rows where header/rows contain semicolons (your case)
    Returns list of dicts with normalized keys.
    """
    records = []

    # First, try auto delimiter sniff
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        sample = f.read(4096)
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=[",", ";", "|", "\t"])
        delim = dialect.delimiter
    except Exception:
        delim = ","

    with open(path, "r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.reader(f, delimiter=delim)
        try:
            raw_header = next(reader)
        except StopIteration:
            return []

        # If header collapsed like: ["question;option_a;option_b;option_c;option_d;answer"]
        if len(raw_header) == 1 and ";" in raw_header[0]:
            header = normalize_header(raw_header[0].split(";"))
            for row in reader:
                if not row:
                    continue
                # row may also be single-string with semicolons; split it
                if len(row) == 1 and ";" in row[0]:
                    parts = row[0].split(";")
                else:
                    parts = row
                # pad/truncate
                if len(parts) < len(header):
                    parts += [""] * (len(header) - len(parts))
                elif len(parts) > len(header):
                    parts = parts[:len(header)]
                rec = {h: (parts[i].strip() if i < len(parts) else "") for i, h in enumerate(header)}
                records.append(rec)
        else:
            # Normal-ish header; clean it
            header = normalize_header(raw_header)
            for row in reader:
                if not row:
                    continue
                # If a row is one big string with semicolons, split it
                if len(row) == 1 and ";" in row[0] and len(header) < 3:
                    # Treat as semicolon-delimited row but also split header similarly
                    header = normalize_header(header[0].split(";"))
                    parts = row[0].split(";")
                else:
                    parts = row
                # pad/truncate
                if len(parts) < len(header):
                    parts += [""] * (len(header) - len(parts))
                elif len(parts) > len(header):
                    parts = parts[:len(header)]
                rec = {h: (parts[i].strip() if i < len(parts) else "") for i, h in enumerate(header)}
                records.append(rec)

    return records

def ensure_db(conn):
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS {TABLE} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            question TEXT,
            option_a TEXT,
            option_b TEXT,
            option_c TEXT,
            option_d TEXT,
            answer TEXT
        );
    """)
    conn.commit()

def insert_records(conn, category, recs):
    cur = conn.cursor()
    for rec in recs:
        clean = coerce_record(rec)
        cur.execute(
            f"""INSERT INTO {TABLE}
                (category, question, option_a, option_b, option_c, option_d, answer)
               VALUES (?, ?, ?, ?, ?, ?, ?);""",
            (
                category,
                clean["question"], clean["option_a"], clean["option_b"],
                clean["option_c"], clean["option_d"], clean["answer"]
            )
        )
    conn.commit()

def export_json(conn, out_path):
    cur = conn.cursor()
    cur.execute(f"SELECT id, category, question, option_a, option_b, option_c, option_d, answer FROM {TABLE};")
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    data = [dict(zip(cols, r)) for r in rows]
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def guess_category_from_filename(fname):
    name = Path(fname).stem.lower()
    if "general" in name or "aptitude" in name:
        return "General Aptitude"
    if "cse" in name or "cs" in name:
        return "CSE"
    if "reason" in name or "logical" in name:
        return "Logical Reasoning"
    return "Misc"

def main():
    csv_files = glob.glob(os.path.join(FOLDER, "*.csv"))
    if not csv_files:
        print("No CSV files found.")
        return

    conn = sqlite3.connect(DB_PATH)
    ensure_db(conn)

    total_before = conn.execute(f"SELECT COUNT(*) FROM {TABLE};").fetchone()[0]

    for path in csv_files:
        category = guess_category_from_filename(path)
        recs = read_any_csv(path)
        if not recs:
            print(f"Skipped (empty): {path}")
            continue
        insert_records(conn, category, recs)
        print(f"Imported {len(recs):4d} from {os.path.basename(path)} → category='{category}'")

    total_after = conn.execute(f"SELECT COUNT(*) FROM {TABLE};").fetchone()[0]
    print(f"Total rows in DB: {total_after} (added {total_after - total_before})")

    export_json(conn, OUTPUT_JSON)
    conn.close()
    print(f"Exported JSON → {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
