#!/bin/bash

# CV Management System - Test Script
# Este script prueba los endpoints de gestión de CV

echo "🧪 Testing CV Management System"
echo "================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# URL base del servidor
BASE_URL="http://localhost:4000"

# Obtener el primer usuario de la base de datos
echo -e "${BLUE}📋 Obteniendo usuario de prueba...${NC}"
USER_ID=$(curl -s "$BASE_URL/api/appusers" | grep -o '"id_app_user":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ Error: No se pudo obtener un usuario. Asegúrate de que el servidor esté corriendo.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Usuario encontrado: $USER_ID${NC}"
echo ""

# Test 1: Intentar obtener CV (puede no existir aún)
echo -e "${BLUE}Test 1: GET /api/users/$USER_ID/resume${NC}"
RESUME_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users/$USER_ID/resume")
HTTP_CODE=$(echo "$RESUME_RESPONSE" | tail -n1)
BODY=$(echo "$RESUME_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ CV existente encontrado${NC}"
    echo "$BODY" | jq '.'
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${YELLOW}⚠️  CV no existe aún (esperado para usuarios nuevos)${NC}"
else
    echo -e "${RED}❌ Error inesperado: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 2: Crear/Actualizar CV con todos los campos
echo -e "${BLUE}Test 2: PUT /api/users/$USER_ID/resume (crear con todos los campos)${NC}"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/users/$USER_ID/resume" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Desarrollador full-stack con 3 años de experiencia en tecnologías web modernas",
    "experience": "3 años como Full Stack Developer en TechCorp (2021-2024)",
    "courses": "React Avanzado - Udemy, Node.js Master - Platzi, TypeScript - Frontend Masters",
    "projects": "Sistema de gestión de inventario, Plataforma de e-learning, API REST para mobile app",
    "languages": "Español (Nativo), Inglés (Avanzado - C1), Francés (Intermedio - B1)",
    "references_cv": "María González - Tech Lead, TechCorp - maria@techcorp.com, +57 300 123 4567"
  }')

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ CV creado/actualizado exitosamente${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}❌ Error al crear CV: HTTP $HTTP_CODE${NC}"
    echo "$BODY"
fi
echo ""

sleep 1

# Test 3: Actualización parcial (solo algunos campos)
echo -e "${BLUE}Test 3: PUT /api/users/$USER_ID/resume (actualización parcial)${NC}"
echo -e "${YELLOW}Solo actualizando 'courses' y 'languages'${NC}"
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/users/$USER_ID/resume" \
  -H "Content-Type: application/json" \
  -d '{
    "courses": "React Avanzado - Udemy, Node.js Master - Platzi, TypeScript - Frontend Masters, Docker & Kubernetes - Udacity (NUEVO)",
    "languages": "Español (Nativo), Inglés (Avanzado - C1), Francés (Intermedio - B1), Alemán (Básico - A2) (NUEVO)"
  }')

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
BODY=$(echo "$UPDATE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ CV actualizado parcialmente${NC}"
    echo -e "${YELLOW}Nota: Solo 'courses' y 'languages' deben haber cambiado${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}❌ Error al actualizar CV: HTTP $HTTP_CODE${NC}"
    echo "$BODY"
fi
echo ""

sleep 1

# Test 4: Verificar que la actualización parcial funcionó
echo -e "${BLUE}Test 4: GET /api/users/$USER_ID/resume (verificar actualización parcial)${NC}"
VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users/$USER_ID/resume")
HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
BODY=$(echo "$VERIFY_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ CV recuperado exitosamente${NC}"
    echo "$BODY" | jq '.'
    
    # Verificar que los campos antiguos aún existen
    if echo "$BODY" | jq -e '.description' > /dev/null; then
        echo -e "${GREEN}✅ Campo 'description' preservado${NC}"
    else
        echo -e "${RED}❌ Campo 'description' fue eliminado (error)${NC}"
    fi
    
    if echo "$BODY" | jq -e '.experience' > /dev/null; then
        echo -e "${GREEN}✅ Campo 'experience' preservado${NC}"
    else
        echo -e "${RED}❌ Campo 'experience' fue eliminado (error)${NC}"
    fi
else
    echo -e "${RED}❌ Error al verificar CV: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 5: Actualizar solo un campo
echo -e "${BLUE}Test 5: PUT /api/users/$USER_ID/resume (actualizar solo 'projects')${NC}"
SINGLE_UPDATE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/users/$USER_ID/resume" \
  -H "Content-Type: application/json" \
  -d '{
    "projects": "Sistema de gestión de inventario, Plataforma de e-learning, API REST para mobile app, Dashboard de analytics en tiempo real (NUEVO)"
  }')

HTTP_CODE=$(echo "$SINGLE_UPDATE" | tail -n1)
BODY=$(echo "$SINGLE_UPDATE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Campo único actualizado${NC}"
    echo "$BODY" | jq '.projects'
else
    echo -e "${RED}❌ Error al actualizar campo único: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 6: Verificar progreso de misiones
echo -e "${BLUE}Test 6: Verificar progreso de misiones CV${NC}"
echo -e "${YELLOW}Checkeando si hay misiones CV activas para este usuario...${NC}"

# Este query necesita acceso a la base de datos, por ahora solo mostramos el mensaje
echo -e "${YELLOW}💡 Para verificar el progreso de misiones, ejecuta:${NC}"
echo -e "${YELLOW}   docker exec -it poc-postgres psql -U poc_user -d poc_db -c \"${NC}"
echo -e "${YELLOW}   SELECT m.title, ump.status, ump.progress, m.objective, m.xp_reward${NC}"
echo -e "${YELLOW}   FROM user_mission_progress ump${NC}"
echo -e "${YELLOW}   JOIN mission m ON ump.mission_id = m.mission_id${NC}"
echo -e "${YELLOW}   WHERE ump.user_id = '$USER_ID' AND m.category = 'CV';\"${NC}"
echo ""

# Resumen
echo "================================"
echo -e "${GREEN}✅ Tests completados${NC}"
echo ""
echo "📊 Resumen:"
echo "  - Creación/actualización de CV completo"
echo "  - Actualización parcial de campos específicos"
echo "  - Preservación de campos no actualizados"
echo "  - Actualización de un solo campo"
echo ""
echo "💡 Próximos pasos:"
echo "  1. Verifica el progreso de misiones en la base de datos"
echo "  2. Prueba el formulario en el frontend (http://localhost:3000)"
echo "  3. Verifica que los XP se otorguen al completar misiones CV"
echo ""
