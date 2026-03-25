const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = __dirname;
const QUESTIONS_FILE = path.join(DATA_DIR, 'combined_dataset.json');
const ANSWERS_FILE = path.join(DATA_DIR, 'answers.json');

// Load questions
let questions = [];
try {
  const raw = fs.readFileSync(QUESTIONS_FILE, 'utf8');
  questions = JSON.parse(raw);
} catch (e) {
  console.error('Error loading questions:', e);
}

// GET all questions
app.get('/api/questions', (req, res) => {
  res.json(questions);
});

// POST answer
app.post('/api/submit', (req, res) => {
  const { id, selected } = req.body;

  const q = questions.find(x => x.id === id);
  if (!q) return res.status(404).json({ error: 'Question not found' });

  const correct = q.answer;
  const is_correct = selected === correct;

  const entry = {
    id,
    selected,
    correct,
    is_correct,
    ts: new Date().toISOString()
  };

  try {
    let arr = [];

    if (fs.existsSync(ANSWERS_FILE)) {
      arr = JSON.parse(fs.readFileSync(ANSWERS_FILE, 'utf8') || '[]');
    }

    arr.push(entry);
    fs.writeFileSync(ANSWERS_FILE, JSON.stringify(arr, null, 2));
  } catch (e) {
    console.error(e);
  }

  res.json({ id, selected, correct, is_correct });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});