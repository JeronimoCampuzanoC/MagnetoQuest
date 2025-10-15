#!/bin/bash

# Script para probar el Daily Reset Service

echo "======================================"
echo "🧪 Testing Daily Reset Service"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base del servidor
BASE_URL="http://localhost:4000"

# 1. Verificar estado del servicio
echo -e "${BLUE}1. Verificando estado del servicio...${NC}"
curl -s "$BASE_URL/api/admin/daily-reset/status" | jq '.'
echo ""
echo ""

# 2. Ver progreso actual de usuarios antes del reset
echo -e "${BLUE}2. Progreso de usuarios ANTES del reset:${NC}"
echo -e "${YELLOW}Conectando a la base de datos...${NC}"
docker exec -it poc-postgres psql -U poc_user -d poc_db -c "SELECT u.name, up.streak, up.has_done_today, up.magento_points FROM user_progress up JOIN app_user u ON u.id_app_user = up.user_id ORDER BY up.streak DESC LIMIT 10;"
echo ""
echo ""

# 3. Ejecutar reset manual
echo -e "${BLUE}3. Ejecutando reset diario manualmente...${NC}"
curl -s -X POST "$BASE_URL/api/admin/daily-reset/execute" | jq '.'
echo ""
echo ""

# 4. Ver progreso después del reset
echo -e "${BLUE}4. Progreso de usuarios DESPUÉS del reset:${NC}"
docker exec -it poc-postgres psql -U poc_user -d poc_db -c "SELECT u.name, up.streak, up.has_done_today, up.magento_points FROM user_progress up JOIN app_user u ON u.id_app_user = up.user_id ORDER BY up.streak DESC LIMIT 10;"
echo ""
echo ""

echo -e "${GREEN}✅ Test completado${NC}"
echo "======================================"
