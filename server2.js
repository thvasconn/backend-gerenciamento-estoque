const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3000;

// Conectar ao MongoDB
// Substitua pela sua URL real do MongoDB
const MONGODB_URI = "mongodb+srv://thvasconn:b7k9i3d8@products.umhcsz4.mongodb.net/Products?retryWrites=true&w=majority";

console.log('Conectando ao MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB com sucesso!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

const Schema = mongoose.Schema;
// Definir o schema do produto
const productSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  costPrice: { type: String, required: true },
  expirationDate: { type: String },
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
  versionKey: false // Remove o campo __v
});

// Criar o modelo
const Product = mongoose.model('Product', productSchema);

const stockMovementSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['entrada', 'saída'] 
  },
  quantity: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true }); // Adiciona createdAt e updatedAt automaticamente

// Índices para melhorar a performance de consultas
stockMovementSchema.index({ productId: 1 });
stockMovementSchema.index({ date: -1 });
stockMovementSchema.index({ type: 1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

module.exports = StockMovement;


// Rota para buscar todos os produtos
app.get('/products', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos', error);
    res.status(500).json({
      message: 'Erro ao buscar produtos',
      error: error.message
    });
  }
});


// Rota para buscar os últimos 5 movimentos
app.get('/movements', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    const movements = await StockMovement.find(query)
      .sort({ date: -1 })
      .limit(5);

    res.json(movements);
  } catch (error) {
    console.error('Erro ao buscar movimentos', error);
    res.status(500).json({
      message: 'Erro ao buscar movimentos',
      error: error.message
    });
  }
});

app.post('/movements', async (req, res) => {
  try {
    const movementData = req.body;
    const newMovement = new StockMovement(movementData);
    await newMovement.save();
    res.status(201).json(newMovement);
  } catch (error) {
    console.error('Erro ao criar movimento', error);
    res.status(500).json({
      message: 'Erro ao criar movimento',
      error: error.message
    });
  }
});

// Rota para buscar um produto específico
app.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto', error);
    res.status(500).json({
      message: 'Erro ao buscar produto',
      error: error.message
    });
  }
});

// Rota para criar um novo produto
app.post('/products', async (req, res) => {
  try {
    const productData = req.body;
    const existingProduct = await Product.findOne({ name: productData.name });
    if (existingProduct) {
      return res.status(400).json({ error: 'Nome de produto já existe' });
    }

    // Validação dos campos obrigatórios
    if (!productData.name || !productData.category) {
      return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
    }


    const newProduct = new Product({
      code: productData.code || `PD${Date.now()}`,
      name: productData.name,
      category: productData.category,
      quantity: parseInt(productData.quantity) || 0,
      minStock: parseInt(productData.minStock) || 0,
      costPrice: productData.costPrice || '0',
      expirationDate: productData.expirationDate || null,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Erro ao criar o produto', error);
    return res.status(500).json({
      message: 'Erro ao criar o produto',
      error: error.message
    });
  }
});

// Rota para atualizar um produto
app.put('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const newProductData = req.body;

    // Validação dos campos obrigatórios
    if (!newProductData.name || !newProductData.category) {
      return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
    }

    // Verificar se o produto existe
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Atualizar o produto
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        code: newProductData.code || existingProduct.code,
        name: newProductData.name,
        category: newProductData.category,
        quantity: parseInt(newProductData.quantity) || existingProduct.quantity,
        minStock: parseInt(newProductData.minStock) || existingProduct.minStock,
        costPrice: newProductData.costPrice || existingProduct.costPrice,
        expirationDate: newProductData.expirationDate || existingProduct.expirationDate,
      },
      { new: true } // Retorna o documento atualizado
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Erro ao atualizar o produto', error);
    res.status(500).json({
      message: 'Erro ao atualizar o produto',
      error: error.message
    });
  }
});

// Rota para deletar um produto
app.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // Verificar se o produto existe
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Deletar o produto
    await Product.findByIdAndDelete(productId);

    res.json({
      message: 'Produto deletado com sucesso',
      product: existingProduct
    });
  } catch (error) {
    console.error('Erro ao deletar o produto', error);
    res.status(500).json({
      message: 'Erro ao deletar o produto',
      error: error.message
    });
  }
});






// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Lidar com o encerramento do servidor
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Conexão com o MongoDB encerrada');
  process.exit(0);
});