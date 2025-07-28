-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: stock_control
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_log_empresa` (`empresa_id`),
  KEY `idx_log_user` (`user_id`),
  KEY `idx_log_product` (`product_id`),
  KEY `idx_log_action` (`action`),
  KEY `idx_log_created` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_activity_logs_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_logs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (34,1,2,'Iago Henrique ',NULL,'EDITOU_PRODUTO',NULL,NULL,'2025-07-06 19:25:06','Localização: Excesso | Antes: 1034 | Depois: 10340'),(35,1,2,'Iago Henrique ',NULL,'EDITOU_PRODUTO',NULL,NULL,'2025-07-06 19:37:00','Localização: Excesso | Antes: 10340 | Depois: 10344'),(36,1,2,'Iago Henrique ',NULL,'CRIOU_PRODUTO',NULL,NULL,'2025-07-06 19:49:06','Produto: P1C - 4MRC (ID: 33) criado com 1 localizações.'),(37,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-06 20:24:28','Produto ID: 32 removido.'),(38,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOGO',NULL,NULL,'2025-07-09 23:04:38','{\"empresaId\":1}'),(47,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOCALIZACOES',NULL,NULL,'2025-07-10 00:37:45','{\"localizacoesAntigas\":1,\"localizacoesNovas\":2,\"localizacoes\":[\"Excesso\",\"Teste\"]}'),(48,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOCALIZACOES',NULL,NULL,'2025-07-10 00:51:20','{\"localizacoesAntigas\":2,\"localizacoesNovas\":1,\"localizacoes\":[\"Excesso\"]}'),(49,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOCALIZACOES',NULL,NULL,'2025-07-10 00:51:37','{\"localizacoesAntigas\":1,\"localizacoesNovas\":2,\"localizacoes\":[\"Excesso\",\"xz\\\\x\\\\z\"]}'),(50,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOCALIZACOES',NULL,NULL,'2025-07-10 00:51:44','{\"localizacoesAntigas\":2,\"localizacoesNovas\":2,\"localizacoes\":[\"Excesso\",\"xz\\\\x\\\\z\"]}'),(51,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOCALIZACOES',NULL,NULL,'2025-07-10 00:52:17','{\"localizacoesAntigas\":2,\"localizacoesNovas\":1,\"localizacoes\":[\"Excesso\"]}'),(52,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOCALIZACOES',NULL,NULL,'2025-07-14 20:32:18','{\"localizacoesAntigas\":1,\"localizacoesNovas\":2,\"localizacoes\":[\"Excesso\",\"teste\"]}'),(57,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:16:50','{\"produtoId\":\"48\"}'),(58,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:19:36','{\"produtoId\":\"47\"}'),(59,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:19:37','{\"produtoId\":\"49\"}'),(60,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:20:40','{\"produtoId\":\"50\"}'),(61,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:22:37','{\"produtoId\":\"51\"}'),(62,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:22:39','{\"produtoId\":\"52\"}'),(63,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:25:07','{\"produtoId\":\"53\"}'),(64,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:31:27','{\"produtoId\":\"54\"}'),(65,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:33:41','{\"produtoId\":\"55\"}'),(66,1,2,'Iago Henrique ',NULL,'APAGOU_PRODUTO',NULL,NULL,'2025-07-17 23:35:27','{\"produtoId\":\"56\"}'),(67,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOGO',NULL,NULL,'2025-07-26 17:39:50','{\"empresaId\":1}'),(68,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOGO',NULL,NULL,'2025-07-26 17:42:07','{\"empresaId\":1}'),(69,1,2,'Iago Henrique ',NULL,'ATUALIZOU_LOGO',NULL,NULL,'2025-07-26 19:27:45','{\"empresaId\":1}');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `empresa_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_empresa` (`empresa_id`,`name`),
  KEY `idx_category_empresa` (`empresa_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `empresas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responsavel` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nome_exibicao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `onboarding_completed` tinyint(1) DEFAULT 0,
  `logo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_definitions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `allow_duplicate_names` tinyint(1) DEFAULT 0,
  `notifications_enabled` tinyint(1) DEFAULT 0,
  `notification_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_empresa_nome` (`nome`),
  KEY `idx_empresa_onboarding` (`onboarding_completed`),
  KEY `idx_empresa_notifications` (`notifications_enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (1,'Pneumatica','Admin','PNEUMATICA',1,NULL,'[{\"id\":\"loc_1750661870885_9889\",\"name\":\"bcvbcvbvcb\"},{\"id\":\"loc_1750661873195_5097\",\"name\":\"cvbcvbcvb\"},{\"id\":\"loc_1750661875378_3587\",\"name\":\"cvbcvbcvb\"},{\"id\":\"loc_1750661878022_7548\",\"name\":\"cvbcvbcvbcvbcvb\"}]',0,1,'ymmmsxnxa7mnccyj@ethereal.email','/uploads/logos/1-logo-1753568865847-374085274.jpeg');
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_locations_empresa` (`empresa_id`),
  CONSTRAINT `fk_locations_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (28,1,'Excesso','2025-07-17 23:36:16','2025-07-17 23:36:16'),(31,1,'3º ANDAR','2025-07-27 11:45:26','2025-07-27 11:45:26');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_locations`
--

DROP TABLE IF EXISTS `product_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `location_id` varchar(255) DEFAULT NULL,
  `sub_location_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `sub_location` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_location_sub` (`product_id`,`location_id`,`sub_location`,`empresa_id`),
  KEY `idx_location_product` (`product_id`),
  KEY `idx_location_location` (`location_id`),
  KEY `idx_location_empresa` (`empresa_id`),
  CONSTRAINT `fk_product_locations_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_locations_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_locations_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_locations_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=173 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_locations`
--

LOCK TABLES `product_locations` WRITE;
/*!40000 ALTER TABLE `product_locations` DISABLE KEYS */;
INSERT INTO `product_locations` VALUES (170,61,1,'28',NULL,0,'','2025-07-27 16:19:58','2025-07-27 16:19:58'),(171,61,1,'31',NULL,0,'','2025-07-27 16:19:58','2025-07-27 16:19:58');
/*!40000 ALTER TABLE `product_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `min_quantity` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_url` varchar(255) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `category_id` int(10) unsigned DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT 0.00,
  `max_quantity` int(10) unsigned DEFAULT 1000,
  `supplier_id` int(10) unsigned DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_product_empresa_active` (`empresa_id`,`is_active`),
  KEY `idx_product_name` (`name`),
  KEY `idx_product_sku` (`sku`),
  KEY `idx_product_category` (`category_id`),
  KEY `idx_product_supplier` (`supplier_id`),
  KEY `idx_product_barcode` (`barcode`),
  KEY `idx_products_empresa_id` (`empresa_id`),
  KEY `idx_products_name` (`name`),
  KEY `idx_products_sku` (`sku`),
  KEY `idx_products_barcode` (`barcode`),
  KEY `idx_products_category_id` (`category_id`),
  KEY `idx_products_supplier_id` (`supplier_id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_products_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (61,1,'P1C-4NMTB',NULL,0.00,0,'2025-07-27 19:19:58','2025-07-27 19:19:58',NULL,NULL,NULL,NULL,NULL,0.00,1000,NULL,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_movements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `location_id` int(10) unsigned NOT NULL,
  `sub_location` varchar(100) DEFAULT NULL,
  `movement_type` enum('entrada','saida','transferencia','ajuste') NOT NULL,
  `quantity` int(11) NOT NULL,
  `previous_quantity` int(11) NOT NULL,
  `new_quantity` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `empresa_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_movement_product` (`product_id`),
  KEY `idx_movement_location` (`location_id`),
  KEY `idx_movement_type` (`movement_type`),
  KEY `idx_movement_empresa` (`empresa_id`),
  KEY `idx_movement_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_locations`
--

DROP TABLE IF EXISTS `sub_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sub_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `location_id` (`location_id`),
  CONSTRAINT `sub_locations_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_locations`
--

LOCK TABLES `sub_locations` WRITE;
/*!40000 ALTER TABLE `sub_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `sub_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `empresa_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_supplier_empresa` (`empresa_id`,`name`),
  KEY `idx_supplier_empresa` (`empresa_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('diretor','colaborador','jovem') DEFAULT 'colaborador',
  `created_at` datetime DEFAULT current_timestamp(),
  `profile_picture_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'Dir (Editado)','pedro','pedro@empresa.com','$2b$10$peLELFD0iCJ9/pIrakMQOOFNIUtSUajjP7Om6mSkH/CYbIEbCwzqm','jovem','2025-06-23 00:15:13',NULL),(2,1,'Iago Henrique ','IagoLogistica','iago@pneutronica.com','$2b$10$62xbLXve24emphEn9hmW1eBqb9..WnuOwhqEzEuPG.LGeXC0knmRW','diretor','2025-06-23 00:38:37',NULL),(4,1,'Diretor de Logística','admin','admin@stockctrl.com','$2b$10$PriyNzLAgoN4SXdgfoZZB.gHXI1K/hKvchf5vm1Q2Pw3HG03wPu8G','diretor','2025-07-10 01:10:18',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-27 19:12:04
