#!/bin/bash

# Script pour mettre à jour le seed XRPL dans .env

SEED="sEd7D9xhHkVVLX3CYhZCZxHe3gnGwxj"
ADDRESS="r3nGEA15EdN2s3awmWzLpVxAAP9yDZu5Hk"

echo "🔧 Mise à jour de la configuration XRPL dans .env..."

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé. Création..."
    touch .env
fi

# Mettre à jour ou ajouter XRPL_PLATFORM_SECRET
if grep -q "XRPL_PLATFORM_SECRET" .env; then
    # Remplacer la ligne existante
    sed -i.bak "s|XRPL_PLATFORM_SECRET=.*|XRPL_PLATFORM_SECRET=$SEED|" .env
    echo "✅ XRPL_PLATFORM_SECRET mis à jour"
else
    # Ajouter la ligne
    echo "" >> .env
    echo "# XRPL Platform Wallet" >> .env
    echo "XRPL_PLATFORM_SECRET=$SEED" >> .env
    echo "✅ XRPL_PLATFORM_SECRET ajouté"
fi

# Mettre à jour ou ajouter XRPL_PLATFORM_ADDRESS
if grep -q "XRPL_PLATFORM_ADDRESS" .env; then
    # Remplacer la ligne existante
    sed -i.bak "s|XRPL_PLATFORM_ADDRESS=.*|XRPL_PLATFORM_ADDRESS=$ADDRESS|" .env
    echo "✅ XRPL_PLATFORM_ADDRESS mis à jour"
else
    # Ajouter la ligne
    echo "XRPL_PLATFORM_ADDRESS=$ADDRESS" >> .env
    echo "✅ XRPL_PLATFORM_ADDRESS ajouté"
fi

# Nettoyer le fichier de backup (sur macOS)
if [ -f .env.bak ]; then
    rm .env.bak
fi

echo ""
echo "✅ Configuration XRPL mise à jour avec succès !"
echo ""
echo "📝 Détails:"
echo "   Adresse: $ADDRESS"
echo "   Solde: 100 XRP (testnet)"
echo ""
echo "🔄 Redémarrez le backend pour appliquer les changements"

