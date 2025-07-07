# Consultas Relacionais Avançadas - Guia de Uso

## Componente de Busca Relacional Avançada

Este componente permite explorar relacionamentos complexos entre tabelas do banco de dados bacteriaDB, incluindo relacionamentos que requerem múltiplos joins.

### Funcionalidades Principais

1. **Seleção de Múltiplas Tabelas**: Adicione quantas tabelas desejar para a consulta
2. **Auto-detecção de Relacionamentos**: Encontra automaticamente os joins necessários
3. **Visualização de Caminhos**: Mostra como as tabelas se conectam
4. **Seleção de Colunas**: Escolha quais colunas mostrar de cada tabela
5. **Preview SQL**: Visualize o SQL gerado antes de executar
6. **Exportação**: Exporte resultados em CSV ou JSON

### Exemplos de Uso

#### 1. Relacionamento Isolado → Consórcio (através de tabela intermediária)

**Tabelas envolvidas:**
- `isolado`
- `isolado_composicao_consorcio` (tabela intermediária)
- `consorcio`

**Consulta gerada:**
```sql
SELECT
  isolado.id,
  isolado.nome,
  consorcio.id,
  consorcio.nome,
  consorcio.amostra_origem
FROM isolado
JOIN isolado_composicao_consorcio ON isolado.id = isolado_composicao_consorcio.isolado_id
JOIN consorcio ON isolado_composicao_consorcio.consorcio_id = consorcio.id
LIMIT 100;
```

#### 2. Relacionamento Isolado → Curva de Crescimento (através de unidade experimental)

**Tabelas envolvidas:**
- `isolado`
- `unidade_experimental` (tabela intermediária)
- `curva_crescimento`

**Consulta gerada:**
```sql
SELECT
  isolado.id,
  isolado.nome,
  unidade_experimental.tipo,
  curva_crescimento.tempo_horas,
  curva_crescimento.densidade_optica
FROM isolado
JOIN unidade_experimental ON isolado.id = unidade_experimental.isolado_id
JOIN curva_crescimento ON unidade_experimental.id = curva_crescimento.uexperimental_id
LIMIT 100;
```

#### 3. Consulta Complexa - Isolado com Informações Completas

**Tabelas envolvidas:**
- `isolado`
- `usuario` (tanto para coleta quanto para isolamento)
- `bancada`
- `bioinformatica`
- `informacoes_deposito`

**Consulta gerada:**
```sql
SELECT
  isolado.id,
  isolado.nome,
  usuario_coleta.nome as coletor,
  usuario_isola.nome as isolador,
  bancada.morfologia,
  bioinformatica.pangenoma,
  informacoes_deposito.acession_ncbi
FROM isolado
JOIN usuario as usuario_coleta ON isolado.usuario_coleta_id = usuario_coleta.id
JOIN usuario as usuario_isola ON isolado.usuario_isola_id = usuario_isola.id
JOIN bancada ON isolado.id = bancada.isolado_id
JOIN bioinformatica ON isolado.id = bioinformatica.isolado_id
JOIN informacoes_deposito ON isolado.id = informacoes_deposito.isolado_id
LIMIT 100;
```

### Como Usar

1. **Adicionar Tabelas**: 
   - Selecione uma tabela no dropdown
   - Clique em "Adicionar"
   - Repita para adicionar mais tabelas

2. **Definir Relacionamentos**:
   - Clique em "Auto-detectar" para encontrar relacionamentos automaticamente
   - Ou adicione relacionamentos manualmente

3. **Selecionar Colunas**:
   - Marque as colunas que deseja visualizar
   - Use "Selecionar Todas" ou "Limpar" para facilitar

4. **Executar Consulta**:
   - Revise o SQL gerado
   - Clique em "Executar Consulta"

### Relacionamentos Complexos no Schema

O banco bacteriaDB possui várias relações que requerem múltiplos joins:

1. **Isolado ↔ Consórcio**: 
   - `isolado` → `isolado_composicao_consorcio` → `consorcio`

2. **Isolado ↔ Curva de Crescimento**: 
   - `isolado` → `unidade_experimental` → `curva_crescimento`

3. **Usuário ↔ Múltiplas Funções**: 
   - Um usuário pode ser tanto coletor quanto isolador
   - Requer joins separados para cada função

4. **Isolado ↔ Informações Completas**: 
   - `isolado` conecta com `bancada`, `bioinformatica`, `informacoes_deposito`
   - Cada um com informações específicas

### Otimizações Implementadas

1. **Detecção Automática**: Algoritmo BFS para encontrar caminhos ótimos
2. **Prevenção de Loops**: Evita joins circulares
3. **Caching**: Reutiliza cálculos de relacionamentos
4. **Limitação de Resultados**: LIMIT automático para performance
5. **Validação**: Verifica relacionamentos antes de executar

### Dicas de Performance

1. **Limite as Tabelas**: Não adicione tabelas desnecessárias
2. **Selecione Colunas Específicas**: Evite selecionar todas as colunas
3. **Use Filtros**: Adicione WHERE clauses manualmente se necessário
4. **Monitore Resultados**: Verifique o número de registros retornados

### Troubleshooting

- **Sem Relacionamentos**: Verifique se as tabelas têm foreign keys definidas
- **SQL Incorreto**: Use o preview para verificar antes de executar
- **Performance Lenta**: Reduza o número de tabelas ou colunas
- **Resultados Vazios**: Verifique se os dados existem nas tabelas relacionadas
