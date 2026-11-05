CREATE DATABASE IF NOT EXISTS financeai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE financeai;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS financial_profiles;
DROP TABLE IF EXISTS otp_verifications;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

SOURCE C:/Users/Admin/ai-finance-tax-loan-assistant/database/schema.sql;
