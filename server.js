const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const bcrypt = require('bcrypt');

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
	ssl: {
		rejectUnauthorized: false,
	},
});

app.post('/api/users', async (req, res) => {
	try {
	  const { name, email, password } = req.body;
  
	  if (!name || !email || !password) {
		return res.status(400).json({ error: 'Name, email, and password are required' });
	  }
  
	  const hashedPassword = await bcrypt.hash(password, 10);
	  const result = await pool.query(
		'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
		[name, email, hashedPassword]
	  );
  
	  res.status(201).json(result.rows[0]);
	} catch (err) {
	  console.error(err.message);
	  res.status(500).json({ error: 'Database error', details: err.message });
	}
  });

  app.post('/api/registra-categoria', async (req, res) => {
	try {
	  const { name, category_type } = req.body;
  
	  if (!name || !category_type) {
		return res.status(400).json({ error: 'Name, category_type are required' });
	  }

	  const result = await pool.query(
		'INSERT INTO categories (name, category_type_id) VALUES ($1, $2)',
		[name, category_type]
	  );
  
	  res.status(201).json(result.rows[0]);
	} catch (err) {
	  console.error(err.message);
	  res.status(500).json({ error: 'Database error', details: err.message });
	}
  });

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        res.json({ message: 'Login bem-sucedido', user: user.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor', details: err.message });
    }
});

app.get('/api/despesas/:idUser', async (req, res) => {
	try {
		const { idUser } = req.params;
		console.log(`Buscando despesas para o usuário ID: ${idUser}`);

		const result = await pool.query(
			'SELECT * FROM transactions WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)',
			[idUser]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Nenhuma despesa encontrada para este usuário.' });
		}

		res.json(result.rows);
	} catch (err) {
		console.error('Erro ao buscar despesas:', err.message);
		res.status(500).json({ error: 'Erro no servidor', details: err.message });
	}
});

app.get('/api/categorias', async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM categories');
		res.json(result.rows[0]);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: 'Connection error', details: err.message });
	}
});

app.get('/api/test-connection', async (req, res) => {
	try {
		const result = await pool.query('SELECT NOW()');
		res.json(result.rows[0]);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: 'Connection error', details: err.message });
	}
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
