-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: bacteriadb
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bancada`
--

DROP TABLE IF EXISTS `bancada`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bancada` (
  `id` int NOT NULL,
  `isolado_id` int NOT NULL,
  `morfologia` varchar(100) DEFAULT NULL,
  `nome_lbmg` varchar(6) DEFAULT NULL,
  `cepa` varchar(20) DEFAULT NULL,
  `coloracao_gram` tinyint(1) DEFAULT NULL,
  `consistencia` varchar(20) DEFAULT NULL,
  `elevacao` varchar(20) DEFAULT NULL,
  `textura` varchar(20) DEFAULT NULL,
  `cor` varchar(20) DEFAULT NULL,
  `brilho` tinyint(1) DEFAULT NULL,
  `transparencia` varchar(50) DEFAULT NULL,
  `borda` varchar(20) DEFAULT NULL,
  `forma` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_bancada_isolado1_idx` (`isolado_id`),
  CONSTRAINT `fk_bancada_isolado1` FOREIGN KEY (`isolado_id`) REFERENCES `isolado` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bancada`
--

LOCK TABLES `bancada` WRITE;
/*!40000 ALTER TABLE `bancada` DISABLE KEYS */;
INSERT INTO `bancada` VALUES (1,1,'grande','BD5','BY6',1,'suave','plana','lisa','laranja',1,'opaca','inteira','circular'),(2,2,'pequena','BD6','BY7',0,'áspera','plana','rugosa','branco',1,'translúcida','ondulada','irregular'),(3,3,'média','BD7','BY8',1,'mucoide','convexa','lisa','amarelo',0,'opaca','lobulada','circular'),(4,4,'grande','BD8','BY9',0,'seca','elevada','áspera','creme',1,'transparente','irregular','filamentosa'),(5,5,'pequena','BD9','BY10',1,'úmida','umbonada','lisa','rosa',1,'opaca','inteira','espiralada');
/*!40000 ALTER TABLE `bancada` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bioinformatica`
--

DROP TABLE IF EXISTS `bioinformatica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bioinformatica` (
  `id` int NOT NULL,
  `isolado_id` int NOT NULL,
  `pangenoma` varchar(50) DEFAULT NULL,
  `antismash` varchar(50) DEFAULT NULL,
  `ddh` varchar(50) DEFAULT NULL,
  `ggdc` varchar(50) DEFAULT NULL,
  `biosurfdb` varchar(50) DEFAULT NULL,
  `ani` varchar(50) DEFAULT NULL,
  `ident_tygs` varchar(50) DEFAULT NULL,
  `ident_shotgun` varchar(50) DEFAULT NULL,
  `ident_16s` varchar(50) DEFAULT NULL,
  `sintenia` varchar(50) DEFAULT NULL,
  `genoma_circular` varchar(50) DEFAULT NULL,
  `patogenicidade` varchar(50) DEFAULT NULL,
  `arvore_filogenetica` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_bioinformatica_isolado1_idx` (`isolado_id`),
  CONSTRAINT `fk_bioinformatica_isolado1` FOREIGN KEY (`isolado_id`) REFERENCES `isolado` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bioinformatica`
--

LOCK TABLES `bioinformatica` WRITE;
/*!40000 ALTER TABLE `bioinformatica` DISABLE KEYS */;
INSERT INTO `bioinformatica` VALUES (2,2,'3.450 ortólogos e 1.200 genes únicos','NRPS, PKS-I, PKS-II, terpene e sideróforo','83.2% (GBDP)','85.7% (GGDC fórmula 2)','Surfactina e fengicina presentes','98.7%','Streptomyces griseus NBRC 13350','Streptomyces sp. GCF_000931635.1','S. griseus (16S 99.3%)','Sintenia com S. coelicolor','Genoma circular único','Sem patogenicidade detectada','Clado Streptomycetaceae'),(3,3,'2.980 genes core, 540 exclusivos','NRPS, bacteriocina, terpeno (antiSMASH)','70.3%','72.1%','Lipopeptídeos detectados','94.5%','Bacillus velezensis FZB42','Bacillus sp. GCF_001021385.1','B. subtilis (16S 98.9%)','Sintenia com B. amyloliquefaciens','Genoma circular','Sem genes patogênicos','Relacionamento com B. subtilis'),(4,4,'4.200 genes core, variação 15%','NRPS e sideróforo em contig 4','91.0%','92.5%','Produção de lipopeptídeos','99.1%','P. fluorescens SBW25','Pseudomonas sp. GCF_000012345.1','P. fluorescens (16S 99.7%)','Sintenia com P. putida KT2440','Genoma linear fragmentado','Resistência a metais detectada','Clado Pseudomonadaceae'),(5,5,'2.150 core e 950 específicos','PKS, NRPS, RiPP e betalactona','68.5%','70.2%','Genes para surfactantes lipídicos','93.8%','Burkholderia cepacia complex','Burkholderia sp. GCF_000456789.1','B. contaminans (16S 98.5%)','Sintenia parcial com B. cepacia','Genoma com alta plasticidade','Possui genes de virulência','Clado B. contaminans');
/*!40000 ALTER TABLE `bioinformatica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consorcio`
--

DROP TABLE IF EXISTS `consorcio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consorcio` (
  `id` int NOT NULL,
  `nome` varchar(20) DEFAULT NULL,
  `amostra_origem` varchar(50) DEFAULT NULL,
  `cond_oxigenacao` varchar(20) DEFAULT NULL,
  `teste_bioquimico` varchar(20) DEFAULT NULL,
  `densidade_max` float DEFAULT NULL,
  `analise_enzimatica` varchar(50) DEFAULT NULL,
  `eficiencia_emulsificacao` varchar(20) DEFAULT NULL,
  `meio_cultura` varchar(10) DEFAULT NULL,
  `temperatura` int DEFAULT NULL,
  `resultado_dcpip` longtext,
  `tempo_dias` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consorcio`
--

LOCK TABLES `consorcio` WRITE;
/*!40000 ALTER TABLE `consorcio` DISABLE KEYS */;
INSERT INTO `consorcio` VALUES (1,'CNS-001','Manguezal - RN','Aeróbica','Oxid. glicose posit.',1.25,'Lipase, protease','65.4','BHI',30,'Decolorido em 48h',7),(2,'CNS-002','Raiz de cana - PE','Microaerofílica','Ferment. de lactose',0.98,'Amilase','54.2','Ágar TSA',28,'Parcial após 72h',10),(3,'CNS-003','Sedimento marinho - PR','Anaeróbica','Redução de nitrato',1.4,'Celulase','72.1','Ágar Nutri',25,'Negativo',5),(4,'CNS-004','Fezes silvestres - BA','Aeróbica','Produção de catalase',1.1,'Protease','60.0','Ágar MacCo',37,'Decolorido em 24h',6),(5,'CNS-005','Poço artesiano - PB','Facultativa','Teste oxidase posit.',0.89,'Lipase','49.3','Ágar Sabou',35,'Leve mudança após 96h',8),(6,'TESTE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,'TESTE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `consorcio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `curva_crescimento`
--

DROP TABLE IF EXISTS `curva_crescimento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curva_crescimento` (
  `id` int NOT NULL,
  `ugcurva_id` int NOT NULL,
  `tempo_horas` int DEFAULT NULL,
  `densidade_optica` varchar(50) DEFAULT NULL,
  `tipo_substrato` varchar(50) DEFAULT NULL,
  `uexperimental_id` int NOT NULL,
  `data` date DEFAULT NULL,
  `responsavel` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_curva_crescimento_unidade_experimental1_idx` (`uexperimental_id`),
  CONSTRAINT `fk_curva_crescimento_unidade_experimental1` FOREIGN KEY (`uexperimental_id`) REFERENCES `unidade_experimental` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curva_crescimento`
--

LOCK TABLES `curva_crescimento` WRITE;
/*!40000 ALTER TABLE `curva_crescimento` DISABLE KEYS */;
INSERT INTO `curva_crescimento` VALUES (1,1,0,'0.05','Glicose 1%',1,'2025-06-10','Ana Souza'),(2,1,4,'0.22','Glicose 1%',1,'2025-06-10','Ana Souza'),(3,2,0,'0.07','Glicerol 0.5%',2,'2025-06-11','Carlos Melo'),(4,2,6,'0.35','Glicerol 0.5%',2,'2025-06-11','Carlos Melo'),(5,3,8,'0.78','Óleo Diesel 2%',3,'2025-06-12','Mariana Lima');
/*!40000 ALTER TABLE `curva_crescimento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `informacoes_deposito`
--

DROP TABLE IF EXISTS `informacoes_deposito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `informacoes_deposito` (
  `acession_ncbi` varchar(50) NOT NULL,
  `isolado_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo_amostra` varchar(100) DEFAULT NULL,
  `local_coleta` varchar(100) DEFAULT NULL,
  `data_coleta` date DEFAULT NULL,
  `data_isolamento` date DEFAULT NULL,
  `cobertura` int DEFAULT NULL,
  `tecnologia` varchar(50) DEFAULT NULL,
  `metodo_montagem` varchar(50) DEFAULT NULL,
  `data_montagem` date DEFAULT NULL,
  `versao_genoma` varchar(45) DEFAULT NULL,
  `responsavel_ncbi` varchar(50) DEFAULT NULL,
  `identificacao_taxonomia` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`acession_ncbi`,`isolado_id`),
  UNIQUE KEY `acession_ncbi_UNIQUE` (`acession_ncbi`),
  KEY `fk_informacoes_deposito_usuario1_idx` (`usuario_id`),
  KEY `fk_informacoes_deposito_isolado1_idx` (`isolado_id`),
  CONSTRAINT `fk_informacoes_deposito_isolado1` FOREIGN KEY (`isolado_id`) REFERENCES `isolado` (`id`),
  CONSTRAINT `fk_informacoes_deposito_usuario1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `informacoes_deposito`
--

LOCK TABLES `informacoes_deposito` WRITE;
/*!40000 ALTER TABLE `informacoes_deposito` DISABLE KEYS */;
INSERT INTO `informacoes_deposito` VALUES ('123',1,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('GCA_001000111.1',1,1,'Solo','Manguezal - RN','2024-03-12','2024-03-15',120,'Illumina MiSeq','SPAdes','2024-03-20','v1.0','Ana Souza','Dermacoccus nishinomiyaensis'),('GCA_001000112.1',2,3,'Raiz vegetal','Cana-de-açúcar - PE','2024-04-02','2024-04-06',95,'Illumina NextSeq','Unicycler','2024-04-10','v1.1','Carlos Melo','Streptomyces griseus'),('GCA_001000113.1',3,2,'Sedimento marinho','Pontal do Sul - PR','2024-02-18','2024-02-22',105,'Ion Torrent','Velvet','2024-02-28','v2.0','Mariana Lima','Pseudomonas fluorescens'),('GCA_001000114.1',4,4,'Fezes animal','Reserva Ecológica - BA','2024-01-30','2024-02-03',80,'Illumina HiSeq','SPAdes','2024-02-08','v1.0','João Silva','Escherichia coli'),('GCA_001000115.1',5,5,'Água','Poço artesiano - PB','2024-05-10','2024-05-14',110,'Oxford Nanopore','Flye','2024-05-18','v1.2','Beatriz Alves','Burkholderia contaminans');
/*!40000 ALTER TABLE `informacoes_deposito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `isolado`
--

DROP TABLE IF EXISTS `isolado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `isolado` (
  `id` int NOT NULL,
  `usuario_isola_id` int NOT NULL,
  `usuario_coleta_id` int NOT NULL,
  `nome` varchar(20) DEFAULT NULL,
  `meio_cultura` varchar(50) DEFAULT NULL,
  `temperatura` int DEFAULT NULL,
  `origem` varchar(50) DEFAULT NULL,
  `cond_oxigenacao` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_isolado_usuario1_idx` (`usuario_isola_id`),
  KEY `fk_isolado_usuario2_idx` (`usuario_coleta_id`),
  CONSTRAINT `fk_isolado_usuario1` FOREIGN KEY (`usuario_isola_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_isolado_usuario2` FOREIGN KEY (`usuario_coleta_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `isolado`
--

LOCK TABLES `isolado` WRITE;
/*!40000 ALTER TABLE `isolado` DISABLE KEYS */;
INSERT INTO `isolado` VALUES (1,1,2,'ISL-001','BHI',30,'Solo de manguezal','Aeróbica'),(2,3,1,'ISL-002','Ágar Nutriente',28,'Raiz de cana-de-açúcar','Microaerofílica'),(3,2,4,'ISL-003','Ágar Sabouraud',25,'Sedimento marinho','Anaeróbica'),(4,4,5,'ISL-004','Ágar MacConkey',37,'Fezes de animal silvestre','Aeróbica'),(5,5,3,'ISL-005','Ágar TSA',35,'Água de poço artesiano','Facultativa');
/*!40000 ALTER TABLE `isolado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `isolado_composicao_consorcio`
--

DROP TABLE IF EXISTS `isolado_composicao_consorcio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `isolado_composicao_consorcio` (
  `isolado_id` int NOT NULL,
  `consorcio_id` int NOT NULL,
  PRIMARY KEY (`isolado_id`,`consorcio_id`),
  KEY `fk_isolado_has_consorcio_consorcio1_idx` (`consorcio_id`),
  KEY `fk_isolado_has_consorcio_isolado1_idx` (`isolado_id`),
  CONSTRAINT `fk_isolado_has_consorcio_consorcio1` FOREIGN KEY (`consorcio_id`) REFERENCES `consorcio` (`id`),
  CONSTRAINT `fk_isolado_has_consorcio_isolado1` FOREIGN KEY (`isolado_id`) REFERENCES `isolado` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `isolado_composicao_consorcio`
--

LOCK TABLES `isolado_composicao_consorcio` WRITE;
/*!40000 ALTER TABLE `isolado_composicao_consorcio` DISABLE KEYS */;
INSERT INTO `isolado_composicao_consorcio` VALUES (1,1),(2,1),(3,2),(4,2),(5,3);
/*!40000 ALTER TABLE `isolado_composicao_consorcio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidade_experimental`
--

DROP TABLE IF EXISTS `unidade_experimental`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidade_experimental` (
  `id` int NOT NULL,
  `isolado_id` int NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_unidade_experimental_isolado1_idx` (`isolado_id`),
  CONSTRAINT `fk_unidade_experimental_isolado1` FOREIGN KEY (`isolado_id`) REFERENCES `isolado` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidade_experimental`
--

LOCK TABLES `unidade_experimental` WRITE;
/*!40000 ALTER TABLE `unidade_experimental` DISABLE KEYS */;
INSERT INTO `unidade_experimental` VALUES (1,1,'Frasco agitado'),(2,2,'Placa de Petri'),(3,3,'Tubo de ensaio'),(4,4,'Erlenmeyer com agitação'),(5,5,'Frasco estático');
/*!40000 ALTER TABLE `unidade_experimental` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int NOT NULL,
  `email` varchar(50) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `senha` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  UNIQUE KEY `nome_UNIQUE` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'teste','Ana','123456'),(2,'carlos.melo@example.com','Carlos Melo','abcDEF456'),(3,'mariana.lima@example.com','Mariana Lima','lim@2025'),(4,'joao.silva@example.com','João Silva','joao#senha'),(5,'beatriz.alves@example.com','Beatriz Alves','btrz!789');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-01 17:26:52
