import json
import math
import os
import random
from typing import List, Dict, Tuple

JSON_PATH = "mcqs.json"

# ===================== JSON Helpers =====================

def ensure_json_array_file(path: str):
    """Create the file with an empty JSON array if it does not exist or content invalid."""
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=4)
        return
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            raise ValueError("Root not a list")
    except Exception:
        with open(path, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=4)

def load_items(path: str) -> List[Dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_items(path: str, items: List[Dict]):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=4)

def next_start_id(existing: List[Dict], fallback_last_id: int = 0) -> int:
    max_id = fallback_last_id
    for it in existing:
        try:
            if isinstance(it.get("id"), int):
                max_id = max(max_id, it["id"])
        except Exception:
            continue
    return max_id + 1

def to_schema(idx: int, category: str, question: str, options: List[str], correct_index: int) -> Dict:
    labels = ["A", "B", "C", "D"]
    return {
        "id": idx,
        "category": category,
        "question": question,
        "option_a": options[0],
        "option_b": options[1],
        "option_c": options[2],
        "option_d": options[3],
        "answer": labels[correct_index]
    }

def shuffle_with_key(options: List[str], correct_value: str) -> Tuple[List[str], int]:
    pairs = list(enumerate(options))
    random.shuffle(pairs)
    shuffled = [opt for _, opt in pairs]
    correct_idx = next(i for i, (_, opt) in enumerate(pairs) if opt == correct_value)
    return shuffled, correct_idx

def as_str(n): return str(n)

def frac_str(num: int, den: int) -> str:
    from math import gcd
    g = gcd(num, den)
    return f"{num//g}/{den//g}"

# ===================== P&C / Probability Generators =====================

def gen_perm_arrangement_books():
    n = random.randint(4, 8)
    ans = math.factorial(n)
    q = f"In how many ways can {n} distinct books be arranged on a shelf?"
    d1 = math.factorial(n-1)
    d2 = ans // n
    d3 = ans * (n-1)
    opts = [as_str(ans), as_str(d1), as_str(d2), as_str(d3)]
    opts, ci = shuffle_with_key(opts, as_str(ans))
    return "Permutation & Combination", q, opts, ci

def gen_perm_nPr():
    n = random.randint(6, 12)
    r = random.randint(2, min(5, n-1))
    ans = math.factorial(n) // math.factorial(n - r)
    q = f"How many permutations of {n} different objects taken {r} at a time are possible?"
    d1 = math.comb(n, r)
    d2 = ans // r if r > 1 else ans + n
    d3 = ans * r
    opts = [as_str(ans), as_str(d1), as_str(d2), as_str(d3)]
    opts, ci = shuffle_with_key(opts, as_str(ans))
    return "Permutation & Combination", q, opts, ci

def gen_comb_nCr():
    n = random.randint(8, 18)
    r = random.randint(2, min(6, n-2))
    ans = math.comb(n, r)
    q = f"In how many ways can {r} objects be chosen from {n} different objects?"
    d1 = math.factorial(n)//math.factorial(n-r)  # nPr
    d2 = math.comb(n, r-1)
    d3 = math.comb(n, r+1) if r+1 <= n else ans + 1
    opts = [as_str(ans), as_str(d1), as_str(d2), as_str(d3)]
    opts, ci = shuffle_with_key(opts, as_str(ans))
    return "Permutation & Combination", q, opts, ci

def gen_circular_perm():
    n = random.randint(5, 9)
    ans = math.factorial(n-1)
    q = f"In how many distinct ways can {n} distinct people sit around a round table? (Rotations same.)"
    d1 = math.factorial(n)
    d2 = math.factorial(n-2)
    d3 = (math.factorial(n-1)*n)//2
    opts = [as_str(ans), as_str(d1), as_str(d2), as_str(d3)]
    opts, ci = shuffle_with_key(opts, as_str(ans))
    return "Permutation & Combination", q, opts, ci

def gen_word_perm_repeats():
    words = [
        ("LEVEL", {"L":2, "E":2, "V":1}),
        ("BALLOON", {"B":1, "A":1, "L":2, "O":2, "N":1}),
        ("SUCCESS", {"S":3, "U":1, "C":2, "E":1}),
        ("MISSISSIPPI", {"M":1, "I":4, "S":4, "P":2}),
    ]
    word, counts = random.choice(words)
    total = sum(counts.values())
    denom = 1
    for c in counts.values(): denom *= math.factorial(c)
    ans = math.factorial(total) // denom
    q = f"In how many distinct arrangements can the letters of '{word}' be written?"
    d1 = max(1, ans - random.randint(10, total*10))
    d2 = math.factorial(total-1) // max(1, denom)
    d3 = ans + random.randint(5, total*5)
    opts = [as_str(ans), as_str(d1), as_str(d2), as_str(d3)]
    opts, ci = shuffle_with_key(opts, as_str(ans))
    return "Permutation & Combination", q, opts, ci

def gen_probability_die():
    event = random.choice([
        ("an even number", 3),
        ("a number greater than 3", 3),
        ("a prime number", 3),   # 2,3,5
        ("a multiple of 3", 2),  # 3,6
    ])
    fav, tot = event[1], 6
    ans = frac_str(fav, tot)
    q = f"A fair six-faced die is rolled once. What is the probability of getting {event[0]}?"
    distractors = {frac_str(max(1, fav-1), tot), frac_str(min(tot, fav+1), tot), frac_str(tot-fav, tot)}
    opts = [ans] + list(distractors)
    random.shuffle(opts)
    ci = opts.index(ans)
    return "Probability", q, opts, ci

def gen_probability_cards_suit():
    suit = random.choice(["hearts", "diamonds", "clubs", "spades"])
    ans = frac_str(13, 52)  # 1/4
    q = f"A single card is drawn from a 52-card deck. What is the probability that it is a card of {suit}?"
    distractors = [frac_str(12, 52), frac_str(1, 3), frac_str(14, 52)]
    opts = [ans] + distractors
    random.shuffle(opts)
    ci = opts.index(ans)
    return "Probability", q, opts, ci

PC_POOL = [
    gen_perm_arrangement_books,
    gen_perm_nPr,
    gen_comb_nCr,
    gen_circular_perm,
    gen_word_perm_repeats,
    gen_probability_die,
    gen_probability_cards_suit,
]

# ===================== Programming MCQ Pools =====================

def prog_pool_oop() -> List[Tuple[str, str, List[str], int]]:
    items = []
    def add(q, opts, correct):
        opts, ci = shuffle_with_key(opts, correct)
        items.append(("Programming — OOP", q, opts, ci))

    add(
        "Which OOP principle allows using a parent class reference to refer to a child class object at runtime?",
        ["Polymorphism", "Encapsulation", "Abstraction", "Inheritance"],
        "Polymorphism"
    )
    add(
        "Hiding internal data and exposing only necessary interfaces describes which concept?",
        ["Encapsulation", "Polymorphism", "Composition", "Coupling"],
        "Encapsulation"
    )
    add(
        "What is the 'is-a' relationship best modeled by?",
        ["Inheritance", "Composition", "Aggregation", "Association"],
        "Inheritance"
    )
    add(
        "Which principle focuses on exposing only essential features while hiding details?",
        ["Abstraction", "Encapsulation", "Polymorphism", "Overloading"],
        "Abstraction"
    )
    add(
        "Favoring object composition over class inheritance helps mainly to:",
        ["Reduce tight coupling", "Increase memory usage", "Enforce single inheritance", "Disable polymorphism"],
        "Reduce tight coupling"
    )
    return items

def prog_pool_dsa() -> List[Tuple[str, str, List[str], int]]:
    items = []
    def add(q, opts, correct):
        opts, ci = shuffle_with_key(opts, correct)
        items.append(("Programming — Data Structures", q, opts, ci))

    add(
        "What is the time complexity of binary search on a sorted array?",
        ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
        "O(log n)"
    )
    add(
        "Which data structure is best for implementing a BFS traversal?",
        ["Queue", "Stack", "Priority Queue", "Deque"],
        "Queue"
    )
    add(
        "In a min-heap, the smallest element is located at the:",
        ["Root", "Leftmost leaf", "Rightmost leaf", "Any leaf"],
        "Root"
    )
    add(
        "Which traversal of a BST yields sorted keys?",
        ["Inorder", "Preorder", "Postorder", "Level-order"],
        "Inorder"
    )
    add(
        "Hash table average-case time complexity for search is:",
        ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        "O(1)"
    )
    return items

def prog_pool_python() -> List[Tuple[str, str, List[str], int]]:
    items = []
    def add(q, opts, correct):
        opts, ci = shuffle_with_key(opts, correct)
        items.append(("Programming — Python Basics", q, opts, ci))

    add(
        "What is the output of: print(type([]))?",
        ["<class 'list'>", "<class 'tuple'>", "<class 'dict'>", "<class 'set'>"],
        "<class 'list'>"
    )
    add(
        "Which keyword is used to define a function in Python?",
        ["def", "fun", "function", "lambda"],
        "def"
    )
    add(
        "What does list comprehension [x*x for x in range(3)] produce?",
        ["[0, 1, 4]", "[1, 4, 9]", "(0, 1, 4)", "{0, 1, 4}"],
        "[0, 1, 4]"
    )
    add(
        "Which of these is immutable in Python?",
        ["tuple", "list", "dict", "set"],
        "tuple"
    )
    add(
        "Which opens a file for reading (text mode) creating error if missing?",
        ["open('f.txt', 'r')", "open('f.txt', 'w')", "open('f.txt', 'a')", "open('f.txt', 'x')"],
        "open('f.txt', 'r')"
    )
    return items

# ===================== Orchestration =====================

def generate_pc_questions(num: int):
    out = []
    for _ in range(num):
        g = random.choice(PC_POOL)
        out.append(g())
    return out

def generate_programming_questions(oop: int = 5, dsa: int = 5, py: int = 5):
    """Sample from fixed pools; if requested more than available, we cycle."""
    pools = [
        prog_pool_oop(),
        prog_pool_dsa(),
        prog_pool_python(),
    ]
    wants = [("Programming — OOP", oop), ("Programming — Data Structures", dsa), ("Programming — Python Basics", py)]
    result = []
    for pool, (cat, need) in zip(pools, wants):
        if not pool:
            continue
        i = 0
        while i < need:
            item = pool[i % len(pool)]
            # Rebuild tuple to avoid aliasing
            result.append((item[0], item[1], item[2], item[3]))
            i += 1
    return result

def append_questions_to_json(
    path: str = JSON_PATH,
    pc_count: int = 20,
    oop_count: int = 6,
    dsa_count: int = 6,
    py_count: int = 6,
    fallback_last_id: int = 565
):
    ensure_json_array_file(path)
    existing = load_items(path)
    start_id = next_start_id(existing, fallback_last_id=fallback_last_id)

    generated = []
    generated += generate_pc_questions(pc_count)
    generated += generate_programming_questions(oop=oop_count, dsa=dsa_count, py=py_count)

    new_items = []
    cur_id = start_id
    for category, question, options, correct_idx in generated:
        options = [str(o) for o in options][:4]
        while len(options) < 4:
            options.append(str(random.randint(1, 100)))
        item = to_schema(cur_id, category, question, options, correct_idx)
        new_items.append(item)
        cur_id += 1

    all_items = existing + new_items
    save_items(path, all_items)
    return new_items

# ===================== Run =====================

if __name__ == "__main__":
    added = append_questions_to_json(
        JSON_PATH,
        pc_count=24,        # more P&C / Probability
        oop_count=8,        # OOP MCQs
        dsa_count=8,        # Data Structures MCQs
        py_count=8,         # Basic Python MCQs
        fallback_last_id=565
    )
    print(f"Appended {len(added)} questions to {JSON_PATH}.")
    for it in added[:5]:
        print(f"\nID {it['id']} | {it['category']}\nQ: {it['question']}\n"
              f"A) {it['option_a']}  B) {it['option_b']}  C) {it['option_c']}  D) {it['option_d']}\n"
              f"Answer: {it['answer']}")
