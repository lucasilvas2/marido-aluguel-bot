-- Script para atualizar o tipo do usuário "Trabalhador Silva" para PROFISSIONAL
-- Execute este script no seu banco de dados MySQL

-- Opção 1: Atualizar usando string "PROFESSIONAL"
UPDATE `marido_aluguel`.`User`
SET `userType` = 'PROFESSIONAL'
WHERE `phone` = '558487631700';

-- Opção 2: Atualizar usando número "2"
-- UPDATE `marido_aluguel`.`User`
-- SET `userType` = '2'
-- WHERE `phone` = '558487631700';

-- Verificar o resultado
SELECT id, name, phone, userType
FROM `marido_aluguel`.`User`
WHERE `phone` = '558487631700';
