const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client');
const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())
const PORT = 3000

app.get('/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        console.error('Erro ao buscar produtos', error);
        res.status(500).json({
            message: 'Erro ao buscar produtos',
            error: error.message
        });
    }
});

app.get('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

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

app.post('/products', async (req, res) => {
    try {
        const productData = req.body;

        // Validação dos campos obrigatórios (sem verificar ID)
        if (!productData.name || !productData.category) {
            return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
        }

        const newProduct = await prisma.product.create({
            data: {
                code: productData.code || `PD${Date.now()}`,
                name: productData.name,
                category: productData.category,
                quantity: parseInt(productData.quantity) || 0,
                minStock: parseInt(productData.minStock) || 0,
                costPrice: productData.costPrice || '0',
                expirationDate: productData.expirationDate || null,
            }
        });

        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Erro ao criar o produto', error);
        return res.status(500).json({
            message: 'Erro ao criar o produto',
            error: error.message
        });
    }
});

app.put('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const newProductData = req.body;

        // Validação dos campos obrigatórios
        if (!newProductData.name || !newProductData.category) {
            return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
        }

        // Verificar se o produto existe
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!existingProduct) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        // Atualizar o produto
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                code: newProductData.code || existingProduct.code,
                name: newProductData.name,
                category: newProductData.category,
                quantity: parseInt(newProductData.quantity) || existingProduct.quantity,
                minStock: parseInt(newProductData.minStock) || existingProduct.minStock,
                costPrice: newProductData.costPrice || existingProduct.costPrice,
                expirationDate: newProductData.expirationDate || existingProduct.expirationDate,
            }
        });

        res.json(updatedProduct);
    } catch (error) {
        console.error('Erro ao atualizar o produto', error);
        res.status(500).json({
            message: 'Erro ao atualizar o produto',
            error: error.message
        });
    }
});

app.delete('/products/:id', async (req, res) => {
    try {           
        const productId = req.params.id;

        // Verificar se o produto existe
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!existingProduct) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        // Deletar o produto
        await prisma.product.delete({
            where: { id: productId }
        });

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

