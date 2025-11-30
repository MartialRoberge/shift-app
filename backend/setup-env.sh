#!/bin/bash

# Script pour créer le fichier .env avec les identifiants fournis

cat > .env << 'EOF'
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hackathon_xrp

# JWT
JWT_SECRET=hackathon-xrp-secret-key-change-in-production-2024

# AssemblyAI
ASSEMBLYAI_API_KEY=your-assemblyai-api-key-here

# LLM (OpenAI)
OPENAI_API_KEY=your-openai-api-key-here
LLM_PROVIDER=openai

# XRPL
XRPL_NETWORK=testnet
XRPL_PLATFORM_ADDRESS=your-xrpl-platform-address-here
XRPL_PLATFORM_SECRET=your-xrpl-platform-secret-here

# File Storage (local for demo, or S3)
STORAGE_TYPE=local
STORAGE_PATH=./uploads
EOF

echo "✅ Fichier .env créé avec succès !"
echo ""
echo "⚠️  IMPORTANT: Vérifiez que votre base de données PostgreSQL est configurée."
echo "   DATABASE_URL actuel: postgresql://postgres:postgres@localhost:5432/hackathon_xrp"
echo ""
echo "   Si votre config est différente, modifiez DATABASE_URL dans .env"

