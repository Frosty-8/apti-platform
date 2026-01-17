const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Data files
const DATA_DIR = __dirname;
const QUESTIONS_FILE = path.join(DATA_DIR, 'combined_dataset.json');
const ANSWERS_FILE = path.join(DATA_DIR, 'answers.json');

// Load questions at startup (sync)
let questions = [];
try {
  const raw = fs.readFileSync(QUESTIONS_FILE, 'utf8');
  questions = JSON.parse(raw);
  if (!Array.isArray(questions)) {
    console.error('combined_question.json must contain an array of questions');
    questions = [];
  }
} catch (e) {
  console.error('Failed to read combined_question.json', e);
}

// API: get all questions
app.get('/api/questions', (req, res) => {
  return res.json(questions);
});

// API: submit an answer
// body: { id: <number>, selected: "A"|"B"|"C"|"D", user?: "name" }
app.post('/api/submit', (req, res) => {
  const { id, selected, user = 'anonymous' } = req.body || {};

  if (typeof id === 'undefined' || typeof selected === 'undefined') {
    return res.status(400).json({ error: 'id and selected are required' });
  }

  const q = questions.find(x => x.id === id);
  if (!q) return res.status(404).json({ error: 'question not found' });

  const correct = q.answer;
  const is_correct = (selected === correct);

  const entry = {
    id,
    user,
    selected,
    correct,
    is_correct,
    ts: new Date().toISOString()
  };

  // Append to answers.json (create if missing)
  try {
    let arr = [];
    if (fs.existsSync(ANSWERS_FILE)) {
      const raw = fs.readFileSync(ANSWERS_FILE, 'utf8');
      arr = JSON.parse(raw || '[]');
      if (!Array.isArray(arr)) arr = [];
    }
    arr.push(entry);
    fs.writeFileSync(ANSWERS_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write answers.json', e);
    // non-fatal; still return response
  }

  return res.json({ id, selected, correct, is_correct });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Quiz backend listening on http://localhost:${port}`);
});
