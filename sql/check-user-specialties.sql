-- Script para verificar se há especialidades cadastradas para o usuário
-- Execute este script no seu banco de dados MySQL

-- Verificar usuário
SELECT id, name, phone, userType
FROM `marido_aluguel`.`User`
WHERE phone = '558487631700';

-- Verificar especialidades cadastradas para este usuário
SELECT 
    us.userId,
    us.specialtyId,
    u.name as userName,
    s.name as specialtyName,
    us.experienceYears,
    us.pricePerHour,
    us.isCertified,
    us.notes
FROM `marido_aluguel`.`UserSpecialty` us
JOIN `marido_aluguel`.`User` u ON us.userId = u.id
JOIN `marido_aluguel`.`Specialty` s ON us.specialtyId = s.id
WHERE u.phone = '558487631700';

-- Se não houver dados, inserir uma especialidade de teste
-- INSERT INTO `marido_aluguel`.`UserSpecialty` (userId, specialtyId, experienceYears, pricePerHour, isCertified, notes, createdAt, updatedAt)
-- VALUES (
--     (SELECT id FROM `marido_aluguel`.`User` WHERE phone = '558487631700'),
--     1, -- ID da especialidade (ajuste conforme necessário)
--     5, -- anos de experiência
--     80.00, -- preço por hora
--     true, -- certificado
--     'Experiência em projetos residenciais e comerciais',
--     NOW(),
--     NOW()
-- );
